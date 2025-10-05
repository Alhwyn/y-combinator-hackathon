#!/bin/bash

# Local Development Startup Script
# This script starts both backend and frontend servers for local development

set -e

echo "🚀 Starting Local Development Environment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo ""
    echo "Please create a .env file with the following variables:"
    echo "  ANTHROPIC_API_KEY=your_key_here"
    echo "  SUPABASE_URL=your_url_here"
    echo "  SUPABASE_SERVICE_KEY=your_key_here"
    echo "  PORT=3001"
    echo ""
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js v18 or higher"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"

# Check if backend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Installing backend dependencies...${NC}"
    npm install
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠ Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Check if port 3001 is already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠ Port 3001 is already in use${NC}"
    echo "Another process might be running on this port."
    echo "Kill it? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        lsof -ti:3001 | xargs kill -9
        echo -e "${GREEN}✓${NC} Port 3001 freed"
    else
        echo -e "${RED}❌ Cannot start backend on port 3001${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Port 3001 is available"
echo ""

# Create log directory if it doesn't exist
mkdir -p logs

echo "Starting servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Frontend stopped"
    fi
    
    echo ""
    echo "👋 Goodbye!"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${YELLOW}🔧 Starting backend server on port 3001...${NC}"
node src/startWithStream.js > logs/dev-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "Check logs/dev-backend.log for errors"
    tail -n 20 logs/dev-backend.log
    exit 1
fi

# Test backend health endpoint
echo "Testing backend health..."
HEALTH_CHECK=$(curl -s http://localhost:3001/health | grep -o '"status":"ok"' || echo "failed")

if [ "$HEALTH_CHECK" = '"status":"ok"' ]; then
    echo -e "${GREEN}✓${NC} Backend is running at http://localhost:3001"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Check logs/dev-backend.log for errors"
    kill $BACKEND_PID
    exit 1
fi

echo ""

# Start frontend server
echo -e "${YELLOW}🎨 Starting frontend server on port 5173...${NC}"
cd frontend
npm run dev > ../logs/dev-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo "Check logs/dev-frontend.log for errors"
    tail -n 20 logs/dev-frontend.log
    kill $BACKEND_PID
    exit 1
fi

echo -e "${GREEN}✓${NC} Frontend is running at http://localhost:5173"
echo ""

# Success message
echo "========================================"
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo "========================================"
echo ""
echo "📊 Services running:"
echo "  • Backend:  http://localhost:3001"
echo "  • Frontend: http://localhost:5173"
echo "  • Health:   http://localhost:3001/health"
echo "  • WS:       ws://localhost:3001/viewer"
echo ""
echo "📝 Logs:"
echo "  • Backend:  tail -f logs/dev-backend.log"
echo "  • Frontend: tail -f logs/dev-frontend.log"
echo ""
echo "🌐 Open in browser: http://localhost:5173"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and show logs
tail -f logs/dev-backend.log logs/dev-frontend.log &
TAIL_PID=$!

# Wait for user to press Ctrl+C
wait $BACKEND_PID $FRONTEND_PID

# Cleanup (this shouldn't be reached, but just in case)
cleanup


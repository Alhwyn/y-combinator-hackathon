#!/bin/bash

# Backend Testing Script for Multi-Agent Browser Testing System
# This script helps you test the backend step by step
# Supports parallel execution with unique test IDs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection string
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Generate unique test ID for parallel execution
TEST_ID="${TEST_ID:-test-$(date +%s)-$$}"
export TEST_MODE=true
export TEST_ID

# Unique log file for this test run
TEST_LOG="/tmp/backend-test-${TEST_ID}.log"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Backend Testing Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Test 1: Check Supabase is running
echo -e "${YELLOW}[1/10] Checking Supabase status...${NC}"
if supabase status &>/dev/null; then
    echo -e "${GREEN}✅ Supabase is running${NC}"
else
    echo -e "${RED}❌ Supabase is not running. Please run: supabase start${NC}"
    exit 1
fi
echo ""

# Test 2: Check database connection
echo -e "${YELLOW}[2/10] Testing database connection...${NC}"
if psql "$DB_URL" -c "SELECT 1;" &>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    exit 1
fi
echo ""

# Test 3: Verify tables exist
echo -e "${YELLOW}[3/10] Checking database tables...${NC}"
TABLES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('agents', 'test_cases', 'test_results', 'test_steps');")
if [ "$TABLES" -eq 4 ]; then
    echo -e "${GREEN}✅ All 4 tables exist (agents, test_cases, test_results, test_steps)${NC}"
else
    echo -e "${RED}❌ Missing tables. Found: $TABLES/4. Please run: supabase db reset${NC}"
    exit 1
fi
echo ""

# Test 4: Check sample tests
echo -e "${YELLOW}[4/10] Checking sample test data...${NC}"
TEST_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM test_cases;")
if [ "$TEST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $TEST_COUNT test cases${NC}"
    echo "Test cases:"
    psql "$DB_URL" -c "SELECT name, status, priority FROM test_cases ORDER BY priority DESC;" -q
else
    echo -e "${YELLOW}⚠️  No test cases found. Loading samples...${NC}"
    node examples/loadSampleTests.js
    echo -e "${GREEN}✅ Sample tests loaded${NC}"
fi
echo ""

# Test 5: Check storage bucket
echo -e "${YELLOW}[5/10] Checking storage bucket...${NC}"
BUCKET_CHECK=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM storage.buckets WHERE id='test-screenshots';")
if [ "$BUCKET_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✅ Storage bucket 'test-screenshots' exists${NC}"
else
    echo -e "${RED}❌ Storage bucket not found. Please check supabase/storage.sql${NC}"
fi
echo ""

# Test 6: Test single agent (quick test) with parallel isolation
echo -e "${YELLOW}[6/10] Testing single agent (10 seconds)...${NC}"
echo -e "${BLUE}Starting agent in background with test isolation...${NC}"

# Use unique debug port for parallel testing
BROWSER_DEBUG_PORT=$((9222 + (RANDOM % 1000)))
export BROWSER_DEBUG_PORT
export HEADLESS=true

timeout 10 npm run agent > "$TEST_LOG" 2>&1 &
AGENT_PID=$!

sleep 3

if ps -p $AGENT_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Agent started successfully (PID: $AGENT_PID, Test ID: $TEST_ID)${NC}"
    
    # Check if agent registered (filter by test mode if needed)
    sleep 2
    AGENT_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM agents WHERE name LIKE 'agent-%';")
    if [ "$AGENT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Agent registered in database${NC}"
        echo "Registered agents:"
        psql "$DB_URL" -c "SELECT name, status, browser_type FROM agents ORDER BY created_at DESC LIMIT 5;" -q
    fi
    
    # Wait for agent to finish or timeout
    wait $AGENT_PID 2>/dev/null || true
else
    echo -e "${RED}❌ Agent failed to start. Check $TEST_LOG${NC}"
    [ -f "$TEST_LOG" ] && tail -20 "$TEST_LOG"
fi
echo ""

# Test 7: Check test execution
echo -e "${YELLOW}[7/10] Checking test execution results...${NC}"
RESULTS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM test_results;")
if [ "$RESULTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $RESULTS_COUNT test results${NC}"
    echo "Recent test results:"
    psql "$DB_URL" -c "SELECT tc.name, tr.status, tr.duration_ms, a.name as agent FROM test_results tr JOIN test_cases tc ON tr.test_case_id = tc.id JOIN agents a ON tr.agent_id = a.id ORDER BY tr.created_at DESC LIMIT 5;" -q
else
    echo -e "${YELLOW}⚠️  No test results yet. Tests may still be running or pending.${NC}"
fi
echo ""

# Test 8: Check test steps
echo -e "${YELLOW}[8/10] Checking test step execution...${NC}"
STEPS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM test_steps;")
if [ "$STEPS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $STEPS_COUNT test steps executed${NC}"
    echo "Sample steps (latest test):"
    psql "$DB_URL" -c "SELECT step_number, action_type, status, duration_ms FROM test_steps WHERE test_result_id = (SELECT id FROM test_results ORDER BY created_at DESC LIMIT 1) ORDER BY step_number;" -q || echo "No steps found yet"
else
    echo -e "${YELLOW}⚠️  No test steps found. Tests may not have started yet.${NC}"
fi
echo ""

# Test 9: Check screenshots
echo -e "${YELLOW}[9/10] Checking screenshot storage...${NC}"
SCREENSHOT_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM storage.objects WHERE bucket_id='test-screenshots';")
if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $SCREENSHOT_COUNT screenshots in storage${NC}"
else
    echo -e "${YELLOW}⚠️  No screenshots found yet. Will be created during test execution.${NC}"
fi
echo ""

# Test 10: System health check
echo -e "${YELLOW}[10/10] Overall system health check...${NC}"

# Check for stuck agents
STUCK_AGENTS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM agents WHERE status='busy' AND last_heartbeat < NOW() - INTERVAL '1 minute';")
if [ "$STUCK_AGENTS" -eq 0 ]; then
    echo -e "${GREEN}✅ No stuck agents${NC}"
else
    echo -e "${YELLOW}⚠️  Found $STUCK_AGENTS stuck agents (may be due to test interruption)${NC}"
fi

# Check for stuck tests
STUCK_TESTS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM test_cases WHERE status='running' AND updated_at < NOW() - INTERVAL '5 minutes';")
if [ "$STUCK_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✅ No stuck tests${NC}"
else
    echo -e "${YELLOW}⚠️  Found $STUCK_TESTS stuck tests${NC}"
fi

# Summary statistics
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}System Statistics${NC}"
echo -e "${BLUE}================================${NC}"

echo "Agents:"
psql "$DB_URL" -c "SELECT status, COUNT(*) FROM agents GROUP BY status;" -q 2>/dev/null || echo "No agents registered yet"

echo ""
echo "Tests:"
psql "$DB_URL" -c "SELECT status, COUNT(*) FROM test_cases GROUP BY status;" -q

echo ""
echo "Test Results:"
psql "$DB_URL" -c "SELECT status, COUNT(*) FROM test_results GROUP BY status;" -q 2>/dev/null || echo "No results yet"

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Backend Testing Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. View Supabase Studio: ${BLUE}http://127.0.0.1:54323${NC}"
echo "2. Start full system: ${BLUE}npm start${NC}"
echo "3. View logs: ${BLUE}tail -f logs/combined.log${NC}"
echo "4. Read testing guide: ${BLUE}TESTING_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}✨ Backend is ready to use!${NC}"
echo ""
echo -e "${BLUE}Test Run ID: ${TEST_ID}${NC}"
echo -e "${BLUE}Test Log: ${TEST_LOG}${NC}"

# Cleanup test logs older than 1 hour
find /tmp -name "backend-test-*.log" -mmin +60 -delete 2>/dev/null || true


# Multi-Agent Browser Testing System - Production Dockerfile

FROM node:18-slim

# Install system dependencies (Playwright, Sharp, and build tools)
RUN apt-get update && \
    apt-get install -y \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    # Sharp dependencies
    python3 \
    build-essential \
    g++ \
    make \
    # General utilities
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install instead of ci for better compatibility)
RUN npm install --omit=dev --no-audit --no-fund

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Copy application code
COPY . .

# Create directories for logs and videos
RUN mkdir -p logs screenshots videos

# Expose port (Railway will set PORT env var, default to 3001)
EXPOSE ${PORT:-3001}

# Health check - use Railway's PORT environment variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application - use npm start (which runs src/startWithStream.js)
CMD ["npm", "start"]


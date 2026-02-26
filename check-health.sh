#!/bin/bash

# Web3 Casino Platform - Health Check Script
# Verifies that all services are running correctly

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Web3 Casino Platform - Health Check ===${NC}\n"

# Function to check if port is responding
check_service() {
    local port=$1
    local name=$2
    local url=$3
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ $name${NC} (Port $port) - Running"
        return 0
    else
        echo -e "${RED}✗ $name${NC} (Port $port) - Not responding"
        return 1
    fi
}

# Function to check process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo -e "${GREEN}✓ Process: $1${NC}"
        return 0
    else
        echo -e "${RED}✗ Process: $1 not found${NC}"
        return 1
    fi
}

echo -e "${BLUE}Backend Services:${NC}"
check_service 5000 "Main API" "http://localhost:5000"
check_service 4000 "Management Service" "http://localhost:4000"
check_service 4900 "Chat Service" "http://localhost:4900"

echo -e "\n${BLUE}Frontend:${NC}"
check_service 3000 "Frontend (React)" "http://localhost:3000"

echo -e "\n${BLUE}Port Status:${NC}"
for port in 5000 4000 4900 3000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Port $port${NC} - In use"
    else
        echo -e "${RED}✗ Port $port${NC} - Not in use"
    fi
done

echo -e "\n${BLUE}MongoDB Connection:${NC}"
# Try to make a request to the backend API that would require DB
if curl -s -X GET http://localhost:5000/api/auth/getAuthData >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB${NC} - Connected (or API is responding)"
else
    echo -e "${YELLOW}⚠ MongoDB${NC} - Cannot verify connection"
fi

echo -e "\n${BLUE}Node Processes:${NC}"
ps aux | grep -E "npm|node" | grep -v grep | while read line; do
    echo -e "${GREEN}✓${NC} $line"
done

echo -e "\n${BLUE}Configuration Files:${NC}"
files=(
    "backend/.env"
    "frontend/.env"
    "admin/.env"
    "backend/config.js"
    "frontend/src/config/baseConfig.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
    fi
done

echo -e "\n${BLUE}=== Health Check Complete ===${NC}\n"

# Browser test
if curl -s http://localhost:3000 | grep -q "html"; then
    echo -e "${GREEN}✓ Frontend is responding with HTML${NC}"
else
    echo -e "${YELLOW}⚠ Cannot verify frontend HTML response${NC}"
fi

echo ""

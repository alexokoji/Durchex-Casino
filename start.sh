#!/bin/bash

# Web3 Casino Platform - Startup Script
# This script starts all required backend services and frontend

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Web3 Casino Platform - Startup ===${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}\n"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Kill any existing processes on required ports
cleanup_ports() {
    echo "Checking for existing services..."
    
    for port in 5000 4000 4900 3000; do
        if check_port $port; then
            echo -e "${BLUE}Killing existing service on port $port${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    done
}

cleanup_ports

# Start Backend Services
echo -e "\n${BLUE}Starting Backend Services...${NC}\n"

# Check if node_modules exist
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd "$BACKEND_DIR"
    npm install
fi

# Main API Server
echo -e "${BLUE}→ Starting Main API Server (Port 5000)${NC}"
cd "$BACKEND_DIR"
nohup npm start > "$BACKEND_DIR/logs/main-api.log" 2>&1 &
MAIN_PID=$!
echo -e "${GREEN}✓ Main API started (PID: $MAIN_PID)${NC}"
sleep 3

# Management Service
echo -e "${BLUE}→ Starting Management Service (Port 4000)${NC}"
cd "$BACKEND_DIR/management"
nohup node ManagementService.js > "$BACKEND_DIR/logs/management.log" 2>&1 &
MANAGE_PID=$!
echo -e "${GREEN}✓ Management Service started (PID: $MANAGE_PID)${NC}"
sleep 2

# Chat Service
echo -e "${BLUE}→ Starting Chat Service (Port 4900)${NC}"
cd "$BACKEND_DIR/userchat"
nohup node UserChatService.js > "$BACKEND_DIR/logs/chat.log" 2>&1 &
CHAT_PID=$!
echo -e "${GREEN}✓ Chat Service started (PID: $CHAT_PID)${NC}"
sleep 2

echo -e "\n${BLUE}=== Backend Services Started ===${NC}"
echo -e "Main API:          http://localhost:5000${NC}"
echo -e "Management Socket: ws://localhost:4000${NC}"
echo -e "Chat Socket:       ws://localhost:4900${NC}\n"

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}\n"

# Check if node_modules exist
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd "$FRONTEND_DIR"
    npm install
fi

echo -e "${BLUE}→ Starting React Dev Server (Port 3000)${NC}"
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo -e "\n${GREEN}=== All Services Started ===${NC}"
echo -e "${GREEN}Frontend:   http://localhost:3000${NC}\n"

echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Show status
echo -e "\n${BLUE}=== Service Status ===${NC}"
echo -e "Main API:       $(curl -s http://localhost:5000 >/dev/null 2>&1 && echo -e '${GREEN}✓ Running${NC}' || echo -e '${RED}✗ Not responding${NC}')"
echo -e "Management:     $(curl -s http://localhost:4000 >/dev/null 2>&1 && echo -e '${GREEN}✓ Running${NC}' || echo -e '${RED}✗ Not responding${NC}')"
echo -e "Frontend:       $(curl -s http://localhost:3000 >/dev/null 2>&1 && echo -e '${GREEN}✓ Running${NC}' || echo -e '${RED}✗ Not responding${NC}')\n"

echo -e "${GREEN}Browser will open automatically...${NC}"
sleep 2

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
else
    echo -e "${BLUE}Open your browser to: http://localhost:3000${NC}"
fi

echo -e "\n${GREEN}=== All services are running ===${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}\n"

# Save PIDs for cleanup
echo "$MAIN_PID $MANAGE_PID $CHAT_PID $FRONTEND_PID" > "$PROJECT_ROOT/.service-pids"

# Wait for Ctrl+C
trap cleanup EXIT

cleanup() {
    echo -e "\n\n${BLUE}Stopping all services...${NC}"
    kill $MAIN_PID $MANAGE_PID $CHAT_PID $FRONTEND_PID 2>/dev/null || true
    rm -f "$PROJECT_ROOT/.service-pids"
    echo -e "${GREEN}✓ All services stopped${NC}\n"
}

# Keep script running
wait

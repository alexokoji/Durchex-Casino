#!/bin/bash

# Backend Startup Script
# Starts the main backend server which initializes all microservices

echo "=================================================="
echo "Durchex Casino - Backend Server Startup"
echo "=================================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[*] Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "[!] Warning: .env file not found"
    echo "[*] Creating .env file from .env.example (if available)"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[*] .env file created. Please update it with your configuration."
    else
        echo "[!] No .env.example found. Please create .env manually."
    fi
    echo ""
fi

# Display startup information
echo "[*] Configuration:"
echo "    - Backend Directory: $(pwd)"
echo "    - Node Version: $(node --version)"
echo "    - NPM Version: $(npm --version)"
echo ""

# Start the backend server
echo "[*] Starting Backend Server with all microservices..."
echo "=================================================="
echo ""

node server.js

# Capture exit code
EXIT_CODE=$?

echo ""
echo "=================================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "[✓] Backend server shut down gracefully"
else
    echo "[✗] Backend server encountered an error (Exit code: $EXIT_CODE)"
fi
echo "=================================================="

exit $EXIT_CODE

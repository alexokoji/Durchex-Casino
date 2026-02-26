@echo off
REM Web3 Casino Platform - Windows Startup Script
REM This script starts all required backend services and frontend

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%backend
set FRONTEND_DIR=%PROJECT_ROOT%frontend

echo.
echo ====================================
echo Web3 Casino Platform - Startup
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo X Node.js is not installed
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Create logs directory if it doesn't exist
if not exist "%BACKEND_DIR%\logs" mkdir "%BACKEND_DIR%\logs"

REM Kill any existing Node processes (optional - comment out if it causes issues)
echo Checking for existing services...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo ====================================
echo Starting Backend Services
echo ====================================
echo.

REM Check if backend node_modules exist
if not exist "%BACKEND_DIR%\node_modules" (
    echo Installing backend dependencies...
    cd /d "%BACKEND_DIR%"
    call npm install
)

REM Start Main API Server
echo [*] Starting Main API Server (Port 5000)
cd /d "%BACKEND_DIR%"
start "Casino - Main API" cmd /k npm start
timeout /t 3 /nobreak >nul
echo [OK] Main API started

REM Start Management Service
echo [*] Starting Management Service (Port 4000)
cd /d "%BACKEND_DIR%\management"
start "Casino - Management Service" cmd /k node ManagementService.js
timeout /t 2 /nobreak >nul
echo [OK] Management Service started

REM Start Chat Service
echo [*] Starting Chat Service (Port 4900)
cd /d "%BACKEND_DIR%\userchat"
start "Casino - Chat Service" cmd /k node UserChatService.js
timeout /t 2 /nobreak >nul
echo [OK] Chat Service started

echo.
echo ====================================
echo Backend Services Status
echo ====================================
echo Main API:          http://localhost:5000
echo Management Socket: ws://localhost:4000
echo Chat Socket:       ws://localhost:4900
echo.

REM Check if frontend node_modules exist
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install
)

REM Start Frontend
echo [*] Starting Frontend (Port 3000)
start "Casino - Frontend" cmd /k cd /d "%FRONTEND_DIR%" ^&^& npm start
timeout /t 5 /nobreak >nul

echo.
echo ====================================
echo All Services Started!
echo ====================================
echo Frontend:   http://localhost:3000
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul

REM Try to open browser
start http://localhost:3000

echo.
echo [OK] All services are running
echo Press Ctrl+C in any terminal window to stop a service
echo Or close all terminal windows to stop everything
echo.

pause

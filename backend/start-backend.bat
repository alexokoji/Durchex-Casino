@echo off
REM Backend Startup Script for Windows
REM Starts the main backend server which initializes all microservices

title Durchex Casino - Backend Server
cls

echo ==================================================
echo Durchex Casino - Backend Server Startup
echo ==================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo [!] Warning: .env file not found
    echo [*] Creating .env file from .env.example (if available)
    if exist ".env.example" (
        copy .env.example .env
        echo [*] .env file created. Please update it with your configuration.
    ) else (
        echo [!] No .env.example found. Please create .env manually.
    )
    echo.
)

REM Display startup information
echo [*] Configuration:
for /f "tokens=*" %%A in ('node --version') do echo     - Node Version: %%A
for /f "tokens=*" %%A in ('npm --version') do echo     - NPM Version: %%A
echo     - Backend Directory: %cd%
echo.

REM Start the backend server
echo [*] Starting Backend Server with all microservices...
echo ==================================================
echo.

call node server.js

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
echo ==================================================
if %EXIT_CODE% equ 0 (
    echo [+] Backend server shut down gracefully
) else (
    echo [-] Backend server encountered an error (Exit code: %EXIT_CODE%)
)
echo ==================================================

exit /b %EXIT_CODE%

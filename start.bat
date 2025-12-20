@echo off
title NexusDocs Development Server
echo ========================================
echo        NexusDocs Development Server
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Delete node_modules if it exists but is incomplete (no vite)
if exist "node_modules\" (
    if not exist "node_modules\.bin\vite.cmd" (
        echo Detected incomplete installation. Cleaning up...
        rmdir /s /q node_modules 2>nul
    )
)

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo Please check the error messages above.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

:: Start the development server
echo Starting development server...
echo.
echo The server will open at: http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
echo ----------------------------------------
echo.

call npm run dev

:: If we get here, something went wrong or user stopped the server
echo.
echo ----------------------------------------
echo Server stopped.
echo.
pause

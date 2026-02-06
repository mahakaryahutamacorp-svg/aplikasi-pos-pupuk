@echo off
title POS Pupuk - Aplikasi Kasir
echo ============================================
echo    POS PUPUK - Aplikasi Kasir Portable
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo.
    echo Silakan install Node.js terlebih dahulu:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js ditemukan
echo.

:: Get the directory where this script is located
cd /d "%~dp0"

:: Check if standalone server exists
if exist ".next\standalone\server.js" (
    echo Menjalankan server production...
    echo.
    echo ============================================
    echo   Buka browser: http://localhost:3000
    echo   Tekan Ctrl+C untuk menghentikan server
    echo ============================================
    echo.
    
    :: Copy static files if not already done
    if not exist ".next\standalone\.next\static" (
        xcopy /E /I /Y ".next\static" ".next\standalone\.next\static" >nul 2>nul
    )
    if not exist ".next\standalone\public" (
        xcopy /E /I /Y "public" ".next\standalone\public" >nul 2>nul
    )
    
    cd .next\standalone
    start http://localhost:3000
    node server.js
) else (
    echo [INFO] Build production belum ada, menjalankan development server...
    echo.
    
    :: Check if node_modules exists
    if not exist "node_modules" (
        echo Menginstall dependencies...
        call npm install
        echo.
    )
    
    echo ============================================
    echo   Buka browser: http://localhost:3000
    echo   Tekan Ctrl+C untuk menghentikan server
    echo ============================================
    echo.
    start http://localhost:3000
    call npm run dev
)

pause

#!/bin/bash
echo "============================================"
echo "   POS PUPUK - Aplikasi Kasir Portable"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js tidak ditemukan!"
    echo ""
    echo "Silakan install Node.js terlebih dahulu:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[OK] Node.js ditemukan"
echo ""

# Get the directory where this script is located
cd "$(dirname "$0")"

# Check if standalone server exists
if [ -f ".next/standalone/server.js" ]; then
    echo "Menjalankan server production..."
    echo ""
    echo "============================================"
    echo "  Buka browser: http://localhost:3000"
    echo "  Tekan Ctrl+C untuk menghentikan server"
    echo "============================================"
    echo ""
    
    # Copy static files if not already done
    if [ ! -d ".next/standalone/.next/static" ]; then
        cp -r .next/static .next/standalone/.next/
    fi
    if [ ! -d ".next/standalone/public" ]; then
        cp -r public .next/standalone/
    fi
    
    cd .next/standalone
    
    # Open browser (cross-platform)
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000 &
    elif command -v open &> /dev/null; then
        open http://localhost:3000 &
    fi
    
    node server.js
else
    echo "[INFO] Build production belum ada, menjalankan development server..."
    echo ""
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Menginstall dependencies..."
        npm install
        echo ""
    fi
    
    echo "============================================"
    echo "  Buka browser: http://localhost:3000"
    echo "  Tekan Ctrl+C untuk menghentikan server"
    echo "============================================"
    echo ""
    
    # Open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000 &
    elif command -v open &> /dev/null; then
        open http://localhost:3000 &
    fi
    
    npm run dev
fi

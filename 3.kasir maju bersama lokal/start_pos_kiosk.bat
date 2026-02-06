@echo off
TITLE CV. Maju Bersama POS - Kiosk Mode
echo ==========================================
echo 🚀 Menjalankan CV. Maju Bersama POS...
echo ==========================================

:: Masuk ke direktori project
cd /d "D:\aplikasi pos pupuk\3.kasir maju bersama lokal"

:: Cek apakah server sudah jalan, jika iya matikan dulu untuk menghindari konflik
taskkill /F /IM node.exe /T >nul 2>&1

:: Jalankan server di background
echo [1/3] Memulai Server Backend...
start /B npm start

:: Tunggu sampai server siap (timeout 15 detik)
echo [2/3] Menunggu server siap di port 3000...
:wait_loop
set /a retry+=1
if %retry% gtr 30 (
    echo ❌ Server gagal dimulai dalam waktu yang ditentukan.
    pause
    exit
)
powershell -Command "(New-Object System.Net.WebClient).DownloadString('http://localhost:3000')" >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)

:: Jalankan browser dalam mode Kiosk
echo [3/3] Membuka Aplikasi dalam Mode Kiosk...
echo ✅ Siap digunakan!
start msedge --kiosk http://localhost:3000 --edge-kiosk-type=fullscreen --no-first-run
:: Atau jika ingin menggunakan Chrome:
:: start chrome --kiosk http://localhost:3000 --no-first-run

exit

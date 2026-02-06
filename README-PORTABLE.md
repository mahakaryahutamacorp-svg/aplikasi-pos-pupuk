# CV. Maju Bersama - Aplikasi Kasir POS Portable

Aplikasi Point of Sale (Kasir) untuk CV. Maju Bersama - Toko Pupuk & Pestisida.
Aplikasi ini bersifat **portable** dan dapat dipindahkan ke flashdisk.

## ✨ Fitur

- 🛒 **Kasir** - Transaksi penjualan cepat dengan dukungan barcode
- 📦 **Manajemen Produk** - Kelola stok pupuk, pestisida, dan produk lainnya  
- 👥 **Database Pelanggan** - Simpan data pelanggan dengan sistem hutang
- 📊 **Laporan** - Laporan penjualan dan piutang lengkap
- 💾 **Penyimpanan Offline** - Data tersimpan lokal di browser (localStorage)

## 🚀 Cara Menggunakan

### Windows

1. Pastikan **Node.js** sudah terinstal (download: <https://nodejs.org/>)
2. Klik ganda file **`start-server.bat`**
3. Browser akan terbuka otomatis ke `http://localhost:3000`

### Linux / Mac

1. Pastikan **Node.js** sudah terinstal
2. Buka terminal di folder ini
3. Jalankan: `chmod +x start-server.sh && ./start-server.sh`

## 📁 Struktur Folder

```
CV.Maju.Bersama.POS/
├── start-server.bat     # Jalankan ini (Windows)
├── start-server.sh      # Jalankan ini (Linux/Mac)
├── .next/standalone/    # Server production
├── public/              # Logo dan assets
└── src/                 # Source code
```

## 💡 Tips

- **Backup Data**: Data disimpan di localStorage browser. Gunakan browser yang sama untuk konsistensi.
- **Port Berbeda**: Edit start-server.bat jika ingin menggunakan port selain 3000
- **Build Ulang**: Jalankan `npm run build` untuk regenerate production build

## 📞 Kontak

CV. Maju Bersama  
Toko Pupuk & Pestisida

---
© 2026 CV. Maju Bersama. All rights reserved.

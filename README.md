# Klinik Almedika - SIM Farmasi & Rawat Jalan Terpadu

Sistem Informasi Manajemen (SIM) Klinik internal (*back-office*) terpadu untuk pengelolaan inventori obat, penulisan E-Resep oleh Dokter, serta penyiapan obat oleh Apoteker secara real-time dengan metode FEFO (*First Expired, First Out*).

---

## 🌟 Fitur Utama

- **Integrasi E-Resep & Apotek Real-Time:** Penulisan resep oleh dokter dan pemrosesan oleh apoteker terhubung langsung via Socket.io.
- **Inventori Multi-Satuan:** Mendukung konversi satuan berjenjang (misal: Box -> Strip -> Tablet/Butir) dengan pemotongan stok otomatis di tingkat unit dasar (*base unit*).
- **Manajemen Kadaluarsa (FEFO):** Pemotongan stok otomatis mendahulukan batch dengan tanggal kadaluarsa terdekat.
- **Visibilitas Stok Real-Time:** Dokter dapat memantau ketersediaan stok obat langsung saat peresepan.
- **Laporan & Stok Opname:** Riwayat peresepan, penyesuaian stok, serta pelacakan obat rusak/retur supplier.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express.js, Socket.io, Better-SQLite3
- **Dev Tools:** Concurrently

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Klon Repositori
```bash
git clone https://github.com/nuby911/inventory-klinik.git
cd inventory-klinik
```

### 2. Instalasi Dependensi
Instal dependensi untuk root, backend, dan frontend:
```bash
# Root
npm install

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 3. Menjalankan Aplikasi
Kembali ke root direktori dan jalankan:
```bash
npm run dev
```

Perintah di atas akan menjalankan:
- **Server / API:** `http://localhost:5000` (Socket.io di `ws://localhost:5000`)
- **Client (Frontend):** `http://localhost:5173`

Database SQLite dan data awal (*seed data*) akan diinisialisasi secara otomatis saat server pertama kali dijalankan.

---

## 👥 Pengguna & Akun Demo (Default Seed)
- **Admin:** Mengelola master data obat, batch, harga, dan supplier.
- **Dokter:** Penulisan resep elektronik (E-Resep) dan pemeriksaan pasien.
- **Apoteker:** Penerimaan E-Resep, peracikan obat, dan serah terima ke pasien.

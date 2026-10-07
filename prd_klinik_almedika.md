# Product Requirement Document (PRD)
## Web Informasi Klinik & Manajemen Inventori (E-Resep, Multi-Satuan, FEFO & Retur)

- **Versi:** 1.1.0 (Full Features)
- **Tanggal:** 11 September 2026
- **Status:** Approved for Development
- **Tech Stack Utama:** Node.js (Express.js), React.js (Vite), PostgreSQL, Socket.io, Tailwind CSS

---

## 1. Ringkasan Eksekutif & Latar Belakang (Executive Summary)

Klinik membutuhkan sistem informasi internal (*back-office*) terpadu yang menghubungkan manajemen inventori obat, rekam medis ringkas/dosis obat oleh dokter, serta alur penyiapan obat oleh apoteker secara *real-time*. 

Sistem ini dirancang untuk menangani seluruh siklus hidup obat di klinik: mulai dari pembelian dari supplier, konversi satuan berjenjang, pelacakan masa kadaluarsa (FEFO), peresepan elektronik (E-Resep), hingga penanganan obat rusak, kadaluarsa, retur supplier, dan stok opname.

---

## 2. Tujuan Sistem (Objectives)

1. **Integrasi E-Resep & Apotek Real-Time:** Menghilangkan jeda waktu dan kesalahan resep manual dengan mengirimkan e-resep dari Dokter ke Apoteker secara instan via WebSockets.
2. **Akurasi Inventori Multi-Satuan:** Mendukung konversi satuan berjenjang (contoh: 1 Box = 10 Strip = 100 Butir) agar pemotongan stok tepat hingga level eceran/satuan terkecil (*Base Unit*).
3. **Manajemen Kadaluarsa (FEFO) & Retur:** Memastikan stok obat terpotong berdasarkan tanggal kadaluarsa paling dekat (*First Expired, First Out*) serta menyediakan fitur retur ke supplier dan penghapusan obat rusak.
4. **Visibilitas Stok untuk Dokter:** Menampilkan ketersediaan stok obat secara *real-time* di layar dokter saat penulisan resep untuk mencegah peresepan obat yang kosong.

---

## 3. Pengguna & Peran (User Roles & Permissions)

| Role | Hak Akses Utama |
| :--- | :--- |
| **Admin / Inventori** | Full Access: Mengelola Master Obat, Rasio Multi-Satuan, Restock/Batch Masuk, Retur Supplier, Penyesuaian Stok Rusak/Opname, User Management, & Laporan. |
| **Dokter** | Read Katalog Stok Obat, Write/Send E-Resep, Read Riwayat Resep Pasien, Search Pasien. |
| **Apoteker / Farmasi** | Read Antrean E-Resep Live, Update Status Resep, Dispensing Obat (Cut Stock), Cetak Etiket Obat, Input Retur/Barang Rusak, Read Warning Expired & Low Stock. |

---

## 4. Alur Kerja Utama (Core Workflows)

### 4.1. Alur Tambah Obat & Restock (Admin/Apoteker)
1. **Master Obat:** Admin menetapkan nama obat, kategori sediaan (padat/cair/salep), satuan terkecil (*base unit*), dan rasio konversi kemasan (misal: 1 Strip = 10 Butir; 1 Box = 10 Strip).
2. **Stok Masuk (Batching):** Admin/Apoteker menginput stok masuk dengan memilih nama obat, **Nomor Batch**, **Tanggal Kadaluarsa (ED)**, serta **Jumlah & Satuan Fisik** yang diterima (misal: 5 Box).
3. **Kalkulasi Otomatis:** Sistem mengonversi 5 Box × 100 Butir = 500 Butir dan menyimpannya ke tabel `medicine_batches`.

### 4.2. Alur E-Resep & Pemotongan Stok (Dokter -> Apoteker)
1. Dokter mencari data Pasien (Manual Search / Input No. RM).
2. Dokter mencari Obat. Sistem menampilkan katalog obat beserta indikator stok *real-time* (Tersedia / Menipis / Kosong).
3. Dokter memilih dosis/satuan + aturan minum, lalu menekan tombol **"Kirim E-Resep"**.
4. Event `Socket.io` terdeteksi. Layar Apoteker memunculkan antrean resep baru secara *live*.
5. Apoteker meninjau resep, mencetak stiker etiket obat, dan menekan **"Selesai / Serahkan Obat"**.
6. **Sistem Otomatis:** Memotong stok dari batch dengan ED terdekat (FEFO) dan mengubah status resep menjadi `Completed`.

### 4.3. Alur Retur Supplier & Penyesuaian Stok Rusak/Pecah
1. **Retur Supplier:** Admin/Apoteker memilih batch obat yang akan dikembalikan ke supplier, menginput jumlah dan alasan retur (misal: cacat pabrik/hampir ED). Stok batch & master otomatis berkurang.
2. **Obat Rusak / Expired / Opname:** Admin/Apoteker mencatat pembuangan obat rusak/pecah di rak fisik dengan memilih nomor batch dan alasan penyesuaian. Sistem mencatat audit log transaksi stok keluar non-resep.

---

## 5. Spesifikasi Fitur Detail (Functional Requirements)

### 5.1. Modul Dokter
* **Search & Select Pasien:** Pencarian cepat berdasarkan Nama Pasien atau No. RM.
* **Live Stock Catalog:** Menampilkan seluruh daftar obat beserta sisa stok dalam format ringkas ("4 Box, 2 Strip, 5 Butir").
* **E-Resep Form:** Auto-complete nama obat, pilihan satuan terintegrasi, input dosis/aturan pakai, dan peringatan stok 0.
* **Fitur Resep Racikan (Compounding):** Form khusus untuk mengombinasikan beberapa bahan obat menjadi puyer/kapsul/salep.

### 5.2. Modul Apoteker / Farmasi
* **Real-time Queue Dashboard:** Antrean e-resep masuk yang ter-update otomatis menggunakan Socket.io.
* **Prescription Detail & Converter:** Informasi resep yang dikonversi ke instruksi fisik pengambilan barang.
* **Dispensing Action:** Tombol konfirmasi penyerahan obat yang mengeksekusi pemotongan stok berbasis FEFO.
* **Cetak Etiket:** Fitur *one-click print* stiker aturan minum obat.

### 5.3. Modul Admin & Inventori
* **Master Obat & Multi-Satuan:** Pengelolaan sediaan obat dan hirarki konversi kemasan.
* **Batch & FEFO Management:** Input data obat masuk terikat dengan Nomor Batch & Expired Date.
* **Low Stock & Expiration Alert:** Dashboard penanda warna (Merah/Kuning) untuk obat kritis atau H-90 menuju *expired*.
* **Retur Supplier & Disposal Management:** Modul pencatatan pengembalian ke supplier dan pencatatan obat pecah/rusak/kadaluarsa.
* **Stok Opname / Adjustment Log:** Rekonsiliasi antara jumlah stok di database dan fisik di rak.

---

## 6. Perancangan Database (Database Schema - PostgreSQL)

```sql
-- 1. Table Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'dokter', 'apoteker')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Patients
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('L', 'P')),
    date_of_birth DATE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table Master Medicines
CREATE TABLE medicines (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) CHECK (category IN ('padat', 'cair', 'salep', 'injeksi')),
    base_unit VARCHAR(20) NOT NULL,
    total_stock INT DEFAULT 0,
    min_stock_alert INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table Medicine Units (Konversi Multi-Satuan)
CREATE TABLE medicine_units (
    id SERIAL PRIMARY KEY,
    medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
    unit_name VARCHAR(20) NOT NULL,
    conversion_ratio INT NOT NULL,
    is_base_unit BOOLEAN DEFAULT FALSE
);

-- 5. Table Medicine Batches (FEFO Tracking)
CREATE TABLE medicine_batches (
    id SERIAL PRIMARY KEY,
    medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) NOT NULL,
    expired_date DATE NOT NULL,
    stock_qty INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table Prescriptions (Header)
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    prescription_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT REFERENCES patients(id),
    doctor_id INT REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table Prescription Items (Detail)
CREATE TABLE prescription_items (
    id SERIAL PRIMARY KEY,
    prescription_id INT REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id INT REFERENCES medicines(id),
    unit_selected VARCHAR(20) NOT NULL,
    quantity_input INT NOT NULL,
    quantity_base_unit INT NOT NULL,
    dosage_instruction VARCHAR(100) NOT NULL
);

-- 8. Table Stock Adjustments & Returns (Retur Supplier & Obat Rusak/Opname)
CREATE TABLE stock_adjustments (
    id SERIAL PRIMARY KEY,
    batch_id INT REFERENCES medicine_batches(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(30) CHECK (adjustment_type IN ('retur_supplier', 'damaged', 'expired_disposal', 'stock_opname_adjustment')),
    quantity_base_unit INT NOT NULL CHECK (quantity_base_unit > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adjustments_batch ON stock_adjustments(batch_id);
CREATE INDEX idx_adjustments_type ON stock_adjustments(adjustment_type);
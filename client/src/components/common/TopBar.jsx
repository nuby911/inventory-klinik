import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Home, 
  Menu, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function TopBar({ activeSubTab, onToggleMobile }) {
  const { currentUser, logout } = useAuth();
  const { incomingAlert, setIncomingAlert } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');

  const getSubTabInfo = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return {
          title: 'Dashboard Ringkasan Operasional',
          category: 'Menu Utama',
          desc: 'Pemantauan real-time antrean resep, ketersediaan stok obat, dan audit mutu klinik'
        };
      case 'reports':
        return {
          title: 'Rekap & Laporan Operasional',
          category: 'Menu Utama',
          desc: 'Rekapitulasi periodik peresepan, pelayanan farmasi, dan mutasi stok (Harian, Mingguan, Bulanan)'
        };

      // Doctor
      case 'write_prescription':
        return {
          title: 'Konsultasi & Tulis E-Resep',
          category: 'Pelayanan Medis',
          desc: 'Peresepan standar & racikan dengan pengecekan kontraindikasi alergi pasien'
        };
      case 'prescription_history':
        return {
          title: 'Riwayat Resep Dokter',
          category: 'Pelayanan Medis',
          desc: 'Pemantauan status penyiapan dan penyerahan obat di apotek secara real-time'
        };
      case 'medicine_catalog':
        return {
          title: 'Katalog & Stok Live Obat',
          category: 'Pelayanan Medis',
          desc: 'Informasi sediaan, lokasi rak fisik, dan ketersediaan stok klinik'
        };

      // Pharmacy
      case 'queue_dispensing':
        return {
          title: 'Antrean Farmasi & Dispensing FEFO',
          category: 'Instalasi Farmasi',
          desc: 'Verifikasi 5 benar, rekomendasi batch terdekat (FEFO), dan cetak etiket aturan pakai'
        };
      case 'expiry_monitoring':
        return {
          title: 'Monitoring ED & Stok Menipis',
          category: 'Instalasi Farmasi',
          desc: 'Daftar batch berumur < 60 hari dan obat di bawah batas minimum'
        };
      case 'damage_report':
        return {
          title: 'Laporan Kerusakan & Retur Farmasi',
          category: 'Instalasi Farmasi',
          desc: 'Pencatatan obat pecah, rusak, atau ditarik distributor di rak fisik'
        };
      case 'dispensed_history':
        return {
          title: 'Riwayat Penyerahan Obat',
          category: 'Instalasi Farmasi',
          desc: 'Arsip e-resep yang telah selesai dipotong stok dan diserahkan'
        };

      // Admin
      case 'inventory_master':
        return {
          title: 'Master Obat & Rasio Multi-Satuan',
          category: 'Logistik & Gudang',
          desc: 'Pengaturan hirarki konversi kemasan (Box/Strip/Butir) dan batas alert'
        };
      case 'restock_batches':
        return {
          title: 'Penerimaan Batch Masuk (Restock)',
          category: 'Logistik & Gudang',
          desc: 'Pencatatan batch fisik diterima dari PBF dan kalkulasi otomatis ke base unit'
        };
      case 'returns_audit':
        return {
          title: 'Retur PBF & Audit BPOM',
          category: 'Logistik & Gudang',
          desc: 'Dokumentasi resmi pengembalian ke supplier dan rekonsiliasi opname'
        };
      case 'logistics_overview':
        return {
          title: 'Tata Letak Rak & Logistik',
          category: 'Logistik & Gudang',
          desc: 'Informasi menyeluruh posisi rak fisik instalasi farmasi klinik'
        };

      default:
        return {
          title: 'Dashboard Ringkasan Operasional',
          category: 'Menu Utama',
          desc: 'SIM Farmasi & Rawat Jalan Terpadu Klinik Almedika'
        };
    }
  };

  const info = getSubTabInfo();

  return (
    <div className="bg-gradient-to-r from-[#1c8bb7] via-[#2497c3] to-[#2b9eca] text-white shadow-xs transition-all border-b border-white/20">
      {/* CITO Alert Banner (If Any) */}
      {incomingAlert && (
        <div className={`px-6 py-2 flex items-center justify-between text-xs font-semibold ${
          incomingAlert.isCito ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#030879] text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wide">
              {incomingAlert.title}:
            </span>
            <span>{incomingAlert.message}</span>
          </div>
          <button 
            onClick={() => setIncomingAlert(null)} 
            className="text-white/80 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar Row */}
      <div className="px-6 lg:px-8 py-3.5 flex items-center justify-between border-b border-white/15">
        {/* Left: Mobile Toggle & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Pill-shaped Search Box */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="w-3.5 h-3.5 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari fitur, menu, atau pasien..."
              className="w-full bg-white/20 hover:bg-white/25 focus:bg-white/30 text-white placeholder:text-white/70 text-xs pl-9 pr-4 py-1.5 rounded-full border border-white/25 focus:outline-hidden focus:ring-2 focus:ring-white/50 transition font-medium"
            />
          </div>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-2.5">
          <button 
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer relative"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-[#1c8bb7]" />
          </button>

          <div className="flex items-center gap-2 bg-[#030879]/35 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-xs">
            <span className="text-xs font-bold text-white">{currentUser?.name}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#060eff] text-white px-2.5 py-0.5 rounded-full shadow-xs">
              {currentUser?.role}
            </span>
          </div>

          <button 
            onClick={logout}
            className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-white/15 hover:bg-rose-600 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Hero Context Header */}
      <div className="px-6 lg:px-8 py-5 pb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
          {info.title}
        </h1>

        <div className="flex items-center gap-2 text-xs text-white/90 mt-1 font-medium">
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-white/80" />
            <span>/</span>
            <span className="text-white/80">{info.category}</span>
            <span>/</span>
            <span className="text-white font-semibold underline decoration-white/40 underline-offset-2">{info.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

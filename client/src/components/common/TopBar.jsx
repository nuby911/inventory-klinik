import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Home, 
  Menu, 
  LogOut,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useSocket } from '../../context/useSocket';
import { formatDateID, formatTimeWIB } from '../../utils/dateUtils';

export default function TopBar({ activeSubTab, setActiveSubTab, onToggleMobile }) {
  const { currentUser, logout } = useAuth();
  const { incomingAlert, setIncomingAlert } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const roleShortcuts = {
    dokter: [
      { id: 'dashboard', label: 'Dashboard Operasional', desc: 'Ringkasan antrean dan stok' },
      { id: 'write_prescription', label: 'Tulis E-Resep', desc: 'Resep standar & racikan puyer' },
      { id: 'prescription_history', label: 'Riwayat Resep', desc: 'Daftar resep yang telah dibuat' },
      { id: 'medicine_catalog', label: 'Katalog Obat', desc: 'Daftar sediaan dan stok obat klinik' },
      { id: 'reports', label: 'Laporan Rekapitulasi', desc: 'Rekap harian, mingguan, bulanan' }
    ],
    apoteker: [
      { id: 'dashboard', label: 'Dashboard Operasional', desc: 'Ringkasan antrean dan stok obat' },
      { id: 'queue_dispensing', label: 'Antrean Resep Farmasi', desc: 'Verifikasi 5 benar & penyiapan obat' },
      { id: 'stock_monitoring', label: 'Peringatan Stok', desc: 'Monitoring obat menipis & stok kritis' },
      { id: 'dispensed_history', label: 'Riwayat Penyerahan', desc: 'Daftar obat yang telah diserahkan' },
      { id: 'reports', label: 'Laporan Rekapitulasi', desc: 'Rekapitulasi farmasi periodik' }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard Operasional', desc: 'Ringkasan inventori dan stok' },
      { id: 'inventory_master', label: 'Master Obat & Satuan', desc: 'Katalog obat & multi-satuan' },
      { id: 'restock_batches', label: 'Penerimaan Batch (Restock)', desc: 'Penerimaan stok batch obat masuk' },
      { id: 'logistics_overview', label: 'Tata Letak Rak', desc: 'Posisi rak penyimpanan fisik' },
      { id: 'reports', label: 'Laporan Rekapitulasi', desc: 'Rekapitulasi logistik dan peresepan' }
    ]
  };

  const matchingShortcuts = (roleShortcuts[currentUser?.role] || []).filter(item => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
  });

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
          title: 'Antrean Resep Farmasi',
          category: 'Instalasi Farmasi',
          desc: 'Verifikasi 5 benar dan cetak etiket aturan pakai obat'
        };
      case 'stock_monitoring':
      case 'expiry_monitoring':
        return {
          title: 'Peringatan Stok Obat',
          category: 'Instalasi Farmasi',
          desc: 'Monitoring obat di bawah batas minimum dan evaluasi stok kritis klinik'
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
          desc: 'Pencatatan batch fisik diterima dan kalkulasi otomatis ke base unit'
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
    <div className="bg-gradient-to-r from-[#091f36] via-[#0f3d6b] to-[#155ea3] text-white shadow-sm transition-all border-b border-white/15">
      {/* Alert Banner (If Any) */}
      {incomingAlert && (
        <div className="px-6 py-2.5 flex items-center justify-between text-xs font-semibold bg-[#0f3d6b] text-white border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
              {incomingAlert.title}:
            </span>
            <span>{incomingAlert.message}</span>
            {incomingAlert.timestamp && (
              <span className="text-white/70 font-mono text-[11px]">({incomingAlert.timestamp})</span>
            )}
          </div>
          <button 
            onClick={() => setIncomingAlert(null)} 
            className="text-white/80 hover:text-white px-2 py-0.5 rounded cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar Row */}
      <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-white/10">
        {/* Left: Mobile Toggle & Search Input */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Pill-shaped Search Box with Quick Navigation Dropdown */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="w-3.5 h-3.5 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Cari fitur, menu, atau pintasan..."
              className="w-full bg-white/15 hover:bg-white/20 focus:bg-white/25 text-white placeholder:text-white/70 text-xs pl-9 pr-4 py-1.5 rounded-full border border-white/20 focus:outline-hidden focus:ring-2 focus:ring-[#ec1415]/70 transition font-medium"
            />

            {/* Quick Navigation Dropdown */}
            {showSearchDropdown && matchingShortcuts.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Pintasan Menu ({matchingShortcuts.length})
                </div>
                <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                  {matchingShortcuts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (setActiveSubTab) setActiveSubTab(item.id);
                        setSearchQuery('');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 transition cursor-pointer flex flex-col"
                    >
                      <span className="font-semibold text-xs text-slate-900">{item.label}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button 
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer relative"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ec1415] ring-2 ring-[#0f3d6b]" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-black/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/20 backdrop-blur-xs">
            <span className="text-xs font-bold text-white max-w-[70px] sm:max-w-none truncate">{currentUser?.name}</span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-[#ec1415] text-white px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs">
              {currentUser?.role}
            </span>
          </div>

          <button 
            onClick={logout}
            className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-white/15 hover:bg-[#ec1415] text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Hero Context Header */}
      <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pb-3.5 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
              {info.title}
            </h1>

            <div className="hidden sm:flex items-center gap-2 text-xs text-white/90 mt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-white/80" />
                <span>/</span>
                <span className="text-white/80">{info.category}</span>
                <span>/</span>
                <span className="text-white font-semibold underline decoration-white/40 underline-offset-2">{info.title}</span>
              </div>
            </div>
          </div>

          {/* Real-time Live Clock (WIB) */}
          <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-black/20 hover:bg-black/30 border border-white/20 rounded-xl px-2.5 sm:px-3.5 py-1.5 backdrop-blur-md shadow-xs transition">
            <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400 shrink-0 animate-pulse" />
            <div className="text-[11px] sm:text-xs font-medium text-white flex items-center gap-1.5 whitespace-nowrap">
              <span className="hidden sm:inline">{formatDateID(liveTime, 'full')}</span>
              <span className="inline sm:hidden">{formatDateID(liveTime, 'short')}</span>
              <span className="text-white/40">·</span>
              <span className="font-mono text-emerald-300 font-bold tracking-wider">
                {formatTimeWIB(liveTime, true)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

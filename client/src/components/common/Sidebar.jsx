import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Pill, 
  Clock, 
  AlertTriangle, 
  Package, 
  Boxes, 
  ShieldCheck, 
  Layers, 
  FileEdit, 
  BarChart3,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useSocket } from '../../context/useSocket';
import { api } from '../../services/api';

export default function Sidebar({ activeSubTab, setActiveSubTab, mobileOpen, setMobileOpen }) {
  const { currentUser, logout } = useAuth();
  const { isConnected, socket } = useSocket();
  const [queueStats, setQueueStats] = useState({ waiting: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getPrescriptions({ status: 'pending' });
        if (res.data) {
          setQueueStats({ waiting: res.data.length });
        }
      } catch {
        // silent
      }
    };

    fetchStats();

    if (socket) {
      socket.on('prescription:new', fetchStats);
      socket.on('prescription:status_changed', fetchStats);
      socket.on('prescription:dispensed', fetchStats);
    }

    const interval = setInterval(fetchStats, 30000);
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('prescription:new', fetchStats);
        socket.off('prescription:status_changed', fetchStats);
        socket.off('prescription:dispensed', fetchStats);
      }
    };
  }, [socket]);

  const getNavSections = () => {
    const navSections = [
      {
        category: 'Menu Utama',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard Operasional',
            icon: LayoutDashboard,
          },
          {
            id: 'reports',
            label: 'Rekap & Laporan',
            icon: BarChart3,
          }
        ]
      }
    ];

    if (currentUser?.role === 'dokter') {
      navSections.push({
        category: 'Pelayanan Medis',
        items: [
          { 
            id: 'write_prescription', 
            label: 'Tulis E-Resep', 
            icon: FileEdit 
          },
          { 
            id: 'prescription_history', 
            label: 'Riwayat Resep', 
            icon: History 
          },
          { 
            id: 'medicine_catalog', 
            label: 'Katalog & Stok Obat', 
            icon: Pill 
          }
        ]
      });
    } else if (currentUser?.role === 'apoteker') {
      navSections.push({
        category: 'Instalasi Farmasi',
        items: [
          { 
            id: 'queue_dispensing', 
            label: 'Antrean Resep Farmasi', 
            icon: Clock,
            badge: queueStats.waiting > 0 ? `${queueStats.waiting}` : null
          },
          { 
            id: 'stock_monitoring', 
            label: 'Peringatan Stok', 
            icon: AlertTriangle 
          },
          { 
            id: 'dispensed_history', 
            label: 'Riwayat Penyerahan', 
            icon: ShieldCheck 
          }
        ]
      });
    } else if (currentUser?.role === 'admin') {
      navSections.push({
        category: 'Logistik & Gudang',
        items: [
          { 
            id: 'inventory_master', 
            label: 'Master Obat & Satuan', 
            icon: Boxes 
          },
          { 
            id: 'restock_batches', 
            label: 'Penerimaan Batch', 
            icon: Package 
          },
          { 
            id: 'logistics_overview', 
            label: 'Tata Letak Rak Fisik', 
            icon: Layers 
          }
        ]
      });
    }

    return navSections;
  };

  const navSections = getNavSections();

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-[#030879]/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-30
        w-64 h-screen bg-white text-slate-700 flex flex-col shrink-0 border-r border-[#d4e7f3] shadow-xs
        transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Clinic Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#e2eef6] bg-[#f8fbfe] relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs border border-slate-200 overflow-hidden p-0.5">
              <img src="/logo-badge.png" alt="Logo Klinik ELMedika" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-[#0f3d6b] tracking-tight leading-tight flex items-center gap-1">
                <span>Klinik</span>
                <span className="text-[#0f3d6b]">EL</span>
                <span className="text-[#ec1415]">Medika</span>
              </div>
              <div className="text-[10px] font-bold text-[#155ea3] tracking-wider uppercase">
                Praktek Dokter & Sunat
              </div>
            </div>
          </div>

          <button 
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 lg:hidden cursor-pointer"
            aria-label="Tutup Menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3.5 py-3 space-y-5 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#155ea3]/80">
                {section.category}
              </div>

              <div className="space-y-1 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSubTab(item.id);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left ${
                        isActive
                          ? 'bg-[#155ea3] text-white font-semibold shadow-md shadow-blue-900/20 ring-1 ring-white/20'
                          : 'text-slate-600 hover:bg-[#eef5fc] hover:text-[#155ea3] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#155ea3]'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-white/25 text-white' 
                            : 'bg-[#e8f2fc] text-[#155ea3]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Connection Status & Logout */}
        <div className="p-3 border-t border-[#e2eef6] bg-[#f8fbfe] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-semibold text-slate-500">
              {isConnected ? 'Real-time Aktif' : 'Terputus'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Keluar dari sistem"
            className="flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}

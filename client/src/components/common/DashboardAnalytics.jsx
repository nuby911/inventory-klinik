import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Clock,
  Pill,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useSocket } from '../../context/useSocket';

function timeAgo(dateStr) {
  if (!dateStr) return '-';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'Baru saja';
  if (diff < 60) return `${diff} mnt lalu`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

export default function DashboardAnalytics({ setActiveSubTab }) {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const role = currentUser?.role;

  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [rxRes, medRes, expRes] = await Promise.all([
        api.getPrescriptions().catch(() => ({ data: [] })),
        api.getMedicines().catch(() => ({ data: [] })),
        api.getExpiringBatches(60).catch(() => ({ data: [] })),
      ]);

      setPrescriptions(Array.isArray(rxRes.data) ? rxRes.data : []);
      setMedicines(Array.isArray(medRes.data) ? medRes.data : []);
      setExpiringBatches(Array.isArray(expRes.data) ? expRes.data : []);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time synchronization for dashboard
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchDashboardData();
    };

    socket.on('prescription:new', handleRefresh);
    socket.on('prescription:status_changed', handleRefresh);
    socket.on('prescription:dispensed', handleRefresh);
    socket.on('stock:updated', handleRefresh);

    return () => {
      socket.off('prescription:new', handleRefresh);
      socket.off('prescription:status_changed', handleRefresh);
      socket.off('prescription:dispensed', handleRefresh);
      socket.off('stock:updated', handleRefresh);
    };
  }, [socket, fetchDashboardData]);

  // Metrik Utama
  const metrics = useMemo(() => {
    const pending = prescriptions.filter(p => p.status === 'pending').length;
    const preparing = prescriptions.filter(p => p.status === 'preparing').length;
    const completed = prescriptions.filter(p => p.status === 'completed').length;

    const lowStock = medicines.filter(m => m.stockStatus === 'Kritis' || m.stockStatus === 'Habis');
    const warningStock = medicines.filter(m => m.stockStatus === 'Menipis');

    return {
      pending,
      preparing,
      completed,
      lowStockCount: lowStock.length,
      warningStockCount: warningStock.length,
      lowStockMeds: [...lowStock, ...warningStock].slice(0, 5),
    };
  }, [prescriptions, medicines]);

  // Antrean Terfilter
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(rx => {
      if (statusFilter === 'pending' && rx.status !== 'pending') return false;
      if (statusFilter === 'preparing' && rx.status !== 'preparing') return false;
      if (statusFilter === 'completed' && rx.status !== 'completed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = rx.prescription_code?.toLowerCase() || '';
        const name = rx.patient_name?.toLowerCase() || '';
        const rm = rx.medical_record_number?.toLowerCase() || '';
        const doctor = rx.doctor_name?.toLowerCase() || '';
        if (!code.includes(q) && !name.includes(q) && !rm.includes(q) && !doctor.includes(q)) {
          return false;
        }
      }
      return true;
    }).slice(0, 10);
  }, [prescriptions, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman (Sederhana, Bersih, Profesional) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-[#0f3d6b] tracking-tight">Ringkasan Operasional</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Status terkini antrean resep dan pemantauan stok obat klinik.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#155ea3] bg-white border border-slate-200 rounded-full hover:bg-blue-50 transition cursor-pointer shadow-2xs"
            title="Muat ulang data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>

          {role === 'dokter' && (
            <button
              onClick={() => setActiveSubTab('write_prescription')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#155ea3] hover:bg-[#0f3d6b] rounded-full transition shadow-xs cursor-pointer"
            >
              Tulis E-Resep
            </button>
          )}

          {role === 'apoteker' && (
            <button
              onClick={() => setActiveSubTab('queue_dispensing')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#155ea3] hover:bg-[#0f3d6b] rounded-full transition shadow-xs cursor-pointer"
            >
              Buka Antrean Farmasi
            </button>
          )}

          {role === 'admin' && (
            <button
              onClick={() => setActiveSubTab('inventory_master')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#155ea3] hover:bg-[#0f3d6b] rounded-full transition shadow-xs cursor-pointer"
            >
              Kelola Master Obat
            </button>
          )}
        </div>
      </div>

      {/* 4 Kartu Metrik Utama (Flat, High Contrast, Elegan) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Antrean Menunggu */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resep Menunggu</span>
            <Clock className="w-4 h-4 text-[#155ea3]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.pending}</span>
            <span className="text-xs text-slate-500">resep</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Sedang diracik: <span className="font-semibold text-slate-700">{metrics.preparing}</span>
          </div>
        </div>

        {/* Metrik 2: Sedang Diracik */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Sedang Diracik
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.preparing}
            </span>
            <span className="text-xs text-slate-500">resep</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Sedang dalam penyiapan farmasi
          </div>
        </div>

        {/* Metrik 3: Selesai Hari Ini */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Selesai Diserahkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.completed}</span>
            <span className="text-xs text-slate-500">resep</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Resep selesai dilayani
          </div>
        </div>

        {/* Metrik 4: Peringatan Stok & ED */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stok Kritis / Dekat ED</span>
            <Pill className="w-4 h-4 text-[#155ea3]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {metrics.lowStockCount}
            </span>
            <span className="text-xs text-slate-500">stok kritis</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {expiringBatches.length} batch mendekati kadaluwarsa
          </div>
        </div>
      </div>

      {/* Grid Utama: Tabel Resep + Panel Peringatan Ringkas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kolom Kiri: Tabel Antrean Resep (8 Kolom) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#d4e7f3] shadow-2xs overflow-hidden flex flex-col">
          {/* Header Tabel */}
          <div className="p-4 border-b border-[#e2eef6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fbfe]">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'Semua', count: prescriptions.length },
                { id: 'pending', label: 'Menunggu', count: metrics.pending },
                { id: 'preparing', label: 'Diracik', count: metrics.preparing },
                { id: 'completed', label: 'Selesai', count: metrics.completed },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-[#155ea3] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-[#155ea3]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id 
                      ? 'bg-white/20 text-white' 
                      : tab.alert ? 'bg-rose-100 text-[#ec1415] font-bold' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Input Pencarian Ringkas */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pasien / RM / resep..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-hidden focus:border-[#155ea3] focus:ring-1 focus:ring-[#155ea3]"
              />
            </div>
          </div>

          {/* Isi Tabel */}
          <div className="overflow-x-auto flex-1">
            {filteredPrescriptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                Tidak ada data resep yang sesuai kriteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/70">
                    <th className="py-2.5 px-3.5">Kode Resep</th>
                    <th className="py-2.5 px-3.5">Pasien</th>
                    <th className="py-2.5 px-3.5">Dokter</th>
                    <th className="py-2.5 px-3.5 text-center">Item</th>
                    <th className="py-2.5 px-3.5">Waktu</th>
                    <th className="py-2.5 px-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPrescriptions.map(rx => (
                    <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-900 font-medium">
                        <span>{rx.prescription_code}</span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900">{rx.patient_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rx.medical_record_number} · {rx.gender === 'L' ? 'L' : 'P'}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-slate-600">
                        {rx.doctor_name}
                      </td>

                      <td className="py-3 px-3.5 text-center font-medium text-slate-600">
                        {rx.item_count} obat
                      </td>

                      <td className="py-3 px-3.5 text-slate-500">
                        {timeAgo(rx.created_at)}
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rx.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : rx.status === 'preparing'
                            ? 'bg-blue-100 text-[#155ea3]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {rx.status === 'pending' ? 'Menunggu' : rx.status === 'preparing' ? 'Diracik' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3.5 border-t border-[#e2eef6] bg-[#f8fbfe] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Menampilkan {filteredPrescriptions.length} dari {prescriptions.length} resep</span>
            {role === 'apoteker' && (
              <button
                onClick={() => setActiveSubTab('queue_dispensing')}
                className="text-[#155ea3] font-semibold hover:text-[#0f3d6b] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Ruang Peracikan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Peringatan Stok & Informasi Kadaluwarsa (4 Kolom) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card: Stok Obat Kritis */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e2eef6] flex items-center justify-between bg-[#f8fbfe]">
              <h2 className="text-xs font-bold text-[#0f3d6b] uppercase tracking-wider">
                Stok Menipis / Kritis
              </h2>
              {role === 'admin' && (
                <button
                  onClick={() => setActiveSubTab('inventory_master')}
                  className="text-[11px] text-[#155ea3] hover:text-[#0f3d6b] cursor-pointer font-semibold"
                >
                  Semua
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {metrics.lowStockMeds.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Semua stok obat dalam batas aman.
                </div>
              ) : (
                metrics.lowStockMeds.map((m, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-slate-900 truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Min. {m.min_stock_alert} {m.base_unit}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">{m.total_stock} {m.base_unit}</div>
                      <span className={`inline-block text-[9px] font-semibold uppercase ${
                        m.stockStatus === 'Kritis' || m.stockStatus === 'Habis' 
                          ? 'text-rose-600' 
                          : 'text-amber-600'
                      }`}>
                        {m.stockStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Batch Mendekati Kadaluwarsa (<60 Hari) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e2eef6] flex items-center justify-between bg-[#f8fbfe]">
              <h2 className="text-xs font-bold text-[#0f3d6b] uppercase tracking-wider">
                Kadaluwarsa Terdekat
              </h2>
              <span className="text-[11px] font-semibold text-[#155ea3] bg-blue-50 px-2 py-0.5 rounded-full">{expiringBatches.length} batch</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {expiringBatches.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Tidak ada batch obat mendekati ED (&lt;60 hari).
                </div>
              ) : (
                expiringBatches.slice(0, 4).map((b, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-slate-900 truncate">{b.medicine_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Batch: {b.batch_number} · Rak: {b.rack_location || '-'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-semibold text-xs ${
                        b.daysUntilExpiry <= 30 ? 'text-rose-600' : 'text-amber-700'
                      }`}>
                        {b.daysUntilExpiry} hari
                      </div>
                      <div className="text-[10px] text-slate-400">{b.expired_date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

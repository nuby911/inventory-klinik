import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Pill, 
  Search, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ReportRecapView() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('daily');
  // Default to today, or if no data, allow changing date
  const [selectedDate, setSelectedDate] = useState(() => {
    // If today is after seeded dates, default to 2026-09-10 to see immediate rich data, or current ISO date
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getRecapReport({
        period,
        date: selectedDate
      });
      if (res && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan rekap:', err);
      setErrorMessage(err.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const metrics = reportData?.metrics || {
    totalPrescriptions: 0,
    completedPrescriptions: 0,
    preparingPrescriptions: 0,
    pendingPrescriptions: 0,
    cancelledPrescriptions: 0,
    citoPrescriptions: 0,
    completionRate: 0,
    totalAdjustments: 0,
    totalAdjustedUnits: 0
  };

  const topMedicines = useMemo(() => reportData?.topMedicines || [], [reportData]);
  const dailyTrends = useMemo(() => reportData?.dailyTrends || [], [reportData]);
  const prescriptions = useMemo(() => reportData?.prescriptions || [], [reportData]);

  // Filtered prescription details table
  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase();
    return prescriptions.filter(p => 
      (p.prescription_code?.toLowerCase().includes(q)) ||
      (p.patient_name?.toLowerCase().includes(q)) ||
      (p.medical_record_number?.toLowerCase().includes(q)) ||
      (p.doctor_name?.toLowerCase().includes(q)) ||
      (p.medicines_summary?.toLowerCase().includes(q))
    );
  }, [prescriptions, searchQuery]);

  // Max quantity for top medicines progress bar
  const maxMedicineQty = useMemo(() => {
    if (!topMedicines.length) return 1;
    return Math.max(...topMedicines.map(m => m.total_quantity_base || 0), 1);
  }, [topMedicines]);

  // Quick period labels
  const getPeriodLabel = () => {
    if (period === 'daily') return `Harian (${selectedDate})`;
    if (period === 'weekly') return `Mingguan (7 Hari s.d. ${selectedDate})`;
    if (period === 'monthly') return `Bulanan (${selectedDate.slice(0, 7)})`;
    return 'Semua Data';
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!prescriptions.length) {
      alert('Tidak ada data resep dalam periode ini untuk diekspor.');
      return;
    }

    const headers = ['No', 'Kode Resep', 'Tanggal & Waktu', 'No RM', 'Nama Pasien', 'Dokter', 'Jumlah R/', 'Daftar Obat', 'Status', 'Prioritas'];
    const rows = prescriptions.map((p, idx) => [
      idx + 1,
      `"${p.prescription_code}"`,
      `"${p.created_at}"`,
      `"${p.medical_record_number || '-'}"`,
      `"${p.patient_name || '-'}"`,
      `"${p.doctor_name || '-'}"`,
      p.item_count || 0,
      `"${(p.medicines_summary || '-').replace(/"/g, '""')}"`,
      `"${p.status}"`,
      p.is_cito === 1 ? 'CITO' : 'Biasa'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Laporan_Almedika_${period}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print Stylesheet Inject */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Controls Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e2eef6] shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf4fb] text-[#0284c7] text-xs font-bold tracking-wide">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>SIM Farmasi Almedika — Modul Rekapitulasi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#030879] tracking-tight">
              Rekap & Laporan Operasional
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Ringkasan peresepan, pelayanan farmasi, dan mutasi obat untuk periode: <span className="font-bold text-[#0284c7]">{getPeriodLabel()}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#299dc9] text-[#0284c7] hover:bg-[#eaf4fb] text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0284c7]" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#060eff] hover:bg-[#030879] text-white text-xs font-bold shadow-md shadow-blue-700/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Unduh CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Period Bar */}
        <div className="mt-5 pt-4 border-t border-[#e2eef6] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Period Selector Tabs */}
          <div className="inline-flex p-1 bg-[#f0f7fb] rounded-xl border border-[#d4e7f3]">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'daily'
                  ? 'bg-white text-[#030879] shadow-xs'
                  : 'text-slate-600 hover:text-[#030879]'
              }`}
            >
              Harian (Hari Ini)
            </button>

            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'weekly'
                  ? 'bg-white text-[#030879] shadow-xs'
                  : 'text-slate-600 hover:text-[#030879]'
              }`}
            >
              Mingguan (7 Hari)
            </button>

            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'monthly'
                  ? 'bg-white text-[#030879] shadow-xs'
                  : 'text-slate-600 hover:text-[#030879]'
              }`}
            >
              Bulanan (30 Hari)
            </button>

            <button
              onClick={() => setPeriod('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'all'
                  ? 'bg-white text-[#030879] shadow-xs'
                  : 'text-slate-600 hover:text-[#030879]'
              }`}
            >
              Semua Periode
            </button>
          </div>

          {/* Reference Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Patokan Tanggal:
            </span>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-[#d4e7f3] text-slate-800 text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]/40 shadow-2xs"
              />
            </div>
            <button
              onClick={fetchReport}
              title="Perbarui Data"
              className="p-2 rounded-xl border border-[#d4e7f3] bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0284c7]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 no-print">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Report Container (Printable Area) */}
      <div id="print-area" className="space-y-6">
        {/* Printable Official Header (Shown during print) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                KLINIK UTAMA ALMEDIKA
              </h2>
              <p className="text-xs text-slate-600">
                Instalasi Farmasi & Pelayanan Rawat Jalan Terpadu
              </p>
              <p className="text-[11px] text-slate-500">
                Jl. Pemuda No. 45, Telp: (0727) 321889 — Bandar Lampung
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 uppercase">
                DOKUMEN REKAPITULASI PELAYANAN
              </div>
              <div className="text-xs text-slate-600">
                Periode: <span className="font-semibold">{getPeriodLabel()}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Dicetak oleh: {currentUser?.name} ({currentUser?.role})
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Prescriptions */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2eef6] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total E-Resep
              </span>
              <div className="text-2xl font-black text-[#030879]">
                {metrics.totalPrescriptions}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Resep masuk dalam periode
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#eaf4fb] text-[#0284c7] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Completed & Rate */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2eef6] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Resep Selesai
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">
                  {metrics.completedPrescriptions}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {metrics.completionRate}%
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Telah diserahkan ke pasien
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: CITO & Pending */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2eef6] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Darurat / CITO
              </span>
              <div className="text-2xl font-black text-rose-600">
                {metrics.citoPrescriptions}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Antrean menunggu: <span className="font-semibold text-slate-700">{metrics.pendingPrescriptions}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Mutasi / Retur Stok */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2eef6] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Penyesuaian Stok
              </span>
              <div className="text-2xl font-black text-amber-600">
                {metrics.totalAdjustments} <span className="text-xs font-normal text-slate-500">laporan</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Total item: <span className="font-semibold text-slate-700">{metrics.totalAdjustedUnits} unit</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Two Columns: Top Medicines & Daily Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Top 10 Prescribed Medicines */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e2eef6] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#0284c7]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Obat Paling Banyak Diresepkan
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Top {topMedicines.length} Item
              </span>
            </div>

            {topMedicines.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Tidak ada data pengeluaran obat pada rentang waktu ini.
              </div>
            ) : (
              <div className="space-y-3.5">
                {topMedicines.map((med, idx) => {
                  const percentage = Math.round((med.total_quantity_base / maxMedicineQty) * 100);
                  return (
                    <div key={med.id || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">
                            {med.medicine_name}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                            {med.category || 'Obat'}
                          </span>
                        </div>
                        <div className="font-black text-[#030879]">
                          {med.total_quantity_base} <span className="text-[10px] font-semibold text-slate-500">{med.base_unit}</span>
                        </div>
                      </div>

                      {/* Progress FEFO Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#299dc9] to-[#060eff] rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Daily Trends Breakdown in Range */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e2eef6] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Aktivitas Resep Harian dalam Rentang
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {dailyTrends.length} Hari Terdata
              </span>
            </div>

            {dailyTrends.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Tidak ada catatan transaksi resep harian pada periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2">Tanggal</th>
                      <th className="py-2 text-center">Total Resep</th>
                      <th className="py-2 text-center">Selesai</th>
                      <th className="py-2 text-center">CITO</th>
                      <th className="py-2 text-right">Tingkat Layanan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {dailyTrends.map((t, i) => {
                      const rate = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;
                      return (
                        <tr key={i} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 font-bold text-slate-800">
                            {t.date}
                          </td>
                          <td className="py-2.5 text-center font-bold text-[#030879]">
                            {t.total}
                          </td>
                          <td className="py-2.5 text-center text-emerald-600 font-bold">
                            {t.completed}
                          </td>
                          <td className="py-2.5 text-center">
                            {t.cito > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                {t.cito} CITO
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-700">
                            {rate}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Prescriptions Table */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e2eef6] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rincian Transaksi Resep ({filteredPrescriptions.length})
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Daftar seluruh resep dan status dispensing pada periode terpilih
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-64 no-print">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode resep, pasien, dokter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#d4e7f3] bg-[#f8fbfe] text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]/30 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Kode Resep</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Pasien & No. RM</th>
                  <th className="py-3 px-3">Dokter Pemeriksa</th>
                  <th className="py-3 px-3">Rincian Obat</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada resep yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((p) => {
                    const isCito = p.is_cito === 1;
                    const isCompleted = p.status === 'completed';
                    const isPreparing = p.status === 'preparing';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-bold text-[#0284c7]">
                          {p.prescription_code}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {p.created_at ? p.created_at.slice(0, 16).replace('T', ' ') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {p.patient_name || 'Pasien Anonim'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.medical_record_number || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {p.doctor_name || 'Dokter'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={p.medicines_summary}>
                          {p.medicines_summary || `${p.item_count || 0} item obat`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-700'
                              : isPreparing
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.status === 'completed' ? 'Selesai' : p.status === 'preparing' ? 'Disiapkan' : 'Menunggu'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isCito ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                              CITO
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Reguler
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Signature Footer (Shown only during print) */}
        <div className="hidden print:grid grid-cols-3 gap-6 pt-12 text-center text-xs text-slate-800">
          <div>
            <p className="font-semibold">Penanggung Jawab Medis</p>
            <div className="h-16" />
            <p className="font-bold underline">Dokter</p>
            <p className="text-[10px] text-slate-500">SIP: 503/442/SIP.D/2024</p>
          </div>
          <div>
            <p className="font-semibold">Penanggung Jawab Farmasi</p>
            <div className="h-16" />
            <p className="font-bold underline">Apoteker</p>
            <p className="text-[10px] text-slate-500">SIPA: 19890412/SIPA_18.01/2021</p>
          </div>
          <div>
            <p className="font-semibold">Mengetahui & Menyetujui</p>
            <div className="h-16" />
            <p className="font-bold underline">Kepala Klinik Almedika</p>
            <p className="text-[10px] text-slate-500">NIP: 19800515 200501 1 002</p>
          </div>
        </div>
      </div>
    </div>
  );
}

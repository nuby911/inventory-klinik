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
  Activity,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { getCurrentLocalDateString, formatDateTimeWIB } from '../../utils/dateUtils';

export default function ReportRecapView() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('daily');
  // Default to today in WIB
  const [selectedDate, setSelectedDate] = useState(() => getCurrentLocalDateString());

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

    const headers = ['No', 'Kode Resep', 'Tanggal & Waktu', 'No RM', 'Nama Pasien', 'Dokter', 'Jumlah R/', 'Daftar Obat', 'Status'];
    const rows = prescriptions.map((p, idx) => [
      idx + 1,
      `"${p.prescription_code}"`,
      `"${p.created_at}"`,
      `"${p.medical_record_number || '-'}"`,
      `"${p.patient_name || '-'}"`,
      `"${p.doctor_name || '-'}"`,
      p.item_count || 0,
      `"${(p.medicines_summary || '-').replace(/"/g, '""')}"`,
      `"${p.status}"`
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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f2fc] text-[#155ea3] text-xs font-bold tracking-wide">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>SIM Farmasi Klinik ELMedika — Modul Rekapitulasi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f3d6b] tracking-tight">
              Rekap & Laporan Operasional
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Ringkasan peresepan, pelayanan farmasi, dan mutasi obat untuk periode: <span className="font-bold text-[#155ea3]">{getPeriodLabel()}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#155ea3] text-[#155ea3] hover:bg-blue-50 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#155ea3]" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#155ea3] hover:bg-[#0f3d6b] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Period Bar */}
        <div className="mt-5 pt-4 border-t border-[#e2eef6] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                period === 'daily'
                  ? 'bg-white text-[#155ea3] shadow-xs'
                  : 'text-slate-600 hover:text-[#155ea3]'
              }`}
            >
              Harian
            </button>

            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                period === 'weekly'
                  ? 'bg-white text-[#155ea3] shadow-xs'
                  : 'text-slate-600 hover:text-[#155ea3]'
              }`}
            >
              Mingguan
            </button>

            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                period === 'monthly'
                  ? 'bg-white text-[#155ea3] shadow-xs'
                  : 'text-slate-600 hover:text-[#155ea3]'
              }`}
            >
              Bulanan
            </button>

            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                period === 'all'
                  ? 'bg-white text-[#155ea3] shadow-xs'
                  : 'text-slate-600 hover:text-[#155ea3]'
              }`}
            >
              Semua Periode
            </button>
          </div>

          {/* Reference Date Picker */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Patokan Tanggal:
            </span>
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#155ea3]/40 shadow-2xs"
              />
            </div>
            <button
              onClick={fetchReport}
              title="Perbarui Data"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#155ea3]' : ''}`} />
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
            <div className="flex items-center gap-3.5">
              <img src="/logo-badge.png" alt="Logo Klinik" className="w-16 h-16 object-contain shrink-0" />
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  KLINIK ELMEDIKA · RUMAH SUNAT ELNARA
                </h2>
                <p className="text-xs text-slate-600 font-semibold">
                  Praktek Dokter & Rumah Sunat Modern — SIM Farmasi & Rawat Jalan Terpadu
                </p>
                <p className="text-[11px] text-slate-500">
                  Jl. Pemuda No. 45, Telp: (0727) 321889 — Bandar Lampung · Nyaman, Modern, Profesional
                </p>
              </div>
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total E-Resep
              </span>
              <div className="text-2xl font-black text-[#0f3d6b]">
                {metrics.totalPrescriptions}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Resep masuk dalam periode
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#155ea3] flex items-center justify-center shrink-0">
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

          {/* Card 3: Antrean Menunggu */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2eef6] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Antrean Menunggu
              </span>
              <div className="text-2xl font-black text-amber-600">
                {metrics.pendingPrescriptions}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Sedang diracik: <span className="font-semibold text-slate-700">{metrics.preparingPrescriptions}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
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
                <Pill className="w-4 h-4 text-[#155ea3]" />
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
                        <div className="font-black text-[#0f3d6b]">
                          {med.total_quantity_base} <span className="text-[10px] font-semibold text-slate-500">{med.base_unit}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#155ea3] to-[#ec1415] rounded-full transition-all duration-300"
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
                      <th className="py-2 text-center">Menunggu</th>
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
                          <td className="py-2.5 text-center font-bold text-[#0f3d6b]">
                            {t.total}
                          </td>
                          <td className="py-2.5 text-center text-emerald-600 font-bold">
                            {t.completed}
                          </td>
                          <td className="py-2.5 text-center text-amber-600 font-semibold">
                            {t.pending || 0}
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
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-[#f8fbfe] text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#155ea3]/30 transition"
              />
            </div>
          </div>

          {/* Mobile Card View for Report Prescriptions */}
          <div className="divide-y divide-slate-100 sm:hidden">
            {filteredPrescriptions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada resep yang sesuai kriteria pencarian.
              </div>
            ) : (
              filteredPrescriptions.map((p) => {
                const isCompleted = p.status === 'completed';
                const isPreparing = p.status === 'preparing';

                return (
                  <div key={p.id} className="py-3 px-3 space-y-2 hover:bg-slate-50/60 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-[#155ea3] font-mono">
                        {p.prescription_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPreparing
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status === 'completed' ? 'Selesai' : p.status === 'preparing' ? 'Disiapkan' : 'Menunggu'}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {p.patient_name || 'Pasien Anonim'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.medical_record_number || '-'} · {p.doctor_name || 'Dokter'}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/60 p-2 rounded-lg">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Rincian Obat:</div>
                      {p.medicines_summary || `${p.item_count || 0} item obat`}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{formatDateTimeWIB(p.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop & Print Table View */}
          <div className="hidden sm:block print:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Kode Resep</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Pasien & No. RM</th>
                  <th className="py-3 px-3">Dokter Pemeriksa</th>
                  <th className="py-3 px-3">Rincian Obat</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada resep yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((p) => {
                    const isCompleted = p.status === 'completed';
                    const isPreparing = p.status === 'preparing';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-bold text-[#155ea3]">
                          {p.prescription_code}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                          {formatDateTimeWIB(p.created_at)}
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
            <p className="font-bold underline">Kepala Klinik ELMedika</p>
            <p className="text-[10px] text-slate-500">NIP: 19800515 200501 1 002</p>
          </div>
        </div>
      </div>
    </div>
  );
}

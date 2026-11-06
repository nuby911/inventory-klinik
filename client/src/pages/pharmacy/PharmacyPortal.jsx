import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/useSocket';
import EtiketModal from '../../components/pharmacy/EtiketModal';

export default function PharmacyPortal({ activeSubTab }) {
  const { socket } = useSocket();

  // Queue state
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [pharmacyMobileTab, setPharmacyMobileTab] = useState('queue'); // 'queue' | 'workstation' for mobile (< lg)

  // Checklist 5 Benar
  const [checklist, setChecklist] = useState({
    patient: false,
    medicine: false,
    dose: false,
    time: false,
    route: false
  });

  // Etiket Modal
  const [etiketOpen, setEtiketOpen] = useState(false);
  const [etiketData, setEtiketData] = useState(null);
  const [dispensing, setDispensing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Low Stock State
  const [lowStockMeds, setLowStockMeds] = useState([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  const loadRxDetail = React.useCallback(async (id) => {
    try {
      const res = await api.getPrescriptionById(id);
      setSelectedRx(res.data);
      setChecklist({
        patient: false,
        medicine: false,
        dose: false,
        time: false,
        route: false
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const selectedRxRef = React.useRef(selectedRx);
  useEffect(() => {
    selectedRxRef.current = selectedRx;
  }, [selectedRx]);

  const loadPrescriptions = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getPrescriptions();
      setPrescriptions(res.data);
      if (res.data.length > 0 && !selectedRxRef.current) {
        loadRxDetail(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loadRxDetail]);

  const loadStockAlerts = React.useCallback(async () => {
    try {
      const medsRes = await api.getMedicines();
      setLowStockMeds(medsRes.data.filter(m => m.stockStatus !== 'Aman'));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
    loadStockAlerts();
  }, [loadPrescriptions, loadStockAlerts]);

  useEffect(() => {
    if (!socket) return;
    const handleNewRx = (newRx) => {
      setPrescriptions(prev => [newRx, ...prev.filter(p => p.id !== newRx.id)]);
      if (!selectedRxRef.current) loadRxDetail(newRx.id);
    };
    const handleStatusChanged = ({ id, status }) => {
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      if (selectedRxRef.current && selectedRxRef.current.id === id) {
        setSelectedRx(prev => ({ ...prev, status }));
      }
    };
    const handleDispensed = (data) => {
      setPrescriptions(prev => prev.map(p => p.id === data.prescriptionId ? { ...p, status: 'completed' } : p));
      if (selectedRxRef.current && selectedRxRef.current.id === data.prescriptionId) {
        setSelectedRx(prev => ({ ...prev, status: 'completed' }));
      }
    };
    const handleStockUpdated = () => {
      loadStockAlerts();
    };

    socket.on('prescription:new', handleNewRx);
    socket.on('prescription:status_changed', handleStatusChanged);
    socket.on('prescription:dispensed', handleDispensed);
    socket.on('stock:updated', handleStockUpdated);

    return () => {
      socket.off('prescription:new', handleNewRx);
      socket.off('prescription:status_changed', handleStatusChanged);
      socket.off('prescription:dispensed', handleDispensed);
      socket.off('stock:updated', handleStockUpdated);
    };
  }, [socket, loadStockAlerts, loadRxDetail]);

  const handleStartPreparing = async () => {
    if (!selectedRx) return;
    try {
      await api.updatePrescriptionStatus(selectedRx.id, 'preparing');
      setSelectedRx(prev => ({ ...prev, status: 'preparing' }));
      setActionSuccess('Status resep diperbarui: Sedang Diracik.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDispense = async () => {
    if (!selectedRx) return;
    const allChecked = Object.values(checklist).every(Boolean);
    if (!allChecked) {
      setActionError('Harap selesaikan verifikasi 5 Benar Farmasi sebelum penyerahan obat.');
      return;
    }

    setDispensing(true);
    setActionError(null);

    try {
      await api.dispensePrescription(selectedRx.id);
      setActionSuccess('Dispensing selesai. Stok obat berhasil dipotong.');
      loadRxDetail(selectedRx.id);
      loadPrescriptions();
      loadStockAlerts();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Gagal memproses dispensing');
    } finally {
      setDispensing(false);
    }
  };

  const handleOpenEtiket = async () => {
    if (!selectedRx) return;
    try {
      const res = await api.getEtiketData(selectedRx.id);
      setEtiketData(res.data);
      setEtiketOpen(true);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filteredStockMeds = lowStockMeds.filter(m => {
    const matchesSearch = stockSearchQuery.trim() === '' || 
      m.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      (m.rack_location && m.rack_location.toLowerCase().includes(stockSearchQuery.toLowerCase()));
    const matchesStatus = stockStatusFilter === 'all' || m.stockStatus === stockStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const waitingCount = prescriptions.filter(p => p.status === 'pending').length;
  const preparingCount = prescriptions.filter(p => p.status === 'preparing').length;
  const completedCount = prescriptions.filter(p => p.status === 'completed').length;

  const filteredQueue = prescriptions.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const completedPrescriptions = prescriptions.filter(p => p.status === 'completed');

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-7xl mx-auto font-sans">
      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs font-medium text-emerald-900 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}>✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs font-medium text-rose-900 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>✕</button>
        </div>
      )}

      {/* SubTab 1: Antrean & Penyiapan Resep */}
      {activeSubTab === 'queue_dispensing' && (
        <div className="space-y-4">
          {/* Quick Counters Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Menunggu</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{waitingCount}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Sedang Diracik</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{preparingCount}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Selesai Hari Ini</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{completedCount}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Antrean</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{prescriptions.length}</div>
            </div>
          </div>

          {/* Mobile Segmented Switcher (< lg) */}
          <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-xl mb-3 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPharmacyMobileTab('queue')}
              className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                pharmacyMobileTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋 Antrean Masuk</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {filteredQueue.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPharmacyMobileTab('workstation')}
              className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                pharmacyMobileTab === 'workstation'
                  ? 'bg-[#155ea3] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>💊 Meja Racik</span>
              {selectedRx && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  pharmacyMobileTab === 'workstation' ? 'bg-white text-[#155ea3]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedRx.prescription_code}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Queue List (5 cols) */}
            <div className={`lg:col-span-5 space-y-3 ${pharmacyMobileTab === 'queue' ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    Antrean Masuk
                  </span>
                  <button onClick={loadPrescriptions} className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer">
                    Muat Ulang
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'pending', label: 'Menunggu' },
                    { key: 'preparing', label: 'Diracik' },
                    { key: 'completed', label: 'Selesai' }
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setFilterStatus(t.key)}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                        filterStatus === t.key
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Memuat antrean...</div>
                ) : filteredQueue.map(rx => {
                  const isSelected = selectedRx?.id === rx.id;
                  return (
                    <div
                      key={rx.id}
                      onClick={() => {
                        loadRxDetail(rx.id);
                        setPharmacyMobileTab('workstation');
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{rx.prescription_code}</span>
                          </div>
                          <div className="font-semibold text-slate-800 mt-0.5">{rx.patient_name}</div>
                          <div className="text-[11px] text-slate-500">{rx.medical_record_number} • {rx.doctor_name}</div>
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          rx.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : rx.status === 'preparing'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {rx.status === 'pending' ? 'Menunggu' : rx.status === 'preparing' ? 'Diracik' : 'Selesai'}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{rx.item_count} item obat</span>
                        <span>{new Date(rx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Dispensing Workstation (7 cols) */}
            <div className={`lg:col-span-7 space-y-3 ${pharmacyMobileTab === 'workstation' ? 'block' : 'hidden lg:block'}`}>
              {/* Mobile Back Button to Queue */}
              <div className="lg:hidden pb-1">
                <button
                  type="button"
                  onClick={() => setPharmacyMobileTab('queue')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>← Kembali ke Antrean Masuk</span>
                </button>
              </div>

              {selectedRx ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3.5 text-xs">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{selectedRx.patient_name}</span>
                        <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {selectedRx.medical_record_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        No. Resep: <span className="font-mono">{selectedRx.prescription_code}</span> • Dokter: {selectedRx.doctor_name}
                      </div>
                    </div>

                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                      {selectedRx.status === 'pending' ? 'Status: Menunggu' : selectedRx.status === 'preparing' ? 'Status: Sedang Diracik' : 'Status: Selesai'}
                    </span>
                  </div>

                  {selectedRx.allergies && selectedRx.allergies !== 'Tidak Ada' && (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-900 font-semibold text-[11px]">
                      Riwayat Alergi Pasien: {selectedRx.allergies}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2.5">
                    <div className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      Daftar Obat Resep
                    </div>

                    {selectedRx.items && selectedRx.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{item.medicine_name}</span>
                              {Boolean(item.is_racikan) && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">
                                  Racikan: {item.racikan_name || 'Formula Puyer'}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              Kebutuhan: <b>{item.quantity_input} {item.unit_selected}</b> ({item.quantity_base_unit} {item.base_unit}) • Lokasi: {item.rack_location || 'Rak Utama'}
                            </div>
                          </div>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 text-[11px]">
                            {item.dosage_instruction}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 5 Benar Checklist */}
                  {selectedRx.status !== 'completed' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] uppercase">
                          Verifikasi 5 Benar Farmasi:
                        </span>
                        <button
                          type="button"
                          onClick={() => setChecklist({ patient: true, medicine: true, dose: true, time: true, route: true })}
                          className="text-[11px] text-slate-600 underline hover:text-slate-900 cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
                        {[
                          { key: 'patient', label: '1. Pasien' },
                          { key: 'medicine', label: '2. Obat' },
                          { key: 'dose', label: '3. Dosis' },
                          { key: 'time', label: '4. Waktu' },
                          { key: 'route', label: '5. Rute' }
                        ].map(chk => (
                          <label key={chk.key} className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checklist[chk.key]}
                              onChange={(e) => setChecklist({ ...checklist, [chk.key]: e.target.checked })}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0"
                            />
                            <span>{chk.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenEtiket}
                      className="w-full sm:w-auto px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg font-semibold text-xs cursor-pointer text-center"
                    >
                      Cetak Etiket Aturan Pakai
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      {selectedRx.status === 'pending' && (
                        <button
                          type="button"
                          onClick={handleStartPreparing}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-lg font-semibold text-xs cursor-pointer text-center"
                        >
                          Mulai Diracik
                        </button>
                      )}

                      {selectedRx.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={handleDispense}
                          disabled={dispensing}
                          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50 text-center shadow-xs active:scale-98"
                        >
                          {dispensing ? 'Memproses...' : 'Konfirmasi Penyerahan & Potong Stok'}
                        </button>
                      ) : (
                        <span className="w-full sm:w-auto px-3.5 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs text-center">
                          Obat Telah Diserahkan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-10 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                  Pilih resep dari daftar antrean.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Peringatan Stok Obat */}
      {(activeSubTab === 'stock_monitoring' || activeSubTab === 'expiry_monitoring') && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perlu Restock</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{lowStockMeds.length} <span className="text-xs font-normal text-slate-500">Obat</span></div>
              <div className="text-[11px] text-slate-500 mt-0.5">Stok di bawah batas aman</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 shadow-xs">
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Stok Kritis</div>
              <div className="text-2xl font-black text-rose-700 mt-1">
                {lowStockMeds.filter(m => m.stockStatus === 'Kritis').length}
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">≤ batas minimum klinik</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Stok Menipis</div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {lowStockMeds.filter(m => m.stockStatus === 'Menipis').length}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Mendekati batas minimum</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stok Habis (0)</div>
              <div className="text-2xl font-black text-slate-700 mt-1">
                {lowStockMeds.filter(m => m.stockStatus === 'Habis' || m.total_stock === 0).length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Harap segera hubungi logistik</div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Peringatan Stok Obat Menipis & Kritis
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Daftar seluruh sediaan obat farmasi yang berada di bawah batas minimum dan membutuhkan pengadaan
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari obat / kode / rak..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="Kritis">Kritis</option>
                  <option value="Menipis">Menipis</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Kode & Nama Obat</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Lokasi Rak</th>
                    <th className="py-2.5 px-3">Sisa Stok Fisik</th>
                    <th className="py-2.5 px-3">Batas Minimum</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStockMeds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada obat yang berada dalam status peringatan stok.
                      </td>
                    </tr>
                  ) : (
                    filteredStockMeds.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{m.code}</div>
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-600">{m.category || '-'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{m.rack_location || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {m.breakdownText} <span className="text-slate-500 font-normal">({m.total_stock} {m.base_unit})</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{m.min_stock_alert} {m.base_unit}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            m.stockStatus === 'Kritis' 
                              ? 'bg-rose-50 text-rose-800 border-rose-200' 
                              : m.stockStatus === 'Menipis' 
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {m.stockStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Riwayat Penyerahan Obat */}
      {activeSubTab === 'dispensed_history' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-2">
            Riwayat Resep Selesai Diserahkan ({completedPrescriptions.length})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Resep</th>
                  <th className="py-2.5 px-3">Pasien & No. RM</th>
                  <th className="py-2.5 px-3">Dokter Pengirim</th>
                  <th className="py-2.5 px-3">Waktu Resep Masuk</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {completedPrescriptions.map(rx => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{rx.prescription_code}</td>
                    <td className="py-2.5 px-3">{rx.patient_name} ({rx.medical_record_number})</td>
                    <td className="py-2.5 px-3">{rx.doctor_name}</td>
                    <td className="py-2.5 px-3 text-[11px]">{new Date(rx.created_at).toLocaleTimeString('id-ID')} WIB</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px] border border-emerald-200">
                        Diserahkan
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EtiketModal
        isOpen={etiketOpen}
        onClose={() => setEtiketOpen(false)}
        etiketData={etiketData}
      />
    </div>
  );
}

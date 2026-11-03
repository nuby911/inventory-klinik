import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/useSocket';
import { useAuth } from '../../context/useAuth';
import EtiketModal from '../../components/pharmacy/EtiketModal';

export default function PharmacyPortal({ activeSubTab }) {
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  // Queue state
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

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

  // Expiring Batches & Low Stock
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [lowStockMeds, setLowStockMeds] = useState([]);

  // Damage reporting form
  const [batches, setBatches] = useState([]);
  const [damageForm, setDamageForm] = useState({
    batch_id: '',
    quantity_input: 1,
    adjustment_type: 'damaged',
    reason: 'Pecah saat penataan ulang di rak fisik',
    distributor: 'Tempo Scan Pacific'
  });
  const [damageHistory, setDamageHistory] = useState([]);

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

  const loadPrescriptions = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getPrescriptions();
      setPrescriptions(res.data);
      if (res.data.length > 0 && !selectedRx) {
        loadRxDetail(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedRx, loadRxDetail]);

  const loadInventoryAlerts = React.useCallback(async () => {
    try {
      const [expRes, medsRes, batchRes, adjRes] = await Promise.all([
        api.getExpiringBatches(60),
        api.getMedicines(),
        api.getBatches(),
        api.getAdjustments({ adjustment_type: 'damaged' })
      ]);
      setExpiringBatches(expRes.data);
      setLowStockMeds(medsRes.data.filter(m => m.stockStatus !== 'Aman'));
      setBatches(batchRes.data);
      if (batchRes.data.length > 0 && !damageForm.batch_id) {
        setDamageForm(prev => ({ ...prev, batch_id: batchRes.data[0].id }));
      }
      setDamageHistory(adjRes.data);
    } catch (e) {
      console.error(e);
    }
  }, [damageForm.batch_id]);

  useEffect(() => {
    loadPrescriptions();
    loadInventoryAlerts();
  }, [loadPrescriptions, loadInventoryAlerts]);

  const selectedRxRef = React.useRef(selectedRx);
  useEffect(() => {
    selectedRxRef.current = selectedRx;
  }, [selectedRx]);

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
      loadInventoryAlerts();
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
  }, [socket, loadInventoryAlerts, loadRxDetail]);

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
      setActionSuccess('Dispensing selesai. Stok batch FEFO otomatis terpotong.');
      loadRxDetail(selectedRx.id);
      loadPrescriptions();
      loadInventoryAlerts();
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

  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    if (!damageForm.batch_id) return;
    try {
      await api.createAdjustment({
        batch_id: Number(damageForm.batch_id),
        user_id: currentUser?.id || 2,
        adjustment_type: damageForm.adjustment_type,
        quantity_input: Number(damageForm.quantity_input),
        reason: damageForm.reason,
        distributor: damageForm.distributor
      });
      setActionSuccess('Laporan kerusakan obat berhasil dicatat & stok batch terpotong.');
      loadInventoryAlerts();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Gagal mencatat obat rusak');
    }
  };

  const citoCount = prescriptions.filter(p => p.is_cito === 1 && p.status !== 'completed').length;
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

      {/* SubTab 1: Antrean & Dispensing FEFO */}
      {activeSubTab === 'queue_dispensing' && (
        <div className="space-y-4">
          {/* Quick Counters Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Resep CITO</div>
              <div className="text-xl font-bold text-rose-700 mt-0.5">{citoCount}</div>
            </div>
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Queue List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
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
                      onClick={() => loadRxDetail(rx.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{rx.prescription_code}</span>
                            {rx.is_cito === 1 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-600 text-white rounded">
                                CITO
                              </span>
                            )}
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
            <div className="lg:col-span-7 space-y-3">
              {selectedRx ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3.5 text-xs">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{selectedRx.patient_name}</span>
                        <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {selectedRx.medical_record_number}
                        </span>
                        {selectedRx.is_cito === 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-600 text-white rounded">
                            CITO
                          </span>
                        )}
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

                  {/* Items & FEFO Recommendation */}
                  <div className="space-y-2.5">
                    <div className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      Alokasi Batch FEFO
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

                        {item.fefoPreview && (
                          <div className="p-2 bg-white border border-slate-200 rounded text-[11px] space-y-1">
                            <div className="font-semibold text-slate-700">
                              Rekomendasi Batch FEFO:
                            </div>
                            {item.fefoPreview.allocation.map((alloc, aIdx) => (
                              <div key={aIdx} className="flex items-center justify-between font-mono text-slate-600">
                                <div>
                                  <span className="font-bold text-slate-900">Batch #{alloc.batchNumber}</span>
                                  <span className="ml-2">Exp: {alloc.expiredDate}</span>
                                </div>
                                <span className="font-bold text-slate-800">Ambil {alloc.takeQty} {item.base_unit}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleOpenEtiket}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded font-medium text-xs cursor-pointer"
                    >
                      Cetak Etiket Aturan Pakai
                    </button>

                    <div className="flex items-center gap-2">
                      {selectedRx.status === 'pending' && (
                        <button
                          type="button"
                          onClick={handleStartPreparing}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs cursor-pointer"
                        >
                          Mulai Diracik
                        </button>
                      )}

                      {selectedRx.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={handleDispense}
                          disabled={dispensing}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
                        >
                          {dispensing ? 'Memproses...' : 'Konfirmasi Penyerahan & Potong Stok'}
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
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

      {/* SubTab 2: Peringatan ED & Stok Kritis */}
      {activeSubTab === 'expiry_monitoring' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-2">
              Batch Mendekati Masa Kadaluarsa (&lt; 60 Hari)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Nama Obat & Kode</th>
                    <th className="py-2.5 px-3">Nomor Batch</th>
                    <th className="py-2.5 px-3">Tanggal Expired</th>
                    <th className="py-2.5 px-3">Sisa Waktu</th>
                    <th className="py-2.5 px-3">Stok di Rak</th>
                    <th className="py-2.5 px-3">Distributor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expiringBatches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{b.medicine_name}</td>
                      <td className="py-2.5 px-3 font-mono">#{b.batch_number}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">{b.expired_date}</td>
                      <td className="py-2.5 px-3 text-rose-700">{b.daysUntilExpiry} hari lagi</td>
                      <td className="py-2.5 px-3">{b.stock_qty} {b.base_unit} ({b.rack_location})</td>
                      <td className="py-2.5 px-3 text-slate-500">{b.distributor || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-2">
              Monitoring Obat Stok Menipis & Kritis
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Obat</th>
                    <th className="py-2.5 px-3">Sisa Stok Fisik</th>
                    <th className="py-2.5 px-3">Batas Minimum</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {lowStockMeds.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2.5 px-3">{m.breakdownText} ({m.total_stock} {m.base_unit})</td>
                      <td className="py-2.5 px-3">{m.min_stock_alert} {m.base_unit}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          m.stockStatus === 'Kritis' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {m.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Lapor Obat Rusak / Retur Farmasi */}
      {activeSubTab === 'damage_report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-4 space-y-3 text-xs">
            <div className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-2">
              Laporan Obat Rusak / Pecah di Rak
            </div>

            <form onSubmit={handleDamageSubmit} className="space-y-3">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Pilih Batch Obat:</label>
                <select
                  value={damageForm.batch_id}
                  onChange={(e) => setDamageForm({ ...damageForm, batch_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.medicine_name} — #{b.batch_number} ({b.stock_qty} {b.base_unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Jumlah Rusak:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={damageForm.quantity_input}
                    onChange={(e) => setDamageForm({ ...damageForm, quantity_input: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Tipe:</label>
                  <select
                    value={damageForm.adjustment_type}
                    onChange={(e) => setDamageForm({ ...damageForm, adjustment_type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="damaged">Rusak / Pecah</option>
                    <option value="expired_disposal">Kadaluarsa</option>
                    <option value="retur_supplier">Retur PBF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Alasan / Kronologi:</label>
                <textarea
                  rows="2"
                  required
                  value={damageForm.reason}
                  onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium cursor-pointer"
              >
                Catat Pengurangan Stok Rusak
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-4 space-y-3 text-xs">
            <div className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-2">
              Log Kerusakan & Pembuangan Obat Terbaru
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No. Ref</th>
                    <th className="py-2.5 px-3">Obat & Batch</th>
                    <th className="py-2.5 px-3">Potong</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {damageHistory.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.adjustment_code}</td>
                      <td className="py-2.5 px-3">{d.medicine_name} (#{d.batch_number})</td>
                      <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">-{d.quantity_base_unit} {d.base_unit}</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Riwayat Penyerahan Obat */}
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
                        Diserahkan (FEFO Cut)
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

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/useSocket';

function generateBatchDefaults(med) {
  if (!med) {
    return {
      batch_number: `BCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      expired_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      unit_selected: 'Butir',
      quantity_input: 5,
      rack_location: 'Rak Utama'
    };
  }
  const defaultUnit = med.units && med.units.length > 0 ? med.units[0].unit_name : med.base_unit;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return {
    batch_number: `BCH-${(med.code || 'MED').replace('MED-', '')}-${new Date().getFullYear()}-${randomSuffix}`,
    expired_date: nextYear,
    unit_selected: defaultUnit,
    quantity_input: 5,
    rack_location: med.rack_location || 'Rak Utama'
  };
}

export default function AdminPortal({ activeSubTab }) {
  const { socket } = useSocket();
  // Inventory State
  const [medicines, setMedicines] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Batches
  const [batches, setBatches] = useState([]);

  // Modals & Forms
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedMedForRestock, setSelectedMedForRestock] = useState(null);
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);

  const [restockForm, setRestockForm] = useState({
    batch_number: '',
    expired_date: '',
    unit_selected: '',
    quantity_input: 5,
    rack_location: ''
  });

  const [newMedForm, setNewMedForm] = useState({
    code: '',
    name: '',
    category: 'padat',
    base_unit: 'Butir',
    min_stock_alert: 20,
    rack_location: 'Rak A-01',
    contraindications: '',
    box_ratio: 100,
    strip_ratio: 10,
    bpom_nie: '',
    barcode: ''
  });

  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [medsRes, kpiRes, batchRes] = await Promise.all([
        api.getMedicines(),
        api.getMedicineKpis(),
        api.getBatches()
      ]);
      setMedicines(medsRes.data);
      setKpis(kpiRes.data);
      setBatches(batchRes.data);
    } catch (e) {
      console.error('loadAllData error:', e);
      setActionError('Gagal memuat data inventori: ' + (e.message || 'Koneksi error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleLiveRefresh = () => {
      loadAllData();
    };
    socket.on('stock:updated', handleLiveRefresh);
    socket.on('prescription:dispensed', handleLiveRefresh);
    return () => {
      socket.off('stock:updated', handleLiveRefresh);
      socket.off('prescription:dispensed', handleLiveRefresh);
    };
  }, [socket, loadAllData]);

  const openRestock = (med = null) => {
    const targetMed = med || (medicines.length > 0 ? medicines[0] : null);
    setSelectedMedForRestock(targetMed);
    setRestockForm(generateBatchDefaults(targetMed));
    setRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedForRestock) return;
    try {
      await api.addBatch({
        medicine_id: selectedMedForRestock.id,
        batch_number: restockForm.batch_number,
        expired_date: restockForm.expired_date,
        unit_selected: restockForm.unit_selected,
        quantity_input: Number(restockForm.quantity_input),
        rack_location: restockForm.rack_location
      });
      setActionSuccess(`Batch ${restockForm.batch_number} berhasil dicatat.`);
      setRestockModalOpen(false);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Gagal restock');
    }
  };

  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    try {
      const units = [];
      if (newMedForm.category === 'padat') {
        if (newMedForm.box_ratio > 1) units.push({ unit_name: 'Box', conversion_ratio: Number(newMedForm.box_ratio) });
        if (newMedForm.strip_ratio > 1) units.push({ unit_name: 'Strip', conversion_ratio: Number(newMedForm.strip_ratio) });
      } else if (newMedForm.category === 'cair') {
        units.push({ unit_name: 'Karton', conversion_ratio: 24 });
      } else if (newMedForm.category === 'salep') {
        units.push({ unit_name: 'Box', conversion_ratio: 12 });
      }

      await api.createMedicine({
        code: newMedForm.code,
        name: newMedForm.name,
        category: newMedForm.category,
        base_unit: newMedForm.base_unit,
        min_stock_alert: Number(newMedForm.min_stock_alert),
        rack_location: newMedForm.rack_location,
        contraindications: newMedForm.contraindications,
        bpom_nie: newMedForm.bpom_nie,
        barcode: newMedForm.barcode,
        units
      });

      setActionSuccess(`Master obat ${newMedForm.name} berhasil ditambahkan.`);
      setAddMedModalOpen(false);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Gagal menambah obat');
    }
  };

  const filteredMeds = medicines.filter(m => {
    const matchQuery = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (m.rack_location && m.rack_location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'Semua' || m.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchQuery && matchCat;
  });

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

      {loading && (
        <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-800">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Memperbarui data inventori & audit log...</span>
        </div>
      )}

      {/* SubTab 1: Master Obat & Multi-Satuan */}
      {activeSubTab === 'inventory_master' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari obat, kode, rak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-slate-500"
              />
              <div className="flex items-center gap-1">
                {['Semua', 'padat', 'cair', 'salep'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition ${
                      selectedCategory === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c === 'Semua' ? 'Semua' : c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAllData}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                Muat Ulang
              </button>
              <button
                onClick={() => setAddMedModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded cursor-pointer"
              >
                + Tambah Master Obat
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode & Nama Obat</th>
                  <th className="py-2.5 px-2">Kategori & Rak</th>
                  <th className="py-2.5 px-3">Konversi Satuan Berjenjang</th>
                  <th className="py-2.5 px-3">Total Stok Fisik</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMeds.map(med => (
                  <tr key={med.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{med.code}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[10px] font-semibold uppercase text-slate-700">{med.category}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{med.rack_location || 'Rak Utama'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] text-slate-600">
                        {med.units && med.units.map((u, uIdx) => (
                          <React.Fragment key={uIdx}>
                            <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              {u.conversion_ratio > 1 ? `1 ${u.unit_name} = ${u.conversion_ratio} ${med.base_unit}` : u.unit_name}
                            </span>
                            {uIdx < med.units.length - 1 && <span className="text-slate-400">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{med.breakdownText}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {med.total_stock} {med.base_unit}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        med.stockStatus === 'Aman'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : med.stockStatus === 'Menipis'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {med.stockStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openRestock(med)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-medium cursor-pointer"
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Penerimaan Batch (Restock) */}
      {activeSubTab === 'restock_batches' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <div className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  Daftar Batch Obat Fisik di Rak
                </div>
                <div className="text-[11px] text-slate-500">Pelacakan nomor batch, tanggal kadaluarsa, dan lokasi rak fisik</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRestock()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition"
                >
                  + Tambah Penerimaan Batch
                </button>
                <button
                  onClick={loadAllData}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded text-xs font-medium cursor-pointer"
                >
                  Muat Ulang
                </button>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Obat</th>
                  <th className="py-2.5 px-3">Nomor Batch</th>
                  <th className="py-2.5 px-3">Tanggal Expired</th>
                  <th className="py-2.5 px-3">Stok Batch</th>
                  <th className="py-2.5 px-3">Lokasi Rak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.medicine_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">#{b.batch_number}</td>
                    <td className="py-2.5 px-3 font-bold">{b.expired_date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{b.stock_qty} {b.base_unit}</td>
                    <td className="py-2.5 px-3">{b.rack_location || 'Rak Utama'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* SubTab 3: Ringkasan Stok & Rak */}
      {activeSubTab === 'logistics_overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Total SKU Aktif</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{kpis ? kpis.totalMedicines : medicines.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Stok Aman</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{kpis ? kpis.safeStock : '-'}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Stok Menipis & Kritis</div>
              <div className="text-xl font-bold text-amber-700 mt-0.5">{kpis ? kpis.lowStock + kpis.criticalStock : '-'}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Batch ED &lt; 60 Hari</div>
              <div className="text-xl font-bold text-rose-700 mt-0.5">{kpis ? kpis.criticalBatches : '-'}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
            <div className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              Tata Letak Rak Fisik Instalasi Farmasi
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-900">Rak A (Tablet & Kapsul)</div>
                <div className="text-[11px] text-slate-500 mt-1">Paracetamol, Cetirizine, Dexamethasone</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-900">Rak B (Antibiotik & Kritis)</div>
                <div className="text-[11px] text-slate-500 mt-1">Amoxicillin 500mg, Cefixime 100mg</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-900">Rak C (Sediaan Cair / Sirup)</div>
                <div className="text-[11px] text-slate-500 mt-1">Ibuprofen Sirup, Ambroxol Sirup</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-900">Rak D (Topikal & Salep)</div>
                <div className="text-[11px] text-slate-500 mt-1">Hydrocortisone Krim 2.5%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalOpen && selectedMedForRestock && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-lg border border-slate-300 text-xs">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Penerimaan / Restock Batch Obat</div>
                <div className="text-[11px] text-slate-500">Pencatatan nomor batch dan kuantitas stok masuk</div>
              </div>
              <button onClick={() => setRestockModalOpen(false)} className="text-slate-500 hover:text-slate-800 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Pilih Obat:</label>
                <select
                  value={selectedMedForRestock.id}
                  onChange={(e) => {
                    const chosen = medicines.find(m => String(m.id) === String(e.target.value));
                    if (chosen) {
                      setSelectedMedForRestock(chosen);
                      setRestockForm(generateBatchDefaults(chosen));
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) - Stok: {m.total_stock} {m.base_unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Nomor Batch Pabrik:</label>
                <input
                  type="text"
                  required
                  value={restockForm.batch_number}
                  onChange={(e) => setRestockForm({ ...restockForm, batch_number: e.target.value })}
                  className="w-full font-mono bg-white border border-slate-300 rounded px-2 py-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Tanggal ED:</label>
                  <input
                    type="date"
                    required
                    value={restockForm.expired_date}
                    onChange={(e) => setRestockForm({ ...restockForm, expired_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Lokasi Rak:</label>
                  <input
                    type="text"
                    value={restockForm.rack_location}
                    onChange={(e) => setRestockForm({ ...restockForm, rack_location: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Satuan Diterima:</label>
                  <select
                    value={restockForm.unit_selected}
                    onChange={(e) => setRestockForm({ ...restockForm, unit_selected: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  >
                    {selectedMedForRestock.units && selectedMedForRestock.units.map(u => (
                      <option key={u.unit_name} value={u.unit_name}>
                        {u.unit_name} {u.conversion_ratio > 1 ? `(${u.conversion_ratio} ${selectedMedForRestock.base_unit})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Jumlah Diterima:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockForm.quantity_input}
                    onChange={(e) => setRestockForm({ ...restockForm, quantity_input: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium"
                >
                  Simpan Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {addMedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-lg border border-slate-300 text-xs">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-sm text-slate-900">Pendaftaran Master Obat Baru</div>
              <button onClick={() => setAddMedModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Kode Obat:</label>
                  <input
                    type="text"
                    required
                    placeholder="MED-XXX-00"
                    value={newMedForm.code}
                    onChange={(e) => setNewMedForm({ ...newMedForm, code: e.target.value.toUpperCase() })}
                    className="w-full font-mono bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Bentuk Sediaan:</label>
                  <select
                    value={newMedForm.category}
                    onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="padat">Tablet / Kapsul</option>
                    <option value="cair">Sirup / Drop</option>
                    <option value="salep">Salep / Krim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Nama Obat:</label>
                <input
                  type="text"
                  required
                  value={newMedForm.name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Satuan Dasar:</label>
                  <input
                    type="text"
                    required
                    value={newMedForm.base_unit}
                    onChange={(e) => setNewMedForm({ ...newMedForm, base_unit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">1 Box Isi:</label>
                  <input
                    type="number"
                    value={newMedForm.box_ratio}
                    onChange={(e) => setNewMedForm({ ...newMedForm, box_ratio: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">1 Strip Isi:</label>
                  <input
                    type="number"
                    value={newMedForm.strip_ratio}
                    onChange={(e) => setNewMedForm({ ...newMedForm, strip_ratio: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Batas Minimum:</label>
                  <input
                    type="number"
                    value={newMedForm.min_stock_alert}
                    onChange={(e) => setNewMedForm({ ...newMedForm, min_stock_alert: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Lokasi Rak:</label>
                  <input
                    type="text"
                    value={newMedForm.rack_location}
                    onChange={(e) => setNewMedForm({ ...newMedForm, rack_location: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Nomor NIE BPOM:</label>
                  <input
                    type="text"
                    placeholder="Contoh: DKL1234567890A1"
                    value={newMedForm.bpom_nie}
                    onChange={(e) => setNewMedForm({ ...newMedForm, bpom_nie: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-purple-800"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Barcode / GTIN (1D/2D):</label>
                  <input
                    type="text"
                    placeholder="Contoh: 8991234567890"
                    value={newMedForm.barcode}
                    onChange={(e) => setNewMedForm({ ...newMedForm, barcode: e.target.value.trim() })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Kontraindikasi Alergi:</label>
                <input
                  type="text"
                  placeholder="Misal: Penisilin, Beta-Laktam"
                  value={newMedForm.contraindications}
                  onChange={(e) => setNewMedForm({ ...newMedForm, contraindications: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-rose-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddMedModalOpen(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium"
                >
                  Simpan Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  ChevronRight, 
  RefreshCw,
  Printer,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useSocket } from '../../context/useSocket';

const ZONES_CONFIG = [
  { id: 'ALL', name: 'Semua Zona', label: 'Semua Rak', desc: 'Seluruh kompartemen lemari obat', badgeBg: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'A', name: 'Zona A', label: 'Tablet & Kapsul', desc: 'Sediaan oral padat (Analgetik, Antipiretik)', badgeBg: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'B', name: 'Zona B', label: 'Antibiotik & Kritis', desc: 'Antibiotik, Kardiovaskular, Resep Keras', badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'C', name: 'Zona C', label: 'Sirup & Cairan', desc: 'Sediaan sirup, suspensi & drops', badgeBg: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'D', name: 'Zona D', label: 'Salep & Topikal', desc: 'Sediaan salep, krim, gel & luar', badgeBg: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'E', name: 'Zona E', label: 'Injeksi & Ampul', desc: 'Sediaan steril injeksi, vial & infus', badgeBg: 'bg-rose-100 text-rose-800 border-rose-200' }
];

function getZoneInfo(zoneLetter) {
  const found = ZONES_CONFIG.find(z => z.id === zoneLetter);
  return found || { id: zoneLetter, name: `Zona ${zoneLetter}`, label: 'Kompartemen Fisik', desc: 'Penyimpanan Obat', badgeBg: 'bg-slate-100 text-slate-800 border-slate-200' };
}

const ZONE_THEMES = {
  A: {
    accentBar: 'bg-gradient-to-r from-blue-500 to-sky-400',
    cardBorder: 'hover:border-blue-300',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    bgLight: 'bg-blue-50/40'
  },
  B: {
    accentBar: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    cardBorder: 'hover:border-indigo-300',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-600',
    bgLight: 'bg-indigo-50/40'
  },
  C: {
    accentBar: 'bg-gradient-to-r from-amber-500 to-orange-400',
    cardBorder: 'hover:border-amber-300',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    bgLight: 'bg-amber-50/40'
  },
  D: {
    accentBar: 'bg-gradient-to-r from-teal-500 to-emerald-400',
    cardBorder: 'hover:border-teal-300',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    iconColor: 'text-teal-600',
    bgLight: 'bg-teal-50/40'
  },
  E: {
    accentBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    cardBorder: 'hover:border-rose-300',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'text-rose-600',
    bgLight: 'bg-rose-50/40'
  },
  OTHER: {
    accentBar: 'bg-gradient-to-r from-slate-500 to-slate-400',
    cardBorder: 'hover:border-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-600',
    bgLight: 'bg-slate-50/40'
  }
};

function getExpiryStatus(dateStr) {
  if (!dateStr) return { label: 'Tanpa ED', shortLabel: 'No ED', color: 'bg-slate-100 text-slate-600 border-slate-200', isCritical: false, days: 999 };
  const exp = new Date(dateStr);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return { label: 'Kedaluwarsa (Expired)', shortLabel: 'Expired', color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', isCritical: true, days: diffDays };
  } else if (diffDays <= 60) {
    return { label: `ED ${diffDays} hari`, shortLabel: `ED ${diffDays}h`, color: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold', isCritical: true, days: diffDays };
  } else if (diffDays <= 180) {
    return { label: `ED ${Math.round(diffDays / 30)} bln`, shortLabel: `ED ${Math.round(diffDays / 30)}b`, color: 'bg-blue-50 text-blue-700 border-blue-200', isCritical: false, days: diffDays };
  } else {
    return { label: `ED: ${dateStr}`, shortLabel: dateStr, color: 'bg-slate-50 text-slate-700 border-slate-200', isCritical: false, days: diffDays };
  }
}

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

  // Logistics & Physical Rack State
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [rackSearch, setRackSearch] = useState('');
  const [rackFilterStatus, setRackFilterStatus] = useState('all'); // 'all', 'safe', 'low', 'expiring'
  const [rackViewMode, setRackViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedRackDetail, setSelectedRackDetail] = useState(null);

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

  // Group medicines and batches by rack_location
  const rackGroups = useMemo(() => {
    const map = new Map();

    medicines.forEach(med => {
      const rackName = (med.rack_location || 'Rak Utama').trim();
      if (!map.has(rackName)) {
        const match = rackName.match(/Rak\s*([A-Za-z])/i);
        const zoneKey = match ? match[1].toUpperCase() : 'OTHER';
        map.set(rackName, {
          rackName,
          zone: zoneKey,
          meds: [],
          batches: []
        });
      }
      map.get(rackName).meds.push(med);
    });

    batches.forEach(b => {
      const rackName = (b.rack_location || 'Rak Utama').trim();
      if (map.has(rackName)) {
        map.get(rackName).batches.push(b);
      } else {
        const match = rackName.match(/Rak\s*([A-Za-z])/i);
        const zoneKey = match ? match[1].toUpperCase() : 'OTHER';
        map.set(rackName, {
          rackName,
          zone: zoneKey,
          meds: [],
          batches: [b]
        });
      }
    });

    const sixtyDaysAhead = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const list = Array.from(map.values()).map(rack => {
      rack.meds.sort((a, b) => a.name.localeCompare(b.name));
      rack.batches.sort((a, b) => new Date(a.expired_date) - new Date(b.expired_date));

      const totalStock = rack.meds.reduce((acc, m) => acc + (m.total_stock || 0), 0);
      const hasLowStock = rack.meds.some(m => m.stockStatus === 'Menipis' || m.stockStatus === 'Kritis' || m.total_stock <= (m.min_stock_alert || 10));
      const expiringBatches = rack.batches.filter(b => {
        if (!b.expired_date) return false;
        return new Date(b.expired_date) <= sixtyDaysAhead;
      });

      return {
        ...rack,
        totalStock,
        hasLowStock,
        hasExpiringBatch: expiringBatches.length > 0,
        expiringCount: expiringBatches.length
      };
    });

    list.sort((a, b) => a.rackName.localeCompare(b.rackName, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, [medicines, batches]);

  const filteredRacks = useMemo(() => {
    return rackGroups.filter(rack => {
      if (selectedZone !== 'ALL' && rack.zone !== selectedZone) {
        return false;
      }

      if (rackFilterStatus === 'safe' && (rack.hasLowStock || rack.totalStock === 0)) return false;
      if (rackFilterStatus === 'low' && !rack.hasLowStock) return false;
      if (rackFilterStatus === 'expiring' && !rack.hasExpiringBatch) return false;

      if (!rackSearch.trim()) return true;
      const q = rackSearch.toLowerCase();
      const matchRack = rack.rackName.toLowerCase().includes(q);
      const matchMed = rack.meds.some(m => 
        m.name.toLowerCase().includes(q) || 
        m.code.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q))
      );
      const matchBatch = rack.batches.some(b => 
        b.batch_number.toLowerCase().includes(q) ||
        (b.distributor && b.distributor.toLowerCase().includes(q))
      );

      return matchRack || matchMed || matchBatch;
    });
  }, [rackGroups, selectedZone, rackFilterStatus, rackSearch]);

  const zoneCounts = useMemo(() => {
    const counts = { ALL: rackGroups.length };
    rackGroups.forEach(r => {
      counts[r.zone] = (counts[r.zone] || 0) + 1;
    });
    return counts;
  }, [rackGroups]);

  return (
    <div className="p-1 sm:p-4 lg:p-6 space-y-4 max-w-7xl mx-auto font-sans">
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
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari obat, kode, rak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-slate-500"
              />
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {['Semua', 'padat', 'cair', 'salep'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition whitespace-nowrap ${
                      selectedCategory === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c === 'Semua' ? 'Semua' : c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={loadAllData}
                className="flex-1 sm:flex-initial px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg text-xs font-medium cursor-pointer text-center"
              >
                Muat Ulang
              </button>
              <button
                onClick={() => setAddMedModalOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer text-center whitespace-nowrap shadow-xs"
              >
                + Tambah Obat
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
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  Daftar Batch Obat Fisik di Rak
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Pelacakan nomor batch, tanggal kadaluarsa, dan lokasi rak fisik</div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => openRestock()}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-[#155ea3] hover:bg-[#0f3d6b] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition text-center whitespace-nowrap"
                >
                  + Tambah Batch Masuk
                </button>
                <button
                  onClick={loadAllData}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
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

      {/* SubTab 3: Tata Letak Rak Fisik & Manajemen Kompartemen */}
      {activeSubTab === 'logistics_overview' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-5 rounded-xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="space-y-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold tracking-wide">
                Instalasi Farmasi & Logistik Fisik
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Tata Letak Rak & Kompartemen Obat
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Visualisasi kompartemen rak fisik farmasi real-time. Memantau kapasitas rak, seluruh batch tersimpan, tanggal kedaluwarsa, dan status persediaan obat.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={loadAllData}
                className="w-full md:w-auto px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition flex items-center justify-center gap-1.5"
                title="Sinkronisasi data rak"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
            <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Slot Rak</div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{rackGroups.length} Rak</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">5 Zona Kompartemen</div>
            </div>

            <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total SKU Tersimpan</div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 truncate">{kpis ? kpis.totalMedicines : medicines.length} Obat</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5 truncate">{kpis ? kpis.safeStock : '-'} stok aman</div>
            </div>

            <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Rak Butuh Restock</div>
              <div className="text-lg sm:text-xl font-extrabold text-amber-700 mt-0.5">
                {rackGroups.filter(r => r.hasLowStock).length} Rak
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5 truncate">Stok &lt; batas minimum</div>
            </div>

            <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Batch ED &lt; 60 Hari</div>
              <div className="text-lg sm:text-xl font-extrabold text-rose-700 mt-0.5">
                {rackGroups.reduce((acc, r) => acc + (r.expiringCount || 0), 0)} Batch
              </div>
              <div className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">Perlu rotasi FEFO</div>
            </div>
          </div>

          {/* Zona Selector Pills */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-700">
                Filter Berdasarkan Zona Kompartemen Fisik:
              </span>
              <span className="text-[11px] text-slate-500">
                Menampilkan <span className="font-bold text-slate-800">{filteredRacks.length}</span> dari {rackGroups.length} rak
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {ZONES_CONFIG.map(zone => {
                const isSelected = selectedZone === zone.id;
                const count = zoneCounts[zone.id] || 0;
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-2 border shrink-0 ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{zone.name}</span>
                    <span className="text-[10px] font-normal opacity-75">({zone.label})</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, Status Filter & View Mode Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode rak, nama obat, batch..."
                  value={rackSearch}
                  onChange={(e) => setRackSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
                {rackSearch && (
                  <button 
                    onClick={() => setRackSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="text-xs w-full sm:w-auto">
                <select
                  value={rackFilterStatus}
                  onChange={(e) => setRackFilterStatus(e.target.value)}
                  className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Semua Status Persediaan</option>
                  <option value="safe">Stok Aman</option>
                  <option value="low">Perlu Restock</option>
                  <option value="expiring">Ada Batch ED &lt; 60 Hari</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setRackViewMode('grid')}
                className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                  rackViewMode === 'grid' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Visual Rak Kompartemen"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Visual Rak</span>
              </button>
              <button
                onClick={() => setRackViewMode('table')}
                className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                  rackViewMode === 'table' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Inventori"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabel Data</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {filteredRacks.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 text-sm">Tidak ada rak atau obat yang cocok dengan filter</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian, pilih zona kompartemen lain, atau kembalikan filter status ke default.
              </p>
              <button
                onClick={() => { setSelectedZone('ALL'); setRackSearch(''); setRackFilterStatus('all'); }}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-800 transition"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : rackViewMode === 'grid' ? (
            /* Visual Grid Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredRacks.map(rack => {
                const zoneInfo = getZoneInfo(rack.zone);
                const theme = ZONE_THEMES[rack.zone] || ZONE_THEMES.OTHER;

                return (
                  <div
                    key={rack.rackName}
                    className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col ${theme.cardBorder}`}
                  >
                    {/* Accent Color Bar */}
                    <div className={`h-1.5 w-full ${theme.accentBar}`} />

                    {/* Card Header */}
                    <div className="p-3 sm:p-3.5 pb-2 sm:pb-2.5">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg ${theme.bgLight} border ${theme.badge} flex items-center justify-center font-black text-sm shrink-0`}>
                            {rack.zone}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight truncate block">
                              {rack.rackName}
                            </h3>
                            <span className="text-[11px] font-medium text-slate-500 truncate block">
                              {zoneInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {rack.hasExpiringBatch && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>{rack.expiringCount} ED Dekat</span>
                            </span>
                          )}
                          {rack.hasLowStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>Perlu Restock</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>Stok Aman</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Shelf Statistics Pill */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 mt-2">
                        <span className="truncate mr-2"><strong className="text-slate-800">{rack.meds.length}</strong> SKU Obat</span>
                        <span className="shrink-0 font-medium">Total: <strong className="text-slate-800">{rack.totalStock.toLocaleString()}</strong> Unit</span>
                      </div>
                    </div>

                    {/* Shelf Compartment Contents (All Medicines & Batches) */}
                    <div className="px-3 sm:px-3.5 pb-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                        {rack.meds.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Kompartemen rak ini belum dialokasikan obat.
                          </div>
                        ) : (
                          rack.meds.map(med => {
                            const medBatches = rack.batches.filter(b => b.medicine_id === med.id);

                            return (
                              <div
                                key={med.id}
                                className="p-2 sm:p-2.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition space-y-1.5"
                              >
                                {/* Medicine Info Row */}
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                                        {med.code}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 capitalize">
                                        {med.category}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-xs text-slate-900 mt-0.5 leading-snug break-words">
                                      {med.name}
                                    </h4>
                                  </div>
                                  <button
                                    onClick={() => openRestock(med)}
                                    className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold cursor-pointer shrink-0 transition flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95"
                                    title={`Restock batch untuk ${med.name}`}
                                  >
                                    + Restock
                                  </button>
                                </div>

                                {/* Stock Quantity & Status */}
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-slate-800 text-[11px] sm:text-xs truncate block">
                                      {med.breakdownText || `${med.total_stock} ${med.base_unit}`}
                                    </span>
                                  </div>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 whitespace-nowrap ${
                                    med.stockStatus === 'Aman' ? 'text-emerald-700 bg-emerald-100/60' :
                                    med.stockStatus === 'Menipis' ? 'text-amber-700 bg-amber-100/60' : 'text-rose-700 bg-rose-100/60'
                                  }`}>
                                    {med.stockStatus || 'Aman'}
                                  </span>
                                </div>

                                {/* Active Batches under this Medicine */}
                                {medBatches.length > 0 && (
                                  <div className="space-y-1 pt-1.5 border-t border-slate-200/50">
                                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                      <span>Batch Aktif ({medBatches.length})</span>
                                      <span className="font-normal text-slate-400 text-[9px]">FEFO</span>
                                    </div>
                                    <div className="space-y-1">
                                      {medBatches.map(b => {
                                        const expInfo = getExpiryStatus(b.expired_date);
                                        return (
                                          <div
                                            key={b.id}
                                            className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-200/80 shadow-2xs gap-1.5 min-w-0"
                                          >
                                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                                              <span className="font-mono text-slate-700 font-semibold text-[10px] sm:text-[11px] truncate">#{b.batch_number}</span>
                                              <span className="text-slate-500 font-medium text-[10px] shrink-0">({b.stock_qty} {med.base_unit})</span>
                                            </div>
                                            <span className={`px-1.5 py-0.2 rounded border text-[9px] sm:text-[10px] shrink-0 whitespace-nowrap font-medium ${expInfo.color}`}>
                                              <span className="hidden sm:inline">{expInfo.label}</span>
                                              <span className="sm:hidden">{expInfo.shortLabel}</span>
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Card Footer: Detail & Label Rack */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate">Kompartemen Farmasi</span>
                        <button
                          onClick={() => setSelectedRackDetail(rack)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tabular Table Mode */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Kompartemen Rak</th>
                      <th className="py-2.5 px-3">Zona Sediaan</th>
                      <th className="py-2.5 px-3">Kode & Nama Obat</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Total Stok & Multi-Satuan</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Batch & Tanggal Kedaluwarsa</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRacks.flatMap(rack => {
                      const zoneInfo = getZoneInfo(rack.zone);
                      const theme = ZONE_THEMES[rack.zone] || ZONE_THEMES.OTHER;

                      if (rack.meds.length === 0) {
                        return (
                          <tr key={rack.rackName} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{rack.rackName}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${theme.badge}`}>
                                {zoneInfo.name} ({zoneInfo.label})
                              </span>
                            </td>
                            <td colSpan={5} className="py-2.5 px-3 text-slate-400 italic">
                              Belum ada obat dialokasikan di rak ini
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setSelectedRackDetail(rack)}
                                className="px-2 py-1 text-slate-600 hover:text-indigo-600 font-semibold"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return rack.meds.map((med, mIdx) => {
                        const medBatches = rack.batches.filter(b => b.medicine_id === med.id);

                        return (
                          <tr key={`${rack.rackName}-${med.id}`} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {mIdx === 0 ? (
                                <div>
                                  <span className="font-extrabold text-slate-900">{rack.rackName}</span>
                                  <div className="text-[10px] text-slate-500">{rack.meds.length} SKU</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">↳ {rack.rackName}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${theme.badge}`}>
                                {zoneInfo.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono text-[10px] text-slate-500">{med.code}</div>
                              <div className="font-bold text-slate-900">{med.name}</div>
                            </td>
                            <td className="py-2.5 px-3 capitalize">{med.category}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {med.breakdownText || `${med.total_stock} ${med.base_unit}`}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                med.stockStatus === 'Aman' ? 'text-emerald-700 bg-emerald-100/60' :
                                med.stockStatus === 'Menipis' ? 'text-amber-700 bg-amber-100/60' : 'text-rose-700 bg-rose-100/60'
                              }`}>
                                {med.stockStatus || 'Aman'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {medBatches.length === 0 ? (
                                <span className="text-slate-400 text-[11px] italic">Tidak ada batch</span>
                              ) : (
                                <div className="space-y-1">
                                  {medBatches.map(b => {
                                    const expInfo = getExpiryStatus(b.expired_date);
                                    return (
                                      <div key={b.id} className="flex items-center gap-1.5 text-[11px]">
                                        <span className="font-mono text-slate-700">#{b.batch_number}</span>
                                        <span className="text-slate-500">({b.stock_qty} {med.base_unit})</span>
                                        <span className={`px-1 py-0.2 rounded border text-[9px] ${expInfo.color}`}>
                                          {expInfo.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openRestock(med)}
                                  className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold cursor-pointer transition shadow-2xs"
                                >
                                  Restock
                                </button>
                                <button
                                  onClick={() => setSelectedRackDetail(rack)}
                                  className="px-2 py-1 text-slate-600 hover:text-slate-900 font-semibold"
                                  title="Lihat Detail Rak"
                                >
                                  Detail
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {/* Detail Kompartemen & Cetak Label Rak Modal */}
      {selectedRackDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            {/* Top Accent Bar */}
            <div className={`h-2 w-full ${ZONE_THEMES[selectedRackDetail.zone]?.accentBar || 'bg-slate-700'}`} />

            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${ZONE_THEMES[selectedRackDetail.zone]?.bgLight || 'bg-slate-100'} border ${ZONE_THEMES[selectedRackDetail.zone]?.badge || 'border-slate-200'} flex items-center justify-center font-black text-base text-slate-800 shrink-0`}>
                  {selectedRackDetail.zone}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                      Kompartemen {selectedRackDetail.rackName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${ZONE_THEMES[selectedRackDetail.zone]?.badge || 'bg-slate-100'}`}>
                      {getZoneInfo(selectedRackDetail.zone).name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {getZoneInfo(selectedRackDetail.zone).desc} • {getZoneInfo(selectedRackDetail.zone).label}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                  title="Cetak label kompartemen fisik rak ini"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Label Rak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRackDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs text-slate-700">
              {/* Printable Shelf Label Card Preview */}
              <div className="p-3.5 sm:p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 space-y-2.5 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-indigo-900 font-bold uppercase tracking-wider">
                  <span>Preview Label Penanda Rak Fisik Farmasi</span>
                  <span className="text-indigo-600 font-semibold text-[10px]">Standar Akreditasi Farmasi</span>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-indigo-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klinik Almedika • Depo Farmasi</div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                      {selectedRackDetail.rackName}
                    </div>
                    <div className="text-xs font-semibold text-indigo-800">
                      {getZoneInfo(selectedRackDetail.zone).name} — {getZoneInfo(selectedRackDetail.zone).label}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Instruksi: Simpan pada suhu terkontrol sesuai pedoman Kemenkes/BPOM.
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center sm:items-end justify-center p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div className="font-mono text-[10px] tracking-widest text-slate-700 bg-white px-3 py-1 rounded border border-slate-300 font-bold">
                      *{selectedRackDetail.rackName.toUpperCase().replace(/\s+/g, '-') }*
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Barcode Identifikasi Rak</div>
                  </div>
                </div>
              </div>

              {/* Shelf Summary Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase truncate">Total SKU</div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">{selectedRackDetail.meds.length} Obat</div>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase truncate">Total Stok</div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">{selectedRackDetail.totalStock.toLocaleString()} Unit</div>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase truncate">ED &lt; 60 Hari</div>
                  <div className={`text-base sm:text-lg font-extrabold mt-0.5 ${selectedRackDetail.expiringCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {selectedRackDetail.expiringCount} Batch
                  </div>
                </div>
              </div>

              {/* Inventory Table for this Rack */}
              <div className="space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>Daftar Seluruh Obat & Batch di Kompartemen Ini:</span>
                  <span className="text-xs font-normal text-slate-500">{selectedRackDetail.meds.length} Item</span>
                </div>

                {selectedRackDetail.meds.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada obat yang ditempatkan pada rak ini.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Kode & Nama Obat</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3">Stok & Multi-Satuan</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Rincian Batch</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedRackDetail.meds.map(med => {
                          const medBatches = selectedRackDetail.batches.filter(b => b.medicine_id === med.id);
                          return (
                            <tr key={med.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <span className="font-mono text-[10px] text-slate-500">{med.code}</span>
                                <div className="font-bold text-slate-900">{med.name}</div>
                              </td>
                              <td className="py-2.5 px-3 capitalize">{med.category}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {med.breakdownText || `${med.total_stock} ${med.base_unit}`}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  med.stockStatus === 'Aman' ? 'text-emerald-700 bg-emerald-100/60' :
                                  med.stockStatus === 'Menipis' ? 'text-amber-700 bg-amber-100/60' : 'text-rose-700 bg-rose-100/60'
                                }`}>
                                  {med.stockStatus || 'Aman'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {medBatches.length === 0 ? (
                                  <span className="text-slate-400 text-[11px] italic">Tidak ada batch</span>
                                ) : (
                                  <div className="space-y-1">
                                    {medBatches.map(b => {
                                      const expInfo = getExpiryStatus(b.expired_date);
                                      return (
                                        <div key={b.id} className="flex items-center gap-1.5 text-[11px]">
                                          <span className="font-mono text-slate-700 font-semibold">#{b.batch_number}</span>
                                          <span className="text-slate-500">({b.stock_qty} {med.base_unit})</span>
                                          <span className={`px-1 py-0.2 rounded border text-[9px] ${expInfo.color}`}>
                                            {expInfo.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRackDetail(null);
                                    openRestock(med);
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold cursor-pointer transition shadow-2xs"
                                >
                                  + Restock
                                </button>
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

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pembaruan stok otomatis tersinkronisasi via Socket.io
              </span>
              <button
                type="button"
                onClick={() => setSelectedRackDetail(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

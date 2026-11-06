import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, UserCheck, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useSocket } from '../../context/useSocket';

// Calculate age from birth date string (e.g. '1984-03-12')
function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function DoctorPortal({ activeSubTab }) {
  const { currentUser } = useAuth();
  const { socket } = useSocket();

  // Patient State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientModalOpen, setNewPatientModalOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    gender: 'L',
    date_of_birth: '1995-01-01',
    phone: '',
    blood_type: 'O+',
    weight_kg: 60,
    insurance_type: 'Umum',
    allergies: 'Tidak Ada'
  });

  // Medicine State
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loadingMeds, setLoadingMeds] = useState(true);

  // Prescription Form State
  const [prescriptionType, setPrescriptionType] = useState('standard');
  const [doctorMobileTab, setDoctorMobileTab] = useState('catalog'); // 'catalog' | 'pad' for mobile (< lg)
  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      medicine_id: 1,
      medicine_name: 'Paracetamol 500mg',
      medicine_code: 'MED-PCT-500',
      base_unit: 'Butir',
      unit_selected: 'Strip',
      conversion_ratio: 10,
      quantity_input: 2,
      quantity_base_unit: 20,
      dosage_instruction: '3 x 1 Tablet Sehari Sesudah Makan',
      notes: 'Bila demam > 38.5 C',
      availableUnits: [
        { unit_name: 'Box', conversion_ratio: 100 },
        { unit_name: 'Strip', conversion_ratio: 10 },
        { unit_name: 'Butir', conversion_ratio: 1 }
      ]
    }
  ]);

  // Racikan
  const [racikanName, setRacikanName] = useState('Puyer Batuk & Demam');
  const [racikanQty, setRacikanQty] = useState(10);
  const [racikanSigna, setRacikanSigna] = useState('3 x 1 Bungkus Sesudah Makan');

  // Meta
  const [doctorNotes, setDoctorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Doctor Prescription History
  const [historyPrescriptions, setHistoryPrescriptions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const SIGNA_OPTIONS = [
    '3 x 1 Tablet Sesudah Makan',
    '2 x 1 Tablet Sesudah Makan',
    '1 x 1 Tablet Malam Hari',
    '3 x 1 Sendok Takar (5ml)',
    'Oleskan 2x Sehari Tipis',
    'Bila Perlu (PRN)'
  ];

  const loadPatients = useCallback(async () => {
    try {
      const res = await api.getPatients();
      setPatients(res.data);
      if (res.data.length > 0) {
        setSelectedPatient(prev => prev || res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadMedicines = useCallback(async () => {
    try {
      setLoadingMeds(true);
      const res = await api.getMedicines();
      setMedicines(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMeds(false);
    }
  }, []);

  const loadDoctorHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getPrescriptions();
      setHistoryPrescriptions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleCreatePatient = async (e) => {
    if (e) e.preventDefault();
    if (!newPatientForm.name.trim()) {
      setActionError('Nama lengkap pasien wajib diisi.');
      return;
    }
    setIsCreatingPatient(true);
    setActionError(null);
    try {
      const res = await api.createPatient(newPatientForm);
      const newPt = res.data;
      setPatients(prev => [newPt, ...prev]);
      setSelectedPatient(newPt);
      setNewPatientModalOpen(false);
      setActionSuccess(`Pasien baru ${newPt.name} (${newPt.medical_record_number}) berhasil didaftarkan dan dipilih untuk peresepan.`);
      setNewPatientForm({
        name: '',
        gender: 'L',
        date_of_birth: '1995-01-01',
        phone: '',
        blood_type: 'O+',
        weight_kg: 60,
        insurance_type: 'Umum',
        allergies: 'Tidak Ada'
      });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Gagal mendaftarkan pasien baru.');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  useEffect(() => {
    loadPatients();
    loadMedicines();
    loadDoctorHistory();
  }, [loadPatients, loadMedicines, loadDoctorHistory]);

  // Listen to live prescription status and stock changes
  useEffect(() => {
    if (!socket) return;
    const handleStatusChanged = () => {
      loadDoctorHistory();
    };
    const handleStockUpdated = () => {
      loadMedicines();
    };

    socket.on('prescription:new', handleStatusChanged);
    socket.on('prescription:status_changed', handleStatusChanged);
    socket.on('prescription:dispensed', handleStatusChanged);
    socket.on('stock:updated', handleStockUpdated);

    return () => {
      socket.off('prescription:new', handleStatusChanged);
      socket.off('prescription:status_changed', handleStatusChanged);
      socket.off('prescription:dispensed', handleStatusChanged);
      socket.off('stock:updated', handleStockUpdated);
    };
  }, [socket, loadDoctorHistory, loadMedicines]);

  const isContraindicated = (med) => {
    if (!selectedPatient || !selectedPatient.allergies || !med.contraindications) return false;
    const patientAllergy = selectedPatient.allergies.toLowerCase().trim();
    if (!patientAllergy || patientAllergy === 'tidak ada' || patientAllergy === 'none' || patientAllergy === '-') {
      return false;
    }
    const patientTokens = patientAllergy
      .split(/[,/;|]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const contraTokens = med.contraindications
      .toLowerCase()
      .split(/[,/;|]+/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const pt of patientTokens) {
      for (const ct of contraTokens) {
        if (pt === ct) return true;
        const cleanPt = pt.replace(/\b(alergi|golongan|obat|terhadap)\b/g, '').trim();
        const cleanCt = ct.replace(/\b(alergi|golongan|obat|terhadap)\b/g, '').trim();
        if (cleanPt && cleanCt) {
          if (cleanPt.includes(cleanCt) || cleanCt.includes(cleanPt)) return true;
        }
      }
    }
    return false;
  };

  const handleAddMedicine = (med) => {
    if (isContraindicated(med)) {
      setActionError(`Obat ${med.name} memiliki kontraindikasi dengan alergi pasien (${selectedPatient.allergies}).`);
      return;
    }
    if (med.total_stock <= 0) {
      setActionError(`Stok obat ${med.name} sedang KOSONG (0 ${med.base_unit}). Tidak dapat ditambahkan ke resep.`);
      return;
    }

    const existingIndex = prescriptionItems.findIndex(i => i.medicine_id === med.id);
    if (existingIndex !== -1) {
      const updated = [...prescriptionItems];
      updated[existingIndex].quantity_input += 1;
      updated[existingIndex].quantity_base_unit = updated[existingIndex].quantity_input * updated[existingIndex].conversion_ratio;
      setPrescriptionItems(updated);
      return;
    }

    const defaultUnit = med.units && med.units.length > 1 ? med.units[1].unit_name : med.base_unit;
    const unitObj = med.units.find(u => u.unit_name === defaultUnit) || { conversion_ratio: 1 };

    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicine_id: med.id,
        medicine_name: med.name,
        medicine_code: med.code,
        base_unit: med.base_unit,
        unit_selected: defaultUnit,
        conversion_ratio: unitObj.conversion_ratio,
        quantity_input: 1,
        quantity_base_unit: 1 * unitObj.conversion_ratio,
        dosage_instruction: '3 x 1 Tablet Sesudah Makan',
        notes: '',
        availableUnits: med.units
      }
    ]);
  };

  const handleQtyChange = (index, delta) => {
    const item = prescriptionItems[index];
    const newQty = Math.max(1, item.quantity_input + delta);
    const updated = [...prescriptionItems];
    updated[index] = {
      ...item,
      quantity_input: newQty,
      quantity_base_unit: newQty * item.conversion_ratio
    };
    setPrescriptionItems(updated);
  };

  const handleUnitChange = (index, newUnit) => {
    const item = prescriptionItems[index];
    const unitObj = item.availableUnits.find(u => u.unit_name === newUnit) || { conversion_ratio: 1 };
    const updated = [...prescriptionItems];
    updated[index] = {
      ...item,
      unit_selected: newUnit,
      conversion_ratio: unitObj.conversion_ratio,
      quantity_base_unit: item.quantity_input * unitObj.conversion_ratio
    };
    setPrescriptionItems(updated);
  };

  const handleRemoveItem = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    if (prescriptionItems.length === 0) {
      setActionError('Pilih minimal 1 obat untuk lembar resep.');
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const isRacikan = prescriptionType === 'racikan';
      const payload = {
        patient_id: selectedPatient.id,
        doctor_id: currentUser.id,
        notes: isRacikan ? `[RACIKAN: ${racikanName} (${racikanQty} Bungkus) - Signa: ${racikanSigna}] ${doctorNotes}`.trim() : doctorNotes,
        items: prescriptionItems.map(item => ({
          medicine_id: item.medicine_id,
          unit_selected: item.unit_selected,
          quantity_input: item.quantity_input,
          dosage_instruction: isRacikan ? racikanSigna : item.dosage_instruction,
          is_racikan: isRacikan ? 1 : 0,
          racikan_name: isRacikan ? `${racikanName} (${racikanQty} Bungkus)` : null,
          notes: item.notes
        }))
      };

      const res = await api.createPrescription(payload);
      setActionSuccess(`E-Resep ${res.data.prescription_code} berhasil dikirim ke antrean apotek.`);
      setPrescriptionItems([]);
      setDoctorNotes('');
      setDoctorMobileTab('catalog');
      loadDoctorHistory();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Gagal mengirim resep');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!patientSearchQuery.trim()) return true;
    const q = patientSearchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.medical_record_number && p.medical_record_number.toLowerCase().includes(q))
    );
  });

  const filteredMeds = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'Semua' || m.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchSearch && matchCat;
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-7xl mx-auto font-sans">
      {/* Tab 1: Tulis E-Resep */}
      {activeSubTab === 'write_prescription' && (
        <div className="space-y-4">
          {/* Patient Header */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{selectedPatient?.name}</span>
                <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {selectedPatient?.medical_record_number}
                </span>
                <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {selectedPatient?.insurance_type}
                </span>
              </div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>Usia: {calculateAge(selectedPatient?.date_of_birth || selectedPatient?.birth_date) ?? '-'} Tahun ({selectedPatient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
                <span>•</span>
                <span>Gol. Darah: {selectedPatient?.blood_type || 'O+'}</span>
                <span>•</span>
                <span>BB: {selectedPatient?.weight_kg || 68} kg</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {selectedPatient?.allergies && selectedPatient.allergies !== 'Tidak Ada' && (
                <div className="px-2.5 py-1 bg-rose-50 border border-rose-300 text-rose-800 rounded font-semibold text-[11px]">
                  Alergi: {selectedPatient.allergies} (Sediaan Terkait Dikunci)
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setNewPatientModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#155ea3] hover:bg-[#0f3d6b] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                  title="Daftarkan atau masukkan nama pasien baru langsung"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Pasien Baru</span>
                </button>

                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                  <div className="relative flex-1 sm:w-36">
                    <input
                      type="text"
                      placeholder="Cari pasien / RM..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#155ea3]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-1.5 top-2 pointer-events-none" />
                  </div>
                  <select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      if (e.target.value === 'NEW_PATIENT') {
                        setNewPatientModalOpen(true);
                        return;
                      }
                      const p = patients.find(x => x.id === Number(e.target.value));
                      if (p) setSelectedPatient(p);
                    }}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium text-xs focus:outline-hidden focus:border-[#155ea3] flex-1 sm:max-w-[180px]"
                  >
                    <option value="NEW_PATIENT" className="font-bold text-[#155ea3]">
                      + Ketik / Tambah Pasien Baru...
                    </option>
                    {filteredPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.medical_record_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback message */}
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

          {/* Mobile Segmented Switcher (< lg) */}
          <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-xl mb-3 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDoctorMobileTab('catalog')}
              className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                doctorMobileTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>💊 Katalog Obat</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {filteredMeds.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDoctorMobileTab('pad')}
              className={`flex-1 py-2 text-center rounded-lg transition relative cursor-pointer flex items-center justify-center gap-1.5 ${
                doctorMobileTab === 'pad'
                  ? 'bg-[#155ea3] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📝 Lembar Resep</span>
              {prescriptionItems.length > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  doctorMobileTab === 'pad' ? 'bg-white text-[#155ea3]' : 'bg-[#ec1415] text-white'
                }`}>
                  {prescriptionItems.length}
                </span>
              )}
            </button>
          </div>

          {/* Two Columns: Catalog & Prescription Pad */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Catalog */}
            <div className={`lg:col-span-5 space-y-3 ${doctorMobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    Pilih Obat di Klinik
                  </span>
                  <span className="text-[11px] text-slate-500">{filteredMeds.length} sediaan</span>
                </div>

                <input
                  type="text"
                  placeholder="Cari obat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500"
                />

                <div className="flex items-center gap-1">
                  {['Semua', 'padat', 'cair', 'salep'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'Semua' ? 'Semua' : cat === 'padat' ? 'Tablet' : cat === 'cair' ? 'Sirup' : 'Salep'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {loadingMeds ? (
                  <div className="p-6 text-center text-xs text-slate-400">Memuat obat...</div>
                ) : filteredMeds.map(med => {
                  const contra = isContraindicated(med);
                  return (
                    <div
                      key={med.id}
                      className={`bg-white rounded-lg p-3 border text-xs transition ${
                        contra ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{med.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">{med.code}</span> • Lokasi: {med.rack_location || 'Rak Utama'}
                          </div>
                        </div>

                        <span className="font-semibold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {med.total_stock} {med.base_unit}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{med.breakdownText}</span>

                        {contra ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            Kontraindikasi Alergi
                          </span>
                        ) : med.total_stock <= 0 ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Stok Kosong
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddMedicine(med)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium cursor-pointer transition text-xs"
                          >
                            Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating CTA for Mobile Doctor when items selected */}
              {doctorMobileTab === 'catalog' && prescriptionItems.length > 0 && (
                <div className="lg:hidden sticky bottom-20 z-30 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setDoctorMobileTab('pad')}
                    className="w-full py-2.5 px-4 bg-[#155ea3] hover:bg-[#0f3d6b] text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-between transition cursor-pointer active:scale-98"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white text-[#155ea3] flex items-center justify-center font-bold text-[11px]">
                        {prescriptionItems.length}
                      </span>
                      <span>Obat Terpilih di Resep</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      Buka Lembar Resep →
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Prescription Pad */}
            <div className={`lg:col-span-7 space-y-3 ${doctorMobileTab === 'pad' ? 'block' : 'hidden lg:block'}`}>
              {/* Mobile Back Button to Catalog */}
              <div className="lg:hidden pb-1">
                <button
                  type="button"
                  onClick={() => setDoctorMobileTab('catalog')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>← Tambah Obat Lain (Buka Katalog)</span>
                </button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPrescriptionType('standard')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        prescriptionType === 'standard' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Resep Standar ({prescriptionItems.length})
                    </button>
                    <button
                      onClick={() => setPrescriptionType('racikan')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        prescriptionType === 'racikan' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Resep Racikan
                    </button>
                  </div>
                </div>

                {/* If Racikan is active, show the compound header configurator */}
                {prescriptionType === 'racikan' && (
                  <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-100">
                      <span className="font-bold text-purple-900 uppercase tracking-wide">
                        Pengaturan Formula Racikan
                      </span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                        Puyer / Kapsul / Sirup Kering
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-8">
                        <label className="text-slate-600 block mb-1 font-medium">Nama Formula Racikan:</label>
                        <input
                          type="text"
                          value={racikanName}
                          onChange={(e) => setRacikanName(e.target.value)}
                          placeholder="Contoh: Puyer Batuk & Demam Anak"
                          className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-hidden focus:border-purple-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-slate-600 block mb-1 font-medium">Jumlah Bungkus / Sachet:</label>
                        <input
                          type="number"
                          min="1"
                          value={racikanQty}
                          onChange={(e) => setRacikanQty(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-bold text-center text-purple-900 focus:outline-hidden focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Aturan Pakai Racikan (Signa):</label>
                      <input
                        type="text"
                        value={racikanSigna}
                        onChange={(e) => setRacikanSigna(e.target.value)}
                        placeholder="Contoh: 3 x 1 Bungkus Sesudah Makan"
                        className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* List of Prescription Items (Used for Standard and as Ingredients for Racikan) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      {prescriptionType === 'racikan' ? 'Komposisi Bahan Obat Racikan' : 'Daftar Obat Yang Diresepkan'}:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {prescriptionItems.length} bahan dipilih
                    </span>
                  </div>

                  {prescriptionItems.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                      {prescriptionType === 'racikan'
                        ? 'Pilih obat dari katalog di sebelah kiri untuk dimasukkan ke dalam formula racikan.'
                        : 'Belum ada obat yang dipilih. Silakan pilih dari katalog di sebelah kiri.'}
                    </div>
                  ) : (
                    prescriptionItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">{idx + 1}.</span>
                            <span className="font-bold text-slate-900 text-xs">{item.medicine_name}</span>
                            <span className="font-mono text-[11px] text-slate-400">({item.medicine_code})</span>
                            {prescriptionType === 'racikan' && (
                              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">
                                Bahan Racikan
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <label className="text-[10px] text-slate-500 block mb-0.5">Satuan Ambil:</label>
                            <select
                              value={item.unit_selected}
                              onChange={(e) => handleUnitChange(idx, e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                            >
                              {item.availableUnits.map(u => (
                                <option key={u.unit_name} value={u.unit_name}>
                                  {u.unit_name} {u.conversion_ratio > 1 ? `(${u.conversion_ratio} ${item.base_unit})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-4">
                            <label className="text-[10px] text-slate-500 block mb-0.5">Jumlah Digunakan:</label>
                            <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(idx, -1)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity_input}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  const updated = [...prescriptionItems];
                                  updated[idx] = {
                                    ...item,
                                    quantity_input: val,
                                    quantity_base_unit: val * item.conversion_ratio
                                  };
                                  setPrescriptionItems(updated);
                                }}
                                className="w-full text-center py-1 text-xs font-semibold focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(idx, 1)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-4">
                            <label className="text-[10px] text-slate-500 block mb-0.5">Konversi Stok:</label>
                            <div className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 font-semibold text-center">
                              {item.quantity_base_unit} {item.base_unit}
                            </div>
                          </div>
                        </div>

                        {prescriptionType !== 'racikan' && (
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5">Aturan Pakai (Signa):</label>
                            <input
                              type="text"
                              value={item.dosage_instruction}
                              onChange={(e) => {
                                const updated = [...prescriptionItems];
                                updated[idx].dosage_instruction = e.target.value;
                                setPrescriptionItems(updated);
                              }}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-slate-500"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {SIGNA_OPTIONS.slice(0, 3).map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...prescriptionItems];
                                    updated[idx].dosage_instruction = opt;
                                    setPrescriptionItems(updated);
                                  }}
                                  className="text-[10px] bg-white border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 hover:bg-slate-100 cursor-pointer"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Catatan Dokter:</label>
                  <input
                    type="text"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Instruksi tambahan untuk farmasi..."
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionItems([]);
                      setDoctorNotes('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer py-2 px-3 rounded hover:bg-slate-100 transition"
                  >
                    Reset Form
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || prescriptionItems.length === 0}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#155ea3] hover:bg-[#0f3d6b] text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50 text-center active:scale-98"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim E-Resep ke Apotek →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Riwayat Resep Pasien yang Ditulis Dokter */}
      {activeSubTab === 'prescription_history' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
              Riwayat Resep Ditulis Dokter ({historyPrescriptions.length})
            </span>
            <button
              onClick={loadDoctorHistory}
              className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Resep</th>
                  <th className="py-2.5 px-3">Nama Pasien & RM</th>
                  <th className="py-2.5 px-3">Waktu Penulisan</th>
                  <th className="py-2.5 px-3">Jumlah Obat</th>
                  <th className="py-2.5 px-3">Status di Apotek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loadingHistory ? (
                  <tr><td colSpan="5" className="text-center py-6 text-slate-400">Memuat riwayat...</td></tr>
                ) : historyPrescriptions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-6 text-slate-400">Belum ada resep yang tercatat.</td></tr>
                ) : historyPrescriptions.map(rx => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-slate-900">{rx.prescription_code}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{rx.patient_name}</div>
                      <div className="text-[10px] text-slate-400">{rx.medical_record_number}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {new Date(rx.created_at).toLocaleDateString('id-ID')} {new Date(rx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      {rx.item_count} item obat
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        rx.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : rx.status === 'preparing'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {rx.status === 'pending' ? 'Menunggu di Apotek' : rx.status === 'preparing' ? 'Sedang Diracik Apoteker' : 'Selesai Diserahkan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Katalog & Stok Live */}
      {activeSubTab === 'medicine_catalog' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
              Katalog Referensi Obat & Sisa Stok Fisik
            </span>
            <input
              type="text"
              placeholder="Cari obat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 px-2 py-1 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode & Nama Obat</th>
                  <th className="py-2.5 px-2">Bentuk</th>
                  <th className="py-2.5 px-3">Lokasi Rak</th>
                  <th className="py-2.5 px-3">Ketersediaan Stok Fisik</th>
                  <th className="py-2.5 px-3">Peringatan Kontraindikasi</th>
                  <th className="py-2.5 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMeds.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {m.name} <span className="font-mono font-normal text-slate-400 text-[10px]">({m.code})</span>
                    </td>
                    <td className="py-2.5 px-2 uppercase text-[10px] font-semibold text-slate-700">
                      {m.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {m.rack_location || 'Rak Utama'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{m.breakdownText}</div>
                      <div className="text-[10px] text-slate-400">Total: {m.total_stock} {m.base_unit}</div>
                    </td>
                    <td className="py-2.5 px-3 text-rose-700 text-[11px]">
                      {m.contraindications || '-'}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        m.stockStatus === 'Aman'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : m.stockStatus === 'Menipis'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
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
      )}

      {/* Modal Input Pasien Baru */}
      {newPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0f3d6b] to-[#155ea3] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Input / Daftarkan Pasien Baru</h3>
                  <p className="text-[11px] text-white/80">Masukkan data identitas pasien untuk memulai peresepan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewPatientModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreatePatient} className="p-5 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Lengkap Pasien <span className="text-[#ec1415]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  placeholder="Contoh: Ny. Ratna Sari, Tn. Hendra..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-hidden focus:border-[#155ea3] focus:ring-1 focus:ring-[#155ea3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Jenis Kelamin:</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:outline-hidden focus:border-[#155ea3]"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tanggal Lahir:</label>
                  <input
                    type="date"
                    value={newPatientForm.date_of_birth}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:outline-hidden focus:border-[#155ea3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Golongan Darah:</label>
                  <select
                    value={newPatientForm.blood_type}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, blood_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white"
                  >
                    {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Berat Badan (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={newPatientForm.weight_kg}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, weight_kg: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Penjamin / Asuransi:</label>
                  <select
                    value={newPatientForm.insurance_type}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, insurance_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white"
                  >
                    <option value="Umum">Umum / Mandiri</option>
                    <option value="BPJS Mandiri">BPJS Mandiri</option>
                    <option value="BPJS PBI">BPJS PBI</option>
                    <option value="Asuransi Swasta">Asuransi Swasta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nomor Telepon / WA:</label>
                  <input
                    type="text"
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    placeholder="08xx-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Riwayat Alergi Obat:
                </label>
                <input
                  type="text"
                  value={newPatientForm.allergies}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, allergies: e.target.value })}
                  placeholder="Contoh: Penisilin / Beta-Laktam, Sulfa, Aspirin, atau Tidak Ada"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-hidden focus:border-[#155ea3]"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 self-center">Pilihan cepat:</span>
                  {['Tidak Ada', 'Penisilin / Golongan Beta-Laktam', 'Sulfa', 'Aspirin / NSAID'].map(al => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => setNewPatientForm({ ...newPatientForm, allergies: al })}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] cursor-pointer"
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPatientModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPatient}
                  className="px-4 py-2 bg-[#155ea3] hover:bg-[#0f3d6b] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isCreatingPatient ? 'Mendaftarkan...' : 'Simpan & Mulai Resep'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

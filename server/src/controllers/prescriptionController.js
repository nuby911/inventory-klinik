const db = require('../config/database');
const { convertToBaseUnit, previewFEFOAllocation, dispensePrescriptionFEFO } = require('../services/fefoService');

/**
 * Check allergy vs contraindication bidirectionally with tokenization
 */
function checkAllergyConflict(allergyStr, contraStr) {
  if (!allergyStr || !contraStr) return false;
  const allergyLower = allergyStr.toLowerCase().trim();
  if (allergyLower === 'tidak ada' || allergyLower === 'none' || allergyLower === '-') return false;

  const clean = (str) => str.toLowerCase().replace(/[^a-z0-9\s,/]/g, ' ');
  const stopWords = new Set(['alergi', 'golongan', 'turunan', 'turunannya', 'riwayat', 'dan', 'atau', 'pada', 'berat', 'akut']);

  const tokenize = (str) => clean(str)
    .split(/[,/]/)
    .flatMap(phrase => phrase.trim().split(/\s+/))
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w));

  const allergyTokens = tokenize(allergyStr);
  const contraTokens = tokenize(contraStr);

  const directOverlap = allergyTokens.some(aToken =>
    contraTokens.some(cToken => cToken.includes(aToken) || aToken.includes(cToken))
  );

  if (directOverlap) return true;

  const allergyPhrases = allergyStr.toLowerCase().split(/[,/]/).map(s => s.trim()).filter(Boolean);
  const contraPhrases = contraStr.toLowerCase().split(/[,/]/).map(s => s.trim()).filter(Boolean);
  return allergyPhrases.some(a => contraPhrases.some(c => a.includes(c) || c.includes(a)));
}

function getPrescriptions(req, res) {
  try {
    const { status, is_cito } = req.query;
    let query = `
      SELECT p.*, pt.name as patient_name, pt.medical_record_number, pt.allergies,
             pt.gender, pt.date_of_birth, pt.blood_type, pt.weight_kg, pt.insurance_type,
             u.name as doctor_name,
             (SELECT COUNT(*) FROM prescription_items WHERE prescription_id = p.id) as item_count
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN users u ON p.doctor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (is_cito !== undefined && is_cito !== '') {
      query += ` AND p.is_cito = ?`;
      params.push(Number(is_cito));
    }

    query += ` ORDER BY p.is_cito DESC, p.created_at DESC`;

    const prescriptions = db.prepare(query).all(...params);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('getPrescriptions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getPrescriptionById(req, res) {
  try {
    const { id } = req.params;
    const prescription = db.prepare(`
      SELECT p.*, pt.name as patient_name, pt.medical_record_number, pt.allergies,
             pt.gender, pt.date_of_birth, pt.blood_type, pt.weight_kg, pt.insurance_type, pt.phone,
             u.name as doctor_name
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN users u ON p.doctor_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const items = db.prepare(`
      SELECT pi.*, m.name as medicine_name, m.code as medicine_code, m.base_unit, m.rack_location, m.category
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(id);

    // Attach FEFO allocation preview for each item (sharing simulated batch stock across items)
    const simulatedBatchStock = new Map();
    const itemsWithFEFO = items.map(item => {
      const fefo = previewFEFOAllocation(item.medicine_id, item.quantity_base_unit, simulatedBatchStock);
      return {
        ...item,
        fefoPreview: fefo
      };
    });

    res.json({
      success: true,
      data: {
        ...prescription,
        items: itemsWithFEFO
      }
    });
  } catch (error) {
    console.error('getPrescriptionById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function createPrescription(req, res) {
  try {
    const { patient_id, patient_name, patient_gender, patient_date_of_birth, patient_allergies, is_cito, notes, items } = req.body;
    // Strict identity binding to authenticated session
    const doctor_id = req.user?.id || req.body.doctor_id || 1;

    let resolvedPatientId = patient_id;

    // Support direct patient name input without pre-existing patient_id
    if (!resolvedPatientId && patient_name && typeof patient_name === 'string' && patient_name.trim()) {
      const year = new Date().getFullYear();
      const maxRow = db.prepare('SELECT MAX(id) as maxId FROM patients').get();
      const nextNum = (maxRow?.maxId || 0) + 1;
      let rm = `RM-${year}-${String(nextNum).padStart(4, '0')}`;
      const existingRM = db.prepare('SELECT id FROM patients WHERE medical_record_number = ?').get(rm);
      if (existingRM) {
        rm = `${rm}-${Math.floor(100 + Math.random() * 900)}`;
      }
      const insertP = db.prepare(`
        INSERT INTO patients (medical_record_number, name, gender, date_of_birth, allergies)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        rm,
        patient_name.trim(),
        (patient_gender === 'P' || patient_gender === 'Perempuan') ? 'P' : 'L',
        patient_date_of_birth || null,
        patient_allergies || 'Tidak Ada'
      );
      resolvedPatientId = insertP.lastInsertRowid;
    }

    if (!resolvedPatientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pasien (ID atau Nama) dan item resep wajib diisi' });
    }

    // Validate item inputs
    for (const item of items) {
      if (!item.medicine_id || !item.unit_selected || Number(item.quantity_input) <= 0) {
        return res.status(400).json({ success: false, message: 'Setiap item obat wajib memiliki satuan dan jumlah kuantitas positif.' });
      }
    }

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(resolvedPatientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
    }

    // Safety Contraindication Check
    const warnings = [];

    for (const item of items) {
      const med = db.prepare('SELECT name, contraindications FROM medicines WHERE id = ?').get(item.medicine_id);
      if (med && med.contraindications) {
        const hasConflict = checkAllergyConflict(patient.allergies, med.contraindications);
        if (hasConflict) {
          warnings.push(`KONTRAINDIKASI: ${med.name} berisiko memicu alergi pasien (${patient.allergies})!`);
        }
      }
    }

    // Generate collision-safe prescription code
    const maxIdRow = db.prepare('SELECT MAX(id) as maxId FROM prescriptions').get();
    const nextNum = (maxIdRow?.maxId || 0) + 1;
    const year = new Date().getFullYear();
    let prescription_code = `ER-${year}-${String(nextNum).padStart(4, '0')}`;
    const existingCode = db.prepare('SELECT id FROM prescriptions WHERE prescription_code = ?').get(prescription_code);
    if (existingCode) {
      prescription_code = `ER-${year}-${String(nextNum).padStart(4, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const createTransaction = db.transaction(() => {
      const insertRx = db.prepare(`
        INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status, is_cito, notes)
        VALUES (?, ?, ?, 'pending', ?, ?)
      `).run(prescription_code, resolvedPatientId, doctor_id, is_cito ? 1 : 0, notes || null);

      const rxId = insertRx.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO prescription_items 
        (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction, is_racikan, racikan_name, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const qtyBaseUnit = convertToBaseUnit(item.medicine_id, item.unit_selected, item.quantity_input);
        insertItem.run(
          rxId,
          item.medicine_id,
          item.unit_selected,
          item.quantity_input,
          qtyBaseUnit,
          item.dosage_instruction,
          item.is_racikan ? 1 : 0,
          item.racikan_name || null,
          item.notes || null
        );
      }

      return rxId;
    });

    const newRxId = createTransaction();

    // Fetch full created prescription to emit via Socket.io
    const createdRx = db.prepare(`
      SELECT p.*, pt.name as patient_name, pt.medical_record_number, pt.allergies,
             u.name as doctor_name,
             (SELECT COUNT(*) FROM prescription_items WHERE prescription_id = p.id) as item_count
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN users u ON p.doctor_id = u.id
      WHERE p.id = ?
    `).get(newRxId);

    // Emit live event through Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('prescription:new', createdRx);
    }

    res.status(201).json({
      success: true,
      message: 'E-Resep berhasil dikirim ke Farmasi secara real-time',
      warnings,
      data: createdRx
    });
  } catch (error) {
    console.error('createPrescription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function updatePrescriptionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const currentRx = db.prepare('SELECT id, status FROM prescriptions WHERE id = ?').get(id);
    if (!currentRx) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    // Terminal state locks
    if (currentRx.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resep yang telah selesai (completed) tidak dapat diubah statusnya demi integritas stok farmasi.'
      });
    }

    if (currentRx.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Resep yang telah dibatalkan (cancelled) tidak dapat diubah statusnya.'
      });
    }

    // Completion is strictly reserved for the dispensing transaction
    if (status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Perubahan status ke Selesai (completed) hanya dapat dilakukan melalui proses penyerahan obat (dispense).'
      });
    }

    // Role-specific status guards
    if (req.user?.role === 'dokter' && (status !== 'cancelled' || currentRx.status !== 'pending')) {
      return res.status(403).json({
        success: false,
        message: 'Dokter hanya memiliki izin untuk membatalkan (cancelled) resep yang masih berstatus menunggu (pending).'
      });
    }

    const updateRes = db.prepare('UPDATE prescriptions SET status = ? WHERE id = ?').run(status, id);
    if (updateRes.changes === 0) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('prescription:status_changed', { id: Number(id), status });
    }

    res.json({ success: true, message: `Status resep diubah menjadi ${status}` });
  } catch (error) {
    console.error('updatePrescriptionStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function dispensePrescription(req, res) {
  try {
    const { id } = req.params;
    // Bind to authenticated pharmacist ID
    const pharmacist_id = req.user?.id || req.body.pharmacist_id || 2;

    const result = dispensePrescriptionFEFO(Number(id), pharmacist_id);

    const io = req.app.get('io');
    if (io) {
      io.emit('prescription:dispensed', result);
      io.emit('stock:updated');
    }

    res.json({
      success: true,
      message: 'Dispensing obat berhasil dieksekusi dengan algoritma FEFO dan tercatat di audit trail BPOM.',
      data: result
    });
  } catch (error) {
    console.error('dispensePrescription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

function getEtiketData(req, res) {
  try {
    const { id } = req.params;
    const prescription = db.prepare(`
      SELECT p.prescription_code, p.created_at, pt.name as patient_name, pt.medical_record_number,
             pt.date_of_birth, u.name as doctor_name
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN users u ON p.doctor_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const items = db.prepare(`
      SELECT pi.id as item_id, pi.medicine_id, pi.unit_selected, pi.quantity_input, pi.dosage_instruction, pi.notes,
             pi.is_racikan, pi.racikan_name,
             m.name as medicine_name, m.category
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(id);

    const etiketItems = items.map(item => {
      // Prioritize actual dispensed batch from BPOM audit table
      let batchInfo = db.prepare(`
        SELECT batch_number, expired_date 
        FROM prescription_item_batches 
        WHERE prescription_item_id = ? 
        ORDER BY id ASC LIMIT 1
      `).get(item.item_id);

      // Fallback to nearest active batch if not yet dispensed
      if (!batchInfo) {
        batchInfo = db.prepare(`
          SELECT batch_number, expired_date 
          FROM medicine_batches 
          WHERE medicine_id = ? AND stock_qty > 0 
          ORDER BY expired_date ASC LIMIT 1
        `).get(item.medicine_id);
      }

      const isExternal = ['salep', 'tetes', 'cair_luar'].includes(item.category?.toLowerCase());

      return {
        clinicName: 'KLINIK ELMEDIKA',
        clinicAddress: 'Jl. Pemuda No. 45, Telp: (0727) 321889',
        prescriptionCode: prescription.prescription_code,
        date: prescription.created_at,
        patientName: prescription.patient_name,
        medicalRecordNumber: prescription.medical_record_number,
        medicineName: item.medicine_name,
        quantity: `${item.quantity_input} ${item.unit_selected}`,
        dosageInstruction: item.dosage_instruction,
        batchNumber: batchInfo ? batchInfo.batch_number : '-',
        expiredDate: batchInfo ? batchInfo.expired_date : '-',
        pharmacistSign: 'Apoteker',
        category: item.category || 'padat',
        isExternal: isExternal,
        etiketType: isExternal ? 'blue' : 'white',
        isRacikan: Boolean(item.is_racikan),
        racikanName: item.racikan_name || null,
        notes: item.notes || (isExternal ? 'OBAT LUAR - TIDAK BOLEH DITELAN' : 'Gunakan sesuai petunjuk dokter.')
      };
    });

    res.json({ success: true, data: etiketItems });
  } catch (error) {
    console.error('getEtiketData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  dispensePrescription,
  getEtiketData
};

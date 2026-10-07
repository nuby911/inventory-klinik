const db = require('../config/database');
const { convertToBaseUnit, previewFEFOAllocation, dispensePrescriptionFEFO } = require('../services/fefoService');

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

    // Attach FEFO allocation preview for each item
    const itemsWithFEFO = items.map(item => {
      const fefo = previewFEFOAllocation(item.medicine_id, item.quantity_base_unit);
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
    const { patient_id, doctor_id, is_cito, notes, items } = req.body;

    if (!patient_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pasien dan item resep wajib diisi' });
    }

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patient_id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
    }

    // Safety Contraindication Check
    const patientAllergies = (patient.allergies || '').toLowerCase();
    const warnings = [];

    for (const item of items) {
      const med = db.prepare('SELECT name, contraindications FROM medicines WHERE id = ?').get(item.medicine_id);
      if (med && med.contraindications) {
        const contraList = med.contraindications.toLowerCase().split(/[,/]/).map(s => s.trim());
        for (const contra of contraList) {
          if (contra && patientAllergies.includes(contra)) {
            warnings.push(`KONTRAINDIKASI: ${med.name} berisiko memicu alergi pasien (${patient.allergies})!`);
          }
        }
      }
    }

    // Generate unique prescription code
    const count = db.prepare('SELECT COUNT(*) as count FROM prescriptions').get().count + 1;
    const year = new Date().getFullYear();
    const prescription_code = `ER-${year}-${String(count).padStart(4, '0')}`;

    const createTransaction = db.transaction(() => {
      const insertRx = db.prepare(`
        INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status, is_cito, notes)
        VALUES (?, ?, ?, 'pending', ?, ?)
      `).run(prescription_code, patient_id, doctor_id || 1, is_cito ? 1 : 0, notes || null);

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

    db.prepare('UPDATE prescriptions SET status = ? WHERE id = ?').run(status, id);

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
    const { pharmacist_id } = req.body;

    const result = dispensePrescriptionFEFO(Number(id), pharmacist_id || 2);

    const io = req.app.get('io');
    if (io) {
      io.emit('prescription:dispensed', result);
      io.emit('stock:updated');
    }

    res.json({
      success: true,
      message: 'Dispensing obat berhasil dieksekusi dengan algoritma FEFO.',
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
      SELECT pi.medicine_id, pi.unit_selected, pi.quantity_input, pi.dosage_instruction, pi.notes,
             m.name as medicine_name, m.category
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(id);

    const etiketItems = items.map(item => {
      // Find nearest batch expiry for this medicine
      const nearestBatch = db.prepare(`
        SELECT batch_number, expired_date 
        FROM medicine_batches 
        WHERE medicine_id = ? AND stock_qty > 0 
        ORDER BY expired_date ASC LIMIT 1
      `).get(item.medicine_id);

      return {
        clinicName: 'KLINIK UTAMA ALMEDIKA',
        clinicAddress: 'Jl. Pemuda No. 45, Telp: (0727) 321889',
        prescriptionCode: prescription.prescription_code,
        date: prescription.created_at,
        patientName: prescription.patient_name,
        medicalRecordNumber: prescription.medical_record_number,
        medicineName: item.medicine_name,
        quantity: `${item.quantity_input} ${item.unit_selected}`,
        dosageInstruction: item.dosage_instruction,
        batchNumber: nearestBatch ? nearestBatch.batch_number : '-',
        expiredDate: nearestBatch ? nearestBatch.expired_date : '-',
        pharmacistSign: 'Apoteker',
        notes: item.notes || 'Gunakan sesuai petunjuk dokter.'
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

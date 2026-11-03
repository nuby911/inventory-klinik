const db = require('../config/database');

function getPatients(req, res) {
  try {
    const { search } = req.query;
    let query = `SELECT * FROM patients WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (LOWER(name) LIKE ? OR LOWER(medical_record_number) LIKE ?)`;
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY name ASC`;
    const patients = db.prepare(query).all(...params);
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('getPatients error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
    }

    const prescriptionHistory = db.prepare(`
      SELECT p.*, u.name as doctor_name,
             (SELECT COUNT(*) FROM prescription_items WHERE prescription_id = p.id) as item_count
      FROM prescriptions p
      JOIN users u ON p.doctor_id = u.id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...patient,
        prescriptionHistory
      }
    });
  } catch (error) {
    console.error('getPatientById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function createPatient(req, res) {
  try {
    const {
      name,
      medical_record_number,
      gender,
      date_of_birth,
      phone,
      blood_type,
      weight_kg,
      insurance_type,
      allergies
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap pasien wajib diisi.' });
    }

    const trimmedName = name.trim();
    const cleanGender = (gender === 'P' || gender === 'Perempuan') ? 'P' : 'L';
    
    // Generate RM if not provided
    let rm = medical_record_number?.trim();
    if (!rm) {
      const year = new Date().getFullYear();
      const maxRow = db.prepare('SELECT MAX(id) as maxId FROM patients').get();
      const nextNum = (maxRow?.maxId || 0) + 1;
      rm = `RM-${year}-${String(nextNum).padStart(4, '0')}`;
    }

    // Check RM collision
    const existingRM = db.prepare('SELECT id FROM patients WHERE medical_record_number = ?').get(rm);
    if (existingRM) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      rm = `${rm}-${randomSuffix}`;
    }

    const insertStmt = db.prepare(`
      INSERT INTO patients (medical_record_number, name, gender, date_of_birth, phone, blood_type, weight_kg, insurance_type, allergies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      rm,
      trimmedName,
      cleanGender,
      date_of_birth || null,
      phone || null,
      blood_type || 'O+',
      weight_kg ? Number(weight_kg) : 60,
      insurance_type || 'Umum',
      allergies || 'Tidak Ada'
    );

    const createdPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Pasien baru berhasil didaftarkan.',
      data: createdPatient
    });
  } catch (error) {
    console.error('createPatient error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getUsers(req, res) {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC').all();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  getUsers
};

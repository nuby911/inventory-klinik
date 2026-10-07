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
  getUsers
};

const path = require('path');
const fs = require('fs');

// 1. Isolate test database before requiring config/database
const testDbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}
const testDbPath = path.join(testDbDir, 'test_klinik_almedika.db');
process.env.DB_PATH = testDbPath;
process.env.NODE_ENV = 'test';

const db = require('../../src/config/database');

/**
 * Truncate all tables for fresh test state
 */
function resetTestDb() {
  db.exec(`
    DELETE FROM prescription_item_batches;
    DELETE FROM stock_adjustments;
    DELETE FROM prescription_items;
    DELETE FROM prescriptions;
    DELETE FROM medicine_batches;
    DELETE FROM medicine_units;
    DELETE FROM medicines;
    DELETE FROM patients;
    DELETE FROM users;
  `);
}

/**
 * Seed clean clinical fixtures for testing
 */
function seedTestFixtures() {
  resetTestDb();

  // Users
  const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run(1, 'dr. Tirta Mandira', 'dokter@almedika.com', 'hash_dokter', 'dokter');
  insertUser.run(2, 'apt. Ratna Dewi', 'apoteker@almedika.com', 'hash_apoteker', 'apoteker');
  insertUser.run(3, 'Admin Logistik', 'admin@almedika.com', 'hash_admin', 'admin');

  // Patients
  const insertPatient = db.prepare('INSERT INTO patients (id, medical_record_number, name, gender, allergies) VALUES (?, ?, ?, ?, ?)');
  insertPatient.run(1, 'RM-2026-0001', 'Budi Santoso', 'L', 'Penisilin / Golongan Beta-Laktam');
  insertPatient.run(2, 'RM-2026-0002', 'Siti Rahma', 'P', 'Tidak Ada');

  // Medicines
  const insertMed = db.prepare('INSERT INTO medicines (id, code, name, category, base_unit, total_stock, contraindications) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertMed.run(1, 'MED-PCT-500', 'Paracetamol 500mg', 'padat', 'Butir', 150, 'Gangguan Fungsi Hati');
  insertMed.run(2, 'MED-AMX-500', 'Amoxicillin 500mg', 'padat', 'Butir', 100, 'Penisilin / Beta-Laktam');
  insertMed.run(3, 'MED-CFX-100', 'Cefixime 100mg', 'padat', 'Kapsul', 0, 'Alergi Sefalosporin');

  // Medicine Units
  const insertUnit = db.prepare('INSERT INTO medicine_units (medicine_id, unit_name, conversion_ratio, is_base_unit) VALUES (?, ?, ?, ?)');
  insertUnit.run(1, 'Box', 100, 0);
  insertUnit.run(1, 'Strip', 10, 0);
  insertUnit.run(1, 'Butir', 1, 1);

  insertUnit.run(2, 'Box', 100, 0);
  insertUnit.run(2, 'Strip', 10, 0);
  insertUnit.run(2, 'Butir', 1, 1);

  // Medicine Batches for FEFO Testing
  const insertBatch = db.prepare('INSERT INTO medicine_batches (id, medicine_id, batch_number, expired_date, stock_qty, rack_location, distributor) VALUES (?, ?, ?, ?, ?, ?, ?)');
  // Oldest expiry: 2026-10-15 (Batch A, 30 butir)
  insertBatch.run(1, 1, 'BATCH-PCT-001', '2026-10-15', 30, 'Rak A-01', 'Kimia Farma');
  // Middle expiry: 2026-12-20 (Batch B, 50 butir)
  insertBatch.run(2, 1, 'BATCH-PCT-002', '2026-12-20', 50, 'Rak A-01', 'Kimia Farma');
  // Furthest expiry: 2027-06-30 (Batch C, 70 butir)
  insertBatch.run(3, 1, 'BATCH-PCT-003', '2027-06-30', 70, 'Rak A-02', 'Enseval');

  // Med 2 (Amoxicillin: 1 batch of 100 butir)
  insertBatch.run(4, 2, 'BATCH-AMX-001', '2026-11-01', 100, 'Rak B-01', 'Kimia Farma');
}

module.exports = {
  db,
  resetTestDb,
  seedTestFixtures,
  testDbPath
};

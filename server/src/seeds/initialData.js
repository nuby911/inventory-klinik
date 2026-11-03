const db = require('../config/database');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  // Check if users already seeded
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0) {
    console.log('Database already contains seed data.');
    return;
  }

  console.log('Seeding initial clinical data...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `);

  const insertPatient = db.prepare(`
    INSERT INTO patients (medical_record_number, name, gender, date_of_birth, phone, blood_type, weight_kg, insurance_type, allergies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMedicine = db.prepare(`
    INSERT INTO medicines (code, name, category, base_unit, total_stock, min_stock_alert, rack_location, contraindications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUnit = db.prepare(`
    INSERT INTO medicine_units (medicine_id, unit_name, conversion_ratio, is_base_unit)
    VALUES (?, ?, ?, ?)
  `);

  const insertBatch = db.prepare(`
    INSERT INTO medicine_batches (medicine_id, batch_number, expired_date, stock_qty, rack_location, distributor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status, is_cito, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPrescriptionItem = db.prepare(`
    INSERT INTO prescription_items (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction, is_racikan, racikan_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAdjustment = db.prepare(`
    INSERT INTO stock_adjustments (adjustment_code, batch_id, user_id, adjustment_type, quantity_base_unit, reason, distributor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const runSeed = db.transaction(() => {
    // 1. Users with standard bcrypt password hashes
    const defaultHash = bcrypt.hashSync('password123', 10);
    const u1 = insertUser.run('Dokter', 'dokter@almedika.com', defaultHash, 'dokter').lastInsertRowid;
    const u2 = insertUser.run('Apoteker', 'apoteker@almedika.com', defaultHash, 'apoteker').lastInsertRowid;
    const u3 = insertUser.run('Logistik', 'admin@almedika.com', defaultHash, 'admin').lastInsertRowid;

    // 2. Patients (matching Stitch prototype: Budi Santoso)
    const p1 = insertPatient.run('RM-2026-0842', 'Budi Santoso', 'L', '1984-03-12', '0812-3456-7890', 'O+', 68.0, 'BPJS Mandiri', 'Penisilin / Golongan Beta-Laktam').lastInsertRowid;
    const p2 = insertPatient.run('RM-2026-0843', 'Dewi Lestari', 'P', '1998-07-22', '0812-9876-5432', 'A+', 52.5, 'BPJS Mandiri', 'Sulfa').lastInsertRowid;
    const p3 = insertPatient.run('RM-2026-0844', 'Ahmad Zaki', 'L', '2018-11-05', '0813-7788-9900', 'B+', 24.0, 'Umum', 'Tidak Ada').lastInsertRowid;
    const p4 = insertPatient.run('RM-2026-0845', 'Siti Nurhaliza', 'P', '1975-01-30', '0815-1234-5678', 'AB+', 61.2, 'BPJS Mandiri', 'Aspirin / NSAID').lastInsertRowid;

    // 3. Medicines & Units
    // 3.1 Paracetamol 500mg
    const m1 = insertMedicine.run('MED-PCT-500', 'Paracetamol 500mg', 'padat', 'Butir', 1450, 50, 'Rak A-03', 'Gangguan Fungsi Hati Berat').lastInsertRowid;
    insertUnit.run(m1, 'Box', 100, 0);
    insertUnit.run(m1, 'Strip', 10, 0);
    insertUnit.run(m1, 'Butir', 1, 1);

    // Batches Paracetamol
    const b1_1 = insertBatch.run(m1, 'BCH-PCT-2025A', '2026-10-14', 150, 'Rak A-03', 'Kimia Farma Trading').lastInsertRowid; // Exp dekat!
    const b1_2 = insertBatch.run(m1, 'BCH-PCT-2026B', '2027-04-20', 500, 'Rak A-03', 'Kimia Farma Trading').lastInsertRowid;
    const b1_3 = insertBatch.run(m1, 'BCH-PCT-2027C', '2027-11-30', 800, 'Rak A-03', 'Anugrah Argon Medica').lastInsertRowid;

    // 3.2 Amoxicillin 500mg (Contains Beta-Laktam -> Contraindicated for Budi Santoso)
    const m2 = insertMedicine.run('MED-AMX-500', 'Amoxicillin 500mg', 'padat', 'Butir', 480, 50, 'Rak B-01', 'Penisilin / Beta-Laktam').lastInsertRowid;
    insertUnit.run(m2, 'Box', 100, 0);
    insertUnit.run(m2, 'Strip', 10, 0);
    insertUnit.run(m2, 'Butir', 1, 1);

    // Batches Amoxicillin
    const b2_1 = insertBatch.run(m2, 'BCH-AMX-2025D', '2026-10-25', 80, 'Rak B-01', 'Enseval Putera Megatrading').lastInsertRowid; // Kritis < 60 hari
    const b2_2 = insertBatch.run(m2, 'BCH-AMX-2026A', '2027-08-15', 400, 'Rak B-01', 'Enseval Putera Megatrading').lastInsertRowid;

    // 3.3 Cefixime 100mg
    const m3 = insertMedicine.run('MED-CFX-100', 'Cefixime 100mg', 'padat', 'Butir', 150, 20, 'Rak B-04', 'Alergi Sefalosporin').lastInsertRowid;
    insertUnit.run(m3, 'Box', 50, 0);
    insertUnit.run(m3, 'Strip', 10, 0);
    insertUnit.run(m3, 'Butir', 1, 1);
    insertBatch.run(m3, 'BCH-CFX-2026A', '2027-01-10', 150, 'Rak B-04', 'Mensa Bina Sukses');

    // 3.4 Cetirizine 10mg
    const m4 = insertMedicine.run('MED-CTZ-10', 'Cetirizine 10mg', 'padat', 'Butir', 40, 50, 'Rak A-05', 'Gagal Ginjal Berat').lastInsertRowid; // Stok Menipis
    insertUnit.run(m4, 'Box', 100, 0);
    insertUnit.run(m4, 'Strip', 10, 0);
    insertUnit.run(m4, 'Butir', 1, 1);
    insertBatch.run(m4, 'BCH-CTZ-2025X', '2026-11-05', 40, 'Rak A-05', 'Kimia Farma Trading');

    // 3.5 Ibuprofen Sirup 100mg/5ml
    const m5 = insertMedicine.run('MED-IBU-SYR', 'Ibuprofen Sirup 100mg/5ml', 'cair', 'Botol', 35, 10, 'Rak C-02', 'Tukak Lambung Berat').lastInsertRowid;
    insertUnit.run(m5, 'Karton', 24, 0);
    insertUnit.run(m5, 'Botol', 1, 1);
    insertBatch.run(m5, 'BCH-IBU-2026A', '2027-06-18', 35, 'Rak C-02', 'Tempo Scan Pacific');

    // 3.6 Ambroxol Sirup 15mg/5ml
    const m6 = insertMedicine.run('MED-AMB-SYR', 'Ambroxol Sirup 15mg/5ml', 'cair', 'Botol', 12, 15, 'Rak C-03', 'Hipersensitivitas').lastInsertRowid; // Kritis ED & stok menipis
    insertUnit.run(m6, 'Karton', 30, 0);
    insertUnit.run(m6, 'Botol', 1, 1);
    const b6_1 = insertBatch.run(m6, 'BCH-AMB-2025Z', '2026-10-02', 12, 'Rak C-03', 'Tempo Scan Pacific').lastInsertRowid;

    // 3.7 Hydrocortisone Salep 2.5%
    const m7 = insertMedicine.run('MED-HYD-CRM', 'Hydrocortisone Krim 2.5%', 'salep', 'Tube', 28, 10, 'Rak D-01', 'Infeksi Jamur Topikal').lastInsertRowid;
    insertUnit.run(m7, 'Box', 12, 0);
    insertUnit.run(m7, 'Tube', 1, 1);
    insertBatch.run(m7, 'BCH-HYD-2026A', '2027-09-12', 28, 'Rak D-01', 'Mensa Bina Sukses');

    // 3.8 Dexamethasone 0.5mg
    const m8 = insertMedicine.run('MED-DEX-05', 'Dexamethasone 0.5mg', 'padat', 'Butir', 250, 40, 'Rak A-07', 'Infeksi Virus Akut').lastInsertRowid;
    insertUnit.run(m8, 'Box', 100, 0);
    insertUnit.run(m8, 'Strip', 10, 0);
    insertUnit.run(m8, 'Butir', 1, 1);
    insertBatch.run(m8, 'BCH-DEX-2027A', '2027-12-01', 250, 'Rak A-07', 'Kimia Farma Trading');

    // 4. Initial Prescriptions
    // 4.1 Live Queue
    const now = new Date();
    const rx1Time = new Date(now.getTime() - 4 * 60000).toISOString();
    const rx1 = insertPrescription.run('ER-2026-0024', p1, u1, 'pending', 0, 'Pasien demam tinggi 38.8C + batuk pilek 3 hari.', rx1Time).lastInsertRowid;
    insertPrescriptionItem.run(rx1, m1, 'Strip', 2, 20, '3 x 1 Tablet Sehari Sesudah Makan', 0, null, 'Habiskan bila demam berlanjut');
    insertPrescriptionItem.run(rx1, m4, 'Strip', 1, 10, '1 x 1 Tablet Malam Sebelum Tidur', 0, null, 'Bila bersin/gatal');

    // 4.2 Preparing Queue
    const rx2Time = new Date(now.getTime() - 15 * 60000).toISOString();
    const rx2 = insertPrescription.run('ER-2026-0023', p2, u1, 'preparing', 0, 'Kontrol nyeri sendi pasca aktivitas berat', rx2Time).lastInsertRowid;
    insertPrescriptionItem.run(rx2, m5, 'Botol', 1, 1, '3 x 1 Sendok Takar (5ml) Sesudah Makan', 0, null, 'Gojog dahulu sebelum diminum');

    // 4.3 Completed
    const rx3Time = new Date(now.getTime() - 45 * 60000).toISOString();
    const rx3 = insertPrescription.run('ER-2026-0022', p3, u1, 'completed', 0, 'Batuk berdahak anak 8 th', rx3Time).lastInsertRowid;
    insertPrescriptionItem.run(rx3, m6, 'Botol', 1, 1, '3 x 1/2 Sendok Takar Sesudah Makan', 0, null, 'Simpan di suhu ruang terlindung cahaya');

    // 5. Initial Adjustments & Audit Trail (Matching Stitch Screen 4)
    insertAdjustment.run('ADJ-2026-0038', b2_1, u2, 'retur_supplier', 50, 'Cacat blister pabrik dan mendekati ED < 60 hari', 'Enseval Putera Megatrading', new Date(now.getTime() - 2 * 3600000).toISOString());
    insertAdjustment.run('ADJ-2026-0037', b6_1, u2, 'damaged', 2, 'Botol pecah saat pemindahan rak C-03', 'Tempo Scan Pacific', new Date(now.getTime() - 8 * 3600000).toISOString());
    insertAdjustment.run('ADJ-2026-0036', b1_1, u3, 'stock_opname_adjustment', 10, 'Penyesuaian rekonsiliasi stok fisik rak A-03', 'Kimia Farma Trading', new Date(now.getTime() - 24 * 3600000).toISOString());

    console.log('Seed data successfully initialized!');
  });

  runSeed();
}

module.exports = seedDatabase;

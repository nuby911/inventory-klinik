const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'klinik_almedika.db');
const db = new Database(dbPath);

// Enable foreign keys, WAL mode, and busy timeout for high concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

function initSchema() {
  db.exec(`
    -- 1. Table Users
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK (role IN ('admin', 'dokter', 'apoteker')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Table Patients
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medical_record_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gender TEXT CHECK (gender IN ('L', 'P')),
        date_of_birth TEXT,
        phone TEXT,
        blood_type TEXT,
        weight_kg REAL,
        insurance_type TEXT DEFAULT 'BPJS Mandiri',
        allergies TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Table Master Medicines
    CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT CHECK (category IN ('padat', 'cair', 'salep', 'injeksi')),
        base_unit TEXT NOT NULL,
        total_stock INTEGER DEFAULT 0,
        min_stock_alert INTEGER DEFAULT 10,
        rack_location TEXT,
        contraindications TEXT,
        bpom_nie TEXT,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Table Medicine Units (Konversi Multi-Satuan)
    CREATE TABLE IF NOT EXISTS medicine_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
        unit_name TEXT NOT NULL,
        conversion_ratio INTEGER NOT NULL,
        is_base_unit BOOLEAN DEFAULT 0
    );

    -- 5. Table Medicine Batches (FEFO Tracking)
    CREATE TABLE IF NOT EXISTS medicine_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
        batch_number TEXT NOT NULL,
        expired_date TEXT NOT NULL,
        stock_qty INTEGER NOT NULL,
        rack_location TEXT,
        distributor TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Table Prescriptions (Header)
    CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_code TEXT UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id),
        doctor_id INTEGER REFERENCES users(id),
        status TEXT CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')) DEFAULT 'pending',
        is_cito BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Table Prescription Items (Detail)
    CREATE TABLE IF NOT EXISTS prescription_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
        medicine_id INTEGER REFERENCES medicines(id),
        unit_selected TEXT NOT NULL,
        quantity_input INTEGER NOT NULL,
        quantity_base_unit INTEGER NOT NULL,
        dosage_instruction TEXT NOT NULL,
        is_racikan BOOLEAN DEFAULT 0,
        racikan_name TEXT,
        notes TEXT
    );

    -- 8. Table Stock Adjustments & Returns
    CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adjustment_code TEXT UNIQUE,
        batch_id INTEGER REFERENCES medicine_batches(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
        adjustment_type TEXT CHECK (adjustment_type IN ('retur_supplier', 'damaged', 'expired_disposal', 'stock_opname_adjustment')),
        quantity_base_unit INTEGER NOT NULL CHECK (quantity_base_unit > 0),
        reason TEXT NOT NULL,
        distributor TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Table Prescription Item Batches (BPOM Drug Recall & Batch Traceability)
    CREATE TABLE IF NOT EXISTS prescription_item_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_item_id INTEGER NOT NULL REFERENCES prescription_items(id) ON DELETE CASCADE,
        batch_id INTEGER NOT NULL REFERENCES medicine_batches(id),
        batch_number TEXT NOT NULL,
        expired_date TEXT NOT NULL,
        dispensed_qty INTEGER NOT NULL CHECK (dispensed_qty > 0),
        pharmacist_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Covering & Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_units_med_ratio ON medicine_units(medicine_id, conversion_ratio DESC);
    CREATE INDEX IF NOT EXISTS idx_batches_med_fefo ON medicine_batches(medicine_id, stock_qty, expired_date ASC);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medicine_batches(expired_date ASC);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_status_created ON prescriptions(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON prescription_items(prescription_id);
    CREATE INDEX IF NOT EXISTS idx_prescription_items_med ON prescription_items(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_prescription_item_batches_item ON prescription_item_batches(prescription_item_id);
    CREATE INDEX IF NOT EXISTS idx_prescription_item_batches_batch ON prescription_item_batches(batch_id);
    CREATE INDEX IF NOT EXISTS idx_adjustments_batch ON stock_adjustments(batch_id);
    CREATE INDEX IF NOT EXISTS idx_adjustments_type ON stock_adjustments(adjustment_type);
    CREATE INDEX IF NOT EXISTS idx_medicines_cat_name ON medicines(category, name);
  `);

  // Migration: Ensure bpom_nie and barcode exist for existing DBs
  try {
    const tableInfo = db.pragma('table_info(medicines)');
    const colNames = tableInfo.map(c => c.name);
    if (!colNames.includes('bpom_nie')) {
      db.exec('ALTER TABLE medicines ADD COLUMN bpom_nie TEXT');
    }
    if (!colNames.includes('barcode')) {
      db.exec('ALTER TABLE medicines ADD COLUMN barcode TEXT');
    }

    // Populate missing barcodes and BPOM NIEs for sample catalog
    db.prepare("UPDATE medicines SET bpom_nie = 'DKL1904414810H1', barcode = '08999999008013' WHERE code = 'MED-DEX-05' AND (bpom_nie IS NULL OR barcode IS NULL)").run();
  } catch (e) {
    console.error('Migration error:', e);
  }
}

initSchema();

module.exports = db;

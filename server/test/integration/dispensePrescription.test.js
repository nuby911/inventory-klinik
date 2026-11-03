const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { db, seedTestFixtures } = require('../helpers/testDb');
const { dispensePrescriptionFEFO } = require('../../src/services/fefoService');

describe('dispensePrescriptionFEFO (Integration & Atomicity)', () => {
  beforeEach(() => {
    seedTestFixtures();
  });

  it('should atomically deduct batch stock, reduce master medicine total, and record BPOM batch traceability', () => {
    // Arrange: Create prescription for 40 butir of Paracetamol
    const insertRx = db.prepare(`
      INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status)
      VALUES ('ER-2026-TEST1', 1, 1, 'pending')
    `).run();
    const rxId = insertRx.lastInsertRowid;

    const itemRow = db.prepare(`
      INSERT INTO prescription_items 
      (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction)
      VALUES (?, 1, 'Butir', 40, 40, '3x1 tablet')
    `).run(rxId);
    const itemId = itemRow.lastInsertRowid;

    // Act
    const result = dispensePrescriptionFEFO(rxId, 2);

    // Assert
    assert.strictEqual(result.prescriptionCode, 'ER-2026-TEST1');

    // Batch 1 (30 stock) -> 0
    const b1 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 1').get();
    assert.strictEqual(b1.stock_qty, 0);

    // Batch 2 (50 stock) -> 40
    const b2 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 2').get();
    assert.strictEqual(b2.stock_qty, 40);

    // Batch 3 (70 stock) -> 70 (untouched)
    const b3 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 3').get();
    assert.strictEqual(b3.stock_qty, 70);

    // Medicine total_stock -> 150 - 40 = 110
    const med = db.prepare('SELECT total_stock FROM medicines WHERE id = 1').get();
    assert.strictEqual(med.total_stock, 110);

    // Status updated
    const rx = db.prepare('SELECT status FROM prescriptions WHERE id = ?').get(rxId);
    assert.strictEqual(rx.status, 'completed');

    // Verify BPOM batch traceability records exist
    const tracedBatches = db.prepare('SELECT * FROM prescription_item_batches WHERE prescription_item_id = ? ORDER BY id ASC').all(itemId);
    assert.strictEqual(tracedBatches.length, 2);
    assert.strictEqual(tracedBatches[0].batch_number, 'BATCH-PCT-001');
    assert.strictEqual(tracedBatches[0].dispensed_qty, 30);
    assert.strictEqual(tracedBatches[1].batch_number, 'BATCH-PCT-002');
    assert.strictEqual(tracedBatches[1].dispensed_qty, 10);
  });

  it('should enforce idempotency and reject re-dispensing an already completed prescription', () => {
    const rxId = db.prepare(`
      INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status)
      VALUES ('ER-2026-TEST2', 1, 1, 'completed')
    `).run().lastInsertRowid;

    db.prepare(`
      INSERT INTO prescription_items 
      (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction)
      VALUES (?, 1, 'Butir', 10, 10, '3x1 tablet')
    `).run(rxId);

    assert.throws(
      () => dispensePrescriptionFEFO(rxId, 2),
      /Resep ini sudah selesai diproses sebelumnya/
    );

    // Master stock untouched
    const med = db.prepare('SELECT total_stock FROM medicines WHERE id = 1').get();
    assert.strictEqual(med.total_stock, 150);
  });

  it('should rollback entire transaction if any item has insufficient stock (all-or-nothing atomicity)', () => {
    // Arrange: Item 1 has plenty of stock (10 Butir Paracetamol), Item 2 has 0 stock (5 Kapsul Cefixime)
    const rxId = db.prepare(`
      INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status)
      VALUES ('ER-2026-TEST3', 1, 1, 'pending')
    `).run().lastInsertRowid;

    db.prepare(`
      INSERT INTO prescription_items 
      (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction)
      VALUES (?, 1, 'Butir', 10, 10, '3x1')
    `).run(rxId);

    db.prepare(`
      INSERT INTO prescription_items 
      (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction)
      VALUES (?, 3, 'Kapsul', 5, 5, '1x1')
    `).run(rxId);

    // Act & Assert: Expect throw
    assert.throws(
      () => dispensePrescriptionFEFO(rxId, 2),
      /Stok obat Cefixime 100mg tidak mencukupi untuk memenuhi resep/
    );

    // Verify Item 1 stock was NOT partially deducted
    const b1 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 1').get();
    assert.strictEqual(b1.stock_qty, 30, 'Batch 1 must not be deducted on multi-item shortage');

    const med1 = db.prepare('SELECT total_stock FROM medicines WHERE id = 1').get();
    assert.strictEqual(med1.total_stock, 150, 'Medicine 1 total must remain intact');

    const rx = db.prepare('SELECT status FROM prescriptions WHERE id = ?').get(rxId);
    assert.strictEqual(rx.status, 'pending');
  });

  it('should reject dispensing of a cancelled prescription', () => {
    const rxId = db.prepare(`
      INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, status)
      VALUES ('ER-2026-TEST-CANCEL', 1, 1, 'cancelled')
    `).run().lastInsertRowid;

    db.prepare(`
      INSERT INTO prescription_items 
      (prescription_id, medicine_id, unit_selected, quantity_input, quantity_base_unit, dosage_instruction)
      VALUES (?, 1, 'Butir', 10, 10, '3x1 tablet')
    `).run(rxId);

    assert.throws(
      () => dispensePrescriptionFEFO(rxId, 2),
      /Resep ini telah dibatalkan dan tidak dapat diserahkan/
    );

    const med = db.prepare('SELECT total_stock FROM medicines WHERE id = 1').get();
    assert.strictEqual(med.total_stock, 150);
  });

  it('should throw an error if prescription ID does not exist', () => {
    assert.throws(
      () => dispensePrescriptionFEFO(99999, 2),
      /Resep tidak ditemukan/
    );
  });
});

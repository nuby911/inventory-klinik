const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { db, seedTestFixtures } = require('../helpers/testDb');
const { createTestApp, startTestServer } = require('../helpers/testApp');

describe('Stock Adjustments (Integration Tests)', () => {
  let serverInfo;
  let app;

  before(async () => {
    app = createTestApp();
    serverInfo = await startTestServer(app);
  });

  after(async () => {
    if (serverInfo) await serverInfo.close();
  });

  beforeEach(() => {
    seedTestFixtures();
  });

  it('should successfully record a damaged stock adjustment and deduct inventory', async () => {
    const res = await fetch(`${serverInfo.url}/api/adjustments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'apoteker',
        'x-user-id': '2'
      },
      body: JSON.stringify({
        batch_id: 1,
        adjustment_type: 'damaged',
        quantity_input: 10,
        unit_selected: 'Butir',
        reason: 'Kemasan rusak saat pengangkutan'
      })
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.match(body.data.adjustment_code, /^ADJ-/);

    // Verify batch deduction (30 - 10 = 20)
    const b1 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 1').get();
    assert.strictEqual(b1.stock_qty, 20);

    // Verify medicine total deduction (150 - 10 = 140)
    const med = db.prepare('SELECT total_stock FROM medicines WHERE id = 1').get();
    assert.strictEqual(med.total_stock, 140);

    // Verify adjustment record in DB
    const adj = db.prepare('SELECT * FROM stock_adjustments WHERE id = ?').get(body.data.id);
    assert.strictEqual(adj.adjustment_type, 'damaged');
    assert.strictEqual(adj.quantity_base_unit, 10);
  });

  it('should convert multi-unit (e.g. Strip) before deducting in return to supplier', async () => {
    // Batch 4 has 100 Butir of Amoxicillin. 1 Strip = 10 Butir. Return 2 Strip = 20 Butir.
    const res = await fetch(`${serverInfo.url}/api/adjustments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'apoteker',
        'x-user-id': '2'
      },
      body: JSON.stringify({
        batch_id: 4,
        adjustment_type: 'retur_supplier',
        quantity_input: 2,
        unit_selected: 'Strip',
        reason: 'Mendekati ED, retur konsinyasi',
        distributor: 'Kimia Farma'
      })
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.data.quantity_base_unit, 20);

    const b4 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 4').get();
    assert.strictEqual(b4.stock_qty, 80);

    const med2 = db.prepare('SELECT total_stock FROM medicines WHERE id = 2').get();
    assert.strictEqual(med2.total_stock, 80);
  });

  it('should reject adjustment if quantity exceeds available batch stock (boundary check)', async () => {
    // Batch 1 only has 30 Butir. Request 35 Butir.
    const res = await fetch(`${serverInfo.url}/api/adjustments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'apoteker',
        'x-user-id': '2'
      },
      body: JSON.stringify({
        batch_id: 1,
        adjustment_type: 'expired_disposal',
        quantity_input: 35,
        unit_selected: 'Butir',
        reason: 'Pemusnahan obat ED'
      })
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.match(body.message, /melebihi sisa stok batch/);

    // Verify stock was not touched
    const b1 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 1').get();
    assert.strictEqual(b1.stock_qty, 30);
  });

  it('should reject adjustment when mandatory fields are missing', async () => {
    const res = await fetch(`${serverInfo.url}/api/adjustments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'apoteker'
      },
      body: JSON.stringify({
        batch_id: 1
      })
    });

    assert.strictEqual(res.status, 400);
  });

  it('should reject adjustment for non-existent batch (404)', async () => {
    const res = await fetch(`${serverInfo.url}/api/adjustments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({
        batch_id: 99999,
        adjustment_type: 'stock_opname_adjustment',
        quantity_input: 1,
        reason: 'Koreksi opname'
      })
    });

    assert.strictEqual(res.status, 404);
  });
});

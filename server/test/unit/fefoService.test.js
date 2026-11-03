const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { db, seedTestFixtures } = require('../helpers/testDb');
const {
  convertToBaseUnit,
  formatMultiUnitBreakdown,
  previewFEFOAllocation
} = require('../../src/services/fefoService');

describe('fefoService (Unit Tests)', () => {
  beforeEach(() => {
    seedTestFixtures();
  });

  describe('convertToBaseUnit', () => {
    it('should correctly convert multi-unit ratio to base unit', () => {
      // 2 Box = 2 * 100 = 200
      const baseBox = convertToBaseUnit(1, 'Box', 2);
      assert.strictEqual(baseBox, 200);

      // 5 Strip = 5 * 10 = 50
      const baseStrip = convertToBaseUnit(1, 'Strip', 5);
      assert.strictEqual(baseStrip, 50);

      // 7 Butir = 7 * 1 = 7
      const baseButir = convertToBaseUnit(1, 'Butir', 7);
      assert.strictEqual(baseButir, 7);
    });

    it('should handle case-insensitive unit lookup', () => {
      const lower = convertToBaseUnit(1, 'box', 1);
      const upper = convertToBaseUnit(1, 'BOX', 1);
      assert.strictEqual(lower, 100);
      assert.strictEqual(upper, 100);
    });

    it('should fall back to medicines.base_unit directly when not registered in medicine_units', () => {
      // Med 3 has base_unit 'Kapsul' but no entries in medicine_units
      const qty = convertToBaseUnit(3, 'Kapsul', 15);
      assert.strictEqual(qty, 15);
    });

    it('should throw an error for an unknown or invalid unit', () => {
      assert.throws(
        () => convertToBaseUnit(1, 'Botol', 2),
        /Satuan 'Botol' tidak terdaftar untuk obat ID 1/
      );
    });
  });

  describe('formatMultiUnitBreakdown', () => {
    it('should format multi-tier stock hierarchy with clean breakdown', () => {
      // 256 Butir = 2 Box (200), 5 Strip (50), 6 Butir (6)
      const res1 = formatMultiUnitBreakdown(1, 256);
      assert.strictEqual(res1, '2 Box, 5 Strip, 6 Butir');

      // 105 Butir = 1 Box (100), 5 Butir (5)
      const res2 = formatMultiUnitBreakdown(1, 105);
      assert.strictEqual(res2, '1 Box, 5 Butir');
    });

    it('should omit larger units if stock is below their conversion ratio', () => {
      // 35 Butir = 3 Strip, 5 Butir (no Box)
      const res = formatMultiUnitBreakdown(1, 35);
      assert.strictEqual(res, '3 Strip, 5 Butir');
    });

    it('should return 0 smallest unit when stock is 0', () => {
      const res = formatMultiUnitBreakdown(1, 0);
      assert.strictEqual(res, '0 Butir');
    });

    it('should fall back to base unit directly if medicine has no units configured', () => {
      const res = formatMultiUnitBreakdown(3, 42);
      assert.strictEqual(res, '42 Kapsul');
    });
  });

  describe('previewFEFOAllocation', () => {
    it('should allocate strictly from the earliest expired batch first (FEFO)', () => {
      // Request 20 Butir -> Batch 1 has 30 expiring 2026-10-15
      const preview = previewFEFOAllocation(1, 20);

      assert.strictEqual(preview.isFulfilled, true);
      assert.strictEqual(preview.deficit, 0);
      assert.strictEqual(preview.allocation.length, 1);
      assert.strictEqual(preview.allocation[0].batchNumber, 'BATCH-PCT-001');
      assert.strictEqual(preview.allocation[0].takeQty, 20);
      assert.strictEqual(preview.allocation[0].remainingBatchQty, 10);
    });

    it('should split allocation across multiple batches in chronological order', () => {
      // Request 45 Butir -> 30 from Batch 1 (depleted), 15 from Batch 2
      const preview = previewFEFOAllocation(1, 45);

      assert.strictEqual(preview.isFulfilled, true);
      assert.strictEqual(preview.deficit, 0);
      assert.strictEqual(preview.allocation.length, 2);

      // 1st batch taken
      assert.strictEqual(preview.allocation[0].batchNumber, 'BATCH-PCT-001');
      assert.strictEqual(preview.allocation[0].takeQty, 30);
      assert.strictEqual(preview.allocation[0].remainingBatchQty, 0);

      // 2nd batch taken
      assert.strictEqual(preview.allocation[1].batchNumber, 'BATCH-PCT-002');
      assert.strictEqual(preview.allocation[1].takeQty, 15);
      assert.strictEqual(preview.allocation[1].remainingBatchQty, 35);
    });

    it('should calculate deficit when requested quantity exceeds total stock', () => {
      // Total available for Med 1 is 150 (30 + 50 + 70). Request 180.
      const preview = previewFEFOAllocation(1, 180);

      assert.strictEqual(preview.isFulfilled, false);
      assert.strictEqual(preview.deficit, 30);
      assert.strictEqual(preview.allocation.length, 3);
    });

    it('should return empty allocation and total deficit when medicine has 0 stock', () => {
      const preview = previewFEFOAllocation(3, 10);

      assert.strictEqual(preview.isFulfilled, false);
      assert.strictEqual(preview.deficit, 10);
      assert.strictEqual(preview.allocation.length, 0);
    });

    it('should NOT produce side-effects or mutate database during preview', () => {
      previewFEFOAllocation(1, 45);

      const b1 = db.prepare('SELECT stock_qty FROM medicine_batches WHERE id = 1').get();
      assert.strictEqual(b1.stock_qty, 30, 'Batch 1 stock must remain unchanged');
    });
  });
});

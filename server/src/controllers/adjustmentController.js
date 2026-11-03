const db = require('../config/database');
const { convertToBaseUnit } = require('../services/fefoService');

function getAdjustments(req, res) {
  try {
    const { adjustment_type, search } = req.query;
    let query = `
      SELECT a.*, 
             b.batch_number, b.expired_date, b.rack_location,
             m.id as medicine_id, m.name as medicine_name, m.code as medicine_code, m.base_unit,
             u.name as user_name, u.role as user_role
      FROM stock_adjustments a
      JOIN medicine_batches b ON a.batch_id = b.id
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (adjustment_type && adjustment_type !== 'all') {
      query += ` AND a.adjustment_type = ?`;
      params.push(adjustment_type);
    }

    if (search) {
      query += ` AND (LOWER(a.adjustment_code) LIKE ? OR LOWER(m.name) LIKE ? OR LOWER(b.batch_number) LIKE ? OR LOWER(a.reason) LIKE ?)`;
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY a.created_at DESC`;

    const adjustments = db.prepare(query).all(...params);
    res.json({ success: true, data: adjustments });
  } catch (error) {
    console.error('getAdjustments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getAdjustmentKpis(req, res) {
  try {
    const returCount = db.prepare(`SELECT COUNT(DISTINCT batch_id) as count FROM stock_adjustments WHERE adjustment_type = 'retur_supplier'`).get().count;
    const damagedCount = db.prepare(`SELECT COUNT(DISTINCT batch_id) as count FROM stock_adjustments WHERE adjustment_type = 'damaged'`).get().count;
    const disposalCount = db.prepare(`SELECT COUNT(DISTINCT batch_id) as count FROM stock_adjustments WHERE adjustment_type = 'expired_disposal'`).get().count;
    const opnameCount = db.prepare(`SELECT COUNT(*) as count FROM stock_adjustments WHERE adjustment_type = 'stock_opname_adjustment'`).get().count;

    res.json({
      success: true,
      data: {
        returSupplierCount: returCount,
        damagedCount: damagedCount,
        disposalCount: disposalCount,
        opnameAdjustmentCount: opnameCount
      }
    });
  } catch (error) {
    console.error('getAdjustmentKpis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function createAdjustment(req, res) {
  try {
    const { batch_id, adjustment_type, unit_selected, quantity_input, reason, distributor } = req.body;
    const user_id = req.user?.id || req.body.user_id || 2;

    if (!batch_id || !adjustment_type || !quantity_input || !reason) {
      return res.status(400).json({ success: false, message: 'Batch, jenis penyesuaian, kuantitas, dan alasan wajib diisi' });
    }

    const ALLOWED_TYPES = ['retur_supplier', 'damaged', 'expired_disposal', 'stock_opname_adjustment'];
    if (!ALLOWED_TYPES.includes(adjustment_type)) {
      return res.status(400).json({
        success: false,
        message: `Jenis penyesuaian tidak valid ('${adjustment_type}'). Pilih salah satu dari: ${ALLOWED_TYPES.join(', ')}`
      });
    }

    const qtyNumber = Number(quantity_input);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Kuantitas penyesuaian harus berupa angka positif lebih besar dari 0' });
    }

    const batch = db.prepare(`
      SELECT b.*, m.name as medicine_name, m.base_unit 
      FROM medicine_batches b 
      JOIN medicines m ON b.medicine_id = m.id 
      WHERE b.id = ?
    `).get(batch_id);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch obat tidak ditemukan' });
    }

    const unit = unit_selected || batch.base_unit;
    const qtyBase = convertToBaseUnit(batch.medicine_id, unit, qtyNumber);

    if (qtyBase > batch.stock_qty) {
      return res.status(400).json({
        success: false,
        message: `Kuantitas penyesuaian (${qtyBase} ${batch.base_unit}) melebihi sisa stok batch (${batch.stock_qty} ${batch.base_unit})`
      });
    }

    // Generate collision-safe reference code
    const maxIdRow = db.prepare('SELECT MAX(id) as maxId FROM stock_adjustments').get();
    const nextNum = (maxIdRow?.maxId || 0) + 1;
    const year = new Date().getFullYear();
    let adjustment_code = `ADJ-${year}-${String(nextNum).padStart(4, '0')}`;
    const existingCode = db.prepare('SELECT id FROM stock_adjustments WHERE adjustment_code = ?').get(adjustment_code);
    if (existingCode) {
      adjustment_code = `ADJ-${year}-${String(nextNum).padStart(4, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const executeTx = db.transaction(() => {
      // Deduct from batch with negative stock defense
      const batchUpdate = db.prepare('UPDATE medicine_batches SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?').run(qtyBase, batch_id, qtyBase);
      if (batchUpdate.changes === 0) {
        throw new Error('Gagal memotong stok batch: sisa stok tidak mencukupi.');
      }

      // Deduct from medicine total stock
      const medUpdate = db.prepare('UPDATE medicines SET total_stock = total_stock - ? WHERE id = ? AND total_stock >= ?').run(qtyBase, batch.medicine_id, qtyBase);
      if (medUpdate.changes === 0) {
        throw new Error('Gagal memotong stok master: sisa stok master tidak mencukupi.');
      }

      // Insert adjustment log
      const insertStmt = db.prepare(`
        INSERT INTO stock_adjustments 
        (adjustment_code, batch_id, user_id, adjustment_type, quantity_base_unit, reason, distributor)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        adjustment_code,
        batch_id,
        user_id,
        adjustment_type,
        qtyBase,
        reason,
        distributor || batch.distributor || 'Supplier Terkait'
      );

      return insertStmt.lastInsertRowid;
    });

    const newAdjId = executeTx();

    const io = req.app.get('io');
    if (io) {
      io.emit('stock:updated');
    }

    res.status(201).json({
      success: true,
      message: `Mutasi stok ${adjustment_code} berhasil dicatat. Stok batch berkurang ${qtyBase} ${batch.base_unit}.`,
      data: {
        id: newAdjId,
        adjustment_code,
        batch_number: batch.batch_number,
        medicine_name: batch.medicine_name,
        quantity_base_unit: qtyBase
      }
    });
  } catch (error) {
    console.error('createAdjustment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getAdjustments,
  getAdjustmentKpis,
  createAdjustment
};

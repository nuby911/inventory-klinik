const db = require('../config/database');
const { convertToBaseUnit } = require('../services/fefoService');

function getBatches(req, res) {
  try {
    const { medicine_id, expiring_soon } = req.query;
    let query = `
      SELECT b.*, m.name as medicine_name, m.code as medicine_code, m.base_unit
      FROM medicine_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.stock_qty > 0
    `;
    const params = [];

    if (medicine_id) {
      query += ` AND b.medicine_id = ?`;
      params.push(medicine_id);
    }

    if (expiring_soon) {
      query += ` AND date(b.expired_date) <= date('now', '+60 days')`;
    }

    query += ` ORDER BY b.expired_date ASC`;

    const batches = db.prepare(query).all(...params);

    const enriched = batches.map(b => {
      const diffTime = new Date(b.expired_date) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...b,
        daysUntilExpiry: diffDays,
        isExpired: diffDays <= 0,
        isCritical: diffDays > 0 && diffDays <= 60
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('getBatches error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getExpiringBatches(req, res) {
  try {
    const days = Number(req.query.days) || 60;
    const batches = db.prepare(`
      SELECT b.*, m.name as medicine_name, m.code as medicine_code, m.base_unit
      FROM medicine_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.stock_qty > 0 AND date(b.expired_date) <= date('now', '+' || ? || ' days')
      ORDER BY b.expired_date ASC
    `).all(days);

    const enriched = batches.map(b => {
      const diffTime = new Date(b.expired_date) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...b,
        daysUntilExpiry: diffDays,
        isExpired: diffDays <= 0,
        isCritical: diffDays > 0 && diffDays <= 60
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('getExpiringBatches error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function addBatch(req, res) {
  try {
    const { medicine_id, batch_number, expired_date, unit_selected, quantity_input, rack_location, distributor } = req.body;

    if (!medicine_id || !batch_number || !expired_date || !quantity_input) {
      return res.status(400).json({ success: false, message: 'Obat, nomor batch, tanggal ED, dan kuantitas wajib diisi' });
    }

    const qtyNumber = Number(quantity_input);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Kuantitas obat masuk harus berupa angka positif lebih besar dari 0' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expired_date) || isNaN(Date.parse(expired_date))) {
      return res.status(400).json({ success: false, message: 'Format tanggal kedaluwarsa tidak valid (gunakan format YYYY-MM-DD)' });
    }

    const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicine_id);
    if (!med) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }

    const unitToUse = unit_selected || med.base_unit;
    const qtyBase = convertToBaseUnit(medicine_id, unitToUse, Number(quantity_input));

    const insertTx = db.transaction(() => {
      const insertBatchStmt = db.prepare(`
        INSERT INTO medicine_batches (medicine_id, batch_number, expired_date, stock_qty, rack_location, distributor)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(medicine_id, batch_number, expired_date, qtyBase, rack_location || med.rack_location, distributor || 'Supplier Utama');

      // Update medicine total stock
      db.prepare('UPDATE medicines SET total_stock = total_stock + ? WHERE id = ?').run(qtyBase, medicine_id);

      return insertBatchStmt.lastInsertRowid;
    });

    const newBatchId = insertTx();

    const io = req.app.get('io');
    if (io) {
      io.emit('stock:updated');
    }

    res.status(201).json({
      success: true,
      message: `Batch ${batch_number} berhasil ditambahkan (${quantity_input} ${unitToUse} = ${qtyBase} ${med.base_unit}).`,
      batchId: newBatchId
    });
  } catch (error) {
    console.error('addBatch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getBatches,
  getExpiringBatches,
  addBatch
};

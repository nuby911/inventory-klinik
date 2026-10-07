const db = require('../config/database');
const { formatMultiUnitBreakdown } = require('../services/fefoService');

function getMedicines(req, res) {
  try {
    const { category, search, status } = req.query;
    let query = `SELECT * FROM medicines WHERE 1=1`;
    const params = [];

    if (category && category !== 'all' && category !== 'Semua') {
      query += ` AND LOWER(category) = LOWER(?)`;
      params.push(category);
    }

    if (search) {
      query += ` AND (LOWER(name) LIKE ? OR LOWER(code) LIKE ? OR LOWER(COALESCE(bpom_nie, '')) LIKE ? OR LOWER(COALESCE(barcode, '')) LIKE ?)`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY name ASC`;

    const medicines = db.prepare(query).all(...params);

    const enriched = medicines.map(med => {
      // Get units
      const units = db.prepare(`
        SELECT unit_name, conversion_ratio, is_base_unit 
        FROM medicine_units 
        WHERE medicine_id = ? 
        ORDER BY conversion_ratio DESC
      `).all(med.id);

      // Get nearest expiry batch
      const nearestBatch = db.prepare(`
        SELECT batch_number, expired_date, stock_qty 
        FROM medicine_batches 
        WHERE medicine_id = ? AND stock_qty > 0 
        ORDER BY expired_date ASC LIMIT 1
      `).get(med.id);

      // Calculate stock status
      let stockStatus = 'Aman';
      if (med.total_stock === 0) {
        stockStatus = 'Habis';
      } else if (med.total_stock <= med.min_stock_alert) {
        stockStatus = 'Kritis';
      } else if (med.total_stock <= med.min_stock_alert * 2) {
        stockStatus = 'Menipis';
      }

      // Check if nearest batch is expiring within 60 days
      const isExpiringSoon = nearestBatch ? (() => {
        const diffTime = new Date(nearestBatch.expired_date) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 60;
      })() : false;

      return {
        ...med,
        units,
        breakdownText: formatMultiUnitBreakdown(med.id, med.total_stock),
        stockStatus,
        isExpiringSoon,
        nearestBatch
      };
    });

    if (status) {
      const filtered = enriched.filter(m => m.stockStatus.toLowerCase() === status.toLowerCase());
      return res.json({ success: true, data: filtered });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('getMedicines error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getMedicineById(req, res) {
  try {
    const { id } = req.params;
    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }

    const units = db.prepare('SELECT * FROM medicine_units WHERE medicine_id = ? ORDER BY conversion_ratio DESC').all(id);
    const batches = db.prepare('SELECT * FROM medicine_batches WHERE medicine_id = ? ORDER BY expired_date ASC').all(id);

    res.json({
      success: true,
      data: {
        ...medicine,
        units,
        batches,
        breakdownText: formatMultiUnitBreakdown(medicine.id, medicine.total_stock)
      }
    });
  } catch (error) {
    console.error('getMedicineById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function createMedicine(req, res) {
  try {
    const { code, name, category, base_unit, min_stock_alert, rack_location, contraindications, bpom_nie, barcode, units } = req.body;

    if (!code || !name || !base_unit) {
      return res.status(400).json({ success: false, message: 'Kode, nama, dan satuan dasar (base unit) wajib diisi' });
    }

    const insertTx = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO medicines (code, name, category, base_unit, total_stock, min_stock_alert, rack_location, contraindications, bpom_nie, barcode)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      `).run(code, name, category || 'padat', base_unit, min_stock_alert || 10, rack_location || 'Rak Umum', contraindications || null, bpom_nie || null, barcode || null);

      const medId = info.lastInsertRowid;

      // Always insert base unit
      db.prepare(`
        INSERT INTO medicine_units (medicine_id, unit_name, conversion_ratio, is_base_unit)
        VALUES (?, ?, 1, 1)
      `).run(medId, base_unit);

      // Insert extra units
      if (units && Array.isArray(units)) {
        const insertUnit = db.prepare(`
          INSERT INTO medicine_units (medicine_id, unit_name, conversion_ratio, is_base_unit)
          VALUES (?, ?, ?, 0)
        `);
        for (const u of units) {
          if (u.unit_name && u.unit_name.toLowerCase() !== base_unit.toLowerCase() && u.conversion_ratio > 1) {
            insertUnit.run(medId, u.unit_name, u.conversion_ratio);
          }
        }
      }

      return medId;
    });

    const newMedId = insertTx();
    res.status(201).json({ success: true, message: 'Master obat berhasil ditambahkan', medicineId: newMedId });
  } catch (error) {
    console.error('createMedicine error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

function getKpiStats(req, res) {
  try {
    const allMeds = db.prepare('SELECT id, total_stock, min_stock_alert FROM medicines').all();
    const totalMedicines = allMeds.length;

    let safeStock = 0;
    let lowStock = 0;
    let criticalStock = 0;

    for (const m of allMeds) {
      if (m.total_stock === 0 || m.total_stock <= m.min_stock_alert) {
        criticalStock++;
      } else if (m.total_stock <= m.min_stock_alert * 2) {
        lowStock++;
      } else {
        safeStock++;
      }
    }

    // Critical near-expiry batches (< 60 days)
    const criticalBatches = db.prepare(`
      SELECT COUNT(*) as count 
      FROM medicine_batches 
      WHERE stock_qty > 0 AND date(expired_date) <= date('now', '+60 days')
    `).get().count;

    res.json({
      success: true,
      data: {
        totalMedicines,
        safeStock,
        lowStock,
        criticalStock,
        criticalBatches
      }
    });
  } catch (error) {
    console.error('getKpiStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  getKpiStats
};

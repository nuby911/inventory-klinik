const db = require('../config/database');

function buildDateFilter(dateColumn, period, targetDate, startDate, endDate) {
  if (startDate && endDate) {
    return {
      clause: `WHERE DATE(${dateColumn}) BETWEEN DATE(?) AND DATE(?)`,
      params: [startDate, endDate]
    };
  }
  if (period === 'daily') {
    return {
      clause: `WHERE DATE(${dateColumn}) = DATE(?)`,
      params: [targetDate]
    };
  }
  if (period === 'weekly') {
    return {
      clause: `WHERE DATE(${dateColumn}) BETWEEN DATE(?, '-6 days') AND DATE(?)`,
      params: [targetDate, targetDate]
    };
  }
  if (period === 'monthly') {
    return {
      clause: `WHERE strftime('%Y-%m', ${dateColumn}) = strftime('%Y-%m', ?)`,
      params: [targetDate]
    };
  }
  if (period === 'all') {
    return {
      clause: ``,
      params: []
    };
  }
  return {
    clause: `WHERE DATE(${dateColumn}) = DATE(?)`,
    params: [targetDate]
  };
}

function getRecapReport(req, res) {
  try {
    const { period = 'daily', date, startDate, endDate } = req.query;

    // Resolve date boundary (defaults to targetDate or current date)
    const targetDate = date || new Date().toISOString().split('T')[0];

    const rxFilter = buildDateFilter('p.created_at', period, targetDate, startDate, endDate);
    const whereClause = rxFilter.clause;
    const params = rxFilter.params;

    // 1. Prescription summary
    const rxSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_prescriptions,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN p.status = 'preparing' THEN 1 ELSE 0 END) as preparing_count,
        SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN p.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM prescriptions p
      ${whereClause}
    `).get(...params);

    // 2. Prescription details with patient and doctor info
    const prescriptions = db.prepare(`
      SELECT 
        p.id,
        p.prescription_code,
        p.status,
        p.notes,
        p.created_at,
        pat.name as patient_name,
        pat.medical_record_number,
        u.name as doctor_name,
        (SELECT COUNT(*) FROM prescription_items pi WHERE pi.prescription_id = p.id) as item_count,
        (SELECT GROUP_CONCAT(m.name || ' (' || pi.quantity_input || ' ' || pi.unit_selected || ')', ', ')
         FROM prescription_items pi 
         JOIN medicines m ON pi.medicine_id = m.id
         WHERE pi.prescription_id = p.id) as medicines_summary
      FROM prescriptions p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN users u ON p.doctor_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `).all(...params);

    // 3. Top dispensed / prescribed medicines in the period
    const itemFilter = buildDateFilter('p.created_at', period, targetDate, startDate, endDate);
    const topMedicines = db.prepare(`
      SELECT 
        m.id,
        m.code as medicine_code,
        m.name as medicine_name,
        m.category,
        m.base_unit,
        COUNT(pi.id) as prescription_frequency,
        COALESCE(SUM(pi.quantity_base_unit), 0) as total_quantity_base
      FROM prescription_items pi
      JOIN prescriptions p ON pi.prescription_id = p.id
      JOIN medicines m ON pi.medicine_id = m.id
      ${itemFilter.clause}
      GROUP BY m.id
      ORDER BY total_quantity_base DESC
      LIMIT 10
    `).all(...itemFilter.params);

    // 4. Daily trends inside the selected range
    const dailyTrends = db.prepare(`
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM prescriptions p
      ${whereClause}
      GROUP BY DATE(p.created_at)
      ORDER BY date ASC
    `).all(...params);

    // 5. Stock adjustments summary in the same period
    const adjFilter = buildDateFilter('created_at', period, targetDate, startDate, endDate);
    const adjustmentSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_adjustments,
        COALESCE(SUM(quantity_base_unit), 0) as total_adjusted_units,
        SUM(CASE WHEN adjustment_type = 'retur_supplier' THEN 1 ELSE 0 END) as retur_count,
        SUM(CASE WHEN adjustment_type = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
        SUM(CASE WHEN adjustment_type = 'expired_disposal' THEN 1 ELSE 0 END) as expired_count
      FROM stock_adjustments
      ${adjFilter.clause}
    `).get(...adjFilter.params);

    const totalRx = rxSummary?.total_prescriptions || 0;
    const completedRx = rxSummary?.completed_count || 0;
    const completionRate = totalRx > 0 ? Math.round((completedRx / totalRx) * 100) : 0;

    res.json({
      success: true,
      data: {
        period,
        targetDate,
        dateRange: {
          startDate: startDate || (period === 'weekly' ? `${targetDate} (7 hari)` : targetDate),
          endDate: endDate || targetDate
        },
        metrics: {
          totalPrescriptions: totalRx,
          completedPrescriptions: completedRx,
          preparingPrescriptions: rxSummary?.preparing_count || 0,
          pendingPrescriptions: rxSummary?.pending_count || 0,
          cancelledPrescriptions: rxSummary?.cancelled_count || 0,
          completionRate,
          totalAdjustments: adjustmentSummary?.total_adjustments || 0,
          totalAdjustedUnits: adjustmentSummary?.total_adjusted_units || 0,
          returCount: adjustmentSummary?.retur_count || 0,
          damagedCount: adjustmentSummary?.damaged_count || 0,
          expiredCount: adjustmentSummary?.expired_count || 0
        },
        topMedicines,
        dailyTrends,
        prescriptions
      }
    });
  } catch (error) {
    console.error('getRecapReport error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getRecapReport
};

const db = require('../config/database');

/**
 * Convert quantity from selected unit to base unit
 */
function convertToBaseUnit(medicineId, unitName, quantityInput) {
  const unit = db.prepare(`
    SELECT conversion_ratio, is_base_unit 
    FROM medicine_units 
    WHERE medicine_id = ? AND LOWER(unit_name) = LOWER(?)
  `).get(medicineId, unitName);

  if (!unit) {
    // If unit not found, check if it's the base unit name directly
    const med = db.prepare('SELECT base_unit FROM medicines WHERE id = ?').get(medicineId);
    if (med && med.base_unit.toLowerCase() === unitName.toLowerCase()) {
      return Number(quantityInput);
    }
    throw new Error(`Satuan '${unitName}' tidak terdaftar untuk obat ID ${medicineId}`);
  }

  return Number(quantityInput) * unit.conversion_ratio;
}

/**
 * Format total base units into multi-level human readable breakdown from pre-fetched units
 */
function formatMultiUnitBreakdownFromUnits(units, baseUnit, totalStockBaseUnit) {
  if (!units || units.length === 0) {
    return `${totalStockBaseUnit} ${baseUnit || 'Unit'}`;
  }

  if (totalStockBaseUnit === 0) {
    const smallestUnit = units.find(u => u.is_base_unit) || units[units.length - 1];
    return `0 ${smallestUnit.unit_name}`;
  }

  let remaining = totalStockBaseUnit;
  const parts = [];

  for (const u of units) {
    if (u.conversion_ratio > 1) {
      const count = Math.floor(remaining / u.conversion_ratio);
      if (count > 0) {
        parts.push(`${count} ${u.unit_name}`);
      }
      remaining = remaining % u.conversion_ratio;
    } else {
      if (remaining > 0 || parts.length === 0) {
        parts.push(`${remaining} ${u.unit_name}`);
      }
    }
  }

  return parts.length > 0 ? parts.join(', ') : `0 ${units[units.length - 1].unit_name}`;
}

/**
 * Format total base units into multi-level human readable breakdown (e.g. "14 Box, 3 Strip, 6 Butir")
 */
function formatMultiUnitBreakdown(medicineId, totalStockBaseUnit, prefetchedUnits = null) {
  const units = prefetchedUnits || db.prepare(`
    SELECT unit_name, conversion_ratio, is_base_unit 
    FROM medicine_units 
    WHERE medicine_id = ? 
    ORDER BY conversion_ratio DESC
  `).all(medicineId);

  const med = units.length === 0 ? db.prepare('SELECT base_unit FROM medicines WHERE id = ?').get(medicineId) : null;
  return formatMultiUnitBreakdownFromUnits(units, med ? med.base_unit : null, totalStockBaseUnit);
}

/**
 * Preview FEFO batch allocation without committing changes
 */
function previewFEFOAllocation(medicineId, requiredBaseQty, simulatedBatchStock = null) {
  const batches = db.prepare(`
    SELECT id, batch_number, expired_date, stock_qty, rack_location, distributor
    FROM medicine_batches
    WHERE medicine_id = ? AND stock_qty > 0 AND date(expired_date) >= date('now')
    ORDER BY id ASC
  `).all(medicineId);

  let remainingNeeded = requiredBaseQty;
  const allocation = [];

  for (const batch of batches) {
    if (remainingNeeded <= 0) break;
    const available = simulatedBatchStock && simulatedBatchStock.has(batch.id) 
      ? simulatedBatchStock.get(batch.id) 
      : batch.stock_qty;

    if (available <= 0) continue;

    const taken = Math.min(available, remainingNeeded);
    allocation.push({
      batchId: batch.id,
      batchNumber: batch.batch_number,
      expiredDate: batch.expired_date,
      rackLocation: batch.rack_location || 'Rak Utama',
      distributor: batch.distributor,
      availableQty: available,
      takeQty: taken,
      remainingBatchQty: available - taken
    });

    if (simulatedBatchStock) {
      simulatedBatchStock.set(batch.id, available - taken);
    }

    remainingNeeded -= taken;
  }

  const isFulfilled = remainingNeeded <= 0;
  return {
    isFulfilled,
    requiredBaseQty,
    deficit: isFulfilled ? 0 : remainingNeeded,
    allocation
  };
}

/**
 * Execute FEFO deduction for a prescription with full BPOM Batch Traceability & ACID atomicity
 */
function dispensePrescriptionFEFO(prescriptionId, pharmacistUserId = null) {
  const executeTransaction = db.transaction(() => {
    const prescription = db.prepare(`
      SELECT p.*, pt.name as patient_name, pt.medical_record_number
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      WHERE p.id = ?
    `).get(prescriptionId);

    if (!prescription) {
      throw new Error('Resep tidak ditemukan');
    }

    if (prescription.status === 'completed') {
      throw new Error('Resep ini sudah selesai diproses sebelumnya.');
    }

    if (prescription.status === 'cancelled') {
      throw new Error('Resep ini telah dibatalkan dan tidak dapat diserahkan.');
    }

    if (prescription.status !== 'pending' && prescription.status !== 'preparing') {
      throw new Error(`Resep dengan status '${prescription.status}' tidak dapat diserahkan.`);
    }

    const items = db.prepare(`
      SELECT pi.*, m.name as medicine_name, m.base_unit, m.total_stock
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(prescriptionId);

    if (items.length === 0) {
      throw new Error('Resep tidak memiliki item obat untuk diserahkan.');
    }

    // First pass: Calculate cumulative requirements across duplicate medicines
    const totalNeededByMed = new Map();
    for (const item of items) {
      const current = totalNeededByMed.get(item.medicine_id) || { name: item.medicine_name, base_unit: item.base_unit, qty: 0 };
      current.qty += item.quantity_base_unit;
      totalNeededByMed.set(item.medicine_id, current);
    }

    for (const [medId, need] of totalNeededByMed.entries()) {
      const preview = previewFEFOAllocation(medId, need.qty);
      if (!preview.isFulfilled) {
        throw new Error(`Stok obat ${need.name} tidak mencukupi untuk memenuhi resep (Kurang ${preview.deficit} ${need.base_unit}).`);
      }
    }

    // Precompiled Statements for High Performance & Race Condition Safety
    const updateBatchStmt = db.prepare(`
      UPDATE medicine_batches 
      SET stock_qty = stock_qty - ? 
      WHERE id = ? AND stock_qty >= ?
    `);

    const updateMedStmt = db.prepare(`
      UPDATE medicines 
      SET total_stock = total_stock - ? 
      WHERE id = ? AND total_stock >= ?
    `);

    const insertItemBatchStmt = db.prepare(`
      INSERT INTO prescription_item_batches 
      (prescription_item_id, batch_id, batch_number, expired_date, dispensed_qty, pharmacist_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateRxStatusStmt = db.prepare(`
      UPDATE prescriptions 
      SET status = 'completed'
      WHERE id = ? AND status != 'completed' AND status != 'cancelled'
    `);

    const dispensedDetails = [];
    const simulatedBatchStock = new Map();

    for (const item of items) {
      const preview = previewFEFOAllocation(item.medicine_id, item.quantity_base_unit, simulatedBatchStock);

      if (!preview.isFulfilled) {
        throw new Error(`Stok batch untuk ${item.medicine_name} tidak mencukupi saat proses peracikan.`);
      }

      for (const alloc of preview.allocation) {
        // Defensive deduction from batch (prevents negative stock)
        const batchRes = updateBatchStmt.run(alloc.takeQty, alloc.batchId, alloc.takeQty);
        if (batchRes.changes === 0) {
          throw new Error(`Gagal memotong stok batch ${alloc.batchNumber}: stok telah berubah secara bersamaan.`);
        }

        // Defensive deduction from total stock
        const medRes = updateMedStmt.run(alloc.takeQty, item.medicine_id, alloc.takeQty);
        if (medRes.changes === 0) {
          throw new Error(`Gagal memotong stok master obat ${item.medicine_name}: stok master tidak mencukupi.`);
        }

        // Record permanent BPOM Batch Traceability
        insertItemBatchStmt.run(
          item.id,
          alloc.batchId,
          alloc.batchNumber,
          alloc.expiredDate,
          alloc.takeQty,
          pharmacistUserId || null
        );
      }

      dispensedDetails.push({
        itemId: item.id,
        medicineId: item.medicine_id,
        medicineName: item.medicine_name,
        unitSelected: item.unit_selected,
        quantityInput: item.quantity_input,
        quantityBaseUnit: item.quantity_base_unit,
        dosageInstruction: item.dosage_instruction,
        batchesUsed: preview.allocation
      });
    }

    // Update prescription status to completed (defensive atomicity against double-dispensing)
    const statusUpdateRes = updateRxStatusStmt.run(prescriptionId);
    if (statusUpdateRes.changes === 0) {
      throw new Error('Resep ini sudah selesai diproses oleh apoteker lain atau telah dibatalkan.');
    }

    return {
      prescriptionId,
      prescriptionCode: prescription.prescription_code,
      patientName: prescription.patient_name,
      medicalRecordNumber: prescription.medical_record_number,
      dispensedItems: dispensedDetails
    };
  });

  return executeTransaction();
}

module.exports = {
  convertToBaseUnit,
  formatMultiUnitBreakdown,
  formatMultiUnitBreakdownFromUnits,
  previewFEFOAllocation,
  dispensePrescriptionFEFO
};

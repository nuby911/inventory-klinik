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
 * Format total base units into multi-level human readable breakdown (e.g. "14 Box, 3 Strip, 6 Butir")
 */
function formatMultiUnitBreakdown(medicineId, totalStockBaseUnit) {
  const units = db.prepare(`
    SELECT unit_name, conversion_ratio 
    FROM medicine_units 
    WHERE medicine_id = ? 
    ORDER BY conversion_ratio DESC
  `).all(medicineId);

  if (!units || units.length === 0) {
    const med = db.prepare('SELECT base_unit FROM medicines WHERE id = ?').get(medicineId);
    return `${totalStockBaseUnit} ${med ? med.base_unit : 'Unit'}`;
  }

  let remaining = totalStockBaseUnit;
  const parts = [];

  for (const u of units) {
    if (u.conversion_ratio > 1) {
      const count = Math.floor(remaining / u.conversion_ratio);
      if (count > 0 || parts.length > 0) {
        parts.push(`${count} ${u.unit_name}`);
      }
      remaining = remaining % u.conversion_ratio;
    } else {
      parts.push(`${remaining} ${u.unit_name}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : `0 ${units[units.length - 1].unit_name}`;
}

/**
 * Preview FEFO batch allocation without committing changes
 */
function previewFEFOAllocation(medicineId, requiredBaseQty) {
  const batches = db.prepare(`
    SELECT id, batch_number, expired_date, stock_qty, rack_location, distributor
    FROM medicine_batches
    WHERE medicine_id = ? AND stock_qty > 0
    ORDER BY expired_date ASC, id ASC
  `).all(medicineId);

  let remainingNeeded = requiredBaseQty;
  const allocation = [];

  for (const batch of batches) {
    if (remainingNeeded <= 0) break;
    const taken = Math.min(batch.stock_qty, remainingNeeded);
    allocation.push({
      batchId: batch.id,
      batchNumber: batch.batch_number,
      expiredDate: batch.expired_date,
      rackLocation: batch.rack_location || 'Rak Utama',
      distributor: batch.distributor,
      availableQty: batch.stock_qty,
      takeQty: taken,
      remainingBatchQty: batch.stock_qty - taken
    });
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
 * Execute FEFO deduction for a prescription
 */
function dispensePrescriptionFEFO(prescriptionId, pharmacistUserId) {
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

  const items = db.prepare(`
    SELECT pi.*, m.name as medicine_name, m.base_unit, m.total_stock
    FROM prescription_items pi
    JOIN medicines m ON pi.medicine_id = m.id
    WHERE pi.prescription_id = ?
  `).all(prescriptionId);

  // First pass: Verify all items have sufficient FEFO stock
  for (const item of items) {
    const preview = previewFEFOAllocation(item.medicine_id, item.quantity_base_unit);
    if (!preview.isFulfilled) {
      throw new Error(`Stok obat ${item.medicine_name} tidak mencukupi untuk memenuhi resep (Kurang ${preview.deficit} ${item.base_unit}).`);
    }
  }

  // Second pass: Perform deductions in a single transaction
  const executeTransaction = db.transaction(() => {
    const dispensedDetails = [];

    for (const item of items) {
      const preview = previewFEFOAllocation(item.medicine_id, item.quantity_base_unit);
      
      for (const alloc of preview.allocation) {
        // Deduct from batch
        db.prepare(`
          UPDATE medicine_batches 
          SET stock_qty = stock_qty - ? 
          WHERE id = ?
        `).run(alloc.takeQty, alloc.batchId);

        // Deduct from total stock
        db.prepare(`
          UPDATE medicines 
          SET total_stock = total_stock - ? 
          WHERE id = ?
        `).run(alloc.takeQty, item.medicine_id);
      }

      dispensedDetails.push({
        medicineId: item.medicine_id,
        medicineName: item.medicine_name,
        unitSelected: item.unit_selected,
        quantityInput: item.quantity_input,
        quantityBaseUnit: item.quantity_base_unit,
        dosageInstruction: item.dosage_instruction,
        batchesUsed: preview.allocation
      });
    }

    // Update prescription status
    db.prepare(`
      UPDATE prescriptions 
      SET status = 'completed'
      WHERE id = ?
    `).run(prescriptionId);

    return dispensedDetails;
  });

  const result = executeTransaction();
  return {
    prescriptionId,
    prescriptionCode: prescription.prescription_code,
    patientName: prescription.patient_name,
    medicalRecordNumber: prescription.medical_record_number,
    dispensedItems: result
  };
}

module.exports = {
  convertToBaseUnit,
  formatMultiUnitBreakdown,
  previewFEFOAllocation,
  dispensePrescriptionFEFO
};

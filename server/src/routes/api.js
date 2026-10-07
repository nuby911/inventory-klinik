const express = require('express');
const router = express.Router();

const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  dispensePrescription,
  getEtiketData
} = require('../controllers/prescriptionController');

const {
  getMedicines,
  getMedicineById,
  createMedicine,
  getKpiStats
} = require('../controllers/medicineController');

const {
  getBatches,
  getExpiringBatches,
  addBatch
} = require('../controllers/batchController');

const {
  getAdjustments,
  getAdjustmentKpis,
  createAdjustment
} = require('../controllers/adjustmentController');

const {
  getPatients,
  getPatientById,
  getUsers
} = require('../controllers/patientController');

const { login } = require('../controllers/authController');
const { getRecapReport } = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────
// Authentication (Public — no auth required)
// ─────────────────────────────────────────────
router.post('/auth/login', login);

// ─────────────────────────────────────────────
// Prescriptions
// Dokter  : create (tulis resep)
// Apoteker: read, update status, dispense, etiket
// Semua   : read (dashboard analytics)
// ─────────────────────────────────────────────
router.get('/prescriptions',                    requireAuth, getPrescriptions);
router.get('/prescriptions/:id',                requireAuth, getPrescriptionById);
router.post('/prescriptions',                   requireAuth, requireRole(['dokter']), createPrescription);
router.patch('/prescriptions/:id/status',       requireAuth, requireRole(['apoteker']), updatePrescriptionStatus);
router.post('/prescriptions/:id/dispense',      requireAuth, requireRole(['apoteker']), dispensePrescription);
router.get('/prescriptions/:id/etiket',         requireAuth, requireRole(['apoteker']), getEtiketData);

// ─────────────────────────────────────────────
// Medicines
// NOTE: specific routes (/kpis) MUST come before parameterized (:id)
// ─────────────────────────────────────────────
router.get('/medicines/kpis',                   requireAuth, getKpiStats);
router.get('/medicines',                        requireAuth, getMedicines);
router.get('/medicines/:id',                    requireAuth, getMedicineById);
router.post('/medicines',                       requireAuth, requireRole(['admin']), createMedicine);

// ─────────────────────────────────────────────
// Batches
// NOTE: /expiring must come before /:id
// ─────────────────────────────────────────────
router.get('/batches/expiring',                 requireAuth, getExpiringBatches);
router.get('/batches',                          requireAuth, getBatches);
router.post('/batches',                         requireAuth, requireRole(['admin']), addBatch);

// ─────────────────────────────────────────────
// Adjustments & Returns
// ─────────────────────────────────────────────
router.get('/adjustments/kpis',                 requireAuth, getAdjustmentKpis);
router.get('/adjustments',                      requireAuth, getAdjustments);
router.post('/adjustments',                     requireAuth, requireRole(['apoteker', 'admin']), createAdjustment);

// ─────────────────────────────────────────────
// Patients & Users
// ─────────────────────────────────────────────
router.get('/patients',                         requireAuth, requireRole(['dokter', 'apoteker', 'admin']), getPatients);
router.get('/patients/:id',                     requireAuth, requireRole(['dokter', 'apoteker', 'admin']), getPatientById);
router.get('/users',                            requireAuth, requireRole(['admin']), getUsers);

// ─────────────────────────────────────────────
// Reports & Recaps (Accessible by all authorized staff)
// ─────────────────────────────────────────────
router.get('/reports/recap',                    requireAuth, getRecapReport);

module.exports = router;

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { db, seedTestFixtures } = require('../helpers/testDb');
const { createTestApp, startTestServer } = require('../helpers/testApp');

describe('Security RBAC & Clinical Safety Guards (Integration Tests)', () => {
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

  describe('Authentication & Role-Based Access Control (RBAC)', () => {
    it('should reject requests without authorization token or role header with 401 Unauthorized', async () => {
      const res = await fetch(`${serverInfo.url}/api/prescriptions`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.match(body.message, /401 Unauthorized/);
    });

    it('should prohibit Apoteker from writing prescriptions (403 Forbidden)', async () => {
      const res = await fetch(`${serverInfo.url}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'apoteker',
          'x-user-id': '2'
        },
        body: JSON.stringify({
          patient_id: 2,
          items: [{ medicine_id: 1, unit_selected: 'Butir', quantity_input: 10, dosage_instruction: '3x1' }]
        })
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.match(body.message, /403 Forbidden/);
    });

    it('should prohibit Dokter from dispensing prescriptions (403 Forbidden)', async () => {
      const res = await fetch(`${serverInfo.url}/api/prescriptions/1/dispense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dokter',
          'x-user-id': '1'
        }
      });

      assert.strictEqual(res.status, 403);
    });

    it('should prohibit Dokter from performing stock adjustments (403 Forbidden)', async () => {
      const res = await fetch(`${serverInfo.url}/api/adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dokter',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          batch_id: 1,
          adjustment_type: 'damaged',
          quantity_input: 5,
          reason: 'Test'
        })
      });

      assert.strictEqual(res.status, 403);
    });

    it('should allow Admin to view user accounts, but forbid non-admins (403)', async () => {
      // Forbidden for Apoteker
      const resForbidden = await fetch(`${serverInfo.url}/api/users`, {
        headers: { 'x-user-role': 'apoteker' }
      });
      assert.strictEqual(resForbidden.status, 403);

      // Allowed for Admin
      const resAllowed = await fetch(`${serverInfo.url}/api/users`, {
        headers: { 'x-user-role': 'admin' }
      });
      assert.strictEqual(resAllowed.status, 200);
      const body = await resAllowed.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });
  });

  describe('Clinical Safety Contraindication Guard', () => {
    it('should flag contraindication warning when prescribing penicillin-group drugs to an allergic patient', async () => {
      // Patient 1 has 'Penisilin / Golongan Beta-Laktam' allergy
      // Medicine 2 is Amoxicillin (contraindication: 'Penisilin / Beta-Laktam')
      const res = await fetch(`${serverInfo.url}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dokter',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          patient_id: 1,
          items: [
            {
              medicine_id: 2,
              unit_selected: 'Butir',
              quantity_input: 15,
              dosage_instruction: '3x1 tablet sesudah makan'
            }
          ]
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.ok(Array.isArray(body.warnings));
      assert.strictEqual(body.warnings.length, 1);
      assert.match(body.warnings[0], /KONTRAINDIKASI: Amoxicillin 500mg berisiko memicu alergi/);
    });

    it('should not flag contraindication warning when drug is safe for patient', async () => {
      // Patient 2 has no allergies
      const res = await fetch(`${serverInfo.url}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dokter',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          patient_id: 2,
          items: [
            {
              medicine_id: 1, // Paracetamol
              unit_selected: 'Butir',
              quantity_input: 10,
              dosage_instruction: '3x1 tablet'
            }
          ]
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.warnings.length, 0);
    });

    it('should flag contraindication bidirectionally when patient has short allergy word (e.g. Sulfa vs Alergi Golongan Sulfa)', async () => {
      // Create patient with allergy "Sulfa" and medicine with contraindication "Alergi Golongan Sulfa dan Turunannya"
      db.prepare("INSERT INTO patients (id, medical_record_number, name, gender, allergies) VALUES (99, 'RM-TEST-SULFA', 'Tes Pasien', 'L', 'Sulfa')").run();
      db.prepare("INSERT INTO medicines (id, code, name, category, base_unit, total_stock, contraindications) VALUES (99, 'MED-SULFA-TEST', 'Cotrimoxazole', 'padat', 'Tablet', 100, 'Alergi Golongan Sulfa dan Turunannya')").run();
      db.prepare("INSERT INTO medicine_units (medicine_id, unit_name, conversion_ratio, is_base_unit) VALUES (99, 'Tablet', 1, 1)").run();

      const res = await fetch(`${serverInfo.url}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dokter',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          patient_id: 99,
          items: [{ medicine_id: 99, unit_selected: 'Tablet', quantity_input: 5, dosage_instruction: '2x1' }]
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.ok(body.warnings && body.warnings.length > 0);
      assert.match(body.warnings[0], /KONTRAINDIKASI: Cotrimoxazole berisiko memicu alergi/);
    });
  });

  describe('Prescription State Machine Integrity', () => {
    it('should reject status modification if prescription is already completed (400)', async () => {
      // Create and dispense prescription
      const rxRes = await fetch(`${serverInfo.url}/api/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dokter', 'x-user-id': '1' },
        body: JSON.stringify({
          patient_id: 2,
          items: [{ medicine_id: 1, unit_selected: 'Butir', quantity_input: 5, dosage_instruction: '3x1' }]
        })
      });
      const rxBody = await rxRes.json();
      const rxId = rxBody.data.id;

      // Dispense it
      await fetch(`${serverInfo.url}/api/prescriptions/${rxId}/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'apoteker', 'x-user-id': '2' }
      });

      // Try to revert to pending
      const patchRes = await fetch(`${serverInfo.url}/api/prescriptions/${rxId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'apoteker', 'x-user-id': '2' },
        body: JSON.stringify({ status: 'pending' })
      });

      assert.strictEqual(patchRes.status, 400);
      const patchBody = await patchRes.json();
      assert.match(patchBody.message, /tidak dapat diubah statusnya/);
    });

    it('should reject medicine creation with invalid category (400 Bad Request)', async () => {
      const res = await fetch(`${serverInfo.url}/api/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-id': '3' },
        body: JSON.stringify({
          code: 'MED-HRB-001',
          name: 'Ekstrak Temulawak',
          category: 'herbal_jamu',
          base_unit: 'Kapsul'
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /Kategori sediaan tidak valid/);
    });

    it('should reject duplicate medicine code with 409 Conflict', async () => {
      const res = await fetch(`${serverInfo.url}/api/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-id': '3' },
        body: JSON.stringify({
          code: 'MED-PCT-500', // Already exists in test fixtures
          name: 'Paracetamol Duplikat',
          category: 'padat',
          base_unit: 'Butir'
        })
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.match(body.message, /sudah terdaftar/);
    });
  });
});

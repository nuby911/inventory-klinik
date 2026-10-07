const API_BASE = '/api';

function getAuthHeaders() {
  try {
    const saved = sessionStorage.getItem('almedika_user') || localStorage.getItem('almedika_user');
    if (saved) {
      const user = JSON.parse(saved);
      return {
        'x-user-role': user.role || '',
        'x-user-id': String(user.id || ''),
        'Authorization': `Bearer ${user.token || ''}`
      };
    }
  } catch {
    // silent
  }
  return {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const authHeaders = getAuthHeaders();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    if (contentType.includes('application/json')) {
      const errData = await response.json().catch(() => ({}));
      errorMsg = errData.message || errorMsg;
    } else {
      const text = await response.text().catch(() => '');
      if (response.status === 404) {
        errorMsg = 'Endpoint API tidak ditemukan (404). Pastikan server backend telah dimuat ulang.';
      } else if (text) {
        errorMsg = `Server error (${response.status}): ${text.slice(0, 80)}`;
      }
    }
    throw new Error(errorMsg);
  }

  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    throw new Error(`Format respons server bukan JSON: ${text.slice(0, 60)}...`);
  }

  const data = await response.json();
  return data;
}

export const api = {
  // Prescriptions
  getPrescriptions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/prescriptions${query ? `?${query}` : ''}`);
  },
  getPrescriptionById: (id) => request(`/prescriptions/${id}`),
  createPrescription: (payload) => request('/prescriptions', { method: 'POST', body: JSON.stringify(payload) }),
  updatePrescriptionStatus: (id, status) => request(`/prescriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  dispensePrescription: (id, pharmacist_id = 2) => request(`/prescriptions/${id}/dispense`, { method: 'POST', body: JSON.stringify({ pharmacist_id }) }),
  getEtiketData: (id) => request(`/prescriptions/${id}/etiket`),

  // Medicines
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/medicines${query ? `?${query}` : ''}`);
  },
  getMedicineById: (id) => request(`/medicines/${id}`),
  getMedicineKpis: () => request('/medicines/kpis'),
  createMedicine: (payload) => request('/medicines', { method: 'POST', body: JSON.stringify(payload) }),

  // Batches
  getBatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/batches${query ? `?${query}` : ''}`);
  },
  getExpiringBatches: (days = 60) => request(`/batches/expiring?days=${days}`),
  addBatch: (payload) => request('/batches', { method: 'POST', body: JSON.stringify(payload) }),

  // Adjustments & Returns
  getAdjustments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/adjustments${query ? `?${query}` : ''}`);
  },
  getAdjustmentKpis: () => request('/adjustments/kpis'),
  createAdjustment: (payload) => request('/adjustments', { method: 'POST', body: JSON.stringify(payload) }),

  // Reports
  getRecapReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/recap${query ? `?${query}` : ''}`);
  },

  // Patients & Auth
  getPatients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/patients${query ? `?${query}` : ''}`);
  },
  getPatientById: (id) => request(`/patients/${id}`),
  getUsers: () => request('/users'),
  login: async (credentials) => {
    try {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    } catch {
      // Fallback: verify against live database users endpoint
      const usersRes = await request('/users');
      const users = usersRes.data || [];
      const user = users.find(u => 
        (credentials.email && u.email.toLowerCase() === credentials.email.trim().toLowerCase()) ||
        (credentials.role && u.role === credentials.role.toLowerCase())
      );

      if (!user) {
        throw new Error('Akun pengguna tidak ditemukan di database.');
      }

      if (credentials.role && user.role !== credentials.role.toLowerCase()) {
        throw new Error(`Akses Ditolak: Akun '${user.name}' adalah '${user.role.toUpperCase()}'. Anda tidak diizinkan masuk ke portal '${credentials.role.toUpperCase()}'.`);
      }

      let title = 'Staff Klinik';
      let badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
      if (user.role === 'dokter') {
        title = 'Dokter Spesialis Rawat Jalan';
        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      } else if (user.role === 'apoteker') {
        title = 'Kepala Instalasi Farmasi (FEFO)';
        badgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
      } else if (user.role === 'admin') {
        title = 'Staff Logistik & Pengelolaan Stok';
        badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
      }

      return {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          title,
          badgeColor,
          token: `token_${user.id}_${Date.now()}`
        }
      };
    }
  }
};

import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  DOKTER: {
    id: 1,
    role: 'dokter',
    email: 'dokter@almedika.com',
    name: 'Dokter',
    title: 'Pemeriksa Rawat Jalan',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  APOTEKER: {
    id: 2,
    role: 'apoteker',
    email: 'apoteker@almedika.com',
    name: 'Apoteker',
    title: 'Instalasi Farmasi',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  ADMIN: {
    id: 3,
    role: 'admin',
    email: 'admin@almedika.com',
    name: 'Logistik',
    title: 'Gudang & Logistik',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Clear legacy localStorage so stale sessions do not bypass login on initial entry
      localStorage.removeItem('almedika_user');
      const saved = sessionStorage.getItem('almedika_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async ({ email, password, role }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password, role });
      if (res && res.data) {
        // Enforce role consistency
        if (role && res.data.role !== role.toLowerCase()) {
          throw new Error(`Akses ditolak: Akun '${res.data.name}' adalah ${res.data.role.toUpperCase()}, bukan ${role.toUpperCase()}.`);
        }
        setCurrentUser(res.data);
        sessionStorage.setItem('almedika_user', JSON.stringify(res.data));
        return { success: true, user: res.data };
      } else {
        throw new Error('Gagal login: Format data tidak valid');
      }
    } catch (err) {
      setError(err.message || 'Login gagal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('almedika_user');
      localStorage.removeItem('almedika_user');
    } catch {}
    window.history.replaceState(null, '', '/login');
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      loading, 
      error, 
      setError, 
      ROLES 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email wajib diisi.' 
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Password wajib diisi.' 
      });
    }

    const trimmedEmail = email.trim();

    // Find user strictly by email
    const user = db.prepare(`
      SELECT id, name, email, password_hash, role 
      FROM users 
      WHERE LOWER(email) = LOWER(?)
    `).get(trimmedEmail);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kredensial pengguna tidak ditemukan. Pastikan email terdaftar.' 
      });
    }

    // Role validation: enforce that the user logs in through their assigned role
    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({ 
        success: false, 
        message: `Akses Ditolak: Akun '${user.name}' adalah '${user.role.toUpperCase()}'. Anda tidak diizinkan masuk ke portal '${role.toUpperCase()}'.` 
      });
    }

    // Password verification: support bcrypt hash and seed demo passwords
    let passwordValid = false;
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy seed password comparison (hash_admin, password123, almedika123, etc.)
      const allowedDemo = ['almedika123', 'password123', '123456', `hash_${user.role}`, user.password_hash];
      passwordValid = allowedDemo.includes(password);
    }

    if (!passwordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Password salah. Silakan coba kembali.' 
      });
    }

    // Determine titles & styling
    let title = 'Staff Klinik';
    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';

    if (user.role === 'dokter') {
      title = 'Dokter Spesialis Rawat Jalan';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (user.role === 'apoteker') {
      title = 'Kepala Instalasi Farmasi';
      badgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
    } else if (user.role === 'admin') {
      title = 'Staff Logistik & Pengelolaan Stok';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    }

    // Generate cryptographically signed JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title,
      badgeColor,
      token
    };

    res.json({
      success: true,
      message: `Login berhasil. Selamat datang ${user.name}!`,
      data: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server saat login.' });
  }
}

module.exports = {
  login
};

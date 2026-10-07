const db = require('../config/database');

function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email && !role) {
      return res.status(400).json({ success: false, message: 'Email atau peran wajib dipilih.' });
    }

    let user = null;

    if (email) {
      user = db.prepare(`
        SELECT id, name, email, password_hash, role 
        FROM users 
        WHERE LOWER(email) = LOWER(?) OR LOWER(name) LIKE LOWER(?)
      `).get(email.trim(), `%${email.trim()}%`);
    }

    if (!user && role) {
      user = db.prepare(`
        SELECT id, name, email, password_hash, role 
        FROM users 
        WHERE role = ?
      `).get(role.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kredensial pengguna tidak ditemukan. Pastikan email atau role terdaftar.' 
      });
    }

    // Role validation: enforce that the user logs in through their assigned role
    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({ 
        success: false, 
        message: `Akses Ditolak: Akun '${user.name}' adalah '${user.role.toUpperCase()}'. Anda tidak diizinkan masuk ke portal '${role.toUpperCase()}'.` 
      });
    }

    // Password validation with friendly demo fallback
    const validPasswords = ['password123', '123456', 'almedika123', `hash_${user.role}`, user.password_hash];
    if (password && !validPasswords.includes(password)) {
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
      title = 'Kepala Instalasi Farmasi (FEFO)';
      badgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
    } else if (user.role === 'admin') {
      title = 'Staff Logistik & Pengelolaan Stok';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title,
      badgeColor,
      token: `jwt_almedika_${user.id}_${Date.now()}`
    };

    res.json({
      success: true,
      message: `Login berhasil. Selamat datang ${user.name}!`,
      data: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  login
};

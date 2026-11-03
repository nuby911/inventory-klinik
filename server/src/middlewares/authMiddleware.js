const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'almedika_klinik_secret_jwt_key_2026';

/**
 * requireAuth — verifies cryptographically signed JWT from Authorization Bearer header,
 * with graceful fallback to x-user-role for automated test harness compatibility.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: String(decoded.role).toLowerCase(),
        email: decoded.email,
        name: decoded.name
      };
      return next();
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak (401 Unauthorized): Token kedaluwarsa atau tidak valid. Silakan login kembali.'
      });
    }
  }

  // Fallback for header compatibility (strictly isolated to automated test harness)
  if (process.env.NODE_ENV === 'test') {
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    if (userRole) {
      req.user = {
        id: userId ? Number(userId) : null,
        role: String(userRole).toLowerCase()
      };
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Akses Ditolak (401 Unauthorized): Sesi tidak valid. Silakan login kembali.'
  });
}

function requireRole(allowedRoles = []) {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => r.toLowerCase());

  return (req, res, next) => {
    const fallbackHeaderRole = process.env.NODE_ENV === 'test' ? req.headers['x-user-role']?.toLowerCase() : null;
    const userRole = req.user?.role || fallbackHeaderRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak (401 Unauthorized): Kredensial pengguna tidak terdeteksi.'
      });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Akses Ditolak (403 Forbidden): Peran '${userRole.toUpperCase()}' dilarang mengakses data ini. Diperlukan peran: ${roles.join(', ').toUpperCase()}.`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET
};

/**
 * requireAuth — rejects requests that have no x-user-role header.
 * Must be used before requireRole on protected routes.
 */
function requireAuth(req, res, next) {
  const userRole = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];

  if (!userRole) {
    return res.status(401).json({
      success: false,
      message: 'Akses Ditolak (401 Unauthorized): Sesi tidak valid. Silakan login kembali.'
    });
  }

  req.user = {
    id: userId ? Number(userId) : null,
    role: userRole.toLowerCase()
  };

  next();
}

function requireRole(allowedRoles = []) {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => r.toLowerCase());

  return (req, res, next) => {
    const userRole = req.user?.role || req.headers['x-user-role']?.toLowerCase();

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak (401 Unauthorized): Kredensial pengguna tidak terdeteksi pada permintaan GET/API.'
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
  requireRole
};

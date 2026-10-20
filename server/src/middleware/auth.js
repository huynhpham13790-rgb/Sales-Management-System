import jwt from 'jsonwebtoken';

const SECRET = () => process.env.JWT_SECRET || 'dev_secret';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET(), { expiresIn: '7d' });
}

// Gắn req.user nếu có token hợp lệ, không bắt buộc
export function optionalAuth(req, _res, next) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(h.slice(7), SECRET()); } catch { /* bỏ qua */ }
  }
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    next();
  });
}

export function requireRole(...roles) {
  return (req, res, next) => requireAuth(req, res, () => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Không có quyền truy cập' });
    next();
  });
}

export const requireStaff = requireRole('admin', 'staff');
export const requireAdmin = requireRole('admin');

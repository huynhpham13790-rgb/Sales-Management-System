import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireStaff, requireAdmin } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';

const r = Router();

// Danh sách người dùng kèm thống kê mua hàng
r.get('/', requireStaff, wrap(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.role) { where = 'WHERE u.role = ?'; params.push(req.query.role); }
  res.json(await query(`SELECT u.id, u.name, u.email, u.phone, u.address, u.role, u.is_active, u.created_at,
      COUNT(o.id) AS order_count, COALESCE(SUM(o.total),0) AS total_spent, MAX(o.created_at) AS last_order
    FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.status <> 'cancelled'
    ${where} GROUP BY u.id ORDER BY total_spent DESC`, params));
}));

// Admin tạo tài khoản nhân viên
r.post('/', requireAdmin, wrap(async (req, res) => {
  const { name, email, password, role = 'staff' } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Thiếu thông tin');
  const exists = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) throw httpError(409, 'Email đã tồn tại');
  const result = await query('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    [name, email, bcrypt.hashSync(password, 10), ['admin', 'staff', 'customer'].includes(role) ? role : 'staff']);
  res.status(201).json({ id: result.insertId });
}));

// Khóa / mở khóa, đổi vai trò
r.patch('/:id', requireAdmin, wrap(async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw httpError(400, 'Không thể tự thay đổi tài khoản của mình');
  const { is_active, role } = req.body;
  if (is_active !== undefined) await query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
  if (role) await query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ ok: true });
}));

export default r;

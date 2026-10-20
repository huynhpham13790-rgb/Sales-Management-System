import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';

const r = Router();
const publicUser = ({ password_hash, ...u }) => u;

r.post('/register', wrap(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Thiếu họ tên, email hoặc mật khẩu');
  if (password.length < 6) throw httpError(400, 'Mật khẩu tối thiểu 6 ký tự');
  const exists = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) throw httpError(409, 'Email đã được sử dụng');
  const result = await query(
    'INSERT INTO users (name, email, password_hash, phone, address) VALUES (?,?,?,?,?)',
    [name, email, bcrypt.hashSync(password, 10), phone || null, address || null]
  );
  const [user] = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) throw httpError(401, 'Sai email hoặc mật khẩu');
  if (!user.is_active) throw httpError(403, 'Tài khoản đã bị khóa');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

r.get('/me', requireAuth, wrap(async (req, res) => {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) throw httpError(404, 'Không tìm thấy tài khoản');
  res.json(publicUser(user));
}));

r.put('/me', requireAuth, wrap(async (req, res) => {
  const { name, phone, address, password } = req.body;
  // Kiểm tra trước khi lưu để không cập nhật dở dang
  if (password && password.length < 6) throw httpError(400, 'Mật khẩu tối thiểu 6 ký tự');
  await query('UPDATE users SET name = COALESCE(?, name), phone = ?, address = ? WHERE id = ?',
    [name || null, phone || null, address || null, req.user.id]);
  if (password) {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(password, 10), req.user.id]);
  }
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json(publicUser(user));
}));

export default r;

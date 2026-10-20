import { Router } from 'express';
import { query } from '../db.js';
import { requireStaff } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';

const r = Router();

// Kiểm tra mã giảm giá và tính số tiền được giảm. Dùng chung cho route và khi tạo đơn.
export async function evaluateCoupon(code, subtotal, conn) {
  const run = conn ? (s, p) => conn.query(s, p).then(([rows]) => rows) : query;
  const [c] = await run('SELECT * FROM coupons WHERE code = ?' + (conn ? ' FOR UPDATE' : ''), [String(code).toUpperCase()]);
  if (!c || !c.is_active) throw httpError(400, 'Mã giảm giá không tồn tại');
  if (c.expires_at && new Date(c.expires_at) < new Date()) throw httpError(400, 'Mã giảm giá đã hết hạn');
  if (c.max_uses > 0 && c.used_count >= c.max_uses) throw httpError(400, 'Mã giảm giá đã hết lượt sử dụng');
  if (subtotal < c.min_order) throw httpError(400, `Đơn tối thiểu ${c.min_order.toLocaleString('vi-VN')}đ để dùng mã này`);
  const discount = c.type === 'percent' ? Math.round((subtotal * c.value) / 100) : Number(c.value);
  return { coupon: c, discount: Math.min(discount, subtotal) };
}

r.post('/validate', wrap(async (req, res) => {
  const { coupon, discount } = await evaluateCoupon(req.body.code || '', Number(req.body.subtotal) || 0);
  res.json({ code: coupon.code, type: coupon.type, value: coupon.value, discount });
}));

r.get('/', requireStaff, wrap(async (_req, res) => {
  // expires_date dạng chuỗi YYYY-MM-DD để client không bị lệch ngày do múi giờ
  res.json(await query(`SELECT *, DATE_FORMAT(expires_at, '%Y-%m-%d') AS expires_date FROM coupons ORDER BY id DESC`));
}));

const fields = (b) => {
  if (!b.code || !['percent', 'fixed'].includes(b.type) || !(Number(b.value) > 0)) throw httpError(400, 'Dữ liệu mã giảm giá không hợp lệ');
  if (b.type === 'percent' && Number(b.value) > 100) throw httpError(400, 'Phần trăm giảm tối đa 100');
  return [b.code.toUpperCase(), b.type, Number(b.value), Number(b.min_order) || 0, Number(b.max_uses) || 0,
    // Mã còn hiệu lực đến hết ngày hết hạn
    b.expires_at ? `${String(b.expires_at).slice(0, 10)} 23:59:59` : null, b.is_active === false || b.is_active === 0 ? 0 : 1];
};

r.post('/', requireStaff, wrap(async (req, res) => {
  const result = await query(`INSERT INTO coupons (code, type, value, min_order, max_uses, expires_at, is_active)
    VALUES (?,?,?,?,?,?,?)`, fields(req.body));
  res.status(201).json({ id: result.insertId });
}));

r.put('/:id', requireStaff, wrap(async (req, res) => {
  await query(`UPDATE coupons SET code=?, type=?, value=?, min_order=?, max_uses=?, expires_at=?, is_active=? WHERE id=?`,
    [...fields(req.body), req.params.id]);
  res.json({ ok: true });
}));

r.delete('/:id', requireStaff, wrap(async (req, res) => {
  await query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default r;

import { Router } from 'express';
import { query } from '../db.js';
import { requireStaff } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';

const r = Router();
r.use(requireStaff);

// Sản phẩm sắp hết hàng
r.get('/low-stock', wrap(async (_req, res) => {
  res.json(await query('SELECT id, name, stock, low_stock_threshold FROM products WHERE is_active = 1 AND stock <= low_stock_threshold ORDER BY stock'));
}));

r.get('/logs', wrap(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.product_id) { where = 'WHERE l.product_id = ?'; params.push(req.query.product_id); }
  res.json(await query(`SELECT l.*, p.name AS product_name, u.name AS user_name FROM inventory_logs l
    JOIN products p ON p.id = l.product_id LEFT JOIN users u ON u.id = l.created_by
    ${where} ORDER BY l.created_at DESC LIMIT 200`, params));
}));

// Nhập / xuất kho thủ công
r.post('/adjust', wrap(async (req, res) => {
  const { product_id, change_qty, reason } = req.body;
  const qty = Math.trunc(Number(change_qty));
  if (!qty) throw httpError(400, 'Số lượng thay đổi phải khác 0');
  const [p] = await query('SELECT stock FROM products WHERE id = ?', [product_id]);
  if (!p) throw httpError(404, 'Không tìm thấy sản phẩm');
  if (p.stock + qty < 0) throw httpError(400, 'Tồn kho không đủ để xuất');
  await query('UPDATE products SET stock = stock + ? WHERE id = ?', [qty, product_id]);
  await query('INSERT INTO inventory_logs (product_id, change_qty, reason, created_by) VALUES (?,?,?,?)',
    [product_id, qty, reason || (qty > 0 ? 'Nhập kho' : 'Xuất kho'), req.user.id]);
  res.json({ ok: true, stock: p.stock + qty });
}));

export default r;

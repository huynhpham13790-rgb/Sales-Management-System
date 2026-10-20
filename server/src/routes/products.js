import { Router } from 'express';
import { query } from '../db.js';
import { requireStaff, requireAuth, optionalAuth } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';

const r = Router();

const SORTS = {
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  best_selling: 'sold DESC',
  rating: 'avg_rating DESC',
};

const BASE_SELECT = `SELECT p.*, c.name AS category_name,
  (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS sold,
  (SELECT ROUND(AVG(rating),1) FROM reviews rv WHERE rv.product_id = p.id) AS avg_rating,
  (SELECT COUNT(*) FROM reviews rv WHERE rv.product_id = p.id) AS review_count
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

// GET /api/products?q=&category=&min=&max=&sort=&page=&limit=&all=1
r.get('/', optionalAuth, wrap(async (req, res) => {
  const { q, category, min, max, sort = 'newest' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 12);
  const where = [];
  const params = [];
  const isStaff = ['admin', 'staff'].includes(req.user?.role);
  if (!(isStaff && req.query.all)) where.push('p.is_active = 1');
  if (q) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { where.push('p.category_id = ?'); params.push(category); }
  if (min) { where.push('p.price >= ?'); params.push(min); }
  if (max) { where.push('p.price <= ?'); params.push(max); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const items = await query(
    `${BASE_SELECT} ${whereSql} ORDER BY ${SORTS[sort] || SORTS.newest} LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

r.get('/:id', wrap(async (req, res) => {
  const [product] = await query(`${BASE_SELECT} WHERE p.id = ?`, [req.params.id]);
  if (!product) throw httpError(404, 'Không tìm thấy sản phẩm');
  const reviews = await query(`SELECT rv.*, u.name AS user_name FROM reviews rv JOIN users u ON u.id = rv.user_id
    WHERE rv.product_id = ? ORDER BY rv.created_at DESC`, [req.params.id]);
  // Gợi ý sản phẩm "thường được mua cùng" dựa trên các đơn hàng chứa sản phẩm này
  let related = await query(`SELECT p.id, p.name, p.price, p.image_url, COUNT(*) AS freq
    FROM order_items a JOIN order_items b ON a.order_id = b.order_id AND b.product_id <> a.product_id
    JOIN products p ON p.id = b.product_id
    WHERE a.product_id = ? AND p.is_active = 1 GROUP BY p.id ORDER BY freq DESC LIMIT 4`, [req.params.id]);
  if (!related.length) {
    related = await query(`SELECT id, name, price, image_url FROM products
      WHERE category_id = ? AND id <> ? AND is_active = 1 LIMIT 4`, [product.category_id, product.id]);
  }
  res.json({ ...product, reviews, related });
}));

function productFields(b) {
  if (!b.name || b.price == null) throw httpError(400, 'Thiếu tên hoặc giá sản phẩm');
  return [b.category_id || null, b.name, b.description || '', Number(b.price), Number(b.low_stock_threshold ?? 5),
    b.image_url || null, b.is_active === false || b.is_active === 0 ? 0 : 1];
}

r.post('/', requireStaff, wrap(async (req, res) => {
  const result = await query(`INSERT INTO products (category_id, name, description, price, low_stock_threshold, image_url, is_active, stock)
    VALUES (?,?,?,?,?,?,?,?)`, [...productFields(req.body), Number(req.body.stock) || 0]);
  if (Number(req.body.stock) > 0) {
    await query('INSERT INTO inventory_logs (product_id, change_qty, reason, created_by) VALUES (?,?,?,?)',
      [result.insertId, Number(req.body.stock), 'Tồn kho ban đầu', req.user.id]);
  }
  res.status(201).json({ id: result.insertId });
}));

r.put('/:id', requireStaff, wrap(async (req, res) => {
  await query(`UPDATE products SET category_id=?, name=?, description=?, price=?, low_stock_threshold=?, image_url=?, is_active=?
    WHERE id = ?`, [...productFields(req.body), req.params.id]);
  res.json({ ok: true });
}));

r.delete('/:id', requireStaff, wrap(async (req, res) => {
  // Sản phẩm đã có đơn hàng thì chỉ ẩn để giữ lịch sử
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM order_items WHERE product_id = ?', [req.params.id]);
  if (n > 0) await query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  else await query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ ok: true, hidden: n > 0 });
}));

// Đánh giá sản phẩm: chỉ khách đã mua (đơn hoàn thành) mới được đánh giá
r.post('/:id/reviews', requireAuth, wrap(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw httpError(400, 'Số sao từ 1 đến 5');
  const [{ n }] = await query(`SELECT COUNT(*) AS n FROM orders o JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'completed'`, [req.user.id, req.params.id]);
  if (!n) throw httpError(403, 'Bạn cần mua và nhận sản phẩm trước khi đánh giá');
  await query(`INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)
    ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = NOW()`,
    [req.params.id, req.user.id, rating, req.body.comment || '']);
  res.status(201).json({ ok: true });
}));

export default r;

import { Router } from 'express';
import { query } from '../db.js';
import { requireStaff } from '../middleware/auth.js';
import { wrap } from '../utils.js';

const r = Router();
r.use(requireStaff);

r.get('/summary', wrap(async (req, res) => {
  const days = Math.min(365, Number(req.query.days) || 30);
  const [totals] = await query(`SELECT
      COALESCE(SUM(CASE WHEN status = 'completed' THEN total END),0) AS revenue,
      COUNT(*) AS orders,
      SUM(status = 'pending') AS pending,
      SUM(status = 'cancelled') AS cancelled,
      COUNT(DISTINCT user_id) AS customers
    FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [days]);
  const daily = await query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day,
      COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total END),0) AS revenue, COUNT(*) AS orders
    FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY day ORDER BY day`, [days]);
  const topProducts = await query(`SELECT oi.product_id, oi.product_name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'cancelled' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY oi.product_id, oi.product_name ORDER BY qty DESC LIMIT 5`, [days]);
  const byCategory = await query(`SELECT COALESCE(c.name, 'Khác') AS category, SUM(oi.quantity * oi.price) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.status <> 'cancelled' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY category ORDER BY revenue DESC`, [days]);
  const [{ low_stock }] = await query('SELECT COUNT(*) AS low_stock FROM products WHERE is_active = 1 AND stock <= low_stock_threshold');
  res.json({ ...totals, low_stock, daily, topProducts, byCategory });
}));

export default r;

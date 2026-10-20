import { Router } from 'express';
import { pool, query } from '../db.js';
import { optionalAuth, requireAuth, requireStaff } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';
import { evaluateCoupon } from './coupons.js';

const r = Router();

// Luồng trạng thái hợp lệ của đơn hàng
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const genCode = () => 'SF' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 10);

async function withItems(orders) {
  if (!orders.length) return orders;
  const items = await query('SELECT * FROM order_items WHERE order_id IN (?)', [orders.map((o) => o.id)]);
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
}

// Tạo đơn hàng (khách vãng lai hoặc đã đăng nhập). Trừ tồn kho trong 1 transaction.
r.post('/', optionalAuth, wrap(async (req, res) => {
  const { customer_name, phone, address, items, coupon_code, payment_method = 'cod', note } = req.body;
  if (!customer_name || !phone || !address) throw httpError(400, 'Vui lòng nhập đủ họ tên, SĐT, địa chỉ');
  if (!/^0\d{9}$/.test(phone)) throw httpError(400, 'Số điện thoại không hợp lệ');
  if (!Array.isArray(items) || !items.length) throw httpError(400, 'Giỏ hàng trống');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let subtotal = 0;
    const lines = [];
    for (const it of items) {
      const qty = Math.floor(Number(it.quantity));
      if (!(qty > 0)) throw httpError(400, 'Số lượng không hợp lệ');
      const [[p]] = await conn.query('SELECT * FROM products WHERE id = ? AND is_active = 1 FOR UPDATE', [it.product_id]);
      if (!p) throw httpError(400, 'Sản phẩm không tồn tại hoặc đã ngừng bán');
      if (p.stock < qty) throw httpError(400, `"${p.name}" chỉ còn ${p.stock} sản phẩm`);
      subtotal += p.price * qty;
      lines.push({ p, qty });
    }
    let discount = 0;
    let code = null;
    if (coupon_code) {
      const ev = await evaluateCoupon(coupon_code, subtotal, conn);
      discount = ev.discount;
      code = ev.coupon.code;
      await conn.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [ev.coupon.id]);
    }
    const orderCode = genCode();
    const [result] = await conn.query(
      `INSERT INTO orders (code, user_id, customer_name, phone, address, subtotal, discount, total, coupon_code, payment_method, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [orderCode, req.user?.id || null, customer_name, phone, address, subtotal, discount, subtotal - discount, code,
        payment_method === 'bank' ? 'bank' : 'cod', note || null]
    );
    for (const { p, qty } of lines) {
      await conn.query('INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?,?,?,?,?)',
        [result.insertId, p.id, p.name, p.price, qty]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, p.id]);
      await conn.query('INSERT INTO inventory_logs (product_id, change_qty, reason) VALUES (?,?,?)',
        [p.id, -qty, `Bán hàng - đơn ${orderCode}`]);
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId, code: orderCode, total: subtotal - discount });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Tra cứu đơn hàng theo mã + SĐT (không cần đăng nhập)
r.get('/track', wrap(async (req, res) => {
  const orders = await query('SELECT * FROM orders WHERE code = ? AND phone = ?', [req.query.code, req.query.phone]);
  if (!orders.length) throw httpError(404, 'Không tìm thấy đơn hàng');
  res.json((await withItems(orders))[0]);
}));

r.get('/mine', requireAuth, wrap(async (req, res) => {
  res.json(await withItems(await query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id])));
}));

// Khách tự hủy đơn khi còn chờ xác nhận
r.post('/:id/cancel', requireAuth, wrap(async (req, res) => {
  const [o] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!o) throw httpError(404, 'Không tìm thấy đơn hàng');
  if (o.status !== 'pending') throw httpError(400, 'Chỉ hủy được đơn đang chờ xác nhận');
  await changeStatus(o, 'cancelled', req.user.id);
  res.json({ ok: true });
}));

// ===== Admin =====
r.get('/', requireStaff, wrap(async (req, res) => {
  const { status, q, from, to } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (q) { where.push('(code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (from) { where.push('created_at >= ?'); params.push(from); }
  if (to) { where.push('created_at < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(to); }
  const sql = `SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 500`;
  res.json(await withItems(await query(sql, params)));
}));

// Xuất CSV danh sách đơn (mở được bằng Excel)
r.get('/export/csv', requireStaff, wrap(async (_req, res) => {
  const rows = await query('SELECT code, created_at, customer_name, phone, address, subtotal, discount, total, coupon_code, payment_method, status FROM orders ORDER BY created_at DESC');
  const header = ['Mã đơn', 'Ngày tạo', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Tạm tính', 'Giảm giá', 'Tổng tiền', 'Mã giảm giá', 'Thanh toán', 'Trạng thái'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows.map((r) => [r.code, new Date(r.created_at).toLocaleString('vi-VN'), r.customer_name, r.phone,
    r.address, r.subtotal, r.discount, r.total, r.coupon_code, r.payment_method, r.status])]
    .map((line) => line.map(esc).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="don-hang.csv"');
  res.send('﻿' + csv);
}));

async function changeStatus(order, status, userId) {
  if (!TRANSITIONS[order.status].includes(status)) {
    throw httpError(400, `Không thể chuyển từ "${order.status}" sang "${status}"`);
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
    if (status === 'cancelled') {
      // Hoàn lại tồn kho khi hủy đơn
      const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ? AND product_id IS NOT NULL', [order.id]);
      for (const it of items) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
        await conn.query('INSERT INTO inventory_logs (product_id, change_qty, reason, created_by) VALUES (?,?,?,?)',
          [it.product_id, it.quantity, `Hoàn kho - hủy đơn ${order.code}`, userId]);
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

r.patch('/:id/status', requireStaff, wrap(async (req, res) => {
  const [o] = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!o) throw httpError(404, 'Không tìm thấy đơn hàng');
  await changeStatus(o, req.body.status, req.user.id);
  res.json({ ok: true });
}));

export default r;

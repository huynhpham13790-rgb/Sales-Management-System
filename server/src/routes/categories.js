import { Router } from 'express';
import { query } from '../db.js';
import { requireStaff } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';

const r = Router();

export const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

r.get('/', wrap(async (_req, res) => {
  res.json(await query(`SELECT c.*, COUNT(p.id) AS product_count FROM categories c
    LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name`));
}));

r.post('/', requireStaff, wrap(async (req, res) => {
  if (!req.body.name) throw httpError(400, 'Thiếu tên danh mục');
  const result = await query('INSERT INTO categories (name, slug) VALUES (?, ?)', [req.body.name, slugify(req.body.name)]);
  res.status(201).json({ id: result.insertId });
}));

r.put('/:id', requireStaff, wrap(async (req, res) => {
  await query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [req.body.name, slugify(req.body.name), req.params.id]);
  res.json({ ok: true });
}));

r.delete('/:id', requireStaff, wrap(async (req, res) => {
  await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default r;

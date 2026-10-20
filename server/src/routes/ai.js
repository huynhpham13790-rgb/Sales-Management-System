import { Router } from 'express';
import { query } from '../db.js';
import { optionalAuth, requireStaff } from '../middleware/auth.js';
import { wrap, httpError } from '../utils.js';
import { chat, groqEnabled } from '../services/groq.js';
import { demandForecast, customerSegments, SEGMENT_INFO } from '../services/analytics.js';

const r = Router();
const vnd = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

r.get('/status', (_req, res) => res.json({ groq: groqEnabled(), model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' }));

// ===== Dự báo nhu cầu =====
r.get('/forecast', requireStaff, wrap(async (req, res) => {
  const horizon = Math.min(60, Number(req.query.horizon) || 14);
  const items = await demandForecast({ horizon });
  let insight = null;
  if (req.query.insight) {
    const top = items.slice(0, 8).map((i) => `${i.name}: tồn ${i.stock}, đã bán 60 ngày ${i.sold_history}, dự báo ${horizon} ngày ${i.forecast}, xu hướng ${i.trend}, đề xuất nhập ${i.reorder}`).join('\n');
    insight = await chat([
      { role: 'system', content: 'Bạn là chuyên gia phân tích bán lẻ. Trả lời bằng tiếng Việt, ngắn gọn, dạng gạch đầu dòng.' },
      { role: 'user', content: `Dữ liệu dự báo nhu cầu ${horizon} ngày tới:\n${top}\n\nHãy nhận xét xu hướng và đưa ra 3-5 khuyến nghị nhập hàng/khuyến mãi cụ thể.` },
    ]);
  }
  res.json({ horizon, items, insight, ai: groqEnabled() });
}));

// ===== Phân khúc khách hàng =====
r.get('/segments', requireStaff, wrap(async (req, res) => {
  const customers = await customerSegments();
  const summary = Object.entries(SEGMENT_INFO).map(([key, info]) => {
    const list = customers.filter((c) => c.segment === key);
    return { key, ...info, count: list.length, revenue: list.reduce((s, c) => s + c.monetary, 0) };
  });
  let insight = null;
  if (req.query.insight) {
    insight = await chat([
      { role: 'system', content: 'Bạn là chuyên gia CRM/marketing. Trả lời tiếng Việt, ngắn gọn, gạch đầu dòng.' },
      { role: 'user', content: `Kết quả phân khúc RFM:\n${summary.map((s) => `${s.label}: ${s.count} khách, doanh thu ${vnd(s.revenue)}`).join('\n')}\n\nĐề xuất chiến dịch chăm sóc cho từng nhóm.` },
    ]);
  }
  res.json({ summary, customers, insight, ai: groqEnabled() });
}));

// ===== Chatbot hỗ trợ bán hàng =====
async function catalogContext(question) {
  const words = question.toLowerCase().split(/\s+/).filter((w) => w.length > 2).slice(0, 6);
  let products = [];
  if (words.length) {
    products = await query(`SELECT p.id, p.name, p.price, p.stock, p.description, c.name AS category FROM products p
      LEFT JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1 AND (${words.map(() => '(p.name LIKE ? OR c.name LIKE ? OR p.description LIKE ?)').join(' OR ')})
      LIMIT 8`, words.flatMap((w) => [`%${w}%`, `%${w}%`, `%${w}%`]));
  }
  if (!products.length) {
    products = await query(`SELECT p.id, p.name, p.price, p.stock, p.description, c.name AS category FROM products p
      LEFT JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT 12`);
  }
  return products;
}

function fallbackAnswer(question, products) {
  const q = question.toLowerCase();
  if (/(giao hàng|ship|vận chuyển)/.test(q)) return 'Shop giao hàng toàn quốc trong 2-5 ngày, miễn phí với đơn từ 500.000đ. Bạn có thể tra cứu đơn tại mục "Tra cứu đơn".';
  if (/(đổi trả|bảo hành)/.test(q)) return 'Sản phẩm được đổi trả trong 7 ngày nếu lỗi do nhà sản xuất và bảo hành chính hãng 12 tháng.';
  if (/(giảm giá|khuyến mãi|mã|voucher)/.test(q)) return 'Bạn có thể dùng mã WELCOME10 để giảm 10% cho đơn từ 1.000.000đ.';
  const list = products.slice(0, 4).map((p) => `• ${p.name} – ${vnd(p.price)}${p.stock > 0 ? '' : ' (hết hàng)'}`).join('\n');
  return `Mình gợi ý một số sản phẩm phù hợp:\n${list}\nBạn cần tư vấn thêm về sản phẩm nào không?`;
}

r.post('/chat', optionalAuth, wrap(async (req, res) => {
  const message = String(req.body.message || '').trim().slice(0, 500);
  if (!message) throw httpError(400, 'Tin nhắn trống');
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-6) : [];
  const products = await catalogContext(message);
  const catalog = products.map((p) => `- [${p.id}] ${p.name} (${p.category}) giá ${vnd(p.price)}, tồn ${p.stock}: ${p.description}`).join('\n');
  let answer = await chat([
    { role: 'system', content: `Bạn là trợ lý bán hàng thân thiện của cửa hàng SalesFlow. Chỉ tư vấn dựa trên danh sách sản phẩm dưới đây, không bịa sản phẩm/giá. Trả lời tiếng Việt, ngắn gọn (tối đa 120 từ).
Chính sách: giao hàng 2-5 ngày, miễn phí ship đơn từ 500.000đ, đổi trả 7 ngày, bảo hành 12 tháng, mã WELCOME10 giảm 10% đơn từ 1 triệu.
Sản phẩm liên quan:\n${catalog}` },
    ...history.filter((h) => ['user', 'assistant'].includes(h.role)).map((h) => ({ role: h.role, content: String(h.content).slice(0, 500) })),
    { role: 'user', content: message },
  ]);
  if (!answer) answer = fallbackAnswer(message, products);
  await query('INSERT INTO chat_logs (user_id, question, answer) VALUES (?,?,?)', [req.user?.id || null, message, answer]);
  res.json({ answer, products: products.slice(0, 3).map(({ id, name, price }) => ({ id, name, price })) });
}));

// ===== Sinh mô tả sản phẩm (admin) =====
r.post('/describe', requireStaff, wrap(async (req, res) => {
  const { name, category, keywords } = req.body;
  if (!name) throw httpError(400, 'Thiếu tên sản phẩm');
  const text = await chat([
    { role: 'system', content: 'Bạn là copywriter thương mại điện tử. Viết tiếng Việt, hấp dẫn, trung thực, 60-100 từ, không dùng markdown.' },
    { role: 'user', content: `Viết mô tả bán hàng cho sản phẩm "${name}"${category ? ` thuộc danh mục ${category}` : ''}${keywords ? `. Điểm nổi bật: ${keywords}` : ''}.` },
  ], { temperature: 0.7 });
  res.json({ description: text || `${name} chính hãng${keywords ? `, nổi bật với ${keywords}` : ''}. Sản phẩm được bảo hành 12 tháng, đổi trả trong 7 ngày và giao hàng toàn quốc.` });
}));

// ===== Tóm tắt đánh giá sản phẩm =====
r.get('/review-summary/:productId', wrap(async (req, res) => {
  const reviews = await query('SELECT rating, comment FROM reviews WHERE product_id = ?', [req.params.productId]);
  if (!reviews.length) return res.json({ summary: null });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const text = await chat([
    { role: 'system', content: 'Tóm tắt ý kiến khách hàng bằng tiếng Việt trong 1-2 câu, nêu ưu và nhược điểm chính.' },
    { role: 'user', content: reviews.map((r) => `${r.rating}★: ${r.comment}`).join('\n') },
  ], { maxTokens: 150 });
  const positive = reviews.filter((r) => r.rating >= 4).length;
  res.json({ summary: text || `${positive}/${reviews.length} khách hàng đánh giá tích cực, điểm trung bình ${avg.toFixed(1)}/5.` });
}));

r.get('/chat-logs', requireStaff, wrap(async (_req, res) => {
  res.json(await query(`SELECT l.*, u.name AS user_name FROM chat_logs l LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.created_at DESC LIMIT 100`));
}));

export default r;

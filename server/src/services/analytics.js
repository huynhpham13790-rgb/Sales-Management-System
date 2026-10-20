// Các thuật toán phân tích chạy cục bộ (không cần AI bên ngoài):
// - Dự báo nhu cầu: trung bình động có trọng số + xu hướng hồi quy tuyến tính
// - Phân khúc khách hàng: mô hình RFM (Recency, Frequency, Monetary)
import { query } from '../db.js';

const DAY = 86400000;

function linearSlope(ys) {
  const n = ys.length;
  if (n < 2) return 0;
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  ys.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2; });
  return den ? num / den : 0;
}

export async function demandForecast({ historyDays = 60, horizon = 14 } = {}) {
  const rows = await query(`SELECT oi.product_id, DATE(o.created_at) AS d, SUM(oi.quantity) AS qty
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'cancelled' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id, d`, [historyDays]);
  const products = await query('SELECT id, name, stock, low_stock_threshold FROM products WHERE is_active = 1');
  const start = new Date(Date.now() - historyDays * DAY);
  start.setHours(0, 0, 0, 0);

  return products.map((p) => {
    // Gom doanh số theo tuần để giảm nhiễu
    const weeks = Array(Math.ceil(historyDays / 7)).fill(0);
    rows.filter((r) => r.product_id === p.id).forEach((r) => {
      const idx = Math.floor((new Date(r.d) - start) / (7 * DAY));
      if (idx >= 0 && idx < weeks.length) weeks[idx] += Number(r.qty);
    });
    const total = weeks.reduce((a, b) => a + b, 0);
    // Trọng số tăng dần: tuần gần đây quan trọng hơn
    const wSum = weeks.reduce((s, _, i) => s + (i + 1), 0);
    const wma = weeks.reduce((s, v, i) => s + v * (i + 1), 0) / wSum;
    const slope = linearSlope(weeks);
    const weeklyForecast = Math.max(0, wma + slope);
    const forecast = Math.round((weeklyForecast / 7) * horizon * 10) / 10;
    const dailyRate = weeklyForecast / 7;
    const daysLeft = dailyRate > 0 ? Math.floor(p.stock / dailyRate) : null;
    const reorder = Math.max(0, Math.ceil(forecast + p.low_stock_threshold - p.stock));
    const trend = slope > 0.3 ? 'up' : slope < -0.3 ? 'down' : 'flat';
    return { product_id: p.id, name: p.name, stock: p.stock, sold_history: total, weekly: weeks,
      forecast, days_left: daysLeft, reorder, trend };
  }).sort((a, b) => b.reorder - a.reorder || b.forecast - a.forecast);
}

export const SEGMENT_INFO = {
  champions: { label: 'Khách VIP', tip: 'Ưu đãi độc quyền, chương trình tri ân, mời dùng thử sản phẩm mới.' },
  loyal: { label: 'Khách trung thành', tip: 'Tích điểm, upsell sản phẩm giá trị cao hơn.' },
  potential: { label: 'Tiềm năng', tip: 'Gợi ý sản phẩm liên quan, mã giảm giá cho đơn tiếp theo.' },
  new: { label: 'Khách mới', tip: 'Email chào mừng, hướng dẫn sử dụng, ưu đãi đơn thứ hai.' },
  at_risk: { label: 'Có nguy cơ rời bỏ', tip: 'Gửi mã giảm giá cá nhân hóa, khảo sát lý do.' },
  lost: { label: 'Đã rời bỏ', tip: 'Chiến dịch win-back với ưu đãi mạnh.' },
};

const scoreByQuantile = (value, sorted, reverse = false) => {
  if (sorted.length <= 1) return 3;
  const rank = sorted.filter((v) => v <= value).length / sorted.length;
  const s = Math.min(5, Math.max(1, Math.ceil(rank * 5)));
  return reverse ? 6 - s : s;
};

export async function customerSegments() {
  const rows = await query(`SELECT u.id, u.name, u.email, u.phone,
      DATEDIFF(NOW(), MAX(o.created_at)) AS recency, COUNT(o.id) AS frequency, SUM(o.total) AS monetary
    FROM users u JOIN orders o ON o.user_id = u.id AND o.status <> 'cancelled'
    WHERE u.role = 'customer' GROUP BY u.id`);
  const R = rows.map((r) => r.recency).sort((a, b) => a - b);
  const F = rows.map((r) => r.frequency).sort((a, b) => a - b);
  const M = rows.map((r) => Number(r.monetary)).sort((a, b) => a - b);
  return rows.map((c) => {
    const r = scoreByQuantile(c.recency, R, true);
    const f = scoreByQuantile(c.frequency, F);
    const m = scoreByQuantile(Number(c.monetary), M);
    let segment;
    if (r >= 4 && f >= 4 && m >= 4) segment = 'champions';
    else if (f >= 4) segment = r >= 3 ? 'loyal' : 'at_risk';
    else if (r >= 4) segment = f <= 1 ? 'new' : 'potential';
    else if (r <= 2) segment = f >= 3 ? 'at_risk' : 'lost';
    else segment = 'potential';
    return { ...c, monetary: Number(c.monetary), r, f, m, segment, segment_label: SEGMENT_INFO[segment].label };
  }).sort((a, b) => b.monetary - a.monetary);
}

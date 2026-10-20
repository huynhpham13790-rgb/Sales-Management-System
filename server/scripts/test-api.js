// Kiểm thử nhanh toàn bộ API. Chạy khi server đang bật: npm run test-api
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let pass = 0, fail = 0;

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function test(name, fn) {
  try {
    const info = await fn();
    pass++;
    console.log(`✔ ${name}${info ? ' — ' + info : ''}`);
  } catch (e) {
    fail++;
    console.log(`✘ ${name} — ${e.message}`);
  }
}

function expect(cond, msg) { if (!cond) throw new Error(msg); }

const short = (s, n = 160) => String(s).replace(/\s+/g, ' ').slice(0, n) + (String(s).length > n ? '…' : '');

let admin, customer, product, orderId, orderCode;

await test('Health check', async () => { const r = await call('/health'); expect(r.data.ok, 'server không phản hồi'); });
await test('Đăng nhập admin', async () => {
  const r = await call('/auth/login', { method: 'POST', body: { email: 'admin@salesflow.vn', password: 'admin123' } });
  expect(r.status === 200, r.data.message); admin = r.data.token;
});
await test('Đăng nhập sai mật khẩu bị từ chối', async () => {
  const r = await call('/auth/login', { method: 'POST', body: { email: 'admin@salesflow.vn', password: 'sai' } });
  expect(r.status === 401, 'mong đợi 401');
});
await test('Đăng ký khách hàng mới', async () => {
  const r = await call('/auth/register', { method: 'POST', body: { name: 'Khách Test', email: `test${Date.now()}@mail.com`, password: '123456' } });
  expect(r.status === 201, r.data.message); customer = r.data.token;
});
await test('Khách không vào được API quản trị', async () => {
  const r = await call('/dashboard/summary', { token: customer }); expect(r.status === 403, 'mong đợi 403');
});
await test('Danh sách danh mục', async () => { const r = await call('/categories'); expect(r.data.length > 0, 'rỗng'); return `${r.data.length} danh mục`; });
await test('Tìm & lọc sản phẩm', async () => {
  const r = await call('/products?sort=best_selling&limit=5');
  expect(r.data.items.length > 0, 'rỗng');
  product = r.data.items.find((p) => p.stock > 5);
  return `${r.data.total} sản phẩm`;
});
await test('Chi tiết sản phẩm + gợi ý mua cùng', async () => {
  const r = await call(`/products/${product.id}`); expect(r.data.name, 'không có dữ liệu');
  return `${r.data.related.length} gợi ý`;
});
await test('Kiểm tra mã giảm giá WELCOME10', async () => {
  const r = await call('/coupons/validate', { method: 'POST', body: { code: 'WELCOME10', subtotal: 2000000 } });
  expect(r.data.discount === 200000, JSON.stringify(r.data));
});
await test('Mã giảm giá không đủ đơn tối thiểu bị từ chối', async () => {
  const r = await call('/coupons/validate', { method: 'POST', body: { code: 'WELCOME10', subtotal: 100 } });
  expect(r.status === 400, 'mong đợi 400');
});
await test('Đặt hàng (trừ tồn kho)', async () => {
  const r = await call('/orders', { method: 'POST', token: customer, body: {
    customer_name: 'Khách Test', phone: '0987654321', address: 'Hà Nội', coupon_code: 'WELCOME10',
    items: [{ product_id: product.id, quantity: 2 }] } });
  expect(r.status === 201, r.data.message); orderId = r.data.id; orderCode = r.data.code;
  const p = await call(`/products/${product.id}`);
  expect(p.data.stock === product.stock - 2, 'tồn kho chưa giảm');
  return `đơn ${orderCode}`;
});
await test('Đặt vượt tồn kho bị từ chối', async () => {
  const r = await call('/orders', { method: 'POST', body: { customer_name: 'A', phone: '0987654321', address: 'B', items: [{ product_id: product.id, quantity: 99999 }] } });
  expect(r.status === 400, 'mong đợi 400');
});
await test('Tra cứu đơn bằng mã + SĐT', async () => {
  const r = await call(`/orders/track?code=${orderCode}&phone=0987654321`); expect(r.data.id === orderId, 'không tìm thấy');
});
await test('Admin chuyển trạng thái đơn', async () => {
  const r = await call(`/orders/${orderId}/status`, { method: 'PATCH', token: admin, body: { status: 'confirmed' } });
  expect(r.status === 200, r.data.message);
});
await test('Không cho chuyển trạng thái sai luồng', async () => {
  const r = await call(`/orders/${orderId}/status`, { method: 'PATCH', token: admin, body: { status: 'pending' } });
  expect(r.status === 400, 'mong đợi 400');
});
await test('Hủy đơn hoàn lại tồn kho', async () => {
  await call(`/orders/${orderId}/status`, { method: 'PATCH', token: admin, body: { status: 'cancelled' } });
  const p = await call(`/products/${product.id}`); expect(p.data.stock === product.stock, 'tồn kho chưa hoàn');
});
await test('Nhập kho thủ công', async () => {
  const r = await call('/inventory/adjust', { method: 'POST', token: admin, body: { product_id: product.id, change_qty: 1, reason: 'Test' } });
  expect(r.status === 200, r.data.message);
  await call('/inventory/adjust', { method: 'POST', token: admin, body: { product_id: product.id, change_qty: -1, reason: 'Test' } });
});
await test('Cảnh báo sắp hết hàng', async () => { const r = await call('/inventory/low-stock', { token: admin }); return `${r.data.length} sản phẩm`; });
await test('Dashboard', async () => {
  const r = await call('/dashboard/summary?days=30', { token: admin }); expect(r.data.daily, 'thiếu dữ liệu');
  return `doanh thu 30 ngày ${Number(r.data.revenue).toLocaleString('vi-VN')}đ, ${r.data.orders} đơn`;
});
await test('Xuất CSV đơn hàng', async () => {
  const r = await call('/orders/export/csv', { token: admin }); expect(String(r.data).includes('Mã đơn'), 'CSV lỗi');
});

console.log('\n--- AI ---');
await test('Trạng thái Groq', async () => { const r = await call('/ai/status'); return r.data.groq ? `đã cấu hình (${r.data.model})` : 'CHƯA có API key – dùng chế độ dự phòng'; });
await test('Chatbot tư vấn', async () => {
  const r = await call('/ai/chat', { method: 'POST', body: { message: 'Tư vấn cho mình laptop tầm 20 triệu để học lập trình' } });
  expect(r.data.answer, r.data.message); return short(r.data.answer);
});
await test('Dự báo nhu cầu + nhận định AI', async () => {
  const r = await call('/ai/forecast?horizon=14&insight=1', { token: admin });
  expect(r.data.items.length, 'rỗng');
  return `${r.data.items.length} SP; AI: ${short(r.data.insight || '(không có)')}`;
});
await test('Phân khúc khách hàng RFM + đề xuất AI', async () => {
  const r = await call('/ai/segments?insight=1', { token: admin });
  return `${r.data.customers.length} khách; AI: ${short(r.data.insight || '(không có)')}`;
});
await test('AI viết mô tả sản phẩm', async () => {
  const r = await call('/ai/describe', { method: 'POST', token: admin, body: { name: 'Tai nghe Sony WH-1000XM5', keywords: 'chống ồn, pin 30h' } });
  return short(r.data.description);
});
await test('AI tóm tắt đánh giá', async () => { const r = await call('/ai/review-summary/1'); return short(r.data.summary); });

console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);

// Tạo CSDL từ database/schema.sql và nạp dữ liệu mẫu (nhiều dữ liệu để test dashboard & AI)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

const dbName = process.env.DB_NAME || 'salesflow';
await conn.query(schema.replaceAll('salesflow', dbName));

// Bộ sinh số ngẫu nhiên có seed cố định → mỗi lần seed ra cùng một bộ dữ liệu
let s = 20260601;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const rand = (n) => Math.floor(rnd() * n);
const pick = (arr) => arr[rand(arr.length)];
const DAY = 86400000;
const HISTORY_DAYS = 180;

// ===== Người dùng =====
const hash = (p) => bcrypt.hashSync(p, 10);
const customerPass = hash('123456');
const staffUsers = [
  ['Quản trị viên', 'admin@salesflow.vn', hash('admin123'), '0900000001', 'Thái Nguyên', 'admin'],
  ['Nhân viên bán hàng', 'staff@salesflow.vn', hash('staff123'), '0900000002', 'Thái Nguyên', 'staff'],
  ['Nhân viên kho', 'kho@salesflow.vn', hash('staff123'), '0900000003', 'Thái Nguyên', 'staff'],
];
const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý'];
const dem = ['Văn', 'Thị', 'Minh', 'Quốc', 'Thu', 'Hữu', 'Ngọc', 'Thanh', 'Đức', 'Gia'];
const ten = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hùng', 'Khánh', 'Linh', 'Long', 'Mai', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Trang', 'Tuấn', 'Vy', 'Yến'];
const cities = ['Hà Nội', 'TP.HCM', 'Hải Phòng', 'Đà Nẵng', 'Thái Nguyên', 'Cần Thơ', 'Bắc Ninh', 'Nghệ An', 'Quảng Ninh', 'Huế'];
const streets = ['Lê Lợi', 'Trần Hưng Đạo', 'Nguyễn Trãi', 'Hai Bà Trưng', 'Lý Thường Kiệt', 'Quang Trung', 'Hoàng Văn Thụ'];

// 3 khách cố định để demo + 57 khách ngẫu nhiên
const customers = [
  ['Nguyễn Văn An', 'an@gmail.com', '0911111111', 'Hà Nội'],
  ['Trần Thị Bình', 'binh@gmail.com', '0922222222', 'Hải Phòng'],
  ['Lê Minh Châu', 'chau@gmail.com', '0933333333', 'Đà Nẵng'],
];
const noAccent = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
while (customers.length < 60) {
  const name = `${pick(ho)} ${pick(dem)} ${pick(ten)}`;
  const email = `${noAccent(name).replace(/\s+/g, '.')}${customers.length}@gmail.com`;
  customers.push([name, email, '09' + String(10000000 + rand(89999999)), pick(cities)]);
}
await conn.query(`INSERT INTO users (name, email, password_hash, phone, address, role, created_at) VALUES ?`, [[
  ...staffUsers.map((u) => [...u, new Date(Date.now() - 200 * DAY)]),
  ...customers.map(([n, e, p, c]) => [n, e, customerPass, p, `${1 + rand(300)} ${pick(streets)}, ${c}`, 'customer',
    new Date(Date.now() - (30 + rand(170)) * DAY)]),
]]);
const firstCustomerId = staffUsers.length + 1;

// ===== Danh mục & sản phẩm =====
const categories = [['Điện thoại', 'dien-thoai'], ['Laptop', 'laptop'], ['Máy tính bảng', 'may-tinh-bang'],
  ['Phụ kiện', 'phu-kien'], ['Đồng hồ thông minh', 'dong-ho'], ['Âm thanh', 'am-thanh']];
await conn.query(`INSERT INTO categories (name, slug) VALUES ?`, [categories]);

const img = (seed) => `https://picsum.photos/seed/${seed}/400/300`;
// [danh mục, tên, mô tả, giá, tồn kho, ngưỡng cảnh báo, độ phổ biến, xu hướng (+ tăng, - giảm)]
const products = [
  [1, 'iPhone 15 128GB', 'Chip A16 Bionic, camera 48MP, Dynamic Island, cổng USB-C.', 19990000, 25, 5, 5, 0],
  [1, 'iPhone 15 Pro Max 256GB', 'Khung titan, chip A17 Pro, zoom quang 5x.', 29990000, 8, 3, 3, 1],
  [1, 'Samsung Galaxy S24', 'Màn hình 6.2" Dynamic AMOLED 2X, Galaxy AI.', 18490000, 18, 5, 4, 0],
  [1, 'Samsung Galaxy A55 5G', 'Màn 6.6" Super AMOLED 120Hz, pin 5000mAh.', 9490000, 35, 8, 6, 1],
  [1, 'Xiaomi Redmi Note 13', 'Pin 5000mAh, sạc nhanh 33W, camera 108MP.', 4890000, 40, 10, 7, -1],
  [1, 'OPPO Reno11 F 5G', 'Thiết kế mỏng nhẹ, camera chân dung 64MP.', 8490000, 22, 5, 3, 0],
  [1, 'Google Pixel 8a', 'Chip Tensor G3, camera AI, 7 năm cập nhật.', 11990000, 6, 3, 2, 1],
  [2, 'MacBook Air M2 13"', 'Chip Apple M2, RAM 8GB, SSD 256GB, pin 18 giờ.', 24990000, 10, 3, 3, 0],
  [2, 'MacBook Pro M3 14"', 'Chip M3, RAM 16GB, màn Liquid Retina XDR.', 39990000, 5, 2, 1, 1],
  [2, 'Dell Inspiron 15 3530', 'Core i5 Gen 13, RAM 16GB, SSD 512GB.', 15990000, 12, 4, 3, 0],
  [2, 'Asus TUF Gaming F15', 'Core i7, RTX 4050, màn 144Hz.', 22990000, 4, 3, 3, 1],
  [2, 'Lenovo IdeaPad Slim 5', 'Ryzen 7 7730U, RAM 16GB, màn 2.2K.', 17490000, 9, 3, 2, 0],
  [2, 'HP Victus 16', 'Core i5, RTX 3050, màn 144Hz 16.1".', 19990000, 7, 3, 2, -1],
  [2, 'Acer Aspire 7', 'Ryzen 5, GTX 1650, laptop gaming giá rẻ.', 14990000, 3, 3, 2, -1],
  [3, 'iPad Gen 10 Wi-Fi 64GB', 'Màn 10.9", chip A14, hỗ trợ Apple Pencil.', 9990000, 20, 5, 3, 0],
  [3, 'iPad Air M2 11"', 'Chip M2, màn Liquid Retina, Touch ID.', 16990000, 8, 3, 2, 1],
  [3, 'Samsung Galaxy Tab S9 FE', 'Màn 10.9", kháng nước IP68, kèm bút S Pen.', 9990000, 15, 4, 2, 0],
  [3, 'Xiaomi Pad 6', 'Màn 11" 144Hz, Snapdragon 870, loa 4 kênh.', 7490000, 2, 4, 2, 0],
  [4, 'Sạc dự phòng Anker 20000mAh', 'Sạc nhanh PD 22.5W, 2 cổng ra.', 890000, 60, 15, 8, 0],
  [4, 'Chuột Logitech MX Master 3S', 'Cảm biến 8K DPI, cuộn MagSpeed, đa thiết bị.', 2290000, 3, 5, 4, 1],
  [4, 'Bàn phím cơ Keychron K2', 'Hot-swap, kết nối Bluetooth, đèn RGB.', 2190000, 14, 4, 3, 0],
  [4, 'Cáp sạc USB-C Baseus 100W', 'Dài 2m, sạc nhanh laptop & điện thoại.', 190000, 120, 20, 9, 0],
  [4, 'Củ sạc Apple 20W USB-C', 'Sạc nhanh chính hãng cho iPhone/iPad.', 490000, 80, 15, 7, 0],
  [4, 'Ốp lưng MagSafe iPhone 15', 'Silicon chính hãng, hỗ trợ sạc MagSafe.', 1190000, 45, 10, 5, 0],
  [4, 'Balo laptop Xiaomi', 'Chống nước, ngăn laptop 15.6".', 590000, 30, 8, 4, -1],
  [4, 'Webcam Logitech C920', 'Full HD 1080p, micro kép.', 1490000, 0, 3, 2, -1],
  [5, 'Apple Watch SE 2 GPS 40mm', 'Theo dõi sức khỏe, phát hiện va chạm, chống nước 50m.', 6290000, 15, 4, 3, 0],
  [5, 'Apple Watch Series 9 45mm', 'Chip S9, chạm hai lần, màn sáng 2000 nits.', 10990000, 7, 3, 2, 1],
  [5, 'Samsung Galaxy Watch6', 'Đo huyết áp, điện tâm đồ, theo dõi giấc ngủ.', 5990000, 10, 3, 2, 0],
  [5, 'Xiaomi Smart Band 8', 'Pin 16 ngày, 150+ chế độ thể thao.', 890000, 50, 10, 7, 0],
  [5, 'Huawei Watch Fit 3', 'Màn AMOLED 1.82", GPS độc lập.', 2990000, 1, 3, 3, 1],
  [6, 'Tai nghe AirPods Pro 2 USB-C', 'Chống ồn chủ động, âm thanh không gian.', 5990000, 30, 6, 5, 0],
  [6, 'Tai nghe AirPods 3', 'Âm thanh không gian, chống nước IPX4.', 3990000, 20, 5, 3, -1],
  [6, 'Sony WH-1000XM5', 'Chống ồn hàng đầu, pin 30 giờ.', 7990000, 6, 3, 2, 1],
  [6, 'JBL Tune 520BT', 'Tai nghe chụp tai Bluetooth, pin 57 giờ.', 1190000, 25, 6, 4, 0],
  [6, 'Loa JBL Flip 6', 'Chống nước IP67, pin 12 giờ, âm bass mạnh.', 2790000, 12, 4, 3, 0],
  [6, 'Loa Marshall Emberton II', 'Âm thanh 360°, pin 30 giờ.', 4290000, 5, 3, 2, 0],
  [6, 'Samsung Galaxy Buds2 Pro', 'Chống ồn ANC, âm thanh Hi-Fi 24bit.', 3490000, 18, 5, 3, -1],
];
await conn.query(
  `INSERT INTO products (category_id, name, description, price, stock, low_stock_threshold, image_url, created_at) VALUES ?`,
  [products.map(([c, n, d, p, st, th], i) => [c, n, d, p, st, th, img('sf' + i), new Date(Date.now() - 190 * DAY)])]
);
await conn.query(`INSERT INTO inventory_logs (product_id, change_qty, reason, created_by, created_at) VALUES ?`,
  [products.map((p, i) => [i + 1, p[4] + 20, 'Nhập hàng đầu kỳ', 3, new Date(Date.now() - 190 * DAY)])]);

// ===== Mã giảm giá =====
await conn.query(`INSERT INTO coupons (code, type, value, min_order, max_uses, used_count, expires_at, is_active) VALUES ?`, [[
  ['WELCOME10', 'percent', 10, 1000000, 0, 0, null, 1],
  ['GIAM500K', 'fixed', 500000, 10000000, 100, 0, '2027-12-31 23:59:59', 1],
  ['FREESHIP50', 'fixed', 50000, 300000, 0, 0, null, 1],
  ['SALE15', 'percent', 15, 5000000, 50, 0, '2027-06-30 23:59:59', 1],
  ['TET2026', 'percent', 20, 2000000, 200, 0, '2026-02-28 23:59:59', 1],
  ['VIP1TR', 'fixed', 1000000, 20000000, 20, 0, null, 0],
]]);
const activeCoupons = [['WELCOME10', 'percent', 10, 1000000], ['GIAM500K', 'fixed', 500000, 10000000],
  ['FREESHIP50', 'fixed', 50000, 300000], ['SALE15', 'percent', 15, 5000000]];

// ===== Đơn hàng =====
// Mỗi khách có "kiểu" mua sắm để phân khúc RFM ra nhiều nhóm khác nhau
const profiles = customers.map((_, i) => {
  if (i < 3 || i % 10 === 0) return { orders: 18 + rand(10), from: 0, to: HISTORY_DAYS };   // VIP
  if (i % 10 === 1 || i % 10 === 2) return { orders: 8 + rand(6), from: 0, to: HISTORY_DAYS }; // trung thành
  if (i % 10 === 3) return { orders: 1, from: 0, to: 12 };                                     // khách mới
  if (i % 10 === 4) return { orders: 6 + rand(4), from: 75, to: HISTORY_DAYS };                // có nguy cơ rời bỏ
  if (i % 10 === 5) return { orders: 1 + rand(2), from: 120, to: HISTORY_DAYS };               // đã rời bỏ
  return { orders: 2 + rand(5), from: 0, to: HISTORY_DAYS };                                   // tiềm năng
});
// Trọng số chọn sản phẩm thay đổi theo thời gian để dự báo thấy xu hướng tăng/giảm
const weightAt = (p, daysAgo) => Math.max(0.2, p[6] * (1 + p[7] * 0.9 * (1 - daysAgo / HISTORY_DAYS) - p[7] * 0.45));
const pickProduct = (daysAgo) => {
  const ws = products.map((p) => weightAt(p, daysAgo));
  let r = rnd() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; }
  return ws.length - 1;
};
const statusFor = (daysAgo) => {
  if (daysAgo > 7) return rnd() < 0.9 ? 'completed' : 'cancelled';
  return pick(['pending', 'pending', 'confirmed', 'shipping', 'completed', 'cancelled']);
};

const orders = [];
profiles.forEach((pf, ci) => {
  for (let k = 0; k < pf.orders; k++) {
    const daysAgo = pf.from + rand(pf.to - pf.from);
    orders.push({ ci, created: new Date(Date.now() - daysAgo * DAY - rand(DAY)), daysAgo });
  }
});
// Thêm đơn của khách vãng lai (không có tài khoản)
for (let k = 0; k < 120; k++) {
  const daysAgo = rand(HISTORY_DAYS);
  orders.push({ ci: null, created: new Date(Date.now() - daysAgo * DAY - rand(DAY)), daysAgo });
}
orders.sort((a, b) => a.created - b.created);

const couponUse = {};
const invLogs = [];
const completedPairs = [];
for (const [idx, o] of orders.entries()) {
  const items = [];
  const n = 1 + (rnd() < 0.45 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const pi = pickProduct(o.daysAgo);
    if (items.some((it) => it.pi === pi)) continue;
    const p = products[pi];
    items.push({ pi, qty: p[3] < 1000000 ? 1 + rand(3) : 1 });
  }
  const subtotal = items.reduce((sum, it) => sum + products[it.pi][3] * it.qty, 0);
  let discount = 0;
  let code = null;
  if (rnd() < 0.25) {
    const c = pick(activeCoupons);
    if (subtotal >= c[3]) {
      code = c[0];
      discount = c[1] === 'percent' ? Math.round((subtotal * c[2]) / 100) : c[2];
      couponUse[code] = (couponUse[code] || 0) + 1;
    }
  }
  const status = statusFor(o.daysAgo);
  const cust = o.ci === null
    ? [null, `${pick(ho)} ${pick(dem)} ${pick(ten)}`, '09' + String(10000000 + rand(89999999)), pick(cities)]
    : [firstCustomerId + o.ci, customers[o.ci][0], customers[o.ci][2], customers[o.ci][3]];
  const orderCode = `SF${String(100001 + idx)}`;
  const [r] = await conn.query(
    `INSERT INTO orders (code, user_id, customer_name, phone, address, subtotal, discount, total, coupon_code, payment_method, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orderCode, cust[0], cust[1], cust[2], `${1 + rand(300)} ${pick(streets)}, ${cust[3]}`, subtotal, discount,
      subtotal - discount, code, rnd() < 0.7 ? 'cod' : 'bank', status, o.created]
  );
  await conn.query(`INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ?`,
    [items.map((it) => [r.insertId, it.pi + 1, products[it.pi][1], products[it.pi][3], it.qty])]);
  for (const it of items) {
    invLogs.push([it.pi + 1, -it.qty, `Bán hàng - đơn ${orderCode}`, null, o.created]);
    if (status === 'cancelled') invLogs.push([it.pi + 1, it.qty, `Hoàn kho - hủy đơn ${orderCode}`, 2, new Date(o.created.getTime() + DAY)]);
    if (status === 'completed' && cust[0]) completedPairs.push([it.pi + 1, cust[0], o.created]);
  }
}
for (const [code, n] of Object.entries(couponUse)) {
  await conn.query('UPDATE coupons SET used_count = ? WHERE code = ?', [n, code]);
}
// Vài đợt nhập hàng bổ sung
for (let k = 0; k < 25; k++) {
  invLogs.push([1 + rand(products.length), 10 + rand(30), 'Nhập hàng từ nhà cung cấp', 3, new Date(Date.now() - rand(HISTORY_DAYS) * DAY)]);
}
for (let k = 0; k < invLogs.length; k += 500) {
  await conn.query(`INSERT INTO inventory_logs (product_id, change_qty, reason, created_by, created_at) VALUES ?`, [invLogs.slice(k, k + 500)]);
}

// ===== Đánh giá (chỉ từ khách đã nhận hàng) =====
const reviewTexts = {
  5: ['Sản phẩm tuyệt vời, rất đáng tiền!', 'Giao hàng nhanh, đóng gói cẩn thận.', 'Chính hãng, dùng rất mượt.', 'Shop tư vấn nhiệt tình, sẽ ủng hộ tiếp.'],
  4: ['Sản phẩm tốt, giá hơi cao một chút.', 'Dùng ổn, pin khá tốt.', 'Đẹp, nhưng giao hàng hơi chậm.'],
  3: ['Tạm được, đúng mô tả.', 'Chất lượng bình thường so với giá.'],
  2: ['Pin tụt nhanh hơn mong đợi.', 'Hộp bị móp khi nhận hàng.'],
  1: ['Sản phẩm lỗi, phải đổi trả.'],
};
const reviewed = new Set();
const reviews = [];
for (const [pid, uid, created] of completedPairs) {
  const key = `${pid}-${uid}`;
  if (reviewed.has(key) || rnd() > 0.35) continue;
  reviewed.add(key);
  const x = rnd();
  const rating = x < 0.5 ? 5 : x < 0.8 ? 4 : x < 0.9 ? 3 : x < 0.97 ? 2 : 1;
  reviews.push([pid, uid, rating, pick(reviewTexts[rating]), new Date(created.getTime() + (3 + rand(10)) * DAY)]);
}
await conn.query(`INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES ?`, [reviews]);

// ===== Lịch sử chatbot mẫu =====
await conn.query(`INSERT INTO chat_logs (user_id, question, answer, created_at) VALUES ?`, [[
  [firstCustomerId, 'Shop có giao hàng tới Hà Nội không?', 'Shop giao hàng toàn quốc trong 2-5 ngày, miễn phí với đơn từ 500.000đ.', new Date(Date.now() - 5 * DAY)],
  [null, 'Laptop nào dưới 20 triệu để học lập trình?', 'Bạn có thể tham khảo Dell Inspiron 15 3530 (15.990.000đ) hoặc Lenovo IdeaPad Slim 5 (17.490.000đ).', new Date(Date.now() - 3 * DAY)],
  [firstCustomerId + 1, 'Có mã giảm giá không shop?', 'Bạn có thể dùng mã WELCOME10 để giảm 10% cho đơn từ 1.000.000đ.', new Date(Date.now() - DAY)],
]]);

const [[stats]] = await conn.query(`SELECT (SELECT COUNT(*) FROM users) u, (SELECT COUNT(*) FROM products) p,
  (SELECT COUNT(*) FROM orders) o, (SELECT COUNT(*) FROM order_items) oi, (SELECT COUNT(*) FROM reviews) r,
  (SELECT COUNT(*) FROM inventory_logs) l`);
console.log('✔ Đã tạo CSDL và dữ liệu mẫu');
console.log(`  ${stats.u} người dùng, ${stats.p} sản phẩm, ${stats.o} đơn hàng (${stats.oi} dòng), ${stats.r} đánh giá, ${stats.l} nhật ký kho`);
console.log('  Admin: admin@salesflow.vn / admin123');
console.log('  Staff: staff@salesflow.vn / staff123');
console.log('  Khách: an@gmail.com / 123456 (mọi khách mẫu đều dùng mật khẩu 123456)');
await conn.end();

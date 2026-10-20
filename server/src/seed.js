// Tạo CSDL từ database/schema.sql và nạp dữ liệu mẫu
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

const hash = (p) => bcrypt.hashSync(p, 10);
await conn.query(
  `INSERT INTO users (name, email, password_hash, phone, address, role) VALUES ?`,
  [[
    ['Quản trị viên', 'admin@salesflow.vn', hash('admin123'), '0900000001', 'Thái Nguyên', 'admin'],
    ['Nhân viên bán hàng', 'staff@salesflow.vn', hash('staff123'), '0900000002', 'Thái Nguyên', 'staff'],
    ['Nguyễn Văn An', 'an@gmail.com', hash('123456'), '0911111111', 'Hà Nội', 'customer'],
    ['Trần Thị Bình', 'binh@gmail.com', hash('123456'), '0922222222', 'Hải Phòng', 'customer'],
    ['Lê Minh Châu', 'chau@gmail.com', hash('123456'), '0933333333', 'Đà Nẵng', 'customer'],
    ['Phạm Quốc Dũng', 'dung@gmail.com', hash('123456'), '0944444444', 'TP.HCM', 'customer'],
  ]]
);

await conn.query(`INSERT INTO categories (name, slug) VALUES ?`, [[
  ['Điện thoại', 'dien-thoai'], ['Laptop', 'laptop'], ['Phụ kiện', 'phu-kien'], ['Đồng hồ thông minh', 'dong-ho'],
]]);

const img = (seed) => `https://picsum.photos/seed/${seed}/400/300`;
const products = [
  [1, 'iPhone 15 128GB', 'Chip A16, camera 48MP, Dynamic Island.', 19990000, 25, img('ip15')],
  [1, 'Samsung Galaxy S24', 'Màn hình 6.2" Dynamic AMOLED, Galaxy AI.', 18490000, 18, img('s24')],
  [1, 'Xiaomi Redmi Note 13', 'Pin 5000mAh, sạc nhanh 33W.', 4890000, 40, img('rn13')],
  [2, 'MacBook Air M2 13"', 'Chip Apple M2, RAM 8GB, SSD 256GB.', 24990000, 10, img('mba')],
  [2, 'Dell Inspiron 15', 'Core i5 Gen 13, RAM 16GB, SSD 512GB.', 15990000, 12, img('dell')],
  [2, 'Asus TUF Gaming F15', 'Core i7, RTX 4050, màn 144Hz.', 22990000, 4, img('tuf')],
  [3, 'Tai nghe AirPods Pro 2', 'Chống ồn chủ động, USB-C.', 5990000, 30, img('airpods')],
  [3, 'Sạc dự phòng Anker 20000mAh', 'Sạc nhanh PD 22.5W.', 890000, 60, img('anker')],
  [3, 'Chuột Logitech MX Master 3S', 'Cảm biến 8K DPI, kết nối đa thiết bị.', 2290000, 3, img('mx3s')],
  [4, 'Apple Watch SE 2', 'Theo dõi sức khỏe, chống nước 50m.', 6290000, 15, img('aw')],
  [4, 'Xiaomi Smart Band 8', 'Pin 16 ngày, 150+ chế độ thể thao.', 890000, 50, img('band8')],
];
await conn.query(
  `INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES ?`,
  [products]
);

await conn.query(`INSERT INTO coupons (code, type, value, min_order, max_uses, expires_at) VALUES ?`, [[
  ['WELCOME10', 'percent', 10, 1000000, 0, null],
  ['GIAM500K', 'fixed', 500000, 10000000, 100, '2027-12-31 23:59:59'],
]]);

// Sinh đơn hàng ngẫu nhiên trong 90 ngày gần nhất để có dữ liệu cho dashboard & AI
const statuses = ['completed', 'completed', 'completed', 'shipping', 'confirmed', 'pending', 'cancelled'];
const customers = [[3, 'Nguyễn Văn An', '0911111111', 'Hà Nội'], [4, 'Trần Thị Bình', '0922222222', 'Hải Phòng'],
  [5, 'Lê Minh Châu', '0933333333', 'Đà Nẵng'], [6, 'Phạm Quốc Dũng', '0944444444', 'TP.HCM']];
const rand = (n) => Math.floor(Math.random() * n);
for (let i = 0; i < 120; i++) {
  const c = customers[i % 7 === 0 ? 3 : rand(3)];
  const daysAgo = rand(90);
  const created = new Date(Date.now() - daysAgo * 86400000 - rand(86400000));
  const items = [];
  const n = 1 + rand(3);
  for (let k = 0; k < n; k++) {
    const pid = 1 + rand(products.length);
    if (items.some((it) => it[0] === pid)) continue;
    items.push([pid, products[pid - 1][1], products[pid - 1][3], 1 + rand(2)]);
  }
  const subtotal = items.reduce((s, it) => s + it[2] * it[3], 0);
  const [r] = await conn.query(
    `INSERT INTO orders (code, user_id, customer_name, phone, address, subtotal, total, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [`SF${String(100000 + i)}`, c[0], c[1], c[2], c[3], subtotal, subtotal, statuses[rand(statuses.length)], created]
  );
  await conn.query(`INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ?`,
    [items.map((it) => [r.insertId, ...it])]);
}

await conn.query(`INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ?`, [[
  [1, 3, 5, 'Máy đẹp, giao hàng nhanh.'], [1, 4, 4, 'Pin ổn, giá hơi cao.'],
  [7, 5, 5, 'Chống ồn rất tốt!'], [4, 6, 5, 'Mỏng nhẹ, pin trâu.'],
]]);

console.log('✔ Đã tạo CSDL và dữ liệu mẫu');
console.log('  Admin: admin@salesflow.vn / admin123');
console.log('  Staff: staff@salesflow.vn / staff123');
console.log('  Khách: an@gmail.com / 123456');
await conn.end();

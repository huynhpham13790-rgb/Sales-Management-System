// Tải ảnh sản phẩm thật (giấy phép tự do) từ Wikimedia Commons về client/public/products
// và tạo file ghi nguồn CREDITS.md. Chỉ cần chạy lại khi muốn đổi ảnh: node scripts/download-images.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../../client/public/products');

// Thứ tự trùng với danh sách sản phẩm trong src/seed.js (id 1..38)
// Sản phẩm đánh dấu "gần đúng" dùng ảnh mẫu cùng hãng/cùng dòng vì Commons chưa có ảnh đúng model.
const IMAGES = [
  ['iPhone 15 128GB', 'Back of iPhone 15.jpg'],
  ['iPhone 15 Pro Max 256GB', 'Apple iPhone 15 Pro.jpg'],
  ['Samsung Galaxy S24', 'Samsung Galaxy S24 (webtekno) 008.png'],
  ['Samsung Galaxy A55 5G', 'Samsung Galaxy A55 5G 2024.jpg'],
  ['Xiaomi Redmi Note 13', 'Redmi Note 14 Pro (2).jpg', 'gần đúng'],
  ['OPPO Reno11 F 5G', 'OPPO Reno 6 Pro+ back.jpg', 'gần đúng'],
  ['Google Pixel 8a', 'Pixel 8a.jpg'],
  ['MacBook Air M2 13"', 'M2 Macbook Air Starlight model.jpg'],
  ['MacBook Pro M3 14"', 'M3 Macbook Pro 14 inch Space Grey model (cropped).jpg'],
  ['Dell Inspiron 15 3530', 'Dell Inspiron 15 7000 (7559) (1).jpg', 'gần đúng'],
  ['Asus TUF Gaming F15', 'ASUS TUF Gaming 5 Pro Laptop.jpg', 'gần đúng'],
  ['Lenovo IdeaPad Slim 5', 'Lenovo ideapad corner view (26660714555).jpg', 'gần đúng'],
  ['HP Victus 16', 'HP Victus laptop.jpg'],
  ['Acer Aspire 7', 'Acer Aspire 4752 Laptop - 01.jpg', 'gần đúng'],
  ['iPad Gen 10 Wi-Fi 64GB', 'About iPad (10th generation).jpg'],
  ['iPad Air M2 11"', 'About iPad Air 11-inch (M2).jpg'],
  ['Samsung Galaxy Tab S9 FE', 'Samsung Galaxy Tab S9.png', 'gần đúng'],
  ['Xiaomi Pad 6', 'Xiaomi Pad 6 display.jpg'],
  ['Sạc dự phòng Anker 20000mAh', 'Anker power bank and cable.jpg', 'gần đúng'],
  ['Chuột Logitech MX Master 3S', 'Logitech MX Master 3S HS13.jpg'],
  ['Bàn phím cơ Keychron K2', 'Keychron K1 v2 TKL side view.jpg', 'gần đúng'],
  ['Cáp sạc USB-C Baseus 100W', 'USB-C cable connected to a powerbank.jpg', 'gần đúng'],
  ['Củ sạc Apple 20W USB-C', 'Apple USB-C (USB Type C) 87W Power Adapter for MacBook Pro (48979218053).jpg', 'gần đúng'],
  ['Ốp lưng MagSafe iPhone 15', 'IPhone XR MagSafe case.jpg', 'gần đúng'],
  ['Balo laptop Xiaomi', 'Laptop backpacks from Mr. DIY at Ayala Center Cebu (2025-02-24).jpg', 'gần đúng'],
  ['Webcam Logitech C920', 'Logitech Brio 301 webcam HS1.jpg', 'gần đúng'],
  ['Apple Watch SE 2 GPS 40mm', 'Apple Watch SE 2 (GPS + Cellular, 40mm, Midnight) with Anchor Blue Sport Loop.jpg'],
  ['Apple Watch Series 9 45mm', 'Apple Watch Series 8 Midnight Aluminium Case.jpg', 'gần đúng'],
  ['Samsung Galaxy Watch6', 'Samsung Galaxy Watch 6.jpg'],
  ['Xiaomi Smart Band 8', 'Xiaomi Mi Band 8.jpg'],
  ['Huawei Watch Fit 3', 'Huawei Watch Fit 4.jpg', 'gần đúng'],
  ['Tai nghe AirPods Pro 2 USB-C', 'AirPods Pro (2nd generation).jpg'],
  ['Tai nghe AirPods 3', 'AirPods 3.jpg'],
  ['Sony WH-1000XM5', 'Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.jpg', 'gần đúng'],
  ['JBL Tune 520BT', 'JBL LIVE 650 BTNC (Over-Ear Noise Cancelling Headphone). (51127342181).jpg', 'gần đúng'],
  ['Loa JBL Flip 6', 'JBL Flip 4.jpg', 'gần đúng'],
  ['Loa Marshall Emberton II', 'Marshall Speaker.jpg', 'gần đúng'],
  ['Samsung Galaxy Buds2 Pro', 'Samsung Galaxy Buds2 Pro (Graphite).jpg'],
];

const UA = { 'User-Agent': 'SalesFlowStudentProject/1.0 (educational)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function getJson(url) {
  for (let t = 0; t < 6; t++) {
    const txt = await fetch(url, { headers: UA }).then((r) => r.text());
    try { return JSON.parse(txt); } catch { await sleep(15000); }
  }
  throw new Error('Wikimedia API từ chối quá nhiều lần');
}

fs.mkdirSync(OUT, { recursive: true });
const credits = ['# Nguồn ảnh sản phẩm', '',
  'Ảnh lấy từ Wikimedia Commons theo giấy phép tự do, đã thu nhỏ còn 600px.',
  'Mục "gần đúng": dùng ảnh mẫu cùng hãng/dòng vì chưa có ảnh tự do đúng model – có thể thay bằng ảnh thật của cửa hàng.', '',
  '| ID | Sản phẩm | Ảnh gốc | Tác giả | Giấy phép | Ghi chú |', '|---|---|---|---|---|---|'];

for (const [i, [name, file, note]] of IMAGES.entries()) {
  const id = i + 1;
  const api = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', titles: `File:${file}`, prop: 'imageinfo',
    iiprop: 'url|extmetadata', iiurlwidth: '600',
  });
  const j = await getJson(api);
  const info = Object.values(j.query.pages)[0].imageinfo?.[0];
  if (!info) { console.log(`✘ ${id} ${name}: không tìm thấy ${file}`); continue; }
  let ok = false;
  for (let t = 0; t < 6 && !ok; t++) {
    const res = await fetch(info.thumburl, { headers: UA });
    if (res.ok) {
      fs.writeFileSync(path.join(OUT, `${id}.jpg`), Buffer.from(await res.arrayBuffer()));
      ok = true;
    } else await sleep(10000);
  }
  const m = info.extmetadata || {};
  credits.push(`| ${id} | ${name} | [${file}](${info.descriptionurl}) | ${strip(m.Artist?.value) || '—'} | ${m.LicenseShortName?.value || '—'} | ${note || ''} |`);
  console.log(`${ok ? '✔' : '✘'} ${id} ${name}`);
  await sleep(3000);
}
fs.writeFileSync(path.join(OUT, 'CREDITS.md'), credits.join('\n') + '\n');

# SalesFlow AI – Hệ thống quản lý bán hàng tích hợp AI

Đề tài thực tập tốt nghiệp – Hoàng Hải Đăng (DTC235200186, CNTT-K22H) – Công ty Cổ phần Công nghệ TFL.

**Công nghệ:** Node.js · Express · React (Vite) · MySQL · Groq API (gpt-oss-120b)

## Chức năng chính

| Phía khách hàng (client) | Phía quản trị (admin) |
|---|---|
| Xem, tìm kiếm, lọc, sắp xếp sản phẩm | Dashboard doanh thu, biểu đồ, top sản phẩm |
| Chi tiết sản phẩm, gợi ý "thường mua cùng" | Quản lý sản phẩm, danh mục (AI viết mô tả) |
| Giỏ hàng, đặt hàng, mã giảm giá | Quản lý đơn hàng theo luồng trạng thái, xuất CSV |
| Đăng ký / đăng nhập / hồ sơ | Quản lý kho: nhập/xuất, cảnh báo sắp hết, lịch sử |
| Theo dõi & hủy đơn, tra cứu đơn không cần tài khoản | Quản lý mã giảm giá |
| Đánh giá sản phẩm + AI tóm tắt đánh giá | Quản lý người dùng, phân quyền admin/staff, khóa tài khoản |
| **Chatbot AI tư vấn bán hàng** | **AI dự báo nhu cầu**, **AI phân khúc khách hàng (RFM)**, lịch sử chatbot |

## Cài đặt & chạy

> 📘 **Người mới / máy chưa có gì:** xem [HUONG-DAN-CAI-DAT.md](HUONG-DAN-CAI-DAT.md) — có sẵn `setup.bat`, `start.bat`, `test.bat` chạy bằng nhấp đúp.

Yêu cầu: Node.js ≥ 18, MySQL 8 (hoặc XAMPP/MariaDB).

```bash
# 1. Backend
cd server
cp .env.example .env        # sửa DB_USER/DB_PASSWORD, thêm GROQ_API_KEY nếu có
npm install
npm run seed                # tạo CSDL salesflow + dữ liệu mẫu
npm run dev                 # http://localhost:5000

# 2. Frontend (terminal khác)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Tài khoản mẫu:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị | admin@salesflow.vn | admin123 |
| Nhân viên | staff@salesflow.vn | staff123 |
| Khách hàng | an@gmail.com | 123456 |

> Không có `GROQ_API_KEY` hệ thống vẫn chạy: dự báo và phân khúc dùng thuật toán cục bộ, chatbot dùng chế độ trả lời theo từ khóa. Lấy key miễn phí tại https://console.groq.com.

## Cấu trúc thư mục

```
├── client/               # React + Vite
│   └── src/
│       ├── components/   # Header, ProductCard, ChatWidget, BarChart, OrderCard
│       ├── context/      # AuthContext, CartContext
│       └── pages/        # trang khách hàng + pages/admin
├── server/               # Express API
│   └── src/
│       ├── routes/       # auth, products, categories, orders, coupons, users, inventory, dashboard, ai
│       ├── services/     # groq.js (gọi LLM), analytics.js (dự báo, RFM)
│       └── middleware/   # JWT + phân quyền
├── database/schema.sql   # lược đồ CSDL
└── docs/                 # tài liệu theo tuần
```

## Ảnh sản phẩm

Ảnh thật lấy từ Wikimedia Commons (giấy phép tự do), lưu tại `client/public/products/<id>.jpg`; nguồn và tác giả từng ảnh ghi trong [`client/public/products/CREDITS.md`](client/public/products/CREDITS.md). Một số sản phẩm dùng ảnh mẫu cùng hãng/dòng (đánh dấu "gần đúng") – cửa hàng có thể thay bằng ảnh tự chụp qua trang quản trị (ô "Ảnh (URL)"). Tải lại ảnh: `node server/scripts/download-images.js`.

## Tài liệu

- [Tuần 2 – Công nghệ sử dụng](docs/tuan-2-cong-nghe.md)
- [Tuần 3 – Tích hợp AI (Groq/Llama)](docs/tuan-3-tich-hop-ai.md)
- [Tuần 5 – Kế hoạch & thiết kế hệ thống](docs/tuan-5-ke-hoach-thiet-ke.md)
- [Tuần 6 – Xây dựng giao diện client & admin](docs/tuan-6-giao-dien.md)
- [Tuần 7 – Xây dựng chức năng](docs/tuan-7-chuc-nang.md)
- [Chức năng mở rộng](docs/chuc-nang-mo-rong.md)
- [Tài liệu API](docs/api.md)

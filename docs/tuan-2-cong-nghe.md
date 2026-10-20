# Tuần 2 – Tìm hiểu các công nghệ sử dụng trong dự án

## 1. Tổng quan kiến trúc

SalesFlow AI theo mô hình **client – server** tách biệt, giao tiếp qua **REST API (JSON)**:

```
[React SPA] ──HTTP/JSON──> [Express API] ──SQL──> [MySQL]
                                 │
                                 └──HTTPS──> [Groq API – Llama 3.3]
```

## 2. Node.js

- Môi trường chạy JavaScript phía server, dựa trên engine V8.
- Mô hình **event loop, I/O bất đồng bộ (non-blocking)** → xử lý nhiều request đồng thời với ít tài nguyên, phù hợp cho API.
- Quản lý thư viện bằng **npm**; dự án dùng ES Modules (`"type": "module"`).
- Từ Node 18 có sẵn `fetch` → gọi Groq API không cần thư viện ngoài.

## 3. Express

Framework web tối giản cho Node.js.

| Khái niệm | Áp dụng trong dự án |
|---|---|
| Router | Mỗi nhóm nghiệp vụ là một router: `routes/products.js`, `routes/orders.js`... |
| Middleware | `cors`, `express.json`, `requireAuth`, `requireStaff` (kiểm tra JWT & vai trò) |
| Error handler | Middleware bắt lỗi tập trung ở `index.js`; hàm `wrap()` chuyển lỗi async tới đó |

Ví dụ:

```js
r.patch('/:id/status', requireStaff, wrap(async (req, res) => { ... }));
```

## 4. React

- Thư viện xây dựng giao diện theo **component**, cập nhật DOM hiệu quả qua Virtual DOM.
- **Hooks**: `useState` (trạng thái), `useEffect` (gọi API), `useContext` (chia sẻ trạng thái toàn cục).
- **Context API**: `AuthContext` (người dùng đăng nhập), `CartContext` (giỏ hàng, lưu `localStorage`).
- **React Router v6**: định tuyến SPA, route lồng nhau cho layout client/admin, route bảo vệ `RequireAuth`.
- **Vite**: công cụ build/dev server nhanh, proxy `/api` sang backend cổng 5000.

## 5. MySQL

- Hệ quản trị CSDL quan hệ; dùng thư viện `mysql2/promise` với **connection pool**.
- **Prepared statement** (`?`) chống SQL Injection.
- **Transaction** khi tạo/hủy đơn: trừ/hoàn tồn kho, tăng lượt dùng mã giảm giá đảm bảo tính toàn vẹn; `SELECT ... FOR UPDATE` tránh bán vượt tồn kho khi nhiều người đặt cùng lúc.
- Khóa ngoại `ON DELETE SET NULL / CASCADE` giữ lịch sử đơn hàng khi xóa sản phẩm.

## 6. Bảo mật & xác thực

- **bcryptjs**: băm mật khẩu (salt 10 vòng).
- **JWT (jsonwebtoken)**: token hết hạn 7 ngày, gửi qua header `Authorization: Bearer <token>`.
- Phân quyền 3 vai trò: `admin`, `staff`, `customer`.

## 7. Công cụ

VS Code, Git/GitHub, Postman (kiểm thử API), MySQL Workbench/XAMPP, Chrome DevTools.

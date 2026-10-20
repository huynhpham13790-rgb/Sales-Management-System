# Tuần 5 – Lên kế hoạch xây dựng hệ thống SalesFlow AI

## 1. Mục tiêu

Xây dựng website bán hàng giúp cửa hàng vừa và nhỏ: bán hàng online, quản lý đơn/kho/khách hàng, và dùng AI để dự báo nhu cầu, phân khúc khách hàng, tư vấn tự động.

## 2. Tác nhân & phân quyền

| Tác nhân | Quyền |
|---|---|
| Khách vãng lai | Xem/tìm sản phẩm, đặt hàng, tra cứu đơn, chat AI |
| Khách hàng (customer) | + Lịch sử đơn, hủy đơn chờ xác nhận, đánh giá, hồ sơ |
| Nhân viên (staff) | Quản lý sản phẩm, danh mục, đơn, kho, mã giảm giá, xem báo cáo & AI |
| Quản trị (admin) | + Quản lý tài khoản, phân quyền, khóa tài khoản |

## 3. Yêu cầu chức năng

1. Xác thực: đăng ký, đăng nhập (JWT), cập nhật hồ sơ, đổi mật khẩu.
2. Sản phẩm & danh mục: CRUD, tìm kiếm, lọc giá/danh mục, sắp xếp, phân trang.
3. Giỏ hàng & đặt hàng: kiểm tra tồn kho, mã giảm giá, COD/chuyển khoản.
4. Đơn hàng: luồng trạng thái `pending → confirmed → shipping → completed`, có thể `cancelled` (hoàn kho).
5. Kho: nhập/xuất thủ công, nhật ký kho, cảnh báo dưới ngưỡng.
6. Báo cáo: doanh thu theo ngày, theo danh mục, top sản phẩm, xuất CSV.
7. AI: dự báo nhu cầu, phân khúc RFM, chatbot, viết mô tả, tóm tắt đánh giá.

## 4. Yêu cầu phi chức năng

- Mật khẩu băm bcrypt; truy vấn tham số hóa; phân quyền ở server.
- Giao diện responsive (desktop/mobile).
- Hệ thống hoạt động khi dịch vụ AI không khả dụng.

## 5. Thiết kế CSDL

```
users (id, name, email, password_hash, phone, address, role, is_active, created_at)
categories (id, name, slug)
products (id, category_id→categories, name, description, price, stock, low_stock_threshold, image_url, is_active)
orders (id, code, user_id→users, customer_name, phone, address, subtotal, discount, total,
        coupon_code, payment_method, status, note, created_at)
order_items (id, order_id→orders, product_id→products, product_name, price, quantity)
coupons (id, code, type, value, min_order, max_uses, used_count, expires_at, is_active)
reviews (id, product_id→products, user_id→users, rating, comment)   UNIQUE(product_id, user_id)
inventory_logs (id, product_id→products, change_qty, reason, created_by, created_at)
chat_logs (id, user_id, question, answer, created_at)
```

Quan hệ chính: `categories 1–n products`, `users 1–n orders`, `orders 1–n order_items`, `products 1–n reviews`.

> `order_items` lưu lại `product_name` và `price` tại thời điểm mua để lịch sử đơn không đổi khi sản phẩm bị sửa giá/xóa.

Chi tiết: [`database/schema.sql`](../database/schema.sql).

## 6. Use case chính – Đặt hàng

1. Khách thêm sản phẩm vào giỏ (lưu localStorage).
2. Nhập thông tin giao hàng, (tùy chọn) áp mã giảm giá → `POST /coupons/validate`.
3. `POST /orders`: trong một transaction – khóa dòng sản phẩm, kiểm tra tồn, tính tiền, trừ kho, ghi nhật ký kho, tăng lượt dùng mã.
4. Trả về mã đơn để tra cứu.

## 7. Kế hoạch triển khai

| Giai đoạn | Nội dung |
|---|---|
| Tuần 5 | Phân tích yêu cầu, thiết kế CSDL, API, khung dự án |
| Tuần 6 | Giao diện client (trang chủ, chi tiết, giỏ hàng, thanh toán) và admin (layout, bảng, form) |
| Tuần 7 | Kết nối API, nghiệp vụ đơn hàng/kho/mã giảm giá, tích hợp AI, kiểm thử |

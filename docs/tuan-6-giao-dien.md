# Tuần 6 – Xây dựng giao diện client và admin

## 1. Nguyên tắc

- Không dùng UI framework nặng; CSS thuần với biến màu (`:root`) trong `client/src/styles.css`.
- Component tái sử dụng: `ProductCard`, `OrderCard`/`StatusBadge`, `BarChart` (SVG tự vẽ), `ChatWidget`.
- Responsive: breakpoint 800px – sidebar lọc và menu admin chuyển thành dạng xếp chồng.

## 2. Giao diện khách hàng (`ClientLayout`)

| Trang | Đường dẫn | Thành phần |
|---|---|---|
| Trang chủ | `/` | Banner, bộ lọc (tìm kiếm, danh mục, khoảng giá, sắp xếp), lưới sản phẩm, phân trang |
| Chi tiết | `/product/:id` | Ảnh, giá, tồn kho, chọn số lượng, “thường mua cùng”, đánh giá + tóm tắt AI |
| Giỏ hàng | `/cart` | Bảng sản phẩm, sửa số lượng, xóa, tạm tính |
| Thanh toán | `/checkout` | Form giao hàng, phương thức thanh toán, ô mã giảm giá, tóm tắt đơn |
| Đăng nhập/Đăng ký | `/login`, `/register` | Form |
| Đơn của tôi | `/orders` | Thẻ đơn có thanh tiến trình trạng thái, nút hủy |
| Tra cứu đơn | `/track` | Nhập mã đơn + SĐT |
| Hồ sơ | `/profile` | Cập nhật thông tin, đổi mật khẩu |
| Chatbot | nổi góc phải | Hộp chat, gợi ý sản phẩm có link |

## 3. Giao diện quản trị (`AdminLayout`)

Sidebar tối màu cố định bên trái, vùng nội dung bên phải.

| Trang | Đường dẫn |
|---|---|
| Tổng quan (thẻ số liệu, biểu đồ doanh thu, top SP, doanh thu theo danh mục) | `/admin` |
| Đơn hàng (lọc, mở chi tiết, nút chuyển trạng thái, xuất CSV) | `/admin/orders` |
| Sản phẩm (bảng + form thêm/sửa, nút “Viết mô tả bằng AI”) | `/admin/products` |
| Danh mục | `/admin/categories` |
| Kho hàng (form nhập/xuất, cảnh báo, lịch sử) | `/admin/inventory` |
| Mã giảm giá | `/admin/coupons` |
| Người dùng (lọc vai trò, tạo nhân viên, khóa/mở) | `/admin/customers` |
| Dự báo nhu cầu (sparkline 9 tuần, đề xuất nhập) | `/admin/ai/forecast` |
| Phân khúc khách hàng (thẻ phân khúc, bảng RFM) | `/admin/ai/segments` |
| Lịch sử chatbot | `/admin/ai/chat-logs` |

## 4. Định tuyến & bảo vệ route

```jsx
<Route path="admin" element={<RequireAuth staff><AdminLayout /></RequireAuth>}>
```

`RequireAuth` chuyển hướng về `/login` nếu chưa đăng nhập, về `/` nếu không phải staff/admin. Server vẫn kiểm tra quyền độc lập.

## 5. Quản lý trạng thái

- `AuthContext`: lưu user, token (localStorage), hàm `login/register/logout`.
- `CartContext`: giỏ hàng lưu localStorage, giới hạn số lượng ≤ tồn kho.
- `api.js`: wrapper `fetch` tự gắn JWT, chuẩn hóa lỗi; hàm `vnd()` định dạng tiền Việt.

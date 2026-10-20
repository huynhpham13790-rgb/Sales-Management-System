# Tuần 7 – Xây dựng chức năng cho client và admin

## 1. Xác thực & phân quyền
- `POST /api/auth/register|login` trả JWT; `GET/PUT /api/auth/me` xem/sửa hồ sơ.
- Middleware `requireAuth`, `requireStaff`, `requireAdmin`; tài khoản bị khóa không đăng nhập được.

## 2. Sản phẩm
- Tìm kiếm theo tên/mô tả, lọc danh mục & khoảng giá, sắp xếp (mới, bán chạy, đánh giá, giá), phân trang.
- Trả kèm số lượng đã bán, điểm đánh giá trung bình (subquery).
- Xóa sản phẩm đã có đơn → chỉ **ẩn** (`is_active = 0`) để giữ lịch sử.

## 3. Đặt hàng (transaction)
```
BEGIN
  SELECT ... FROM products WHERE id = ? FOR UPDATE   -- khóa dòng, kiểm tra tồn
  evaluateCoupon(...)                                -- kiểm tra hạn, lượt, đơn tối thiểu
  INSERT orders; INSERT order_items
  UPDATE products SET stock = stock - qty
  INSERT inventory_logs (-qty, 'Bán hàng - đơn SF...')
COMMIT   (lỗi bất kỳ → ROLLBACK)
```
- Validate SĐT (10 số, bắt đầu 0), số lượng nguyên dương.

## 4. Quản lý đơn hàng
- Luồng trạng thái kiểm tra ở server (`TRANSITIONS`), không cho nhảy bước/quay lui.
- Hủy đơn (admin hoặc khách khi đơn còn `pending`) → hoàn kho + ghi nhật ký trong transaction.
- Lọc theo trạng thái, từ khóa, khoảng ngày; xuất CSV có BOM UTF-8 để Excel hiển thị đúng tiếng Việt.

## 5. Kho hàng
- Nhập (+) / xuất (−) thủ công kèm lý do, không cho tồn âm.
- Danh sách sản phẩm `stock <= low_stock_threshold`; dashboard hiển thị số cảnh báo.

## 6. Dashboard
- Doanh thu (đơn hoàn thành), số đơn, đơn chờ, đơn hủy, số khách, sắp hết hàng theo 7/30/90 ngày.
- Biểu đồ doanh thu theo ngày, top 5 sản phẩm, doanh thu theo danh mục.

## 7. AI
- Dự báo nhu cầu, phân khúc RFM, chatbot, viết mô tả, tóm tắt đánh giá – chi tiết ở [tuần 3](tuan-3-tich-hop-ai.md).

## 8. Kiểm thử (thủ công)

| Kịch bản | Kết quả mong đợi |
|---|---|
| Đặt số lượng > tồn kho | Báo “chỉ còn N sản phẩm”, không tạo đơn |
| Mã giảm giá hết hạn / chưa đủ đơn tối thiểu | Báo lỗi tương ứng |
| Hủy đơn đang giao | Tồn kho được cộng lại, có dòng “Hoàn kho” trong lịch sử |
| Chuyển `completed → pending` | Bị từ chối |
| Khách chưa mua sản phẩm gửi đánh giá | 403 “cần mua và nhận sản phẩm” |
| Customer gọi API admin | 403 |
| Không có GROQ_API_KEY | Chatbot/dự báo vẫn hoạt động ở chế độ dự phòng |

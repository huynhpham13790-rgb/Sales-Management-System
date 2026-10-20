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

Kiểm thử tự động: `npm run test-api` (29 kịch bản, gồm cả AI).

## 9. Lỗi phát hiện khi kiểm thử giao diện (20/10/2026) và cách sửa

| # | Mức độ | Lỗi | Cách sửa |
|---|---|---|---|
| 1 | Nghiêm trọng | Gửi tin nhắn chatbot làm **trắng toàn trang** (Chrome mới cho `scrollIntoView` trả về Promise, React coi là hàm cleanup) | Bọc thân `useEffect` trong `{}` (`ChatWidget.jsx`) |
| 2 | Trung bình | Chatbot trả lời câu hỏi nối tiếp ("cái rẻ nhất trong đó") sai, gợi ý sản phẩm lạc đề, trả lời bằng bảng markdown | Tìm sản phẩm theo cả câu hỏi trước, lọc từ dừng, chấm điểm; cấm bảng/markdown; chuẩn hóa ký tự gạch nối đặc biệt |
| 3 | Trung bình | Sửa mã giảm giá làm **lùi hạn 1 ngày** mỗi lần lưu (lệch múi giờ); mã hết hạn từ 0h thay vì cuối ngày | Trả `expires_date` dạng chuỗi, lưu hạn `23:59:59` |
| 4 | Trung bình | Trùng tên danh mục/mã giảm giá chỉ báo "Lỗi máy chủ" | Bắt `ER_DUP_ENTRY` → 409 "Dữ liệu đã tồn tại" |
| 5 | Nhỏ | Sản phẩm đã ẩn vẫn xem được qua link trực tiếp | API trả 404 cho khách, chỉ nhân viên xem được |
| 6 | Nhỏ | Đổi mật khẩu quá ngắn nhưng tên/SĐT vẫn bị lưu dở | Kiểm tra mật khẩu trước khi cập nhật |
| 7 | Nhỏ | Ô số lượng không xóa trắng được (gõ "5" thành "15") | Component `QtyInput` cho phép nhập tạm, chốt khi rời ô |
| 8 | Nhỏ | Nhãn form không gắn với ô nhập (bấm nhãn không focus, trình đọc màn hình không đọc được) | Bọc `input` trong `label` |
| 9 | Nhỏ | Trang Kho: ô chọn sản phẩm không cập nhật số tồn sau khi nhập kho | Tải lại danh sách sản phẩm sau mỗi lần điều chỉnh |
| 10 | Nhỏ | Nhận định AI còn ký tự `*nghiêng*`; chuyển trang sản phẩm không cuộn lên đầu | Lọc markdown; cuộn lên đầu khi đổi trang |

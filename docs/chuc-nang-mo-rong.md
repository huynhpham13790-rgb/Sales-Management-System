# Chức năng mở rộng (ngoài đề cương)

| # | Chức năng | Mô tả | Vị trí mã |
|---|---|---|---|
| 1 | Mã giảm giá | Giảm % hoặc số tiền cố định, đơn tối thiểu, giới hạn lượt, hạn dùng; khóa dòng khi đặt hàng để không vượt lượt | `routes/coupons.js`, `admin/Coupons.jsx`, `Checkout.jsx` |
| 2 | Quản lý kho & nhật ký kho | Nhập/xuất thủ công, tự ghi log khi bán/hủy đơn, cảnh báo sắp hết hàng | `routes/inventory.js`, `admin/Inventory.jsx` |
| 3 | Đánh giá sản phẩm | Chỉ khách đã nhận hàng được đánh giá, mỗi người 1 đánh giá/sản phẩm (sửa được) | `routes/products.js` |
| 4 | AI tóm tắt đánh giá | Llama tóm tắt ưu/nhược điểm từ các đánh giá | `routes/ai.js` |
| 5 | AI viết mô tả sản phẩm | Admin nhập từ khóa, AI sinh đoạn mô tả bán hàng | `routes/ai.js`, `admin/Products.jsx` |
| 6 | Gợi ý “thường được mua cùng” | Phân tích đồng xuất hiện trong đơn hàng (market basket), dự phòng theo cùng danh mục | `routes/products.js` |
| 7 | Tra cứu đơn không cần tài khoản | Nhập mã đơn + SĐT | `pages/TrackOrder.jsx` |
| 8 | Khách tự hủy đơn | Khi đơn còn chờ xác nhận, hoàn kho tự động | `routes/orders.js` |
| 9 | Xuất báo cáo CSV | Danh sách đơn hàng mở được bằng Excel | `GET /api/orders/export/csv` |
| 10 | Quản lý tài khoản & phân quyền | Tạo nhân viên, đổi vai trò, khóa/mở khóa | `routes/users.js`, `admin/Customers.jsx` |
| 11 | Lịch sử chatbot | Admin xem khách hỏi gì để nắm nhu cầu | `admin/ChatLogs.jsx` |
| 12 | Chế độ AI dự phòng | Toàn bộ tính năng AI vẫn chạy khi không có API key / Groq lỗi | `services/groq.js` |

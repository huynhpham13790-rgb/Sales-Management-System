# Tài liệu API

Base URL: `http://localhost:5000/api`. Header xác thực: `Authorization: Bearer <token>`.
Quyền: 🌐 công khai · 👤 đăng nhập · 🛠 staff/admin · 👑 admin.

## Auth
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | /auth/register | 🌐 | `{name, email, password, phone?, address?}` → `{token, user}` |
| POST | /auth/login | 🌐 | `{email, password}` → `{token, user}` |
| GET | /auth/me | 👤 | Thông tin tài khoản |
| PUT | /auth/me | 👤 | `{name, phone, address, password?}` |

## Danh mục & sản phẩm
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | /categories | 🌐 | Danh sách + số sản phẩm |
| POST/PUT/DELETE | /categories[/:id] | 🛠 | `{name}` |
| GET | /products | 🌐 | Query: `q, category, min, max, sort (newest/price_asc/price_desc/best_selling/rating), page, limit, all` |
| GET | /products/:id | 🌐 | Chi tiết + `reviews` + `related` |
| POST/PUT | /products[/:id] | 🛠 | `{name, category_id, price, stock, low_stock_threshold, image_url, description, is_active}` |
| DELETE | /products/:id | 🛠 | Xóa hoặc ẩn nếu đã có đơn |
| POST | /products/:id/reviews | 👤 | `{rating 1-5, comment}` |

## Đơn hàng
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | /orders | 🌐 | `{customer_name, phone, address, items:[{product_id, quantity}], coupon_code?, payment_method, note?}` |
| GET | /orders/track?code=&phone= | 🌐 | Tra cứu |
| GET | /orders/mine | 👤 | Đơn của tôi |
| POST | /orders/:id/cancel | 👤 | Hủy đơn pending |
| GET | /orders | 🛠 | Query: `status, q, from, to` |
| PATCH | /orders/:id/status | 🛠 | `{status}` |
| GET | /orders/export/csv | 🛠 | File CSV |

## Mã giảm giá
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | /coupons/validate | 🌐 | `{code, subtotal}` → `{discount}` |
| GET/POST/PUT/DELETE | /coupons[/:id] | 🛠 | CRUD |

## Kho, người dùng, dashboard
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | /inventory/low-stock | 🛠 | Sản phẩm dưới ngưỡng |
| GET | /inventory/logs | 🛠 | Nhật ký kho |
| POST | /inventory/adjust | 🛠 | `{product_id, change_qty, reason}` |
| GET | /users?role= | 🛠 | Danh sách + thống kê mua |
| POST | /users | 👑 | Tạo tài khoản nhân viên |
| PATCH | /users/:id | 👑 | `{is_active?, role?}` |
| GET | /dashboard/summary?days= | 🛠 | Số liệu tổng quan |

## AI
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | /ai/status | 🌐 | Groq đã cấu hình chưa |
| POST | /ai/chat | 🌐 | `{message, history}` → `{answer, products}` |
| GET | /ai/review-summary/:productId | 🌐 | Tóm tắt đánh giá |
| GET | /ai/forecast?horizon=&insight=1 | 🛠 | Dự báo nhu cầu (+ nhận định LLM) |
| GET | /ai/segments?insight=1 | 🛠 | Phân khúc RFM (+ đề xuất LLM) |
| POST | /ai/describe | 🛠 | `{name, category, keywords}` → mô tả |
| GET | /ai/chat-logs | 🛠 | Lịch sử chatbot |

# Tuần 3 – Tích hợp AI dự báo & phân tích (Groq/Llama)

## 1. Groq & Llama

- **Groq** cung cấp API suy luận LLM tốc độ rất cao (chip LPU), định dạng **tương thích OpenAI Chat Completions**.
- Mô hình dùng: `llama-3.3-70b-versatile` (Meta Llama, mã nguồn mở) – hỗ trợ tiếng Việt tốt.
- Endpoint: `POST https://api.groq.com/openai/v1/chat/completions`, xác thực bằng `GROQ_API_KEY`.

Mã gọi API nằm ở `server/src/services/groq.js`:

```js
const res = await fetch(GROQ_URL, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages, temperature, max_tokens }),
  signal: AbortSignal.timeout(20000),
});
```

**Nguyên tắc thiết kế:** AI là lớp *bổ trợ*. Nếu không có key, lỗi mạng hoặc timeout, hàm trả `null` và mọi tính năng chuyển sang thuật toán dự phòng → hệ thống không bao giờ “chết” vì AI.

## 2. Kết hợp thuật toán + LLM

LLM không giỏi tính toán số liệu chính xác, nên hệ thống chia việc:

| Bước | Thực hiện bởi |
|---|---|
| Tổng hợp số liệu, tính dự báo, chấm điểm RFM | Thuật toán trong `services/analytics.js` (chính xác, tái lập được) |
| Diễn giải, nhận định, đề xuất hành động bằng ngôn ngữ tự nhiên | Llama qua Groq |

## 3. Dự báo nhu cầu (Demand Forecasting)

1. Lấy doanh số mỗi sản phẩm trong **60 ngày**, gom theo **tuần** để giảm nhiễu.
2. **Trung bình động có trọng số (WMA):** tuần gần nhất trọng số cao nhất.
3. **Xu hướng:** hệ số góc hồi quy tuyến tính trên chuỗi tuần → `up / down / flat`.
4. Dự báo tuần tới = `max(0, WMA + slope)`, quy đổi ra số ngày cần dự báo (7/14/30).
5. **Số ngày đủ bán** = tồn kho / tốc độ bán ngày.
6. **Đề xuất nhập** = dự báo + ngưỡng an toàn − tồn kho.
7. Nút “Nhận định từ AI” gửi top sản phẩm cho Llama để đưa ra khuyến nghị nhập hàng/khuyến mãi.

## 4. Phân khúc khách hàng (RFM)

- **R**ecency: số ngày từ lần mua gần nhất; **F**requency: số đơn; **M**onetary: tổng chi tiêu.
- Chấm điểm 1–5 theo phân vị trong tập khách hàng.
- Quy tắc phân nhóm: VIP, Trung thành, Tiềm năng, Khách mới, Có nguy cơ rời bỏ, Đã rời bỏ – mỗi nhóm có gợi ý chăm sóc mặc định.
- LLM đề xuất chiến dịch marketing cụ thể cho từng nhóm dựa trên số lượng & doanh thu.

## 5. Chatbot hỗ trợ bán hàng (RAG đơn giản)

1. Tách từ khóa câu hỏi → truy vấn MySQL tìm sản phẩm liên quan (*retrieval*).
2. Đưa danh sách sản phẩm thật + chính sách cửa hàng vào **system prompt**, yêu cầu “không bịa sản phẩm/giá”.
3. Gửi kèm 6 tin nhắn gần nhất để giữ ngữ cảnh hội thoại.
4. Trả lời + gợi ý tối đa 3 sản phẩm có link.
5. Lưu `chat_logs` để admin phân tích nhu cầu khách.

Dự phòng không AI: trả lời theo từ khóa (giao hàng, đổi trả, khuyến mãi) hoặc liệt kê sản phẩm khớp.

## 6. Các ứng dụng AI khác

- **Viết mô tả sản phẩm** cho admin (`POST /api/ai/describe`).
- **Tóm tắt đánh giá** sản phẩm cho khách (`GET /api/ai/review-summary/:id`).

## 7. Bảo mật khi dùng LLM

- API key chỉ nằm ở server (`.env`), không lộ ra client.
- Giới hạn độ dài tin nhắn (500 ký tự), lịch sử (6 tin), timeout 20s.
- Prompt ràng buộc chỉ dùng dữ liệu được cung cấp, giảm “ảo giác”.

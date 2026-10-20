# HƯỚNG DẪN CÀI ĐẶT & CHẠY SALESFLOW AI (cho người mới, máy trống)

Hướng dẫn này dành cho **Windows 10/11**. Làm lần lượt từ trên xuống, không bỏ bước nào.
Thời gian: khoảng 20–30 phút (phần lớn là chờ tải).

---

## PHẦN A – CÀI PHẦN MỀM CẦN THIẾT (chỉ làm 1 lần)

### Bước 1. Cài Node.js (để chạy chương trình)

1. Mở trình duyệt, vào: **https://nodejs.org**
2. Bấm nút tải bản **LTS** (nút màu xanh lá bên trái).
3. Mở file vừa tải (`node-v...-x64.msi`) → bấm **Next** liên tục → **Install** → **Finish**.
   (Để nguyên mọi lựa chọn mặc định.)
4. Kiểm tra: bấm phím **Windows**, gõ `cmd`, nhấn Enter để mở cửa sổ đen *Command Prompt*, gõ:
   ```
   node -v
   ```
   Thấy hiện `v20...` hoặc cao hơn là thành công.

### Bước 2. Cài XAMPP (để có cơ sở dữ liệu MySQL)

1. Vào: **https://www.apachefriends.org** → bấm **XAMPP for Windows** để tải.
2. Mở file vừa tải → nếu Windows hỏi quyền thì bấm **Yes**. Nếu hiện cảnh báo về UAC/antivirus thì bấm **OK**.
3. Bấm **Next** liên tục. Thư mục cài đặt để nguyên là `C:\xampp`. Bấm **Finish**.
4. Mở **XAMPP Control Panel** (tìm trong menu Start).
5. Ở dòng **MySQL**, bấm nút **Start**. Chữ "MySQL" chuyển sang **nền xanh lá** là được.

> ⚠ Mỗi lần bật máy muốn chạy web, đều phải mở XAMPP và bấm **Start** MySQL trước.
>
> Nếu MySQL không chạy được (báo lỗi cổng 3306): có thể máy đã cài MySQL khác. Mở *Services* của Windows, tìm "MySQL", bấm *Stop*, rồi Start lại trong XAMPP.

### Bước 3. Tải mã nguồn dự án

**Cách 1 (dễ nhất):**
1. Vào **https://github.com/huynhpham13790-rgb/Sales-Management-System**
2. Bấm nút xanh **Code** → **Download ZIP**.
3. Chuột phải vào file ZIP → **Extract All...** → chọn nơi giải nén, ví dụ `C:\SalesFlow` → **Extract**.

**Cách 2 (nếu đã biết Git):** `git clone https://github.com/huynhpham13790-rgb/Sales-Management-System.git`

---

## PHẦN B – CÀI ĐẶT DỰ ÁN (chỉ làm 1 lần)

### Cách nhanh: chạy file tự động

1. Mở thư mục dự án vừa giải nén (thư mục có file `README.md`, `setup.bat`).
2. **Nhấp đúp** vào file **`setup.bat`**.
3. Khi được hỏi **GROQ API KEY**, dán key được cung cấp (chuột phải vào cửa sổ đen để dán) rồi nhấn Enter.
   Không có key thì nhấn Enter bỏ qua – web vẫn chạy, chỉ là AI trả lời đơn giản hơn.
4. Chờ chương trình tự tải thư viện và tạo dữ liệu mẫu (2–5 phút). Thấy dòng
   **"✔ Đã tạo CSDL và dữ liệu mẫu"** và **"CÀI ĐẶT XONG"** là thành công.

> Nếu Windows hiện cửa sổ xanh "Windows protected your PC": bấm **More info** → **Run anyway**.

### Cách thủ công (nếu file tự động lỗi)

Mở *Command Prompt*, gõ lần lượt (thay đường dẫn cho đúng chỗ giải nén):

```bat
cd C:\SalesFlow\Sales-Management-System-main\server
copy .env.example .env
notepad .env
```
Trong Notepad, điền key vào dòng `GROQ_API_KEY=` (ví dụ `GROQ_API_KEY=gsk_xxxx`), lưu lại (Ctrl+S) và đóng. Sau đó:

```bat
npm install
npm run seed
cd ..\client
npm install
```

---

## PHẦN C – CHẠY WEB (mỗi lần sử dụng)

1. Mở **XAMPP Control Panel** → **Start** MySQL (nếu chưa chạy).
2. Nhấp đúp file **`start.bat`** trong thư mục dự án.
   Sẽ mở ra 2 cửa sổ đen (máy chủ API và giao diện) – **không được tắt** 2 cửa sổ này khi đang dùng web.
3. Trình duyệt tự mở **http://localhost:5173**. Nếu không tự mở, hãy tự gõ địa chỉ này vào trình duyệt.

**Tắt web:** đóng 2 cửa sổ đen.

### Chạy thủ công (nếu `start.bat` lỗi)
Mở 2 cửa sổ *Command Prompt*:
- Cửa sổ 1: `cd C:\...\server` rồi `npm start`
- Cửa sổ 2: `cd C:\...\client` rồi `npm run dev`

---

## PHẦN D – SỬ DỤNG

### Tài khoản có sẵn

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | admin@salesflow.vn | admin123 |
| Nhân viên | staff@salesflow.vn | staff123 |
| Khách hàng | an@gmail.com | 123456 |

- **Trang bán hàng:** http://localhost:5173 – xem sản phẩm, thêm giỏ, đặt hàng, chat với trợ lý AI (nút 💬 góc phải dưới).
- **Trang quản trị:** đăng nhập bằng tài khoản admin → tự chuyển vào trang quản trị (hoặc vào http://localhost:5173/admin).
- Mã giảm giá thử: `WELCOME10` (giảm 10% đơn từ 1 triệu), `GIAM500K` (giảm 500k đơn từ 10 triệu).

### Kiểm tra hệ thống hoạt động đúng
Khi web đang chạy, nhấp đúp **`test.bat`** (hoặc trong thư mục `server` gõ `npm run test-api`).
Kết quả mong đợi ở cuối: **`Kết quả: 26 đạt, 0 lỗi`**.

### Làm mới dữ liệu về ban đầu
Trong thư mục `server` gõ `npm run seed`. ⚠ Lệnh này **xóa toàn bộ dữ liệu** đang có và tạo lại dữ liệu mẫu.

---

## PHẦN E – XỬ LÝ LỖI THƯỜNG GẶP

| Hiện tượng | Cách xử lý |
|---|---|
| `'node' is not recognized...` | Chưa cài Node.js hoặc chưa khởi động lại cửa sổ cmd. Cài lại Bước 1, rồi mở cmd mới. |
| `ECONNREFUSED ...3306` hoặc `Can't connect to MySQL` | Chưa bấm **Start** MySQL trong XAMPP. |
| `Access denied for user 'root'` | MySQL có mật khẩu. Mở `server\.env`, điền mật khẩu vào `DB_PASSWORD=`. |
| `EADDRINUSE ... 5000` hoặc `5173` | Web đang chạy ở cửa sổ khác. Đóng hết cửa sổ đen rồi chạy lại `start.bat`. |
| Trang web trắng / báo "Có lỗi xảy ra" | Kiểm tra cửa sổ máy chủ API (server) còn mở và MySQL còn chạy. |
| Chatbot trả lời kiểu liệt kê đơn giản, không có nhận định AI | Chưa điền `GROQ_API_KEY` trong `server\.env`, hoặc key hết hạn/sai, hoặc máy không có Internet. Sửa xong phải tắt và chạy lại `start.bat`. |
| Báo lỗi model không tồn tại (xem trong cửa sổ server) | Mở `server\.env`, đổi `GROQ_MODEL=` sang mô hình khác có trên https://console.groq.com/docs/models |

### Lấy Groq API key mới (miễn phí)
1. Vào **https://console.groq.com** → đăng nhập bằng Google.
2. Chọn **API Keys** → **Create API Key** → đặt tên bất kỳ → **Submit**.
3. Sao chép key (bắt đầu bằng `gsk_`), dán vào dòng `GROQ_API_KEY=` trong file `server\.env`.

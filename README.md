# MathMaster 12 - Web Chatbot Hỗ Trợ Toán Học Lớp 12 (Free API) 📐🎓

Ứng dụng Web Chatbot thông minh hỗ trợ học sinh lớp 12 và giáo viên giải đáp thắc mắc, phân tích phương pháp, ôn thi Tốt nghiệp THPT Quốc gia môn Toán. Sử dụng **Google Gemini API hoàn toàn miễn phí** kết hợp công nghệ hiển thị công thức toán học **$\LaTeX$ (KaTeX)** và nhận diện đề bài qua **hình ảnh chụp**.

---

## 🌟 Điểm Nổi Bật

1. **API Miễn Phí (Google Gemini 1.5 Flash / 2.0 Flash)**:
   - Sử dụng gói Free của Google AI Studio (15 yêu cầu/phút, 1 triệu tokens/phút).
   - Chi phí: **0 VNĐ**.
2. **Nhận Diện Bài Toán Qua Ảnh Chụp (Multimodal)**:
   - Học sinh chỉ cần chụp ảnh đề bài trong sách/vở/đề thi và kéo thả hoặc dán (Ctrl+V) vào khung chat. AI sẽ tự động đọc đề bài và đưa ra lời giải.
3. **Hiển Thị Công Thức Toán Đẹp Mắt ($\LaTeX$ & KaTeX)**:
   - Các công thức tích phân $\int$, giới hạn $\lim$, vectơ $\vec{u}$, ma trận, phân số $\frac{a}{b}$ được render chuẩn mực, sắc nét.
4. **Trợ Thủ Casio fx-580VN X / 880BTG**:
   - Hướng dẫn cụ thể từng bước bấm máy tính cầm tay (Menu 8 - Table, phím CALC, giải phương trình, tích phân, đạo hàm tại 1 điểm).
5. **3 Chế Độ Giải Toán Thông Minh**:
   - 📝 **Giải chi tiết & Casio**: Đầy đủ cơ sở lý thuyết, các bước giải và bẫy trắc nghiệm.
   - 💡 **Gợi ý phương pháp (Socratic)**: Đặt câu hỏi gợi mở, nhắc lại định lý để học sinh tự tư duy.
   - 🧮 **Chuyên sâu bấm Casio**: Tập trung vào thủ thuật giải nhanh bằng máy tính.
6. **Bàn Phím Ký Hiệu Nhanh**:
   - Tích hợp thanh công cụ chèn nhanh các ký hiệu toán học phổ biến ($\int$, $\sqrt{}$, $\vec{u}$, $\pi$, $\infty$, v.v.).
7. **Lưu Lịch Sử & Giao Diện Sáng/Tối (Dark/Light Mode)**:
   - Toàn bộ bài giải được lưu tự động trên trình duyệt (LocalStorage).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Bước 1: Lấy Gemini API Key Miễn Phí (Chỉ mất 30 giây)
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Đăng nhập bằng tài khoản Google.
3. Nhấn **"Create API key"** và sao chép mã Key (dạng `AIzaSy...`).

### Bước 2: Cấu hình API Key
Bạn có thể cấu hình theo 1 trong 2 cách:
- **Cách 1 (Khuyên dùng)**: Mở file `.env` trong thư mục dự án và dán key:
  ```env
  GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
  PORT=3000
  ```
- **Cách 2**: Nhập trực tiếp trên giao diện web bằng cách bấm vào nút **"Cài đặt API"** ở góc trái dưới cùng.

### Bước 3: Cài đặt và khởi chạy
Mở terminal tại thư mục dự án và chạy:
```bash
# Cài đặt dependencies
npm install

# Khởi động server
npm start
```

Mở trình duyệt và truy cập: **http://localhost:3000**

---

## 📂 Cấu Trúc Dự Án

```
Chatbot_vibecode/
├── public/
│   ├── index.html       # Giao diện chính (Semantic HTML5)
│   ├── style.css        # Hệ thống Design Tokens & CSS hiện đại (Dark/Light mode)
│   └── app.js           # Logic client, quản lý chat, KaTeX LaTeX, xử lý ảnh
├── server.js            # Node.js Express proxy bảo mật API Key & định hướng Prompt Toán 12
├── package.json         # Danh sách thư viện (express, cors, dotenv)
├── .env.example         # File mẫu cấu hình biến môi trường
└── README.md            # Hướng dẫn chi tiết
```

---

## 📚 Phạm Vi Kiến Thức Toán 12 Hỗ Trợ
- **Đại số & Giải tích**:
  - Khảo sát sự biến thiên và vẽ đồ thị hàm số (Đơn điệu, cực trị, tiệm cận, min-max).
  - Nguyên hàm - Tích phân và ứng dụng (Diện tích hình phẳng, thể tích tròn xoay).
  - Mũ và Logarit.
  - Số phức và bài toán min-max số phức.
- **Hình học & Tọa độ**:
  - Khối đa diện và thể tích khối đa diện.
  - Khối tròn xoay (Hình nón, hình trụ, mặt cầu).
  - Phương pháp tọa độ trong không gian Oxyz.
- **Xác suất & Thống kê**:
  - Xác suất có điều kiện, biến ngẫu nhiên rời rạc, công thức Bayes (Chương trình mới 2018).

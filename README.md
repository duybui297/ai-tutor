# 🐰 Gia sư Bông – Tiếng Anh lớp 3 (dùng trong gia đình)

Ứng dụng web chạy trên máy ở nhà:
- Nhân vật 3D thỏ Bông nói chuyện, nhép môi.
- Bé nghe, nhắc lại, được chấm điểm và sửa lỗi phát âm tới từng âm.
- Cuối mỗi bài bé trò chuyện ngắn với Bông.

Toàn bộ dùng gói **miễn phí** của Azure và Google. Không cần máy chủ, không cần cài thêm thư viện nào.

## 1. Chạy thử ngay (chưa cần key)

1. Mở thư mục `AI-Tutor`, **bấm đúp `start.command`**.
   - Nếu macOS chặn: chuột phải vào file → **Open** → **Open**.
   - Lần đầu, nếu máy hỏi cài "command line developer tools" thì bấm **Install**: cần cái này để có `python3`.
2. Trình duyệt sẽ mở `http://localhost:8765`. Nên dùng **Google Chrome**.
3. Khi được hỏi quyền **micro**, bấm **Cho phép**.

Khi chưa có key, app chạy ở **chế độ thử**: dùng giọng đọc và nhận diện giọng có sẵn của trình duyệt, chỉ chấm gần đúng theo chữ. Chế độ này để xem giao diện và luồng bài học.

> Không mở trực tiếp file `index.html` bằng cách bấm đúp vào nó: trình duyệt sẽ chặn module và micro. Luôn mở qua `start.command`.

## 2. Lấy key miễn phí

### Azure Speech (chấm phát âm + giọng đọc)
1. Vào https://portal.azure.com, đăng ký tài khoản. Có bước xác minh thẻ, nhưng gói F0 không tự trừ tiền.
2. **Create a resource** → tìm **Speech** → **Create**.
   - Region: **Southeast Asia**
   - Pricing tier: **Free F0**
3. Mở resource vừa tạo → **Keys and Endpoint** → copy **KEY 1**. Region ghi là `southeastasia`.

Gói F0 cho mỗi tháng 5 giờ nhận diện/chấm phát âm và 0,5 triệu ký tự đọc giọng. Một bé học 20 phút/ngày chỉ dùng khoảng 1,5–2 giờ.

### Gemini (trò chuyện)
1. Vào https://aistudio.google.com → **Get API key** → **Create API key**.
2. Copy key.

Lưu ý: ở gói miễn phí, Google có thể dùng nội dung để cải thiện dịch vụ. App chỉ gửi **chữ** (câu bé nói đã chuyển thành văn bản), không gửi giọng nói, và dặn AI không hỏi thông tin cá nhân.

### Dán key vào app
Bấm **👨‍👩‍👧 Phụ huynh**. App hỏi một phép nhân để bé không tự vào. Sau đó:
1. Vào tab **Cài đặt**, dán 2 key.
2. Bấm **💾 Lưu**.
3. Bấm **🔊 Thử giọng** và **🧠 Thử Gemini** để kiểm tra.

Key chỉ lưu trong trình duyệt trên máy này.

### Cách khác: để key trong file (máy nhà)
Chép `js/keys.example.js` thành `js/keys.js` rồi điền key. File `js/keys.js` đã nằm trong `.gitignore` nên **không bị đưa lên GitHub**. Không bao giờ commit key thật.

## Đưa lên mạng bằng Vercel (dùng trên iPad/điện thoại)
Bản online **giữ key trên máy chủ Vercel**: trình duyệt không bao giờ thấy key. Mỗi máy chỉ cần nhập **mật khẩu app** một lần.

1. Đẩy code lên GitHub (`js/keys.js` đã bị `.gitignore` chặn).
2. Vào https://vercel.com, đăng nhập bằng GitHub → **Add New… → Project** → chọn repo `ai-tutor` → **Import**.
3. **Framework Preset**: *Other*. Không cần Build Command.
4. Mở **Environment Variables**, thêm 4 biến:

   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | key Gemini |
   | `AZURE_SPEECH_KEY` | KEY 1 của Azure Speech |
   | `AZURE_SPEECH_REGION` | `southeastasia` |
   | `APP_PASSWORD` | mật khẩu tự đặt, ví dụ `bong-2026` |
5. Bấm **Deploy**, sau khoảng 1 phút sẽ có địa chỉ dạng `https://ai-tutor-xxx.vercel.app`.
6. Mở địa chỉ đó → **Phụ huynh → Cài đặt** → nhập **Mật khẩu app** (để trống các ô key) → **Lưu**. Dòng trên cùng hiện "🎯 Azure… (máy chủ) · 🧠 Gemini (máy chủ)" là xong.

Đổi key hoặc mật khẩu: sửa trong Vercel → Settings → Environment Variables rồi **Redeploy**.

Máy chủ gồm các file trong thư mục `api/`:
- `api/status.js`: kiểm tra mật khẩu và báo máy chủ có key nào.
- `api/azure-token.js`: cấp token Azure tạm, hết hạn sau 10 phút.
- `api/gemini.js`: chuyển câu hỏi tới Gemini.

## 3. Cấu trúc một bài học
1. **Khởi động** — Bông chào, giới thiệu bài.
2. **Từ mới** — Bông đọc mẫu → bé bấm 🎤 nói theo → chấm sao, tô màu từng âm, mẹo sửa bằng tiếng Việt. Tối đa 3 lần thử, sau đó chuyển tiếp để bé không nản.
3. **Mẫu câu** — như trên, với cả câu.
4. **Trò chuyện** — 4 lượt hỏi đáp ngắn theo chủ đề.
5. **Tổng kết** — số sao của bài, những từ cần luyện thêm.

### 🇻🇳 / 🇬🇧 Hai chế độ ngôn ngữ
Nút chuyển ở góc trên trang chủ, hoặc trong **Phụ huynh → Cài đặt → Chế độ ngôn ngữ**.

| | 🇻🇳 + 🇬🇧 Song ngữ | 🇬🇧 English only |
|---|---|---|
| Bông đọc mẫu, khen | tiếng Anh | tiếng Anh |
| Mẹo sửa âm | tiếng Việt: "Con đặt đầu lưỡi giữa hai hàm răng…" | tiếng Anh dễ: "Put your tongue between your teeth…" |
| Sửa lỗi câu | "Con nên nói là: *My name is Evan*. Với my name, mình dùng is." | "We say: *My name is Evan*. We say my name IS." |
| Nghĩa tiếng Việt trên thẻ từ | có | ẩn (chỉ còn hình) |
| Hợp với | bé mới học, cần hiểu vì sao sai | bé đã quen, luyện nghe – nói thuần Anh |

Mục Phụ huynh luôn giữ tiếng Việt.

### 💬 Trò chuyện và sửa lỗi câu
Có ở cuối mỗi bài, và ở nút **💬 Trò chuyện với Bông** trên trang chủ (8 lượt, chủ đề tổng hợp). Ví dụ:

> 🐰 What's your name?
> 🧒 My name **are** Evan
> 🐰 *Con nên nói là:* **My name is Evan.** *Với "my name", mình dùng "is" con nhé. Con nói lại theo Bông nhé.*
> 🧒 (nói lại) → được chấm sao như khi luyện phát âm → Bông khen rồi hỏi câu tiếp.

Bông sửa những lỗi sau:
- **Ngữ pháp**: is / am / are, have / has, thêm "s" cho động từ, a / an, "years old"…
- **Trả lời cụt**: chỉ nói một từ thì Bông gợi ý nói cả câu.
- **Nói tiếng Việt hoặc im lặng**: Bông đưa câu tiếng Anh mẫu để con nói theo.

Mỗi lượt Bông chỉ sửa 1 lỗi và không bao giờ nói "sai". Các câu đã sửa được đưa vào **Ôn từ khó**.

- Có key Gemini: AI tự phát hiện mọi loại lỗi.
- Chưa có key: app bắt được khoảng 15 lỗi hay gặp nhất của học sinh lớp 3 (file `js/grammar.js`).

Lưu ý: bộ nhận diện giọng đôi khi tự "sửa hộ" câu sai thành câu đúng khi chuyển thành chữ. Khi đó Bông sẽ không biết con đã nói sai.

Nút **🔁 Ôn từ khó** ở trang chủ cho bé luyện lại các từ/câu lần trước chưa đạt 3 sao.

Tab **📊 Báo cáo** (trong Phụ huynh) cho xem:
- thời gian học 7 ngày qua;
- các từ cần luyện;
- các âm con hay sai (có ở chế độ Azure).

## 4. Thêm bài theo sách của con
Sửa file `js/lessons.js`: chép một khối `{ id: ..., words: [...], sentences: [...], chat: {...} }` rồi đổi nội dung. Lưu file và tải lại trang.

## 5. Tinh chỉnh
Trong **Phụ huynh → Cài đặt**:
- **Điểm 3 sao / điểm đạt**: giọng trẻ thường bị chấm thấp hơn người lớn. Nếu con nói đúng mà hay bị 1 sao thì hạ hai mức này xuống, ví dụ 70 / 50.
- **Giọng**:
  - `en-US-AnaNeural` là giọng trẻ em; muốn giọng người lớn thì đổi sang `en-US-JennyNeural`.
  - Giọng tiếng Việt có thể đổi sang `vi-VN-NamMinhNeural`.
- **Mô hình Gemini**: mặc định `gemini-2.5-flash` (nhanh, ổn định). Nếu mô hình này quá tải hoặc lỗi, app tự chuyển sang `gemini-flash-lite-latest` → `gemini-2.5-flash-lite` và nhớ mô hình chạy được.
- **Giới hạn phút/ngày**: mặc định 25 phút.

## 6. (Tùy chọn) Đổi nhân vật 3D
1. Tạo nhân vật bằng **VRoid Studio** (miễn phí).
2. Export ra file `.vrm`, đặt vào `models/avatar.vrm`.
3. Tải lại trang, app sẽ dùng nhân vật đó thay cho thỏ Bông.

Phần này đang thử nghiệm, có thể cần chỉnh góc máy quay.

## Các file
| File | Việc |
|---|---|
| `index.html`, `style.css` | Giao diện |
| `js/main.js` | Điều khiển bài học |
| `js/avatar.js` | Nhân vật 3D, nhép môi, cảm xúc |
| `js/speech-azure.js` | Azure: chấm phát âm, đọc giọng, nghe |
| `js/speech-browser.js` | Chế độ thử bằng giọng trình duyệt |
| `js/brain.js` | Gemini / hội thoại mẫu, kèm sửa lỗi câu |
| `js/grammar.js` | Bắt lỗi ngữ pháp hay gặp khi chưa có Gemini |
| `js/feedback.js` | Biến điểm thành lời khen, mẹo sửa âm |
| `js/progress.js` | Lưu tiến độ trong trình duyệt |
| `js/lessons.js` | Nội dung bài học |

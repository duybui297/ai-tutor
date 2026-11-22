// Cài đặt mặc định. Khóa (key) KHÔNG để trong file này:
// anh dán vào màn hình "Phụ huynh → Cài đặt", app lưu trong trình duyệt của máy.

export const DEFAULTS = {
  azureKey: '',
  azureRegion: 'southeastasia',        // vùng của Azure Speech (Singapore)
  geminiKey: '',
  geminiModel: 'gemini-2.5-flash',     // app tự chuyển mô hình dự phòng nếu mô hình này lỗi
  voiceEn: 'en-US-AnaNeural',          // giọng tiếng Anh trẻ em của Azure
  voiceVi: 'vi-VN-HoaiMyNeural',       // giọng tiếng Việt
  rateEn: '-10%',                      // tốc độ đọc tiếng Anh bình thường
  rateEnSlow: '-35%',                  // tốc độ khi bật "đọc chậm"
  greatScore: 80,                      // >= điểm này: 3 sao
  goodScore: 60,                       // >= điểm này: 2 sao (đạt)
  maxTries: 3,                         // số lần thử tối đa cho mỗi từ/câu
  chatTurns: 4,                        // số lượt trò chuyện cuối bài
  freeTurns: 8,                        // số lượt ở chế độ "Trò chuyện tự do"
  dailyMinutes: 25,                    // giới hạn thời gian học mỗi ngày
  appPassword: '',                     // mật khẩu app khi chạy trên Vercel
  langMode: 'vi',                      // 'vi' = song ngữ, 'en' = chỉ tiếng Anh
};

// js/keys.js chứa key thật, KHÔNG đưa lên git (.gitignore đã chặn).
// Máy nào chưa có file này thì app vẫn chạy, chỉ cần dán key trong Phụ huynh → Cài đặt.
let KEYS = {};
try {
  ({ KEYS } = await import('./keys.js'));
} catch {
  console.info('Chưa có js/keys.js — dùng key trong Cài đặt (nếu có).');
}

const KEY = 'bong.settings.v1';

export function loadSettings() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch { /* bỏ qua */ }
  const s = { ...DEFAULTS, ...stored };
  // key trong máy (js/keys.js) dùng khi ô key trong Cài đặt đang để trống
  for (const k of ['geminiKey', 'azureKey', 'azureRegion']) {
    if (!s[k] && KEYS[k]) s[k] = KEYS[k];
  }
  return s;
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Không lưu được cài đặt', e);
  }
}

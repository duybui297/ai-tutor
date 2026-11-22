// CHẾ ĐỘ THỬ (chưa có key Azure): dùng giọng đọc và nhận diện có sẵn của trình duyệt.
// Chỉ chấm gần đúng theo chữ nghe được, KHÔNG chấm tới từng âm như Azure.

function norm(s) {
  return s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
}

function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[m][n];
}

const sim = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

export class BrowserSpeech {
  constructor(settings) {
    this.s = settings;
    this.kind = 'browser';
    this.precise = false;
    this.speaking = false;
    this.bump = 0;
    this.voices = [];
    const load = () => (this.voices = window.speechSynthesis ? speechSynthesis.getVoices() : []);
    load();
    if (window.speechSynthesis) speechSynthesis.onvoiceschanged = load;
  }

  _voice(lang) {
    const pref = this.voices.filter((v) => v.lang && v.lang.replace('_', '-').startsWith(lang));
    return pref.find((v) => /Samantha|Google US|Linh|Google Tiếng Việt/i.test(v.name)) || pref[0] || null;
  }

  async speak(parts, { slow = false } = {}) {
    if (!window.speechSynthesis) return;
    for (const p of parts) {
      if (!p.text || !p.text.trim()) continue;
      await new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(p.text);
        u.lang = p.lang === 'vi' ? 'vi-VN' : 'en-US';
        const v = this._voice(u.lang);
        if (v) u.voice = v;
        u.rate = p.lang === 'vi' ? 1 : slow ? 0.65 : 0.9;
        u.pitch = 1.15;
        u.onboundary = () => (this.bump = 1);
        u.onend = u.onerror = () => { this.speaking = false; resolve(); };
        this.speaking = true;
        speechSynthesis.speak(u);
      });
    }
  }

  stop() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    this.speaking = false;
  }

  mouth() {
    if (!this.speaking) return null;
    const t = performance.now() / 1000;
    this.bump *= 0.9;
    return { open: 0.15 + 0.55 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 3.1)) + this.bump * 0.2, wide: 0.5 + 0.2 * Math.sin(t * 5) };
  }

  _recognize(lang, alts = 5) {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return reject(new Error('Trình duyệt này không có nhận diện giọng nói. Anh hãy mở bằng Google Chrome hoặc Safari.'));
      const r = new SR();
      r.lang = lang;
      r.interimResults = false;
      r.maxAlternatives = alts;
      r.continuous = false;
      let done = false;
      r.onresult = (e) => {
        done = true;
        resolve([...e.results[0]].map((a) => a.transcript));
      };
      r.onerror = (e) => {
        done = true;
        if (e.error === 'no-speech' || e.error === 'aborted') resolve([]);
        else reject(new Error('Nhận diện giọng lỗi: ' + e.error));
      };
      r.onend = () => { if (!done) resolve([]); };
      this.rec = r;
      r.start();
    });
  }

  async assess(referenceText) {
    const alts = await this._recognize('en-US');
    if (!alts.length) return { heard: '', noSpeech: true, words: [] };
    const ref = norm(referenceText);
    let best = null;
    for (const alt of alts) {
      const heard = norm(alt);
      const words = ref.map((rw) => {
        const s = Math.max(0, ...heard.map((hw) => sim(rw, hw)));
        return { word: rw, score: Math.round(s * 100), error: s < 0.5 ? 'Mispronunciation' : 'None', phonemes: [] };
      });
      const avg = words.reduce((a, w) => a + w.score, 0) / Math.max(words.length, 1);
      if (!best || avg > best.pron) {
        best = {
          heard: alt,
          pron: Math.round(avg),
          accuracy: Math.round(avg),
          fluency: null,
          completeness: Math.round((100 * words.filter((w) => w.score >= 50).length) / Math.max(words.length, 1)),
          words,
          approximate: true,
        };
      }
    }
    return best;
  }

  async listen() {
    const alts = await this._recognize('en-US', 1);
    return { text: alts[0] || '', lang: 'en-US' };
  }

  cancelListen() {
    try { this.rec && this.rec.abort(); } catch { /* bỏ qua */ }
  }
}

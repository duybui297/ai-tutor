// Lưu tiến độ học trong trình duyệt (localStorage) — không gửi đi đâu cả.
const KEY = 'bong.progress.v1';

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY)) || {};
    return { units: {}, items: {}, phonemes: {}, days: {}, ...p };
  } catch {
    return { units: {}, items: {}, phonemes: {}, days: {} };
  }
}

let P = load();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(P)); } catch { /* đầy bộ nhớ */ }
};
const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

export function recordAttempt(text, res, stars) {
  const it = P.items[text] || { n: 0, best: 0, lastStars: 0 };
  it.n++;
  it.best = Math.max(it.best, res?.pron || 0);
  it.lastStars = stars;
  it.last = Date.now();
  P.items[text] = it;
  for (const w of res?.words || []) {
    for (const ph of w.phonemes || []) {
      const a = P.phonemes[ph.p] || { n: 0, sum: 0, example: w.word };
      a.n++;
      a.sum += ph.score;
      if (ph.score < 60) a.example = w.word;
      P.phonemes[ph.p] = a;
    }
  }
  save();
}

export function setUnitStars(id, stars) {
  const u = P.units[id] || { stars: 0, times: 0 };
  u.stars = Math.max(u.stars, stars);
  u.times++;
  u.last = Date.now();
  P.units[id] = u;
  save();
}

export const unitStars = (id) => P.units[id]?.stars || 0;

// Các từ/câu con còn yếu (lần gần nhất < 3 sao), ưu tiên yếu nhất và lâu chưa ôn
export function weakItems(n = 8) {
  return Object.entries(P.items)
    .filter(([, v]) => v.lastStars < 3)
    .sort((a, b) => a[1].lastStars - b[1].lastStars || a[1].last - b[1].last)
    .slice(0, n)
    .map(([text, v]) => ({ text, ...v }));
}

export function weakPhonemes(n = 8) {
  return Object.entries(P.phonemes)
    .filter(([, v]) => v.n >= 3)
    .map(([p, v]) => ({ p, avg: Math.round(v.sum / v.n), n: v.n, example: v.example }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, n);
}

export function addSeconds(sec) {
  const d = today();
  P.days[d] = (P.days[d] || 0) + sec;
  save();
}

export const todayMinutes = () => Math.round((P.days[today()] || 0) / 60);

export function lastDays(n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toLocaleDateString('sv-SE');
    out.push({ day: d.slice(5), minutes: Math.round((P.days[d] || 0) / 60) });
  }
  return out;
}

export function resetAll() {
  P = { units: {}, items: {}, phonemes: {}, days: {} };
  save();
}

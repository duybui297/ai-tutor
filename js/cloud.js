// Kết nối tới máy chủ Vercel (thư mục /api). Chạy ở máy nhà (start.command) thì không có /api,
// app tự dùng key trong js/keys.js hoặc trong Cài đặt như cũ.

export const cloud = { ok: false, azure: false, gemini: false, region: null, error: null };

export async function detectCloud(pass) {
  Object.assign(cloud, { ok: false, azure: false, gemini: false, region: null, error: null });
  try {
    const r = await fetch('api/status', { headers: { 'x-app-pass': pass || '' }, cache: 'no-store' });
    const type = r.headers.get('content-type') || '';
    if (!type.includes('json')) return cloud; // máy nhà: không có /api
    const d = await r.json();
    if (!r.ok) {
      cloud.error = d.error || `Lỗi máy chủ ${r.status}`;
      return cloud;
    }
    Object.assign(cloud, { ok: true, azure: !!d.azure, gemini: !!d.gemini, region: d.region });
  } catch {
    /* không có máy chủ */
  }
  return cloud;
}

let token = null;
let tokenAt = 0;

// Token Azure hết hạn sau 10 phút → xin lại sau 8 phút
export async function azureToken(pass) {
  if (token && Date.now() - tokenAt < 8 * 60 * 1000) return token;
  const r = await fetch('api/azure-token', { headers: { 'x-app-pass': pass || '' }, cache: 'no-store' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Không lấy được token Azure (${r.status})`);
  token = d.token;
  tokenAt = Date.now();
  return token;
}

export function geminiProxy(pass, model, payload, signal) {
  return fetch('api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-pass': pass || '' },
    body: JSON.stringify({ model, payload }),
    signal,
  });
}

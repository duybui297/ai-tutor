// POST /api/gemini — chuyển yêu cầu tới Gemini bằng key giữ trên máy chủ.
import { checkPass } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Chỉ nhận POST' } });
  if (!checkPass(req, res)) return;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: { message: 'Chưa đặt GEMINI_API_KEY trên Vercel' } });

  const { model, payload } = req.body || {};
  if (!/^[a-z0-9.\-]+$/i.test(model || '') || !payload) {
    return res.status(400).json({ error: { message: 'Yêu cầu không hợp lệ' } });
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(payload),
  });
  res.status(r.status);
  res.setHeader('Content-Type', 'application/json');
  res.send(await r.text());
}

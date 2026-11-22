// GET /api/azure-token — đổi key Azure (giữ trên máy chủ) lấy token tạm, hết hạn sau 10 phút.
// Trình duyệt chỉ nhận token tạm, không bao giờ thấy key thật.
import { checkPass, region } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!checkPass(req, res)) return;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!key) return res.status(500).json({ error: 'Chưa đặt AZURE_SPEECH_KEY trên Vercel' });
  const r = await fetch(`https://${region()}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key },
  });
  if (!r.ok) return res.status(502).json({ error: `Azure từ chối key (${r.status}) — kiểm tra key và vùng` });
  res.status(200).json({ token: await r.text(), region: region() });
}

// GET /api/status — app hỏi xem máy chủ có key Azure/Gemini không (không trả key về)
import { checkPass, region } from './_lib.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!checkPass(req, res)) return;
  res.status(200).json({
    azure: !!process.env.AZURE_SPEECH_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    region: region(),
  });
}

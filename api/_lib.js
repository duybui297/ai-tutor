// Dùng chung cho các hàm /api trên Vercel (file bắt đầu bằng "_" không thành đường dẫn API).
// Key nằm trong biến môi trường của Vercel, KHÔNG bao giờ gửi về trình duyệt.

export function checkPass(req, res) {
  const need = process.env.APP_PASSWORD;
  if (!need) {
    res.status(500).json({ error: 'Chưa đặt APP_PASSWORD trong Vercel → Settings → Environment Variables' });
    return false;
  }
  if ((req.headers['x-app-pass'] || '') !== need) {
    res.status(401).json({ error: 'Sai mật khẩu app' });
    return false;
  }
  return true;
}

export const region = () => process.env.AZURE_SPEECH_REGION || 'southeastasia';

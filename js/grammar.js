// Bắt các lỗi ngữ pháp hay gặp của học sinh lớp 3 — dùng khi CHƯA có key Gemini.
// Có Gemini thì Gemini tự sửa mọi lỗi; file này chỉ là phương án dự phòng.

const COLOURS = 'red|blue|green|yellow|pink|orange|black|white|brown|purple';
const ANIMALS = 'cat|dog|bird|fish|rabbit|elephant|monkey|tiger|duck|chicken';

// [mẫu sai, cách sửa, giải thích tiếng Việt, giải thích tiếng Anh]
const RULES = [
  [/\bmy name are\b/, 'my name is', 'Với "my name", mình dùng "is" con nhé.', 'We say "my name IS".'],
  [/\byour name are\b/, 'your name is', 'Với "your name", mình dùng "is" con nhé.', 'We say "your name IS".'],
  [/\bi (is|are)\b/, 'I am', 'Với "I", mình luôn dùng "am" con nhé.', 'With "I", we use "am".'],
  [/\b(he|she|it) are\b/, '$1 is', 'Với "he", "she", "it", mình dùng "is" con nhé.', 'With he, she, it, we use "is".'],
  [/\b(you|we|they) is\b/, '$1 are', 'Với "you", "we", "they", mình dùng "are" con nhé.', 'With you, we, they, we use "are".'],
  [/\b(this|that) are\b/, '$1 is', 'Với "this", "that", mình dùng "is" con nhé.', 'With this and that, we use "is".'],
  [/\b(these|those) is\b/, '$1 are', 'Với "these", "those", mình dùng "are" con nhé.', 'With these and those, we use "are".'],
  [/\bi has\b/, 'I have', 'Với "I", mình dùng "have" con nhé.', 'With "I", we use "have".'],
  [/\b(he|she|it) have\b/, '$1 has', 'Với "he", "she", "it", mình dùng "has" con nhé.', 'With he, she, it, we use "has".'],
  [/\bi (likes|loves|wants)\b/, (m, v) => 'I ' + v.slice(0, -1), 'Với "I", động từ không thêm "s" con nhé.', 'With "I", no "s" on the action word.'],
  [/\b(he|she) (like|love|want)\b/, '$1 $2s', 'Với "he", "she", động từ thêm "s" con nhé.', 'With he and she, add "s": likes.'],
  [/\b(\w+) year old\b/, '$1 years old', 'Từ hai tuổi trở lên mình nói "years old" con nhé.', 'We say "years old".'],
  [new RegExp(`\\bit (${COLOURS})\\b`), 'it is $1', 'Mình cần "is": "It is ..." con nhé.', 'Don\'t forget "is": It is ...'],
  [new RegExp(`\\bi (${COLOURS}|fine|happy|good|ok)\\b`), 'I am $1', 'Mình cần "am": "I am ..." con nhé.', 'Don\'t forget "am": I am ...'],
  [/\ba (apple|elephant|eraser|orange|egg|ice cream)\b/, 'an $1', 'Trước âm "a, e, i, o, u" mình dùng "an" con nhé.', 'Before a, e, i, o, u, we say "an".'],
  [new RegExp(`\\bi like (${ANIMALS})\\b(?!s)`), 'I like $1s', 'Nói thích con vật nói chung thì thêm "s": "I like cats" con nhé.', 'Add "s" for animals you like: I like cats.'],
];

function tidy(s) {
  s = s.trim().replace(/\s+/g, ' ').replace(/\bi\b/g, 'I');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(s) ? s : s + '.';
}

// Trả về { wrong, right, explain_vi } hoặc null nếu không thấy lỗi.
// lang = 'en' → lời giải thích bằng tiếng Anh (vẫn để trong trường explain_vi cho gọn).
export function checkGrammar(text, lang = 'vi') {
  if (!text) return null;
  let s = ' ' + text.replace(/[.,!?]/g, '') + ' ';
  let why = null;
  for (const [re, rep, explainVi, explainEn] of RULES) {
    const explain = lang === 'en' ? explainEn : explainVi;
    const rx = new RegExp(re.source, 'i'); // giữ nguyên chữ hoa của tên riêng
    if (rx.test(s)) {
      s = s.replace(rx, rep);
      why = why || explain; // chỉ giải thích lỗi đầu tiên cho bé dễ nhớ
    }
  }
  return why ? { wrong: text.trim(), right: tidy(s), explain_vi: why } : null;
}

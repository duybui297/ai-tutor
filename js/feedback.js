// Biến điểm chấm thành lời khen / lời sửa thân thiện cho bé.
// Nguyên tắc: khen trước, mỗi lần chỉ sửa 1 lỗi, ưu tiên lỗi hay gặp của học sinh Việt.
// Hai chế độ: 'vi' = song ngữ (giải thích bằng tiếng Việt), 'en' = chỉ tiếng Anh.

export const en = (text) => ({ lang: 'en', text });
export const vi = (text) => ({ lang: 'vi', text });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let MODE = 'vi';
export const setLangMode = (m) => (MODE = m === 'en' ? 'en' : 'vi');
export const englishOnly = () => MODE === 'en';
// câu Bông nói: song ngữ → tiếng Việt; chỉ tiếng Anh → câu tiếng Anh (hoặc bỏ qua nếu không có)
export const tr = (viText, enText) => (MODE === 'en' ? (enText ? en(enText) : null) : vi(viText));
// chữ hiển thị trên màn hình
export const t = (viText, enText) => (MODE === 'en' ? enText : viText);

const GREAT = ['Excellent!', 'Super!', 'Wow, great job!', 'Perfect!', 'Amazing!'];
const GOOD = ['Good job!', 'Well done!', 'Nice!', 'Very good!'];
const TRY = ['Good try!', 'Almost there!', 'Nice try!', "Let's try again!"];

// Mẹo đọc cho các âm hay sai. show: tên âm; vi / en: Bông đọc (không có ký hiệu lạ)
const TIPS = {
  'θ': { show: '/θ/ ("three")', vi: 'Con đặt đầu lưỡi giữa hai hàm răng, rồi thổi hơi nhẹ ra nhé.', en: 'Put your tongue between your teeth and blow softly.' },
  'ð': { show: '/ð/ ("this")', vi: 'Con đặt lưỡi giữa hai hàm răng, rồi rung cổ họng nhẹ nhé.', en: 'Put your tongue between your teeth and make a buzzing sound.' },
  'ʃ': { show: '/ʃ/ ("she")', vi: 'Con chu môi ra, đẩy hơi như khi ra hiệu im lặng, suỵt.', en: 'Round your lips and say shhh, like "be quiet".' },
  'tʃ': { show: '/tʃ/ ("chair")', vi: 'Con chu môi, bật hơi mạnh, giống chờ nhưng mạnh hơn.', en: 'Round your lips and say ch, like a train: ch, ch.' },
  'dʒ': { show: '/dʒ/ ("juice")', vi: 'Con chu môi, bật âm giống giơ nhưng có rung.', en: 'Round your lips and say j, like in jump.' },
  'ʒ': { show: '/ʒ/', vi: 'Con chu môi và rung cổ họng nhẹ.', en: 'Round your lips and buzz softly.' },
  's': { show: '/s/', vi: 'Con nhớ xì nhẹ một tiếng s ở cuối nhé.', en: 'Make a little snake sound at the end: sss.' },
  'z': { show: '/z/ ("zoo")', vi: 'Con rung cổ họng như tiếng con ong, zzz.', en: 'Buzz like a bee: zzz.' },
  'v': { show: '/v/', vi: 'Răng trên chạm nhẹ môi dưới, rồi rung lên nhé, đừng đọc thành d.', en: 'Top teeth on your bottom lip, and buzz: vvv.' },
  'f': { show: '/f/', vi: 'Răng trên chạm nhẹ môi dưới, rồi thổi hơi ra.', en: 'Top teeth on your bottom lip, and blow: fff.' },
  'ɹ': { show: '/r/', vi: 'Con cong lưỡi lên nhưng không chạm vòm miệng, môi hơi tròn.', en: 'Curl your tongue back, do not touch the top, round your lips.' },
  'r': { show: '/r/', vi: 'Con cong lưỡi lên nhưng không chạm vòm miệng, môi hơi tròn.', en: 'Curl your tongue back, do not touch the top, round your lips.' },
  'l': { show: '/l/', vi: 'Đầu lưỡi chạm nhẹ phía sau răng trên nhé.', en: 'Touch the back of your top teeth with your tongue.' },
  'æ': { show: '/æ/ ("cat")', vi: 'Con mở miệng thật rộng, đọc giữa a và e.', en: 'Open your mouth wide, like a big smile.' },
  'ɪ': { show: '/ɪ/ ("sit")', vi: 'Âm i ngắn và nhẹ thôi con.', en: 'Make it short and quick.' },
  'i': { show: '/iː/ ("green")', vi: 'Âm i kéo dài một chút, miệng cười nhé.', en: 'Smile and make it long: eee.' },
  'iː': { show: '/iː/ ("green")', vi: 'Âm i kéo dài một chút, miệng cười nhé.', en: 'Smile and make it long: eee.' },
  'u': { show: '/uː/ ("blue")', vi: 'Con chu tròn môi, kéo dài âm u.', en: 'Make a round mouth and say it long: ooo.' },
  'ʊ': { show: '/ʊ/ ("book")', vi: 'Âm u ngắn, môi hơi tròn.', en: 'Short and round.' },
  'ŋ': { show: '/ŋ/ ("sing")', vi: 'Giống âm ngờ cuối trong tiếng Việt.', en: 'Say it in your nose: ng.' },
  'oʊ': { show: '/oʊ/ ("no")', vi: 'Đọc ô rồi trượt sang u nhé.', en: 'Start with o, then close to u: oh-oo.' },
  'eɪ': { show: '/eɪ/ ("name")', vi: 'Đọc ê rồi trượt sang i nhé.', en: 'Say it like the letter A.' },
  'aɪ': { show: '/aɪ/ ("like")', vi: 'Đọc a rồi trượt sang i nhé.', en: 'Say it like the word "eye".' },
  'aʊ': { show: '/aʊ/ ("how")', vi: 'Đọc a rồi trượt sang u nhé.', en: 'Say it like "ow!" when something hurts.' },
  'ɝ': { show: '/ɜːr/ ("bird")', vi: 'Miệng hơi mở, cong lưỡi lên, ơ có r.', en: 'Curl your tongue and say er.' },
  'ɚ': { show: '/ər/ ("teacher")', vi: 'Âm ơ nhẹ, cong lưỡi lên ở cuối.', en: 'A soft er at the end.' },
  'h': { show: '/h/', vi: 'Con thở hơi nhẹ ra, hà.', en: 'Breathe out softly: hhh.' },
  'w': { show: '/w/', vi: 'Con chu tròn môi rồi mở ra.', en: 'Make a small round mouth, then open it.' },
};

const CONSONANTS = new Set(['p', 'b', 't', 'd', 'k', 'ɡ', 'g', 's', 'z', 'f', 'v', 'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'm', 'n', 'ŋ', 'l', 'ɹ', 'r']);

// Ghép câu Bông nói: song ngữ thì tiếng Việt xen từ tiếng Anh, chỉ tiếng Anh thì một câu tiếng Anh
function sayTip(viBefore, word, viAfter, enSentence) {
  return MODE === 'en' ? [en(enSentence)] : [vi(viBefore), en(word), vi(viAfter)];
}

function findFocus(res) {
  // 1) từ bị bỏ sót
  const omitted = res.words.find((w) => w.error === 'Omission');
  if (omitted) {
    return {
      word: omitted.word,
      show: t(`Con quên từ "${omitted.word}"`, `You missed "${omitted.word}"`),
      say: sayTip('Con nhớ nói cả từ', omitted.word, 'nữa nhé.', `Please say "${omitted.word}" too.`),
    };
  }
  // 2) âm vị điểm thấp nhất
  let worst = null;
  for (const w of res.words) {
    w.phonemes.forEach((p, idx) => {
      if (p.score < 60 && (!worst || p.score < worst.score)) {
        worst = { word: w.word, p: p.p, score: p.score, isFinal: idx === w.phonemes.length - 1 && w.phonemes.length > 1 };
      }
    });
  }
  if (worst) {
    const tip = TIPS[worst.p];
    const tipText = tip ? (MODE === 'en' ? tip.en : tip.vi) : '';
    if (worst.isFinal && CONSONANTS.has(worst.p)) {
      return {
        word: worst.word,
        phoneme: worst.p,
        show: t(`Âm cuối /${worst.p}/ trong "${worst.word}"`, `Last sound /${worst.p}/ in "${worst.word}"`) + (tipText ? ' · ' + tipText : ''),
        say: sayTip('Con nhớ đọc rõ âm cuối của từ', worst.word, tipText || 'nhé.', `Say the last sound of "${worst.word}" clearly. ${tipText}`),
      };
    }
    return {
      word: worst.word,
      phoneme: worst.p,
      show: `${tip ? tip.show : '/' + worst.p + '/'} ${t('trong', 'in')} "${worst.word}"${tipText ? ' · ' + tipText : ''}`,
      say: sayTip(
        'Con chú ý một âm trong từ',
        worst.word,
        tipText || 'Con nghe Bông đọc lại rồi nói theo nhé.',
        `Let's fix one sound in "${worst.word}". ${tipText || 'Listen and say it with me.'}`
      ),
    };
  }
  // 3) không có điểm âm vị (chế độ thử): từ điểm thấp nhất
  const low = [...res.words].sort((a, b) => a.score - b.score)[0];
  if (low && low.score < 60) {
    return {
      word: low.word,
      show: t(`Từ "${low.word}" chưa rõ`, `Say "${low.word}" more clearly`),
      say: sayTip('Con đọc rõ hơn từ', low.word, 'nhé.', `Say "${low.word}" more clearly.`),
    };
  }
  return null;
}

export function evaluate(res, s) {
  if (!res || res.noSpeech || !res.heard) {
    return {
      stars: 0,
      score: 0,
      emotion: 'encourage',
      title: t('Bông chưa nghe thấy con 👂', "I can't hear you 👂"),
      parts: [tr('Bông chưa nghe thấy con. Con bấm nút micro rồi nói to, rõ hơn nhé!', "I can't hear you. Press the mic and speak loudly!")],
      focus: null,
    };
  }
  const score = Math.round(res.pron ?? res.accuracy ?? 0);
  let stars = score >= s.greatScore ? 3 : score >= s.goodScore ? 2 : 1;
  if (res.completeness != null && res.completeness < 60) stars = Math.min(stars, 1);
  const focus = stars < 3 ? findFocus(res) : null;

  let parts, emotion, title;
  if (stars === 3) {
    title = pick(GREAT);
    parts = [en(title)];
    emotion = 'cheer';
  } else if (stars === 2) {
    title = pick(GOOD);
    parts = [en(title), ...(focus ? focus.say : [])];
    emotion = 'happy';
  } else {
    title = pick(TRY);
    parts = [en(title), ...(focus ? focus.say : [tr('Con nghe Bông đọc lại rồi nói theo nhé.', 'Listen and say it with me.')])];
    emotion = 'encourage';
  }
  return { stars, score, emotion, title, parts: parts.filter(Boolean), focus };
}

export function praiseEnd(avgStars) {
  if (avgStars >= 2.5) return [en('Fantastic! You are a star!'), tr('Hôm nay con học giỏi quá!')].filter(Boolean);
  if (avgStars >= 1.8) return [en('Great work today!'), tr('Con học tốt lắm, mai mình ôn lại nhé!', 'See you tomorrow!')].filter(Boolean);
  return [en('Good effort!'), tr('Con đã cố gắng rất nhiều. Mình luyện thêm nhé!', 'Keep practising, you are getting better!')].filter(Boolean);
}

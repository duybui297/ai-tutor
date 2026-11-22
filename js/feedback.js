// Biến điểm chấm thành lời khen / lời sửa thân thiện cho bé.
// Nguyên tắc: khen trước, mỗi lần chỉ sửa 1 lỗi, ưu tiên lỗi hay gặp của học sinh Việt.

export const en = (text) => ({ lang: 'en', text });
export const vi = (text) => ({ lang: 'vi', text });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const GREAT = ['Excellent!', 'Super!', 'Wow, great job!', 'Perfect!', 'Amazing!'];
const GOOD = ['Good job!', 'Well done!', 'Nice!', 'Very good!'];
const TRY = ['Good try!', 'Almost there!', 'Nice try!', "Let's try again!"];

// Mẹo đọc cho các âm hay sai. show: hiển thị; say: Bông đọc (không có ký hiệu lạ)
const TIPS = {
  'θ': { show: '/θ/ (như "three")', say: 'Con đặt đầu lưỡi giữa hai hàm răng, rồi thổi hơi nhẹ ra nhé.' },
  'ð': { show: '/ð/ (như "this")', say: 'Con đặt lưỡi giữa hai hàm răng, rồi rung cổ họng nhẹ nhé.' },
  'ʃ': { show: '/ʃ/ (như "she")', say: 'Con chu môi ra, đẩy hơi như khi ra hiệu im lặng, suỵt.' },
  'tʃ': { show: '/tʃ/ (như "chair")', say: 'Con chu môi, bật hơi mạnh, giống chờ nhưng mạnh hơn.' },
  'dʒ': { show: '/dʒ/ (như "juice")', say: 'Con chu môi, bật âm giống giơ nhưng có rung.' },
  'ʒ': { show: '/ʒ/', say: 'Con chu môi và rung cổ họng nhẹ.' },
  's': { show: '/s/', say: 'Con nhớ xì nhẹ một tiếng s ở cuối nhé.' },
  'z': { show: '/z/ (như "zoo")', say: 'Con rung cổ họng như tiếng con ong, zzz.' },
  'v': { show: '/v/', say: 'Răng trên chạm nhẹ môi dưới, rồi rung lên nhé, đừng đọc thành d.' },
  'f': { show: '/f/', say: 'Răng trên chạm nhẹ môi dưới, rồi thổi hơi ra.' },
  'ɹ': { show: '/r/', say: 'Con cong lưỡi lên nhưng không chạm vòm miệng, môi hơi tròn.' },
  'r': { show: '/r/', say: 'Con cong lưỡi lên nhưng không chạm vòm miệng, môi hơi tròn.' },
  'l': { show: '/l/', say: 'Đầu lưỡi chạm nhẹ phía sau răng trên nhé.' },
  'æ': { show: '/æ/ (như "cat")', say: 'Con mở miệng thật rộng, đọc giữa a và e.' },
  'ɪ': { show: '/ɪ/ (như "sit")', say: 'Âm i ngắn và nhẹ thôi con.' },
  'i': { show: '/iː/ (như "green")', say: 'Âm i kéo dài một chút, miệng cười nhé.' },
  'iː': { show: '/iː/ (như "green")', say: 'Âm i kéo dài một chút, miệng cười nhé.' },
  'u': { show: '/uː/ (như "blue")', say: 'Con chu tròn môi, kéo dài âm u.' },
  'ʊ': { show: '/ʊ/ (như "book")', say: 'Âm u ngắn, môi hơi tròn.' },
  'ŋ': { show: '/ŋ/ (như "sing")', say: 'Giống âm ngờ cuối trong tiếng Việt.' },
  'oʊ': { show: '/oʊ/ (như "no")', say: 'Đọc ô rồi trượt sang u nhé.' },
  'eɪ': { show: '/eɪ/ (như "name")', say: 'Đọc ê rồi trượt sang i nhé.' },
  'aɪ': { show: '/aɪ/ (như "like")', say: 'Đọc a rồi trượt sang i nhé.' },
  'aʊ': { show: '/aʊ/ (như "how")', say: 'Đọc a rồi trượt sang u nhé.' },
  'ɝ': { show: '/ɜːr/ (như "bird")', say: 'Miệng hơi mở, cong lưỡi lên, ơ có r.' },
  'ɚ': { show: '/ər/ (như "teacher")', say: 'Âm ơ nhẹ, cong lưỡi lên ở cuối.' },
  'h': { show: '/h/', say: 'Con thở hơi nhẹ ra, hà.' },
  'w': { show: '/w/', say: 'Con chu tròn môi rồi mở ra.' },
};

const CONSONANTS = new Set(['p', 'b', 't', 'd', 'k', 'ɡ', 'g', 's', 'z', 'f', 'v', 'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'm', 'n', 'ŋ', 'l', 'ɹ', 'r']);

function findFocus(res) {
  // 1) từ bị bỏ sót
  const omitted = res.words.find((w) => w.error === 'Omission');
  if (omitted) {
    return { word: omitted.word, show: `Con quên từ "${omitted.word}"`, say: [vi('Con nhớ nói cả từ'), en(omitted.word), vi('nữa nhé.')] };
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
    if (worst.isFinal && CONSONANTS.has(worst.p)) {
      return {
        word: worst.word,
        phoneme: worst.p,
        show: `Âm cuối /${worst.p}/ trong "${worst.word}"${tip ? ' · ' + tip.say : ''}`,
        say: [vi('Con nhớ đọc rõ âm cuối của từ'), en(worst.word), vi(tip ? tip.say : 'nhé.')],
      };
    }
    return {
      word: worst.word,
      phoneme: worst.p,
      show: `${tip ? tip.show : '/' + worst.p + '/'} trong "${worst.word}"${tip ? ' · ' + tip.say : ''}`,
      say: [vi('Con chú ý một âm trong từ'), en(worst.word), vi(tip ? tip.say : 'Con nghe Bông đọc lại rồi nói theo nhé.')],
    };
  }
  // 3) không có điểm âm vị (chế độ thử): từ điểm thấp nhất
  const low = [...res.words].sort((a, b) => a.score - b.score)[0];
  if (low && low.score < 60) {
    return { word: low.word, show: `Từ "${low.word}" chưa rõ`, say: [vi('Con đọc rõ hơn từ'), en(low.word), vi('nhé.')] };
  }
  return null;
}

export function evaluate(res, s) {
  if (!res || res.noSpeech || !res.heard) {
    return {
      stars: 0,
      score: 0,
      emotion: 'encourage',
      title: 'Bông chưa nghe thấy con 👂',
      parts: [vi('Bông chưa nghe thấy con. Con bấm nút micro rồi nói to, rõ hơn nhé!')],
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
    parts = [en(title), ...(focus ? focus.say : [vi('Con nghe Bông đọc lại rồi nói theo nhé.')])];
    emotion = 'encourage';
  }
  return { stars, score, emotion, title, parts, focus };
}

export function praiseEnd(avgStars) {
  if (avgStars >= 2.5) return [en('Fantastic! You are a star!'), vi('Hôm nay con học giỏi quá!')];
  if (avgStars >= 1.8) return [en('Great work today!'), vi('Con học tốt lắm, mai mình ôn lại nhé!')];
  return [en('Good effort!'), vi('Con đã cố gắng rất nhiều. Mình luyện thêm nhé!')];
}

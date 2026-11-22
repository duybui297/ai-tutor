// Hình miệng cho 22 viseme của Azure (0–21).
// Mỗi giá trị: [độ mở miệng 0..1, độ rộng miệng 0..1]
// 0 im lặng · 1 æ ə ʌ · 2 ɑ · 3 ɔ · 4 ɛ ʊ · 5 ɝ · 6 j i ɪ · 7 w u · 8 o · 9 aʊ · 10 ɔɪ
// 11 aɪ · 12 h · 13 ɹ · 14 l · 15 s z · 16 ʃ tʃ dʒ ʒ · 17 ð · 18 f v · 19 d t n θ · 20 k g ŋ · 21 p b m
export const VISEME_SHAPES = [
  [0.0, 0.5], [0.6, 0.6], [0.9, 0.5], [0.7, 0.3], [0.5, 0.6], [0.4, 0.4],
  [0.3, 0.9], [0.3, 0.1], [0.6, 0.2], [0.8, 0.4], [0.6, 0.3], [0.8, 0.6],
  [0.4, 0.5], [0.3, 0.3], [0.35, 0.5], [0.15, 0.8], [0.25, 0.3], [0.2, 0.6],
  [0.15, 0.6], [0.2, 0.6], [0.3, 0.5], [0.0, 0.5],
];

export function shapeFor(id) {
  const s = VISEME_SHAPES[id] || VISEME_SHAPES[0];
  return { open: s[0], wide: s[1] };
}

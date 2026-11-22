// =============================================================
//  BÀI HỌC — anh có thể sửa / thêm bài theo sách của con
// =============================================================
//  Mỗi bài (unit) gồm:
//   id        : mã bài, không trùng
//   emoji     : hình đại diện
//   titleEn   : tên tiếng Anh, titleVi: tên tiếng Việt
//   words     : từ vựng  { en, vi, emoji }
//   sentences : mẫu câu  { en, vi, emoji }
//   chat      : phần trò chuyện cuối bài
//      goal      : mục tiêu (gửi cho AI)
//      questions : câu hỏi gợi ý { ask, model } — model là câu trả lời mẫu
// -------------------------------------------------------------

export const UNITS = [
  {
    id: 'hello',
    emoji: '👋',
    titleEn: 'Hello!',
    titleVi: 'Xin chào',
    words: [
      { en: 'hello', vi: 'xin chào', emoji: '👋' },
      { en: 'goodbye', vi: 'tạm biệt', emoji: '🙋' },
      { en: 'friend', vi: 'bạn bè', emoji: '🧑‍🤝‍🧑' },
      { en: 'teacher', vi: 'giáo viên', emoji: '👩‍🏫' },
      { en: 'name', vi: 'tên', emoji: '🏷️' },
      { en: 'nice', vi: 'tốt, vui', emoji: '😊' },
    ],
    sentences: [
      { en: 'Hello, I am Bong.', vi: 'Xin chào, mình là Bông.', emoji: '🐰' },
      { en: 'How are you?', vi: 'Bạn khỏe không?', emoji: '🙂' },
      { en: 'I am fine, thank you.', vi: 'Mình khỏe, cảm ơn.', emoji: '👍' },
      { en: 'Nice to meet you.', vi: 'Rất vui được gặp bạn.', emoji: '🤝' },
    ],
    chat: {
      goal: 'Greet each other, ask the child\'s name and how they are, say nice to meet you, say goodbye.',
      questions: [
        { ask: "Hello! What's your name?", model: 'My name is Nam.' },
        { ask: 'How are you today?', model: 'I am fine, thank you.' },
        { ask: 'I am Bong. Nice to meet you!', model: 'Nice to meet you too.' },
        { ask: 'Who is your friend?', model: 'My friend is Lan.' },
      ],
    },
  },
  {
    id: 'school',
    emoji: '🎒',
    titleEn: 'My school things',
    titleVi: 'Đồ dùng học tập',
    words: [
      { en: 'pen', vi: 'bút mực', emoji: '🖊️' },
      { en: 'pencil', vi: 'bút chì', emoji: '✏️' },
      { en: 'book', vi: 'quyển sách', emoji: '📕' },
      { en: 'ruler', vi: 'thước kẻ', emoji: '📏' },
      { en: 'eraser', vi: 'cục tẩy', emoji: '🧽' },
      { en: 'school bag', vi: 'cặp sách', emoji: '🎒' },
    ],
    sentences: [
      { en: 'This is my pen.', vi: 'Đây là bút của mình.', emoji: '🖊️' },
      { en: 'Is this your book?', vi: 'Đây có phải sách của bạn không?', emoji: '📕' },
      { en: 'Yes, it is.', vi: 'Đúng vậy.', emoji: '✅' },
      { en: 'No, it is not.', vi: 'Không phải.', emoji: '❌' },
    ],
    chat: {
      goal: 'Talk about school things: name them, ask "Is this your ...?" and answer yes/no.',
      questions: [
        { ask: 'What is in your school bag?', model: 'I have a book and a pencil.' },
        { ask: 'Is this your ruler?', model: 'Yes, it is.' },
        { ask: 'Do you have an eraser?', model: 'Yes, I do.' },
      ],
    },
  },
  {
    id: 'colours',
    emoji: '🎨',
    titleEn: 'Colours',
    titleVi: 'Màu sắc',
    words: [
      { en: 'red', vi: 'màu đỏ', emoji: '🔴' },
      { en: 'blue', vi: 'màu xanh dương', emoji: '🔵' },
      { en: 'green', vi: 'màu xanh lá', emoji: '🟢' },
      { en: 'yellow', vi: 'màu vàng', emoji: '🟡' },
      { en: 'pink', vi: 'màu hồng', emoji: '🌸' },
      { en: 'orange', vi: 'màu cam', emoji: '🟠' },
    ],
    sentences: [
      { en: 'What colour is it?', vi: 'Nó màu gì?', emoji: '🎨' },
      { en: 'It is blue.', vi: 'Nó màu xanh dương.', emoji: '🔵' },
      { en: 'My bag is red.', vi: 'Cặp của mình màu đỏ.', emoji: '🎒' },
      { en: 'I like green.', vi: 'Mình thích màu xanh lá.', emoji: '💚' },
    ],
    chat: {
      goal: 'Ask and answer about colours of things around the child and favourite colours.',
      questions: [
        { ask: 'What colour do you like?', model: 'I like pink.' },
        { ask: 'What colour is your bag?', model: 'It is blue.' },
        { ask: 'What colour is a banana?', model: 'It is yellow.' },
      ],
    },
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    titleEn: 'My family',
    titleVi: 'Gia đình',
    words: [
      { en: 'father', vi: 'bố', emoji: '👨' },
      { en: 'mother', vi: 'mẹ', emoji: '👩' },
      { en: 'brother', vi: 'anh/em trai', emoji: '👦' },
      { en: 'sister', vi: 'chị/em gái', emoji: '👧' },
      { en: 'grandma', vi: 'bà', emoji: '👵' },
      { en: 'grandpa', vi: 'ông', emoji: '👴' },
    ],
    sentences: [
      { en: 'This is my mother.', vi: 'Đây là mẹ của mình.', emoji: '👩' },
      { en: 'Who is that?', vi: 'Đó là ai?', emoji: '❓' },
      { en: 'He is my brother.', vi: 'Đó là anh/em trai mình.', emoji: '👦' },
      { en: 'I love my family.', vi: 'Mình yêu gia đình mình.', emoji: '❤️' },
    ],
    chat: {
      goal: 'Talk about family members using "This is my...", "He/She is my...". Do not ask for real names.',
      questions: [
        { ask: 'Do you have a brother or a sister?', model: 'I have a sister.' },
        { ask: 'Who do you love?', model: 'I love my mother.' },
        { ask: 'Is your grandma nice?', model: 'Yes, she is.' },
      ],
    },
  },
  {
    id: 'animals',
    emoji: '🐶',
    titleEn: 'Animals',
    titleVi: 'Con vật',
    words: [
      { en: 'cat', vi: 'con mèo', emoji: '🐱' },
      { en: 'dog', vi: 'con chó', emoji: '🐶' },
      { en: 'bird', vi: 'con chim', emoji: '🐦' },
      { en: 'fish', vi: 'con cá', emoji: '🐟' },
      { en: 'rabbit', vi: 'con thỏ', emoji: '🐰' },
      { en: 'elephant', vi: 'con voi', emoji: '🐘' },
    ],
    sentences: [
      { en: 'I like cats.', vi: 'Mình thích mèo.', emoji: '🐱' },
      { en: 'Do you like dogs?', vi: 'Bạn có thích chó không?', emoji: '🐶' },
      { en: 'Yes, I do.', vi: 'Có, mình thích.', emoji: '👍' },
      { en: 'The bird can fly.', vi: 'Con chim biết bay.', emoji: '🐦' },
    ],
    chat: {
      goal: 'Talk about animals the child likes, using "I like ..." and "Do you like ...? Yes, I do / No, I don\'t."',
      questions: [
        { ask: 'What animal do you like?', model: 'I like rabbits.' },
        { ask: 'Do you like fish?', model: 'Yes, I do.' },
        { ask: 'Can a fish fly?', model: 'No, it can not.' },
      ],
    },
  },
  {
    id: 'food',
    emoji: '🍎',
    titleEn: 'Food and drinks',
    titleVi: 'Đồ ăn, thức uống',
    words: [
      { en: 'rice', vi: 'cơm', emoji: '🍚' },
      { en: 'bread', vi: 'bánh mì', emoji: '🍞' },
      { en: 'milk', vi: 'sữa', emoji: '🥛' },
      { en: 'water', vi: 'nước', emoji: '💧' },
      { en: 'apple', vi: 'quả táo', emoji: '🍎' },
      { en: 'banana', vi: 'quả chuối', emoji: '🍌' },
    ],
    sentences: [
      { en: 'I would like some milk.', vi: 'Mình muốn một ít sữa.', emoji: '🥛' },
      { en: 'What do you like?', vi: 'Bạn thích gì?', emoji: '❓' },
      { en: 'I like apples.', vi: 'Mình thích táo.', emoji: '🍎' },
      { en: 'Thank you very much.', vi: 'Cảm ơn rất nhiều.', emoji: '🙏' },
    ],
    chat: {
      goal: 'Pretend to be at a small snack shop: ask what the child would like, and practise "I would like..." and "Thank you".',
      questions: [
        { ask: 'Hello! What would you like?', model: 'I would like some milk.' },
        { ask: 'Do you like bananas?', model: 'Yes, I do.' },
        { ask: 'Here you are!', model: 'Thank you very much.' },
      ],
    },
  },
];

// TRÒ CHUYỆN TỰ DO — chủ đề tổng hợp, dùng nút "💬 Trò chuyện" ở trang chủ
export const FREE_TALK = {
  id: 'free',
  emoji: '💬',
  titleEn: 'Free talk',
  titleVi: 'Trò chuyện tự do',
  words: UNITS.flatMap((u) => u.words.slice(0, 3)),
  sentences: UNITS.flatMap((u) => u.sentences.slice(0, 2)),
  chat: {
    goal: 'Friendly everyday small talk with a grade-3 child about themselves: name, age, how they feel, family, favourite colour, animals, food, school things. Mix topics naturally; follow what the child likes.',
    questions: [
      { ask: "Hello! What's your name?", model: 'My name is Nam.' },
      { ask: 'How old are you?', model: 'I am eight years old.' },
      { ask: 'How are you today?', model: 'I am happy.' },
      { ask: 'What colour do you like?', model: 'I like blue.' },
      { ask: 'Do you have a pet?', model: 'Yes, I have a dog.' },
      { ask: 'What food do you like?', model: 'I like rice and chicken.' },
      { ask: 'Who is in your family?', model: 'My father, my mother and me.' },
      { ask: 'What is in your school bag?', model: 'I have a book and a pen.' },
    ],
  },
};

// Tìm một mục (từ / câu) theo chữ tiếng Anh — dùng cho phần ôn tập
export function findItem(text) {
  for (const u of UNITS) {
    for (const it of [...u.words, ...u.sentences]) {
      if (it.en === text) return { ...it, unitId: u.id };
    }
  }
  return null;
}

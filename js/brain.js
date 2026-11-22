// "Bộ não" cho phần trò chuyện.
//  - GeminiBrain: dùng Gemini API (gói miễn phí), tự phát hiện và sửa mọi lỗi câu
//  - ScriptedBrain: không cần key, hỏi theo câu có sẵn + bắt lỗi hay gặp (grammar.js)
// Mỗi câu trả lời có thể kèm "fix": { wrong, right, explain_vi } — app sẽ chỉ ra câu đúng
// và cho bé nói lại câu đúng trước khi trò chuyện tiếp.
// Chỉ gửi CHỮ (câu bé nói đã chuyển thành văn bản), không gửi giọng nói.
import { checkGrammar } from './grammar.js';
import { geminiProxy } from './cloud.js';

const EMOTIONS = ['neutral', 'happy', 'cheer', 'think', 'encourage'];

function systemPrompt(unit, maxTurns, lang = 'vi') {
  const vocab = unit.words.map((w) => w.en).join(', ');
  const patterns = unit.sentences.map((s) => s.en).join(' | ');
  const qs = unit.chat.questions.map((q) => `- ${q.ask} (model answer: ${q.model})`).join('\n');
  return `You are "Bong", a cheerful bunny English tutor in an app for a Vietnamese child in grade 3 (about 8 years old, beginner, CEFR pre-A1).
Topic: "${unit.titleEn}". Goal: ${unit.chat.goal}
Useful words: ${vocab}
Sentence patterns: ${patterns}
Suggested questions:
${qs}

How to talk:
- Very simple English: at most 2 short sentences, each under 10 words. Ask exactly ONE simple question per turn.
- React to what the child MEANT (e.g. "Nice to meet you, Evan!"), then ask the next question.
- The child's first name or nickname is fine to use. Never ask for or repeat other personal info (address, school name, phone, photos).
- Child-safe topics only. If the child goes off topic, gently bring them back.

How to correct (very important):
- Look at the child's sentence. If it has a grammar or word mistake that matters for a beginner
  (wrong be-verb "My name are Evan", "I is"; wrong have/has; missing -s "She like cats"; missing "is"/"am" "It blue";
  "a apple"; "eight year old"; wrong word order; wrong word), fill the fix fields:
    fix_wrong: the child's sentence as heard,
    fix_right: the corrected FULL sentence, keeping the child's meaning and words as much as possible (e.g. "My name is Evan."),
    fix_explain_vi: ONE short, kind Vietnamese explanation for an 8-year-old, under 15 words, e.g. "Với my name, mình dùng is con nhé."
- If the child answered with only one or two words (e.g. "Evan", "blue"), that is OK for a beginner: you MAY give fix_right as the full sentence ("My name is Evan.") with fix_explain_vi "Con nói cả câu nhé." Do this at most once every two turns.
- If the child spoke Vietnamese, leave fix_wrong empty, put the English sentence they meant in fix_right, and fix_explain_vi "Con nói bằng tiếng Anh thế này nhé."
- Ignore capitalisation, punctuation, "um", and tiny speech-recognition noise. Correct only ONE thing per turn. Never say "wrong" or "no".
- If there is no mistake, leave all three fix fields as empty strings and praise specifically.
- When you give a fix, the app will first make the child repeat fix_right. So "say_en" must NOT repeat the correction; it should only react kindly and ask the next question.
- "say_vi" is optional, very short warm Vietnamese (xưng "Bông", gọi "con"); usually empty.

The conversation has ${maxTurns} turns. On the last turn, praise the child, say goodbye, and set "end" to true.
Reply ONLY with JSON: {"say_en": string, "say_vi": string, "emotion": one of ${EMOTIONS.join('|')}, "end": boolean, "fix_wrong": string, "fix_right": string, "fix_explain_vi": string}${lang === 'en' ? ENGLISH_ONLY : ''}`;
}

// Chế độ chỉ tiếng Anh: ghi đè các quy tắc tiếng Việt ở trên
const ENGLISH_ONLY = `

LANGUAGE MODE: ENGLISH ONLY (this overrides the rules above).
- Never use Vietnamese anywhere. "say_vi" must always be "".
- Write "fix_explain_vi" in very simple English, under 10 words, e.g. "We say: my name IS." or "With I, we use am."
- If the child speaks Vietnamese, leave fix_wrong empty, put the English sentence in fix_right, and fix_explain_vi "You can say it like this."
- If the child seems lost, give a very easy choice question (e.g. "Red or blue?").`;

// Lấy đối tượng JSON từ câu trả lời, kể cả khi có ```json ... ``` hoặc chữ thừa
function parseJSON(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no json');
  return JSON.parse(text.slice(a, b + 1));
}

function toFix(wrong, right, why) {
  right = String(right || '').trim();
  if (!right) return null;
  const same = String(wrong || '').toLowerCase().replace(/[^a-z ]/g, '').trim() === right.toLowerCase().replace(/[^a-z ]/g, '').trim();
  if (same) return null;
  return { wrong: String(wrong || '').trim(), right, explain_vi: String(why || '').trim() };
}

// Thứ tự thử mô hình: mô hình đã chạy được lần trước → mô hình trong Cài đặt → các mô hình dự phòng.
// (Kiểm tra 21/11/2026: gemini-2.5-flash trả lời ~2 giây; gemini-flash-latest báo quá tải;
//  gemini-3.5/3.8-flash treo > 45 giây.)
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'];
const TIMEOUT_MS = 15000;

export class GeminiBrain {
  // cloudInfo: khi chạy trên Vercel không có key trong trình duyệt → gọi qua /api/gemini
  constructor(settings, cloudInfo = null) {
    this.key = settings.geminiKey;
    this.useProxy = !settings.geminiKey && !!cloudInfo?.gemini;
    this.pass = settings.appPassword;
    this.lang = settings.langMode === 'en' ? 'en' : 'vi';
    let working = null;
    try { working = localStorage.getItem('bong.geminiModel'); } catch { /* bỏ qua */ }
    this.models = [...new Set([working, settings.geminiModel, ...FALLBACK_MODELS].filter(Boolean))];
    this.defaultTurns = settings.chatTurns || 4;
  }

  _payload(useSchema) {
    // Không đặt maxOutputTokens: mô hình "biết suy nghĩ" dùng token để nghĩ, giới hạn thấp sẽ cắt cụt JSON
    const generationConfig = { temperature: 0.6, responseMimeType: 'application/json' };
    if (useSchema) {
      generationConfig.responseSchema = {
        type: 'OBJECT',
        properties: {
          say_en: { type: 'STRING' },
          say_vi: { type: 'STRING' },
          emotion: { type: 'STRING', enum: EMOTIONS },
          end: { type: 'BOOLEAN' },
          fix_wrong: { type: 'STRING' },
          fix_right: { type: 'STRING' },
          fix_explain_vi: { type: 'STRING' },
        },
        required: ['say_en', 'emotion', 'end', 'fix_right'],
      };
    }
    return { system_instruction: { parts: [{ text: this.sys }] }, contents: this.history, generationConfig };
  }

  // Gọi 1 mô hình; trả về đối tượng JSON hoặc ném lỗi
  async _try(model, useSchema) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = this.useProxy
        ? await geminiProxy(this.pass, model, this._payload(useSchema), ctrl.signal)
        : await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.key },
            body: JSON.stringify(this._payload(useSchema)),
            signal: ctrl.signal,
          });
      const raw = await res.text();
      if (!res.ok) {
        let msg = raw.slice(0, 160);
        try { const j = JSON.parse(raw); msg = String(j.error?.message || j.error).slice(0, 160); } catch { /* giữ nguyên */ }
        const err = new Error(`${res.status} ${msg}`);
        err.status = res.status;
        throw err;
      }
      const data = JSON.parse(raw);
      const cand = data?.candidates?.[0];
      // bỏ phần "suy nghĩ" của mô hình, chỉ lấy câu trả lời
      const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      try {
        return parseJSON(text);
      } catch {
        console.warn('Gemini', model, 'trả về không phải JSON:', cand?.finishReason, data?.promptFeedback, text);
        throw new Error('trả lời sai định dạng' + (cand?.finishReason ? ` (${cand.finishReason})` : ''));
      }
    } catch (e) {
      if (e.name === 'AbortError') throw new Error(`quá ${TIMEOUT_MS / 1000} giây chưa trả lời`);
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  async _call() {
    const errors = [];
    for (const model of this.models) {
      for (const useSchema of [true, false]) {
        try {
          const out = await this._try(model, useSchema);
          if (model !== this.models[0]) {
            // nhớ mô hình chạy được để lần sau thử nó trước
            this.models = [model, ...this.models.filter((m) => m !== model)];
            try { localStorage.setItem('bong.geminiModel', model); } catch { /* bỏ qua */ }
            console.info('Gemini: dùng mô hình', model);
          }
          this.history.push({ role: 'model', parts: [{ text: JSON.stringify(out) }] });
          return {
            say_en: String(out.say_en || ''),
            say_vi: String(out.say_vi || ''),
            emotion: EMOTIONS.includes(out.emotion) ? out.emotion : 'happy',
            end: !!out.end,
            fix: toFix(out.fix_wrong, out.fix_right, out.fix_explain_vi),
          };
        } catch (e) {
          errors.push(`${model}: ${e.message}`);
          // sai key / hết quota thì đổi mô hình cũng vô ích
          if (e.status === 401 || e.status === 403) throw new Error('Gemini từ chối key: ' + e.message);
          // chỉ thử lại không-schema khi lỗi định dạng hoặc 400; còn quá tải/treo thì sang mô hình khác luôn
          if (!(e.status === 400 || /định dạng/.test(e.message))) break;
        }
      }
    }
    throw new Error('Gemini chưa trả lời được — ' + errors.slice(-3).join(' | '));
  }

  async start(unit, maxTurns) {
    this.unit = unit;
    this.turn = 0;
    this.maxTurns = maxTurns || this.defaultTurns;
    this.sys = systemPrompt(unit, this.maxTurns, this.lang);
    this.history = [{ role: 'user', parts: [{ text: '[Start] Greet the child briefly and ask your first question. No fix on this turn.' }] }];
    const out = await this._call();
    out.fix = null;
    return out;
  }

  async reply({ text, lang }) {
    this.turn++;
    const said = text ? `Child said (${lang}): "${text}"` : 'Child was silent or could not be understood.';
    this.history.push({ role: 'user', parts: [{ text: `[Turn ${this.turn}/${this.maxTurns}] ${said}` }] });
    const out = await this._call();
    if (this.turn >= this.maxTurns) out.end = true;
    return out;
  }
}

export class ScriptedBrain {
  constructor(settings) {
    this.defaultTurns = settings?.chatTurns || 4;
    this.lang = settings?.langMode === 'en' ? 'en' : 'vi';
  }

  _ask() {
    const q = this.unit.chat.questions[this.i];
    if (!q || this.i >= this.maxTurns) {
      return { say_en: 'You did a great job today! Bye bye!', say_vi: this.lang === 'en' ? '' : 'Con giỏi lắm! Hẹn gặp lại con nhé.', emotion: 'cheer', end: true, fix: null };
    }
    return { say_en: q.ask, say_vi: '', emotion: 'happy', end: false, fix: null };
  }

  async start(unit, maxTurns) {
    this.unit = unit;
    this.i = 0;
    this.maxTurns = maxTurns || this.defaultTurns;
    const first = this._ask();
    return { ...first, say_en: "Let's talk! " + first.say_en };
  }

  async reply({ text, lang }) {
    const q = this.unit.chat.questions[this.i];
    this.i++;
    const next = this._ask();
    const english = text && lang.startsWith('en') && /[a-z]/i.test(text);
    if (!english) {
      // im lặng hoặc nói tiếng Việt → đưa câu mẫu để bé nói lại
      return { ...next, say_en: next.say_en, emotion: 'encourage', fix: q ? toFix('', q.model, this.lang === 'en' ? 'You can say it like this.' : 'Con nói bằng tiếng Anh thế này nhé.') : null };
    }
    const fix = checkGrammar(text, this.lang);
    // không có Gemini thì không chắc câu đã đúng hết → chỉ cảm ơn, không khen "đúng"
    return { ...next, say_en: (fix ? 'Good try! ' : 'Thank you! ') + next.say_en, emotion: fix ? 'encourage' : 'happy', fix };
  }
}

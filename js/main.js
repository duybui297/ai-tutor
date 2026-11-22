// Điều khiển bài học: Bông đọc mẫu → bé nói → chấm → khen/sửa → trò chuyện → tổng kết
import { loadSettings, saveSettings } from './config.js';
import { UNITS, FREE_TALK, findItem } from './lessons.js';
import { Avatar } from './avatar.js';
import { AzureSpeech } from './speech-azure.js';
import { BrowserSpeech } from './speech-browser.js';
import { GeminiBrain, ScriptedBrain } from './brain.js';
import { evaluate, praiseEnd, en, vi, tr, t, englishOnly, setLangMode } from './feedback.js';
import * as progress from './progress.js';
import { checkGrammar } from './grammar.js';
import { cloud, detectCloud } from './cloud.js';

const $ = (s) => document.querySelector(s);
const show = (el, on = true) => el.classList.toggle('hidden', !on);
const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

let settings = loadSettings();
let speech, brain, audioCtx;
let run = null;
const avatar = new Avatar($('#avatar'));

class Aborted extends Error {}

// ---------- engines ----------
const hasAzure = () => (!!settings.azureKey || cloud.azure) && AzureSpeech.available();
const hasGemini = () => !!settings.geminiKey || cloud.gemini;

function setupEngines() {
  setLangMode(settings.langMode);
  renderLangToggle();
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  speech?.stop?.();
  speech = hasAzure() ? new AzureSpeech(settings, audioCtx, cloud) : new BrowserSpeech(settings);
  brain = hasGemini() ? new GeminiBrain(settings, cloud) : new ScriptedBrain(settings);
  avatar.mouthSource = () => speech.mouth();
  if (cloud.error) {
    $('#mode').textContent = `🔒 ${cloud.error} — vào Phụ huynh → Cài đặt nhập mật khẩu app`;
    return;
  }
  const where = cloud.ok ? ' (máy chủ)' : '';
  const a = settings.azureKey || cloud.azure
    ? AzureSpeech.available() ? '🎯 Azure: chấm từng âm' + where : '⚠️ Chưa tải được Azure SDK (kiểm tra mạng)'
    : '🧪 Chế độ thử: chưa có key Azure';
  const g = hasGemini() ? '🧠 Gemini' + where : '📜 Hội thoại mẫu';
  $('#mode').textContent = `${a} · ${g}`;
}

async function initEngines() {
  await detectCloud(settings.appPassword);
  setupEngines();
}

// ---------- chế độ ngôn ngữ ----------
function renderLangToggle() {
  for (const b of document.querySelectorAll('#lang-toggle button')) {
    b.classList.toggle('on', b.dataset.lang === settings.langMode);
  }
}

function setLang(mode) {
  if (run) return; // không đổi giữa bài
  settings = { ...settings, langMode: mode };
  saveSettings(settings);
  setupEngines();
  renderHome();
  toast(mode === 'en' ? '🇬🇧 English only — Bông chỉ nói tiếng Anh' : '🇻🇳 Song ngữ — Bông giải thích bằng tiếng Việt');
}

// ---------- tiện ích ----------
function check() {
  if (!run || run.aborted) throw new Aborted();
}
function guard(p) {
  check();
  return Promise.race([p, run.abortPromise]);
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  show(t, true);
  clearTimeout(toast.h);
  toast.h = setTimeout(() => show(t, false), 6000);
}
function showError(e) {
  console.error(e);
  toast('⚠️ ' + (e?.message || e));
}
function setSubtitle(parts) {
  $('#subtitle').innerHTML = parts
    .filter((p) => p.text)
    .map((p) => (p.lang === 'en' ? `<b>${esc(p.text)}</b>` : `<span>${esc(p.text)}</span>`))
    .join(' ');
}
const slowOn = () => $('#slow').checked;

async function say(parts, emotion, { slow = false } = {}) {
  check();
  parts = parts.filter((p) => p && p.text);
  if (emotion) avatar.setEmotion(emotion);
  setSubtitle(parts);
  try {
    await guard(speech.speak(parts, { slow }));
  } catch (e) {
    if (e instanceof Aborted) throw e;
    showError(e);
  }
  check();
}

function waitMic(hint = t('Bấm micro rồi nói nhé!', 'Press the mic and speak!')) {
  check();
  const btn = $('#mic');
  btn.disabled = false;
  btn.classList.add('ready');
  $('#micHint').textContent = hint;
  return guard(
    new Promise((resolve) => {
      btn.onclick = () => {
        btn.onclick = null;
        btn.disabled = true;
        btn.classList.remove('ready');
        if (audioCtx?.state === 'suspended') audioCtx.resume();
        resolve();
      };
    })
  );
}

async function listening(fn) {
  avatar.setListening(true);
  $('#mic').classList.add('listening');
  $('#micHint').textContent = t('Bông đang nghe con nói… 👂', 'Bong is listening… 👂');
  try {
    return await guard(fn());
  } finally {
    avatar.setListening(false);
    $('#mic').classList.remove('listening');
    $('#micHint').textContent = '';
  }
}

// ---------- màn hình ----------
function showScreen(name) {
  for (const id of ['home', 'lesson', 'summary']) show($('#' + id), id === name);
  if (name === 'home') renderHome();
}

function renderHome() {
  $('#units').innerHTML = UNITS.map((u) => {
    const s = progress.unitStars(u.id);
    return `<button class="unit" data-id="${u.id}">
      <span class="u-emoji">${u.emoji}</span>
      <span class="u-en">${esc(u.titleEn)}</span>
      <span class="u-vi">${esc(u.titleVi)}</span>
      <span class="u-stars">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>
    </button>`;
  }).join('');
  const m = progress.todayMinutes();
  $('#today').textContent = `Hôm nay con đã học ${m}/${settings.dailyMinutes} phút`;
  $('#subtitle').innerHTML = `<span>${t('Chào con! Con chọn một bài để học cùng Bông nhé 🐰', 'Hi! Pick a lesson and learn with Bong 🐰')}</span>`;
}

function setStage(text) {
  $('#stage-name').textContent = text;
}

function renderDots() {
  $('#dots').innerHTML = Array.from({ length: run.total }, (_, i) => `<i class="${i < run.done ? 'done' : i === run.done ? 'now' : ''}"></i>`).join('');
}

function showCard(item) {
  show($('#card'), true);
  show($('#chat'), false);
  $('#c-emoji').textContent = item.emoji || '💬';
  $('#c-text').textContent = item.en;
  $('#c-vi').textContent = englishOnly() ? '' : item.vi || '';
  $('#result').innerHTML = '';
}

function cls(score) {
  return score >= settings.greatScore ? 'good' : score >= settings.goodScore ? 'ok' : 'bad';
}

function showResult(fb, res) {
  const stars = `<div class="stars">${'★'.repeat(fb.stars)}<span>${'★'.repeat(3 - fb.stars)}</span></div>`;
  let html = `${stars}<div class="r-title">${esc(fb.title)}${res && !res.noSpeech ? ` <small>${fb.score} ${t('điểm', 'points')}</small>` : ''}</div>`;
  if (res && !res.noSpeech) {
    html += `<div class="heard">${t('Bông nghe được', 'Bong heard')}: “${esc(res.heard)}”</div>`;
    html += '<div class="words">' + res.words.map((w) => `<span class="chip ${cls(w.score)}">${esc(w.word)}</span>`).join('') + '</div>';
    const fw = fb.focus && res.words.find((w) => w.word.toLowerCase() === String(fb.focus.word).toLowerCase());
    if (fw && fw.phonemes.length) {
      html += '<div class="phonemes">' + fw.phonemes.map((p) => `<span class="ph ${cls(p.score)}">/${esc(p.p)}/</span>`).join('') + '</div>';
    }
    if (fb.focus) html += `<div class="tip">💡 ${esc(fb.focus.show)}</div>`;
    if (res.approximate) html += '<div class="note">(Chế độ thử: chấm gần đúng theo chữ. Thêm key Azure để chấm tới từng âm.)</div>';
  }
  $('#result').innerHTML = html;
}

function addBubble(who, text, sub) {
  const div = document.createElement('div');
  div.className = 'bubble ' + who;
  div.innerHTML = `${who === 'bong' ? '🐰 ' : '🧒 '}${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
  $('#chat-log').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// ---------- các bước học ----------
async function practiceItem(item) {
  showCard(item);
  let fb = null;
  for (let attempt = 0; attempt < settings.maxTries; attempt++) {
    run.lastModel = item.en;
    if (attempt === 0) await say([en(item.en)], 'neutral', { slow: slowOn() });
    else await say([tr('Con nghe lại nhé.', 'Listen again.'), en(item.en)], 'neutral', { slow: true });

    await waitMic();
    let res = null;
    try {
      res = await listening(() => speech.assess(item.en));
    } catch (e) {
      if (e instanceof Aborted) throw e;
      throw new Error('Không nghe được micro: ' + (e.message || e) + '. Anh kiểm tra quyền micro hoặc key Azure nhé.');
    }
    fb = evaluate(res, settings);
    showResult(fb, res);
    if (res && !res.noSpeech) progress.recordAttempt(item.en, res, fb.stars);

    if (fb.stars >= 2) {
      await say(fb.parts, fb.emotion);
      break;
    }
    if (attempt === settings.maxTries - 1) {
      await say([en('Good effort!'), tr('Mình sẽ ôn lại phần này sau nhé.', 'We will practise it again later.')], 'encourage');
      break;
    }
    await say(fb.parts, fb.emotion);
  }
  run.stars.push(fb ? fb.stars : 0);
  run.done++;
  renderDots();
}

// Bông chỉ ra câu đúng, giải thích ngắn, rồi cho bé nói lại và chấm phát âm câu đúng
function addFixBubble(fix) {
  const div = document.createElement('div');
  div.className = 'bubble fix';
  div.innerHTML =
    (fix.wrong ? `<div class="wrong">✗ ${esc(fix.wrong)}</div>` : '') +
    `<div class="right">✓ ${esc(fix.right)}</div>` +
    (fix.explain_vi ? `<small>💡 ${esc(fix.explain_vi)}</small>` : '') +
    '<div class="fix-res"></div>';
  $('#chat-log').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return div;
}

async function practiceFix(fix) {
  const bubble = addFixBubble(fix);
  const resBox = bubble.querySelector('.fix-res');
  run.lastModel = fix.right;
  const intro = fix.wrong ? 'Con nên nói là:' : 'Con có thể trả lời bằng tiếng Anh thế này:';
  const parts = [tr(intro, fix.wrong ? 'We say:' : 'You can say:'), en(fix.right)];
  if (fix.explain_vi && fix.wrong) parts.push(englishOnly() ? en(fix.explain_vi) : vi(fix.explain_vi));
  parts.push(tr('Con nói lại theo Bông nhé.', 'Now you say it!'));
  await say(parts, 'encourage');

  let best = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    await waitMic(t('Bấm micro rồi nói lại câu đúng nhé!', 'Press the mic and say it again!'));
    let res = null;
    try {
      res = await listening(() => speech.assess(fix.right));
    } catch (e) {
      if (e instanceof Aborted) throw e;
      showError(e);
      break;
    }
    const fb = evaluate(res, settings);
    best = Math.max(best, fb.stars);
    resBox.innerHTML = `<span class="mini-stars">${'★'.repeat(fb.stars)}<span>${'★'.repeat(3 - fb.stars)}</span></span> ${esc(res?.heard || '')}`;
    if (res && !res.noSpeech) progress.recordAttempt(fix.right, res, fb.stars);
    if (fb.stars >= 2) {
      await say([en(fb.title)], fb.emotion);
      break;
    }
    if (attempt === 0) await say([tr('Mình thử lại nhé.', 'Try again.'), en(fix.right)], 'encourage', { slow: true });
    else await say([en('Good try!'), tr('Mình sẽ luyện câu này sau nhé.', 'We will practise it later.')], 'encourage');
  }
  run.items.push({ en: fix.right, vi: fix.explain_vi || '', emoji: '💬' });
  run.stars.push(best);
}

async function chat(unit, turns) {
  show($('#card'), false);
  show($('#chat'), true);
  $('#chat-log').innerHTML = '';
  // Chỉ gợi ý TỪ VỰNG cho bộ nhận diện, không gợi ý câu mẫu đúng —
  // nếu không nó sẽ "sửa hộ" câu sai của bé thành câu đúng.
  const phrases = unit.words.map((w) => w.en);
  let r;
  let turn = 0;
  try {
    r = await guard(brain.start(unit, turns));
  } catch (e) {
    if (e instanceof Aborted) throw e;
    showError(e);
    brain = new ScriptedBrain(settings);
    r = await brain.start(unit, turns);
  }
  for (let safety = 0; safety < 20; safety++) {
    addBubble('bong', r.say_en, r.say_vi);
    run.lastModel = r.say_en;
    await say([en(r.say_en), englishOnly() ? null : vi(r.say_vi)], r.emotion);
    if (r.end) break;
    await waitMic(t('Bấm micro rồi trả lời Bông nhé!', 'Press the mic and answer Bong!'));
    let heard = { text: '', lang: 'en-US' };
    try {
      heard = await listening(() => speech.listen(phrases));
    } catch (e) {
      if (e instanceof Aborted) throw e;
      showError(e);
    }
    addBubble('kid', heard.text || t('(Bông chưa nghe rõ)', '(I could not hear you)'));
    avatar.setEmotion('think');
    turn++;
    try {
      r = await guard(brain.reply(heard));
    } catch (e) {
      if (e instanceof Aborted) throw e;
      showError(e);
      // Gemini lỗi → chuyển sang hội thoại mẫu, hỏi tiếp từ câu đang dở (không dừng cuộc trò chuyện)
      brain = new ScriptedBrain(settings);
      await brain.start(unit, turns);
      brain.i = Math.min(turn - 1, unit.chat.questions.length);
      r = await brain.reply(heard);
    }
    // Lưới an toàn: nếu AI bỏ sót lỗi hay gặp thì app tự sửa
    if (!r.fix && heard.text) {
      const g = checkGrammar(heard.text, settings.langMode);
      if (g) r = { ...r, fix: g, say_en: r.say_en.replace(/^(great|excellent|perfect|well done|good job|wonderful)[!.,]?\s*/i, '') || r.say_en };
    }
    if (r.fix) await practiceFix(r.fix);
  }
}

async function summary() {
  const avg = run.stars.length ? run.stars.reduce((a, b) => a + b, 0) / run.stars.length : 3;
  const stars = avg >= 2.5 ? 3 : avg >= 1.8 ? 2 : 1;
  if (run.unit) progress.setUnitStars(run.unit.id, stars);
  showScreen('summary');
  $('#sum-stars').innerHTML = `${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span>`;
  const weak = run.items.filter((_, i) => run.stars[i] < 2).map((it) => it.en);
  $('#sum-text').innerHTML = weak.length
    ? `${t('Con cần luyện thêm', 'Practise more')}: <b>${weak.map(esc).join(', ')}</b>`
    : t('Con nói tốt tất cả các từ và câu! 🎉', 'You said everything well! 🎉');
  await say(praiseEnd(avg), 'cheer');
}

async function startRun(unit, items, intro) {
  if (run) return;
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  if (progress.todayMinutes() >= settings.dailyMinutes) {
    if (!confirm(`Hôm nay con đã học đủ ${settings.dailyMinutes} phút rồi. Vẫn học tiếp?`)) return;
  }
  let abortReject;
  const abortPromise = new Promise((_, rej) => (abortReject = rej));
  abortPromise.catch(() => {});
  run = { aborted: false, abortPromise, abortReject, stars: [], items, unit, done: 0, total: items.length, lastModel: '' };
  if (hasGemini() && !(brain instanceof GeminiBrain)) brain = new GeminiBrain(settings, cloud);
  let lastTick = Date.now();
  const tick = () => {
    const now = Date.now();
    progress.addSeconds(Math.round((now - lastTick) / 1000));
    lastTick = now;
  };
  const timer = setInterval(tick, 15000);

  showScreen('lesson');
  renderDots();
  try {
    await intro();
    await summary();
  } catch (e) {
    if (!(e instanceof Aborted)) {
      showError(e);
      showScreen('home');
    }
  } finally {
    clearInterval(timer);
    tick();
    speech.stop();
    avatar.setListening(false);
    $('#mic').disabled = true;
    $('#mic').classList.remove('ready', 'listening');
    run = null;
  }
}

function startUnit(unit) {
  const items = [...unit.words, ...unit.sentences];
  startRun(unit, items, async () => {
    setStage('Khởi động');
    show($('#card'), false);
    show($('#chat'), false);
    await say([en(`Hi! Today we learn: ${unit.titleEn}.`), tr(`Hôm nay mình học bài ${unit.titleVi} nhé!`)], 'happy');
    setStage('Từ mới');
    await say([tr('Con nghe Bông đọc, rồi bấm micro và nói theo nhé.', 'Listen to me, then press the mic and say it.')], 'happy');
    for (const w of unit.words) await practiceItem(w);
    setStage('Mẫu câu');
    await say([en('Now, sentences!'), tr('Giờ mình luyện nói cả câu nhé.')], 'happy');
    for (const s of unit.sentences) await practiceItem(s);
    setStage('Trò chuyện');
    await say([en("Let's talk!"), tr('Giờ con trò chuyện với Bông nhé.')], 'cheer');
    await chat(unit, settings.chatTurns);
  });
}

function startFreeTalk() {
  startRun(null, [], async () => {
    setStage('Trò chuyện tự do');
    await say([en("Let's chat!"), tr('Con trò chuyện với Bông nhé. Nói sai cũng không sao, Bông sẽ giúp con sửa.', 'Mistakes are OK. I will help you!')], 'cheer');
    await chat(FREE_TALK, settings.freeTurns);
  });
}

function startReview() {
  const weak = progress.weakItems(8);
  if (!weak.length) {
    toast('Chưa có từ nào cần ôn. Con học một bài trước nhé!');
    return;
  }
  const items = weak.map((w) => findItem(w.text) || { en: w.text, vi: '', emoji: '🔁' });
  startRun(null, items, async () => {
    setStage('Ôn từ khó');
    await say([en('Review time!'), tr('Mình cùng ôn lại những từ con còn chưa chắc nhé.')], 'happy');
    for (const it of items) await practiceItem(it);
  });
}

function exitLesson() {
  if (!run) return showScreen('home');
  run.aborted = true;
  run.abortReject(new Aborted());
  speech.stop();
  speech.cancelListen?.();
  showScreen('home');
}

// ---------- phụ huynh ----------
function openParent() {
  const a = 2 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 6);
  const ans = prompt(`Dành cho phụ huynh: ${a} × ${b} = ?`);
  if (ans === null) return;
  if (Number(ans) !== a * b) return toast('Chưa đúng rồi 🙂');
  const f = $('#settings-form');
  for (const el of f.elements) if (el.name && el.name in settings) el.value = settings[el.name];
  renderReport();
  $('#parent').showModal();
}

function readForm() {
  const f = $('#settings-form');
  const next = { ...settings };
  for (const el of f.elements) {
    if (!el.name || !(el.name in settings)) continue;
    next[el.name] = el.type === 'number' ? Number(el.value) : el.value.trim();
  }
  return next;
}

function renderReport() {
  const days = progress.lastDays(7);
  const max = Math.max(settings.dailyMinutes, ...days.map((d) => d.minutes), 1);
  $('#r-days').innerHTML = days
    .map((d) => `<div class="bar"><i style="height:${(100 * d.minutes) / max}%"></i><b>${d.minutes}</b><span>${d.day}</span></div>`)
    .join('');
  const wi = progress.weakItems(10);
  $('#r-items').innerHTML = wi.length
    ? wi.map((w) => `<li>${esc(w.text)} — lần gần nhất ${'★'.repeat(w.lastStars)}${'☆'.repeat(3 - w.lastStars)}, tốt nhất ${Math.round(w.best)} điểm</li>`).join('')
    : '<li>Chưa có</li>';
  const wp = progress.weakPhonemes(8);
  $('#r-phon').innerHTML = wp.length
    ? wp.map((p) => `<li>/${esc(p.p)}/ — trung bình ${p.avg} điểm (${p.n} lần), ví dụ "${esc(p.example)}"</li>`).join('')
    : '<li>Cần chế độ Azure và học thêm vài bài để có số liệu</li>';
}

// ---------- gắn sự kiện ----------
$('#units').addEventListener('click', (e) => {
  const b = e.target.closest('.unit');
  if (b) startUnit(UNITS.find((u) => u.id === b.dataset.id));
});
$('#review').onclick = startReview;
for (const b of document.querySelectorAll('#lang-toggle button')) b.onclick = () => setLang(b.dataset.lang);
$('#free-talk').onclick = startFreeTalk;
$('#exit').onclick = exitLesson;
$('#home-btn').onclick = () => showScreen('home');
$('#again-btn').onclick = () => showScreen('home');
$('#replay').onclick = () => {
  if (run?.lastModel) speech.speak([en(run.lastModel)], { slow: slowOn() }).catch(showError);
};
$('#parent-btn').onclick = openParent;
$('#close-parent').onclick = () => $('#parent').close();
$('#save-settings').onclick = async (e) => {
  e.preventDefault();
  settings = readForm();
  saveSettings(settings);
  await initEngines();
  toast(cloud.error ? '⚠️ ' + cloud.error : 'Đã lưu cài đặt ✅');
};
$('#test-voice').onclick = async (e) => {
  e.preventDefault();
  settings = readForm();
  await initEngines();
  if (audioCtx?.state === 'suspended') await audioCtx.resume();
  try {
    avatar.setEmotion('happy');
    await speech.speak([en('Hello! I am Bong, your English friend.'), tr('Xin chào, mình là Bông!')].filter(Boolean));
    toast(speech.kind === 'azure' ? 'Giọng Azure hoạt động ✅' : 'Đang dùng giọng của trình duyệt (chế độ thử)');
  } catch (err) {
    showError(err);
  }
};
$('#test-gemini').onclick = async (e) => {
  e.preventDefault();
  settings = readForm();
  await detectCloud(settings.appPassword);
  if (!hasGemini()) return toast(cloud.error || 'Chưa có key Gemini');
  try {
    const out = await new GeminiBrain(settings, cloud).start(UNITS[0]);
    toast('Gemini trả lời ✅: ' + out.say_en);
  } catch (err) {
    showError(err);
  }
};
$('#reset-progress').onclick = (e) => {
  e.preventDefault();
  if (confirm('Xóa toàn bộ tiến độ học của con?')) {
    progress.resetAll();
    renderReport();
    toast('Đã xóa tiến độ');
  }
};
for (const tab of document.querySelectorAll('.tabs button')) {
  tab.onclick = () => {
    document.querySelectorAll('.tabs button').forEach((t) => t.classList.toggle('on', t === tab));
    document.querySelectorAll('.tab').forEach((p) => show(p, p.id === tab.dataset.tab));
    if (tab.dataset.tab === 'tab-report') renderReport();
  };
}

setupEngines(); // chạy ngay với key sẵn có
showScreen('home');
initEngines(); // rồi hỏi máy chủ Vercel (nếu có)

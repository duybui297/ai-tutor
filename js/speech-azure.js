// Giọng nói qua Azure AI Speech:
//  - speak():  đọc giọng (TTS) + viseme để nhân vật nhép môi
//  - assess(): chấm phát âm tới từng âm (Pronunciation Assessment)
//  - listen(): nghe câu tự do (tự nhận tiếng Anh / tiếng Việt)
import { shapeFor } from './visemes.js';
import { azureToken } from './cloud.js';

const SDK = () => window.SpeechSDK;

function xml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

export class AzureSpeech {
  // cloudInfo: khi chạy trên Vercel, key nằm trên máy chủ → dùng token tạm
  constructor(settings, audioCtx, cloudInfo = null) {
    this.s = settings;
    this.useToken = !settings.azureKey && !!cloudInfo?.azure;
    this.region = this.useToken ? cloudInfo.region : settings.azureRegion;
    this.ctx = audioCtx;
    this.cache = new Map(); // ssml -> { buffer, visemes }
    this.current = null;    // { src, start, visemes, i }
    this.kind = 'azure';
    this.precise = true;    // chấm được tới âm vị
  }

  static available() {
    return !!SDK();
  }

  async _config() {
    const sdk = SDK();
    if (this.useToken) {
      return sdk.SpeechConfig.fromAuthorizationToken(await azureToken(this.s.appPassword), this.region);
    }
    return sdk.SpeechConfig.fromSubscription(this.s.azureKey, this.region);
  }

  _ssml(parts, slow) {
    const rate = slow ? this.s.rateEnSlow : this.s.rateEn;
    const body = parts
      .filter((p) => p.text && p.text.trim())
      .map((p) =>
        p.lang === 'vi'
          ? `<voice name="${this.s.voiceVi}">${xml(p.text)}</voice>`
          : `<voice name="${this.s.voiceEn}"><prosody rate="${rate}">${xml(p.text)}</prosody></voice>`
      )
      .join('');
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">${body}</speak>`;
  }

  async _synth(ssml) {
    const sdk = SDK();
    const cfg = await this._config();
    return new Promise((resolve, reject) => {
      cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
      // null = không tự phát ra loa; app tự phát để đồng bộ nhép môi
      const synth = new sdk.SpeechSynthesizer(cfg, null);
      const visemes = [];
      synth.visemeReceived = (_s, e) => visemes.push({ t: e.audioOffset / 1e7, id: e.visemeId });
      synth.speakSsmlAsync(
        ssml,
        (result) => {
          synth.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve({ audio: result.audioData, visemes });
          } else {
            reject(new Error('Azure TTS lỗi: ' + (result.errorDetails || result.reason)));
          }
        },
        (err) => {
          synth.close();
          reject(new Error('Azure TTS lỗi: ' + err));
        }
      );
    });
  }

  async speak(parts, { slow = false } = {}) {
    const ssml = this._ssml(parts, slow);
    if (!/<voice/.test(ssml)) return;
    let item = this.cache.get(ssml);
    if (!item) {
      const { audio, visemes } = await this._synth(ssml);
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const buffer = await this.ctx.decodeAudioData(audio.slice(0));
      item = { buffer, visemes };
      this.cache.set(ssml, item);
    }
    await this._play(item);
  }

  async _play({ buffer, visemes }) {
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.stop();
    return new Promise((resolve) => {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.ctx.destination);
      const start = this.ctx.currentTime + 0.05;
      this.current = { src, start, visemes, i: 0 };
      src.onended = () => {
        if (this.current && this.current.src === src) this.current = null;
        resolve();
      };
      src.start(start);
    });
  }

  stop() {
    if (this.current) {
      try { this.current.src.stop(); } catch { /* đã dừng */ }
      this.current = null;
    }
  }

  // Hình miệng hiện tại, nhân vật gọi mỗi khung hình
  mouth() {
    const c = this.current;
    if (!c) return null;
    const t = this.ctx.currentTime - c.start;
    if (t < 0 || !c.visemes.length) return null;
    while (c.i + 1 < c.visemes.length && c.visemes[c.i + 1].t <= t) c.i++;
    return shapeFor(c.visemes[c.i].id);
  }

  _recognizer(cfg, audio, phrases) {
    const sdk = SDK();
    const rec = new sdk.SpeechRecognizer(cfg, audio);
    if (phrases && phrases.length) {
      const pl = sdk.PhraseListGrammar.fromRecognizer(rec);
      phrases.forEach((p) => pl.addPhrase(p));
    }
    return rec;
  }

  _timeouts(cfg) {
    const sdk = SDK();
    cfg.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, '8000');
    cfg.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, '1200');
  }

  // Chấm phát âm một từ / câu mẫu
  async assess(referenceText) {
    const sdk = SDK();
    const cfg = await this._config();
    return new Promise((resolve, reject) => {
      cfg.speechRecognitionLanguage = 'en-US';
      this._timeouts(cfg);
      const audio = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const rec = this._recognizer(cfg, audio, []);
      const pa = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true // phát hiện bỏ sót / thêm từ
      );
      pa.phonemeAlphabet = 'IPA';
      pa.applyTo(rec);
      this.rec = rec;
      rec.recognizeOnceAsync(
        (r) => {
          rec.close();
          this.rec = null;
          try { resolve(this._parse(r)); } catch (e) { reject(e); }
        },
        (err) => {
          rec.close();
          this.rec = null;
          reject(new Error('Azure nhận diện lỗi: ' + err));
        }
      );
    });
  }

  _parse(r) {
    const sdk = SDK();
    if (r.reason === sdk.ResultReason.Canceled) {
      const c = sdk.CancellationDetails.fromResult(r);
      throw new Error('Azure: ' + (c.errorDetails || 'đã hủy'));
    }
    if (r.reason !== sdk.ResultReason.RecognizedSpeech || !r.text) {
      return { heard: '', noSpeech: true, words: [] };
    }
    const json = JSON.parse(r.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
    const nb = (json.NBest && json.NBest[0]) || {};
    const pa = nb.PronunciationAssessment || {};
    const words = (nb.Words || []).map((w) => ({
      word: w.Word,
      score: w.PronunciationAssessment?.AccuracyScore ?? 0,
      error: w.PronunciationAssessment?.ErrorType || 'None',
      phonemes: (w.Phonemes || []).map((p) => ({ p: p.Phoneme, score: p.PronunciationAssessment?.AccuracyScore ?? 0 })),
    }));
    return {
      heard: r.text,
      pron: pa.PronScore ?? pa.AccuracyScore ?? 0,
      accuracy: pa.AccuracyScore ?? 0,
      fluency: pa.FluencyScore ?? null,
      completeness: pa.CompletenessScore ?? null,
      words,
    };
  }

  // Nghe câu tự do cho phần trò chuyện
  async listen(phrases = []) {
    const sdk = SDK();
    const cfg = await this._config();
    return new Promise((resolve, reject) => {
      this._timeouts(cfg);
      const audio = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const auto = sdk.AutoDetectSourceLanguageConfig.fromLanguages(['en-US', 'vi-VN']);
      const rec = sdk.SpeechRecognizer.FromConfig(cfg, auto, audio);
      if (phrases.length) {
        const pl = sdk.PhraseListGrammar.fromRecognizer(rec);
        phrases.forEach((p) => pl.addPhrase(p));
      }
      this.rec = rec;
      rec.recognizeOnceAsync(
        (r) => {
          rec.close();
          this.rec = null;
          if (r.reason === sdk.ResultReason.Canceled) {
            const c = sdk.CancellationDetails.fromResult(r);
            return reject(new Error('Azure: ' + (c.errorDetails || 'đã hủy')));
          }
          let lang = 'en-US';
          try { lang = sdk.AutoDetectSourceLanguageResult.fromResult(r).language || 'en-US'; } catch { /* bỏ qua */ }
          resolve({ text: r.reason === sdk.ResultReason.RecognizedSpeech ? r.text : '', lang });
        },
        (err) => {
          rec.close();
          this.rec = null;
          reject(new Error('Azure nhận diện lỗi: ' + err));
        }
      );
    });
  }

  cancelListen() {
    if (this.rec) {
      try { this.rec.close(); } catch { /* bỏ qua */ }
      this.rec = null;
    }
  }
}

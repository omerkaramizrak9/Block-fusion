// Ses motoru: efektler ve arka plan müziği tamamen Web Audio ile cihazda
// üretilir (ses dosyası yok, ağ yok, lisans derdi yok).
//
// Platform notları:
//   - iOS/Android tarayıcıları sesi ancak bir dokunuştan sonra başlatır →
//     unlock() ilk dokunuşta çağrılır.
//   - iPhone sessiz modu (yan düğme) açıkken Safari web sesleri duyulmaz; normaldir.
//   - Uygulama arka plana alınınca ses askıya alınır.
//   - Web Audio yoksa her çağrı sessizce yok sayılır.
import { Music } from './Music.js';

const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]; // C majör pentatonik

const volToGain = (v) => Math.pow(Math.max(0, Math.min(100, v)) / 100, 2);

export class AudioEngine {
  constructor(settings, bus) {
    this.settings = settings;
    this.ctx = null;
    this.music = null;
    bus.on('settings', () => this._applySettings());
    document.addEventListener('visibilitychange', () => this._onVisibility());
  }

  get available() { return !!(window.AudioContext || window.webkitAudioContext); }

  /** İlk kullanıcı dokunuşunda çağrılır (tarayıcı kuralı). */
  unlock() {
    if (!this.available) return;
    try {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new Ctx({ latencyHint: 'interactive' });
        const comp = this.ctx.createDynamicsCompressor(); // ani tepe seslerini yumuşatır
        comp.threshold.value = -14;
        comp.ratio.value = 3;
        comp.connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus.connect(comp);
        this.musicBus.connect(comp);
        this.music = new Music(this.ctx, this.musicBus);
        // iOS: sessiz bir tampon çalmak ses yolunu açar
        const b = this.ctx.createBuffer(1, 1, 22050);
        const s = this.ctx.createBufferSource();
        s.buffer = b; s.connect(this.ctx.destination); s.start(0);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this._applySettings();
    } catch { this.ctx = null; }
  }

  _applySettings() {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(s.get('sfx') ? volToGain(s.get('sfxVolume')) : 0, t, 0.03);
    this.musicBus.gain.setTargetAtTime(s.get('music') ? volToGain(s.get('musicVolume')) * 0.9 : 0, t, 0.2);
    if (s.get('music') && s.get('musicVolume') > 0) this.music.start();
    else this.music.stop();
  }

  _onVisibility() {
    if (!this.ctx) return;
    try {
      if (document.hidden) this.ctx.suspend();
      else this.ctx.resume();
    } catch { /* yok say */ }
  }

  get _sfxOn() {
    return this.ctx && this.ctx.state === 'running' &&
      this.settings.get('sfx') && this.settings.get('sfxVolume') > 0;
  }

  // ---------- yapı taşları ----------
  _tone({ freq, type = 'sine', at = 0, attack = 0.005, decay = 0.2, gain = 0.2, endFreq = null, filter = null }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + attack + decay);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq;
      osc.connect(f); node = f;
    }
    node.connect(g).connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);
  }

  _noise({ at = 0, dur = 0.3, gain = 0.15, from = 400, to = 3000, q = 1.2, type = 'bandpass' }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + at;
    if (!this._noiseBuf) {
      const len = ctx.sampleRate * 1;
      this._noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t0);
    f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  _chime(notes, { at = 0, step = 0.05, decay = 0.6, gain = 0.16 } = {}) {
    notes.forEach((f, i) => {
      this._tone({ freq: f, type: 'sine', at: at + i * step, decay, gain });
      this._tone({ freq: f * 2, type: 'sine', at: at + i * step, decay: decay * 0.5, gain: gain * 0.25 });
    });
  }

  // ---------- oyun sesleri ----------
  /**
   * @param {string} name  place | rotate | deny | ui | line | combo | epic | record | gameover | reward
   * @param {object} o     { lines, combo }
   */
  play(name, o = {}) {
    if (!this._sfxOn) return;
    try { this._play(name, o); } catch { /* ses hatası oyunu etkilemez */ }
  }

  _play(name, { lines = 1, combo = 0 } = {}) {
    const jitter = 1 + (Math.random() - 0.5) * 0.08;
    const shift = Math.min(combo, 6); // kombo yükseldikçe notalar yükselir
    const scale = (i) => PENTA[Math.min(PENTA.length - 1, i + Math.floor(shift / 2))];
    switch (name) {
      case 'place': // yumuşak ahşap "tık" + hafif darbe
        this._tone({ freq: 190 * jitter, endFreq: 120, type: 'triangle', decay: 0.1, gain: 0.32 });
        this._noise({ dur: 0.04, gain: 0.05, from: 2500, to: 1800, type: 'highpass', q: 0.7 });
        break;
      case 'rotate':
        this._tone({ freq: 700 * jitter, endFreq: 820, type: 'sine', decay: 0.07, gain: 0.12 });
        break;
      case 'deny':
        this._tone({ freq: 150, endFreq: 120, type: 'triangle', decay: 0.12, gain: 0.16 });
        break;
      case 'ui':
        this._tone({ freq: 880, type: 'sine', decay: 0.05, gain: 0.08 });
        break;
      case 'reward':
        this._chime([scale(2), scale(4), scale(5)], { step: 0.08, gain: 0.14 });
        break;
      case 'line': { // hat sayısı arttıkça daha zengin akor
        const n = Math.min(lines + 1, 5);
        const notes = Array.from({ length: n }, (_, i) => scale(i * 1 + (lines > 2 ? 1 : 0)));
        this._chime(notes, { step: 0.045, decay: 0.5 + lines * 0.12, gain: 0.13 + lines * 0.02 });
        if (lines >= 3) this._tone({ freq: 110, endFreq: 70, type: 'sine', decay: 0.35, gain: 0.35 });
        break;
      }
      case 'combo': // güçlü ama yumuşak: süpürme + darbe + akor
        this._noise({ dur: 0.35, gain: 0.16, from: 300, to: 3200 });
        this._tone({ freq: 95, endFreq: 48, type: 'sine', at: 0.28, decay: 0.4, gain: 0.55 });
        this._chime([scale(0), scale(2), scale(4), scale(5)], { at: 0.3, step: 0.06, decay: 1.0, gain: 0.14 });
        break;
      case 'epic': // sinematik: uzun süpürme, darbe, yükselen arpej, parıltı
        this._noise({ dur: 0.6, gain: 0.18, from: 200, to: 4200 });
        this._tone({ freq: 90, endFreq: 42, type: 'sine', at: 0.45, decay: 0.6, gain: 0.6 });
        this._chime([0, 1, 2, 3, 4, 5].map((i) => PENTA[i]), { at: 0.5, step: 0.08, decay: 1.1, gain: 0.12 });
        this._chime([PENTA[5], PENTA[6], PENTA[7]], { at: 1.05, step: 0.02, decay: 1.3, gain: 0.09 });
        break;
      case 'record':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this._tone({ freq: f, type: 'triangle', at: i * 0.1, decay: 0.35 + i * 0.1, gain: 0.16, filter: { freq: 3000 } }));
        this._chime([PENTA[6], PENTA[7]], { at: 0.45, step: 0.06, decay: 1.0, gain: 0.08 });
        break;
      case 'gameover':
        [392, 330, 262].forEach((f, i) =>
          this._tone({ freq: f, type: 'triangle', at: i * 0.18, decay: 0.5, gain: 0.14, filter: { freq: 1600 } }));
        break;
      default:
    }
  }
}

// Dokunsal geri bildirim (fiziksel titreşim) motoru.
//
//   Android / iOS uygulaması : @capacitor/haptics (impact LIGHT/MEDIUM/HEAVY, notification)
//   Android tarayıcı         : navigator.vibrate(desen)
//   iPhone tarayıcı (Safari) : titreşim API'si yok → sessizce hiçbir şey yapılmaz
//
// Kurallar: kısa ve kontrollü. Tek darbe ≤ 80 ms, bir desen toplam ≤ ~600 ms.
// Sürekli titreşim yok. Desenler üst üste binmez: yeni desen ancak öncekinden
// daha öncelikliyse onu keser.
import { Platform } from '../platform/Platform.js';

// web: [titreşim, bekleme, titreşim, ...] ms
// native: [[gecikme ms, 'light'|'medium'|'heavy'|'success'|'warning'], ...]
export const PATTERNS = {
  place:    { prio: 1, web: [8],                          native: [[0, 'light']] },
  rotate:   { prio: 1, web: [6],                          native: [[0, 'light']] },
  deny:     { prio: 1, web: [10],                         native: [[0, 'light']] },
  line1:    { prio: 2, web: [18],                         native: [[0, 'medium']] },
  line2:    { prio: 3, web: [16, 70, 16],                 native: [[0, 'medium'], [90, 'medium']] },   // çift titreşim
  line3:    { prio: 4, web: [40],                         native: [[0, 'heavy']] },
  combo:    { prio: 5, web: [22, 60, 22, 60, 40],         native: [[0, 'heavy'], [110, 'medium'], [220, 'heavy']] }, // ritmik
  epic:     { prio: 6, web: [25, 70, 25, 70, 25, 120, 60], native: [[0, 'heavy'], [120, 'heavy'], [240, 'heavy'], [460, 'success']] },
  record:   { prio: 6, web: [15, 50, 15, 50, 15, 50, 70], native: [[0, 'light'], [90, 'medium'], [180, 'heavy'], [380, 'success']] },
  gameover: { prio: 5, web: [30, 90, 30],                 native: [[0, 'warning']] },
  ui:       { prio: 0, web: [5],                          native: [[0, 'light']] }
};

const STYLE_STEPS = ['light', 'medium', 'heavy'];
const STRENGTH = {
  light:  { scale: 0.6, shift: -1 },
  normal: { scale: 1.0, shift: 0 },
  strong: { scale: 1.4, shift: 1 }
};
const MAX_PULSE = 80;

export class Haptics {
  constructor(settings) {
    this.settings = settings;
    this.busyUntil = 0;
    this.busyPrio = -1;
    this.timers = [];
  }

  get supported() { return Platform.canVibrate; }

  get enabled() { return this.settings.get('haptics') && this.supported; }

  play(name) {
    const pat = PATTERNS[name];
    if (!pat || !this.enabled) return;
    const now = performance.now();
    if (now < this.busyUntil && pat.prio <= this.busyPrio) return; // üst üste binme
    this._stop();
    const st = STRENGTH[this.settings.get('hapticStrength')] || STRENGTH.normal;
    try {
      const native = Platform.plugin('Haptics');
      if (native) this._playNative(native, pat.native, st);
      else this._playWeb(pat.web, st);
    } catch { /* desteklenmeyen özellik oyunu etkilemez */ }
    const dur = pat.web.reduce((a, b) => a + b, 0);
    this.busyUntil = now + dur;
    this.busyPrio = pat.prio;
  }

  _playWeb(pattern, st) {
    if (typeof navigator.vibrate !== 'function') return;
    // Titreşim süreleri güce göre ölçeklenir; beklemeler aynı kalır (ritim korunur)
    const scaled = pattern.map((ms, i) => (i % 2 === 0
      ? Math.max(4, Math.min(MAX_PULSE, Math.round(ms * st.scale)))
      : ms));
    navigator.vibrate(scaled);
  }

  _playNative(H, steps, st) {
    for (const [delay, kind] of steps) {
      const fire = () => {
        try {
          if (kind === 'success' || kind === 'warning') {
            H.notification({ type: kind.toUpperCase() });
          } else {
            const i = Math.max(0, Math.min(2, STYLE_STEPS.indexOf(kind) + st.shift));
            H.impact({ style: STYLE_STEPS[i].toUpperCase() });
          }
        } catch { /* yok say */ }
      };
      if (delay === 0) fire();
      else this.timers.push(setTimeout(fire, delay));
    }
  }

  _stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    try { if (!Platform.plugin('Haptics')) navigator.vibrate?.(0); } catch { /* yok say */ }
  }
}

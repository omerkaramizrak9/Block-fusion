// Sakin, kendiliğinden üretilen arka plan müziği (ambient).
// Yumuşak akor "pad"leri + seyrek pentatonik notalar. Düşük işlemci yükü:
// aynı anda ~10 osilatör, zamanlama 0,5 sn'de bir kontrol edilir.

const CHORDS = [ // Fmaj7, Am7, Cmaj7, G6 (alçak oktav)
  [174.61, 220.0, 261.63, 329.63],
  [220.0, 261.63, 329.63, 392.0],
  [130.81, 196.0, 246.94, 329.63],
  [196.0, 246.94, 293.66, 329.63]
];
const PLUCK = [523.25, 587.33, 659.25, 783.99, 880.0];
const CHORD_LEN = 8; // saniye

export class Music {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    this.out.connect(lp).connect(out);
    this.timer = null;
    this.next = 0;
    this.idx = 0;
  }

  get playing() { return !!this.timer; }

  start() {
    if (this.timer) return;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(1, t, 1.2); // yumuşak giriş
    this.next = t + 0.1;
    this.timer = setInterval(() => this._tick(), 500);
    this._tick();
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
  }

  _tick() {
    const ctx = this.ctx;
    if (ctx.state !== 'running') return;
    while (this.next < ctx.currentTime + 1.0) {
      this._pad(CHORDS[this.idx % CHORDS.length], this.next);
      // akor başına 2–3 seyrek nota
      const plucks = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < plucks; i++) {
        if (Math.random() < 0.7) {
          this._pluck(PLUCK[Math.floor(Math.random() * PLUCK.length)], this.next + 1 + Math.random() * (CHORD_LEN - 2));
        }
      }
      this.next += CHORD_LEN;
      this.idx++;
    }
  }

  _pad(notes, t0) {
    const ctx = this.ctx;
    const end = t0 + CHORD_LEN + 2.5;
    notes.forEach((f, i) => {
      [-4, 4].forEach((detune) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f;
        o.detune.value = detune;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.022, t0 + 2.5);
        g.gain.setValueAtTime(0.022, t0 + CHORD_LEN - 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, end);
        o.connect(g).connect(this.out);
        o.start(t0);
        o.stop(end + 0.1);
      });
    });
  }

  _pluck(f, t0) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
    o.connect(g).connect(this.out);
    o.start(t0);
    o.stop(t0 + 1.9);
  }
}

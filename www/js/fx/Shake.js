// Oyun alanı sarsıntısı (yalnızca .board öğesi; HUD ve tepsi sabit kalır).
// Web Animations API ile: CSS sınıfı yarışları yok, yeni sarsıntı eskisini keser.
// Dokunmatik doğruluk: DragController hedef hücreyi bu dönüşümden etkilenmeyen
// ölçülerle hesaplar, bu yüzden sarsıntı sırasında bırakma kaymaz.

export class Shake {
  constructor(el) {
    this.el = el;
    this.anim = null;
    this.timers = [];
  }

  /** Sönümlenen kısa sarsıntı. */
  run(amp, duration) {
    if (!this.el.animate || amp <= 0) return;
    this.anim?.cancel();
    const steps = Math.max(4, Math.round(duration / 32));
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const decay = 1 - i / steps;
      const x = i === steps ? 0 : (Math.random() * 2 - 1) * amp * decay;
      const y = i === steps ? 0 : (Math.random() * 2 - 1) * amp * 0.55 * decay;
      frames.push({ transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)` });
    }
    frames[0] = { transform: 'translate3d(0,0,0)' };
    this.anim = this.el.animate(frames, { duration, easing: 'linear' });
  }

  /** Sinematik: azalan ritmik darbeler (en büyük kombolar). */
  rhythm(amp, pulses = 3, gap = 280) {
    this.cancel();
    for (let i = 0; i < pulses; i++) {
      const a = amp * (1 - i * 0.28);
      this.timers.push(setTimeout(() => this.run(a, 230), i * gap));
    }
  }

  /** Blok yerleştirmede hafif "tok" darbe. */
  bump(px = 1.5) {
    if (!this.el.animate || this.anim?.playState === 'running') return;
    this.anim = this.el.animate([
      { transform: 'translate3d(0,0,0)' },
      { transform: `translate3d(0, ${px}px, 0)`, offset: 0.35 },
      { transform: 'translate3d(0,0,0)' }
    ], { duration: 140, easing: 'ease-out' });
  }

  cancel() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.anim?.cancel();
  }
}

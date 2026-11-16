// Kombo, sinematik ve rekor kutlamaları.
//   combo : arka plan hafif kararır + COMBO yazısı güçlü girişle belirir (~1,1 sn)
//   epic  : 1,5–2 sn sinematik: daha koyu arka plan, yavaş dönen yumuşak ışık,
//           ritmik halkalar, dalga dalga parçacıklar, büyük COMBO yazısı
//   record: "YENİ REKOR!" şeridi (başka kutlama sürüyorsa sırasını bekler)
// Hepsi pointer-events: none — dokunmatik kontrol hiçbir an engellenmez.
// "calm" modunda (efektler kapalı / azaltılmış hareket) yalnızca sade yazı solarak görünür.

export const EPIC_DURATION = 1800;
export const COMBO_DURATION = 1100;

export class Celebration {
  constructor({ layer, dim, particles }) {
    this.layer = layer;      // tahta üzerindeki fx katmanı
    this.dim = dim;          // tahtanın arkasındaki karartma katmanı
    this.particles = particles;
    this.busyUntil = 0;
  }

  get busy() { return performance.now() < this.busyUntil; }

  /** Bir kutlamanın bitmesine kalan süre (ms). */
  get remaining() { return Math.max(0, this.busyUntil - performance.now()); }

  combo({ combo, points, x, y, pitch, scale = 1, calm = false }) {
    this.busyUntil = performance.now() + COMBO_DURATION;
    this._comboText({ combo, points, pitch, big: false, calm, duration: COMBO_DURATION });
    if (calm) return;
    this._dim(0.22, COMBO_DURATION);
    this.particles.burst(x, y, Math.round(16 * scale), { pitch, spread: 3.4 });
    this._ring(x, y, pitch, 0, 1);
  }

  epic({ combo, points, x, y, pitch, scale = 1, calm = false, boardClear = false }) {
    this.busyUntil = performance.now() + EPIC_DURATION;
    this._comboText({ combo, points, pitch, big: true, calm, duration: EPIC_DURATION, label: boardClear ? 'TAHTA TEMİZ' : null });
    if (calm) return;
    this._dim(0.4, EPIC_DURATION);
    this._rays(pitch, EPIC_DURATION);
    [0, 260, 520].forEach((d, i) => this._ring(x, y, pitch, d, 1 + i * 0.25));
    // Dalga dalga parçacıklar
    [[0, 18], [380, 14], [760, 10]].forEach(([d, n]) => {
      setTimeout(() => this.particles.burst(x, y, Math.round(n * scale), { pitch, spread: 3.6 + d / 600, duration: 1000 }), d);
    });
  }

  /** Rekor: başka kutlama sürüyorsa bitince oynar. */
  record({ pitch, x, calm = false }) {
    const wait = this.remaining;
    setTimeout(() => {
      this.busyUntil = performance.now() + 1500;
      const el = document.createElement('div');
      el.className = 'fx-record' + (calm ? ' calm' : '');
      el.innerHTML = '<span>YENİ REKOR!</span>';
      this.layer.appendChild(el);
      const a = el.animate(calm
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
        : [
          { transform: 'translate(-50%, -140%) scale(.9)', opacity: 0 },
          { transform: 'translate(-50%, 0) scale(1.06)', opacity: 1, offset: 0.18 },
          { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: 0.28 },
          { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: 0.82 },
          { transform: 'translate(-50%, -60%) scale(.98)', opacity: 0 }
        ], { duration: 1500, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
      a.onfinish = () => el.remove();
      if (!calm) this.particles.burst(x, pitch * 0.6, 14, { pitch, spread: 3, duration: 1000 });
    }, wait);
    return wait;
  }

  // ---------- parçalar ----------
  _dim(level, duration) {
    if (!this.dim.animate) return;
    this.dimAnim?.cancel();
    this.dimAnim = this.dim.animate([
      { opacity: 0 }, { opacity: level, offset: 0.15 }, { opacity: level, offset: 0.7 }, { opacity: 0 }
    ], { duration, easing: 'ease-in-out' });
  }

  _comboText({ combo, points, pitch, big, calm, duration, label = null }) {
    const el = document.createElement('div');
    const solo = !!label || combo < 2; // "x" çarpanı yoksa yazı tek satırı kaplar
    el.className = `fx-combo${big ? ' big' : ''}${calm ? ' calm' : ''}${solo ? ' solo' : ''}`;
    el.style.setProperty('--fs', `${Math.round(pitch * (big ? 1.25 : 1))}px`);
    const word = label || 'COMBO';
    el.innerHTML = `<b>${word}</b>${!solo ? `<em>x${combo}</em>` : ''}<span>+${points}</span><i class="shine"></i>`;
    this.layer.appendChild(el);
    const frames = calm
      ? [{ opacity: 0, transform: 'translate(-50%,-50%)' }, { opacity: 1, offset: 0.15, transform: 'translate(-50%,-50%)' },
         { opacity: 1, offset: 0.8, transform: 'translate(-50%,-50%)' }, { opacity: 0, transform: 'translate(-50%,-50%)' }]
      : [
        { transform: 'translate(-50%,-50%) scale(2.2) rotate(-7deg)', opacity: 0, letterSpacing: '.35em' },
        { transform: 'translate(-50%,-50%) scale(.9) rotate(1.5deg)', opacity: 1, letterSpacing: '.06em', offset: 0.16 },
        { transform: 'translate(-50%,-50%) scale(1.05) rotate(0deg)', opacity: 1, letterSpacing: '.04em', offset: 0.26 },
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, letterSpacing: '.04em', offset: 0.38 },
        { transform: 'translate(-50%,-56%) scale(1)', opacity: 1, letterSpacing: '.04em', offset: 0.82 },
        { transform: 'translate(-50%,-72%) scale(.96)', opacity: 0, letterSpacing: '.04em' }
      ];
    const a = el.animate(frames, { duration, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    a.onfinish = () => el.remove();
    if (!calm) {
      // Tek geçişlik ışık süpürmesi (yanıp sönme yok)
      el.querySelector('.shine').animate(
        [{ transform: 'translateX(-120%) skewX(-20deg)', opacity: 0 }, { opacity: 0.8, offset: 0.4 }, { transform: 'translateX(260%) skewX(-20deg)', opacity: 0 }],
        { duration: 650, delay: duration * 0.2, easing: 'ease-in-out', fill: 'both' }
      );
    }
  }

  _ring(x, y, pitch, delay, mult) {
    const r = document.createElement('i');
    r.className = 'fx-ring';
    const size = pitch * 1.6;
    Object.assign(r.style, { width: `${size}px`, height: `${size}px`, left: `${x - size / 2}px`, top: `${y - size / 2}px` });
    this.layer.appendChild(r);
    const a = r.animate([
      { transform: 'scale(.3)', opacity: 0.75 },
      { transform: `scale(${4.2 * mult})`, opacity: 0 }
    ], { duration: 800, delay, easing: 'cubic-bezier(.15,.6,.3,1)', fill: 'both' });
    a.onfinish = () => r.remove();
  }

  _rays(pitch, duration) {
    const el = document.createElement('i');
    el.className = 'fx-rays';
    this.layer.appendChild(el);
    const a = el.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg) scale(.8)', opacity: 0 },
      { transform: 'translate(-50%,-50%) rotate(8deg) scale(1)', opacity: 0.22, offset: 0.2 },
      { transform: 'translate(-50%,-50%) rotate(24deg) scale(1.05)', opacity: 0.18, offset: 0.75 },
      { transform: 'translate(-50%,-50%) rotate(30deg) scale(1.1)', opacity: 0 }
    ], { duration, easing: 'ease-in-out', fill: 'forwards' });
    a.onfinish = () => el.remove();
  }
}

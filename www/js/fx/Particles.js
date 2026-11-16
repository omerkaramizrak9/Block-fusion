// Geometrik pastel parçacıklar (kare, eşkenar dörtgen, üçgen, altıgen).
// Yalnızca transform/opacity animasyonu; her parçacık bittiğinde silinir.
// Jeton/para/yıldız gibi "casino" şekilleri kullanılmaz.

const SHAPES = ['sq', 'dia', 'tri', 'hex'];
const MAX_ALIVE = 70; // düşük güçlü telefonlar için üst sınır

export class Particles {
  constructor(layer) {
    this.layer = layer;
    this.alive = 0;
  }

  /**
   * @param x,y    merkez (fx katmanı koordinatı, px)
   * @param count  adet
   * @param o      { pitch, spread (hücre), duration }
   */
  burst(x, y, count, { pitch, spread = 3.2, duration = 900 } = {}) {
    const n = Math.min(count, MAX_ALIVE - this.alive);
    if (n <= 0 || !this.layer.animate) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = `fx-geo ${SHAPES[i % SHAPES.length]}`;
      const size = pitch * (0.18 + Math.random() * 0.16);
      Object.assign(p.style, {
        width: `${size}px`, height: `${size}px`,
        left: `${x - size / 2}px`, top: `${y - size / 2}px`,
        background: `var(--fx${i % 4})`
      });
      const ang = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = pitch * spread * (0.55 + Math.random() * 0.45);
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist + pitch * 0.4; // hafif yerçekimi
      const rot = (Math.random() * 2 - 1) * 220;
      const dur = duration * (0.8 + Math.random() * 0.35);
      frag.appendChild(p);
      this.alive++;
      const a = p.animate([
        { transform: 'translate3d(0,0,0) rotate(0deg) scale(.4)', opacity: 0 },
        { transform: `translate3d(${dx * 0.55}px, ${dy * 0.45}px, 0) rotate(${rot * 0.5}deg) scale(1)`, opacity: 0.95, offset: 0.25 },
        { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(.5)`, opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(.15,.7,.35,1)', fill: 'forwards' });
      a.onfinish = () => { p.remove(); this.alive--; };
    }
    this.layer.appendChild(frag);
  }
}

// Efekt yönetmeni: oyun olaylarını görsel efektlere, sese ve titreşime çevirir.
// Oyun mantığına dokunmaz; yalnızca EventBus olaylarını dinler.
//
// Ayarlara göre:
//   reducedMotion      → sarsıntı, parçacık, karartma YOK; geçişler sade (solma)
//   shake kapalı       → sarsıntı yok
//   effects kapalı     → parçacık / karartma / sinematik yok, yazılar sade
//   animIntensity      → genlik ve parçacık sayısı çarpanı (0.6 / 1 / 1.4)
// Ses ve titreşim kendi ayarlarına bağlıdır (Feedback).
import { clearLevel, LEVEL_FX } from './levels.js';
import { Shake } from './Shake.js';
import { LineClearFX } from './LineClearFX.js';
import { Particles } from './Particles.js';
import { Celebration } from './Celebration.js';

const N = 8;
const PRAISE = { 2: 'Harika!', 3: 'Muhteşem!' };

export class FXDirector {
  constructor({ bus, els, settings, feedback, layout }) {
    this.els = els;
    this.settings = settings;
    this.feedback = feedback;
    this.layout = layout;
    this.shake = new Shake(els.board);
    this.lineFX = new LineClearFX(els.fx);
    this.particles = new Particles(els.fx);
    this.celebration = new Celebration({ layer: els.fx, dim: els.dim, particles: this.particles });

    bus.on('placed', (e) => this.onPlaced(e));
    bus.on('record', () => this.onRecord());
    bus.on('start', () => this.shake.cancel());
  }

  get pitch() { return this.layout.pitch; }
  get reduced() { return this.settings.reducedMotion; }
  get shakeOn() { return this.settings.get('shake') && !this.reduced; }
  get effectsOn() { return this.settings.get('effects') && !this.reduced; }
  get scale() { return this.settings.animScale; }

  onPlaced({ placed, cleared, lines, result, row, col, piece }) {
    const lineCount = lines.rows.length + lines.cols.length;
    const level = clearLevel({ lines: lineCount, combo: result.combo, boardClear: result.boardClear });
    const clearedKeys = new Set(cleared.map((x) => `${x.r},${x.c}`));
    const pitch = this.pitch;
    const s = this.scale;

    // 1) Yerleştirme: kısa esneme (squash & stretch) + hafif darbe
    this._land(placed.filter(([r, c]) => !clearedKeys.has(`${r},${c}`)));
    this.feedback.play('place');
    if (level === 'place') {
      if (this.shakeOn) this.shake.bump(1.4 * s);
      return;
    }

    const cfg = LEVEL_FX[level];
    // 2) Temizleme: birleşme + ışık dalgası (güç kademeli)
    this.lineFX.run(cleared, lines, { pitch, strength: cfg.beam * (this.effectsOn ? s : 0.8), reduced: this.reduced });

    // 3) Oyun alanı sarsıntısı
    if (this.shakeOn) {
      if (level === 'epic') this.shake.rhythm(cfg.shake[0] * s, 3, 280);
      else this.shake.run(cfg.shake[0] * s, cfg.shake[1]);
    }

    // 4) Ses + titreşim
    this.feedback.clear(level, { lines: lineCount, combo: result.combo });

    // 5) Yazılar ve kutlamalar
    const x = (col + piece.shape.cols / 2) * pitch;
    const y = (row + piece.shape.rows / 2) * pitch;
    const calm = !this.effectsOn;
    if (level === 'combo') {
      this.celebration.combo({ combo: result.combo, points: result.points, x, y, pitch, scale: s, calm });
    } else if (level === 'epic') {
      this.celebration.epic({ combo: result.combo, points: result.points, x, y, pitch, scale: s, calm, boardClear: result.boardClear });
    } else {
      this._floatText(`+${result.points}`, x, y);
      const praise = result.combo >= 2 ? `Kombo x${result.combo}` : PRAISE[lineCount];
      if (praise) this._floatText(praise, x, y - pitch * 1.1, true);
      if (cfg.particles && this.effectsOn) this.particles.burst(x, y, Math.round(cfg.particles * s), { pitch, spread: 2.6, duration: 750 });
    }
  }

  onRecord() {
    const pitch = this.pitch;
    const wait = this.celebration.record({ pitch, x: (N / 2) * pitch, calm: !this.effectsOn });
    setTimeout(() => this.feedback.play('record'), wait);
  }

  _land(cells) {
    const grid = this.els.grid;
    const cls = this.reduced ? 'land-soft' : 'land';
    grid.style.setProperty('--ls', String(Math.min(1.4, this.scale)));
    for (const [r, c] of cells) {
      const el = grid.children[r * N + c];
      if (!el) continue;
      el.classList.remove('land', 'land-soft');
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 320);
    }
  }

  _floatText(text, x, y, big = false) {
    const el = document.createElement('div');
    el.className = 'fx-text' + (big ? ' big' : '') + (this.reduced ? ' calm' : '');
    el.textContent = text;
    const pitch = this.pitch;
    // Uzun yazılar (övgü) tahtanın kenarından taşmasın diye ortaya yakın tutulur
    const margin = big ? 2.6 : 1;
    el.style.left = `${Math.max(pitch * margin, Math.min((N - margin) * pitch, x))}px`;
    el.style.top = `${Math.max(pitch * 0.6, Math.min((N - 0.5) * pitch, y))}px`;
    this.els.fx.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
}

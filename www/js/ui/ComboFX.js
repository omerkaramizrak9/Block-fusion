// Kombo kutlamaları. Normal oynanış sakin kalır; parlak renkler (temanın fx
// renkleri) yalnızca büyük kombolarda kısa süreliğine görünür.
//
// Seviyeler:
//   small : satır temizlendi            → kısa yazı
//   big   : kombo ≥3, 3+ hat, tahta temiz → kısa ekran sarsıntısı + renk dalgası + ödül
//   epic  : kombo ≥5 veya 4+ hat          → daha güçlü sarsıntı, çift dalga, daha çok parçacık
//
// Ayarlardan "yoğun görsel efektler" kapalıysa: sarsıntı, dalga ve parçacık YOK,
// yalnızca sakin bir yazı gösterilir. Titreşim ayrı ayardır.

export const COMBO_TIERS = { big: { combo: 3, lines: 3 }, epic: { combo: 5, lines: 4 } };

const PRAISE = { 2: 'Harika!', 3: 'Muhteşem!', 4: 'İnanılmaz!' };

export function comboTier({ combo, lines, boardClear }) {
  if (lines <= 0) return 'none';
  if (combo >= COMBO_TIERS.epic.combo || lines >= COMBO_TIERS.epic.lines) return 'epic';
  if (combo >= COMBO_TIERS.big.combo || lines >= COMBO_TIERS.big.lines || boardClear) return 'big';
  return 'small';
}

export class ComboFX {
  constructor({ bus, els, settings, feedback }) {
    this.els = els;
    this.settings = settings;
    this.feedback = feedback;
    bus.on('placed', (e) => this._onPlaced(e));
  }

  get intense() { return this.settings.get('effects') && !this.settings.reducedMotion; }
  get shakeOn() { return this.settings.get('shake') && !this.settings.reducedMotion; }

  _onPlaced({ lines, result, row, col, piece }) {
    const lineCount = lines.rows.length + lines.cols.length;
    const tier = comboTier({ combo: result.combo, lines: lineCount, boardClear: result.boardClear });
    if (tier === 'none') return;

    // Parçanın tahtadaki merkezi (hücre biriminde)
    const cr = row + (piece.shape.rows - 1) / 2;
    const cc = col + (piece.shape.cols - 1) / 2;

    if (tier === 'small') {
      if (!this.intense) return;
      const text = result.combo >= 2 ? `Kombo x${result.combo}` : PRAISE[Math.min(lineCount, 4)];
      if (text) this._floatText(text, cr - 1.2, cc);
      return;
    }

    const title = result.boardClear ? 'Tahta Temiz!'
      : result.combo >= 2 ? `KOMBO x${result.combo}` : PRAISE[Math.min(lineCount, 4)];
    const sub = `+${result.points}`;
    this._banner(title, sub, tier);
    this.feedback?.clear(tier === 'epic' ? 'epic' : 'combo', { lines: lineCount, combo: result.combo });

    if (this.shakeOn) this._screenShake(tier);
    if (!this.intense) return;
    this._wave(cr, cc, 0);
    if (tier === 'epic') this._wave(cr, cc, 160);
    this._flashBoard(cr, cc);
    this._particles(cr, cc, tier === 'epic' ? 26 : 14);
  }

  // ---------- efektler ----------
  _screenShake(tier) {
    const app = this.els.app;
    app.classList.remove('screen-shake', 'screen-shake-strong');
    void app.offsetWidth;
    app.classList.add(tier === 'epic' ? 'screen-shake-strong' : 'screen-shake');
    setTimeout(() => app.classList.remove('screen-shake', 'screen-shake-strong'), 420);
  }

  _wave(r, c, delay) {
    const el = document.createElement('div');
    el.className = 'fx-wave';
    el.style.left = `calc(var(--pitch) * ${c + 0.5})`;
    el.style.top = `calc(var(--pitch) * ${r + 0.5})`;
    el.style.animationDelay = `${delay}ms`;
    this.els.fx.appendChild(el);
    setTimeout(() => el.remove(), 900 + delay);
  }

  _flashBoard(r0, c0) {
    const board = this.els.board;
    board.classList.remove('combo-glow');
    void board.offsetWidth;
    board.classList.add('combo-glow');
    setTimeout(() => board.classList.remove('combo-glow'), 800);
    // Dolu hücreler merkezden dışa doğru kısa süre parlar (renk dalgası)
    [...this.els.grid.children].forEach((el, idx) => {
      if (!el.classList.contains('filled')) return;
      const r = Math.floor(idx / 8);
      const c = idx % 8;
      el.style.setProperty('--fd', `${Math.round(Math.hypot(r - r0, c - c0) * 45)}ms`);
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 900);
    });
  }

  _particles(r, c, count) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'fx-particle';
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 1.6 + Math.random() * 2.2; // hücre cinsinden
      p.style.left = `calc(var(--pitch) * ${c + 0.5})`;
      p.style.top = `calc(var(--pitch) * ${r + 0.5})`;
      p.style.setProperty('--dx', `calc(var(--pitch) * ${(Math.cos(angle) * dist).toFixed(2)})`);
      p.style.setProperty('--dy', `calc(var(--pitch) * ${(Math.sin(angle) * dist).toFixed(2)})`);
      p.style.setProperty('--pc', `var(--fx${i % 4})`);
      p.style.setProperty('--rot', `${Math.round(Math.random() * 360)}deg`);
      frag.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
    this.els.fx.appendChild(frag);
  }

  _banner(title, sub, tier) {
    const el = document.createElement('div');
    el.className = `fx-banner ${tier}` + (this.intense ? '' : ' calm');
    const t = document.createElement('b');
    t.textContent = title;
    const s = document.createElement('span');
    s.textContent = sub;
    el.append(t, s);
    this.els.fx.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  _floatText(text, r, c) {
    const el = document.createElement('div');
    el.className = 'fx-text big';
    el.textContent = text;
    const clamp = (v) => Math.max(1, Math.min(7, v));
    el.style.left = `calc(var(--pitch) * ${clamp(c + 0.5)})`;
    el.style.top = `calc(var(--pitch) * ${clamp(r + 0.5)})`;
    this.els.fx.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
}

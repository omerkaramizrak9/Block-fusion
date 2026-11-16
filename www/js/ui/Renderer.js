// Arayüz çizimi ve animasyonlar. Oyun mantığını değiştirmez; yalnızca
// EventBus olaylarını dinler.
import { CONFIG } from '../config.js';
import { Platform } from '../platform/Platform.js';

const PRAISE = { 2: 'Harika!', 3: 'Muhteşem!', 4: 'İnanılmaz!' };

export class Renderer {
  constructor({ bus, game, els }) {
    this.bus = bus;
    this.game = game;
    this.els = els;
    this.size = CONFIG.boardSize;
    this.previewed = [];
    this.displayScore = 0;

    this._buildBoard();
    this._buildTray();

    bus.on('start', () => { this.renderBoard(); this.hideGameOver(); this.displayScore = 0; });
    bus.on('tray', ({ tray, fresh }) => this.renderTray(tray, fresh));
    this.rotatedSlots = new Set();
    bus.on('rotated', ({ slot }) => { this.rotatedSlots.add(slot); Renderer.haptic('light'); });
    bus.on('rotate-denied', ({ slot, reason }) => { if (reason === 'symmetric') this.wiggleSlot(slot); });
    // Hak sayısı değişince "döndürünce sığar" ipuçları güncellenir
    bus.on('rotations', () => this.renderTray(this.game.tray, false));
    bus.on('placed', (e) => this._onPlaced(e));
    bus.on('score', (e) => this._onScore(e));
    bus.on('gameover', (e) => this._onGameOver(e));
    bus.on('powerup', (e) => { this.renderBoard(); this._spawnClearFx(e.cleared, e.row, e.col); });
  }

  // ---------- Tahta ----------
  _buildBoard() {
    const grid = this.els.grid;
    grid.innerHTML = '';
    this.cellEls = [];
    for (let r = 0; r < this.size; r++) {
      const row = [];
      for (let c = 0; c < this.size; c++) {
        const el = document.createElement('div');
        el.className = 'cell';
        el.setAttribute('role', 'gridcell');
        grid.appendChild(el);
        row.push(el);
      }
      this.cellEls.push(row);
    }
  }

  renderBoard() {
    const { board } = this.game;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const el = this.cellEls[r][c];
        const cell = board.get(r, c);
        if (cell) {
          el.classList.add('filled');
          el.style.setProperty('--c', cell.color);
        } else {
          el.classList.remove('filled');
          el.style.removeProperty('--c');
        }
      }
    }
  }

  showPreview(res, row, col) {
    this.clearPreview();
    if (!res || !res.valid) return;
    const { piece, lines } = res;
    for (const [dr, dc] of piece.shape.cells) {
      const el = this.cellEls[row + dr][col + dc];
      el.classList.add('preview');
      el.style.setProperty('--c', piece.color);
      this.previewed.push(el);
    }
    const mark = (el) => { el.classList.add('will-clear'); this.previewed.push(el); };
    lines.rows.forEach((r) => this.cellEls[r].forEach(mark));
    lines.cols.forEach((c) => this.cellEls.forEach((row) => mark(row[c])));
  }

  clearPreview() {
    for (const el of this.previewed) {
      el.classList.remove('preview', 'will-clear');
      if (!el.classList.contains('filled')) el.style.removeProperty('--c');
    }
    this.previewed = [];
  }

  // ---------- Tepsi ----------
  _buildTray() {
    this.slotEls = [];
    this.els.tray.innerHTML = '';
    for (let i = 0; i < CONFIG.traySize; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot empty';
      slot.dataset.slot = String(i);
      this.els.tray.appendChild(slot);
      this.slotEls.push(slot);
    }
  }

  renderTray(tray, fresh) {
    tray.forEach((piece, i) => {
      const slot = this.slotEls[i];
      slot.classList.remove('dragging');
      if (!piece) {
        slot.classList.add('empty');
        slot.classList.remove('unplaceable', 'needs-rotate', 'enter');
        slot.innerHTML = '';
        delete slot.dataset.pieceId;
        return;
      }
      slot.classList.remove('empty');
      const key = `${piece.id}:${piece.shape.id}`; // döndürülünce şekil değişir
      if (slot.dataset.pieceId !== key) {
        slot.innerHTML = '';
        const el = buildPieceEl(piece, 'piece', 'var(--tray-pitch)');
        if (this.rotatedSlots.has(i)) el.classList.add('rot-anim');
        slot.appendChild(el);
        slot.dataset.pieceId = key;
      }
      this.rotatedSlots.delete(i);
      const fitsNow = this.game.board.hasRoomFor(piece.shape);
      const fitsRotated = !fitsNow && this.game.pieceFits(piece, this.game.affordableTurns);
      slot.classList.toggle('unplaceable', !fitsNow && !fitsRotated);
      slot.classList.toggle('needs-rotate', fitsRotated);
      if (fresh) {
        slot.classList.remove('enter');
        void slot.offsetWidth; // animasyonu yeniden tetikle
        slot.style.setProperty('--d', `${i * 70}ms`);
        slot.classList.add('enter');
      }
    });
  }

  setSlotDragging(i, on) { this.slotEls[i]?.classList.toggle('dragging', on); }

  wiggleSlot(i) {
    const slot = this.slotEls[i];
    if (!slot) return;
    slot.classList.remove('wiggle');
    void slot.offsetWidth;
    slot.classList.add('wiggle');
    setTimeout(() => slot.classList.remove('wiggle'), 320);
  }

  // ---------- Olaylar ----------
  _onPlaced({ placed, cleared, lines, result, row, col, piece }) {
    this.clearPreview();
    this.renderBoard();

    const clearedKeys = new Set(cleared.map((x) => `${x.r},${x.c}`));
    for (const [r, c] of placed) {
      if (clearedKeys.has(`${r},${c}`)) continue;
      const el = this.cellEls[r][c];
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 300);
    }

    const cr = row + (piece.shape.rows - 1) / 2;
    const cc = col + (piece.shape.cols - 1) / 2;

    if (cleared.length) {
      this._spawnClearFx(cleared, cr, cc);
      const lineCount = lines.rows.length + lines.cols.length;
      this._floatText(`+${result.points}`, cr, cc);
      if (result.combo >= 2) {
        this._floatText(`Kombo x${result.combo}`, cr - 1.2, cc, true);
      } else if (PRAISE[Math.min(lineCount, 4)]) {
        this._floatText(PRAISE[Math.min(lineCount, 4)], cr - 1.2, cc, true);
      }
      if (result.boardClear) this._floatText('Tahta Temiz!', 3.5, 3.5, true);
      if (lineCount >= 2) this._shake();
      haptic(lineCount >= 2 ? 'heavy' : 'medium');
    } else {
      haptic('light');
    }
  }

  _spawnClearFx(cleared, originR, originC) {
    const layer = this.els.fx;
    const frag = document.createDocumentFragment();
    for (const { r, c, color } of cleared) {
      const wrap = document.createElement('div');
      wrap.className = 'fx-block';
      wrap.style.left = `calc(var(--pitch) * ${c})`;
      wrap.style.top = `calc(var(--pitch) * ${r})`;
      wrap.style.setProperty('--c', color);
      const dist = Math.hypot(r - originR, c - originC);
      wrap.style.setProperty('--d', `${Math.round(dist * 35)}ms`);
      wrap.appendChild(document.createElement('i'));
      frag.appendChild(wrap);
      setTimeout(() => wrap.remove(), 800);
    }
    layer.appendChild(frag);
  }

  _floatText(text, r, c, big = false) {
    const el = document.createElement('div');
    el.className = 'fx-text' + (big ? ' big' : '');
    el.textContent = text;
    const clamp = (v) => Math.max(1, Math.min(this.size - 1, v));
    el.style.left = `calc(var(--pitch) * ${clamp(c + 0.5)})`;
    el.style.top = `calc(var(--pitch) * ${clamp(r + 0.5)})`;
    this.els.fx.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  _shake() {
    const b = this.els.board;
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }

  _onScore({ value, best, combo, delta }) {
    this.els.best.textContent = String(best);
    this._animateScore(value);
    if (delta > 0) {
      this.els.score.classList.remove('bump');
      void this.els.score.offsetWidth;
      this.els.score.classList.add('bump');
    }
    const comboEl = this.els.combo;
    if (combo >= 2) {
      comboEl.textContent = `KOMBO x${combo}`;
      comboEl.classList.add('show');
    } else {
      comboEl.classList.remove('show');
    }
  }

  _animateScore(target) {
    cancelAnimationFrame(this._scoreRaf);
    const from = this.displayScore;
    if (target <= from) {
      this.displayScore = target;
      this.els.score.textContent = String(target);
      return;
    }
    const start = performance.now();
    const dur = Math.min(600, 150 + (target - from) * 4);
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      this.displayScore = Math.round(from + (target - from) * eased);
      this.els.score.textContent = String(this.displayScore);
      if (k < 1) this._scoreRaf = requestAnimationFrame(step);
    };
    this._scoreRaf = requestAnimationFrame(step);
  }

  _onGameOver({ score, best, isNewBest }) {
    // Son hamlenin animasyonu görünsün diye kısa bekleme
    setTimeout(() => {
      if (this.game.state !== 'over') return;
      this.els.goScore.textContent = String(score);
      this.els.goBest.textContent = `En iyi: ${best}`;
      this.els.goNewBest.classList.toggle('hidden', !isNewBest);
      this.els.gameover.classList.remove('hidden');
      haptic('heavy');
    }, 750);
  }

  hideGameOver() { this.els.gameover.classList.add('hidden'); }
}

/** Bir parçayı DOM öğesi olarak oluşturur (tepsi ve sürükleme için ortak). */
export function buildPieceEl(piece, className, pitch) {
  const { rows, cols, cells } = piece.shape;
  const el = document.createElement('div');
  el.className = className;
  el.style.gridTemplateColumns = `repeat(${cols}, ${pitch})`;
  el.style.gridTemplateRows = `repeat(${rows}, ${pitch})`;
  const on = new Set(cells.map(([r, c]) => r * cols + c));
  for (let i = 0; i < rows * cols; i++) {
    const pc = document.createElement('div');
    pc.className = 'pc';
    if (on.has(i)) {
      pc.classList.add('on');
      const b = document.createElement('div');
      b.className = 'block';
      b.style.setProperty('--c', piece.color);
      pc.appendChild(b);
    }
    el.appendChild(pc);
  }
  return el;
}

function haptic(kind) {
  if (CONFIG.vibration) Platform.haptic(kind);
}
Renderer.haptic = haptic;

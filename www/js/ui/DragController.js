// Dokunmatik / fare girişi (Pointer Events: Android Chrome + iOS Safari).
//   - Dokun (parmak neredeyse kımıldamadan kalkar) -> onTap(slot): parçayı döndür
//   - Sürükle (eşik aşılır)                          -> parçayı tahtaya yerleştir
import { CONFIG } from '../config.js';
import { buildPieceEl } from './Renderer.js';

export class DragController {
  constructor({ game, renderer, els, layout, onTap }) {
    this.game = game;
    this.renderer = renderer;
    this.els = els;
    this.layout = layout;
    this.onTap = onTap;
    this.drag = null;
    this.pending = null; // basıldı ama henüz sürükleme başlamadı

    els.tray.addEventListener('pointerdown', (e) => this._onDown(e));
    window.addEventListener('pointermove', (e) => this._onMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this._onUp(e));
    window.addEventListener('pointercancel', (e) => this._onUp(e, true));
  }

  _onDown(e) {
    if (this.drag || this.pending || this.game.state !== 'playing') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const slotEl = e.target.closest('.slot');
    if (!slotEl) return;
    const slot = Number(slotEl.dataset.slot);
    if (!this.game.tray[slot]) return;
    e.preventDefault();
    this.pending = { pointerId: e.pointerId, slot, slotEl, x0: e.clientX, y0: e.clientY };
  }

  _beginDrag(p, x, y) {
    const { slot, slotEl } = p;
    const piece = this.game.tray[slot];
    if (!piece || this.game.state !== 'playing') return;

    const pitch = this.layout.pitch;
    const el = buildPieceEl(piece, 'drag-piece', `${pitch}px`);
    this.els.dragLayer.appendChild(el);

    const w = piece.shape.cols * pitch;
    const h = piece.shape.rows * pitch;
    this.drag = {
      pointerId: p.pointerId, slot, piece, el, w, h,
      x, y,
      row: null, col: null, res: null, raf: 0
    };
    this.renderer.setSlotDragging(slot, true);

    // Parçayı tepsideki konumundan parmağa doğru büyüterek getir
    const pieceInSlot = slotEl.querySelector('.piece');
    const src = (pieceInSlot || slotEl).getBoundingClientRect();
    const scale = src.width / w || 0.5;
    el.style.transform = `translate(${src.left}px, ${src.top}px) scale(${scale})`;
    el.style.transformOrigin = '0 0';
    void el.offsetWidth;
    el.style.transition = 'transform 90ms ease-out';
    this._position();
    setTimeout(() => { if (this.drag?.el === el) el.style.transition = 'none'; }, 100);
  }

  _onMove(e) {
    const p = this.pending;
    if (p && e.pointerId === p.pointerId) {
      e.preventDefault();
      if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > CONFIG.rotation.tapMaxMovePx) {
        this.pending = null;
        this._beginDrag(p, e.clientX, e.clientY);
      }
      return;
    }
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    e.preventDefault();
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.raf) {
      d.raf = requestAnimationFrame(() => {
        d.raf = 0;
        this._position();
      });
    }
  }

  _topLeft() {
    const d = this.drag;
    const pitch = this.layout.pitch;
    return {
      left: d.x - d.w / 2,
      top: d.y - d.h - CONFIG.dragLiftCells * pitch
    };
  }

  _position() {
    const d = this.drag;
    if (!d) return;
    const { left, top } = this._topLeft();
    d.el.style.transform = `translate(${left}px, ${top}px)`;

    const rect = this._gridOrigin();
    const pitch = rect.width / CONFIG.boardSize;
    const col = Math.round((left - rect.left) / pitch);
    const row = Math.round((top - rect.top) / pitch);
    if (row === d.row && col === d.col) return;
    d.row = row;
    d.col = col;
    d.res = this.game.preview(d.slot, row, col);
    this.renderer.showPreview(d.res, row, col);
  }

  /**
   * Tahta ızgarasının ekrandaki konumu — sarsıntı/animasyon dönüşümlerinden
   * ETKİLENMEZ. offsetLeft/Top dönüşümleri yok sayar; .play-area hiç dönüşmez.
   * Böylece efekt oynarken bile parça doğru hücreye bırakılır.
   */
  _gridOrigin() {
    const { playArea, board, grid } = this.els;
    const pa = playArea.getBoundingClientRect();
    return {
      left: pa.left + board.offsetLeft + board.clientLeft + grid.offsetLeft,
      top: pa.top + board.offsetTop + board.clientTop + grid.offsetTop,
      width: grid.offsetWidth
    };
  }

  _onUp(e, cancelled = false) {
    const p = this.pending;
    if (p && e.pointerId === p.pointerId) {
      this.pending = null;
      if (!cancelled) this.onTap?.(p.slot);
      return;
    }
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    cancelAnimationFrame(d.raf);
    if (!cancelled) {
      d.x = e.clientX;
      d.y = e.clientY;
      this._position();
    }
    this.drag = null;
    this.renderer.clearPreview();

    if (!cancelled && d.res?.valid && this.game.tryPlace(d.slot, d.row, d.col)) {
      d.el.remove();
      return;
    }
    this._returnToSlot(d);
  }

  /** Sürüklemeyi iptal eder (ör. uygulama arka plana alındığında). */
  cancel() {
    this.pending = null;
    const d = this.drag;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    this.drag = null;
    this.renderer.clearPreview();
    this._returnToSlot(d);
  }

  _returnToSlot(d) {
    const slotEl = this.renderer.slotEls[d.slot];
    const pieceInSlot = slotEl.querySelector('.piece');
    const dst = (pieceInSlot || slotEl).getBoundingClientRect();
    const scale = dst.width / d.w || 0.5;
    d.el.classList.add('returning');
    d.el.style.transition = '';
    d.el.style.transform = `translate(${dst.left}px, ${dst.top}px) scale(${scale})`;
    setTimeout(() => {
      d.el.remove();
      this.renderer.setSlotDragging(d.slot, false);
    }, 230);
  }
}

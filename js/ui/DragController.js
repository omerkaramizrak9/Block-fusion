// Dokunmatik / fare sürükle-bırak. Pointer Events kullanır (Android Chrome destekler).
import { CONFIG } from '../config.js';
import { buildPieceEl } from './Renderer.js';

export class DragController {
  constructor({ game, renderer, els, layout }) {
    this.game = game;
    this.renderer = renderer;
    this.els = els;
    this.layout = layout;
    this.drag = null;

    els.tray.addEventListener('pointerdown', (e) => this._onDown(e));
    window.addEventListener('pointermove', (e) => this._onMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this._onUp(e));
    window.addEventListener('pointercancel', (e) => this._onUp(e, true));
  }

  _onDown(e) {
    if (this.drag || this.game.state !== 'playing') return;
    const slotEl = e.target.closest('.slot');
    if (!slotEl) return;
    const slot = Number(slotEl.dataset.slot);
    const piece = this.game.tray[slot];
    if (!piece) return;
    e.preventDefault();

    const pitch = this.layout.pitch;
    const el = buildPieceEl(piece, 'drag-piece', `${pitch}px`);
    this.els.dragLayer.appendChild(el);

    const w = piece.shape.cols * pitch;
    const h = piece.shape.rows * pitch;
    this.drag = {
      pointerId: e.pointerId, slot, piece, el, w, h,
      x: e.clientX, y: e.clientY,
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

    const rect = this.els.grid.getBoundingClientRect();
    const pitch = rect.width / CONFIG.boardSize;
    const col = Math.round((left - rect.left) / pitch);
    const row = Math.round((top - rect.top) / pitch);
    if (row === d.row && col === d.col) return;
    d.row = row;
    d.col = col;
    d.res = this.game.preview(d.slot, row, col);
    this.renderer.showPreview(d.res, row, col);
  }

  _onUp(e, cancelled = false) {
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

// Oyun çekirdeği: kurallar ve durum. Arayüzden bağımsızdır; olaylar
// EventBus üzerinden yayınlanır.
//
// Olaylar:
//   'start'    { board, tray, score }
//   'tray'     { tray, fresh }            tepsi değişti (fresh: yeni set geldi)
//   'placed'   { slot, piece, row, col, placed, cleared, lines, result }
//   'score'    { value, best, combo, delta }
//   'gameover' { score, best, isNewBest }
//   'powerup'  { id, row, col, cleared }

import { CONFIG } from '../config.js';
import { Board } from './Board.js';
import { Score } from './Score.js';
import { PowerUps } from '../powerups/PowerUps.js';
import { pieceToData, pieceFromData } from './Pieces.js';
import { storage } from '../storage.js';

const SAVE_VERSION = 1;

export class Game {
  constructor({ mode, bus }) {
    this.mode = mode;
    this.bus = bus;
    this.board = new Board(CONFIG.boardSize);
    this.score = new Score({ bestKey: mode.bestKey });
    this.tray = [];
    this.state = 'idle'; // 'playing' | 'over'
  }

  /** Kayıtlı yarım oyun varsa onu yükler, yoksa yeni oyun başlatır. */
  startOrResume() {
    if (!this.resume()) this.start();
  }

  start() {
    this.clearSave();
    this.board.reset();
    this.score.reset();
    this.startBest = this.score.best;
    this.state = 'playing';
    this.mode.setup(this);
    this.tray = this.mode.createTray(this);
    this.bus.emit('start', { board: this.board, tray: this.tray, score: this.score });
    this.bus.emit('tray', { tray: this.tray, fresh: true });
    this._emitScore(0);
    this.save();
  }

  // ---------- Kaydet / yükle ----------
  serialize() {
    return {
      v: SAVE_VERSION,
      mode: this.mode.id,
      board: this.board.cells.map((row) => row.map((c) => (c ? c.color : 0))),
      tray: this.tray.map(pieceToData),
      score: this.score.value,
      combo: this.score.combo,
      movesSinceClear: this.score.movesSinceClear,
      startBest: this.startBest
    };
  }

  save() {
    if (!this.mode.saveKey || this.state !== 'playing') return;
    storage.set(this.mode.saveKey, this.serialize());
  }

  clearSave() {
    if (this.mode.saveKey) storage.remove(this.mode.saveKey);
  }

  /** @returns {boolean} kayıt bulunup yüklendiyse true */
  resume() {
    const data = this.mode.saveKey && storage.get(this.mode.saveKey);
    if (!data || data.v !== SAVE_VERSION || data.mode !== this.mode.id) return false;
    const n = this.board.size;
    if (!Array.isArray(data.board) || data.board.length !== n) return false;
    const tray = (data.tray || []).map(pieceFromData);
    if (tray.length !== CONFIG.traySize) return false;

    this.board.reset();
    data.board.forEach((row, r) => row.forEach((color, c) => {
      if (color) this.board.cells[r][c] = { color };
    }));
    this.score.reset();
    this.score.value = data.score | 0;
    this.score.combo = data.combo | 0;
    this.score.movesSinceClear = data.movesSinceClear | 0;
    this.startBest = data.startBest ?? this.score.best;
    this.tray = tray.every((p) => p === null) ? this.mode.createTray(this) : tray;
    this.state = 'playing';

    this.bus.emit('start', { board: this.board, tray: this.tray, score: this.score, resumed: true });
    this.bus.emit('tray', { tray: this.tray, fresh: true });
    this._emitScore(0);
    this._checkGameOver();
    return true;
  }

  /** Parçanın bu konuma bırakılması geçerli mi ve hangi hatlar temizlenir? */
  preview(slot, row, col) {
    const piece = this.tray[slot];
    if (!piece || this.state !== 'playing') return { valid: false };
    if (!this.board.canPlace(piece.shape, row, col)) return { valid: false };
    return { valid: true, piece, lines: this.board.simulateLines(piece.shape, row, col) };
  }

  tryPlace(slot, row, col) {
    const piece = this.tray[slot];
    if (!piece || this.state !== 'playing') return false;
    if (!this.board.canPlace(piece.shape, row, col)) return false;

    const placed = this.board.place(piece.shape, row, col, piece.color);
    const lines = this.board.findFullLines();
    const cleared = this.board.clearLines(lines);
    const lineCount = lines.rows.length + lines.cols.length;
    const result = this.score.registerMove({
      cellsPlaced: placed.length,
      lines: lineCount,
      boardClear: lineCount > 0 && this.board.isClear()
    });

    this.tray[slot] = null;
    this.bus.emit('placed', { slot, piece, row, col, placed, cleared, lines, result });
    this._emitScore(result.points);

    this.mode.afterMove(this, result);

    if (this.tray.every((p) => p === null)) {
      this.tray = this.mode.createTray(this);
      this.bus.emit('tray', { tray: this.tray, fresh: true });
    } else {
      this.bus.emit('tray', { tray: this.tray, fresh: false });
    }

    this._checkGameOver();
    this.save();
    return true;
  }

  /** İleride arayüzden çağrılacak: bir gücü hedef hücreye uygula. */
  usePowerUp(id, row, col) {
    const def = PowerUps.get(id);
    if (!def || this.state !== 'playing') return null;
    const cleared = this.board.clearCells(def.getCells(this.board, row, col));
    const points = cleared.length * CONFIG.scoring.perCell * 2;
    this.score.add(points);
    this.bus.emit('powerup', { id, row, col, cleared });
    this._emitScore(points);
    this.save();
    return cleared;
  }

  _checkGameOver() {
    if (this.state === 'playing' && this.mode.isGameOver(this)) {
      this.state = 'over';
      this.clearSave();
      this.bus.emit('gameover', {
        score: this.score.value,
        best: this.score.best,
        isNewBest: this.score.value > this.startBest
      });
    }
  }

  _emitScore(delta) {
    this.bus.emit('score', {
      value: this.score.value,
      best: this.score.best,
      combo: this.score.combo,
      delta
    });
  }
}

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
//   'rotations'      { count, delta, source }   döndürme hakkı değişti
//   'rotated'        { slot, piece }            parça döndürüldü
//   'rotate-denied'  { slot, reason }           'no-rights' | 'symmetric' | 'state'
//   'stuck'          { }                        hamle yok ama döndürme kurtarabilir;
//                                               arayüz ödüllü reklam teklif eder,
//                                               sonra addRotations() ya da declineRescue()
//   'unstuck'        { }
//   'record'         { score, previousBest }    bu oyunda önceki rekor ilk kez geçildi

import { CONFIG, LEGACY_COLORS, PALETTE_SIZE } from '../config.js';
import { Board } from './Board.js';
import { Score } from './Score.js';
import { PowerUps } from '../powerups/PowerUps.js';
import { pieceToData, pieceFromData } from './Pieces.js';
import { rotateCW, isRotationSymmetric, otherOrientations } from './Rotation.js';
import { storage } from '../storage.js';

const SAVE_VERSION = 2; // v2: renkler palet indeksi (v1: renk kodu)

/** Kayıttaki renk değerini palet indeksine çevirir (v1 uyumluluğu). */
function toColorIndex(v) {
  if (typeof v === 'number') return ((v % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
  const i = LEGACY_COLORS.indexOf(String(v).toLowerCase());
  return i >= 0 ? i : 0;
}

export class Game {
  constructor({ mode, bus }) {
    this.mode = mode;
    this.bus = bus;
    this.board = new Board(CONFIG.boardSize);
    this.score = new Score({ bestKey: mode.bestKey });
    this.tray = [];
    this.state = 'idle'; // 'playing' | 'stuck' | 'over'
    this.rotations = CONFIG.rotation.startingRights;
    this.adsWatched = 0; // bu oyunda izlenen ödüllü reklam
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
    this.adsWatched = 0;
    this.recordBroken = false;
    if (CONFIG.rotation.resetEachGame || this.rotations === undefined) {
      this.rotations = CONFIG.rotation.startingRights;
    }
    this.mode.setup(this);
    this.tray = this.mode.createTray(this);
    this.bus.emit('start', { board: this.board, tray: this.tray, score: this.score });
    this.bus.emit('tray', { tray: this.tray, fresh: true });
    this._emitScore(0);
    this._emitRotations(0, 'start');
    this.save();
  }

  // ---------- Kaydet / yükle ----------
  serialize() {
    return {
      v: SAVE_VERSION,
      mode: this.mode.id,
      board: this.board.cells.map((row) => row.map((c) => (c ? c.color + 1 : 0))), // 0 = boş
      tray: this.tray.map(pieceToData),
      score: this.score.value,
      combo: this.score.combo,
      movesSinceClear: this.score.movesSinceClear,
      startBest: this.startBest,
      rotations: this.rotations,
      adsWatched: this.adsWatched,
      recordBroken: this.recordBroken
    };
  }

  save() {
    if (!this.mode.saveKey || (this.state !== 'playing' && this.state !== 'stuck')) return;
    storage.set(this.mode.saveKey, this.serialize());
  }

  clearSave() {
    if (this.mode.saveKey) storage.remove(this.mode.saveKey);
  }

  /** @returns {boolean} kayıt bulunup yüklendiyse true */
  resume() {
    const data = this.mode.saveKey && storage.get(this.mode.saveKey);
    if (!data || (data.v !== 1 && data.v !== SAVE_VERSION) || data.mode !== this.mode.id) return false;
    const legacy = data.v === 1;
    const n = this.board.size;
    if (!Array.isArray(data.board) || data.board.length !== n) return false;
    const tray = (data.tray || []).map((d) => pieceFromData(d && { ...d, c: toColorIndex(d.c) }));
    if (tray.length !== CONFIG.traySize) return false;

    this.board.reset();
    data.board.forEach((row, r) => row.forEach((color, c) => {
      if (color) this.board.cells[r][c] = { color: legacy ? toColorIndex(color) : toColorIndex(color - 1) };
    }));
    this.score.reset();
    this.score.value = data.score | 0;
    this.score.combo = data.combo | 0;
    this.score.movesSinceClear = data.movesSinceClear | 0;
    this.startBest = data.startBest ?? this.score.best;
    this.rotations = Number.isFinite(data.rotations) ? Math.max(0, data.rotations) : CONFIG.rotation.startingRights;
    this.adsWatched = data.adsWatched | 0;
    this.recordBroken = !!data.recordBroken;
    this.tray = tray.every((p) => p === null) ? this.mode.createTray(this) : tray;
    this.state = 'playing';

    this.bus.emit('start', { board: this.board, tray: this.tray, score: this.score, resumed: true });
    this.bus.emit('tray', { tray: this.tray, fresh: true });
    this._emitScore(0);
    this._emitRotations(0, 'resume');
    this._checkGameOver();
    return true;
  }

  // ---------- Döndürme ----------
  get rotationCost() { return CONFIG.rotation.costPerTurn; }

  canRotate() { return this.rotations >= this.rotationCost; }

  /** Tepsideki parçayı 90° saat yönünde döndürür, 1 hak tüketir. */
  rotatePiece(slot) {
    const piece = this.tray[slot];
    const deny = (reason) => {
      this.bus.emit('rotate-denied', { slot, reason });
      return { ok: false, reason };
    };
    if (!piece) return { ok: false, reason: 'empty' };
    if (this.state !== 'playing') return deny('state');
    if (isRotationSymmetric(piece.shape)) return deny('symmetric'); // hak harcatma
    if (!this.canRotate()) return deny('no-rights');

    piece.shape = rotateCW(piece.shape);
    this.rotations -= this.rotationCost;
    this.bus.emit('rotated', { slot, piece });
    this.bus.emit('tray', { tray: this.tray, fresh: false });
    this._emitRotations(-this.rotationCost, 'rotate');
    this._checkGameOver();
    this.save();
    return { ok: true };
  }

  /** Ödül, satın alma vb. kaynaklardan hak ekler. */
  addRotations(amount, source = 'reward') {
    if (!(amount > 0) || this.state === 'over') return;
    this.rotations += amount;
    this._emitRotations(amount, source);
    if (this.state === 'stuck') {
      this.state = 'playing';
      this.bus.emit('unstuck', {});
      this.bus.emit('tray', { tray: this.tray, fresh: false });
      this._checkGameOver();
    }
    this.save();
  }

  /** Oyuncu kurtarma teklifini reddetti (veya reklam yok): oyun biter. */
  declineRescue() {
    if (this.state === 'stuck') this._endGame();
  }

  /** Parça (gerekirse mevcut haklarla döndürülerek) tahtaya sığar mı? */
  pieceFits(piece, maxTurns = 0) {
    if (this.board.hasRoomFor(piece.shape)) return true;
    return otherOrientations(piece.shape)
      .some(({ shape, turns }) => turns <= maxTurns && this.board.hasRoomFor(shape));
  }

  /** Döndürme hakkı sınırsız olsaydı oyun devam edebilir miydi? */
  rotationWouldHelp() {
    return this.tray.some((p) => p && this.pieceFits(p, 3));
  }

  /** Mevcut haklarla en fazla kaç kez döndürülebilir. */
  get affordableTurns() {
    return Math.min(3, Math.floor(this.rotations / this.rotationCost));
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
    if (this.state !== 'playing' || !this.mode.isGameOver(this)) return;
    // Hak yetmiyor ama döndürme kurtarabilir: arayüze ödüllü reklam teklifi için fırsat ver
    if (this.rotationWouldHelp()) {
      this.state = 'stuck';
      this.bus.emit('stuck', {});
      return;
    }
    this._endGame();
  }

  _endGame() {
    this.state = 'over';
    this.clearSave();
    this.bus.emit('gameover', {
      score: this.score.value,
      best: this.score.best,
      isNewBest: this.score.value > this.startBest
    });
  }

  _emitRotations(delta, source) {
    this.bus.emit('rotations', { count: this.rotations, delta, source });
  }

  _emitScore(delta) {
    this.bus.emit('score', {
      value: this.score.value,
      best: this.score.best,
      combo: this.score.combo,
      delta
    });
    // Önceki rekor bu oyunda ilk kez geçildi (ilk oyun hariç: geçilecek rekor yoksa kutlama yok)
    if (!this.recordBroken && this.startBest > 0 && this.score.value > this.startBest) {
      this.recordBroken = true;
      this.bus.emit('record', { score: this.score.value, previousBest: this.startBest });
    }
  }
}

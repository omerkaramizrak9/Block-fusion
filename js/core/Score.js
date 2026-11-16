// Puan ve kombo hesaplama.
import { CONFIG } from '../config.js';
import { storage } from '../storage.js';

export class Score {
  constructor({ bestKey, scoring = CONFIG.scoring, comboGrace = CONFIG.comboGrace } = {}) {
    this.bestKey = bestKey;
    this.scoring = scoring;
    this.comboGrace = comboGrace;
    this.best = Number(storage.get(bestKey, 0)) || 0;
    this.reset();
  }

  reset() {
    this.value = 0;
    this.combo = 0;           // ardışık temizleme sayısı
    this.movesSinceClear = 0;
  }

  /**
   * Bir hamleyi puanlar.
   * @returns {{ points, linePoints, lines, combo, boardClear }}
   */
  registerMove({ cellsPlaced, lines, boardClear = false }) {
    const s = this.scoring;
    let points = cellsPlaced * s.perCell;
    let linePoints = 0;

    if (lines > 0) {
      this.combo += 1;
      this.movesSinceClear = 0;
      // 1 hat: 10, 2 hat: 40, 3 hat: 90 ... × kombo çarpanı
      linePoints = s.perLine * lines * lines * this.combo;
      if (boardClear) linePoints += s.boardClearBonus;
      points += linePoints;
    } else {
      this.movesSinceClear += 1;
      if (this.movesSinceClear >= this.comboGrace) this.combo = 0;
    }

    this.add(points);
    return { points, linePoints, lines, combo: this.combo, boardClear };
  }

  add(points) {
    this.value += points;
    if (this.value > this.best) {
      this.best = this.value;
      storage.set(this.bestKey, this.best);
    }
  }
}

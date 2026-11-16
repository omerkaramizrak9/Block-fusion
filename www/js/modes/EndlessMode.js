// Sonsuz Mod: hamle kalmayana kadar oyna, en yüksek skoru yap.
//
// Mod arayüzü (Macera Modu da aynı metotları sağlamalı):
//   id, name, bestKey
//   setup(game)               -> oyun başlarken tahtayı hazırla (ör. engeller)
//   createTray(game)          -> yeni parça dizisi döndür
//   afterMove(game, result)   -> hamle sonrası (ör. görev kontrolü, kazanma)
//   isGameOver(game)          -> true ise oyun biter
//   saveKey                   -> yarım kalan oyunun kayıt anahtarı (null: kaydetme)

import { CONFIG } from '../config.js';
import { generateTray } from '../core/Pieces.js';

export class EndlessMode {
  constructor() {
    this.id = 'endless';
    this.name = 'Sonsuz Mod';
    this.bestKey = CONFIG.storageKeys.bestEndless;
    this.saveKey = CONFIG.storageKeys.saveEndless;
  }

  setup(_game) { /* Sonsuz modda boş tahtayla başlanır */ }

  createTray(game) {
    return generateTray(game.board, { count: CONFIG.traySize, attempts: CONFIG.fairTrayAttempts });
  }

  afterMove(_game, _result) { /* Sonsuz modda ek kural yok */ }

  isGameOver(game) {
    const remaining = game.tray.filter(Boolean);
    // Mevcut döndürme haklarıyla yerleştirilebilecek parça varsa oyun sürer
    return remaining.length > 0 && !remaining.some((p) => game.pieceFits(p, game.affordableTurns));
  }
}

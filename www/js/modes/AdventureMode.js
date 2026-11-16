// Macera Modu — İSKELET (bölüm içerikleri ve hedefler sonraki aşama).
// Şu an arayüzden açılmıyor. Hazır olan: her 20 bölümde bir değişen
// dünya / renk paleti / arka plan atmosferi (theme/themes.js → atmosphereForLevel).
//
// Yapılacaklar:
//   - Bölüm verisi (levels.js): hedef (ör. X puan, Y hat temizle), engel blokları, hamle sınırı
//   - afterMove: hedef kontrolü → 'level:complete' olayı
//   - Bölüm haritası ekranı, dünya geçiş animasyonu
//   - Yeni dünyaya ulaşınca o dünyanın teması Sonsuz Mod için de açılır:
//       themes.checkProgress({ adventureWorld: atmosphere.worldIndex })

import { CONFIG } from '../config.js';
import { generateTray } from '../core/Pieces.js';
import { atmosphereForLevel } from '../theme/themes.js';

export class AdventureMode {
  constructor(level = 1) {
    this.id = 'adventure';
    this.name = 'Macera Modu';
    this.level = level;
    this.atmosphere = atmosphereForLevel(level);
    this.bestKey = `blockfusion.best.adventure.${level}`;
    this.saveKey = null; // bölümler kısa; yarım kayıt şimdilik yok
  }

  /** Tema oyuncu seçimine değil, bölümün dünyasına bağlıdır. */
  themeId() { return this.atmosphere.theme.id; }

  setup(_game) { /* TODO: bölüm verisindeki engel bloklarını yerleştir */ }

  createTray(game) {
    return generateTray(game.board, { count: CONFIG.traySize, attempts: CONFIG.fairTrayAttempts });
  }

  afterMove(_game, _result) { /* TODO: bölüm hedefi kontrolü */ }

  isGameOver(game) {
    const remaining = game.tray.filter(Boolean);
    return remaining.length > 0 && !remaining.some((p) => game.pieceFits(p, game.affordableTurns));
  }
}

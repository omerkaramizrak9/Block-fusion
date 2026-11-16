// Ekran boyutuna göre tahta ve tepsi ölçülerini hesaplar.
import { CONFIG } from '../config.js';

export class Layout {
  constructor() {
    this.pitch = 40;
    this.update = this.update.bind(this);
    window.addEventListener('resize', this.update);
    window.addEventListener('orientationchange', () => setTimeout(this.update, 150));
    window.visualViewport?.addEventListener('resize', this.update);
    this.update();
  }

  update() {
    const vw = window.visualViewport?.width || window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;
    const n = CONFIG.boardSize;

    const hud = 86, boardPad = 20, trayExtra = 34, margins = 34;
    const byWidth = (vw - 24 - boardPad) / n;
    // Toplam yükseklik ≈ hud + 8·pitch + pad + (2.5·pitch + tray) + kenarlar
    const byHeight = (vh - hud - boardPad - trayExtra - margins) / (n + 2.5);
    const pitch = Math.max(28, Math.floor(Math.min(byWidth, byHeight, 62)));

    const slotWidth = (pitch * n + boardPad) / CONFIG.traySize;
    const trayPitch = Math.floor(Math.min(pitch * 0.5, slotWidth / 5.6));

    this.pitch = pitch;
    const root = document.documentElement.style;
    root.setProperty('--pitch', `${pitch}px`);
    root.setProperty('--board', `${pitch * n}px`);
    root.setProperty('--tray-pitch', `${trayPitch}px`);
    root.setProperty('--gap', `${Math.max(2, Math.round(pitch * 0.08))}px`);
    root.setProperty('--radius', `${Math.max(4, Math.round(pitch * 0.18))}px`);
  }
}

// Ekran boyutuna göre tahta ve tepsi ölçülerini hesaplar.
// Android ve iOS'ta (çentik, ana ekran çubuğu, Safari adres çubuğu) güvenli
// alanı hesaba katar.
import { CONFIG } from '../config.js';

export class Layout {
  constructor(appEl) {
    this.appEl = appEl;
    this.pitch = 40;
    this._raf = 0;
    this.schedule = () => {
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => this.update());
    };
    window.addEventListener('resize', this.schedule);
    // iOS yönelim değişiminden sonra ölçüler biraz gecikmeli güncellenir
    window.addEventListener('orientationchange', () => setTimeout(this.schedule, 200));
    window.visualViewport?.addEventListener('resize', this.schedule);
    this.update();
  }

  update() {
    const vw = window.innerWidth;
    // Görünür yükseklik: Safari/Chrome adres çubuğu açık/kapalıyken doğru değer
    const vh = Math.round(window.visualViewport?.height || window.innerHeight);
    const root = document.documentElement.style;
    root.setProperty('--app-h', `${vh}px`);

    // #app dolgusu env(safe-area-inset-*) içerir; ölçüp düşüyoruz
    const cs = getComputedStyle(this.appEl);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);

    const n = CONFIG.boardSize;
    const hud = 100, rotateBar = 50, boardPad = 24, trayExtra = 30, gaps = 14; // boardPad: 2×10 dolgu + 2×2 metal çerçeve
    const byWidth = (vw - padX - boardPad) / n;
    // Toplam yükseklik ≈ hud + 8·pitch + pad + (2.5·pitch + tray) + boşluklar
    const byHeight = (vh - padY - hud - rotateBar - boardPad - trayExtra - gaps) / (n + 2.5);
    const pitch = Math.max(26, Math.floor(Math.min(byWidth, byHeight, 64)));

    const slotWidth = (pitch * n + boardPad) / CONFIG.traySize;
    const trayPitch = Math.floor(Math.min(pitch * 0.5, slotWidth / 5.6));

    this.pitch = pitch;
    root.setProperty('--pitch', `${pitch}px`);
    root.setProperty('--board', `${pitch * n}px`);
    root.setProperty('--tray-pitch', `${trayPitch}px`);
    root.setProperty('--gap', `${Math.max(2, Math.round(pitch * 0.08))}px`);
    root.setProperty('--radius', `${Math.max(4, Math.round(pitch * 0.18))}px`);
  }
}

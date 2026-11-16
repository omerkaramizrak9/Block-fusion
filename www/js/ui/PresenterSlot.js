// Canlı sunucu karakteri için yuva (HUD'un solunda, oyun alanını kapatmaz).
// ŞU AN: yalnızca çerçeve + yer tutucu. Gerçek animasyon dosyaları henüz yok.
//
// Oyun olaylarına göre "ruh hâli" (data-mood) güncellenir; ileride bir animasyon
// sürücüsü (Lottie, Rive, sprite sheet veya kısa video) mount() ile takılır ve
// aynı ruh hâllerini oynatır:
//   idle      bekleme
//   happy     hat temizlendi
//   excited   büyük kombo
//   cheer     sinematik kombo / rekor
//   sad       oyun bitti
//
// Sürücü arayüzü:  { attach(stageEl), play(mood), detach() }
// Kurallar: pointer-events yok (dokunuşu engellemez); azaltılmış harekette
// sürücü sakin bir duruş göstermeli.

const HOLD_MS = { happy: 1200, excited: 1600, cheer: 2200 };

export class PresenterSlot {
  constructor({ el, bus, settings }) {
    this.el = el;
    this.stage = el.querySelector('.presenter-stage');
    this.settings = settings;
    this.driver = null;
    this.timer = null;

    bus.on('placed', ({ lines, result }) => {
      const n = lines.rows.length + lines.cols.length;
      if (!n) return;
      if (result.combo >= 5 || n >= 4 || result.boardClear) this.setMood('cheer');
      else if (result.combo >= 3) this.setMood('excited');
      else this.setMood('happy');
    });
    bus.on('record', () => this.setMood('cheer'));
    bus.on('gameover', () => this.setMood('sad', 0));
    bus.on('start', () => this.setMood('idle', 0));
  }

  /** Gelecekte animasyon sürücüsünü takmak için. */
  mount(driver) {
    this.driver?.detach?.();
    this.driver = driver;
    driver.attach(this.stage);
    this.el.classList.add('has-driver');
    driver.play(this.el.dataset.mood || 'idle');
  }

  setMood(mood, holdMs = HOLD_MS[mood]) {
    clearTimeout(this.timer);
    this.el.dataset.mood = mood;
    this.driver?.play(mood);
    if (holdMs) this.timer = setTimeout(() => this.setMood('idle', 0), holdMs);
  }
}

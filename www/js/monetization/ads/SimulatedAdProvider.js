// TEST / SİMÜLASYON reklam sağlayıcısı. Gerçek reklam göstermez, para kazandırmaz.
// Ekranda geri sayımlı sahte bir reklam açar.
//   - Süre dolmadan kapatılırsa  -> 'dismissed' (ödül YOK)
//   - Süre dolup kapatılırsa      -> 'completed' (ödül VAR)
//
// Test için adres çubuğu parametreleri:
//   ?ads=fail   yükleme her zaman başarısız
//   ?ads=slow   yükleme zaman aşımına uğrar
//   ?ads=fast   reklam 1 saniye sürer

const params = new URLSearchParams(location.search);

export class SimulatedAdProvider {
  constructor(options = {}) {
    this.name = 'simulated';
    this.opts = { loadDelayMs: 500, durationSec: 5, failRate: 0, ...options };
    const mode = params.get('ads');
    if (mode === 'fail') this.opts.failRate = 1;
    if (mode === 'slow') this.opts.loadDelayMs = 60_000;
    if (mode === 'fast') this.opts.durationSec = 1;
    this.loaded = false;
    this._loading = null;
  }

  async init() { /* gerçek SDK'da: ağ başlatma, izin (GDPR/ATT) akışı */ }

  isLoaded() { return this.loaded; }

  load() {
    if (this.loaded) return Promise.resolve();
    if (this._loading) return this._loading;
    this._loading = new Promise((resolve, reject) => {
      setTimeout(() => {
        this._loading = null;
        if (Math.random() < this.opts.failRate) { reject(new Error('no_fill')); return; }
        this.loaded = true;
        resolve();
      }, this.opts.loadDelayMs);
    });
    return this._loading;
  }

  show() {
    if (!this.loaded) return Promise.resolve('failed');
    this.loaded = false; // her reklam bir kez gösterilir
    return new Promise((resolve) => {
      const total = this.opts.durationSec;
      const el = document.createElement('div');
      el.className = 'sim-ad';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.innerHTML = `
        <div class="sim-ad-top">
          <span class="sim-ad-tag">TEST REKLAMI</span>
          <button class="sim-ad-close" aria-label="Reklamı kapat">✕</button>
        </div>
        <div class="sim-ad-body">
          <div class="sim-ad-logo"><i></i><i></i><i></i><i></i></div>
          <p class="sim-ad-title">Bu bir simülasyon reklamıdır</p>
          <p class="sim-ad-sub">Gerçek reklam entegrasyonu sonraki aşamada eklenecek.</p>
        </div>
        <div class="sim-ad-bottom">
          <div class="sim-ad-bar"><b></b></div>
          <p class="sim-ad-status"></p>
        </div>`;
      document.body.appendChild(el);

      const status = el.querySelector('.sim-ad-status');
      const bar = el.querySelector('.sim-ad-bar b');
      const closeBtn = el.querySelector('.sim-ad-close');
      let left = total;
      let done = false;
      const render = () => {
        bar.style.width = `${((total - left) / total) * 100}%`;
        status.textContent = done
          ? 'Ödül kazanıldı! Kapatabilirsin.'
          : `Ödül için ${left} sn izle`;
        el.classList.toggle('done', done);
      };
      render();
      const timer = setInterval(() => {
        left -= 1;
        if (left <= 0) { left = 0; done = true; clearInterval(timer); }
        render();
      }, 1000);

      closeBtn.addEventListener('click', () => {
        clearInterval(timer);
        el.classList.add('closing');
        setTimeout(() => el.remove(), 200);
        resolve(done ? 'completed' : 'dismissed');
      }, { once: true });
    });
  }
}

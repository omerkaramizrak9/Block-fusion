// Ödüllü reklam servisi: oyunun reklamla konuştuğu TEK nokta.
//
// Sağlayıcı (provider) arayüzü — her reklam ağı bunu uygular:
//   name: string
//   init(): Promise<void>
//   load(): Promise<void>               reklamı önceden yükler; hata fırlatabilir
//   isLoaded(): boolean
//   show(placement): Promise<'completed' | 'dismissed' | 'failed'>
//       'completed' YALNIZCA reklam ağı ödül olayını bildirdiyse döner.
//
// Garanti kuralları:
//   1. Ödül yalnızca sonuç 'completed' ise verilir (showRewarded -> rewarded: true).
//   2. showRewarded() asla hata fırlatmaz; her durumda { rewarded, reason } döner.
//   3. Aynı anda iki reklam gösterilemez.
//   4. Yükleme zaman aşımına uğrarsa oyun beklemede kalmaz.

import { CONFIG } from '../../config.js';

const withTimeout = (promise, ms) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout')), ms);
  promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
});

export class AdService {
  constructor({ provider, bus, entitlements = null }) {
    this.provider = provider;
    this.bus = bus;
    this.entitlements = entitlements;
    this.showing = false;
    this.ready = false;
  }

  async init() {
    try {
      await this.provider.init();
      this.ready = true;
      this.preload();
    } catch (err) {
      console.warn('[Ads] başlatılamadı:', err);
      this.ready = false;
    }
  }

  /** Arka planda bir sonraki reklamı hazırla (hata yutulur). */
  preload() {
    if (!this.ready || this.provider.isLoaded()) return;
    this.provider.load().catch(() => { /* gösterimde yeniden denenir */ });
  }

  /** Reklam altyapısı açık mı (sağlayıcı başlatıldı mı)? */
  get enabled() { return this.ready; }

  /**
   * Ödüllü reklam gösterir.
   * @param {string} placement  ör. 'rotation_refill', 'rotation_rescue'
   * @returns {Promise<{ rewarded: boolean, reason: string }>}
   *   reason: 'completed' | 'dismissed' | 'failed' | 'load_failed' | 'timeout' | 'busy' | 'unavailable'
   */
  async showRewarded(placement) {
    if (!this.ready) return { rewarded: false, reason: 'unavailable' };
    if (this.showing) return { rewarded: false, reason: 'busy' };
    this.showing = true;
    this.bus?.emit('ad:start', { placement });
    let outcome;
    try {
      if (!this.provider.isLoaded()) {
        this.bus?.emit('ad:loading', { placement });
        await withTimeout(this.provider.load(), CONFIG.ads.loadTimeoutMs);
      }
      const result = await this.provider.show(placement);
      outcome = { rewarded: result === 'completed', reason: result };
    } catch (err) {
      outcome = { rewarded: false, reason: err?.message === 'timeout' ? 'timeout' : 'load_failed' };
    } finally {
      this.showing = false;
    }
    this.bus?.emit('ad:end', { placement, ...outcome });
    this.preload();
    return outcome;
  }
}

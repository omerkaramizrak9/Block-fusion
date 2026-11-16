// Uygulama içi satın alma servisi — İSKELET (sonraki aşama). Arayüze bağlı değil.
//
// Sağlayıcı arayüzü (gerçek: Google Play Billing / Apple StoreKit, Capacitor
// eklentisi üzerinden; örn. RevenueCat veya cordova-plugin-purchase):
//   init(productIds): Promise<void>
//   getProducts(): Promise<[{ id, price, currency, title }]>   mağazadan yerel fiyatlar
//   purchase(id): Promise<{ status: 'purchased'|'cancelled'|'pending'|'failed', transactionId }>
//   restore(): Promise<string[]>                                 geri yüklenen ürün id'leri
//
// Kurallar:
//   - Hak, yalnızca mağaza satın almayı onayladıktan sonra verilir.
//   - Kalıcı ürünler için "Satın alımları geri yükle" butonu zorunludur (Apple kuralı).
//   - Mümkünse makbuz sunucuda doğrulanmalıdır (hile önleme).

import { PRODUCTS, PRODUCTS_BY_ID } from './catalog.js';
import { storage } from '../../storage.js';

const ENT_KEY = 'blockfusion.entitlements';

/** Kalıcı kilitler (reklamsız, temalar, premium). */
export class Entitlements {
  constructor() { this.set = new Set(storage.get(ENT_KEY, [])); }
  has(id) { return this.set.has(id); }
  grant(ids) {
    [].concat(ids).forEach((id) => this.set.add(id));
    storage.set(ENT_KEY, [...this.set]);
  }
}

export class StoreService {
  constructor({ provider, entitlements, inventory, bus }) {
    this.provider = provider;          // null: mağaza kapalı
    this.entitlements = entitlements;
    this.inventory = inventory;        // { add(item, amount) }
    this.bus = bus;
  }

  get enabled() { return !!this.provider; }

  async init() {
    if (!this.provider) return;
    try { await this.provider.init(PRODUCTS.map((p) => p.id)); } catch (e) { this.provider = null; }
  }

  async purchase(productId) {
    const product = PRODUCTS_BY_ID.get(productId);
    if (!this.provider || !product) return { ok: false, reason: 'unavailable' };
    try {
      const res = await this.provider.purchase(productId);
      if (res.status !== 'purchased') return { ok: false, reason: res.status };
      this._grant(product);
      this.bus?.emit('store:purchased', { productId });
      return { ok: true };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  }

  async restore() {
    if (!this.provider) return [];
    const ids = await this.provider.restore();
    ids.map((id) => PRODUCTS_BY_ID.get(id))
      .filter((p) => p && p.type !== 'consumable')
      .forEach((p) => this._grant(p));
    return ids;
  }

  _grant(product) {
    const g = product.grants;
    if (g.entitlement) this.entitlements.grant(g.entitlement);
    if (g.inventory && this.inventory) {
      Object.entries(g.inventory).forEach(([item, n]) => this.inventory.add(item, n));
    }
  }
}

// Ayara göre reklam sağlayıcısını seçer. Yeni bir ağ eklemek için yalnızca
// buraya bir dal ve yeni bir *Provider.js dosyası eklenir.
import { CONFIG } from '../../config.js';
import { SimulatedAdProvider } from './SimulatedAdProvider.js';
import { AdMobProvider } from './AdMobProvider.js';

export function createAdProvider(platform) {
  const kind = CONFIG.ads.provider;
  if (kind === 'admob' && platform.isNative && window.Capacitor?.Plugins?.AdMob) {
    return new AdMobProvider({ os: platform.os });
  }
  // Varsayılan ve web: simülasyon (yerel eklenti yoksa da güvenli geri dönüş)
  return new SimulatedAdProvider(CONFIG.ads.simulated);
}

// Oyuncu ayarları (kalıcı). Değişince bus üzerinden 'settings' olayı yayınlanır.
import { storage } from '../storage.js';
import { DEFAULT_THEME } from '../theme/themes.js';

export const SETTINGS_KEY = 'blockfusion.settings';

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

const DEFAULTS = {
  vibration: true,               // dokunsal geri bildirim
  intenseEffects: true,          // ekran sarsıntısı, renk dalgaları, parçacıklar
  endlessTheme: DEFAULT_THEME    // Sonsuz Mod'da seçili tema
};

export class Settings {
  constructor(bus) {
    this.bus = bus;
    const saved = storage.get(SETTINGS_KEY, null);
    // İlk açılışta: işletim sistemi "hareketi azalt" diyorsa yoğun efektler kapalı başlar
    const firstRun = { ...DEFAULTS, intenseEffects: !prefersReducedMotion() };
    this.values = { ...firstRun, ...(saved && typeof saved === 'object' ? saved : {}) };
  }

  get(key) { return this.values[key]; }

  set(key, value) {
    if (this.values[key] === value) return;
    this.values[key] = value;
    storage.set(SETTINGS_KEY, this.values);
    this.bus?.emit('settings', { key, value, values: { ...this.values } });
  }
}

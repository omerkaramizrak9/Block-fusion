// Depolama: oyun kodu senkron get/set kullanır (localStorage önbelleği).
// Yerel uygulamada değerler ayrıca Capacitor Preferences'a yazılır; çünkü iOS
// WebView içindeki localStorage'ı sistem gerektiğinde temizleyebilir.
// Açılışta storage.init() ile Preferences'taki değerler önbelleğe geri yüklenir.
import { Platform } from './platform/Platform.js';

const memory = new Map(); // localStorage kullanılamazsa (gizli sekme vb.)

function rawGet(key) {
  try { return localStorage.getItem(key); } catch { return memory.get(key) ?? null; }
}
function rawSet(key, str) {
  try { localStorage.setItem(key, str); } catch { memory.set(key, str); }
}
function rawRemove(key) {
  try { localStorage.removeItem(key); } catch { memory.delete(key); }
}

export const storage = {
  /** Yerel uygulamada kalıcı değerleri önbelleğe yükler. */
  async init(keys) {
    if (!Platform.isNative) return;
    await Promise.all(keys.map(async (key) => {
      const v = await Platform.prefs.get(key);
      if (v !== null && v !== undefined) rawSet(key, v);
    }));
  },

  get(key, fallback = null) {
    const v = rawGet(key);
    if (v === null) return fallback;
    try { return JSON.parse(v); } catch { return fallback; }
  },

  set(key, value) {
    const str = JSON.stringify(value);
    rawSet(key, str);
    Platform.prefs.set(key, str);
  },

  remove(key) {
    rawRemove(key);
    Platform.prefs.remove(key);
  }
};

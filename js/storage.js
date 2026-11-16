// localStorage sarmalayıcı: gizli sekmede/erişim engellendiğinde hata vermez.
export const storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* yok say */ }
  }
};

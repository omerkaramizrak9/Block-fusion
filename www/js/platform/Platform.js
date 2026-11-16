// Platform katmanı: oyunun geri kalanı Android / iOS / web farkını bilmez.
// Web'de tarayıcı API'lerini, Capacitor ile paketlenmiş uygulamada ise
// yerel eklentileri (Haptics, Preferences, StatusBar, SplashScreen, App) kullanır.
//
// Not: Capacitor yerel ortamda eklentileri window.Capacitor.Plugins altında
// sunar; bu sayede derleme aracı (bundler) olmadan ES modülleriyle çalışırız.

const Cap = window.Capacitor;
const plugins = Cap?.Plugins ?? {};

function detectOS() {
  const native = Cap?.getPlatform?.();
  if (native && native !== 'web') return native; // 'ios' | 'android'
  const ua = navigator.userAgent || '';
  // iPadOS 13+ kendini Mac olarak tanıtır; dokunmatik noktadan ayırt ederiz.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web';
}

const HAPTIC_WEB = { light: 8, medium: 18, heavy: [30, 60, 30], success: [15, 40, 25] };
const HAPTIC_STYLE = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' };

export const Platform = {
  isNative: !!Cap?.isNativePlatform?.(),
  os: detectOS(),

  /** Dokunsal geri bildirim. iOS Safari'de (web) titreşim API'si yoktur; sessizce geçilir. */
  haptic(kind = 'light') {
    try {
      if (this.isNative && plugins.Haptics) {
        if (kind === 'success') plugins.Haptics.notification({ type: 'SUCCESS' });
        else plugins.Haptics.impact({ style: HAPTIC_STYLE[kind] || 'LIGHT' });
        return;
      }
      navigator.vibrate?.(HAPTIC_WEB[kind] ?? 10);
    } catch { /* desteklenmiyor */ }
  },

  /** Kalıcı depolama (yerelde Preferences, web'de localStorage). */
  prefs: {
    async get(key) {
      if (!plugins.Preferences) return null;
      try { return (await plugins.Preferences.get({ key })).value; } catch { return null; }
    },
    async set(key, value) {
      if (!plugins.Preferences) return;
      try { await plugins.Preferences.set({ key, value }); } catch { /* yok say */ }
    },
    async remove(key) {
      if (!plugins.Preferences) return;
      try { await plugins.Preferences.remove({ key }); } catch { /* yok say */ }
    }
  },

  /** Uygulama arka plana geçince / kapanırken çağrılır (durumu kaydetmek için). */
  onPause(fn) {
    document.addEventListener('visibilitychange', () => { if (document.hidden) fn(); });
    window.addEventListener('pagehide', fn);
    plugins.App?.addListener?.('pause', fn);
  },

  /** Android geri tuşu. handler true dönerse olay tüketilmiş sayılır. */
  onBackButton(handler) {
    plugins.App?.addListener?.('backButton', () => {
      if (!handler()) plugins.App.minimizeApp?.();
    });
  },

  /** Açılışta yerel arayüz ayarları. */
  async init() {
    document.documentElement.dataset.os = this.os;
    document.documentElement.dataset.native = String(this.isNative);
    if (!this.isNative) return;
    try {
      await plugins.StatusBar?.setStyle?.({ style: 'DARK' }); // açık renk yazı
      if (this.os === 'android') {
        await plugins.StatusBar?.setBackgroundColor?.({ color: '#0b1638' });
      }
    } catch { /* yok say */ }
  },

  /** Titreşim/dokunsal geri bildirim bu cihazda var mı? (iOS Safari web: yok) */
  get canVibrate() {
    return (this.isNative && !!plugins.Haptics) || typeof navigator.vibrate === 'function';
  },

  /** Android durum çubuğu rengini temaya uydurur (iOS'ta şeffaf kalır). */
  setStatusBarColor(color) {
    if (!this.isNative || this.os !== 'android') return;
    try { plugins.StatusBar?.setBackgroundColor?.({ color }); } catch { /* yok say */ }
  },

  hideSplash() {
    try { plugins.SplashScreen?.hide?.(); } catch { /* yok say */ }
  }
};

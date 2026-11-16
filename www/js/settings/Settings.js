// Oyuncu ayarları (cihazda kalıcı). Her değişiklik anında uygulanır:
// bus üzerinden 'settings' olayı yayınlanır, oyun yeniden başlatılmaz.
import { storage } from '../storage.js';
import { DEFAULT_THEME } from '../theme/themes.js';

export const SETTINGS_KEY = 'blockfusion.settings';

export const DEFAULTS = Object.freeze({
  sfx: true,                 // ses efektleri
  sfxVolume: 70,             // 0–100
  music: true,               // arka plan müziği
  musicVolume: 35,           // 0–100
  haptics: true,             // telefonun fiziksel titreşimi
  hapticStrength: 'normal',  // 'light' | 'normal' | 'strong'
  shake: true,               // oyun alanı sarsıntısı
  effects: true,             // özel animasyonlar ve parçacıklar
  animIntensity: 'normal',   // 'light' | 'normal' | 'strong'
  reducedMotion: 'auto',     // 'auto' (sistem tercihi) | 'on' | 'off'
  endlessTheme: DEFAULT_THEME
});

// Varsayılana dönerken korunanlar (oyuncunun kozmetik seçimi)
const KEEP_ON_RESET = ['endlessTheme'];

const LEVELS = ['light', 'normal', 'strong'];

function systemReducedMotionQuery() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)'); } catch { return null; }
}

/** Eski sürüm ayarlarını (v0.4) yeni anahtarlara çevirir. */
function migrate(saved) {
  if (!saved || typeof saved !== 'object') return {};
  const out = { ...saved };
  if ('vibration' in saved && !('haptics' in saved)) out.haptics = !!saved.vibration;
  if ('intenseEffects' in saved && !('effects' in saved)) {
    out.effects = !!saved.intenseEffects;
    out.shake = !!saved.intenseEffects;
  }
  delete out.vibration;
  delete out.intenseEffects;
  return out;
}

function sanitize(v) {
  const out = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) if (k in v) out[k] = v[k];
  out.sfxVolume = Math.max(0, Math.min(100, Number(out.sfxVolume) || 0));
  out.musicVolume = Math.max(0, Math.min(100, Number(out.musicVolume) || 0));
  if (!LEVELS.includes(out.hapticStrength)) out.hapticStrength = 'normal';
  if (!LEVELS.includes(out.animIntensity)) out.animIntensity = 'normal';
  if (!['auto', 'on', 'off'].includes(out.reducedMotion)) out.reducedMotion = 'auto';
  for (const k of ['sfx', 'music', 'haptics', 'shake', 'effects']) out[k] = !!out[k];
  return out;
}

export class Settings {
  constructor(bus) {
    this.bus = bus;
    this.values = sanitize(migrate(storage.get(SETTINGS_KEY, null)));
    // Sistem "hareketi azalt" tercihi değişirse (auto modunda) anında uygula
    this._mq = systemReducedMotionQuery();
    const onSystemChange = () => {
      if (this.values.reducedMotion === 'auto') this._emit('reducedMotion');
    };
    this._mq?.addEventListener?.('change', onSystemChange);
  }

  get(key) { return this.values[key]; }

  set(key, value) {
    if (!(key in DEFAULTS) || this.values[key] === value) return;
    this.values = sanitize({ ...this.values, [key]: value });
    this._save();
    this._emit(key);
  }

  resetToDefaults() {
    const kept = Object.fromEntries(KEEP_ON_RESET.map((k) => [k, this.values[k]]));
    this.values = sanitize({ ...DEFAULTS, ...kept });
    this._save();
    this._emit('*');
  }

  /** Etkin azaltılmış hareket: ayar 'auto' ise işletim sistemi tercihi. */
  get reducedMotion() {
    const v = this.values.reducedMotion;
    if (v === 'on') return true;
    if (v === 'off') return false;
    return !!this._mq?.matches;
  }

  /** Animasyon gücü çarpanı: hafif 0.6, normal 1, güçlü 1.4 */
  get animScale() {
    return { light: 0.6, normal: 1, strong: 1.4 }[this.values.animIntensity];
  }

  _save() { storage.set(SETTINGS_KEY, this.values); }

  _emit(key) {
    document.documentElement.dataset.motion = this.reducedMotion ? 'reduced' : 'full';
    this.bus?.emit('settings', { key, values: { ...this.values } });
  }

  /** Açılışta kök öğeye hareket tercihini yazar (CSS için). */
  applyRootFlags() {
    document.documentElement.dataset.motion = this.reducedMotion ? 'reduced' : 'full';
  }
}

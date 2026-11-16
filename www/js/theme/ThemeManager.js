// Tema uygulama ve kilit yönetimi.
//   - apply(id): temanın renklerini CSS değişkenlerine yazar (anlık, sayfa yenilemeden)
//   - Kilit açma: skor ilerlemesi, Macera dünyası veya mağaza hakkı (entitlement)
import { storage } from '../storage.js';
import { Platform } from '../platform/Platform.js';
import { THEMES, THEMES_BY_ID, DEFAULT_THEME } from './themes.js';

export const UNLOCKED_KEY = 'blockfusion.themes.unlocked';

const CSS_VARS = {
  bg1: '--bg-1', bg2: '--bg-2', glow1: '--bg-glow-1', glow2: '--bg-glow-2',
  panel: '--panel', panel2: '--panel-2',
  cellEmpty: '--cell-empty', cellEdge: '--cell-empty-edge',
  text: '--text', textDim: '--text-dim', accent: '--accent'
};

export class ThemeManager {
  /**
   * @param entitlements  { has(id) } — mağaza hakları (StoreService.Entitlements)
   */
  constructor({ bus, entitlements = null }) {
    this.bus = bus;
    this.entitlements = entitlements;
    this.unlocked = new Set(storage.get(UNLOCKED_KEY, []));
    this.current = null;
  }

  list() { return THEMES; }

  isUnlocked(theme) {
    const t = typeof theme === 'string' ? THEMES_BY_ID.get(theme) : theme;
    if (!t) return false;
    const u = t.unlock;
    if (u.type === 'free') return true;
    if (u.type === 'product') return !!this.entitlements?.has(`theme:${t.id}`);
    return this.unlocked.has(t.id);
  }

  /** Kilitli temanın nasıl açılacağını anlatan kısa metin. */
  unlockHint(theme) {
    const u = theme.unlock;
    if (u.type === 'score') return `En iyi skor ${u.best}`;
    if (u.type === 'adventure') return `Macera: Dünya ${u.world}`;
    if (u.type === 'product') return 'Mağaza (yakında)';
    return '';
  }

  /**
   * İlerlemeye göre yeni temaları açar.
   * @returns {Array} yeni açılan temalar
   */
  checkProgress({ best = 0, adventureWorld = 0 } = {}) {
    const fresh = THEMES.filter((t) => {
      if (this.unlocked.has(t.id)) return false;
      const u = t.unlock;
      return (u.type === 'score' && best >= u.best) ||
             (u.type === 'adventure' && adventureWorld >= u.world);
    });
    if (fresh.length) {
      fresh.forEach((t) => this.unlocked.add(t.id));
      storage.set(UNLOCKED_KEY, [...this.unlocked]);
      fresh.forEach((t) => this.bus?.emit('theme:unlocked', { theme: t }));
    }
    return fresh;
  }

  /** Açık değilse varsayılan temaya düşer. */
  resolve(id) {
    const t = THEMES_BY_ID.get(id);
    return t && this.isUnlocked(t) ? t : THEMES_BY_ID.get(DEFAULT_THEME);
  }

  apply(id, { force = false } = {}) {
    const theme = typeof id === 'object' ? id : THEMES_BY_ID.get(id) || THEMES_BY_ID.get(DEFAULT_THEME);
    if (!force && this.current === theme.id) return theme;
    const root = document.documentElement.style;
    for (const [k, cssVar] of Object.entries(CSS_VARS)) root.setProperty(cssVar, theme.colors[k]);
    theme.palette.forEach((c, i) => root.setProperty(`--p${i}`, c));
    theme.fx.forEach((c, i) => root.setProperty(`--fx${i}`, c));
    document.documentElement.dataset.theme = theme.id;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg1);
    Platform.setStatusBarColor(theme.colors.bg1);
    this.current = theme.id;
    this.bus?.emit('theme:applied', { theme });
    return theme;
  }
}

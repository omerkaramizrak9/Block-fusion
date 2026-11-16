// Ayarlar menüsü. HTML'deki data-setting="anahtar" öğeleri otomatik bağlanır:
//   checkbox → açık/kapalı, range → sayı (sürüklerken anında), .seg → seçenek.
// Değişiklik anında uygulanır; oyun yeniden başlatılmaz.
import { Platform } from '../platform/Platform.js';

export class SettingsUI {
  constructor({ settings, themes, bus, els, onThemeChosen, onFeedback, audioAvailable, toast }) {
    this.settings = settings;
    this.themes = themes;
    this.els = els;
    this.onThemeChosen = onThemeChosen;
    this.onFeedback = onFeedback; // (tür) → ayar denemesi için kısa ses/titreşim
    this.toast = toast;
    const root = els.settings;

    els.settingsBtn.addEventListener('click', () => this.open());
    els.settingsClose.addEventListener('click', () => this.close());
    root.addEventListener('click', (e) => { if (e.target === root) this.close(); });
    root.querySelector('#settings-reset').addEventListener('click', () => {
      settings.resetToDefaults();
      this.refresh();
      this.toast?.('Varsayılan ayarlar yüklendi');
    });

    // Desteklenmeyen özellikler: kapalı ve açıklamalı (hata yok)
    if (!Platform.canVibrate) {
      root.querySelectorAll('[data-requires="vibrate"]').forEach((el) => el.classList.add('unsupported'));
      root.querySelector('#vib-note').textContent = 'Bu cihazın tarayıcısında desteklenmiyor (uygulamada çalışır)';
    }
    if (!audioAvailable) root.querySelector('#audio-note').classList.remove('hidden');

    // Genel bağlama
    root.querySelectorAll('input[data-setting]').forEach((input) => {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') {
        input.addEventListener('change', () => {
          settings.set(key, input.checked);
          this.onFeedback?.(key, input.checked);
          this.refresh();
        });
      } else if (input.type === 'range') {
        input.addEventListener('input', () => {
          settings.set(key, Number(input.value));
          this._sliderLabel(key);
        });
        input.addEventListener('change', () => this.onFeedback?.(key, Number(input.value)));
      }
    });
    root.querySelectorAll('.seg[data-setting]').forEach((seg) => {
      const key = seg.dataset.setting;
      seg.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-v]');
        if (!btn) return;
        settings.set(key, btn.dataset.v);
        this.onFeedback?.(key, btn.dataset.v);
        this.refresh();
      });
    });

    bus.on('theme:unlocked', () => { if (this.isOpen) this.renderThemes(); });
    bus.on('settings', ({ key }) => { if (this.isOpen && key === 'reducedMotion') this.refresh(); });
  }

  get isOpen() { return !this.els.settings.classList.contains('hidden'); }

  open() {
    this.refresh();
    this.els.settings.classList.remove('hidden');
  }

  close() { this.els.settings.classList.add('hidden'); }

  /** Tüm kontrolleri güncel ayarlarla eşitler. */
  refresh() {
    const s = this.settings;
    const root = this.els.settings;
    root.querySelectorAll('input[data-setting]').forEach((input) => {
      const v = s.get(input.dataset.setting);
      if (input.type === 'checkbox') input.checked = !!v;
      else input.value = String(v);
    });
    root.querySelectorAll('.seg[data-setting]').forEach((seg) => {
      const v = s.get(seg.dataset.setting);
      seg.querySelectorAll('button[data-v]').forEach((b) => {
        const on = b.dataset.v === v;
        b.setAttribute('aria-checked', String(on));
        b.setAttribute('role', 'radio');
      });
    });
    ['sfxVolume', 'musicVolume'].forEach((k) => this._sliderLabel(k));
    // Bağımlı satırlar: üst ayar kapalıysa pasif
    root.querySelectorAll('[data-depends]').forEach((row) => {
      row.classList.toggle('disabled', !s.get(row.dataset.depends));
    });
    const reduced = s.reducedMotion;
    root.querySelectorAll('[data-depends-motion]').forEach((row) => row.classList.toggle('disabled', reduced));
    let sys = false;
    try { sys = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* yok */ }
    root.querySelector('#rm-note').textContent = reduced
      ? 'Sarsıntı ve parçacıklar kapalı, geçişler sade'
      : `Sistem tercihi: ${sys ? 'açık' : 'kapalı'}`;
    this.renderThemes();
  }

  _sliderLabel(key) {
    const out = this.els.settings.querySelector(`output[data-for="${key}"]`);
    if (out) out.textContent = `%${this.settings.get(key)}`;
  }

  renderThemes() {
    const grid = this.els.themeGrid;
    const selected = this.themes.resolve(this.settings.get('endlessTheme')).id;
    grid.innerHTML = '';
    for (const theme of this.themes.list()) {
      const unlocked = this.themes.isUnlocked(theme);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'theme-card' + (unlocked ? '' : ' locked');
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', String(theme.id === selected));
      card.setAttribute('aria-disabled', String(!unlocked));

      const sw = document.createElement('div');
      sw.className = 'theme-swatch';
      sw.style.background = `linear-gradient(160deg, ${theme.colors.glow1}, ${theme.colors.bg2})`;
      theme.palette.slice(0, 4).forEach((c) => {
        const i = document.createElement('i');
        i.style.background = c;
        sw.appendChild(i);
      });
      const name = document.createElement('span');
      name.className = 'theme-name';
      name.textContent = theme.name;
      card.append(sw, name);
      if (!unlocked) {
        const lock = document.createElement('span');
        lock.className = 'theme-lock';
        lock.textContent = `🔒 ${this.themes.unlockHint(theme)}`;
        card.appendChild(lock);
      }
      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = '✓';
      card.appendChild(check);

      card.addEventListener('click', () => {
        if (!unlocked) return;
        this.settings.set('endlessTheme', theme.id);
        this.onThemeChosen?.(theme.id);
        this.renderThemes();
      });
      grid.appendChild(card);
    }
  }
}

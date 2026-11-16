// Ayarlar penceresi: titreşim, yoğun efektler, Sonsuz Mod teması.
import { Platform } from '../platform/Platform.js';

export class SettingsUI {
  constructor({ settings, themes, bus, els, onThemeChosen }) {
    this.settings = settings;
    this.themes = themes;
    this.els = els;
    this.onThemeChosen = onThemeChosen;

    els.settingsBtn.addEventListener('click', () => this.open());
    els.settingsClose.addEventListener('click', () => this.close());
    els.settings.addEventListener('click', (e) => { if (e.target === els.settings) this.close(); });

    // Titreşim: cihaz desteklemiyorsa (ör. iPhone Safari) kapalı ve açıklamalı
    if (!Platform.canVibrate) {
      els.setVibration.disabled = true;
      els.setVibration.closest('.setting-row').classList.add('disabled');
      els.vibNote.textContent = 'Bu cihazın tarayıcısında desteklenmiyor (uygulamada çalışır)';
    }
    els.setVibration.addEventListener('change', () => {
      settings.set('vibration', els.setVibration.checked);
      if (els.setVibration.checked) Platform.haptic('medium');
    });
    els.setEffects.addEventListener('change', () => settings.set('intenseEffects', els.setEffects.checked));

    bus.on('theme:unlocked', () => this.renderThemes());
  }

  get isOpen() { return !this.els.settings.classList.contains('hidden'); }

  open() {
    this.els.setVibration.checked = this.settings.get('vibration') && Platform.canVibrate;
    this.els.setEffects.checked = this.settings.get('intenseEffects');
    this.renderThemes();
    this.els.settings.classList.remove('hidden');
  }

  close() { this.els.settings.classList.add('hidden'); }

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

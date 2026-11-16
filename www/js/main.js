// Giriş noktası: modülleri birbirine bağlar.
// Aynı kod; Android/iOS tarayıcısında, PWA olarak ve Capacitor uygulaması
// içinde çalışır. Platform farkları js/platform/Platform.js içinde toplanır.
import { CONFIG } from './config.js';
import { Platform } from './platform/Platform.js';
import { storage } from './storage.js';
import { EventBus } from './core/EventBus.js';
import { Game } from './core/Game.js';
import { EndlessMode } from './modes/EndlessMode.js';
import { Renderer } from './ui/Renderer.js';
import { DragController } from './ui/DragController.js';
import { Layout } from './ui/Layout.js';
import { RotationUI } from './ui/RotationUI.js';
import { AdService } from './monetization/ads/AdService.js';
import { createAdProvider } from './monetization/ads/createAdProvider.js';
import { Entitlements, ENT_KEY } from './monetization/store/StoreService.js';
import { Settings, SETTINGS_KEY } from './settings/Settings.js';
import { ThemeManager, UNLOCKED_KEY } from './theme/ThemeManager.js';
import { SettingsUI } from './ui/SettingsUI.js';

const $ = (id) => document.getElementById(id);

function preventBrowserGestures() {
  // Uzun basınca açılan menü
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  // iOS Safari: iki parmakla yakınlaştırma (user-scalable=no iOS'ta yok sayılır)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) =>
    document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  // iOS Safari: sayfanın lastik gibi kayması / çift dokunuşla yakınlaştırma
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || !e.target.closest?.('.overlay-card')) e.preventDefault();
  }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300 && !e.target.closest?.('button')) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

async function boot() {
  await Platform.init();
  await storage.init([...Object.values(CONFIG.storageKeys), SETTINGS_KEY, UNLOCKED_KEY, ENT_KEY]);
  preventBrowserGestures();

  const els = {
    app: $('app'),
    board: $('board'),
    grid: $('board-grid'),
    fx: $('fx-layer'),
    tray: $('tray'),
    dragLayer: $('drag-layer'),
    score: $('score'),
    best: $('best-score'),
    combo: $('combo'),
    gameover: $('gameover'),
    goScore: $('go-score'),
    goBest: $('go-best'),
    goNewBest: $('go-newbest'),
    confirm: $('confirm'),
    rotCountWrap: document.querySelector('.rot-count'),
    rotCount: $('rot-count'),
    rotHint: $('rot-hint'),
    rotAdBtn: $('rot-ad-btn'),
    rotAdLabel: $('rot-ad-label'),
    reward: $('reward'),
    rewardTitle: $('reward-title'),
    rewardText: $('reward-text'),
    rewardError: $('reward-error'),
    rewardWatch: $('reward-watch'),
    rewardSkip: $('reward-skip'),
    toast: $('toast'),
    settings: $('settings'),
    settingsBtn: $('settings-btn'),
    settingsClose: $('settings-close'),
    setVibration: $('set-vibration'),
    setEffects: $('set-effects'),
    vibNote: $('vib-note'),
    themeGrid: $('theme-grid')
  };

  const bus = new EventBus();
  const settings = new Settings(bus);
  const entitlements = new Entitlements();
  const themes = new ThemeManager({ bus, entitlements });
  const layout = new Layout(els.app);
  // İleride: mod seçim ekranından new AdventureMode(level) verilebilir.
  const game = new Game({ mode: new EndlessMode(), bus });

  // Temayı oyun çizilmeden önce uygula (renk sıçraması olmasın)
  const applyModeTheme = () => themes.apply(themes.resolve(game.mode.themeId({ settings, themes })).id);
  themes.checkProgress({ best: game.score.best });
  applyModeTheme();

  const renderer = new Renderer({ bus, game, els, settings });

  // Reklam altyapısı: başlatma hatası oyunu etkilemez (reklamsız devam edilir)
  const ads = new AdService({ provider: createAdProvider(Platform), bus });
  await ads.init();

  const rotationUI = new RotationUI({ game, bus, ads, els });
  const drag = new DragController({
    game, renderer, els, layout,
    onTap: (slot) => rotationUI.requestRotate(slot)
  });

  const settingsUI = new SettingsUI({
    settings, themes, bus, els,
    onThemeChosen: () => applyModeTheme()
  });

  // Skor ilerledikçe tema kilitleri açılır
  bus.on('score', ({ best }) => themes.checkProgress({ best }));
  bus.on('theme:unlocked', ({ theme }) => rotationUI.toast(`Yeni tema açıldı: ${theme.name}!`, 'good'));

  const closeConfirm = () => els.confirm.classList.add('hidden');
  $('restart-btn').addEventListener('click', () => {
    if (game.state === 'playing' && game.score.value > 0) els.confirm.classList.remove('hidden');
    else game.start();
  });
  $('confirm-yes').addEventListener('click', () => { closeConfirm(); game.start(); });
  $('confirm-no').addEventListener('click', closeConfirm);
  $('go-restart').addEventListener('click', () => game.start());

  // Uygulama arka plana alınınca: sürüklemeyi iptal et ve oyunu kaydet
  Platform.onPause(() => { drag.cancel(); game.save(); });

  // Android geri tuşu: açık pencereyi kapat, yoksa uygulamayı arka plana al
  Platform.onBackButton(() => {
    if (ads.showing) return true; // reklam açıkken geri tuşu yok sayılır
    if (rotationUI.isOpen) { rotationUI.skip(); return true; }
    if (settingsUI.isOpen) { settingsUI.close(); return true; }
    if (!els.confirm.classList.contains('hidden')) { closeConfirm(); return true; }
    return false;
  });

  game.startOrResume();
  Platform.hideSplash();

  // Hata ayıklama/test için konsoldan erişim
  window.blockFusion = { game, bus, Platform, ads, rotationUI, settings, themes, entitlements };
}

boot();

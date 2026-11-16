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
  await storage.init(Object.values(CONFIG.storageKeys));
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
    confirm: $('confirm')
  };

  const bus = new EventBus();
  const layout = new Layout(els.app);
  // İleride: mod seçim ekranından new AdventureMode(level) verilebilir.
  const game = new Game({ mode: new EndlessMode(), bus });
  const renderer = new Renderer({ bus, game, els });
  const drag = new DragController({ game, renderer, els, layout });

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
    if (!els.confirm.classList.contains('hidden')) { closeConfirm(); return true; }
    return false;
  });

  game.startOrResume();
  Platform.hideSplash();

  // Hata ayıklama/test için konsoldan erişim
  window.blockFusion = { game, bus, Platform };
}

boot();

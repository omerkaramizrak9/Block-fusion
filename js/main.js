// Giriş noktası: modülleri birbirine bağlar.
import { EventBus } from './core/EventBus.js';
import { Game } from './core/Game.js';
import { EndlessMode } from './modes/EndlessMode.js';
import { Renderer } from './ui/Renderer.js';
import { DragController } from './ui/DragController.js';
import { Layout } from './ui/Layout.js';

const $ = (id) => document.getElementById(id);

const els = {
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
const layout = new Layout();
// İleride: mod seçim ekranından new AdventureMode(level) verilebilir.
const game = new Game({ mode: new EndlessMode(), bus });
const renderer = new Renderer({ bus, game, els });
new DragController({ game, renderer, els, layout });

$('restart-btn').addEventListener('click', () => {
  if (game.state === 'playing' && game.score.value > 0) {
    els.confirm.classList.remove('hidden');
  } else {
    game.start();
  }
});
$('confirm-yes').addEventListener('click', () => { els.confirm.classList.add('hidden'); game.start(); });
$('confirm-no').addEventListener('click', () => els.confirm.classList.add('hidden'));
$('go-restart').addEventListener('click', () => game.start());

// Uzun basınca açılan menüyü engelle
window.addEventListener('contextmenu', (e) => e.preventDefault());

game.start();

// Hata ayıklama/test için konsoldan erişim
window.blockFusion = { game, bus };

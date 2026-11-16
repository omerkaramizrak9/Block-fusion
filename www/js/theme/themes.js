// Temalar ve Macera Modu atmosferleri.
//
// Tasarım kuralı: Normal oynanışta KOYU, MAT ve göz yormayan renkler (palette).
// Parlak renkler (fx) yalnızca büyük kombo kutlamalarında kısa süre görünür.
//
// unlock türleri:
//   { type: 'free' }                         her zaman açık
//   { type: 'score', best: N }               Sonsuz Mod en iyi skor N'e ulaşınca açılır
//   { type: 'adventure', world: N }          Macera Modu'nda N. dünyaya ulaşınca açılır
//   { type: 'product', productId: 'id' }     mağazadan satın alınınca (store/catalog.js)

export const THEMES = [
  {
    id: 'midnight',
    name: 'Gece Mavisi',
    unlock: { type: 'free' },
    colors: {
      bg1: '#0e1630', bg2: '#080e20', glow1: '#16234a', glow2: '#0d1838',
      panel: '#131d3a', panel2: '#182446',
      cellEmpty: '#17223f', cellEdge: '#1f2b4c',
      text: '#dfe5f5', textDim: '#7d8bad', accent: '#e0b85a'
    },
    palette: ['#b45d6f', '#c7955a', '#5a8daa', '#5e9c78', '#8873b5', '#bd7a5a', '#4f9b95', '#bcab66'],
    fx: ['#ff5c7a', '#ffd23f', '#4cc9f0', '#3ee07a']
  },
  {
    id: 'forest',
    name: 'Orman',
    unlock: { type: 'score', best: 1500 },
    colors: {
      bg1: '#0f1d17', bg2: '#08110d', glow1: '#173326', glow2: '#0d2018',
      panel: '#13251c', panel2: '#183022',
      cellEmpty: '#16271e', cellEdge: '#1f3429',
      text: '#e1eee5', textDim: '#809d8e', accent: '#d6b45e'
    },
    palette: ['#a85f57', '#c2a05c', '#5a8e8a', '#6d9c5d', '#8b7aa6', '#b6774c', '#4e997c', '#b5b26b'],
    fx: ['#7cff9b', '#ffe066', '#59e3c6', '#c6ff6b']
  },
  {
    id: 'desert',
    name: 'Çöl Akşamı',
    unlock: { type: 'adventure', world: 3 },
    colors: {
      bg1: '#211a12', bg2: '#140f0a', glow1: '#3a2a19', glow2: '#24190f',
      panel: '#2a2117', panel2: '#33281c',
      cellEmpty: '#2c2319', cellEdge: '#3a2f22',
      text: '#f1e7d8', textDim: '#a6957c', accent: '#e3b25a'
    },
    palette: ['#b0584e', '#c99a52', '#6f8fa3', '#8a9a5c', '#9a7698', '#c47548', '#5f9688', '#c4ad60'],
    fx: ['#ffb347', '#ffe08a', '#ff7a59', '#9be7ff']
  },
  {
    id: 'ocean',
    name: 'Derin Okyanus',
    unlock: { type: 'adventure', world: 4 },
    colors: {
      bg1: '#08202a', bg2: '#04121a', glow1: '#0f3442', glow2: '#082430',
      panel: '#0d2733', panel2: '#11303e',
      cellEmpty: '#102a36', cellEdge: '#173745',
      text: '#ddf0f4', textDim: '#77a0ab', accent: '#7fd1c7'
    },
    palette: ['#b0647a', '#c3a265', '#4e93b0', '#4fa38b', '#7f7bbd', '#bb8064', '#3fa3a6', '#a9b56d'],
    fx: ['#4dd9ff', '#7dffd8', '#a78bff', '#ffe27a']
  },
  {
    id: 'ember',
    name: 'Kor',
    unlock: { type: 'score', best: 3000 },
    colors: {
      bg1: '#1e100d', bg2: '#120807', glow1: '#371a13', glow2: '#22100b',
      panel: '#2a1612', panel2: '#331c16',
      cellEmpty: '#2b1814', cellEdge: '#3a221c',
      text: '#f2e3dc', textDim: '#a6887e', accent: '#e6a04f'
    },
    palette: ['#b3544f', '#c88a47', '#87709c', '#7b985f', '#b2687a', '#c26840', '#5d8e89', '#c0a258'],
    fx: ['#ff6a3d', '#ffc845', '#ff3d7f', '#ffe9a8']
  },
  {
    id: 'aurora',
    name: 'Kutup Işığı',
    unlock: { type: 'score', best: 6000 },
    colors: {
      bg1: '#0b1520', bg2: '#060c14', glow1: '#123247', glow2: '#1a1f45',
      panel: '#112130', panel2: '#15293b',
      cellEmpty: '#13243a', cellEdge: '#1b3048',
      text: '#e3f1f5', textDim: '#7d9aae', accent: '#8fd6c4'
    },
    palette: ['#ae607d', '#c1a25e', '#4f97b3', '#55a688', '#8a76c3', '#bd7f63', '#47a6a2', '#a7b66b'],
    fx: ['#64ffda', '#b388ff', '#40c4ff', '#69f0ae']
  },
  // --- Mağaza temaları (kozmetik, ileride satışa çıkacak)
  {
    id: 'neon',
    name: 'Neon Gece',
    unlock: { type: 'product', productId: 'theme_neon' },
    colors: {
      bg1: '#120b24', bg2: '#0a0616', glow1: '#2a1050', glow2: '#0f1c4a',
      panel: '#1a1233', panel2: '#21173f',
      cellEmpty: '#1c1436', cellEdge: '#2a1f4c',
      text: '#efe6ff', textDim: '#9286b5', accent: '#ff7ad9'
    },
    palette: ['#c25a8c', '#c9a14f', '#4f8fc9', '#4fb08a', '#9467d1', '#d0715a', '#3fb3b8', '#c2c25c'],
    fx: ['#ff2ec4', '#00f0ff', '#ffe600', '#7cff4f']
  },
  {
    id: 'sakura',
    name: 'Sakura',
    unlock: { type: 'product', productId: 'theme_sakura' },
    colors: {
      bg1: '#1f1420', bg2: '#140c15', glow1: '#3a2033', glow2: '#24152a',
      panel: '#2a1b29', panel2: '#332131',
      cellEmpty: '#2c1d2b', cellEdge: '#3b2839',
      text: '#f6e6ef', textDim: '#a88b9c', accent: '#f0a5c0'
    },
    palette: ['#c26a84', '#c9a066', '#7a8fb8', '#7ea47a', '#a07fbf', '#c98068', '#6ba3a0', '#c4b874'],
    fx: ['#ff8fc7', '#ffd6e8', '#b5f0ff', '#fff3a8']
  }
];

export const THEMES_BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export const DEFAULT_THEME = 'midnight';

// ---------- Macera Modu: her 20 bölümde bir yeni dünya / atmosfer ----------
export const LEVELS_PER_WORLD = 20;
export const ADVENTURE_WORLDS = [
  { world: 1, name: 'Gece Şehri', theme: 'midnight' },     // 1–20
  { world: 2, name: 'Sessiz Orman', theme: 'forest' },     // 21–40
  { world: 3, name: 'Çöl Akşamı', theme: 'desert' },       // 41–60
  { world: 4, name: 'Derin Okyanus', theme: 'ocean' },     // 61–80
  { world: 5, name: 'Kutup Işığı', theme: 'aurora' },      // 81–100
  { world: 6, name: 'Kor Vadisi', theme: 'ember' }         // 101–120
];

/** Bölüm numarasından (1'den başlar) dünya ve tema. 120'den sonra döngü. */
export function atmosphereForLevel(level) {
  const idx = Math.floor((Math.max(1, level) - 1) / LEVELS_PER_WORLD);
  const world = ADVENTURE_WORLDS[idx % ADVENTURE_WORLDS.length];
  return { ...world, worldIndex: idx + 1, theme: THEMES_BY_ID.get(world.theme) };
}

// Temalar ve Macera Modu atmosferleri.
//
// Tasarım kuralı: Normal oynanışta KOYU, MAT ve göz yormayan renkler (palette).
// Parlak renkler (fx) yalnızca büyük kombo kutlamalarında kısa süre görünür.
//
// Bir tema şunları tanımlar (hepsi CSS değişkeni olarak uygulanır, ThemeManager):
//   colors  : arka plan, panel, boş hücre, yazı, vurgu
//   palette : 8 blok rengi (bloklar indeks taşır → tema değişince anında yeniden boyanır)
//   fx      : kutlama renkleri (yalnızca büyük kombolarda)
//   metal   : çerçeve detayları { copper, gold, dark } — verilmezse varsayılan bakır/altın
//
// unlock türleri:
//   { type: 'free' }                         her zaman açık
//   { type: 'score', best: N, world: W }     Sonsuz Mod en iyi skor N'e ulaşınca
//                                            VEYA (world varsa) Macera'da W. dünyaya gelince açılır
//   { type: 'adventure', world: N }          Macera Modu'nda N. dünyaya ulaşınca açılır
//   { type: 'product', productId: 'id' }     mağazadan satın alınınca (store/catalog.js)

export const THEMES = [
  // --- MAJOR BLOCK ana tasarımı (varsayılan): koyu bordo + lacivert, retro-fütüristik,
  //     ince bakır/altın detaylar. Blok renkleri birbirinden ve arka plandan net ayrılır.
  {
    id: 'major',
    name: 'Major Premium',
    unlock: { type: 'free' },
    colors: {
      bg1: '#2b0d1d', bg2: '#080d22', glow1: '#5c1532', glow2: '#142257',
      panel: '#0f1530', panel2: '#161d3d',
      cellEmpty: '#1a2142', cellEdge: '#2c3560',
      text: '#f4ede4', textDim: '#a89fb6', accent: '#e8b765'
    },
    // turkuaz, fuşya, turuncu, yeşil, mor, altın sarısı, mavi, mercan kırmızısı
    palette: ['#1fc2bc', '#e2448f', '#ff7a29', '#4cc25a', '#9160e3', '#f2c335', '#3b8ff0', '#ef4f4a'],
    fx: ['#6ff6ef', '#ff7cbd', '#ffb466', '#ffe08a'],
    metal: { copper: '#c47a48', gold: '#e8b765', dark: '#5e321d' }
  },
  // --- Macera Dünya 1 (Bölüm 1–20) — varsayılan
  {
    id: 'soft-ocean',
    name: 'Soft Ocean',
    unlock: { type: 'free' },
    colors: {
      bg1: '#143038', bg2: '#0c1f25', glow1: '#1d4450', glow2: '#16323c',
      panel: '#173740', panel2: '#1c414b',
      cellEmpty: '#1a3a43', cellEdge: '#244852',
      text: '#e4f0ef', textDim: '#8eadae', accent: '#b4a8e0'
    },
    // mat petrol mavisi, pastel yeşil, lavanta + uyumlu destek tonları
    palette: ['#4e8e9a', '#8cc6a0', '#a596d4', '#d6bf8f', '#d29b90', '#8db3d4', '#79c1b5', '#c79ab6'],
    fx: ['#bdf2e4', '#d9cffb', '#c9f2d2', '#fbeec8']
  },
  // --- Macera Dünya 2 (Bölüm 21–40)
  {
    id: 'velvet-night',
    name: 'Velvet Night',
    unlock: { type: 'score', best: 1500, world: 2 },
    colors: {
      bg1: '#1f1830', bg2: '#140f21', glow1: '#2f2347', glow2: '#20243a',
      panel: '#251d39', panel2: '#2c2343',
      cellEmpty: '#271f3b', cellEdge: '#33294a',
      text: '#eee7f5', textDim: '#a097b6', accent: '#e4b0c4'
    },
    // mat mor, pudra pembesi, gri-mavi + destek tonları
    palette: ['#8a6fb0', '#d8a2b6', '#7f93b0', '#6fa3a0', '#c9ad7a', '#b07fa0', '#9aa0d6', '#93ad8a'],
    fx: ['#ffd3e3', '#e2d3ff', '#cddcff', '#fde6c8']
  },
  // --- Macera Dünya 3 (Bölüm 41–60)
  {
    id: 'forest-mist',
    name: 'Forest Mist',
    unlock: { type: 'score', best: 3000, world: 3 },
    colors: {
      bg1: '#1b2420', bg2: '#111815', glow1: '#2b3b33', glow2: '#242b29',
      panel: '#202b26', panel2: '#26332d',
      cellEmpty: '#222e29', cellEdge: '#2e3c36',
      text: '#edf0e9', textDim: '#9eaa9e', accent: '#ebb894'
    },
    // koyu adaçayı, şeftali, sis grisi + destek tonları
    palette: ['#7b987c', '#e2a886', '#a3aca8', '#9aab6a', '#bf8a70', '#88a2ac', '#b8b77e', '#a08a9e'],
    fx: ['#ffdcc6', '#dcf2d6', '#eef3f0', '#fbe9bd']
  },
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
    fx: ['#ffc2cf', '#ffe7a6', '#bfe8f7', '#c6f0d4']
  },
  {
    id: 'desert',
    name: 'Çöl Akşamı',
    unlock: { type: 'adventure', world: 4 },
    colors: {
      bg1: '#211a12', bg2: '#140f0a', glow1: '#3a2a19', glow2: '#24190f',
      panel: '#2a2117', panel2: '#33281c',
      cellEmpty: '#2c2319', cellEdge: '#3a2f22',
      text: '#f1e7d8', textDim: '#a6957c', accent: '#e3b25a'
    },
    palette: ['#b0584e', '#c99a52', '#6f8fa3', '#8a9a5c', '#9a7698', '#c47548', '#5f9688', '#c4ad60'],
    fx: ['#ffd9a8', '#fff0c2', '#ffc4b0', '#cdeffc']
  },
  {
    id: 'ember',
    name: 'Kor',
    unlock: { type: 'score', best: 4500, world: 6 },
    colors: {
      bg1: '#1e100d', bg2: '#120807', glow1: '#371a13', glow2: '#22100b',
      panel: '#2a1612', panel2: '#331c16',
      cellEmpty: '#2b1814', cellEdge: '#3a221c',
      text: '#f2e3dc', textDim: '#a6887e', accent: '#e6a04f'
    },
    palette: ['#b3544f', '#c88a47', '#87709c', '#7b985f', '#b2687a', '#c26840', '#5d8e89', '#c0a258'],
    fx: ['#ffc4ae', '#ffe3a8', '#ffc0d4', '#fff1cc']
  },
  {
    id: 'aurora',
    name: 'Kutup Işığı',
    unlock: { type: 'score', best: 6000, world: 5 },
    colors: {
      bg1: '#0b1520', bg2: '#060c14', glow1: '#123247', glow2: '#1a1f45',
      panel: '#112130', panel2: '#15293b',
      cellEmpty: '#13243a', cellEdge: '#1b3048',
      text: '#e3f1f5', textDim: '#7d9aae', accent: '#8fd6c4'
    },
    palette: ['#ae607d', '#c1a25e', '#4f97b3', '#55a688', '#8a76c3', '#bd7f63', '#47a6a2', '#a7b66b'],
    fx: ['#bff7ea', '#ddd0ff', '#c4e9ff', '#c8f5dc']
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
    fx: ['#ffc2ec', '#bff7ff', '#fff3b0', '#d4ffc4']
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
    fx: ['#ffcfe4', '#ffe6f0', '#d2f3ff', '#fff6cc']
  }
];

export const THEMES_BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export const DEFAULT_THEME = 'major';

// Kaldırılan/yeniden adlandırılan tema kimlikleri (eski kayıtlar için)
export const LEGACY_THEME_IDS = { forest: 'forest-mist', ocean: 'soft-ocean' };

// ---------- Macera Modu: her 20 bölümde bir yeni dünya / atmosfer ----------
export const LEVELS_PER_WORLD = 20;
export const ADVENTURE_WORLDS = [
  { world: 1, name: 'Soft Ocean', theme: 'soft-ocean' },      // 1–20
  { world: 2, name: 'Velvet Night', theme: 'velvet-night' },  // 21–40
  { world: 3, name: 'Forest Mist', theme: 'forest-mist' },    // 41–60
  // 61+ için paletler henüz kararlaştırılmadı; geçici olarak mevcut temalar:
  { world: 4, name: 'Çöl Akşamı', theme: 'desert' },          // 61–80
  { world: 5, name: 'Kutup Işığı', theme: 'aurora' },         // 81–100
  { world: 6, name: 'Kor Vadisi', theme: 'ember' }            // 101–120
];

/** Bölüm numarasından (1'den başlar) dünya ve tema. 120'den sonra döngü. */
export function atmosphereForLevel(level) {
  const idx = Math.floor((Math.max(1, level) - 1) / LEVELS_PER_WORLD);
  const world = ADVENTURE_WORLDS[idx % ADVENTURE_WORLDS.length];
  return { ...world, worldIndex: idx + 1, theme: THEMES_BY_ID.get(world.theme) };
}

// Oyunun tüm ayarları tek yerde. Denge değişiklikleri buradan yapılır.

export const CONFIG = {
  boardSize: 8,
  traySize: 3,

  scoring: {
    perCell: 1,          // yerleştirilen her kare için puan
    perLine: 10,         // temizlenen satır/sütun başına taban puan
    boardClearBonus: 300 // tahta tamamen boşalırsa bonus
  },

  // Bu kadar hamle boyunca temizleme yapılmazsa kombo sıfırlanır.
  comboGrace: 3,

  // Yeni tepsi üretilirken en az bir parçanın sığması için deneme sayısı.
  fairTrayAttempts: 12,

  // Sürüklenen parçanın alt kenarı parmağın kaç hücre üstünde dursun
  // (parmak parçayı kapatmasın).
  dragLiftCells: 1.3,

  vibration: true,

  storageKeys: {
    bestEndless: 'blockfusion.best.endless',
    saveEndless: 'blockfusion.save.endless'
  }
};

// Parlak blok renkleri
export const COLORS = [
  '#ff4d6d', // kırmızı-pembe
  '#ffb703', // turuncu-sarı
  '#4cc9f0', // camgöbeği
  '#3ee07a', // yeşil
  '#c77dff', // mor
  '#ff7b39', // turuncu
  '#00e5c7', // turkuaz
  '#ffe14d'  // sarı
];

// Parça şekilleri: 'X' dolu, '.' boş. weight = çıkma sıklığı.
const SHAPE_DEFS = [
  { id: 'dot',     weight: 2, pattern: ['X'] },
  { id: 'h2',      weight: 3, pattern: ['XX'] },
  { id: 'v2',      weight: 3, pattern: ['X', 'X'] },
  { id: 'h3',      weight: 3, pattern: ['XXX'] },
  { id: 'v3',      weight: 3, pattern: ['X', 'X', 'X'] },
  { id: 'h4',      weight: 2, pattern: ['XXXX'] },
  { id: 'v4',      weight: 2, pattern: ['X', 'X', 'X', 'X'] },
  { id: 'h5',      weight: 1, pattern: ['XXXXX'] },
  { id: 'v5',      weight: 1, pattern: ['X', 'X', 'X', 'X', 'X'] },
  { id: 'sq2',     weight: 3, pattern: ['XX', 'XX'] },
  { id: 'sq3',     weight: 1, pattern: ['XXX', 'XXX', 'XXX'] },
  { id: 'rect23',  weight: 1, pattern: ['XXX', 'XXX'] },
  { id: 'rect32',  weight: 1, pattern: ['XX', 'XX', 'XX'] },
  // küçük L (3 kare)
  { id: 'l3a', weight: 2, pattern: ['X.', 'XX'] },
  { id: 'l3b', weight: 2, pattern: ['.X', 'XX'] },
  { id: 'l3c', weight: 2, pattern: ['XX', 'X.'] },
  { id: 'l3d', weight: 2, pattern: ['XX', '.X'] },
  // L (4 kare)
  { id: 'l4a', weight: 1, pattern: ['X.', 'X.', 'XX'] },
  { id: 'l4b', weight: 1, pattern: ['.X', '.X', 'XX'] },
  { id: 'l4c', weight: 1, pattern: ['XXX', 'X..'] },
  { id: 'l4d', weight: 1, pattern: ['XXX', '..X'] },
  { id: 'l4e', weight: 1, pattern: ['XX', 'X.', 'X.'] },
  { id: 'l4f', weight: 1, pattern: ['XX', '.X', '.X'] },
  { id: 'l4g', weight: 1, pattern: ['X..', 'XXX'] },
  { id: 'l4h', weight: 1, pattern: ['..X', 'XXX'] },
  // T
  { id: 't_up',    weight: 1, pattern: ['XXX', '.X.'] },
  { id: 't_down',  weight: 1, pattern: ['.X.', 'XXX'] },
  { id: 't_left',  weight: 1, pattern: ['X.', 'XX', 'X.'] },
  { id: 't_right', weight: 1, pattern: ['.X', 'XX', '.X'] },
  // S / Z
  { id: 's_h', weight: 1, pattern: ['.XX', 'XX.'] },
  { id: 'z_h', weight: 1, pattern: ['XX.', '.XX'] },
  { id: 's_v', weight: 1, pattern: ['X.', 'XX', '.X'] },
  { id: 'z_v', weight: 1, pattern: ['.X', 'XX', 'X.'] },
  // büyük köşe L (5 kare)
  { id: 'bl_a', weight: 1, pattern: ['X..', 'X..', 'XXX'] },
  { id: 'bl_b', weight: 1, pattern: ['..X', '..X', 'XXX'] },
  { id: 'bl_c', weight: 1, pattern: ['XXX', 'X..', 'X..'] },
  { id: 'bl_d', weight: 1, pattern: ['XXX', '..X', '..X'] }
];

function parsePattern(pattern) {
  const cells = [];
  pattern.forEach((row, r) => {
    [...row].forEach((ch, c) => { if (ch === 'X') cells.push([r, c]); });
  });
  return {
    cells,
    rows: pattern.length,
    cols: Math.max(...pattern.map((p) => p.length))
  };
}

export const SHAPES = SHAPE_DEFS.map((d) => ({ id: d.id, weight: d.weight, ...parsePattern(d.pattern) }));

export const SHAPES_BY_ID = new Map(SHAPES.map((s) => [s.id, s]));

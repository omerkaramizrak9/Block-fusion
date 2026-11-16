// Geri bildirim seviyeleri: efekt gücü kademeli artar.
//
//   line1 : 1 hat                    hafif ışık dalgası, çok kısa sarsıntı, kısa titreşim
//   line2 : 2 hat                    daha güçlü dalga, çift titreşim
//   line3 : 3+ hat                   belirgin sarsıntı, güçlü titreşim, birkaç parçacık
//   combo : kombo ≥ 3                arka plan kararır, geometrik parçacıklar, COMBO yazısı,
//                                    ritmik titreşim, sinematik sarsıntı
//   epic  : kombo ≥ 5, 4+ hat,       1,5–2 sn sinematik kutlama
//           veya tahta tamamen boş

export const LEVEL_RULES = { comboAt: 3, epicComboAt: 5, epicLinesAt: 4 };

export function clearLevel({ lines, combo, boardClear }) {
  if (lines <= 0) return 'place';
  if (combo >= LEVEL_RULES.epicComboAt || lines >= LEVEL_RULES.epicLinesAt || boardClear) return 'epic';
  if (combo >= LEVEL_RULES.comboAt) return 'combo';
  if (lines >= 3) return 'line3';
  if (lines === 2) return 'line2';
  return 'line1';
}

// Temel değerler; "Animasyon yoğunluğu" ile çarpılır (Hafif 0.6 / Normal 1 / Güçlü 1.4)
//   shake  : [genlik px, süre ms]   beam: ışık dalgası gücü   particles: adet
export const LEVEL_FX = {
  place: { shake: null,       beam: 0,   particles: 0 },
  line1: { shake: [1.5, 160], beam: 1,   particles: 0 },
  line2: { shake: [2.5, 200], beam: 1.3, particles: 0 },
  line3: { shake: [4, 260],   beam: 1.6, particles: 8 },
  combo: { shake: [5, 380],   beam: 1.7, particles: 16 },
  epic:  { shake: [6.5, 420], beam: 2,   particles: 20 }
};

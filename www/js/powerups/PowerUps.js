// Güçler (power-up) için kayıt sistemi.
// Şu an arayüze bağlı DEĞİL; ileride eklenecek güçlerin iskeleti ve mantığı burada.
//
// Bir güç şu şekilde tanımlanır:
//   {
//     id: 'bomb',
//     name: 'Bomba',
//     targets: 'cell',                         // oyuncu hedef olarak bir hücre seçer
//     getCells(board, row, col) -> [[r,c],..]  // temizlenecek hücreler
//   }
//
// Kullanım (ileride): game.usePowerUp('bomb', row, col)

const registry = new Map();

export const PowerUps = {
  register(def) { registry.set(def.id, def); },
  get(id) { return registry.get(id); },
  list() { return [...registry.values()]; }
};

// Bomba: hedef hücrenin etrafındaki 3×3 alanı temizler.
PowerUps.register({
  id: 'bomb',
  name: 'Bomba',
  targets: 'cell',
  getCells(board, row, col) {
    const out = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) if (board.inBounds(r, c)) out.push([r, c]);
    }
    return out;
  }
});

// Yıldırım: hedef hücrenin satırını ve sütununu temizler.
PowerUps.register({
  id: 'lightning',
  name: 'Yıldırım',
  targets: 'cell',
  getCells(board, row, col) {
    const out = [];
    for (let i = 0; i < board.size; i++) {
      out.push([row, i]);
      if (i !== row) out.push([i, col]);
    }
    return out;
  }
});

// Gökkuşağı: hedef hücreyle aynı renkteki tüm blokları temizler.
PowerUps.register({
  id: 'rainbow',
  name: 'Gökkuşağı',
  targets: 'cell',
  getCells(board, row, col) {
    const target = board.get(row, col);
    if (!target) return [];
    const out = [];
    for (let r = 0; r < board.size; r++) {
      for (let c = 0; c < board.size; c++) {
        if (board.get(r, c)?.color === target.color) out.push([r, c]);
      }
    }
    return out;
  }
});

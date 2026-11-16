// Oyun tahtası: yalnızca veri ve kurallar (DOM yok).
// Her hücre null (boş) veya { color } nesnesidir (color = palet indeksi). İleride hücreye
// { color, type: 'stone' | 'ice' ... } gibi alanlar eklenebilir (Macera Modu).

export class Board {
  constructor(size = 8) {
    this.size = size;
    this.reset();
  }

  reset() {
    this.cells = Array.from({ length: this.size }, () => Array(this.size).fill(null));
  }

  inBounds(r, c) { return r >= 0 && c >= 0 && r < this.size && c < this.size; }
  get(r, c) { return this.inBounds(r, c) ? this.cells[r][c] : undefined; }
  isEmpty(r, c) { return this.inBounds(r, c) && this.cells[r][c] === null; }

  canPlace(shape, row, col) {
    return shape.cells.every(([dr, dc]) => this.isEmpty(row + dr, col + dc));
  }

  hasRoomFor(shape) {
    for (let r = 0; r <= this.size - shape.rows; r++) {
      for (let c = 0; c <= this.size - shape.cols; c++) {
        if (this.canPlace(shape, r, c)) return true;
      }
    }
    return false;
  }

  place(shape, row, col, color) {
    const placed = [];
    for (const [dr, dc] of shape.cells) {
      this.cells[row + dr][col + dc] = { color };
      placed.push([row + dr, col + dc]);
    }
    return placed;
  }

  /** Yerleştirme yapılsaydı hangi satır/sütunlar dolardı? (tahtayı değiştirmez) */
  simulateLines(shape, row, col) {
    const extra = new Set(shape.cells.map(([dr, dc]) => (row + dr) * this.size + (col + dc)));
    const filled = (r, c) => this.cells[r][c] !== null || extra.has(r * this.size + c);
    return this._fullLines(filled);
  }

  findFullLines() {
    return this._fullLines((r, c) => this.cells[r][c] !== null);
  }

  _fullLines(filled) {
    const rows = [];
    const cols = [];
    for (let i = 0; i < this.size; i++) {
      let rowFull = true;
      let colFull = true;
      for (let j = 0; j < this.size; j++) {
        if (!filled(i, j)) rowFull = false;
        if (!filled(j, i)) colFull = false;
      }
      if (rowFull) rows.push(i);
      if (colFull) cols.push(i);
    }
    return { rows, cols };
  }

  /** Satır/sütunları temizler, temizlenen hücreleri döndürür (renk bilgisiyle). */
  clearLines({ rows, cols }) {
    const keys = new Set();
    rows.forEach((r) => { for (let c = 0; c < this.size; c++) keys.add(r * this.size + c); });
    cols.forEach((c) => { for (let r = 0; r < this.size; r++) keys.add(r * this.size + c); });
    return this.clearCells([...keys].map((k) => [Math.floor(k / this.size), k % this.size]));
  }

  /** Verilen hücreleri temizler (güçler de bunu kullanır). */
  clearCells(list) {
    const cleared = [];
    for (const [r, c] of list) {
      const cell = this.get(r, c);
      if (cell) {
        cleared.push({ r, c, color: cell.color });
        this.cells[r][c] = null;
      }
    }
    return cleared;
  }

  isClear() { return this.cells.every((row) => row.every((c) => c === null)); }
}

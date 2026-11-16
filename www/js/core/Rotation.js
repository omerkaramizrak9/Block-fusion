// Parça döndürme mantığı (DOM yok).
import { SHAPES } from '../config.js';

/** Hücre listesinden sıralı, karşılaştırılabilir anahtar üretir. */
export function shapeKey(cells) {
  return cells.map(([r, c]) => `${r},${c}`).sort().join(';');
}

// Bilinen şekiller anahtara göre; döndürülen şekil mümkünse mevcut bir
// şekle eşlenir (ör. 'h3' -> 'v3'). Böylece kayıt dosyası sade kalır.
const BY_KEY = new Map(SHAPES.map((s) => [shapeKey(s.cells), s]));

/** Hücreleri sol-üst köşeye hizalar ve şekil nesnesi oluşturur. */
export function makeShape(cells, id) {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const norm = cells.map(([r, c]) => [r - minR, c - minC]);
  const known = BY_KEY.get(shapeKey(norm));
  if (known) return known;
  return {
    id: id ?? `custom:${shapeKey(norm)}`,
    weight: 0,
    cells: norm,
    rows: Math.max(...norm.map(([r]) => r)) + 1,
    cols: Math.max(...norm.map(([, c]) => c)) + 1,
    custom: true
  };
}

/** 90° saat yönünde döndürür: (r, c) -> (c, rows-1-r) */
export function rotateCW(shape) {
  return makeShape(shape.cells.map(([r, c]) => [c, shape.rows - 1 - r]));
}

/** Döndürmenin şekli değiştirip değiştirmediği (kare/tek blok dönmez). */
export function isRotationSymmetric(shape) {
  return shapeKey(rotateCW(shape).cells) === shapeKey(shape.cells);
}

/** Şeklin farklı tüm yönleri (kendisi hariç), en az döndürme sırasıyla. */
export function otherOrientations(shape) {
  const out = [];
  const seen = new Set([shapeKey(shape.cells)]);
  let cur = shape;
  for (let i = 1; i <= 3; i++) {
    cur = rotateCW(cur);
    const k = shapeKey(cur.cells);
    if (!seen.has(k)) { seen.add(k); out.push({ shape: cur, turns: i }); }
  }
  return out;
}

// Rastgele parça üretimi.
import { SHAPES, SHAPES_BY_ID, COLORS } from '../config.js';

let nextId = 1;

export function pickWeighted(list, rng = Math.random) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let roll = rng() * total;
  for (const item of list) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return list[list.length - 1];
}

export function createPiece(shape, color) {
  return { id: nextId++, shape, color };
}

export function randomPiece({ shapes = SHAPES, colors = COLORS, rng = Math.random } = {}) {
  const shape = pickWeighted(shapes, rng);
  const color = colors[Math.floor(rng() * colors.length)];
  return createPiece(shape, color);
}

/**
 * count adet rastgele parça üretir. "Adil" olması için, mümkünse en az bir
 * parçanın tahtaya sığdığı bir set seçmeye çalışır.
 */
export function generateTray(board, { count = 3, attempts = 10, rng = Math.random } = {}) {
  let tray = null;
  for (let i = 0; i < attempts; i++) {
    tray = Array.from({ length: count }, () => randomPiece({ rng }));
    if (tray.some((p) => board.hasRoomFor(p.shape))) return tray;
  }
  return tray;
}

/** Kayıt için sade veri: { s: şekil id, c: renk } */
export function pieceToData(piece) {
  return piece ? { s: piece.shape.id, c: piece.color } : null;
}

export function pieceFromData(data) {
  if (!data) return null;
  const shape = SHAPES_BY_ID.get(data.s);
  return shape ? createPiece(shape, data.c) : null;
}

// Satır/sütun temizleme: bloklar hattın ortasında birleşir, sonra yumuşak bir
// ışık dalgasına dönüşüp hat boyunca yayılır ve söner.
// Güç (strength) hat sayısı ve kombo ile kademeli artar.
// Azaltılmış harekette: bloklar yalnızca sade biçimde solar.
import { paletteVar } from '../ui/Renderer.js';

const N = 8;
const CENTER = (N - 1) / 2;

export class LineClearFX {
  constructor(layer) { this.layer = layer; }

  /**
   * @param cleared  [{ r, c, color }]
   * @param lines    { rows: [], cols: [] }
   * @param opts     { pitch, strength, reduced }
   */
  run(cleared, lines, { pitch, strength = 1, reduced = false }) {
    if (!cleared.length) return;
    const byKey = new Map(cleared.map((x) => [`${x.r},${x.c}`, x]));
    const used = new Set();
    const groups = [];
    for (const r of lines.rows) groups.push({ dir: 'row', idx: r, cells: this._take(byKey, used, (k) => [r, k]) });
    for (const c of lines.cols) groups.push({ dir: 'col', idx: c, cells: this._take(byKey, used, (k) => [k, c]) });

    groups.forEach((g, i) => {
      const delay = i * (reduced ? 0 : 55);
      if (reduced) this._fade(g, pitch);
      else this._mergeAndBeam(g, pitch, strength, delay);
    });
  }

  _take(byKey, used, at) {
    const out = [];
    for (let k = 0; k < N; k++) {
      const [r, c] = at(k);
      const key = `${r},${c}`;
      const cell = byKey.get(key);
      if (cell && !used.has(key)) { used.add(key); out.push({ ...cell, k }); }
    }
    return out;
  }

  _line(g, pitch) {
    const el = document.createElement('div');
    el.className = `fx-line ${g.dir}`;
    if (g.dir === 'row') Object.assign(el.style, { left: '0px', top: `${g.idx * pitch}px`, width: `${N * pitch}px`, height: `${pitch}px` });
    else Object.assign(el.style, { left: `${g.idx * pitch}px`, top: '0px', width: `${pitch}px`, height: `${N * pitch}px` });
    this.layer.appendChild(el);
    return el;
  }

  _block(line, cell, g, pitch) {
    const b = document.createElement('i');
    b.className = 'fx-merge';
    b.style.setProperty('--c', paletteVar(cell.color));
    b.style.width = b.style.height = `${pitch}px`;
    if (g.dir === 'row') b.style.left = `${cell.k * pitch}px`;
    else b.style.top = `${cell.k * pitch}px`;
    line.appendChild(b);
    return b;
  }

  _fade(g, pitch) {
    const line = this._line(g, pitch);
    g.cells.forEach((cell) => {
      const b = this._block(line, cell, g, pitch);
      b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
    });
    setTimeout(() => line.remove(), 260);
  }

  _mergeAndBeam(g, pitch, strength, delay) {
    const line = this._line(g, pitch);
    // Hattın baskın rengi ışık dalgasının rengi olur
    const counts = {};
    g.cells.forEach((c) => { counts[c.color] = (counts[c.color] || 0) + 1; });
    const main = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0);
    line.style.setProperty('--c', paletteVar(main));

    const mergeDur = 240;
    g.cells.forEach((cell) => {
      const b = this._block(line, cell, g, pitch);
      const d = (CENTER - cell.k) * pitch * 0.9;
      const move = g.dir === 'row' ? `translate3d(${d}px,0,0)` : `translate3d(0,${d}px,0)`;
      b.animate([
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
        { transform: `${move} scale(.62)`, opacity: 1, offset: 0.7 },
        { transform: `${move} scale(.25)`, opacity: 0 }
      ], { duration: mergeDur, delay, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'both' });
    });

    // Işık dalgası: merkezden hat boyunca yayılır
    const beam = document.createElement('i');
    beam.className = 'fx-beam';
    const thick = Math.min(1.5, 0.55 + 0.25 * strength);
    beam.style.setProperty('--glow', `${Math.round(6 + 6 * strength)}px`);
    line.appendChild(beam);
    const axis = g.dir === 'row' ? (s, t) => `scale(${s}, ${t})` : (s, t) => `scale(${t}, ${s})`;
    const beamDur = Math.round(380 + 70 * strength);
    beam.animate([
      { transform: axis(0.04, thick * 0.6), opacity: 0 },
      { transform: axis(0.55, thick), opacity: Math.min(0.95, 0.55 + 0.2 * strength), offset: 0.3 },
      { transform: axis(1.15, thick * 0.35), opacity: 0 }
    ], { duration: beamDur, delay: delay + mergeDur * 0.6, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });

    setTimeout(() => line.remove(), delay + mergeDur * 0.6 + beamDur + 60);
  }
}

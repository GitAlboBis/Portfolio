// @ts-check
/**
 * atlas.js — the chips' shapes as signed distances (lane FIELD). One row of CELLS square cells of CELL px, rgba8:
 *   r  the signed distance, 0.5 on the edge, 1 deep inside, 0 far outside (SPREAD px of the cell either side)
 *   g  the tone: 1 on a white face, 0 on a blue one (the SerSan mark's two halves; 1 for the A)
 * Cells: 0 the letter A in the display face (Sofia Sans Extra Condensed 800: Alberto's initial), 1 the SerSan mark
 * (from the brand film's end card, as stage/night/lib.js reads it), 2 a scene's own mask (alpha of a canvas or bitmap
 * it gives), 3 a facet (a narrow cut shard, the plain chip of glass).
 * Each shape is drawn at 4x, its exact distance taken there (Felzenszwalb's transform), then sampled down.
 */
import { CELL, CELLS, SPREAD } from "./field.wgsl.js";

export const SHAPE = Object.freeze({ A: 0, mark: 1, own: 2, facet: 3 });
const UP = 4, R = CELL * UP, PAD = 18 * UP;

/** 1D squared distance transform (Felzenszwalb & Huttenlocher) of f into d @param {Float64Array} f @param {number} n
 *  @param {Float64Array} d @param {Int32Array} v @param {Float64Array} z */
function edt1(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
/** distance (px) from every pixel to the nearest pixel where on(i) @param {(i: number) => boolean} on @param {number} w @param {number} h
 *  (k-fix3d) a generator that pauses every 32 columns and rows: the same numbers, built in slices (sliced) */
function* edtGen(on, w, h) {
  const g = new Float64Array(w * h), n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < w * h; i++) g[i] = on(i) ? 0 : 1e20;
  yield;
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; if ((x & 31) === 31) yield; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1(f, w, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); if ((y & 31) === 31) yield; }
  return g;
}

/** a 4x mask (alpha > 0.5 inside) and its tone -> the cell's bytes @param {Uint8ClampedArray} px RGBA at R x R
 *  @param {(i: number) => number} tone 0..1 per 4x pixel */
function* cellBytesGen(px, tone) {
  const inside = (/** @type {number} */ i) => px[i * 4 + 3] > 127;
  const dOut = yield* edtGen(inside, R, R), dIn = yield* edtGen((i) => !inside(i), R, R);
  const out = new Uint8Array(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      // the 4x pixel at the centre of this cell pixel; distances in cell px
      const i = (y * UP + (UP >> 1)) * R + x * UP + (UP >> 1);
      const sd = (dOut[i] - dIn[i]) / UP;           // > 0 outside
      const o = (y * CELL + x) * 4;
      out[o] = Math.round(255 * Math.max(0, Math.min(1, 0.5 - sd / (2 * SPREAD))));
      // the tone, spread a little past the edge (the bevel samples it there)
      let t = 0, n = 0;
      for (let j = 0; j < UP; j++) for (let k = 0; k < UP; k++) { const q = (y * UP + j) * R + x * UP + k; if (px[q * 4 + 3] > 127) { t += tone(q); n++; } }
      out[o + 1] = Math.round(255 * (n ? t / n : 1));
      out[o + 2] = 0; out[o + 3] = 255;
    }
    if ((y & 15) === 15) yield;
  }
  return out;
}
/** the cell's bytes at once @param {Uint8ClampedArray} px @param {(i: number) => number} tone */
function cellBytes(px, tone) {
  const g = cellBytesGen(px, tone);
  for (;;) { const r = g.next(); if (r.done) return r.value; }
}
/* (k-fix3d) THE SHAPES IN SLICES. Each shape was one task of 25 to 35 ms of distance transform: the atlas is first asked
   when a page with chips takes the stage, so a flight from Contact (no chips) into the home paid it at the door, three
   frames of 35 ms in a row (rAF gaps 557:35 and 592:35), and a cold load paid it in the name's first lit second. Now a
   shape is cut 4 ms at a time, one task each (a MessageChannel, no clamped timer), the same bytes */
/** @template T @param {Generator<any, T, any>} g @returns {Promise<T>} */
function sliced(g) {
  return new Promise((resolve, reject) => {
    const ch = new MessageChannel();
    const step = () => {
      const t0 = performance.now();
      try {
        for (;;) {
          const r = g.next();
          if (r.done) { ch.port1.close(); resolve(r.value); return; }
          if (performance.now() - t0 > 4) break;
        }
      } catch (e) { ch.port1.close(); reject(e); return; }
      ch.port2.postMessage(0);
    };
    ch.port1.onmessage = step;
    ch.port2.postMessage(0);
  });
}

/** a 2D canvas of R x R @returns {[OffscreenCanvas, OffscreenCanvasRenderingContext2D]} */
function canvasR() {
  const cv = new OffscreenCanvas(R, R);
  return [cv, /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }))];
}

/** the letter A in the display face, fitted in the cell: its 4x mask */
async function letterA() {
  const font = `800 ${R}px "Sofia Sans Extra Condensed"`;
  try { if (typeof document !== "undefined" && document.fonts) await document.fonts.load(font, "A"); } catch { /* the fallback face draws */ }
  const [cv, cx] = canvasR();
  cx.font = font; cx.textAlign = "left"; cx.textBaseline = "alphabetic";
  const m = cx.measureText("A");
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const k = Math.min((R - 2 * PAD) / w, (R - 2 * PAD) / h);
  cx.setTransform(k, 0, 0, k, R / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2) * k, R / 2 + ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2) * k);
  cx.fillStyle = "#fff"; cx.fillText("A", 0, 0);
  return cx.getImageData(0, 0, R, R).data;
}

/** the SerSan mark from the end card (crop as night/lib.js plate()): inside where the card is far from its navy
 *  ground; the white half tone 1, the blue half 0: its 4x mask and tone */
async function mark() {
  const url = new URL("../../../../captures/sersan-brand-end-1600.webp", import.meta.url).href;
  const img = await createImageBitmap(await (await fetch(url)).blob());
  const [cv, cx] = canvasR();
  // the mark spans about 50..255 x 30..262 of the 300 px crop (646, 166): fit that box in the cell
  const sx = 646 + 33, sy = 166 + 26, S = 240, inner = R - 2 * PAD;
  cx.drawImage(img, sx, sy, S, S, PAD, PAD, inner, inner);
  const px = cx.getImageData(0, 0, R, R).data;
  const G = [14, 33, 61];
  const out = new Uint8ClampedArray(px.length);
  const tone = new Float32Array(R * R);
  for (let i = 0; i < R * R; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    // the halo around the white half is a soft glow: a high threshold keeps the cut edge straight
    const d = Math.hypot(r - G[0], g - G[1], b - G[2]);
    out[i * 4 + 3] = d > 120 ? 255 : 0;
    tone[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.62 && b - r < 60 ? 1 : 0;
  }
  return { px: out, tone: (/** @type {number} */ q) => tone[q] };
}

/** a narrow shard: a quadrilateral with straight cuts, the plain chip: its 4x mask */
function facet() {
  const [cv, cx] = canvasR();
  const c = R / 2, a = (R - 2 * PAD) / 2;
  cx.fillStyle = "#fff";
  cx.beginPath(); cx.moveTo(c - a * 0.18, c - a); cx.lineTo(c + a * 0.42, c - a * 0.52); cx.lineTo(c + a * 0.2, c + a); cx.lineTo(c - a * 0.4, c + a * 0.3); cx.closePath(); cx.fill();
  return cx.getImageData(0, 0, R, R).data;
}

/** a scene's own mask: the alpha of a canvas / bitmap, fitted in the cell @param {CanvasImageSource} src */
export function ownMask(src) {
  const [cv, cx] = canvasR();
  const s = /** @type {any} */ (src), w = s.width || R, h = s.height || R, k = Math.min((R - 2 * PAD) / w, (R - 2 * PAD) / h);
  cx.drawImage(src, (R - w * k) / 2, (R - h * k) / 2, w * k, h * k);
  return cellBytes(cx.getImageData(0, 0, R, R).data, () => 1);
}

/** every built-in cell (the own cell starts as the facet) @returns {Promise<Uint8Array[]>} */
export async function buildCells() {
  // (k-fix3d) every shape cut in slices of 4 ms (sliced): never a frame of 35 ms while the eye flies or the name lights;
  // nothing of it in the frame that asked (a stage frame calls askAtlas)
  await new Promise((r) => setTimeout(r, 0));
  const solid = () => 1;
  const f = await sliced(cellBytesGen(facet(), solid));
  const A = await sliced(cellBytesGen(await letterA(), solid));
  const M = await mark().then((m) => sliced(cellBytesGen(m.px, m.tone))).catch(() => f);
  return [A, M, f, f];
}

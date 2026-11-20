// @ts-check
/**
 * helpers.js — what a formation author needs to make targets (spec 3.5). Every generator returns a
 * TargetSet in the formation's LOCAL units (see stage.js, "Local space"): x right, y down, z toward
 * the reader, the content fitted inside [-1, 1] on its larger side unless a size says otherwise.
 *
 * A TargetSet is { data, path, closed }:
 *  - data   Float32Array of vec4 (x, y, z, ink): ink 0..1 scales the formation's ink on that target
 *  - path   0 for a cloud of points; n >= 2 when data holds polylines of n points each, one after the
 *           other: particles then fill the gaps between consecutive points, so a few hundred points
 *           draw a continuous thread, and the formation's "shift" slides the particles along it
 *  - closed true when every polyline loops (a ring)
 * Everything is deterministic for a given seed.
 */

/** @typedef {{ data: Float32Array, path: number, closed: boolean }} TargetSet */

/** mulberry32: a seeded generator of floats in [0, 1). @param {number} seed */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A gaussian sample (Box–Muller) from a generator. @param {() => number} r */
export function gauss(r) {
  return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(2 * Math.PI * r());
}

/**
 * A cloud from a function: fn(i, r) returns [x, y, z, ink] (ink defaults to 1).
 * @param {number} n @param {(i: number, r: () => number) => number[]} fn @param {number} [seed]
 * @returns {TargetSet}
 */
export function cloud(n, fn, seed = 1) {
  const r = rng(seed), d = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const p = fn(i, r);
    d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2] || 0; d[i * 4 + 3] = p[3] ?? 1;
  }
  return { data: d, path: 0, closed: false };
}

/**
 * Loops around the origin: `loops` closed polylines of `n` points each, on radius r, each loop a
 * little off the others in radius and depth so the ring reads as a bundle of threads.
 * tilt (radians) leans the ring's plane about x; the formation can still rotate the whole box.
 * @param {{ n?: number, loops?: number, r?: number, spread?: number, wobble?: number, waves?: number, tilt?: number, ink?: number, seed?: number }} [o]
 * @returns {TargetSet}
 */
export function ring(o = {}) {
  const n = o.n ?? 256, loops = o.loops ?? 6, R = o.r ?? 0.9, spread = o.spread ?? 0.035, wob = o.wobble ?? 0.04;
  const waves = o.waves ?? 3, tilt = o.tilt ?? 0, ink = o.ink ?? 1, r = rng(o.seed ?? 3);
  const d = new Float32Array(n * loops * 4), ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let k = 0; k < loops; k++) {
    const dr = gauss(r) * spread, ph = r() * 6.283, dz = gauss(r) * spread * 2, kInk = ink * (0.55 + 0.45 * r());
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = R + dr + wob * Math.sin(waves * a + ph);
      const x = Math.cos(a) * rr, y0 = Math.sin(a) * rr, z0 = dz + wob * Math.cos((waves + 1) * a + ph);
      const j = (k * n + i) * 4;
      d[j] = x; d[j + 1] = y0 * ct - z0 * st; d[j + 2] = y0 * st + z0 * ct; d[j + 3] = kInk;
    }
  }
  return { data: d, path: n, closed: true };
}

/**
 * Points spread evenly in a box centred on the origin (half sizes hx, hy, hz).
 * @param {number} n @param {{ hx?: number, hy?: number, hz?: number, ink?: number, seed?: number }} [o]
 */
export function box(n, o = {}) {
  const hx = o.hx ?? 1, hy = o.hy ?? 1, hz = o.hz ?? 0, ink = o.ink ?? 1;
  return cloud(n, (i, r) => [(r() * 2 - 1) * hx, (r() * 2 - 1) * hy, (r() * 2 - 1) * hz, ink], o.seed ?? 5);
}

/**
 * One polyline resampled to `n` points evenly spaced by length. points = [[x, y, z?, ink?], ...].
 * Several lines: call it per line and join the results with `join` (all must share n).
 * @param {number[][]} points @param {number} n @param {{ closed?: boolean }} [o]
 * @returns {TargetSet}
 */
export function polyline(points, n, o = {}) {
  const pts = o.closed ? [...points, points[0]] : points;
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] || 0) - (a[2] || 0));
    seg.push(l); total += l;
  }
  const d = new Float32Array(n * 4);
  const steps = o.closed ? n : n - 1;
  for (let i = 0; i < n; i++) {
    let s = (i / Math.max(steps, 1)) * total, k = 0;
    while (k < seg.length - 1 && s > seg[k]) { s -= seg[k]; k++; }
    const a = pts[k], b = pts[k + 1], t = seg[k] > 0 ? Math.min(1, s / seg[k]) : 0;
    d[i * 4] = a[0] + (b[0] - a[0]) * t;
    d[i * 4 + 1] = a[1] + (b[1] - a[1]) * t;
    d[i * 4 + 2] = (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t;
    d[i * 4 + 3] = (a[3] ?? 1) + ((b[3] ?? 1) - (a[3] ?? 1)) * t;
  }
  return { data: d, path: n, closed: !!o.closed };
}

/**
 * Join sets of the same kind (clouds with clouds, paths of the same length with each other).
 * @param {TargetSet[]} sets @returns {TargetSet}
 */
export function join(sets) {
  const len = sets.reduce((s, x) => s + x.data.length, 0), d = new Float32Array(len);
  let o = 0;
  for (const s of sets) { d.set(s.data, o); o += s.data.length; }
  return { data: d, path: sets[0]?.path ?? 0, closed: sets[0]?.closed ?? false };
}

/**
 * Sample a cloud from a weight raster (w x h, row-major, weights >= 0): each point lands in a pixel
 * with probability proportional to its weight, jittered inside it. The raster is fitted inside
 * [-1, 1] on its larger side. z is a gaussian of sd `depth` (local units), optionally pushed by the
 * weight (`relief`: dense parts toward the reader).
 * @param {Float32Array} wt @param {number} w @param {number} h @param {number} n
 * @param {{ depth?: number, relief?: number, seed?: number }} [o]
 * @returns {TargetSet}
 */
export function fromWeights(wt, w, h, n, o = {}) {
  const cdf = new Float64Array(wt.length);
  let acc = 0, max = 0;
  for (let i = 0; i < wt.length; i++) { acc += Math.max(0, wt[i]); cdf[i] = acc; if (wt[i] > max) max = wt[i]; }
  const r = rng(o.seed ?? 7), sc = 2 / Math.max(w, h), depth = o.depth ?? 0, relief = o.relief ?? 0;
  const d = new Float32Array(n * 4);
  if (acc <= 0) return { data: d, path: 0, closed: false };
  for (let i = 0; i < n; i++) {
    const t = r() * acc;
    let lo = 0, hi = cdf.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < t) lo = m + 1; else hi = m; }
    const px = lo % w, py = (lo / w) | 0, v = wt[lo] / (max || 1);
    d[i * 4] = (px + r() - w / 2) * sc;
    d[i * 4 + 1] = (py + r() - h / 2) * sc;
    d[i * 4 + 2] = gauss(r) * depth + relief * v;
    d[i * 4 + 3] = 0.6 + 0.4 * v;
  }
  return { data: d, path: 0, closed: false };
}

/**
 * Sample a cloud from an image's luminance: dark pixels draw ink (invert: light pixels do).
 * src is a URL or an already decoded image / bitmap. `size` caps the raster's larger side.
 * @param {string | CanvasImageSource} src @param {number} n
 * @param {{ invert?: boolean, gamma?: number, floor?: number, size?: number, depth?: number, relief?: number, seed?: number }} [o]
 * @returns {Promise<TargetSet>}
 */
export async function fromImage(src, n, o = {}) {
  /** @type {any} */ let img = src;
  if (typeof src === "string") {
    const res = await fetch(src);
    img = await createImageBitmap(await res.blob());
  }
  const iw = img.width, ih = img.height, size = o.size ?? 320, k = size / Math.max(iw, ih);
  const w = Math.max(1, Math.round(iw * k)), h = Math.max(1, Math.round(ih * k));
  const cv = new OffscreenCanvas(w, h), cx = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
  cx.drawImage(img, 0, 0, w, h);
  const px = cx.getImageData(0, 0, w, h).data, wt = new Float32Array(w * h);
  const g = o.gamma ?? 1.5, fl = o.floor ?? 0.04;
  for (let i = 0; i < w * h; i++) {
    const L = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
    const v = (o.invert ? L : 1 - L) * (px[i * 4 + 3] / 255);
    wt[i] = v > fl ? Math.pow(v, g) : 0;
  }
  return fromWeights(wt, w, h, n, o);
}

/**
 * Sample a cloud from a glyph (or a short word) drawn with Canvas2D, after its font has loaded.
 * `edge` 0..1 moves points from the body of the letter to its outline (a printed letter reads by
 * its edges). The glyph's ink box is fitted inside [-1, 1] on its larger side, centred.
 * @param {string} text @param {number} n
 * @param {{ family?: string, weight?: number | string, style?: string, size?: number, edge?: number, depth?: number, relief?: number, seed?: number }} [o]
 * @returns {Promise<TargetSet>}
 */
export async function glyph(text, n, o = {}) {
  const family = o.family ?? '"Sofia Sans Extra Condensed"', weight = o.weight ?? 800, style = o.style ?? "normal";
  const S = o.size ?? 512, font = `${style} ${weight} ${Math.round(S * 0.8)}px ${family}`;
  try { if (typeof document !== "undefined" && document.fonts) await document.fonts.load(font, text); } catch { /* the fallback face draws */ }
  const cv = new OffscreenCanvas(S * 2, S), cx = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
  cx.font = font; cx.textAlign = "center"; cx.textBaseline = "alphabetic"; cx.fillStyle = "#000";
  cx.fillText(text, S, S * 0.82);
  const full = cx.getImageData(0, 0, S * 2, S).data;
  // the ink box
  let x0 = S * 2, y0 = S, x1 = 0, y1 = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S * 2; x++) if (full[(y * S * 2 + x) * 4 + 3] > 8) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < x0) return { data: new Float32Array(n * 4), path: 0, closed: false };
  const w = x1 - x0 + 1, h = y1 - y0 + 1, wt = new Float32Array(w * h), edge = o.edge ?? 0.35;
  /** @param {number} x @param {number} y */
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : full[((y + y0) * S * 2 + x + x0) * 4 + 3] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = A(x, y);
    if (a <= 0) continue;
    const gx = A(x + 1, y) - A(x - 1, y), gy = A(x, y + 1) - A(x, y - 1);
    wt[y * w + x] = a * (1 - edge) + Math.min(1, Math.hypot(gx, gy) * 2) * edge * 3;
  }
  return fromWeights(wt, w, h, n, o);
}

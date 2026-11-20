// @ts-check
/**
 * gen.js — solid figures made of gaussians from what the site already has (lane SPLAT, wave 2).
 *
 *   letter({ text: "A", res })         the display face's letter as a block: Sofia Sans Extra Condensed 800
 *   mark({ res })                      the SerSan mark as a block, its white half and its blue half (the end card's crop,
 *                                      as stage/field/atlas.js reads it)
 *   relief(image, { cols, depth })     an image as a low relief of flat gaussians (height from luminance); NOT FIT FOR A
 *                                      PAGE as it is (wave 3): it settles into a soft blue rounded blob; off on the bench
 *   extrude(mask, opts)                any mask (an alpha canvas) as a block
 *   synthetic({ count, seed })         a made-up "capture" (anisotropic, turned, coloured): what the format test writes
 *
 * A block: its two faces tiled with flat gaussians lying in the face (larger inside, smaller toward the edge), a ring of
 * thin gaussians drawn along the edge just inside it (long along the edge, under a pixel across it: the clean cut), and
 * its sides tiled with gaussians lying in the side. Every tile's smallest axis is its outward normal: the pass shades it
 * against the room's light (cobalt in shade, paper white in light). Units: the figure's height is 1, centred on 0, y down,
 * z toward the reader; the face toward the reader is at z = +depth / 2.
 * Every generator yields between its steps (no task over a few tens of ms); none fetches anything but the site's own files.
 */
import { makeSplats, withBounds } from "./formats.js";

const tick = () => new Promise((r) => setTimeout(r, 0));
const hexRGB = (/** @type {string} */ h) => { const s = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); };
/** the default colours: the site's paper and cobalt (a scene passes its tokens) */
export const GEN_COLORS = Object.freeze({ light: "#f4f1ea", dark: "#2340c9" });

/** 1D squared distance transform (Felzenszwalb & Huttenlocher), as stage/field/atlas.js
 *  @param {Float64Array} f @param {number} n @param {Float64Array} d @param {Int32Array} v @param {Float64Array} z */
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
/** @param {Uint8Array} on @param {number} w @param {number} h @returns {Float32Array} distance to the nearest `on` pixel */
function edt(on, w, h) {
  const g = new Float64Array(w * h), n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < w * h; i++) g[i] = on[i] ? 0 : 1e20;
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1(f, w, d, v, z); for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x]); }
  return out;
}

/** the unit quaternion (w, x, y, z) of the rotation whose columns are the axes X, Y, Z (orthonormal, right-handed)
 *  @param {number[]} X @param {number[]} Y @param {number[]} Z */
export function quatFromAxes(X, Y, Z) {
  const m00 = X[0], m10 = X[1], m20 = X[2], m01 = Y[0], m11 = Y[1], m21 = Y[2], m02 = Z[0], m12 = Z[1], m22 = Z[2];
  const tr = m00 + m11 + m22;
  let w, x, y, z;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; w = 0.25 * s; x = (m21 - m12) / s; y = (m02 - m20) / s; z = (m10 - m01) / s; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
  const l = Math.hypot(w, x, y, z) || 1;
  return [w / l, x / l, y / l, z / l];
}

/** a growing list of splats (pushed one by one, packed at the end) */
function builder() {
  /** @type {number[]} */ const P = [], S = [], Q = [], C = [];
  return {
    /** @param {number[]} p @param {number[]} s @param {number[]} q @param {number[]} c rgba bytes */
    add(p, s, q, c) { P.push(p[0], p[1], p[2]); S.push(s[0], s[1], s[2]); Q.push(q[0], q[1], q[2], q[3]); C.push(c[0], c[1], c[2], c[3]); },
    get n() { return P.length / 3; },
    done() { const d = makeSplats(P.length / 3); d.pos.set(P); d.scale.set(S); d.rot.set(Q); d.color.set(C); return withBounds(d); },
  };
}

/**
 * A mask as a block. mask: { w, h, alpha: Uint8Array (w x h, > 127 inside), tone?: Float32Array (0 dark .. 1 light) }.
 * @param {{ w: number, h: number, alpha: Uint8Array, tone?: Float32Array }} mask
 * @param {{ depth?: number, grid?: number, colors?: { light: string, dark: string }, sideStep?: number, layerStep?: number, sideGrid?: number, rings?: number[], ringSigma?: number, sides?: boolean, sideFade?: number }} [o]
 *   depth: the block's thickness as a fraction of its height (default 0.16); grid: the largest face tile's spacing in mask
 *   px (default 8); sideStep / layerStep: the side tiles' spacing along the edge / through the depth (mask px).
 */
export async function extrude(mask, o = {}) {
  const { w, h, alpha } = mask;
  const inside = new Uint8Array(w * h), outside = new Uint8Array(w * h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < w * h; i++) {
    const on = alpha[i] > 127 ? 1 : 0; inside[i] = on; outside[i] = 1 - on;
    if (on) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error("[splat] extrude: empty mask");
  await tick();
  const dOut = edt(inside, w, h);   // outside pixels: distance to the shape
  await tick();
  const dIn = edt(outside, w, h);   // inside pixels: distance to the edge
  await tick();
  // signed distance at pixel centres, > 0 outside; bilinear at any point
  const sd = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) sd[i] = inside[i] ? -(dIn[i] - 0.5) : dOut[i] - 0.5;
  const at = (/** @type {number} */ x, /** @type {number} */ y) => {
    const fx = Math.max(0, Math.min(w - 1.001, x - 0.5)), fy = Math.max(0, Math.min(h - 1.001, y - 0.5));
    const ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, i = iy * w + ix;
    return (sd[i] * (1 - tx) + sd[i + 1] * tx) * (1 - ty) + (sd[i + w] * (1 - tx) + sd[i + w + 1] * tx) * ty;
  };
  const grad = (/** @type {number} */ x, /** @type {number} */ y) => { const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1); const l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; };
  const toneAt = (/** @type {number} */ x, /** @type {number} */ y) => {
    if (!mask.tone) return 1;
    // the nearest inside pixel's tone (an edge sample sits a pixel inside)
    const ix = Math.max(0, Math.min(w - 1, Math.round(x - 0.5))), iy = Math.max(0, Math.min(h - 1, Math.round(y - 0.5)));
    return mask.tone[iy * w + ix];
  };
  const cl = hexRGB((o.colors || GEN_COLORS).light), cd = hexRGB((o.colors || GEN_COLORS).dark);
  const col = (/** @type {number} */ t, /** @type {number} */ a) => [0, 1, 2].map((k) => Math.round(cd[k] + (cl[k] - cd[k]) * t)).concat([a]);

  const H = y1 - y0 + 1, cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, u = 1 / H;
  const depth = (o.depth ?? 0.16) * H, half = depth / 2;   // in mask px
  const L = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) => [(x - cx) * u, (y - cy) * u, z * u];
  const B = builder();
  const qFront = [1, 0, 0, 0], qBack = [0, 0, 1, 0];   // back: half a turn about y (its normal -z)
  const g0 = o.grid ?? 8;

  // 1. the faces: rings of tiles, the largest deep inside, halving toward the edge; each level owns a band of depth
  //    (distance inside the edge) so its tiles' footprints (2.2 sigma) stop at the edge
  const levels = [];
  for (let g = g0; g >= 2; g /= 2) levels.push(g);
  levels.forEach((g, li) => {
    const sg = 0.78 * g, lo = 2.0 * sg, hi = li === 0 ? 1e9 : 2.0 * 0.78 * levels[li - 1] + levels[li - 1] * 0.5;
    for (let y = y0 + g / 2; y <= y1 + 1; y += g) for (let x = x0 + g / 2; x <= x1 + 1; x += g) {
      const d = -at(x, y);
      if (d < lo || d >= hi) continue;
      const c = col(toneAt(x, y), 252);
      B.add(L(x, y, half), [sg * u, sg * u, 0.1 * sg * u], qFront, c);
      B.add(L(x, y, -half), [sg * u, sg * u, 0.1 * sg * u], qBack, c);
    }
  });
  await tick();

  // 2. the edge, from the zero line of the distance (marching squares on a grid of `step` px: segments that chain end to
  //    end, so the samples are even along the edge): a ring of thin gaussians a pixel inside it, long along it (the
  //    clean cut on both faces), and the sides, layer by layer through the depth
  /** @param {number} step @returns {number[][]} [mx, my, nx, ny, len] (n outward) */
  const contour = (step) => {
    /** @type {number[][]} */ const out = [];
    for (let y = y0 - 2; y <= y1 + 2; y += step) for (let x = x0 - 2; x <= x1 + 2; x += step) {
      const v = [at(x, y), at(x + step, y), at(x + step, y + step), at(x, y + step)];
      const P = [[x, y], [x + step, y], [x + step, y + step], [x, y + step]];
      /** @type {number[][]} */ const cr = [];
      for (let e = 0; e < 4; e++) {
        const a0 = v[e], a1 = v[(e + 1) % 4];
        if ((a0 < 0) !== (a1 < 0)) { const t = a0 / (a0 - a1), p0 = P[e], p1 = P[(e + 1) % 4]; cr.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]); }
      }
      /** @type {number[][][]} */ let segs = [];
      if (cr.length === 2) segs = [[cr[0], cr[1]]];
      else if (cr.length === 4) segs = at(x + step / 2, y + step / 2) < 0 === v[0] < 0 ? [[cr[0], cr[3]], [cr[1], cr[2]]] : [[cr[0], cr[1]], [cr[2], cr[3]]];
      for (const [p, q] of segs) {
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (len < 1e-3) continue;
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        let nx = -(q[1] - p[1]) / len, ny = (q[0] - p[0]) / len;
        const g = grad(mx, my);
        if (nx * g[0] + ny * g[1] < 0) { nx = -nx; ny = -ny; }
        out.push([mx, my, nx, ny, len]);
      }
    }
    return out;
  };
  const es = o.sideStep ?? 2;
  const ring = contour(es);
  await tick();
  // (lane NAME) rings: the insets (mask px) of the edge's rings (default one, a pixel in); ringSigma their width across
  const insets = Array.isArray(o.rings) && o.rings.length ? o.rings : [1.0];
  for (const [mx, my, nx, ny, len] of ring) for (const inset of insets) {
    const px = mx - nx * inset, py = my - ny * inset;
    const c = col(toneAt(px - nx, py - ny), 250);
    const st = Math.max(0.9 * len, 0.7 * es), sn = o.ringSigma ?? 0.55;
    // front: axes (t, n, +z) with t = (ny, -nx); back: (t', n, -z) with t' = (-ny, nx)
    const qf = quatFromAxes([ny, -nx, 0], [nx, ny, 0], [0, 0, 1]);
    const qb = quatFromAxes([-ny, nx, 0], [nx, ny, 0], [0, 0, -1]);
    B.add(L(px, py, half), [st * u, sn * u, 0.08 * u], qf, c);
    B.add(L(px, py, -half), [st * u, sn * u, 0.08 * u], qb, c);
  }
  // the sides: on the edge itself, axes (t, z, n): their smallest axis the outward normal
  const ls = o.layerStep ?? Math.max(2.5, depth / 24);
  const nl = Math.max(2, Math.round(depth / ls)), dz = depth / nl;
  const side = contour(o.sideGrid ?? 3);
  if (o.sides !== false) for (const [mx, my, nx, ny, len] of side) {
    const q = quatFromAxes([-ny, nx, 0], [0, 0, 1], [nx, ny, 0]);
    const c = col(toneAt(mx - 2 * nx, my - 2 * ny), 248);
    const st = Math.max(0.85 * len, 0.6 * 3);
    // layers from face to face, the first and last on the faces' planes (no seam at the corner), the ends a little finer
    for (let j = 0; j <= nl; j++) {
      const z = -half + j * dz, end = j === 0 || j === nl;
      // (lane NAME) sideFade: the side's albedo darkens toward the back face (a shaded block reads its depth)
      const cj = o.sideFade ? col(toneAt(mx - 2 * nx, my - 2 * ny) * (1 - o.sideFade * (1 - j / nl)), 248) : c;
      B.add(L(mx - nx * 0.15, my - ny * 0.15, end ? z - Math.sign(z) * dz * 0.2 : z), [st * u, dz * (end ? 0.45 : 0.8) * u, 0.4 * u], q, cj);
    }
  }
  const d = B.done();
  return Object.assign(d, { meta: { kind: "block", mask: [w, h], tiles: d.count, depth: depth * u } });
}

/** a canvas of w x h with its 2D context @param {number} w @param {number} h */
function canvas(w, h) {
  const cv = new OffscreenCanvas(w, h);
  return /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
}
/** the alpha of a context as a mask @param {OffscreenCanvasRenderingContext2D} g @param {number} w @param {number} h */
function maskOf(g, w, h) {
  const px = g.getImageData(0, 0, w, h).data, a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = px[i * 4 + 3];
  return a;
}

/** a letter (or a short word) of the display face as a block
 *  @param {{ text?: string, res?: number, font?: string, depth?: number, colors?: { light: string, dark: string }, grid?: number }} [o] */
export async function letter(o = {}) {
  const text = o.text || "A", res = o.res || 640;
  const family = o.font || '"Sofia Sans Extra Condensed"';
  const font = `800 ${res}px ${family}`;
  try { if (typeof document !== "undefined" && document.fonts) await document.fonts.load(font, text); } catch { /* the fallback face draws */ }
  const probe = canvas(8, 8); probe.font = font;
  const m = probe.measureText(text);
  const pad = Math.round(res * 0.06);
  const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2 * pad, h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 2 * pad;
  const g = canvas(w, h);
  g.font = font; g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
  g.fillText(text, pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent);
  await tick();
  return extrude({ w, h, alpha: maskOf(g, w, h) }, { depth: o.depth ?? 0.16, colors: o.colors, grid: o.grid });
}

/** the SerSan mark as a block: its white half light, its blue half dark (the brand film's end card, the site's capture)
 *  @param {{ res?: number, depth?: number, colors?: { light: string, dark: string }, url?: string, rings?: number[], ringSigma?: number, sides?: boolean }} [o] */
export async function mark(o = {}) {
  const res = o.res || 520;
  const url = o.url || new URL("../../../../captures/sersan-brand-end-1600.webp", import.meta.url).href;
  const img = await createImageBitmap(await (await fetch(url)).blob());
  const pad = Math.round(res * 0.05), inner = res - 2 * pad;
  const g = canvas(res, res);
  // the mark spans about 50..255 x 30..262 of the 300 px crop at (646, 166) (as stage/field/atlas.js)
  g.drawImage(img, 646 + 33, 166 + 26, 240, 240, pad, pad, inner, inner);
  const px = g.getImageData(0, 0, res, res).data;
  const G = [14, 33, 61];
  const alpha = new Uint8Array(res * res), tone = new Float32Array(res * res);
  for (let i = 0; i < res * res; i++) {
    const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2];
    alpha[i] = Math.hypot(r - G[0], gg - G[1], b - G[2]) > 120 ? 255 : 0;
    tone[i] = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255 > 0.62 && b - r < 60 ? 1 : 0;
  }
  await tick();
  // (wave 5, GLASS2) the edge and side options pass through (consult.js: three rings and no sides, a flat mark)
  return extrude({ w: res, h: res, alpha, tone }, { depth: o.depth ?? 0.2, colors: o.colors, grid: 8, rings: o.rings, ringSigma: o.ringSigma, sides: o.sides });
}

/**
 * An image as a low relief: a grid of flat gaussians, each lying in the surface (its normal from the height's slope),
 * the image's colour, raised toward the reader by its luminance. Units: the image's height is 1.
 * @param {CanvasImageSource & { width: number, height: number }} image
 * @param {{ cols?: number, depth?: number, crop?: number[] }} [o] cols: tiles across (default 300); depth: the relief's
 *   height as a fraction of the image's (default 0.05); crop: [x, y, w, h] in the image's px
 */
export async function relief(image, o = {}) {
  const [sx, sy, sw, sh] = o.crop || [0, 0, image.width, image.height];
  const cols = o.cols || 300, rows = Math.max(2, Math.round((cols * sh) / sw));
  const g = canvas(cols, rows);
  g.drawImage(image, sx, sy, sw, sh, 0, 0, cols, rows);
  const px = g.getImageData(0, 0, cols, rows).data;
  await tick();
  const lum = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
  const u = 1 / rows, depth = (o.depth ?? 0.05), sg = 0.62 * u;
  const hAt = (/** @type {number} */ x, /** @type {number} */ y) => lum[Math.max(0, Math.min(rows - 1, y)) * cols + Math.max(0, Math.min(cols - 1, x))] * depth;
  const B = builder();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x;
    // the surface's normal from its slope (z toward the reader)
    const gx = (hAt(x + 1, y) - hAt(x - 1, y)) / (2 * u), gy = (hAt(x, y + 1) - hAt(x, y - 1)) / (2 * u);
    const N = [-gx, -gy, 1], l = Math.hypot(N[0], N[1], N[2]); N[0] /= l; N[1] /= l; N[2] /= l;
    // X along the row, made normal to N; Y = N x X
    let X = [1, 0, -N[0] / Math.max(1e-3, N[2])]; const lx = Math.hypot(X[0], X[1], X[2]); X = X.map((v) => v / lx);
    const Y = [N[1] * X[2] - N[2] * X[1], N[2] * X[0] - N[0] * X[2], N[0] * X[1] - N[1] * X[0]];
    B.add([(x + 0.5 - cols / 2) * u, (y + 0.5 - rows / 2) * u, hAt(x, y) - depth * 0.5], [sg, sg, 0.08 * sg], quatFromAxes(X, Y, N), [px[i * 4], px[i * 4 + 1], px[i * 4 + 2], 245]);
  }
  const d = B.done();
  return Object.assign(d, { meta: { kind: "relief", grid: [cols, rows] } });
}

/**
 * A made-up capture (nothing is downloaded): a ring of turned, stretched ellipsoids and a lattice of small cubes of
 * gaussians, cobalt to paper, the kind of soup a 3DGS capture is. Units: about 1 across.
 * @param {{ count?: number, seed?: number, colors?: { light: string, dark: string } }} [o]
 */
export function synthetic(o = {}) {
  const n = Math.max(16, o.count || 40000);
  let s = (o.seed || 7) >>> 0;
  const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cl = hexRGB((o.colors || GEN_COLORS).light), cd = hexRGB((o.colors || GEN_COLORS).dark);
  const d = makeSplats(n);
  for (let i = 0; i < n; i++) {
    let p, sc, t;
    if (i % 3 !== 2) {
      // the ring: a torus, the splats stretched along it
      const a = r() * Math.PI * 2, b = r() * Math.PI * 2, R0 = 0.36, r0 = 0.07 + 0.03 * Math.sin(a * 3);
      p = [(R0 + r0 * Math.cos(b)) * Math.cos(a), r0 * Math.sin(b) * 0.9, (R0 + r0 * Math.cos(b)) * Math.sin(a)];
      sc = [0.012 + 0.01 * r(), 0.004 + 0.003 * r(), 0.003 + 0.002 * r()];
      t = 0.5 + 0.5 * Math.cos(a * 2);
      // its first axis along the ring's tangent
      const T = [-Math.sin(a), 0, Math.cos(a)], N = [Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)];
      const Bv = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]];
      d.rot.set(quatFromAxes(T, Bv, N), i * 4);
    } else {
      // the lattice: 27 little cubes, their gaussians turned at random
      const c = (r() * 27) | 0, gx = (c % 3) - 1, gy = (((c / 3) | 0) % 3) - 1, gz = ((c / 9) | 0) - 1;
      p = [gx * 0.16 + (r() - 0.5) * 0.06, gy * 0.16 + (r() - 0.5) * 0.06, gz * 0.16 + (r() - 0.5) * 0.06];
      sc = [0.004 + 0.008 * r(), 0.004 + 0.008 * r(), 0.002 + 0.004 * r()];
      t = (gy + 1) / 2;
      const q = [r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5], l = Math.hypot(...q) || 1;
      d.rot.set(q.map((v) => v / l), i * 4);
    }
    d.pos.set(p, i * 3); d.scale.set(sc, i * 3);
    d.color.set([0, 1, 2].map((k) => Math.round(cd[k] + (cl[k] - cd[k]) * t)).concat([Math.round(150 + 100 * r())]), i * 4);
  }
  return Object.assign(withBounds(d), { meta: { kind: "synthetic" } });
}

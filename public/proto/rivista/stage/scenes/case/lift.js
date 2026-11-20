// @ts-check
/**
 * lift.js — (wave 2, GLOW-WORK) a capture held in a plate, lifted so it READS in the night: a dark capture (Sphere AI's
 * mentor, the Supply Chain's diagram on the night ground) is drawn once onto a canvas with its levels set: its dark ground
 * most of the way to black, its brightest one per cent to about 0.8 (gain at most 2.4, wave 4: gently; a capture already
 * bright is left as it is), and the scene
 * hands the plate that canvas instead of the image. Shared by the gallery and the case opener (the same plate).
 *
 *   import { lifted } from "./case/lift.js";
 *   const tex = lifted(c, "gallery", slabId, c.imgs[slabId]) ?? c.imgs[slabId].tex;
 *
 * Nothing per frame once done: one canvas per capture, measured on a 96 px copy.
 */

/** @type {Map<string, { tex: string | null, cv: HTMLCanvasElement | null }>} */
const DONE = new Map();

/** a picture's size (an image or a canvas) @param {any} el @returns {number[]} */
const dims = (el) => [el.naturalWidth || el.width || 1, el.naturalHeight || el.height || 1];

/** the capture's levels: its ground (median) and its brightest one per cent, measured on a 96 px copy
 *  @param {HTMLImageElement} el @returns {{ black: number[], gain: number }} */
function levelsOf(el) {
  const [W0, H0] = dims(el), s = 96, k = Math.min(1, s / Math.max(W0, H0));
  const w = Math.max(1, Math.round(W0 * k)), h = Math.max(1, Math.round(H0 * k));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
  g.drawImage(el, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, L = [], ch = [[], [], []];
  for (let i = 0; i < d.length; i += 4) {
    L.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
    for (let j = 0; j < 3; j++) /** @type {number[]} */ (ch[j]).push(d[i + j] / 255);
  }
  L.sort((a, b) => a - b);
  const med = ch.map((/** @type {number[]} */ v) => v.sort((a, b) => a - b)[Math.floor(0.5 * (v.length - 1))] || 0);
  const p50 = L[Math.floor(0.5 * (L.length - 1))] || 0, p99 = L[Math.floor(0.99 * (L.length - 1))] || 1;
  // a capture whose brightest part is already near paper is left as it is (gain 1)
  if (p99 > 0.72) return { black: [0, 0, 0], gain: 1 };
  // a dark capture: its ground (the median, when dark) goes to black, its brightest one per cent near paper
  // per channel: a navy ground goes to black, not to a brighter blue
  // (wave 4, PRISM) gently: the ground three quarters of the way to black and the brightest part to about 0.8, the gain
  // at most 2.4 (at 0.92 and 3.6 Sphere AI's mentor read brighter in the plate than on the real site)
  const black = p50 < 0.16 ? med.map((m) => m * 0.75) : [0, 0, 0];
  return { black, gain: Math.max(1, Math.min(2.4, 0.8 / Math.max(p99 - (black[0] + black[1] + black[2]) / 3, 0.05))) };
}

/**
 * A picture (an image or a canvas) with its levels set, as a new canvas at most 1200 px wide; null when it needs none.
 * The lines bright on dark glass: out = (in - ground) x gain, per channel (one pass, ~10 ms, once per picture).
 * @param {any} pic @returns {HTMLCanvasElement | null}
 */
export function withLevels(pic) {
  const lv = levelsOf(pic);
  if (lv.gain <= 1.08) return null;
  const [W0, H0] = dims(pic), k = Math.min(1, 1200 / Math.max(W0, H0));
  const cv = document.createElement("canvas");
  cv.width = Math.round(W0 * k); cv.height = Math.round(H0 * k);
  const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
  g.drawImage(pic, 0, 0, cv.width, cv.height);
  const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data, gn = lv.gain;
  const b0 = lv.black[0] * 255, b1 = lv.black[1] * 255, b2 = lv.black[2] * 255;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = (d[i] - b0) * gn; d[i + 1] = (d[i + 1] - b1) * gn; d[i + 2] = (d[i + 2] - b2) * gn;
  }
  g.putImageData(im, 0, 0);
  return cv;
}

/**
 * The lifted texture's id for a capture, or null (not needed, not ready yet, or failed: use the image's own).
 * @param {any} c the scene's context  @param {string} scene the scene's name (the host prefixes texture ids with it)
 * @param {string} id the capture's data-slab id  @param {any} im c.imgs[id]
 * @returns {string | null}
 */
export function lifted(c, scene, id, im) {
  if (!im || !im.el || typeof c.texture !== "function") return null;
  const key = scene + ":" + id;
  let e = DONE.get(key);
  if (!e) {
    // the page's <img> may never decode (lazy, hidden while the stage draws): its own copy, from the same file
    const ent = /** @type {{ tex: string | null, cv: HTMLCanvasElement | null }} */ ({ tex: null, cv: null });
    DONE.set(key, ent);
    const el = /** @type {HTMLImageElement} */ (im.el), src = el.currentSrc || el.src;
    if (!src) return null;
    const pic = new Image();
    pic.decoding = "async";
    pic.src = src;
    pic.decode().then(() => { ent.cv = withLevels(pic); }, () => { ent.cv = null; });
    return null;
  }
  if (!e.cv) return null;
  // asked once (the host uploads it; asked again while pending it would upload it again), then named as the host names
  // it: the host draws the plate without an image for the frame or two until it holds it, as it does for etched words
  if (!e.tex) { c.texture("lift-" + id, e.cv); e.tex = scene + ":lift-" + id; }
  return e.tex;
}

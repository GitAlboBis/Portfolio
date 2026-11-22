// @ts-check
/**
 * labels.js — the orrery's words as one atlas (wave 8, lane ORRERY): each word drawn once on a 2D canvas in the page's
 * label face (the computed style of Now's .t-label: family, weight, letter spacing, uppercase), at the device pixel
 * ratio, white on black (the pass reads the red channel as coverage and writes paper white). Drawn again when the
 * words, the face's size or the ratio change (a resize). Nothing here touches the GPU.
 *
 * (the lead, 22 Nov) Every body carries its name all the turn on a desktop (Alberto: «vorrei che le scritte dei simboli
 * siano sempre attive»), so a long name stands in TWO balanced lines, centred, as a caption under its body: half as
 * wide, and nine of them fit round the carousel. font.wrap is a line's most in em (0: one line, a phone's band).
 */

/**
 * @param {string[]} words @param {{ family?: string, weight?: string | number, size?: number, ls?: number, lang?: string, wrap?: number }} font
 * @param {number} dpr
 * @returns {{ canvas: HTMLCanvasElement | OffscreenCanvas, rects: { u0: number, v0: number, u1: number, v1: number, w: number, h: number, lines: number }[], key: string, font: string, px: number }} px: the type's size, css px
 */
export function rasterLabels(words, font, dpr) {
  const size = Math.max(8, font.size || 16), px = size * dpr, pad = Math.ceil(2 * dpr);
  const family = font.family || '"Sofia Sans Condensed", "Barlow Condensed", "Arial Narrow", sans-serif';
  const fs = `${font.weight || 600} ${px}px ${family}`;
  const up = words.map((w) => String(w || "").toLocaleUpperCase(font.lang || "en").replace(/\s+/g, " ").trim());
  const mk = (/** @type {number} */ w, /** @type {number} */ h) => {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
    const c = document.createElement("canvas"); c.width = w; c.height = h; return c;
  };
  const track = (font.ls || 0) * dpr;
  const setup = (/** @type {any} */ g) => {
    g.font = fs; g.textBaseline = "alphabetic"; g.textAlign = "left";
    try { g.letterSpacing = `${track}px`; } catch { /* an older engine: no tracking */ }
  };
  const m0 = /** @type {any} */ (mk(8, 8).getContext("2d"));
  setup(m0);
  /** a line's ink width: the tracking after its last letter is not ink */
  const widthOf = (/** @type {string} */ t) => { const m = m0.measureText(t); return Math.max(1, Math.ceil(Math.max(m.width - track, (m.actualBoundingBoxRight || 0) + (m.actualBoundingBoxLeft || 0)))); };
  // a name wider than font.wrap em breaks at the space that leaves its two lines most alike
  const most = (font.wrap || 0) * px;
  const lines = up.map((w) => {
    if (!(most > 0) || widthOf(w) <= most || w.indexOf(" ") < 0) return [w];
    let best = [w], bw = Infinity;
    for (let i = 1; i < w.length - 1; i++) {
      if (w[i] !== " ") continue;
      const a = w.slice(0, i), b = w.slice(i + 1), m = Math.max(widthOf(a), widthOf(b));
      if (m < bw) { bw = m; best = [a, b]; }
    }
    return best;
  });
  const ms = lines.flat().map((t) => m0.measureText(t));
  // a line's box is cut to its ink (capitals: no descender; the tallest of all sets the line), so a word stands close
  // under its body and a low band keeps its height for the figure; two lines stand a third of the type's size apart
  const asc = Math.ceil(Math.max(...ms.map((m) => m.actualBoundingBoxAscent || px * 0.72)));
  const desc = Math.ceil(Math.max(...ms.map((m) => m.actualBoundingBoxDescent || 0)));
  const lineH = asc + desc, lead = Math.round(0.36 * px);
  const lw = lines.map((ls) => ls.map(widthOf));
  const ws = lw.map((a) => Math.max(...a) + 2 * pad);
  const hs = lines.map((ls) => ls.length * lineH + (ls.length - 1) * lead + 2 * pad);
  const W = Math.max(8, Math.ceil(Math.max(...ws) / 4) * 4), H = Math.max(8, hs.reduce((s, h) => s + h, 0));
  const cv = mk(W, H), g = /** @type {any} */ (cv.getContext("2d"));
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  setup(g);
  g.fillStyle = "#fff";
  let y0 = 0;
  const rects = lines.map((ls, i) => {
    ls.forEach((t, k) => g.fillText(t, pad + Math.round((ws[i] - 2 * pad - lw[i][k]) / 2), y0 + pad + asc + k * (lineH + lead)));
    const r = { u0: 0, v0: y0 / H, u1: ws[i] / W, v1: (y0 + hs[i]) / H, w: ws[i] / dpr, h: hs[i] / dpr, lines: ls.length };
    y0 += hs[i];
    return r;
  });
  return { canvas: cv, rects, key: labelKey(words, font, dpr), font: fs, px: size };
}

/** what an atlas was drawn for @param {string[]} words @param {any} font @param {number} dpr */
export function labelKey(words, font, dpr) {
  return `${(words || []).join("|")}#${font ? [font.family, font.weight, font.size, font.ls, font.lang, font.wrap || 0].join(",") : ""}#${dpr}`;
}

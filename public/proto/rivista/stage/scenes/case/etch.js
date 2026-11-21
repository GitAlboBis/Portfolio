// @ts-check
/**
 * case/etch.js — the key words of a work with no capture, etched into its plate: the figure fitted large to the
 * plate's width, the line under it, both in the display face, capitals, white on transparent (the stage frosts the
 * alpha into the glass). ONE drawing for the Work gallery's etched plates (gallery.js imports it) and a case's opening
 * plate, so the case opens on the plate the reader chose there. The words come from the page ([data-slab-words]),
 * never from this file.
 *
 * (wave 7, STAGE) The line under the figure:
 *  - a size floor: it was a fraction of the figure's size, so under a long figure ("AUTONOMIA MERITATA", "SOTTO IL
 *    SECONDO") it came down to about 7 css px of capital height on the plate at 1440 (and the case drew it smaller
 *    still than the gallery: the same plate read two ways). Now LINE_MIN canvas px at least (about 15 css px of
 *    capitals on the gallery's plate in step at 1440), LINE_MAX at most;
 *  - balanced rows: the fewest rows the line needs, its words spread so the rows run about as long as one another
 *    (the greedy wrap left "ME" alone on the Italian Obla plate's last row);
 *  - a no-break space holds: words split on plain spaces only (/\s/ also matched U+00A0).
 */
const LINE_K = 0.27, LINE_MIN = 96, LINE_MAX = 136;

/** the rows of `words` at the fewest rows the width allows, balanced (the narrowest width that still needs no more rows)
 *  @param {CanvasRenderingContext2D} g @param {string[]} words @param {number} max */
export function balancedRows(g, words, max) {
  const wrap = (/** @type {number} */ w) => {
    const rows = [];
    let cur = "";
    for (const x of words) { const t = cur ? cur + " " + x : x; if (g.measureText(t).width > w && cur) { rows.push(cur); cur = x; } else cur = t; }
    if (cur) rows.push(cur);
    return rows;
  };
  const best = wrap(max), n = best.length;
  if (n < 2) return best;
  let lo = 0, hi = max;
  for (let k = 0; k < 14; k++) { const mid = (lo + hi) / 2; if (wrap(mid).length > n) lo = mid; else hi = mid; }
  return wrap(hi);
}

/** @param {string} fig @param {string} line */
export function etchCanvas(fig, line) {
  const W = 1600, H = 1200, pad = 120;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d"));
  const face = '"Sofia Sans Extra Condensed", "Barlow Condensed", sans-serif';
  g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
  const F = fig.toUpperCase(), Ln = line.toUpperCase();
  g.font = `800 100px ${face}`;
  const size = Math.min((100 * (W - 2 * pad)) / Math.max(1, g.measureText(F).width), H * 0.5);
  g.font = `800 ${size}px ${face}`;
  const top = pad + size * 0.86 + (H * 0.5 - size) * 0.35;
  g.fillText(F, pad, top);
  const ls = Math.max(LINE_MIN, Math.min(size * LINE_K, LINE_MAX));
  g.font = `800 ${ls}px ${face}`;
  const rows = balancedRows(g, Ln.split(/[ \t\r\n]+/).filter(Boolean), W - 2 * pad);
  let y = H - pad - (rows.length - 1) * ls * 0.92;
  for (const r of rows) { g.fillText(r, pad, y); y += ls * 0.92; }
  return cv;
}

// @ts-check
/**
 * case/etch.js — the key words of a work with no capture, etched into its plate: the figure fitted large to the
 * plate's width, the line under it, both in the display face, capitals, white on transparent (the stage frosts the
 * alpha into the glass). The same drawing as the Work gallery's etched plates (gallery.js), so the case opens on the
 * plate the reader chose there. The words come from the page ([data-slab-words]), never from this file.
 * @param {string} fig @param {string} line
 */
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
  const ls = Math.min(size * 0.2, 104);
  g.font = `800 ${ls}px ${face}`;
  const words = Ln.split(/\s+/), rows = [];
  let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > W - 2 * pad && cur) { rows.push(cur); cur = w; } else cur = t; }
  if (cur) rows.push(cur);
  let y = H - pad - (rows.length - 1) * ls * 0.92;
  for (const r of rows) { g.fillText(r, pad, y); y += ls * 0.92; }
  return cv;
}

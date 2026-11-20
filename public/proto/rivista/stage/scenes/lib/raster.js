// @ts-check
/**
 * raster.js — the host's two rasters for glass (spec 50 §3, §5): the display type a plate may bend, and etched words
 * for a plate's own texture. Used by fx-stage.js; a scene reaches etch() through ctx.etch(id, lines, opts).
 *
 *   rasteriseType({ nodes, rect, scale }) -> { canvas, rect, scale, ms }
 *     The [data-refract] elements' glyphs, each at the rect the browser laid it out at, in its own font, size, weight
 *     and colour (with its text-transform), over the page's ground, in DOCUMENT px. stage.setBackdrop(canvas, rect).
 *
 *   etch(lines, { w, h, scale, align, colour, pad, face }) -> canvas
 *     Words cut into glass: the display face (the page's h1 family, else Sofia Sans Extra Condensed), weight 800,
 *     uppercase, line-height 0.86, white on transparent, each line fitted to the width (w x h css px, default 512 x
 *     640, at scale 2). The stage frosts it inside the plate. Call it once the fonts are in.
 */

/** @typedef {{ x: number, y: number, w: number, h: number }} Rect */

/** @param {Element} el @returns {Rect} document px */
function docRect(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}
/** @param {string} c */
const visible = (c) => !!c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);
/** @param {string} t @param {string} tt */
const transform = (t, tt) => (tt === "uppercase" ? t.toUpperCase() : tt === "lowercase" ? t.toLowerCase() : t);

/** the page's ground colour (the body's, else the root's) */
function pageGround() {
  const b = getComputedStyle(document.body).backgroundColor;
  if (visible(b)) return b;
  const r = getComputedStyle(document.documentElement).backgroundColor;
  return visible(r) ? r : "#0c0e14";
}

/** @param {{ nodes: Element[], rect: Rect, scale?: number, maxSide?: number }} o */
export async function rasteriseType(o) {
  const t0 = performance.now();
  try { await document.fonts.ready; } catch (e) { /* no font API */ }
  const rect = o.rect, maxSide = o.maxSide ?? 4096;
  const scale = Math.min(o.scale ?? 1, maxSide / Math.max(rect.w, rect.h, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.w * scale));
  canvas.height = Math.max(1, Math.round(rect.h * scale));
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d", { alpha: false }));
  g.setTransform(scale, 0, 0, scale, -rect.x * scale, -rect.y * scale);
  g.fillStyle = pageGround();
  g.fillRect(rect.x, rect.y, rect.w, rect.h);
  for (const el of o.nodes) paintText(g, el);
  return { canvas, rect, scale, ms: performance.now() - t0 };
}

/** every visible glyph of an element's text, at its own rect @param {CanvasRenderingContext2D} g @param {Element} root */
function paintText(g, root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  /** @type {Text | null} */ let node;
  while ((node = /** @type {Text | null} */ (walker.nextNode()))) {
    const text = node.data;
    if (!text.trim()) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest(".sr-only, [hidden], [data-stage-poster]")) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.fillStyle = cs.color;
    g.textBaseline = "alphabetic";
    const m = g.measureText("Hg");
    const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!ch.trim()) continue;
      const cp = text.codePointAt(i) ?? 0, len = cp > 0xffff ? 2 : 1;
      range.setStart(node, i); range.setEnd(node, i + len);
      const r = range.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) { i += len - 1; continue; }
      const y = r.top + window.scrollY + (r.height * asc) / Math.max(asc + desc, 1);
      g.fillText(transform(text.slice(i, i + len), cs.textTransform), r.left + window.scrollX, y);
      i += len - 1;
    }
  }
}

/** the display face's family: the page's h1, if it is set in one, else the spec's */
function displayFace() {
  const h = document.querySelector("h1");
  const f = h ? getComputedStyle(h).fontFamily : "";
  return /sofia|barlow/i.test(f) ? f : '"Sofia Sans Extra Condensed", "Barlow Condensed", sans-serif';
}

/**
 * @param {string[]} lines
 * @param {{ w?: number, h?: number, scale?: number, align?: "left" | "center", colour?: string, pad?: number, face?: string, weight?: number }} [o]
 */
export function etch(lines, o = {}) {
  const w = o.w ?? 512, h = o.h ?? 640, s = o.scale ?? 2, pad = o.pad ?? 0.08 * w;
  const c = document.createElement("canvas");
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  g.scale(s, s);
  g.fillStyle = o.colour ?? "#ffffff";
  g.textBaseline = "alphabetic";
  const face = o.face ?? displayFace(), weight = o.weight ?? 800;
  const L = lines.map((l) => l.toUpperCase()).filter(Boolean);
  if (!L.length) return c;
  // every line at the size that fits the width, all lines at the smallest of those, and the block fitted to the height
  const inner = w - 2 * pad;
  g.font = `${weight} 100px ${face}`;
  const fit = Math.min(...L.map((l) => (100 * inner) / Math.max(1, g.measureText(l).width)));
  const size = Math.min(fit, (h - 2 * pad) / (L.length * 0.86));
  g.font = `${weight} ${size}px ${face}`;
  const lh = size * 0.86, block = lh * L.length;
  let y = (h - block) / 2 + size * 0.78;
  for (const l of L) {
    const tw = g.measureText(l).width;
    g.fillText(l, o.align === "left" ? pad : (w - tw) / 2, y);
    y += lh;
  }
  return c;
}

// @ts-check
/**
 * backdrop.js — what the plates of glass bend, rasterised from the DOM (spec 50 §5).
 *
 *   import { rasteriseBackdrop } from "./stage/glass/backdrop.js";
 *   const bd = await rasteriseBackdrop({ rect, nodes, scale });
 *   stage.setBackdrop(bd.canvas, bd.rect);
 *
 * rect   the document rect to cover (css px). Default: the union of the nodes' rects, padded by `pad`.
 * nodes  the elements glass may pass over, any mix of:
 *        - display type: an element carrying text (a lockup marked data-refract="lockup" with .ch spans,
 *          a chapter head, a display line marked data-refract). Drawn glyph by glyph at the DOM's own
 *          rects, in the element's own font, size, weight, style and colour, with its text-transform;
 *          so letter-spacing, kerning, line breaks and italics land where the browser put them.
 *        - plates: an <img>, or an element holding one (its image, object-fit cover or contain, at its rect).
 *        - any element's own box: its background colour and its borders (hairline rules) are painted first.
 *        Never body copy: glass does not pass over text blocks (they are its keep-outs).
 * grounds elements whose background is painted before everything (default: every [data-night] and [data-dawn]).
 * page    the page's ground colour (default: the body's computed background).
 * scale   backing px per css px (default: min(devicePixelRatio, 2)); the canvas is clamped to maxSide.
 * Returns { canvas, rect, scale, ms }. Rasterise again when the layout or the fonts change, or when
 * the figure moves to another region of the page; it costs a few ms for a cover.
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
function transform(t, tt) {
  if (tt === "uppercase") return t.toUpperCase();
  if (tt === "lowercase") return t.toLowerCase();
  return t;
}

/**
 * @param {{ nodes: Element[], rect?: Rect, grounds?: Element[], page?: string, scale?: number, pad?: number, maxSide?: number }} o
 */
export async function rasteriseBackdrop(o) {
  const t0 = performance.now();
  await document.fonts.ready;
  const nodes = o.nodes.filter(Boolean);
  let rect = o.rect;
  if (!rect) {
    const pad = o.pad ?? 120;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const n of nodes) { const r = docRect(n); x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    rect = { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  }
  const maxSide = o.maxSide ?? 4096;
  const scale = Math.min(o.scale ?? Math.min(window.devicePixelRatio || 1, 2), maxSide / Math.max(rect.w, rect.h));
  const W = Math.max(1, Math.round(rect.w * scale)), Hh = Math.max(1, Math.round(rect.h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = Hh;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d", { alpha: false }));
  g.setTransform(scale, 0, 0, scale, -rect.x * scale, -rect.y * scale);
  const R = /** @type {Rect} */ (rect);

  // the ground: the page, then the night blocks (and any other ground given)
  g.fillStyle = o.page || getComputedStyle(document.body).backgroundColor || "#0c0e14";
  g.fillRect(R.x, R.y, R.w, R.h);
  for (const el of o.grounds ?? [...document.querySelectorAll("[data-night], [data-dawn]")]) {
    const bg = getComputedStyle(el).backgroundColor;
    if (!visible(bg)) continue;
    const r = docRect(el);
    g.fillStyle = bg; g.fillRect(r.x, r.y, r.w, r.h);
  }

  for (const el of nodes) {
    paintBox(g, el);
    const imgs = el instanceof HTMLImageElement ? [el] : [...el.querySelectorAll("img")];
    for (const img of imgs) await paintImage(g, img);
    paintText(g, el);
  }
  return { canvas, rect: R, scale, ms: performance.now() - t0 };
}

/** background colour and borders of an element's own box @param {CanvasRenderingContext2D} g @param {Element} el */
function paintBox(g, el) {
  const cs = getComputedStyle(el);
  const r = docRect(el);
  if (visible(cs.backgroundColor)) { g.fillStyle = cs.backgroundColor; g.fillRect(r.x, r.y, r.w, r.h); }
  const side = (/** @type {string} */ s, /** @type {(w: number) => number[]} */ box) => {
    const w = parseFloat(cs.getPropertyValue(`border-${s}-width`)) || 0;
    const c = cs.getPropertyValue(`border-${s}-color`);
    if (w > 0 && visible(c) && cs.getPropertyValue(`border-${s}-style`) !== "none") { g.fillStyle = c; const [x, y, ww, hh] = box(w); g.fillRect(x, y, ww, hh); }
  };
  side("top", (w) => [r.x, r.y, r.w, w]);
  side("bottom", (w) => [r.x, r.y + r.h - w, r.w, w]);
  side("left", (w) => [r.x, r.y, w, r.h]);
  side("right", (w) => [r.x + r.w - w, r.y, w, r.h]);
}

/** an image at its rect, as the browser fits it @param {CanvasRenderingContext2D} g @param {HTMLImageElement} img */
async function paintImage(g, img) {
  try { if (!img.complete || !img.naturalWidth) await img.decode(); } catch { return; }
  const r = docRect(img);
  if (r.w < 1 || r.h < 1 || !img.naturalWidth) return;
  const cs = getComputedStyle(img);
  const fit = cs.objectFit;
  // object-position as two shares (percentages; keywords map to 0 / 50 / 100 %)
  const pos = cs.objectPosition.split(" ").map((v) => (v === "left" || v === "top" ? 0 : v === "right" || v === "bottom" ? 1 : v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
  const px = pos[0] ?? 0.5, py = pos[1] ?? 0.5;
  // naturalWidth is density-corrected under a srcset (a 1600 px file chosen for an 864 px slot reports 864), while
  // drawImage reads the file's own pixels: draw a bitmap of the file, in its own pixel units
  let src = /** @type {CanvasImageSource} */ (img), iw = img.naturalWidth, ih = img.naturalHeight;
  try { const bmp = await createImageBitmap(img); src = bmp; iw = bmp.width; ih = bmp.height; } catch { /* draw the element */ }
  let sx = 0, sy = 0, sw = iw, sh = ih, dx = r.x, dy = r.y, dw = r.w, dh = r.h;
  if (fit === "cover") {
    const k = Math.max(r.w / iw, r.h / ih);
    sw = r.w / k; sh = r.h / k; sx = (iw - sw) * px; sy = (ih - sh) * py;
  } else if (fit === "contain") {
    const k = Math.min(r.w / iw, r.h / ih);
    dw = iw * k; dh = ih * k; dx = r.x + (r.w - dw) * px; dy = r.y + (r.h - dh) * py;
  }
  g.save();
  g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
  g.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  g.restore();
  if (src !== img && "close" in src) /** @type {ImageBitmap} */ (src).close();
}

/** every visible glyph of an element's text, at its own rect @param {CanvasRenderingContext2D} g @param {Element} root */
function paintText(g, root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  /** @type {Text | null} */ let node;
  while ((node = /** @type {Text | null} */ (walker.nextNode()))) {
    const text = node.data;
    if (!text.trim()) continue;
    const parent = /** @type {Element} */ (node.parentElement);
    if (!parent || parent.closest(".sr-only, [hidden]")) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.fillStyle = cs.color;
    g.textBaseline = "alphabetic";
    const m = g.measureText("Hg");
    const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!ch.trim()) continue;
      // one code point (a surrogate pair stays whole)
      const cp = text.codePointAt(i) ?? 0, len = cp > 0xffff ? 2 : 1;
      range.setStart(node, i); range.setEnd(node, i + len);
      const r = range.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) { i += len - 1; continue; }
      const glyph = transform(text.slice(i, i + len), cs.textTransform);
      const y = r.top + window.scrollY + (r.height * asc) / Math.max(asc + desc, 1);
      g.fillText(glyph, r.left + window.scrollX, y);
      i += len - 1;
    }
  }
}

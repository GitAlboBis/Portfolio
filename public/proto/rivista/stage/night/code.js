// @ts-check
/**
 * code — Consulting 3, Claude Code best practice (spec "Storia" §3.5, §6.1).
 *
 * Rows of light in the silhouette of a code listing: indentation steps, long and short lines, blank
 * lines, a comment, a gutter of line numbers. No character is ever drawn (no text in the canvas):
 * each token is a short bar of light whose brightness is its kind (a keyword is bright, a name is
 * mid, a string a little dimmer, a comment faint), so the listing reads as syntax by tone alone.
 * The step's progress types it in from the left, row by row: each new token leaves the caret and
 * settles in its place, and a block caret stands after the last one. The listing is a screen seen
 * a little from the side, in depth.
 */
import { Sets, clamp, smooth, stepProgress, inkFor, rackFocus, hurry } from "./lib.js";

// the listing: indent (in 2-char steps), then tokens as kind + length (k keyword, i name,
// p punctuation, s string, n number, c comment); "" is a blank line
const SRC = [
  "0 c34",
  "0 k6 p1 i11 p1 i5 p1 k4 s14 p1",
  "0 k6 p1 i6 p1 k4 s16 p1",
  "",
  "0 k6 i5 p1 i7 p2 i5 p2",
  "1 i4 p1 s9 p1 i5 p1 s12 p2",
  "1 i5 p1 i8 p1 i6 p1 n2 p2",
  "1 i5 p1 p1 s7 p1 s8 p1 s6 p1 p2",
  "0 p2",
  "",
  "0 k5 k8 i3 p1 i4 p2",
  "1 k5 i4 p1 k5 i5 p1 i5 p1 i4 p2",
  "1 k3 p1 k5 i5 k2 i4 p1 i6 p2 p1",
  "2 k5 i3 p1 k5 i4 p1 i3 p1 i5 p2",
  "2 k2 p1 i3 p1 i2 p2 i4 p1 i6 p1 i3 p2",
  "3 k5 i4 p1 i6 p1 i5 p2",
  "2 p1",
  "1 p1",
  "1 k6 i6 p1 i5 p1 i6 p2",
  "0 p1",
];

const CW = 0.031;     // one character's width (local units)
const ROW = 0.088;    // row pitch
const BAR = 0.024;    // a bar's height
const X0 = -0.72;     // where column 0 starts (the gutter sits left of it)
const KIND = { k: 1.0, i: 0.62, p: 0.4, s: 0.5, n: 0.8, c: 0.24 };

/** @type {{ x: number, y: number, w: number, row: number, ink: number }[]} */
const TOKENS = [];
const Y0 = -((SRC.length - 1) * ROW) / 2 - 0.02;
SRC.forEach((line, r) => {
  if (!line) return;
  const [ind, ...toks] = line.split(" ");
  let col = +ind * 2;
  for (const t of toks) {
    const k = /** @type {keyof typeof KIND} */ (t[0]), n = +t.slice(1);
    TOKENS.push({ x: X0 + col * CW, y: Y0 + r * ROW, w: n * CW, row: r, ink: KIND[k] });
    col += n + (k === "p" ? 0 : 1);
  }
});
const CHARS = TOKENS.reduce((s, t) => s + t.w / CW, 0);

/**
 * The listing typed up to `chars` characters, the caret after them.
 * @param {number} chars @param {number} blink 0..1 caret on
 */
function build(chars, blink) {
  const S = new Sets(13000);
  let left = chars, caret = [X0, Y0], lastRow = 0;
  /** @type {number[][]} */ const pts = [];
  // where the caret stands: the row being typed is a little brighter than the rows done
  for (const t of TOKENS) {
    const n = Math.round(t.w / CW), shown = clamp(left, 0, n);
    left -= n;
    if (shown > 0) { caret = [t.x + shown * CW + CW * 0.6, t.y]; lastRow = t.row; }
  }
  left = chars;
  for (const t of TOKENS) {
    const n = Math.round(t.w / CW), shown = clamp(left, 0, n);
    left -= n;
    const lift = t.row === lastRow && chars < CHARS ? 1.35 : 1;
    // a bar: 3 rows of points per character, 6 across
    for (let c = 0; c < n; c++) {
      const on = c < shown ? 1 : 0;
      for (let a = 0; a < 6; a++) for (let b = 0; b < 3; b++) {
        pts.push([t.x + (c + (a + 0.5) / 6) * CW * 0.94, t.y + (b - 1) * (BAR / 3), 0, t.ink * on * lift]);
      }
    }
  }
  // the gutter: one faint mark per numbered row, shown once its row has begun
  for (let r = 0; r < SRC.length; r++) {
    const on = r <= lastRow && chars > 0 ? 1 : 0;
    for (let a = 0; a < 10; a++) pts.push([X0 - 0.12 + (a / 9) * 0.045, Y0 + r * ROW, 0, 0.16 * on]);
  }
  // the block caret first (its targets keep their particles whatever is typed): a filled cell, one character wide, as tall as a line
  for (let a = 0; a < 5; a++) for (let b = 0; b < 9; b++) {
    S.push(caret[0] + (a / 4 - 0.5) * CW * 0.9, caret[1] + (b / 8 - 0.5) * ROW * 0.72, 0.004, 1.15 * blink);
  }
  for (const p of pts) S.push(p[0], p[1], p[2], p[3]);
  return { set: S.set(), caret };
}

export default {
  share: 0.5, fill: 0.97, fit: "contain", inkArea: 300000, capacity: 13000,
  look: { ink: 0.042, size: 1.1, mistInk: 0.01, mistSize: 1.2 },
  motion: { spring: 7, speed: 900, inertia: 0.1, fuzz: 1.0 },
  flow: { amp: 1.6, wavelength: 220, evolution: 0.05, z: 0.6 },
  respond: { hand: 0.35, wind: 0.3, fadeIn: 7, fadeOut: 5 },
  emit: 1, spawn: [X0, Y0, 0, 2],
  targets() { return build(0, 1).set; },
  /** @param {any} c */
  update(c) {
    const s = c.state;
    // a few rows already there when the step opens, the rest typed over its first 60 %, then it stands, complete
    // (INTEGRATE: typed over 85 %, the box stood almost empty while the reader read the entry)
    const p = stepProgress(c.scene, 3);
    const chars = Math.floor(CHARS * (0.12 + 0.88 * smooth(0.0, 0.6, p)) + (p >= 0.6 ? 1 : 0));
    // the caret blinks while the page moves (the stage rests with it on)
    const blink = (c.time % 1.06) < 0.62 ? 1 : 0.15;
    const key = chars * 2 + (blink > 0.5 ? 1 : 0);
    if (s.key !== key) {
      const b = build(chars, blink);
      c.setTargets(b.set); s.key = key; s.caret = b.caret;
    }
    const cr = s.caret || [X0, Y0];
    // the figure lands fast on its step (fix-stage: no seconds of streaks after a step change)
    const h = hurry(c, c.scene.step >= 3 ? 3 : 0, { spring: 7, speed: 900, inertia: 0.1 }, 1.6);
    return {
      motion: h.motion, flow: h.flow,
      rotate: [0.08, -0.22, 0.0],
      offset: [0, 0, rackFocus(c, 3)],
      // new tokens leave the caret
      spawn: [cr[0] - CW, cr[1], 0, 3],
      ink: inkFor(c.rect, 300000, 0.85),
    };
  },
};

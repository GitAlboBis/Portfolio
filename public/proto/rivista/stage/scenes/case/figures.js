// @ts-check
/**
 * case/figures.js — (lane CASES) a figure of light for every chapter of a case page, so the chapters are one
 * continuous shot with the opener and never text on wallpaper. The same figure for the same chapter type on all nine
 * cases (section[data-ch] in parts/c-main.case.mjs):
 *
 *   what       the work's own plate (its capture, or its key words etched), large and deep in the room, turned, its far
 *              edge past the frame: a wall of glass, not a card
 *   facts      (lane FIXCASES) THE COUNT: each row's number as units of light, one per thing counted, on the row's own
 *              line (a phone: under the row's number), lit one by one as the row comes up: "21/49" is 49 units with 21
 *              bright, "0" an empty rule, thousands a fine field of dots; a value that is not a count ("4K") has none.
 *              A facts chapter's own list takes the list's stack while its rows are read
 *   teaser     its before -> after row is a measured row: bars of light on the row
 *   schematic  one plate per node in the chapter's order, its name etched, joined by a line of light that runs
 *              from the first node to the node being read (that node lit and near)
 *   measured   bars of light on the rows' lines, the before dim and the after bright, as long as the row's own bars
 *              (the template's --w, read from the page: no number typed here)
 *   list       a stack of thin plates, one per item, the item being read lifted toward the reader, lit, its number etched
 *              ((wave 6) a phone, past its band: a thread of light down the numbers' column, lit row by row; a
 *              schematic's too)
 *   the record the work's plate again, far back in the room and turned the other way: the shot ends on the plate it
 *              opened with ((wave 6) a phone too: in its band, a little smaller and further back)
 *   more       (wave 6) More work, the index of the nine, has the index's figure: a prism of cut glass in the free third,
 *              the room's shaft into it from above and one ray out of it to the row under the hand (or with focus), else
 *              the row being read; a phone: the prism alone, small, between the cued row's title and its verb
 * The bars and the counts are light on the rows (one formation, the chapter nearest the reading line); the plates stand
 * in the free third. No figure is a rectangle carrying a number: the page prints the numbers.
 *
 * WHERE. A wide screen: the chapter's text holds the left two thirds (case.css gives the free third to the figure); the
 * figure stands in that free third, held on the screen while its chapter holds the reading line (the middle of the
 * frame), rising in from below as the chapter arrives and leaving upward as it goes, deeper and softer: two figures never
 * share the frame (at most six plates). A phone: the figure stands in the free band case.css opens above each chapter's
 * index, smaller; with no band tall enough on screen there is no figure (the room alone). The bars ride their rows (a
 * phone: inside the rows' own strips).
 *
 * TEXT IS SACRED. The figure's place is measured from the page's own blocks (the chapter's column, read every 1.5 s,
 * never per frame) and every plate whose box on screen meets a block of text fades out until the text has passed.
 *
 * Composed in SCREEN px as the straight view sees them and placed for the case's travelling eye by a pure translation
 * (case.js caseEye): they draw where they were composed while the room moves behind them.
 */
import { etchCanvas } from "./etch.js";
import { lifted } from "./lift.js";
import { CASE } from "../case.js";

const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sm = (/** @type {number} */ e0, /** @type {number} */ e1, /** @type {number} */ x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
/** damped and settling exactly (a value that creeps by an ulp a frame keeps the stage awake) */
const ease = (/** @type {number} */ cur, /** @type {number} */ to, /** @type {number} */ dt, /** @type {number} */ tau, eps = 1e-3) => {
  const v = cur + (to - cur) * (1 - Math.exp(-dt / Math.max(tau, 1e-4)));
  return Math.abs(to - v) < eps ? to : v;
};
const persp = (/** @type {number} */ D, /** @type {number} */ z) => D / Math.max(D - z, 1);
const txt = (/** @type {Element | null | undefined} */ el) => (el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "");

/** (lane FIXCASES) what a fact's number counts, read from the page's own words: "21/49" is 21 lit of 49, "5" is 5,
 *  "48,000" (Italian "48.000") a mass of 48,000, "0" none; a value that is not a count ("4K") is null
 *  @param {string} s @returns {{ lit: number, of: number, mass: boolean } | null} */
export function countOf(s) {
  const t = String(s || "").replace(/[\s  ]/g, "");
  const m = /^(\d+)\/(\d+)$/.exec(t);
  if (m) { const a = +m[1], b = +m[2]; return a <= b && b <= 200 ? { lit: a, of: b, mass: false } : null; }
  if (/^\d{1,3}([.,'’]\d{3})+$/.test(t)) { const n = +t.replace(/\D/g, ""); return { lit: n, of: n, mass: true }; }
  if (/^\d+$/.test(t)) { const n = +t; return { lit: n, of: n, mass: n > 200 }; }
  return null;
}

/* ================================================================ the page's chapters, read every 1.5 s */
/** @type {{ key: string, t: number, chs: any[], blocks: any[], cue: number }} (cue: (wave 6) More work's row the prism
 *  stands by, kept by the figure for the next frame's keep) */
const LAY = { key: "", t: -1e9, chs: [], blocks: [], cue: -1 };

/** @param {any} c */
function layout(c) {
  // (the page too: on the Astro build the stage and its modules outlive a navigation)
  const key = c.vw + "x" + c.vh + location.pathname, t = c.time || 0;
  if (LAY.key === key && t - LAY.t < 1.5 && t >= LAY.t) return LAY;
  LAY.key = key; LAY.t = t;
  const sy = c.scrollY;
  const doc = (/** @type {Element} */ el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + sy, w: r.width, h: r.height }; };
  // a block's glyphs (a grid item is stretched to its row: the number's own box is the whole row's height)
  const glyph = (/** @type {Element} */ el) => { const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); return r.width > 1 ? { x: r.left, y: r.top + sy, w: r.width, h: r.height } : doc(el); };
  /** @type {any[]} */ const blocks = [];
  // (lane FIXCASES) the record is a chapter too: it has a figure on a wide screen
  // (wave 6, ROOMS) and More work: the index of the nine has the index's figure, the prism (a phone's record its plate)
  /** a row's number glyph and its words (the row's other children), for a phone's light under the number
   *  @param {Element} li */
  const numOf = (li) => { const n = li.querySelector(".t-acc"); return n ? glyph(n) : null; };
  const wordsOf = (/** @type {Element} */ li) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const e of li.children) { if (e.classList.contains("t-acc")) continue; const r = doc(e); if (r.w < 1 || r.h < 1) continue; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    return x1 > x0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  };
  LAY.chs = [...document.querySelectorAll("main[data-case] .cs-ch[data-ch], main[data-case] .cs-rec, main[data-case] .cs-more")].map((el, ci) => {
    const more = el.classList.contains("cs-more");
    const kind = el.getAttribute("data-ch") || (el.classList.contains("cs-rec") ? "rec" : more ? "more" : "");
    const folio = el.querySelector(".cs-folio"), body = el.querySelector(".cs-body");
    const rowsM = more ? [...el.querySelectorAll(".cs-more-list > li")] : [];
    // More work's rows as their glyphs (a row's box spans the screen: on a phone the prism stands between its title and
    // its verb, in the row itself)
    const own = more
      ? [folio ? glyph(folio) : null, ...rowsM.flatMap((li) => [...li.querySelectorAll(".t-acc, .cs-more-t, .cs-more-k, .cs-more-v")].map((e) => glyph(e)))].filter((r) => r && r.w > 1 && r.h > 1)
      : [folio, ...(body ? [...body.children] : [])].filter(Boolean).map((e) => doc(/** @type {Element} */ (e))).filter((r) => r.w > 1 && r.h > 1);
    blocks.push(...own);
    let right = 0;
    for (const r of own) right = Math.max(right, r.x + r.w);
    /** @type {any[]} */ let items = [], list = [];
    const lis = () => [...el.querySelectorAll(".cs-list > li")].map((li) => ({ r: doc(li), num: txt(li.querySelector(".t-acc")), n: numOf(li), t: wordsOf(li) }));
    const gl = (/** @type {Element} */ li, /** @type {string} */ s) => { const e = li.querySelector(s); return e ? glyph(e) : null; };
    if (more) items = rowsM.map((li) => ({ r: doc(li), n: gl(li, ".t-acc"), t: gl(li, ".cs-more-t"), k: gl(li, ".cs-more-k"), v: gl(li, ".cs-more-v"), el: li }));
    else if (kind === "schematic") items = [...el.querySelectorAll(".cs-node")].map((li) => ({ r: doc(li), name: txt(li.querySelector(".cs-node-t")), n: numOf(li), t: wordsOf(li) }));
    // (lane FIXCASES) a teaser's row is a measured row: its figure is the bars
    else if (kind === "measured" || kind === "teaser") items = [...el.querySelectorAll(".metric")].map((li) => {
      const strip = li.querySelector(".mx-bars");
      return { r: doc(li), strip: strip ? doc(strip) : null,
        bars: [...li.querySelectorAll(".mx-bars i")].map((i) => ({ w: clamp((parseFloat(/** @type {HTMLElement} */ (i).style.getPropertyValue("--w")) || 0) / 100), after: i.classList.contains("is-after") })) };
    });
    else if (kind === "list") items = lis();
    else if (kind === "facts") {
      // each fact: its number (what is counted, parsed from the page's own words), the number's box and the words' box
      items = [...el.querySelectorAll(".cs-fact")].map((li) => {
        const n = li.querySelector(".cs-fact-n"), t = n && n.nextElementSibling;
        return { r: doc(li), num: txt(n), count: countOf(txt(n)), n: n ? glyph(n) : null, t: t ? doc(t) : null };
      });
      // a facts chapter may close on a numbered list of its own (its figure: the list's stack)
      list = lis();
    }
    return { ci, kind, box: doc(el), folio: folio ? doc(folio) : null, own, right, items, list };
  });
  LAY.blocks = blocks;
  return LAY;
}

/** the visible text of the chapters as a few rects (one per column on screen), viewport px, for the room's keep
 *  @param {any} c @param {number} pad */
export function chapterKeep(c, pad = 14) {
  const L = layout(c), sy = c.scrollY, out = [];
  const add = (/** @type {any[]} */ rs) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of rs) {
      const y = r.y - sy;
      if (y + r.h < -40 || y > c.vh + 40) continue;
      x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w); y0 = Math.min(y0, y); y1 = Math.max(y1, y + r.h);
    }
    if (x1 > x0) out.push({ x: x0 - pad, y: Math.max(-40, y0 - pad), w: x1 - x0 + 2 * pad, h: Math.min(c.vh + 40, y1 + pad) - Math.max(-40, y0 - pad) });
  };
  for (const ch of L.chs) {
    // (lane FIXCASES) a phone's facts: each row's number and its words kept apart, so the count can stand under the
    // number, in the number's own column
    if (c.vw < 1024 && ch.kind === "facts" && ch.items.length) {
      const f0 = ch.items[0].r.y, last = ch.items[ch.items.length - 1], f1 = last.r.y + last.r.h;
      add(ch.own.filter((r) => r.y + r.h <= f0 + 2));
      for (const it of ch.items) { if (it.n) add([it.n]); if (it.t) add([it.t]); if (!it.n || !it.t) add([it.r]); }
      add(ch.own.filter((r) => r.y >= f1 - 2));
      continue;
    }
    // (wave 6, ROOMS) a phone's list and schematic past their band: the rows' words as one column, each number on its
    // own, so the light can stand under the number (the counts' place) between them
    if (c.vw < 1024 && (ch.kind === "list" || ch.kind === "schematic") && ch.items.length && ch.items[0].n) {
      const f0 = ch.items[0].r.y, last = ch.items[ch.items.length - 1], f1 = last.r.y + last.r.h;
      add(ch.own.filter((r) => r.y + r.h <= f0 + 2));
      add(ch.items.map((/** @type {any} */ it) => it.t || it.r));
      for (const it of ch.items) if (it.n) add([it.n]);
      add(ch.own.filter((r) => r.y >= f1 - 2));
      continue;
    }
    // (wave 6) a phone's More work: every row whole but the one the prism stands by (between its title and its verb)
    if (c.vw < 1024 && ch.kind === "more" && ch.items.length) {
      add(ch.own.filter((r) => r.y + r.h <= ch.items[0].r.y + 2));
      ch.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
        if (i !== LAY.cue || !it.t || !it.v) { add([it.r]); return; }
        add([it.n || it.t, it.t]); add([it.v]); if (it.k) add([it.k]);
      });
      continue;
    }
    // a phone's measured rows (a teaser's too): their words only (the bars are drawn in the strips under them)
    if (c.vw < 1024 && (ch.kind === "measured" || ch.kind === "teaser") && ch.items.length) {
      const list = ch.items[0].r, head = ch.own.filter((r) => r.y + r.h <= list.y + 2);
      add(head);
      for (const it of ch.items) {
        add([{ x: it.r.x, y: it.r.y, w: it.r.w, h: Math.max(8, (it.strip ? it.strip.y : it.r.y + it.r.h) - it.r.y - 3 - pad) }]);
        // a row's words under its strip (a note on a row too small to draw): kept clear as well
        if (it.strip) { const y0 = it.strip.y + it.strip.h + 3 + pad, h = it.r.y + it.r.h - y0; if (h > 10) add([{ x: it.r.x, y: y0, w: it.r.w, h }]); }
      }
      add(ch.own.filter((r) => r.y >= list.y + 2 && r.y > ch.items[ch.items.length - 1].r.y));
    } else add(ch.own);
  }
  add(L.blocks.slice(L.chs.reduce((n, ch) => n + ch.own.length, 0)));
  return out;
}

/* ================================================================ two formations: the bars, the line */
/** what the scene hands the formations every frame */
export const FIG = {
  // { key, kind: "bars", rows: [{ y, bars: [{ w, after }] }], len, phone, grow, near, rect }
  // or (lane FIXCASES) { key, kind: "tally", set, total, hi, ink, phone, near, rect }: a facts chapter's counts
  bars: /** @type {any} */ (null),
  line: /** @type {any} */ (null),   // { key, pts: [[x, y, z]], reveal, ink }
};

// (lane FIXCASES) room for two boards of a hundred units (sersan-io's two Lighthouse rows): 6,000 segments
const CAP = 12000, SEG = 10;
const BAR_SHARE = 0.2, BAR_INK = 0.34 * 0.085 / 0.24;
/** the bars as strands of short segments, sorted by their left end (a reveal sweeps them from the left), as
 *  evidence.js draws its sets @param {any} g */
function barSet(g) {
  /** @type {number[][]} */ const segs = [];
  const strand = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ y, /** @type {number} */ ink, /** @type {number} */ seg) => {
    const n = Math.max(1, Math.round((b - a) / seg)), d = (b - a) / n;
    for (let i = 0; i < n; i++) segs.push([a + i * d, a + (i + 1) * d, y, ink]);
  };
  const x0 = -g.len / 2;
  for (const r of g.rows) {
    if (r.bars.every((/** @type {any} */ b) => b.w < 0.03)) continue;
    if (!g.phone) strand(x0, x0 + g.len, r.y, 0.08 * 1.2 / 2.2, SEG * 1.2);
    const two = r.bars.length > 1;
    for (const b of r.bars) {
      const len = g.len * b.w, oy = two ? (b.after ? 1 : -1) * (g.phone ? 3 : 5) : 0;
      const n = b.after ? (g.phone ? 3 : 4) : 2, ink = b.after ? 1 : (g.phone ? 0.34 : 0.3), sk = ink < 0.5 ? 0.6 : 1;
      for (let k = 0; k < n; k++) strand(x0, x0 + len, r.y + oy + (k - (n - 1) / 2) * (g.phone ? 1 : 1.1), ink * sk, SEG * sk);
    }
  }
  segs.sort((p, q) => p[0] - q[0]);
  const n = Math.max(1, Math.min(CAP / 2, segs.length)), d = new Float32Array(n * 8);
  if (!segs.length) { d[0] = d[4] = x0; }
  else for (let i = 0; i < n; i++) { const [a, b, y, ink] = segs[i]; d.set([a, y, 0, ink, b, y, 0, ink], i * 8); }
  return { data: d, path: 2, closed: false, used: n * 2 };
}

/* (lane FIXCASES) THE COUNT. A fact's number as units of light, one per thing counted: rows of ten short blades (a
   phone: five), the units of "a of b" past a dim; thousands as a fine field of dots, one per hundred (a phone: per five
   hundred); zero as an empty rule. Every segment is about SEGL long (the stage gives each segment the same share of
   particles: equal lengths are equal light), a dot's ink is its length's share. Written in the order the units are
   counted (row by row, unit by unit), so a reveal of the prefix is the count. */
const SEGL = 8;
/** @param {number[][]} segs @param {number} a @param {number} b @param {number} y @param {number} ink */
function run(segs, a, b, y, ink) {
  const n = Math.max(1, Math.round((b - a) / SEGL)), d = (b - a) / n;
  for (let i = 0; i < n; i++) segs.push([a + i * d, a + (i + 1) * d, y, ink]);
}
/** @param {{ rows: any[], cx: number, cy: number, phone: boolean }} g
 *  @returns {{ set: any, ends: number[], total: number, len: number }} */
function tallySet(g) {
  /** @type {number[][]} */ const segs = [];
  /** @type {number[]} */ const ends = [];
  const ph = g.phone;
  for (const r of g.rows) {
    const k = r && r.count;
    if (r && r.thread) {
      // (wave 6, ROOMS) a phone's list or schematic: a thread down the number's column, two close strands, written from
      // the top (a reveal of the prefix draws it down the row)
      const n = Math.max(1, Math.round(r.h / SEGL)), d = r.h / n, x = r.x + 1 - g.cx;
      for (let i = 0; i < n; i++) segs.push([x, r.y + i * d - g.cy, x, r.y + (i + 1) * d - g.cy, i && i < n - 1 ? 1 : 0.45]);
    } else if (k && k.mass) {
      // a fine field on a square pitch (a pitch squeezed in one direction read as columns: rain, a barcode)
      const pitch = ph ? 7 : 9, per = Math.max(4, Math.floor(r.w / pitch)), n = Math.max(1, Math.min(1600, Math.round(k.of / (ph ? 1000 : 200))));
      for (let i = 0; i < n; i++) {
        const x = r.x + ((i % per) + 0.5) * pitch - g.cx, y = r.y + Math.floor(i / per) * pitch - g.cy;
        segs.push([x - 1, x + 1, y, 0.5]);
      }
    } else if (k && k.of === 0) {
      run(segs, r.x - g.cx, r.x + r.w * (ph ? 1 : 0.5) - g.cx, r.y - g.cy, 0.3);
    } else if (k) {
      // (a board of many units is drawn finer; one that does not fit its row at the usual size becomes a compact
      // square of small marks: the hundred of a full score stretched across the third read as a lit panel)
      let per = r.per, st = k.of > 40 ? 2 : ph ? 3 : 4, gap = ph ? 4 : Math.max(8, Math.min(14, r.w * 0.026));
      let u = (r.w - (per - 1) * gap) / per, lines = Math.ceil(k.of / per);
      let lp = Math.max(st * 1.1 + (ph ? 4 : 6), Math.min(ph ? 11 : 18, r.h / Math.max(1, lines)));
      if (lines > 1 && (lines * (st * 1.1 + (ph ? 4 : 6)) > r.h || (!ph && lines > 5))) {
        per = 10; lines = Math.ceil(k.of / per);
        lp = Math.max(4, Math.min(12, r.h / lines, r.w / per));
        u = lp * 0.62; gap = lp - u; st = lp >= 9 ? 2 : 1;
      }
      for (let i = 0; i < k.of; i++) {
        const x = r.x + (i % per) * (u + gap) - g.cx, y = r.y + Math.floor(i / per) * lp - g.cy;
        // the units past "a of b" stay dim: the releases he did not manage, the rest of the forty-nine
        const ink = i < k.lit ? 1 : 0.26;
        for (let s = 0; s < st; s++) run(segs, x, x + u, y + (s - (st - 1) / 2) * 1.1, ink);
      }
    }
    ends.push(Math.min(CAP / 2, segs.length));
  }
  const n = Math.max(1, Math.min(CAP / 2, segs.length)), d = new Float32Array(n * 8);
  for (let i = 0; i < Math.min(n, segs.length); i++) {
    const q = segs[i];
    // ((wave 6) a thread's segment is [x0, y0, x1, y1, ink]; a count's [a, b, y, ink] runs along its row)
    if (q.length === 5) d.set([q[0], q[1], 0, q[4], q[2], q[3], 0, q[4]], i * 8);
    else { const [a, b, y, ink] = q; d.set([a, y, 0, ink, b, y, 0, ink], i * 8); }
  }
  // (each segment gets the same share of the particles: the light per px goes as the number of segments)
  return { set: { data: d, path: 2, closed: false, used: n * 2 }, ends, total: n, len: n * SEGL };
}

export const barsDef = {
  share: BAR_SHARE, fill: 1, fit: "px", capacity: CAP, carry: 1, emit: 0,
  targets: () => ({ data: new Float32Array(CAP * 4), path: 0, closed: false }),
  look: { ink: BAR_INK, size: 0.95, mistInk: 0, mistSize: 1 },
  motion: { spring: 9, speed: 1400, inertia: 0.06, fuzz: 0 },
  flow: { amp: 0, wavelength: 200, evolution: 0.05, z: 0 },
  respond: { hand: 0, wind: 0, fadeIn: 2.6, fadeOut: 3.2 },
  tails: { share: 0, length: 40, emitters: 40 },
  /** @param {any} c */
  update(c) {
    const g = FIG.bars, s = c.state;
    if (!g) return { reveal: [0, -0.05, 0] };
    if (s.key !== g.key) { s.key = g.key; c.setTargets(g.kind === "tally" ? g.set : barSet(g)); }
    if (g.kind === "tally") {
      // the count: the units revealed in the order they are counted (the set is written in that order)
      const hi = g.hi > 0.0005 ? Math.min(1.001, g.hi) : -0.05;
      return { reveal: [0, hi, 0.5 / Math.max(1, g.total)], look: { ink: BAR_INK * g.ink * (g.phone ? 1.45 : 1), size: g.phone ? 0.85 : 0.95 } };
    }
    const hi = g.grow > 0.001 ? clamp(g.grow * 1.02) : -0.05;
    return { reveal: [0, hi, 0.012], look: { ink: BAR_INK * (g.phone ? 1.45 : 1), size: g.phone ? 0.85 : 0.95 } };
  },
};

const PER = 2400;
export const lineDef = {
  share: 0.16, fill: 1, fit: "px", emit: 0, capacity: PER, carry: 1, inkArea: 10000,
  targets: (/** @type {any} */ H) => H.polyline([[-100, 0, 0, 1], [100, 0, 0, 1]], PER),
  // (a thin, tight thread, white at its core: wide and loose it read through the glass as a blue smear)
  look: { ink: 0.15, size: 0.68, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3.4, speed: 1600, inertia: 0.25, fuzz: 0.45 },
  flow: { amp: 0.5, wavelength: 300, evolution: 0.05, z: 0.15 },
  respond: { hand: 0.25, wind: 0.12, fadeIn: 0.9, fadeOut: 1.1 },
  tails: { share: 0, length: 60, emitters: 60 },
  /** @param {any} c */
  update(c) {
    const g = FIG.line, s = c.state;
    if (!g) return { reveal: [0, -0.05, 0] };
    if (s.key !== g.key) { s.key = g.key; c.setTargets(c.H.polyline(g.pts, PER)); }
    // the light runs along the line, toward the node being read
    return { reveal: g.reveal, offset: [0, 0, g.z || 0], shift: (c.time || 0) * 30, ink: g.ink, ...(g.phone ? { look: { size: 0.5 } } : {}) };
  },
};

/* ================================================================ the figures */
/** a capture's or the key words' plate: what the opener holds (case.js shares it; a page restored lower down, where the
 *  opener never drew, asks for its own copy) @param {any} c @param {any} S */
function workPlate(c, S) {
  if (!S.wp) {
    const sec = document.querySelector('[data-stage="case"]');
    const img = sec && sec.querySelector("img[data-slab]"), words = sec && sec.querySelector("[data-slab-words]");
    S.wp = { slug: img ? img.getAttribute("data-slab") : null, words: words ? { fig: txt(words.querySelector(".cs-plate-fig")), line: txt(words.querySelector(".cs-plate-line")) } : null, etch: null };
  }
  const W = S.wp;
  if (W.words) {
    if (CASE.etch) return { etch: CASE.etch, asp: 4 / 3, words: true };
    if (!W.etch && (!document.fonts || document.fonts.check('800 100px "Sofia Sans Extra Condensed"'))) W.etch = c.texture("wp-etch", etchCanvas(W.words.fig, W.words.line));
    return W.etch ? { etch: W.etch, asp: 4 / 3, words: true } : null;
  }
  if (CASE.tex) return { tex: CASE.tex, asp: CASE.asp || 16 / 10, words: false };
  const im = W.slug ? c.imgs[W.slug] : null;
  if (!im || !im.tex) return null;
  return { tex: lifted(c, "mist", W.slug, im) || im.tex, asp: im.aspect || 16 / 10, words: false };
}

/** the item being read: the one whose middle is nearest the middle of the frame @param {any[]} items @param {number} sy @param {number} Y */
function reading(items, sy, Y) {
  let best = 0, bd = 1e9;
  items.forEach((it, i) => { const d = Math.abs(it.r.y - sy + it.r.h / 2 - Y); if (d < bd) { bd = d; best = i; } });
  return best;
}
/** the same, continuous: i at item i's middle, between two items the share of the way from one middle to the next
 *  @param {any[]} items @param {number} sy @param {number} Y */
function readingT(items, sy, Y) {
  const m = items.map((it) => it.r.y - sy + it.r.h / 2);
  if (Y <= m[0]) return 0;
  for (let i = 0; i < m.length - 1; i++) if (Y < m[i + 1]) return i + (Y - m[i]) / Math.max(1, m[i + 1] - m[i]);
  return m.length - 1;
}

/** a name split into a few etched lines (at most about 13 characters a line) @param {string} s */
function etchLines(s) {
  const out = [];
  let cur = "";
  for (const w of s.toUpperCase().split(/\s+/)) { const t = cur ? cur + " " + w : w; if (t.length > 13 && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur);
  return out.slice(0, 3);
}

const FACE = '"Sofia Sans Extra Condensed", "Barlow Condensed", sans-serif';
/** a texture of the figure's own: drawn once the display face is in, handed to the stage until it holds it
 *  @param {any} c @param {any} S @param {string} id @param {() => HTMLCanvasElement} draw @returns {string | null} */
function made(c, S, id, draw) {
  const M = S.made || (S.made = {});
  if (typeof M[id] === "string") return M[id];
  if (document.fonts && !document.fonts.check(`800 100px ${FACE}`)) return null;
  const cv = M[id] || (M[id] = draw());
  const t = c.texture(id, cv);
  if (t) M[id] = t;
  return t || null;
}

/** a node's name etched for the column: capitals in the display face, set from a quarter of the plate's width, so the
 *  left margin stays clear for the line of light behind the glass
 *  @param {string[]} lines @param {number} w @param {number} h */
function nameEtch(lines, w, h) {
  const s = 3, cv = document.createElement("canvas");
  cv.width = Math.round(w * s); cv.height = Math.round(h * s);
  const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d"));
  g.scale(s, s); g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
  const L = lines.filter(Boolean), x0 = w * 0.24, inner = w * 0.68;
  if (!L.length) return cv;
  g.font = `800 100px ${FACE}`;
  const fit = Math.min(...L.map((l) => (100 * inner) / Math.max(1, g.measureText(l).width)));
  const size = Math.min(fit, (h * 0.66) / (L.length * 0.9), h * 0.36);
  g.font = `800 ${size}px ${FACE}`;
  const lh = size * 0.9;
  let y = (h - lh * L.length) / 2 + size * 0.8;
  for (const l of L) { g.fillText(l, x0, y); y += lh; }
  return cv;
}

/**
 * The chapters' figure for this frame.
 * @param {any} c the mist scene's ctx
 * @param {{ d: number[], D: number, pos: number[] }} EYE the case's eye (case.js caseEye)
 * @returns {{ slabs: any[], swarm: any[], subject: any, pivot: number[] | null, keep: any[], orbit: number, p: number, barsNear: boolean, passes: any }}
 */
export function chapterFigures(c, EYE) {
  const S = c.state.fig || (c.state.fig = { av: 0, ci: -1, swap: 0, hide: {}, grow: 0, keyEtch: {} });
  const vw = c.vw, vh = c.vh, sy = c.scrollY, dt = Math.min(c.dt || 0, 0.1), phone = vw < 1024, D = EYE.D;
  const L = layout(c);
  const keep = chapterKeep(c);
  /** @type {any[]} */ const slabs = [], swarm = [];
  /** @type {any} */ let passes = null;
  FIG.line = null;
  if (S.hdrKey !== vw + "x" + vh) {
    S.hdrKey = vw + "x" + vh;
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const hv = getComputedStyle(document.documentElement).getPropertyValue("--hdr").trim();
    S.hdr = hv.endsWith("rem") ? parseFloat(hv) * fs : parseFloat(hv) || (phone ? 64 : 72);
  }
  const HDR = S.hdr, Y = vh * 0.5;
  // ------------------------------------------------ which chapter holds the frame, how much, and where its figure stands
  let ch = null, p = 0, dir = 1, R = null;
  for (const k of L.chs) {
    const top = k.box.y - sy, bot = top + k.box.h;
    if (!phone) {
      // (a short hand-over: with a wide one the free third stood empty for half a screen between two chapters)
      const q = sm(-0.02 * vh, 0.16 * vh, Y - top) * sm(-0.02 * vh, 0.16 * vh, bot - Y);
      if (q > p) {
        p = q; ch = k; dir = Y - top < bot - Y ? 1 : -1;
        const x0 = k.right + Math.max(56, vw * 0.04), x1 = vw - Math.max(32, vw * 0.03);
        R = { x: x0, y: HDR + 28, w: x1 - x0, h: vh - HDR - 28 - 36 };
      }
    } else if (k.kind === "more") {
      // (wave 6, ROOMS) a phone's More work: its prism stands in the rows (by the row being read) while they hold the frame
      const q = sm(-0.02 * vh, 0.16 * vh, Y - top) * sm(-0.02 * vh, 0.16 * vh, bot - Y);
      if (q > p) { p = q; ch = k; dir = 1; R = { x: 0, y: HDR, w: vw, h: vh - HDR }; }
    } else if (k.folio && (k.kind === "what" || k.kind === "schematic" || k.kind === "list" || k.kind === "rec")) {
      // ((wave 6) the record too: its band holds the work's plate again)
      // a phone: the band above the chapter's index (case.css opens it; the measured rows, a teaser's and the facts'
      // carry their light on the rows themselves). The figure stands in the WHOLE band and rides with the page (its
      // size and its line never change with the scroll); it is there while enough of the band is on screen
      const f0 = top + 24, f1 = k.folio.y - sy - 18;
      const bh = Math.min(f1, vh - 12) - Math.max(f0, HDR + 10);
      const q = sm(170, 260, bh);
      if (q > p) { p = q; ch = k; dir = 1; R = { x: 18, y: f0, w: vw - 36, h: f1 - f0 }; }
    }
  }
  if (R && (R.w < 240 || R.h < 150)) p = 0;
  // the bars and the counts: on their rows whatever the figure does (a phone: in the rows' strips, under the numbers)
  rowsFor(c, L, S, EYE, phone, dt);
  if (!ch || !R || p < 0.004) { S.ci = -1; LAY.cue = -1; return { slabs, swarm: barsSwarm(), subject: null, pivot: null, keep, orbit: 1, p: 0, barsNear: !!(FIG.bars && FIG.bars.near), passes }; }
  // (lane FIXCASES) a facts chapter's own list: while its rows hold the reading line, the figure is the list's stack
  const own = ch.list || [];
  const inList = ch.kind === "facts" && own.length > 0 && reading([...ch.items, ...own], sy, Y) >= ch.items.length;
  const kind = inList ? "list" : ch.kind, items = inList ? own : ch.items;
  if (kind !== "more") LAY.cue = -1;
  // the item being read: the row nearest the middle of the frame (a phone too: the band stands above the chapter's
  // text, so while it is on screen that is the chapter's first row; the critic saw the last one there), the nodes of a
  // phone's schematic sliding by continuously
  const nI = items.length;
  const flow = phone && kind === "schematic";
  const aT = !nI ? 0 : flow ? readingT(items, sy, Y) : reading(items, sy, Y);
  const a = Math.round(aT);
  const ck = ch.ci + (inList ? ":l" : "");
  if (S.ci !== ck) { S.ci = ck; S.av = aT; }
  if (dt > 0) S.av = ease(S.av, aT, dt, flow ? 0.12 : 0.22);
  if (S.lastA !== a + ":" + ck) { if (S.lastA != null && !flow) S.swap = 1; S.lastA = a + ":" + ck; }
  if (dt > 0) S.swap *= Math.exp(-dt / 0.25);
  if (S.swap < 1e-3) S.swap = 0;

  // ------------------------------------------------ the arrival and the leaving: from below and back, up and back
  const ex = vw / 2, ey = vh / 2, Cp = EYE.pos;
  const shiftY = dir * (1 - p) * (phone ? 0.08 : 0.16) * vh, push = -(1 - p) * 320;
  /** screen pose -> a slab in the room (pure translation for the eye)
   *  @param {any} P { X, Y, z, sw, sh } */
  const place = (P) => {
    const z = P.z + push, s = persp(D, z), dP = D - z;
    return { cx: Cp[0] + ((P.X - ex) * dP) / D, cy: Cp[1] + ((P.Y + shiftY - ey) * dP) / D, cz: Cp[2] - dP, w: P.sw / s, h: P.sh / s };
  };
  /** a plate fades while its box on screen meets a block of text (until the text has passed)
   *  @param {string} id @param {any} P @param {number} hwK @param {number} hhK */
  const clearOf = (id, P, hwK, hhK) => {
    const hw = (P.sw * hwK) / 2 + 16, hh = (P.sh * hhK) / 2 + 16, X = P.X, Yc = P.Y + shiftY;
    let hit = 0;
    for (const r of L.blocks) {
      const ty = r.y - sy;
      if (ty > vh || ty + r.h < 0) continue;
      const ix = Math.min(X + hw, r.x + r.w + 12) - Math.max(X - hw, r.x - 12), iy = Math.min(Yc + hh, ty + r.h + 12) - Math.max(Yc - hh, ty - 12);
      if (ix > 0 && iy > 0) { hit = 1; break; }
    }
    const h0 = S.hide[id] ?? hit;
    S.hide[id] = dt > 0 ? ease(h0, hit, dt, hit > h0 ? 0.04 : 0.12) : hit;
    return 1 - Math.max(hit, S.hide[id]);
  };
  const Xc = R.x + R.w / 2, Yc = R.y + R.h / 2;
  const through = clamp((Y - (ch.box.y - sy)) / Math.max(1, ch.box.h));
  let subj = { X: Xc, Y: Yc, z: -150, w: R.w * 0.7, h: R.h * 0.6 };
  const soft = mix(0.45, 1, p);

  if (kind === "what" || kind === "rec") {
    // ------------------------------------------------ the work's plate. (lane FIXCASES) At the room's scale: on a wide
    // screen about one and a half times the free third, deep in the room, turned so that its far edge runs past the
    // frame (a wall of glass, not a card beside a paragraph); its near edge keeps clear of the text. The record: the same
    // plate further back, turned the other way and softer: the shot ends on the plate it opened with
    const rec = kind === "rec";
    const look = workPlate(c, S);
    const asp = look ? look.asp : 16 / 10, words = !!(look && look.words);
    // ((wave 6, ROOMS) a phone's record: the plate again in its band, a little smaller, further back, turned the other way)
    const sw = phone ? Math.min(R.w * 0.86, R.h * 0.86 * asp) * (rec ? 0.82 : 1) : rec ? Math.min(R.w * 1.15, R.h * 0.6 * asp, 900) : Math.min(R.w * 1.5, R.h * 0.8 * asp, 1150);
    const inset = Math.max(6, sw * 0.035), sh = words ? sw * 0.75 : (sw - 2 * inset) / asp + 2 * inset;
    // turned some thirty degrees, turning a little as the chapter is read
    const yaw = rec ? (phone ? 0.4 : 0.5) - 0.1 * (through - 0.5) : phone ? -0.44 + 0.12 * (through - 0.5) : -0.5 + 0.12 * (through - 0.5);
    const half = (sw * Math.abs(Math.cos(yaw)) * 1.06) / 2;
    const P = { X: phone ? Xc : R.x + (rec ? 40 : 16) + half, Y: Yc, z: phone ? (rec ? -300 : -170) : rec ? -640 : -380, sw, sh };
    const alpha = p * (rec ? 0.85 : 1) * clearOf(rec ? "rec" : "plate", P, Math.abs(Math.cos(yaw)) * 1.06, 1);
    if (alpha > 0.005 && look) {
      slabs.push({
        id: rec ? "rec" : "fig", ...place(P), yaw, pitch: 0.035, roll: 0, t: phone ? 26 : 44,
        tex: words ? null : look.tex, etch: words ? look.etch : undefined,
        inset: words ? undefined : inset / persp(D, P.z + push),
        alpha, glow: clamp((words ? 0.9 : 0.6) * (rec ? 0.75 : 1) + 0.3 * S.swap), sharp: soft * (1 - 0.45 * S.swap) * (rec ? 0.8 : 0.97),
        bevel: words ? 4.5 : 3.5, edge: words ? 0.55 : 0.34, sheen: words ? 0.05 : 0.14,
      });
    }
    subj = { X: P.X, Y: Yc, z: P.z, w: sw, h: sh };
  } else if (kind === "facts" || kind === "teaser" || kind === "measured") {
    // ------------------------------------------------ (lane FIXCASES) light on the rows (rowsFor), no plate: the room's
    // light stands behind the row being read
    const it = items[Math.max(0, Math.min(nI - 1, a))];
    const ry = it ? (it.n ? it.n.y + it.n.h / 2 : it.r.y + 30) - sy : Yc;
    subj = { X: Xc, Y: clamp(ry + 60, R.y + 80, R.y + R.h - 80), z: -260, w: R.w * 0.9, h: Math.min(R.h * 0.5, 320) };
  } else if (kind === "schematic") {
    // ------------------------------------------------ the flow: a plate per node, a line of light through them
    // ONE COLUMN, ONE LINE. The nodes stand one under the other in the chapter's order, each a step to the right and
    // deeper than the last; a straight line of light is threaded down through the plates' left margins, BEHIND the
    // glass (every plate bends it), lit from above the first node to the node being read. (A zigzag through the plates'
    // middles read as a lightning stroke and crossed the names out; a line beside the plates ran through nothing; on a
    // phone a row with the line under it read as a horizon.) A wide screen shows every node; a phone's band shows the
    // node being read, the plates sliding along the line as the reader moves on.
    const n = Math.max(1, items.length);
    /** @type {any[]} */ const nodes = [];
    const pitch = phone ? Math.min(R.h * 0.36, 140) : R.h / n;
    // (lane FIXCASES) at the room's scale: on a wide screen the plates about 1.4 times wider than before (210 px at
    // 1440 read as labels) and the column stepping further back into the room
    const ph = phone ? pitch / 1.15 : Math.min(pitch * 0.86, 190), pw = Math.min(R.w * (phone ? 0.62 : 0.8), phone ? ph / 0.56 : ph * 2.5);
    const dx = Math.min(phone ? 26 : (R.w - pw - 40) / Math.max(1, n - 1), pitch / 5);
    const X0 = phone ? Xc : R.x + (R.w - pw - (n - 1) * dx) / 2 + pw / 2, Y0 = phone ? Yc : R.y + pitch * 0.5;
    const mrg = pw * 0.13, tk = phone ? 14 : 20;
    /** the column at s nodes from its head (a phone: from the node being read) @param {number} s */
    const col = (s) => ({ X: X0 + s * dx, Y: Y0 + s * pitch, z: phone ? -60 - 40 * (clamp(s, -1.5, 1.5) + 1.5) : -100 - 55 * s });
    for (let i = 0; i < n; i++) nodes.push({ ...col(phone ? i - S.av : i), sw: pw, sh: ph, yaw: -0.3 + 0.05 * Math.sin(i * 1.9) });
    let drawn = 0;
    nodes.forEach((N, i) => {
      const lit = clamp(1 - Math.abs(i - S.av)), read = i <= S.av + 0.5 ? 1 : 0.55;
      const P = { ...N, z: N.z + 90 * lit };
      if (phone && Math.abs(i - S.av) > 1) return;
      const alpha = p * read * (phone ? 1 - sm(0.45, 0.95, Math.abs(i - S.av)) : 1) * clearOf("n" + i, P, Math.cos(N.yaw), 1);
      if (alpha < 0.005 || drawn >= 6) return;
      drawn++;
      const name = items[i] ? items[i].name : "";
      const etch = name ? made(c, S, "n" + ch.ci + "-" + i + "-" + Math.round(pw), () => nameEtch(etchLines(name), pw, ph)) : null;
      slabs.push({
        id: "n" + i, ...place(P), yaw: N.yaw, pitch: 0.05, roll: 0.02 * Math.sin(i * 2.7), t: tk,
        tex: null, etch: etch || undefined, bevel: phone ? 4 : 6, sheen: 0.4, tint: 0.2,
        alpha, glow: clamp(0.3 + 0.7 * lit), sharp: soft * (0.86 + 0.14 * lit),
      });
    });
    // the line: the column's own straight run, a little behind the plates, in the rect's local px (a pure translation
    // of the figure; placed at rest, without the arrival's shift and push, so the targets hold still while the figure
    // arrives: the shift moves the rect, the push is the formation's offset). The plates slide along it on a phone, so
    // its targets never change with the reading.
    const rest = (/** @type {any} */ P) => { const dP = D - P.z; return [Cp[0] + ((P.X - ex) * dP) / D, Cp[1] + ((P.Y - ey) * dP) / D, Cp[2] - dP]; };
    const r0 = rest({ X: Xc, Y: Yc, z: 0 });
    const ref = { cx: r0[0], cy: r0[1] + shiftY };
    const back = tk / 2 + 0.3 * pw * 0.5 + 10;
    // a wide screen: from a little above the first node to a little under the last; a phone: the band's own height
    const sA = phone ? -(R.h * 0.5 - 12) / pitch : -0.45, sB = phone ? (R.h * 0.5 - 12) / pitch : n - 1 + 0.45;
    /** @type {number[][]} */ const pts = [];
    const cuts = Math.max(2, Math.ceil((sB - sA) * 2));
    for (let k = 0; k <= cuts; k++) {
      const s = sA + ((sB - sA) * k) / cuts, q = col(s);
      const w = rest({ X: q.X - pw * 0.5 + mrg, Y: q.Y, z: q.z - back });
      pts.push([w[0] - r0[0], w[1] - r0[1], w[2], k === 0 ? 0.35 : 1]);
    }
    const key = ch.ci + ":" + (phone ? "p" : "d") + pts.map((q) => q.slice(0, 3).map(Math.round).join(",")).join(";");
    // lit down to the node being read and through its plate (a phone: the read node stands at the band's middle)
    const hiN = clamp(((phone ? 0 : S.av) + 0.5 - sA) / (sB - sA));
    // (lane FIXCASES) quieter: the critic saw the line as the strongest thing in the frame, on a phone by far (there,
    // behind a single plate and out of focus, it read as a soft blue streak: a thin thread at a fifth of its light)
    FIG.line = { key, pts, reveal: [0, hiN, 0.04], ink: (c.inkK || 1) * (phone ? 0.1 : 0.4) * p, z: push, phone };
    swarm.push({ id: "line", weight: p, rect: { x: ref.cx - 50, y: ref.cy - 50, w: 100, h: 100 } });
    const lit = nodes[Math.round(clamp(S.av, 0, n - 1))];
    if (lit) subj = { X: lit.X, Y: lit.Y, z: lit.z, w: lit.sw * 1.6, h: R.h * 0.6 };
  } else if (kind === "list") {
    // ------------------------------------------------ the stack: thin plates lying one over the other, seen from three
    // quarters; the item being read lifts out toward the reader, lit, its number etched
    const n = Math.max(1, items.length);
    // (lane FIXCASES) inside a facts chapter the stack comes in with the list's own rows
    const pl = inList ? sm(-0.02 * vh, 0.16 * vh, Y - (items[0].r.y - sy - 0.08 * vh)) : 1;
    const lw = phone ? Math.min(R.w * 0.62, R.h * 0.9) : Math.min(R.w * 0.82, 480), ld = lw * 0.6;
    const gap = phone ? Math.min(26, (R.h * 0.4) / n) : Math.min(58, (R.h * 0.52) / n);
    const pitch = 0.98, yaw = -0.5;
    let drawn = 0;
    for (let i = 0; i < n && drawn < 6; i++) {
      const d = i - S.av, lit = clamp(1 - Math.abs(d));
      // (lane FIXCASES) the whole stack: a list has at most six items, so it no longer thins to two plates at its ends
      // (a longer one would keep the six nearest the item being read)
      const far = n <= 6 ? 1 : 1 - sm(2.4, 3.2, Math.abs(d));
      if (far < 0.01) continue;
      const part = Math.sign(d) * Math.min(1, Math.abs(d)) * gap * 0.45;
      // the plate being read lifts toward the reader and a little to the RIGHT, away from the text (it moved left, its
      // box met the text's column and the very plate being read hid itself: the critic's "nothing lit")
      const P = { X: Xc + 0.05 * lw * lit, Y: Yc + (i - (n - 1) / 2) * gap + part - 0.25 * gap * lit, z: -140 + 150 * lit, sw: lw, sh: ld };
      const alpha = p * pl * far * clearOf("l" + i, P, Math.abs(Math.cos(yaw)) + 0.2, Math.abs(Math.cos(pitch)) + 0.3);
      if (alpha < 0.005) continue;
      drawn++;
      const num = items[i] ? items[i].num : "";
      // its number etched: full in the layer being read, faint in the others (two textures, as About's stack)
      const strong = lit > 0.5;
      const etch = num ? c.etch((strong ? "l" : "lf") + ch.ci + "-" + i, [num], { w: Math.round(lw), h: Math.round(ld), pad: lw * 0.12, colour: strong ? "#ffffff" : "rgba(255,255,255,0.2)" }) : null;
      slabs.push({
        id: "l" + i, ...place(P), yaw, pitch, roll: 0, t: phone ? 8 : 14,
        tex: null, etch: etch || undefined, bevel: phone ? 3 : 4, sheen: 0.22 + 0.1 * lit, edge: (phone ? 0.16 : 0.22) + 0.3 * lit,
        alpha, glow: clamp(0.5 + 0.5 * lit), sharp: soft * (0.82 + 0.18 * lit),
      });
    }
    subj = { X: Xc, Y: Yc, z: -100, w: lw * 1.2, h: R.h * 0.6 };
  } else if (kind === "more" && nI) {
    // ------------------------------------------------ (wave 6, ROOMS) MORE WORK, the index of the nine, has the index's
    // figure (the cover's): a prism of cut glass in the free third (a phone: small, in the row by the row being read,
    // between its title and its verb), the room's shaft coming into it from above and ONE ray leaving it toward the
    // row under the hand (or with the keyboard's focus), else the row being read: the light points where the reader can
    // go next. The prism bends the room behind it (the shaft, the wall's grid, the chips). No plate carries a word.
    let cue = -1;
    const ae = document.activeElement;
    items.forEach((it, i) => { if (ae && it.el && it.el.contains(ae)) cue = i; });
    const hov = !phone && c.pointer && c.pointer.present;
    if (cue < 0 && hov) items.forEach((it, i) => { const ty = it.r.y - sy; if (c.pointer.y >= ty && c.pointer.y <= ty + it.r.h && c.pointer.x <= ch.right + 32) cue = i; });
    const handed = cue >= 0;
    if (cue < 0) cue = reading(items, sy, Y);
    // a phone: the prism stands by one row at a time; when the cue moves on it fades where it is and comes back by the
    // new row (0.2 s each way), never sliding over the words between them
    if (S.mAt == null || S.mAt >= nI) { S.mAt = cue; S.mf = 1; }
    if (!phone) { S.mAt = cue; S.mf = 1; }
    else if (S.mAt !== cue) { S.mf = Math.max(0, S.mf - dt / 0.2); if (S.mf <= 0) S.mAt = cue; }
    else S.mf = Math.min(1, S.mf + dt / 0.2);
    LAY.cue = phone ? S.mAt : -1;
    const it = items[S.mAt], v = it.v || it.r, ty = (it.t || it.r);
    // the cued row's line (its verb's middle), damped: the ray swings to a row in about a quarter of a second
    const ry = v.y - sy + v.h / 2;
    S.mY = S.mY == null || dt <= 0 || phone ? ry : ease(S.mY, ry, dt, 0.08, 0.25);
    // the hand turns the prism a few degrees (damped, settling exactly)
    const hand = hov ? clamp(c.pointer.nx ?? 0, -1, 1) : 0;
    S.hy = S.hy == null || dt <= 0 ? hand : ease(S.hy, hand, dt, 0.5, 1e-4);
    /** @type {any} */ let P = null, ok = 1;
    if (!phone) {
      const T = Math.min(vh * 0.34, R.w * 0.46);
      // at the reading line, a third of the way toward the cued row (the ray stays near level)
      P = { X: R.x + R.w * 0.36, Y: clamp(mix(Yc, S.mY, 0.35), R.y + T * 0.7, R.y + R.h - T * 0.7), z: -0.1 * D, sw: T, sh: T * 0.75 };
    } else {
      // a phone: in the middle of the gap between the cued row's title and its verb, on the title's line, 8 px clear of
      // the row's own glyphs (its words below may run under the gap: the prism keeps to the title's line); a row with
      // no room for it has none
      const gx0 = ty.x + ty.w + 10, gx1 = (it.v ? it.v.x : vw - 18) - 10;
      // (seated a little above the title's middle: a kicker longer than the title runs under the gap)
      const T = Math.min(ty.h * 1.05, (gx1 - gx0) * 0.7, 56), X = (gx0 + gx1) / 2, Yt = ty.y - sy + ty.h * 0.5 - 0.12 * T;
      const bx = [X - T * 0.6, Yt - T * 0.45, X + T * 0.6, Yt + T * 0.45];
      const hit = [it.n, it.t, it.k, it.v].some((r) => { const m = r === it.k ? 3 : 6; return r && r.x - 8 < bx[2] && r.x + r.w + 8 > bx[0] && r.y - sy - m < bx[3] && r.y - sy + r.h + m > bx[1]; });
      ok = T >= 24 && !hit ? 1 : 0;
      P = { X, Y: Yt, z: -0.06 * D, sw: Math.max(T, 1), sh: Math.max(T, 1) * 0.8 };
    }
    const kP = place(P), T = P.sw;
    const alpha = p * S.mf * ok * (phone ? 1 : clearOf("prism", P, 1.15, 1.2));
    if (alpha > 0.005) {
      slabs.push({
        id: "prism", shape: "prism", inset: -1, cx: kP.cx, cy: kP.cy, cz: kP.cz,
        yaw: Math.round((0.42 + 0.09 * S.hy + 0.12 * (through - 0.5)) * 1e4) / 1e4, pitch: -1.2708, roll: 0,
        w: kP.w, h: kP.h, t: kP.w * 0.866, tex: null, alpha,
        // as the cover's: its faces (the room bent in them) carry it, its arrises quiet
        glow: 0.45, edge: 0.4, sharp: soft, bevel: phone ? 1.3 : 1.8, sheen: 0.72, dispersion: 0.02, tint: 0.3,
      });
      /** a screen point at depth z, as the world point the rays take @param {number} X @param {number} Yy @param {number} z */
      const pt = (X, Yy, z) => { const q = place({ X, Y: Yy, z, sw: 1, sh: 1 }); return [q.cx, q.cy, q.cz]; };
      const top = pt(P.X + T * 0.04, P.Y - T * 0.866 * 0.3, P.z);
      // the light turning inside: from where the shaft comes in to where the ray leaves, on the rows' side
      const exit = pt(P.X - T * 0.2, P.Y + T * 0.866 * 0.04, P.z - T * 0.75 * 0.2);
      // the ray ends at the cued row's verb ("Open", "Next"): a wide screen just right of the rows' column, a phone
      // just left of the verb (the keep-outs stop it at the words anyway)
      // (a phone draws the prism alone: the few px to its verb hold no ray worth the name)
      if (!phone) {
        const end = pt(ch.right + 12, S.mY, 0), PAPER = [0.957, 0.945, 0.918];
        S.mk = S.mk == null || dt <= 0 ? (handed ? 1 : 0.62) : ease(S.mk, handed ? 1 : 0.62, dt, 0.1);
        const from = pt(P.X + 0.14 * vw, -0.35 * vh, P.z + 0.06 * D);
        passes = { rays: { rays: [
          { a: exit, b: end, w: 1.7, k: Math.round(S.mk * alpha * 1e4) / 1e4, rgb: PAPER },
          { a: top, b: [mix(top[0], from[0], 0.8), mix(top[1], from[1], 0.8), mix(top[2], from[2], 0.8)], w: 2.0, k: Math.round(0.85 * alpha * 1e4) / 1e4, rgb: PAPER },
          { a: exit, b: top, w: 1.5, k: Math.round(0.7 * alpha * 1e4) / 1e4, rgb: PAPER },
        ] } };
      }
    }
    subj = { X: P.X, Y: P.Y, z: P.z, w: T * 1.6, h: T * 1.6 };
  }
  const W = place({ X: subj.X, Y: subj.Y, z: subj.z, sw: 1, sh: 1 });
  return {
    slabs, swarm: [...swarm, ...barsSwarm()],
    subject: { x: W.cx, y: W.cy, z: W.cz, w: subj.w, h: subj.h, strength: 0.32 * p },
    pivot: [W.cx, W.cy, W.cz], keep, orbit: 1, p, barsNear: !!(FIG.bars && FIG.bars.near), passes,
  };
}

/** the bars' entry in the swarm (weight 1 while a measured chapter is near: showing and hiding is the reveal's) */
function barsSwarm() { return FIG.bars && FIG.bars.near ? [{ id: "bars", weight: 1, rect: FIG.bars.rect }] : []; }

/** Light on the rows: the bars of a measured chapter (or a teaser's row), the counts of a facts chapter. One formation
 *  serves them all, given to the chapter nearest the reading line; a new chapter takes it only once the old light is
 *  out (its points would otherwise fly across the frame to the new rows).
 *  @param {any} c @param {any} L @param {any} S @param {any} EYE @param {boolean} phone @param {number} dt */
function rowsFor(c, L, S, EYE, phone, dt) {
  const vh = c.vh, vw = c.vw, sy = c.scrollY, Y = vh * 0.5;
  // ((wave 6, ROOMS) a phone's list and schematic too: past their band the figure follows the row being read, a thread
  // of light under each row's number, as the counts stand under theirs)
  const cands = L.chs.filter((/** @type {any} */ k) => k.items.length && (k.kind === "measured" || k.kind === "teaser" || (k.kind === "facts" && k.items.some((/** @type {any} */ it) => it.count))
    || (phone && (k.kind === "list" || k.kind === "schematic") && k.items[0].n)));
  if (!cands.length) { FIG.bars = null; S.rows = null; return; }
  let pick = cands[0], bd = 1e9;
  for (const k of cands) {
    const top = k.box.y - sy, bot = top + k.box.h, d = Y < top ? top - Y : Y > bot ? Y - bot : 0;
    if (d < bd) { bd = d; pick = k; }
  }
  const page = location.pathname;
  /** @type {any} */ let Rw = S.rows;
  if (!Rw || Rw.page !== page) Rw = S.rows = { page, ci: pick.ci, grow: 0, cnt: 0, done: [], tally: null };
  const out = Rw.ci !== pick.ci;
  // (the old light is out, or already off the frame: a reader who scrolls on never waits for a fade he cannot see)
  const prev = FIG.bars, gone = !prev || prev.rect.y + prev.rect.h < -20 || prev.rect.y > vh + 20;
  if (out && ((Rw.grow < 0.02 && Rw.cnt < 0.5) || gone)) { Rw.ci = pick.ci; Rw.grow = 0; Rw.cnt = 0; Rw.done = []; }
  const ch = L.chs.find((/** @type {any} */ k) => k.ci === Rw.ci) || pick;
  const top = ch.box.y - sy, bot = top + ch.box.h;
  const near = bot > -vh * 0.5 && top < vh * 1.5;
  const fx0 = ch.right + Math.max(56, vw * 0.04), flen = Math.max(160, (vw - Math.max(32, vw * 0.03) - fx0) * 0.92);
  if (ch.kind === "measured" || ch.kind === "teaser") {
    // a wide screen: from the free third's left edge on each row's middle line; a phone: in the row's own strip
    const x0 = phone ? Math.min(...ch.items.map((/** @type {any} */ it) => (it.strip ? it.strip.x : it.r.x))) : fx0;
    const len = phone ? Math.max(...ch.items.map((/** @type {any} */ it) => (it.strip ? it.strip.w : it.r.w))) : flen;
    const ys = ch.items.map((/** @type {any} */ it) => (phone && it.strip ? it.strip.y + it.strip.h / 2 : it.r.y + Math.min(it.r.h * 0.5, 24)));
    const y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 30, H = y1 - y0, cy = (y0 + y1) / 2;
    const rows = ch.items.map((/** @type {any} */ it, /** @type {number} */ i) => ({ y: ys[i] - cy, bars: it.bars }));
    // grow while the chapter holds the frame: the sweep from the left edge (a phone: as its rows come on screen)
    const want = out ? 0 : phone ? sm(0.95 * vh, 0.6 * vh, y0 - sy) : sm(0.95 * vh, 0.55 * vh, y0 - sy) * (1 - sm(0, -0.3 * vh, y1 - sy));
    Rw.grow = dt > 0 ? ease(Rw.grow, want, dt, 0.3) : want;
    const key = `b${ch.ci}:${phone ? "p" : "d"}:${Math.round(len)}:${rows.map((r) => Math.round(r.y)).join(",")}`;
    // at the page plane: the eye's lateral travel is a shift (exact)
    FIG.bars = { key, kind: "bars", rows, len, phone, grow: Rw.grow, near, rect: { x: x0 + EYE.d[0], y: y0 - sy + EYE.d[1], w: len, h: H } };
    return;
  }
  // ------------------------------------------------ the counts: each row's on its own line (document px)
  /** @type {any[]} */ const rows = ch.items.map((/** @type {any} */ it) => {
    if (ch.kind === "list" || ch.kind === "schematic") {
      // (wave 6) the thread: one line down the numbers' column, from under each number to above the next (the last: to
      // its row's foot), so it reads as one thread from the first row to the row being read; a schematic's runs on the
      // line its nodes' connectors draw between them
      if (!it.n) return null;
      const nx = ch.items[ch.items.indexOf(it) + 1], y0 = it.n.y + it.n.h + 5;
      const y1 = nx && nx.n ? nx.n.y - 5 : it.r.y + it.r.h - (ch.kind === "schematic" ? 12 : 6);
      return y1 - y0 > 6 ? { x: it.n.x + Math.min(8, it.n.w * 0.3) - 1, y: y0, w: 2, h: y1 - y0, thread: true } : null;
    }
    if (!it.count) return null;
    if (!phone) {
      // one line of units on the number's middle line; a block of several from the number's top, in the free third;
      // the units go down the row, never into the next row's
      const many = it.count.mass || it.count.of > 10;
      const line = it.n ? it.n.y + (many ? Math.min(10, it.n.h * 0.2) : it.n.h * 0.5) : it.r.y + 30;
      return { x: fx0, y: line, w: flen, h: Math.max(20, it.r.y + it.r.h - line - 22), count: it.count, per: 10 };
    }
    // a phone: under the number, in the number's column (the words' column starts after it)
    if (!it.n || !it.t) return null;
    const x = it.n.x, w = Math.max(36, Math.min(it.t.x - 14, it.n.x + 150) - x), y = it.n.y + it.n.h + 18;
    const h = it.r.y + it.r.h - 16 - y;
    return h > 8 ? { x, y, w, h, count: it.count, per: 5 } : null;
  });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of rows) if (r) { x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w); y0 = Math.min(y0, r.y - 8); y1 = Math.max(y1, r.y + r.h + 8); }
  if (!(x1 > x0)) { FIG.bars = null; return; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const key = `t${ch.ci}:${phone ? "p" : "d"}:${rows.map((r) => (r ? [r.x, r.y, r.w, r.h].map(Math.round).join(",") : "-")).join(";")}`;
  if (!Rw.tally || Rw.tally.key !== key) Rw.tally = { key, ...tallySet({ rows: rows.map((r) => r || { count: null }), cx, cy, phone }) };
  const T = Rw.tally, ends = T.ends;
  // the count: a row is counted once its line comes up past 72 % of the frame (and uncounted only below 85 %); its
  // units light one by one, a row in about 0.7 s whatever its size. The rows before it are counted at once: the reader
  // has passed them (counted one after the other, a quick reader saw each count finish after its row had gone)
  let want = 0, above = 0;
  rows.forEach((r, i) => {
    if (!r) { if (Rw.done[i - 1]) Rw.done[i] = true; return; }
    const ly = r.y - sy;
    Rw.done[i] = Rw.done[i] ? ly < 0.85 * vh : ly < 0.72 * vh;
    if (Rw.done[i]) { want = ends[i]; above = i > 0 ? ends[i - 1] : 0; }
  });
  if (out) want = 0;
  if (dt <= 0) Rw.cnt = want;
  else if (Rw.cnt < want) {
    const i = Math.max(0, ends.findIndex((e) => e > Rw.cnt)), s0 = i > 0 ? ends[i - 1] : 0;
    Rw.cnt = Math.min(want, Math.max(Rw.cnt + (Math.max(1, ends[i] - s0) / 0.7) * dt, above));
  } else if (Rw.cnt > want) Rw.cnt = Math.max(want, Rw.cnt - (T.total / 0.45) * dt);
  // equal light per px whatever the count: the particles are shared by the segments (the bars' tone, about 12,000 px of strand)
  const ink = clamp(T.len / (phone ? 7000 : 12000), 0.12, 4);
  FIG.bars = { key, kind: "tally", set: T.set, total: T.total, hi: Rw.cnt / T.total, ink, phone, near, grow: Rw.cnt > 0.5 ? 1 : 0,
    rect: { x: x0 + EYE.d[0], y: y0 - sy + EYE.d[1], w: x1 - x0, h: y1 - y0 } };
}

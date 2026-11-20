// @ts-check
/**
 * evidence — "Measured before and after." (spec 50 §4): for each measured row the swarm draws two bars of light to the
 * row's exact lengths, the before dim, the after bright, on that row's line.
 *
 * THE FRAME:
 *  - Desktop: the rows are text in the left column (label, before → after); their bars stand in the figure's half on
 *    the same lines, all from one left edge, every row with a faint guide of the full length (100 %, or the before of
 *    a time pair: the build's own geometry, read from [data-stage-mark="before after"]). The bars are drawn by one
 *    sweep from the left edge, all rows at once, each stopping at its own length: the after outruns the before where
 *    the number went up and stops short where it went down.
 *  - Phone: the text spans the screen, so each row's bars are drawn inside the row, under its numbers, across its width
 *    (the printed bars' strip, kept in place and made invisible by page-work.css while the stage draws).
 *  - A row too small to draw on that scale (both lengths under 3 %) gets no bars: its own words say so in the row.
 *  - The bars ride with their rows (carry 1): they scroll with the text, never drift against it.
 *  - (wave 1, lane WORK) The scene stands in the room (lib/room.js): the wall's grid is the chart's paper behind the
 *    bars, a blade crosses them, the subject's light is on the set in view. The eye is the Work page's (gallery.js
 *    workEye): at the straight view's depth here, its lateral travel added to the bars' rects so they stay on their
 *    rows while the wall moves behind them.
 *  - The two sets of figures are two formations; each sweeps in as its step comes into focus and back out when the
 *    reader returns above it. The first one is drawn early, under the head ("Measured before and after."), as a chart of
 *    light without words in the middle of the figure's half; as its rows come up it slides onto their lines.
 */
import mistDef from "../night/mist.js";
import { room } from "./lib/room.js";
import { speedLens, drift } from "./lib/camera.js";
import { workEye, WORK_SEED, SUBJECT_K, KEEP_FEATHER, KEEP_FEATHER_PHONE, PHONE_DIM } from "./gallery.js";

const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sm = (/** @type {number} */ e0, /** @type {number} */ e1, /** @type {number} */ x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const damp = (/** @type {number} */ cur, /** @type {number} */ to, /** @type {number} */ dt, /** @type {number} */ tau) => cur + (to - cur) * (1 - Math.exp(-dt / Math.max(tau, 1e-4)));

const CAP = 8000;      // targets per set: two per segment (a full desktop set of five rows needs about 2k)
const TINY = 0.03;     // a row whose two lengths are both under this fraction is not drawn
const SHARE = 0.24;    // a set's share of the population (both sets are held at weight 1 while the scene is up)
const INK = 0.34 * 0.085 / SHARE;   // the bars' tone of the first build (0.34 at a share of 0.085), same light per px
const SEG = 10;       // css px of one segment of a bright strand (dim strands use shorter or longer ones: barSet)

/** the geometry of each set, written by frame(), read by the sets' update() (a formation sees only its own state)
 *  @type {any[]} */
const GEO = [null, null];

/** the targets of one set: every row's guide, before and after, as strands of light. Each strand is cut into short
 *  straight segments written as paths of two targets: the stage spreads a path's particles continuously and evenly
 *  between its two ends (on a cloud of points one particle per target left gaps and doubles: grain), so every
 *  segment gets the same share of the set's particles and a strand is an even line that starts and stops exactly at
 *  its ends. The segments are sorted by their left end, so that a reveal sweeps them from the left edge.
 *  @param {any} g */
function barSet(g) {
  /** @type {number[][]} */ const segs = [];
  const bars = (/** @type {any} */ r) => (g.phone ? [[r.b, g.by, 2, 0.34], [r.a, g.ay, 3, 1]] : [[r.b, g.by, 2, 0.3], [r.a, g.ay, 4, 1]]);
  /** a strand from x = a to x = b at height y, cut into n equal segments of about `seg` px @param {number} seg */
  const strand = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ y, /** @type {number} */ ink, seg) => {
    const n = Math.max(1, Math.round((b - a) / seg)), d = (b - a) / n;
    for (let i = 0; i < n; i++) segs.push([a + i * d, a + (i + 1) * d, y, ink]);
  };
  for (const r of g.rows) {
    if (r.b < TINY && r.a < TINY) continue;
    const L = g.len, x0 = -L / 2;
    // the guide: one faint strand of the full length, on the row's line. A dim strand gets shorter segments (more
    // particles per px) and less light per particle: the same tone, without single points showing as grain
    strand(x0, x0 + L, r.y + g.gy, 0.08 * 1.2 / 2.2, SEG * 1.2);
    // before: dim, after: bright, each a few strands a px apart (a band, not a hairline)
    for (const [f, oy, n, ink] of bars(r)) {
      const len = L * f, sk = ink < 0.5 ? 0.6 : 1;
      for (let k = 0; k < n; k++) strand(x0, x0 + len, r.y + oy + (k - (n - 1) / 2) * (g.phone ? 1 : 1.1), ink * sk, SEG * sk);
    }
  }
  segs.sort((p, q) => p[0] - q[0]);
  const n = Math.max(1, Math.min(CAP / 2, segs.length)), d = new Float32Array(n * 8);
  if (!segs.length) { d[0] = d[4] = -g.len / 2; }
  else for (let i = 0; i < n; i++) {
    const [a, b, y, ink] = segs[i];
    d.set([a, y, 0, ink, b, y, 0, ink], i * 8);
  }
  return { data: d, path: 2, closed: false, used: n * 2 };
}

/** a set of bars: formation k (0 the first set of figures, 1 the second) @param {number} k */
function setDef(k) {
  return {
    // a bar is a measurement: no flow, no scatter, no hand, no wind; it holds still on its line. A hidden target asks
    // for no light, so its particle waits on its place and is born there when the sweep reaches it (emit 0): no point
    // ever travels across the screen to a bar.
    share: SHARE, fill: 1, fit: "px", capacity: CAP, carry: 1, emit: 0,
    targets: () => ({ data: new Float32Array(CAP * 4), path: 0, closed: false }),
    look: { ink: INK, size: 0.95, mistInk: 0, mistSize: 1 },
    motion: { spring: 9, speed: 1400, inertia: 0.06, fuzz: 0 },
    flow: { amp: 0, wavelength: 200, evolution: 0.05, z: 0 },
    respond: { hand: 0, wind: 0, fadeIn: 3.2, fadeOut: 3.6 },
    tails: { share: 0, length: 40, emitters: 40 },
    /** @param {any} c */
    update(c) {
      const g = GEO[k];
      if (!g) return { reveal: [0, 0, 0] };
      const s = c.state;
      if (s.key !== g.key) { s.key = g.key; const t = barSet(g); s.used = t.used; c.setTargets(t); }
      // the sweep: segments sorted by x, revealed from the left edge up to the grown fraction (nothing while the set's
      // rows are off screen: its particles wait there unlit)
      const hi = g.on && g.grow > 0.001 ? clamp(g.grow * 1.02) : -0.05;
      return { reveal: [0, hi, 0.012], look: { ink: INK * (g.phone ? 1.45 : 1), size: g.phone ? 0.85 : 0.95 } };
    },
  };
}

const mist = { ...mistDef };

/** group the marks into the two sets by their place on the page (a set's rows sit together; the sets are a screen
 *  apart) @param {Record<string, any>} marks @param {number} vh */
function groups(marks, vh) {
  const all = Object.entries(marks).map(([id, r]) => {
    const [b, a] = id.trim().split(/\s+/).map(Number);
    return { b, a, r };
  }).filter((m) => Number.isFinite(m.b) && Number.isFinite(m.a)).sort((p, q) => p.r.y - q.r.y);
  /** @type {any[][]} */ const out = [];
  for (const m of all) {
    const last = out[out.length - 1];
    if (last && m.r.y - (last[last.length - 1].r.y + last[last.length - 1].r.h) < vh * 0.35) last.push(m);
    else out.push([m]);
  }
  return out;
}

export default {
  formations: { set1: setDef(0), set2: setDef(1), mist },
  /** @param {any} c */
  frame(c) {
    const S = c.state, dt = Math.min(c.dt || 0, 0.1), phone = c.vw < 1024, f = c.fig;
    const EYE = workEye(c), off = EYE.d;
    /** @type {any} */ let subj = null;
    S.grow ??= [0, 0];
    const sets = groups(c.marks, c.vh).slice(0, 2);
    /** @type {any[]} */ const swarm = [];
    sets.forEach((rows, k) => {
      // the bars' run: in the figure's half on a desktop, inside the rows on a phone
      const mx = Math.min(...rows.map((m) => m.r.x)), mw = Math.max(...rows.map((m) => m.r.x + m.r.w)) - mx;
      const x0 = phone ? mx : f.x + f.w * 0.06, len = phone ? mw : f.w * 0.8;
      const top = Math.min(...rows.map((m) => m.r.y)), bot = Math.max(...rows.map((m) => m.r.y + m.r.h));
      // on a wide screen the first set is drawn first under the head, as a chart of light in the middle of the figure's
      // half; as its rows come up it slides onto their lines (dock 0 -> 1). The second set, and every set on a phone
      // (where a set is taller than the figure's part of the screen), is always on its rows.
      let dock = 1;
      if (k === 0) {
        const dockTo = c.step <= 1 ? 0 : c.step === 2 ? sm(0, 0.5, c.local) : 1;
        S.dock = S.dock == null ? dockTo : dt > 0 ? damp(S.dock, dockTo, dt, 0.18) : S.dock;
        if (Math.abs(S.dock - dockTo) < 1e-3) S.dock = dockTo;
        dock = S.dock;
      }
      const H = bot - top + 60, cyDock = top - 30 + H / 2;
      // a desktop bar pair sits on the row's middle; a phone pair under the row's last line of text
      const line = (/** @type {any} */ m) => (phone ? m.r.y + m.r.h + 15 : m.r.y + Math.min(m.r.h * 0.5, 21)) - cyDock;
      /** @type {any} */ let rect, ys = rows.map(line);
      if (!phone) {
        const home = f.y + f.h * 0.5 - (bot - top) / 2;
        rect = { x: x0, y: home + (top - home) * dock - 30, w: len, h: H };
      } else {
        // PHONE lane (chain 9): the head ("Measured before and after.") holds its figure on the phone too. A whole set on
        // its rows is taller than the free top of a phone screen, so under the head the same pairs (the same lengths,
        // read from the same rows) stand closer together, a small chart in the free room between the header and the
        // head's text; when step 1 comes up they open out onto their rows, as the desktop's chart slides onto its lines.
        // Only the rows' spacing changes (the bars keep their length, so every strand keeps its segments): the stage
        // moves the same particles, it never trades them.
        const drawn = rows.map((m) => !(m.b < TINY && m.a < TINY));
        const n = Math.max(1, drawn.filter(Boolean).length);
        const b0 = 64 + 28, b1 = Math.max(b0 + 120, f.y + f.h);   // under the header, down to the figure's part
        const gap = Math.min(64, (b1 - b0) / (n + 0.4)), mid = (b0 + b1) / 2;
        let j = 0;
        const chart = drawn.map((d) => (d ? mid + (j++ - (n - 1) / 2) * gap : mid));
        const cy = mid + (cyDock - mid) * dock;
        rect = { x: x0, y: cy - H / 2, w: len, h: H };
        // a row's line in the rect's local px: from its place in the chart (screen) to its place under its row
        ys = rows.map((m, i) => chart[i] + (line(m) + cyDock - chart[i]) * dock - cy);
      }
      const geo = {
        phone, len, k: c.inkK || 1, rows: rows.map((m, i) => ({ b: m.b, a: m.a, y: ys[i] })),
        gy: 0, by: phone ? -4 : -5, ay: phone ? 3 : 5,
      };
      const key = `${phone ? "p" : "d"}:${geo.k}:${Math.round(len)}:${geo.rows.map((r) => Math.round(r.y)).join(",")}`;
      // grow while the set's step comes into focus (its step number: the set's place + 2; the head is step 1)
      const sk = k + 2;
      const early = k === 0;   // the first set is drawn under the head already (on a phone as a small chart: above)
      const want = early && c.step === 1 ? sm(0.2, 0.55, c.local) : c.step > sk || (early && c.step === sk) ? 1 : c.step < sk ? 0 : sm(0.08, 0.42, c.local);
      S.grow[k] = dt > 0 ? damp(S.grow[k], want, dt, 0.28) : S.grow[k];
      if (Math.abs(S.grow[k] - want) < 1e-3) S.grow[k] = want;
      // lit while its rows are on screen. Its weight stays 1 for the whole scene: a change of weight is a migration
      // between formations, and a lit point that changes formation flies across the screen (the wanderers of the
      // first build). Showing and hiding is the reveal's job (update above).
      const on = Math.min(rect.y + rect.h, c.vh) - Math.max(rect.y, 0) > -rect.h * 0.3 && rect.y + 40 < c.vh * 1.05;
      GEO[k] = { ...geo, key, grow: S.grow[k], on };
      // the eye's lateral travel (the plane z = 0 is at the straight depth here: a shift, exact)
      rect = { x: rect.x + off[0], y: rect.y + off[1], w: rect.w, h: rect.h };
      if (on && S.grow[k] > 0.05 && (!subj || S.grow[k] > subj.g)) subj = { x: rect.x + rect.w * 0.45, y: rect.y + rect.h / 2, z: 0, w: rect.w, h: Math.max(rect.h, 200), g: S.grow[k] };
      swarm.push({ id: k ? "set2" : "set1", weight: 1, rect });
    });
    swarm.push({ id: "mist", weight: 0.45, rect: { x: 0, y: 0, w: c.vw, h: c.vh } });
    // ------------------------------------------------ the room: the wall behind the bars, a blade across them
    // (on a phone the bars run inside the rows, 11–18 px under their text: the rows' own glyph boxes, unpadded)
    const keep = phone ? [...c.texts.map((/** @type {any} */ t) => ({ x: t.x - 2, y: t.y - 2, w: t.w + 4, h: t.h + 2 })), ...c.textRects({ pad: 10 }).filter((/** @type {any} */ r) => r.y < 90)] : undefined;
    const D = EYE.D;
    const sj = subj || { x: f.x + f.w * 0.5 + off[0], y: c.vh * 0.5 + off[1], z: 0, w: f.w * 0.8, h: c.vh * 0.4 };
    const R = room(c, { temp: EYE.temp, seed: WORK_SEED, eye: EYE.pos, keep, subject: { ...sj, strength: SUBJECT_K * 0.5 }, sweep: phone ? undefined : [0.05, 1], dim: phone ? PHONE_DIM : 0, glow: 1 });
    if (c.look) c.look({ ...R.look, keepFeather: phone ? KEEP_FEATHER_PHONE : KEEP_FEATHER });
    // the eye holds the straight depth here (a bar must stay on its row): a breath of drift, a small orbit about the bars
    const dr = drift(c.clock ? c.clock.time : 0, 3), P = EYE.pos;
    const pos = [P[0] + dr[0], P[1] + dr[1], P[2] + dr[2] * 0.3];
    return {
      swarm,
      camera: {
        pos, target: [pos[0], pos[1], P[2] - D], lens: speedLens(1, c.speed, 0.03), focus: D, aperture: 0.9, damp: 0,
        orbit: { yaw: 0.05, pitch: 0.025, damp: 1.1, pivot: [sj.x, sj.y, 0] }, fog: [3 * D, 7 * D],
      },
      bloom: { strength: 0.45, threshold: 0.55, knee: 0.3, plates: 0.08 },
      field: R.field,
      keepouts: R.keepouts,
      rest: 14,
    };
  },
};

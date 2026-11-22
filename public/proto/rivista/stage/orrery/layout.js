// @ts-check
/**
 * layout.js — WHERE EVERYTHING OF THE ORRERY STANDS (wave 8, lane ORRERY). Pure: no GPU, no DOM, no clock of its
 * own. The pass (orrery.js) and the lane's gap probe evaluate the SAME functions, so what the probe proves is what is drawn.
 *
 * THE CAROUSEL. The nine bodies turn round the mark TOGETHER, at one angular speed (a turn in TURN seconds of the
 * stage's clock), 40 degrees apart, the three shells alternating round the turn (1, 2, 3, 1, 2, 3, …): no body ever
 * overtakes another. The shells are three nested circles in planes a few degrees apart, seen leant (the lower half of
 * each ellipse is the near arc); the orbits are never drawn. Each body has a small life of its own: it sways, its
 * radius breathes by a few percent, it bobs slowly off its plane. EVERY period here divides TURN, so the whole system
 * comes back exactly after one turn: a scan of one turn has seen every pose there will ever be (orreryScan).
 *
 * TWO SHAPES, each of fixed proportions (every length a share of A, the outer orbit's radius in css px at the page
 * plane), so a proof at one size holds at every size: `open` (the figure's half of a desktop: the system seen from
 * about 45 degrees) and `band` (the low band of a phone: the same carousel seen from close and lower, what is near
 * large and what is far small, since nine bodies of a size worth reading do not fit a low band at one scale).
 * The scene (scenes/now.js) fits A to its room with EXTENT below.
 */
import { BODIES } from "./bodies.js";

export const TAU = Math.PI * 2;
/** one turn of the carousel, in seconds of the stage's clock */
export const TURN = 80;
const STEP = TAU / BODIES.length;
const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const num = (/** @type {any} */ v, /** @type {number} */ d) => (typeof v === "number" && isFinite(v) ? v : d);

/** rows of Ry(yaw) Rx(pitch) Rz(roll): y down, z toward the reader (as stage/splat/splat.js turn) @param {number[]} r */
export function turn(r) {
  const cy = Math.cos(r[0]), sy = Math.sin(r[0]), cx = Math.cos(r[1]), sx = Math.sin(r[1]), cz = Math.cos(r[2] || 0), sz = Math.sin(r[2] || 0);
  return mm(mm([[cy, 0, -sy], [0, 1, 0], [sy, 0, cy]], [[1, 0, 0], [0, cx, sx], [0, -sx, cx]]), [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]]);
}
/** @param {number[][]} A @param {number[][]} B */
export function mm(A, B) { return A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j])); }
/** @param {number[][]} M @param {number[]} v */
export const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];

/**
 * The two shapes. r: the three orbits' radii; cosI: how each plane is leant (the ellipse it is seen as: r across,
 * r x cosI down); node: each plane's turn about the view axis (rad); S: a body's unit (its box is about 0.9 to 1.1 of
 * it); H: the mark's height; eye: the figure's own eye distance (0: the stage's; else a close eye, what is near
 * larger); lift: each orbit's centre above the mark's (so the far arc clears the mark's top as the near arc its foot);
 * life: how much of a body's own life the shape leaves it (a low band has no room for a wide sway); hand: how much
 * of the hand's tilt it takes.
 */
export const SHAPE = Object.freeze({
  // (the lead, 22 Nov) every body carries its name under it all the turn: on the far arc a name stands between its body
  // and the mark, so every orbit's far arc clears the mark's top by a name's two lines (the inner orbits wider and
  // leant less: r x cosI is 0.70 or more for all three; they were 0.69, 0.84, 1 leant 0.84, 0.775, 0.73), and the
  // mark is a hair smaller (0.54 of A; it was 0.555)
  open: Object.freeze({ r: [0.8, 0.9, 1], cosI: [0.875, 0.78, 0.755], lift: [0, 0, 0], node: [-0.05, 0.035, -0.02], S: 0.184, H: 0.54, eye: 0, life: 1, hand: 1 }),
  band: Object.freeze(bandShape({ r: [0.94, 0.97, 1], yn: 0.545, yf: 0.46, node: [-0.02, 0.012, -0.008], S: 0.199, H: 0.445, eye: 2.1, life: 0.6, hand: 0.35 })),
});
/**
 * The band's three orbits from where they must pass: every orbit's near arc yn under the mark's centre and its far arc
 * yf over it AS SEEN (shares of A), whatever its radius: a low band has no height to nest the orbits in, so they nest
 * across only. For each radius this gives the plane's lean and the lift of its centre (seen through the close eye).
 * @param {{ r: number[], yn: number, yf: number, eye: number } & Record<string, any>} o
 */
function bandShape(o) {
  /** @type {number[]} */ const cosI = [], lift = [];
  for (const r of o.r) {
    let sinI = 0.86, q = 0;
    for (let k = 0; k < 40; k++) { q = (r * sinI) / o.eye; const c = clamp((o.yn * (1 - q) + o.yf * (1 + q)) / (2 * r), 0.05, 0.99); sinI = Math.sqrt(1 - c * c); }
    q = (r * sinI) / o.eye;
    cosI.push(Math.sqrt(1 - sinI * sinI)); lift.push((o.yf * (1 + q) - o.yn * (1 - q)) / 2);
  }
  return { ...o, cosI, lift };
}
/**
 * How far a shape reaches from the mark's centre, as shares of A: [left, right, up, down], every body's reach over a
 * whole turn (the probe's own measure: orreryScan().ext); the scene fits A to its room with these and leaves a word's
 * room past them.
 */
export const EXTENT = Object.freeze({ open: [1.12, 1.17, 0.78, 0.99], band: [1.26, 1.265, 0.57, 0.745] });

/** a body's breath in its radius, and its bob off its plane (a share of its unit) */
const BREATH = 0.022, BOB = 0.07;
/** where the first body stands at time 0 (rad) */
const TH0 = 0.35;
/**
 * A body's own life: how it stands (yaw0, pitch0), its sway (rad) and how many times a turn it sways (ns), nods (np),
 * breathes (nb) and bobs (nq): whole numbers, so everything is periodic in TURN; spin: full turns of its own a turn;
 * g: its size against the unit (a cube seen corner-on is wider than a flat figure: the nine read as one size); gb:
 * the same in the band, where it is a body's height that costs.
 */
const LIFE = [
  { g: 0.82, gb: 0.82, yaw0: 0.6, pitch0: 0.52, sw: 0.5, ns: 6, np: 4, nb: 7, nq: 5 },        // stack
  { g: 0.8, gb: 0.8, yaw0: 0, pitch0: 0.46, sw: 0, ns: 0, np: 5, nb: 6, nq: 7, spin: 5 },    // tess: it turns fully
  { g: 0.76, gb: 0.72, yaw0: 0.62, pitch0: 0.44, sw: 0.55, ns: 5, np: 4, nb: 8, nq: 6 },      // apart
  { g: 0.92, gb: 0.85, yaw0: 0.1, pitch0: 0.16, sw: 0.6, ns: 5, np: 3, nb: 6, nq: 5 },        // agents
  { g: 1, gb: 1, yaw0: -0.2, pitch0: 0.1, sw: 0.5, ns: 6, np: 4, nb: 7, nq: 6 },           // chain
  { g: 1, gb: 1, yaw0: 0.25, pitch0: 0.08, sw: 0.5, ns: 5, np: 4, nb: 8, nq: 7 },          // term
  { g: 1, gb: 0.9, yaw0: -0.25, pitch0: 0.06, sw: 0.5, ns: 7, np: 5, nb: 6, nq: 5 },         // clap
  { g: 1, gb: 1, yaw0: 0.22, pitch0: 0.1, sw: 0.5, ns: 4, np: 3, nb: 7, nq: 6 },           // curve
  { g: 1, gb: 1, yaw0: -0.18, pitch0: 0.06, sw: 0.5, ns: 5, np: 4, nb: 8, nq: 7 },         // gen
];
/** a body's place round the turn: the shells alternate 1, 2, 3 (BODIES holds three a shell, shell by shell) */
const SLOT = BODIES.map((b, i) => 3 * (i % 3) + b.shell);

/**
 * Where everything stands at simulated time t. World: document px, z toward the reader (the free camera's space).
 * @param {any} c the scene's config: x, y (the mark's centre, viewport css px at the current scroll), z, hx, hy (where
 *   it rests under the straight view: it faces the eye from there), A, phone (1: the band's shape), ax, ay (the hand)
 * @param {{ time: number, vw: number, vh: number, sx: number, sy: number }} env
 */
export function orreryLayout(c, env) {
  const band = !!c.phone, sh = band ? SHAPE.band : SHAPE.open;
  const A = Math.max(40, num(c.A, 320)), S = sh.S * A, H = sh.H * A;
  const D0 = clamp(1.25 * Math.hypot(env.vw, env.vh), 1100, 2600);               // the straight view's eye distance
  const Dv = sh.eye > 0 ? Math.min(D0, sh.eye * A) : D0;                         // the figure's own
  const C0 = [num(c.x, env.vw / 2) + env.sx, num(c.y, env.vh / 2) + env.sy, num(c.z, 0)];
  // the system faces the straight view's eye from where it rests (hx, hy): seen off the view's axis its orbits would
  // close up on the mark (a phone's band is a third of a screen above the eye) and the mark would stand half edge-on.
  // T: the hand's tilt over that facing
  const hx = num(c.hx, num(c.x, env.vw / 2)), hy = num(c.hy, num(c.y, env.vh / 2));
  const ex = env.vw / 2 - hx, ey = env.vh / 2 - hy, el = Math.hypot(ex, ey, D0);
  const T = mm(turn([num(c.ax, 0) * sh.hand, num(c.ay, 0) * sh.hand, 0]), turn([Math.atan2(-ex / el, D0 / el), Math.asin(ey / el), 0]));
  const w = (TAU * env.time) / TURN;
  const bodies = BODIES.map((b, i) => {
    const s = b.shell, lf = LIFE[i];
    const th = TH0 + SLOT[i] * STEP + w, cs = Math.cos(th), sn = Math.sin(th);
    const cosI = sh.cosI[s], sinI = Math.sqrt(1 - cosI * cosI);
    const r = sh.r[s] * A * (1 + BREATH * sh.life * Math.sin(lf.nb * w + 1.7 * i));
    const bob = BOB * sh.life * S * Math.sin(lf.nq * w + 2.3 * i);
    // on its circle, the plane leant so the lower half of the ellipse is the near arc; the bob along the plane's normal
    const x0 = r * cs, y0 = r * sn * cosI - bob * sinI - sh.lift[s] * A, z = r * sn * sinI + bob * cosI;
    const nd = sh.node[s], cn = Math.cos(nd), s2 = Math.sin(nd);
    // the figure's own eye: seen from the straight view a thing at depth z stands and measures as Dv / (Dv - z)
    const f = (Dv / (Dv - z)) * ((D0 - z) / D0);
    const o = mv(T, [(x0 * cn - y0 * s2) * f, (x0 * s2 + y0 * cn) * f, z]);
    const yaw = lf.spin ? lf.spin * w : lf.yaw0 + lf.sw * sh.life * Math.sin(lf.ns * w + i);
    const pitch = lf.pitch0 + 0.07 * sh.life * Math.sin(lf.np * w + i * 2);
    return { id: b.id, mode: b.mode, shell: s, slot: SLOT[i], th, sin: sn, cos: cs, f, size: S * (band ? lf.gb : lf.g) * f, p: [C0[0] + o[0], C0[1] + o[1], C0[2] + o[2]], R: mm(T, turn([yaw, pitch, 0])) };
  });
  // the mark sways slowly, never edge-on: always read as the mark. (the lead, 22 Nov) It is a lit solid now: it sways a
  // little further, and it turns with the hand more than the system does (the eye peeks round it: the wall on the
  // hand's side shows, lit or in shade by the side)
  const hk = 1.6 * sh.hand;
  const mark = { p: C0, H, R: mm(T, turn([0.34 * sh.life * Math.sin(4 * w) + hk * num(c.ax, 0), (0.07 + 0.08 * Math.sin(3 * w + 1)) * sh.life + hk * num(c.ay, 0), 0])) };
  return { band, all: !band && (c.all == null || !!c.all), A, S, H, D0, Dv, C0, T, bodies, mark, pad: clamp(0.065 * S, 2, BOX_PAD), zNear: sh.r[2] * A * Math.sqrt(1 - sh.cosI[2] * sh.cosI[2]) };
}

/** the body under the hand comes forward and grows a little (h: 0..1 a body) @param {any} L @param {number[]} hov */
export function orreryHover(L, hov) {
  L.bodies.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
    const h = hov[i] || 0;
    if (h <= 0) return;
    const fwd = mv(L.T, [0, 0, 34 * h * (L.A / 349)]);
    b.p = [b.p[0] + fwd[0], b.p[1] + fwd[1], b.p[2] + fwd[2]];
    b.size *= 1 + 0.12 * h;
  });
  return L;
}

/** the straight view's projection (the stage's camera when Now's view is at the top): world -> [viewport x, y, scale, z]
 *  @param {{ vw: number, vh: number, sx: number, sy: number }} env @param {number} D */
export function straight(env, D) {
  return (/** @type {number[]} */ p) => { const s = D / Math.max(D - p[2], 1); return [env.vw / 2 + (p[0] - env.sx - env.vw / 2) * s, env.vh / 2 + (p[1] - env.sy - env.vh / 2) * s, s, p[2]]; };
}

/** what the motes add to a figure's reach: their drift off the form and their own radius (css px; less on a small figure: L.pad) */
export const BOX_PAD = 4;
/** the six directions a figure's reach is measured along (every 30 degrees: a hexagon's sides and a box's among them) */
const AX = [0, 1, 2, 3, 4, 5].map((k) => [Math.cos((k * Math.PI) / 6), Math.sin((k * Math.PI) / 6)]);
/**
 * Every figure's reach on screen: the mark's, then the nine bodies'. A reach is twelve numbers: the least and the most
 * of the figure along each of the six directions of AX (viewport css px): the first and fourth directions are x and y,
 * so [r[0], r[3], r[6], r[9]] is its plain box. It holds everything the figure draws: its hull (bodies.js hullOf: its
 * form and its motes, through the whole of what moves inside it), turned as it stands, projected, padded for the
 * motes' drift.
 * @param {any} L @param {(p: number[]) => number[]} proj @param {Float32Array[]} hulls [mark, the nine] @param {number} [pad]
 * @returns {{ mark: Float64Array, bodies: Float64Array[] }}
 */
export function orreryBoxes(L, proj, hulls, pad = L.pad) {
  const one = (/** @type {number[]} */ p, /** @type {number[][]} */ R, /** @type {number} */ size, /** @type {Float32Array} */ h) => {
    const r = new Float64Array(12);
    for (let a = 0; a < 6; a++) { r[a] = 1e9; r[6 + a] = -1e9; }
    for (let k = 0; k < h.length; k += 3) {
      const a = h[k] * size, b = h[k + 1] * size, d = h[k + 2] * size;
      const q = proj([p[0] + R[0][0] * a + R[0][1] * b + R[0][2] * d, p[1] + R[1][0] * a + R[1][1] * b + R[1][2] * d, p[2] + R[2][0] * a + R[2][1] * b + R[2][2] * d]);
      for (let a2 = 0; a2 < 6; a2++) { const v = q[0] * AX[a2][0] + q[1] * AX[a2][1]; if (v < r[a2]) r[a2] = v; if (v > r[6 + a2]) r[6 + a2] = v; }
    }
    for (let a = 0; a < 6; a++) { r[a] -= pad; r[6 + a] += pad; }
    return r;
  };
  return { mark: one(L.mark.p, L.mark.R, L.mark.H, hulls[0]), bodies: L.bodies.map((/** @type {any} */ b, /** @type {number} */ i) => one(b.p, b.R, b.size, hulls[1 + i])) };
}
/** a plain rectangle [x0, y0, x1, y1] as a reach @param {number[]} q */
export function rectReach(q) {
  const r = new Float64Array(12);
  for (let a = 0; a < 6; a++) {
    const c = AX[a][0], s = AX[a][1], v = [q[0] * c + q[1] * s, q[2] * c + q[1] * s, q[0] * c + q[3] * s, q[2] * c + q[3] * s];
    r[a] = Math.min(v[0], v[1], v[2], v[3]); r[6 + a] = Math.max(v[0], v[1], v[2], v[3]);
  }
  return r;
}
/** a reach's plain box [x0, y0, x1, y1] @param {Float64Array} r */
export const boxOf = (r) => [r[0], r[3], r[6], r[9]];
/**
 * The gap between two figures (css px): the widest clear band between them along the six directions. Never more than
 * the true distance between what the two draw (two things apart along ANY direction are at least that far apart), so
 * a gap above 10 means more than 10 px of night between them; at 0 or under, the two reaches meet.
 * @param {Float64Array} a @param {Float64Array} b
 */
export function gapOf(a, b) {
  let g = -1e9;
  for (let k = 0; k < 6; k++) g = Math.max(g, a[k] - b[6 + k], b[k] - a[6 + k]);
  return g;
}

/** a phone's band shows one word at a time: how far from the front a body still shows its word (rad), and the fade's
 *  width (the one leaving is out before the next comes in). A desktop shows all nine all the turn; where the figure
 *  is too small for nine (c.all 0: the scene's), the three nearest the front (WIN3) */
const WIN = [0.335, 0.022], WIN3 = [1.04, 0.022];
/** a word's distance under its body's box, and the clearance it gives way at (gone at the first, whole at the second) */
const W_GAP = 5, W_CLEAR = [3, 7];
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
/**
 * THE WORDS: where each body's name stands and how lit. On a desktop every body carries its name under it all the
 * turn (Alberto, 22 November: «vorrei che le scritte dei simboli siano sempre attive»), centred on it, inside `lab`;
 * in a phone's band only the body at the front does (under it, or over it where the room is). A name that would come
 * within a few px of the mark, of ANY body or of a name already standing first moves aside, then gives way (the body
 * under the hand, then the nearer the front, wins): no name is ever lit over or under another. The shape (SHAPE.open)
 * leaves the room, and the lane's proof (orreryScan) shows that none gives way in a whole turn.
 * @param {any} L @param {{ mark: Float64Array, bodies: Float64Array[] }} boxes @param {{ w: number, h: number }[]} rects
 * @param {number[]} lab [x0, y0, x1, y1] @param {{ hov?: number[], placed?: number }} [o]
 * @returns {{ a: number, x: number, y: number, clear: number, way: number, by: string }[]} a word's presence, its top
 *   left (viewport css px), how clear it stands and of what, and how much of it stands (way: 1 whole, 0 given way)
 */
export function orreryWords(L, boxes, rects, lab, o = {}) {
  const hov = o.hov || [], placed = o.placed ?? 1;
  const n = L.bodies.length;
  /** @type {{ a: number, x: number, y: number, clear: number, way: number }[]} */ const out = [];
  /** @type {number[]} */ const off = [];
  for (let i = 0; i < n; i++) {
    out.push({ a: 0, x: 0, y: 0, clear: 0, way: 0, by: "" });
    // how far round from the front (th = 90 degrees)
    let d = (L.bodies[i].th - Math.PI / 2) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
    off.push(Math.abs(d));
  }
  const all = !L.band && L.all !== false, win = L.band ? WIN : WIN3;
  const want = off.map((d, i) => Math.max(hov[i] || 0, placed * (all ? 1 : sstep(win[0], win[0] - win[1], d))));
  const order = off.map((_, i) => i).sort((i, j) => ((hov[j] || 0) - (hov[i] || 0)) || (off[i] - off[j]));
  /** @type {{ r: Float64Array, id: string, cx: number }[]} */ const standing = [];
  const mkx = (boxes.mark[0] + boxes.mark[6]) / 2;
  for (const i of order) {
    const rc = rects[i];
    if (!rc || want[i] <= 0.003) continue;
    const bx = boxOf(boxes.bodies[i]), under = !L.band || L.bodies[i].sin > -0.15;
    /** the word standing dx off its body's middle: its rectangle, what it is nearest to (by, for the proof's report)
     *  and how near (clear), and where that thing is (ox) */
    const at = (/** @type {number} */ dx) => {
      const cx = clamp((bx[0] + bx[2]) / 2 + dx, lab[0] + rc.w / 2, Math.max(lab[0] + rc.w / 2, lab[2] - rc.w / 2));
      let top = under ? bx[3] + W_GAP : bx[1] - W_GAP - rc.h;
      if (under && top + rc.h > lab[3]) top = bx[1] - W_GAP - rc.h;
      else if (!under && top < lab[1]) top = bx[3] + W_GAP;
      const q = [cx - rc.w / 2, top, cx + rc.w / 2, top + rc.h], r = rectReach(q);
      // what it stays clear of: the room's top and foot, the mark, every other body, the words already standing
      let clear = Math.min(q[1] - lab[1], lab[3] - q[3]) + W_CLEAR[1], by = "room", ox = cx;
      const near = (/** @type {number} */ g, /** @type {string} */ what, /** @type {number} */ x) => { if (g < clear) { clear = g; by = what; ox = x; } };
      near(gapOf(r, boxes.mark), "mark", mkx);
      for (let j = 0; j < n; j++) if (j !== i) near(gapOf(r, boxes.bodies[j]), L.bodies[j].id, (boxes.bodies[j][0] + boxes.bodies[j][6]) / 2);
      for (const s of standing) near(gapOf(r, s.r), "the word of " + s.id, s.cx);
      return { q, r, clear, by, ox, cx };
    };
    // a name wider than its body may stand a little off its body's middle, away from what it would come too near (as
    // far as it is short of its clearance, never past its body's far edge): it moves aside before it gives way
    let W = at(0);
    const slack = !L.band ? Math.max(0, (rc.w - (bx[2] - bx[0])) / 2 + 6) : 0, short = W_CLEAR[1] + 2 - W.clear;
    if (slack > 0 && short > 0) { const W1 = at((W.ox > W.cx ? -1 : 1) * Math.min(slack, 1.5 * short)); if (W1.clear > W.clear) W = W1; }
    // way: 1 while it stands clear, 0 where it has given way. Its light is its body's (what is at the back of the turn
    // a little dimmer), whole under the hand
    const way = sstep(W_CLEAR[0], W_CLEAR[1], W.clear), lit = !L.band ? Math.max(hov[i] || 0, mix(0.7, 1, sstep(-0.9, 0.5, L.bodies[i].sin))) : 1;
    const a = want[i] * way * lit;
    out[i] = { a, x: W.q[0], y: W.q[1], clear: W.clear, way, by: W.by };
    if (a > 0.02) standing.push({ r: W.r, id: L.bodies[i].id, cx: W.cx });
  }
  return out;
}

/**
 * THE PROOF: the clock stepped through a whole turn under the straight view (every period divides TURN, so this is
 * every pose there is). Returns the smallest gap between any two bodies and between any body and the mark, how far
 * the figures reach from the mark's centre, the bodies' size at the front and at the back, and the words' record.
 * @param {any} c the scene's config @param {{ vw: number, vh: number, sx: number, sy: number }} env
 * @param {Float32Array[]} hulls @param {{ w: number, h: number }[]} rects @param {number[]} lab
 * @param {{ steps?: number, hover?: number, tilt?: number[] }} [o] hover: a body held under the hand; tilt: [ax, ay]
 */
export function orreryScan(c, env, hulls, rects, lab, o = {}) {
  const steps = o.steps || 1600, cfg = o.tilt ? { ...c, ax: o.tilt[0], ay: o.tilt[1] } : c;
  const res = { bodies: 1e9, bodiesAt: "", mark: 1e9, markAt: "", ext: [0, 0, 0, 0], near: [1e9, 0], far: [1e9, 0], words: { most: 0, clear: 1e9, clearAt: "", dim: 0, gave: 0, none: 0, shown: 0, gaveTo: /** @type {Record<string, number>} */ ({}) }, markBox: [0, 0] };
  const n = BODIES.length;
  /** @type {number[]} */ const hov = new Array(n).fill(0);
  if (o.hover != null) hov[o.hover] = 1;
  for (let k = 0; k < steps; k++) {
    const t = (k * TURN) / steps;
    const L = orreryHover(orreryLayout(cfg, { ...env, time: t }), hov);
    const B = orreryBoxes(L, straight(env, L.D0), hulls);
    const cx = num(cfg.x, 0), cy = num(cfg.y, 0), mb = boxOf(B.mark);
    res.markBox = [Math.max(res.markBox[0], mb[2] - mb[0] - 2 * L.pad), Math.max(res.markBox[1], mb[3] - mb[1] - 2 * L.pad)];
    for (let i = 0; i < n; i++) {
      const a = boxOf(B.bodies[i]);
      const gm = gapOf(B.bodies[i], B.mark);
      if (gm < res.mark) { res.mark = gm; res.markAt = `${BODIES[i].id} t=${t.toFixed(2)} th=${Math.round((((L.bodies[i].th * 180) / Math.PI) % 360 + 360) % 360)}`; }
      for (let j = i + 1; j < n; j++) { const g = gapOf(B.bodies[i], B.bodies[j]); if (g < res.bodies) { res.bodies = g; res.bodiesAt = `${BODIES[i].id}/${BODIES[j].id} t=${t.toFixed(2)} th=${Math.round((((L.bodies[i].th * 180) / Math.PI) % 360 + 360) % 360)}`; } }
      res.ext = [Math.max(res.ext[0], cx - a[0]), Math.max(res.ext[1], a[2] - cx), Math.max(res.ext[2], cy - a[1]), Math.max(res.ext[3], a[3] - cy)];
      // a body's size: the longer side of its box without the pad, at the front and at the back of the turn
      const sz = Math.max(a[2] - a[0], a[3] - a[1]) - 2 * L.pad;
      if (L.bodies[i].sin > 0.985) res.near = [Math.min(res.near[0], sz), Math.max(res.near[1], sz)];
      if (L.bodies[i].sin < -0.985) res.far = [Math.min(res.far[0], sz), Math.max(res.far[1], sz)];
    }
    if (rects && rects.length) {
      const W = orreryWords(L, B, rects, lab, { hov, placed: 1 });
      let shown = 0;
      W.forEach((q, i) => {
        if (q.a <= 0.02) { if (q.clear && q.clear < W_CLEAR[1]) { res.words.gave++; res.words.gaveTo[`${BODIES[i].id} to ${q.by}`] = (res.words.gaveTo[`${BODIES[i].id} to ${q.by}`] || 0) + 1; } return; }
        shown++;
        if (q.way < 0.95) res.words.dim++;
        const r = rectReach([q.x, q.y, q.x + rects[i].w, q.y + rects[i].h]);
        let cl = gapOf(r, B.mark);
        for (let j = 0; j < n; j++) if (j !== i) cl = Math.min(cl, gapOf(r, B.bodies[j]));
        W.forEach((p, j) => { if (j !== i && p.a > 0.02) cl = Math.min(cl, gapOf(r, rectReach([p.x, p.y, p.x + rects[j].w, p.y + rects[j].h]))); });
        if (cl < res.words.clear) { res.words.clear = cl; res.words.clearAt = `${BODIES[i].id} t=${t.toFixed(2)} a=${q.a.toFixed(2)}`; }
      });
      res.words.most = Math.max(res.words.most, shown);
      res.words.shown += shown;
      if (!shown) res.words.none++;
    }
  }
  const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;
  return { steps, A: r1(num(cfg.A, 0)), band: !!cfg.phone, bodies: r1(res.bodies), bodiesAt: res.bodiesAt, mark: r1(res.mark), markAt: res.markAt, ext: res.ext.map(r1), near: res.near.map(r1), far: res.far.map(r1), markBox: res.markBox.map(r1),
    words: { most: res.words.most, mean: r1(res.words.shown / steps), clear: r1(res.words.clear), clearAt: res.words.clearAt, dimShare: Math.round((1000 * res.words.dim) / Math.max(1, res.words.shown)) / 1000, gaveShare: Math.round((1000 * res.words.gave) / steps) / 1000, noneShare: Math.round((1000 * res.words.none) / steps) / 1000, gaveTo: res.words.gaveTo } };
}

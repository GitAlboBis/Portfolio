// @ts-check
/**
 * now — "Now at SerSan" (spec 50 §4; lanes COVER, HERO; wave 8, lane ORRERY), where the cover's camera flies to.
 *
 * THE ORRERY (wave 8; Alberto, 21 November: «non mi piace la card con lo screenshot del sito . al posto della card
 * possiamo fare qualcosa di molto piu wow»). Where the plate of glass with the sersan.io capture stood there is a figure
 * of light: the SerSan mark as a lit solid of grains with its crust of spores, and nine bodies turning round it as one
 * carousel, each a small figure of points for a kind of work Alberto does, each with its name under it. It is an extra
 * pass of the stage (stage/orrery/orrery.js, imported after the stage's first frame); this scene only says where it
 * stands, how large, and what the hand does. Now returns no slab.
 *
 * It keeps the plate's laws. It stands where Now's layout wants it (the figure's half on a desktop, the band under the
 * header on a phone), at the page plane. The scroll flies the camera to it: it is lit once the name's letters are
 * behind the eye (never in the hero's first view), far ahead behind the gap in the name, and when Now's view reaches
 * the top the camera is the straight view and the figure is exactly in its place. From there it rides with the Now
 * section and leaves upward with it. Both scenes return the same camera (coverCamera), so the host's blend is one shot.
 * The pointer turns it a few degrees with inertia (a spring that overshoots a little) and blows the mark's crust off
 * where it is; a press flashes the mark. The swarm gathers deep behind the mark as a soft field (low-discrepancy, not
 * random).
 *
 * The nine names are the page's own (the list in Now's markup, [data-orbit]): the pass draws them as light, and the
 * page prints them as type where there is no stage, on a phone (where the stage shows one at a time) and whenever the
 * pass cannot draw (html.orrery-off).
 */
import { C, clamp, sstep, mix } from "./cover/shared.js";
import { coverCamera, flightK, hallField, liveKeeps, eyeD } from "./cover/world.js";
// (lane NAME) ?name=splat: the same splat config as hero.js (the host takes the heaviest scene's)
const NAME_SPLAT = typeof location !== "undefined" && /[?&]name=splat(?:&|$)/.test(location.search);
/** @type {any} */ let SN = null;
if (NAME_SPLAT) import("./cover/splatname.js").then((m) => { SN = m; }, () => {});

/* ================================================================ (wave 8, ORRERY) the figure's ask
 * Everything the orrery is asked for a frame, in one function. */
/** the pass's module: imported once the stage has drawn its first frame (never on the first frame's path). If it
 *  cannot be had, the page prints the nine names as type (html.orrery-off, css/page-cover.css; the pass sets the same
 *  class when it cannot draw) */
/** @type {any} */ let OR = null;
let orAsked = false, orFailed = false;
const orLoad = () => {
  if (orAsked) return;
  orAsked = true;
  import("../orrery/orrery.js").then((m) => { OR = m; }, () => { orFailed = true; document.documentElement.classList.add("orrery-off"); });
};
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const go = () => setTimeout(orLoad, 0);
  if (document.documentElement.classList.contains("stage-on")) go();
  // (the router takes a page's listeners with the page: where this one never fires, Now's own frame asks, in frame())
  else window.addEventListener("fx:stage:frame", go, { once: true });
}
/** THE NINE NAMES, read from the page: the list the markup prints in Now ([data-orbit], parts/c-main.index.html, copy
 *  in parts/strings.mjs "now.orbit.*"), in the bodies' order (stage/orrery/bodies.js BODIES). Read once, and again once
 *  the list they came from has left the document: the Astro router keeps this module across pages and languages (as
 *  path.js reads its labels). No list, or not nine names: no words (the figure turns without them). */
/** @type {{ el: Element, words: string[] } | null} */ let NAMES = null;
function orbitNames() {
  if (NAMES && NAMES.el.isConnected) return NAMES.words;
  NAMES = null;
  try {
    const el = document.querySelector('[data-stage="now"] [data-orbit]');
    if (!el) return [];
    const words = Array.from(el.querySelectorAll("li"), (li) => (li.textContent || "").replace(/\s+/g, " ").trim());
    NAMES = { el, words: words.length === 9 && words.every(Boolean) ? words : [] };
    FACE = null; BOX = null;   // a new page: its language, its face and its layout are read again with its names
    // the router's swap takes html's classes with the old page: a pass that cannot draw says so again on every page
    if (orFailed || (OR && typeof OR.orreryOff === "function" && OR.orreryOff())) document.documentElement.classList.add("orrery-off");
    return NAMES.words;
  } catch { return []; }
}
/** the page's label face (the computed style of Now's .t-label), read once per viewport width; never under the type floor */
/** @type {{ vw: number, f: any } | null} */ let FACE = null;
function labelFace(/** @type {number} */ vw) {
  if (FACE && FACE.vw === vw) return FACE.f;
  const floor = vw < 760 ? 15 : vw >= 1920 ? 18 : 16;
  /** @type {any} */ let f = { weight: 600, size: floor, ls: 0.06 * floor, lang: "en" };
  try {
    const el = document.querySelector('[data-stage="now"] .t-label') || document.querySelector(".t-label");
    const cs = el ? getComputedStyle(el) : null;
    if (cs) { const size = Math.max(floor, parseFloat(cs.fontSize) || floor); f = { family: cs.fontFamily, weight: cs.fontWeight, size, ls: Math.round((parseFloat(cs.letterSpacing) || 0) * 100) / 100, lang: document.documentElement.lang || "en" }; }
  } catch { /* the fallback face */ }
  FACE = { vw, f };
  return f;
}
/** the figure's own state, a PAGE's (kept in the scene's c.state: the Astro router keeps this module across pages,
 *  and the host's clock starts again on each): the hand's spring and its coming and going, the flash, the time it was
 *  first asked for, whether fewer than nine names are drawn */
const fresh = () => ({ t: -1, tx: 0, ty: 0, vx: 0, vy: 0, flash: 0, wasDown: false, t0: null, pin: 0, px: 0, py: 0, few: null });
/** Now's text column, read from the page once per layout: its right edge (viewport px) and its top under the
 *  section's. (The host's c.texts holds only the blocks near the viewport: a place taken from them moved as they came.) */
/** @type {{ el: Element, key: string, right: number, top: number } | null} */ let BOX = null;
function nowBox(/** @type {number} */ vw, /** @type {number} */ vh) {
  const key = vw + "x" + vh;
  if (BOX && BOX.key === key && BOX.el.isConnected) return BOX;
  BOX = null;
  try {
    const sec = document.querySelector('[data-stage="now"]'), el = sec && sec.querySelector(".sc-in");
    if (!sec || !el) return null;
    const s = sec.getBoundingClientRect(), r = el.getBoundingClientRect();
    BOX = { el, key, right: r.right, top: r.top - s.top };
  } catch { /* no layout to read: the fallbacks below */ }
  return BOX;
}
const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10, r3 = (/** @type {number} */ v) => Math.round(v * 1000) / 1000, r4 = (/** @type {number} */ v) => Math.round(v * 10000) / 10000;
/**
 * The orrery's config this frame, and where the figure stands (for the glow behind it).
 * @param {any} c Now's own ctx
 */
function orreryAsk(c) {
  const vw = c.vw, vh = c.vh, y = c.scrollY, phone = c.phone;
  /** @type {any} */ const OS = c.state.orrery || (c.state.orrery = fresh());
  // (wave 9, J2b NOW) A PHONE HELD UPRIGHT (c.caption: Now in the caption grammar, css/scene.css): Now's text is three
  // captions held at the foot, and the figure owns the band above the tallest one for the whole of Now: the host's
  // c.fig, from the view's top (capB: its foot under the view's top, a gap over the tallest caption's words). That band
  // is about twice as tall as the old one over the text block, and the figure fills it in the tall band's shape
  // (stage/orrery/layout.js SHAPE.tall)
  const capB = c.caption && c.fig ? Math.max(0, Math.round(c.fig.h)) : 0;
  // where Now's layout puts the figure: the figure's half on a desktop, clear of the text column (the host's figure
  // box starts at half the view at most: on a narrow desktop that is inside the column); on a phone the band over
  // the text block
  const B = capB ? null : nowBox(vw, vh), f = c.fig, stacked = !!capB || phone || f.w > vw * 0.9;
  const x0 = stacked ? 0 : Math.max(f.x, B ? B.right + Math.max(24, vw * 0.03) : f.x);
  const L = { x0, x1: stacked ? vw : f.x + f.w, top: capB || (B ? B.top : vh * 0.55), stacked, tall: !!capB };
  const nowTop = C.nowTop || 1, k = flightK(c);
  // ---- the figure's place in Now (viewport px when Now's view is at the top): the figure's half on a desktop, the band
  // between the header and the text on a phone; its size from that room
  // (wave 9, J3 VIEWPORT) the header is taller by the top safe area under a notch (c.safeTop, 0 elsewhere)
  const safe = c.safeTop || 0;
  // (wave 9, J2b NOW) the tall band ends at the host's band foot (its gap over the captions is already in it)
  const bx0 = L.x0 + 6, bx1 = L.x1 - 6, by0 = (L.stacked ? 68 : 76) + safe, by1 = L.tall ? L.top : L.stacked ? L.top - 8 : vh - 12;
  // one number, A, the outer orbit's radius: the carousel has a fixed shape (stage/orrery/layout.js SHAPE: `open` in
  // the figure's half, `band` in a phone's low band, `tall` in a phone's band over Now's captions) and E is how far
  // that shape reaches from the mark's centre, as shares of A: left, right, up, down (layout.js EXTENT; the numbers are
  // written here as well: this scene never imports the orrery's modules, which come after the stage's first frame).
  const E = L.tall ? [1.24, 1.22, 1.03, 1.16] : L.stacked ? [1.26, 1.265, 0.57, 0.745] : [1.12, 1.17, 0.78, 0.99];
  // On a desktop every body carries its name under it all the turn (two lines of the label face where the name is
  // long): past the shape the room keeps two lines under the lowest body and half a name at the sides; a phone's band
  // keeps one line under the front body
  const mS = L.stacked ? 4 : 44, mT = L.stacked ? 3 : 26, mB = L.stacked ? 26 : 62, rw = bx1 - bx0 - 2 * mS, rh = by1 - by0 - mT - mB;
  const A = Math.max(60, Math.min(rw / (E[0] + E[1]), rh / (E[2] + E[3]), L.stacked ? 260 : 470));
  const P = { cx: bx0 + mS + E[0] * A + (rw - (E[0] + E[1]) * A) / 2, cy: by0 + mT + E[2] * A + (rh - (E[2] + E[3]) * A) / 2, A, H: (L.tall ? 0.85 : L.stacked ? 0.445 : 0.54) * A };
  // all nine names stand round the carousel only where it is large enough (the lane's proof holds from A 244, a view
  // 1280 wide); under that the three nearest the front do, and the page prints the list (html.orbit-few,
  // css/page-cover.css: said again on every page, since the router's swap takes html's classes)
  const all = !L.stacked && A >= 232;
  if (OS.few !== !all) { OS.few = !all; document.documentElement.classList.toggle("orbit-few", !L.stacked && !all); }
  // fixed to the viewport through the flight (the camera moves), then it rides up with the section (the plate's law)
  // (wave 9, J2b NOW) with the captions it is held in its band for the whole of Now and leaves WITH Now's last caption:
  // that caption is let go as Now's end reaches the view's foot (css/scene.css: the last caption box keeps its room
  // over the foot), and from there both ride up with the page, the figure above its caption, as the gallery's head comes
  // up below with its opening row (J2a: a figure leaves with its scene's last caption and enters with its first)
  // (wave 9, J2r RAIL) ON THE RAIL (c.rail: a phone held upright, Now and the home's Work part a join; fx-stage.js "THE
  // RAIL"): the figure stands at its place in the world and the EYE travels from it to Work's place: it does not ride up
  // with the page (Now's last caption stays at the foot too, handing over in place) and does not fade with Now's weight;
  // the pan takes it out of the frame. away: how far the eye stands from its place, in steps of the rail (0 here, 1 at
  // Work's place)
  const RA = c.rail || null, away = RA ? clamp(Math.abs(RA.eye - RA.at) / Math.max(1, RA.step)) : 0;
  const ride = RA ? 0 : L.tall ? Math.min(0, c.section.y + c.section.h - vh) : Math.min(0, nowTop - y);
  // how far Now has gone past (0 while it holds the view; 1 a screen later): the figure fades as it leaves, the chips
  // thin out, the scene lets go of the frame
  // (wave 9, J2r RAIL) on the rail, how far the eye has travelled away (the figure itself stays whole until it is out of
  // the frame: below)
  const gone = RA ? away : L.tall ? clamp(-ride / vh) : clamp((y - nowTop) / vh);
  // far down the hall it stands dead ahead, behind the gap in the name the eye flies through (cover/world.js: the
  // world's `gap`); once the eye is through, it comes to its place long before it is near
  const W = C.world, g = W && W.vw === vw && W.vh === vh && Array.isArray(W.gap) ? W.gap : [vw / 2, vh / 2];
  const ahead = 1 - sstep(0.3, 0.78, k);
  const lx = (g[0] - P.cx) * ahead, ly = (g[1] - P.cy) * ahead;
  // ---- the hand: a few degrees, with inertia (the plate's spring), and a flash on a press; every value settles exactly
  const p = c.pointer, touch = !!(c.aim && c.aim.touch), nx = p.present ? p.nx : 0, ny = p.present ? p.ny : 0;
  const amp = mix(0.3, 1.4, k), dt = OS.t < 0 ? 0 : clamp(c.time - OS.t, 0, 0.1);
  if (dt > 0) {
    const kk = 16, d = 2 * 0.58 * Math.sqrt(kk), gx = nx * 0.1 * amp, gy = -ny * 0.065 * amp;
    OS.vx += (kk * (gx - OS.tx) - d * OS.vx) * dt; OS.tx += OS.vx * dt;
    OS.vy += (kk * (gy - OS.ty) - d * OS.vy) * dt; OS.ty += OS.vy * dt;
    if (Math.abs(gx - OS.tx) < 2e-5 && Math.abs(OS.vx) < 2e-4) { OS.tx = gx; OS.vx = 0; }
    if (Math.abs(gy - OS.ty) < 2e-5 && Math.abs(OS.vy) < 2e-4) { OS.ty = gy; OS.vy = 0; }
    if (p.down && !OS.wasDown) OS.flash = 1;
    OS.flash *= Math.exp(-dt / 0.38);
    if (OS.flash < 0.002) OS.flash = 0;
  }
  OS.wasDown = p.down;
  // ---- presence: it comes up with the hall (the hero's arrival), never in one frame; it goes as Now leaves
  if (OS.t0 == null) OS.t0 = c.time;
  const enter = Math.min(sstep(0, 0.6, c.time - OS.t0), sstep(2.2, 3.3, C.at ?? 99));
  // lit only once the name's letters are behind the eye (cover/world.js gone(), k 0.42 to 0.5): far ahead the mark
  // would stand ON the letters, a dark spot with the mark in it (a phone's two lines most). The scroll's own gate,
  // as the plate's laws were (no state: it is dark again whenever the eye is back before the name). The hero's first
  // view is untouched: Now's frame does not even run there
  const lit = sstep(0.42, 0.56, k);
  // (wave 9, J2b NOW) THE EARLIER ARRIVAL on a phone held upright, inside that gate. A flick from the name used to land
  // in the hero's empty tail: lit at k 0.42 to 0.56, the mark then stood a speck far down the hall (half its size) until
  // k 0.72 and the bodies condensed only from k 0.66. Now, once lit, the figure stands NEARER the eye (toward the reader,
  // z > 0) by as much as makes it read at a size that grows steadily from 0.55 of its own at k 0.42 to the whole at k
  // 0.95 (the eye's own distance and lens are the cover's camera, coverCamera, this frame), and it is back on the page
  // plane, exactly in its place, when Now's view reaches the top (k 1: the straight view, z 0); the bodies condense
  // from k 0.5 (c0). Nothing of it is lit before the gate, so nothing ever stands on the name's letters
  let zq = 0;
  if (L.tall && lit > 0 && k < 1) {
    const cam = coverCamera(c), D = eyeD(vw, vh), ez = cam && cam.pos ? cam.pos[2] : D, lens = (cam && cam.lens) || 1;
    zq = Math.max(0, ez - (lens * D) / mix(0.55, 1, sstep(0.42, 0.95, k)));
  }
  // (wave 9, J2b NOW) THE JOIN INTO WORK, one take: once Now's last caption is let go the figure rides up with it and
  // fades as the gallery's head comes up below, in step with it: the gallery's plates come in by that scene's blend
  // weight and Now's own weight is the rest of the frame (c.weight: the same rows, the same damping), so the figure has
  // gone (under 0.05 of its light) as the nearest plate reaches about a third of its own, wherever the reader stops:
  // never a frame without a figure, never two standing at once. Scrolling back it comes in again as the plates go; by the
  // greater of Now's damped weight and its share of the frame followed more closely (c.share through a 0.07 s follower:
  // the share alone steps a row at a time), so a quick flick back, which carries the plates out of the frame's foot
  // before their damped weight lets go of them, finds the figure already coming in.
  // Before the let-go (ride 0) Now's weight is not read: during the flight it is low while the hero still covers the screen
  const sh = typeof c.share === "number" ? c.share : 1;
  OS.wq = OS.wq == null || dt <= 0 ? sh : OS.wq + (sh - OS.wq) * (1 - Math.exp(-dt / 0.07));
  if (Math.abs(sh - OS.wq) < 1e-4) OS.wq = sh;
  const wNow = Math.max(typeof c.weight === "number" ? c.weight : 1, OS.wq);
  const leave = L.tall && ride < 0 ? sstep(0.64, 0.86, wNow) : 1;
  const here = k > 0.9 && p.present && !touch;
  // the hand comes and goes on the clock (round it the mark's crust is blown off and settles back: never in one
  // frame), and it settles exactly
  if (dt > 0) OS.pin += clamp((here ? 1 : 0) - OS.pin, -dt / 0.5, dt / 0.22);
  if (here) { OS.px = Math.round(p.x); OS.py = Math.round(p.y); }
  const words = orbitNames(), face = labelFace(vw);
  OS.t = c.time;
  // (wave 9, J2r RAIL) on the rail: the figure stands at its place (at: 0 for Now, the rail's first scene; the pass draws
  // it through the stage's camera, which stands at the eye's place) and stays whole until the pan has taken it out of
  // the frame (away 0.92: its right edge has passed the screen's left edge by then, measured); the band its one name may
  // stand in is the band seen from the eye (bx0..bx1 moved by at - eye), so a name leaves the frame under its body,
  // never held at the screen's edge
  const at = RA ? RA.at : 0, rv = RA ? RA.at - RA.eye : 0;
  const ask = {
    x: r1(P.cx + lx + at), y: r1(P.cy + ride + ly), z: r1(zq), hx: r1(P.cx + at), hy: r1(P.cy), A: r1(P.A),
    k: r4(k), a: r3(enter * lit * (RA ? 1 - sstep(0.92, 1, away) : 1 - sstep(0.3, 0.8, gone)) * leave), ax: r4(OS.tx), ay: r4(OS.ty), flash: r3(OS.flash),
    px: OS.pin > 0 ? OS.px || 0 : 0, py: OS.pin > 0 ? OS.py || 0 : 0, pin: r3(OS.pin), phone: L.tall ? 2 : L.stacked ? 1 : 0, all: all ? 1 : 0,
    // where a word may stand: clear of the header and of Now's text (the column on a desktop, the block under the band;
    // with the captions, the band above them)
    lab: [Math.round(bx0 + rv), 72 + safe, Math.round(bx1 + rv), Math.round(L.tall ? L.top + ride : L.stacked ? L.top - 6 + ride : vh - 8)],
    words, font: face,
  };
  // (wave 9, J2b NOW) the bodies condense earlier on a phone held upright (the arrival above)
  if (L.tall) ask.c0 = 0.5;
  return { ask, P, lx, ly, ride, gone, tall: L.tall, rail: !!RA };
}

/* ================================================================ the glow behind the figure (it was the plate's)
 * A squared-off glow, flat and soft past its edges, with a long faint band at a shallow slant; drawn from a
 * low-discrepancy sequence so every region of the glow gets its fair share of points: one smooth soft field. It stood
 * behind the plate, as wide as the glass; now it stands behind the mark, cut to about twice the mark's height. */
const GN = 40000;
const GLOW = 0.8;          // the glow's share of the points (the rest: the band)
/** the d-dimensional R sequence (Roberts): the k-th coordinate of point i, in [0, 1) */
const PHI6 = (() => { let x = 1.2; for (let k = 0; k < 40; k++) x = Math.pow(1 + x, 1 / 7); return x; })();
const AL = [1, 2, 3, 4, 5, 6].map((k) => 1 / Math.pow(PHI6, k));
const R = (/** @type {number} */ i, /** @type {number} */ k) => (0.5 + i * AL[k]) % 1;
/** an even spread of u in (0, 1) to a normal deviate (logistic approximation, enough for a soft edge) */
const nrm = (/** @type {number} */ u) => { const v = Math.min(1 - 1e-6, Math.max(1e-6, u)); return 0.5513 * Math.log(v / (1 - v)); };
/** @param {{ sw: number, sh: number, z: number, D: number }} q */
function glowSet(q) {
  const d = new Float32Array(GN * 4), a = 0.26, ca = Math.cos(a), sa = Math.sin(a), ng = Math.round(GN * GLOW);
  const sg = (/** @type {number} */ u, /** @type {number} */ e) => { const t = u * 2 - 1; return Math.sign(t) * Math.pow(Math.abs(t), 0.7) + nrm(e) * 0.16; };
  for (let i = 0; i < GN; i++) {
    const z = q.z + nrm(R(i, 4)) * 30, s = q.D / (q.D - z);
    let x, y, w;
    if (i < ng) { x = sg(R(i, 0), R(i, 2)) * q.sw * 0.5; y = sg(R(i, 1), R(i, 3)) * q.sh * 0.5; w = 0.62 + 0.38 * R(i, 5); }
    else {
      const j = i - ng, u = nrm(R(j, 0)) * q.sw * 0.75, v = nrm(R(j, 1)) * q.sh * 0.07;
      x = u * ca - v * sa; y = u * sa + v * ca; w = 0.65 + 0.35 * R(j, 5);
    }
    d[i * 4] = x / s; d[i * 4 + 1] = y / s; d[i * 4 + 2] = z; d[i * 4 + 3] = w;
  }
  return { data: d, path: 0, closed: false };
}
const glow = {
  share: 0.3, fill: 1, fit: "px", inkArea: 300000, capacity: GN, carry: 1, emit: 0,
  targets: () => glowSet({ sw: 600, sh: 600, z: -520, D: 2100 }),
  look: { ink: 0.16, size: 1.3, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3.6, speed: 1600, inertia: 0.22, fuzz: 0 },
  flow: { amp: 1.2, wavelength: 900, evolution: 0.02, z: 0.2 },
  respond: { hand: 0.3, wind: 0.5, fadeIn: 1.2, fadeOut: 1.2 },
  /** @param {any} c */
  update(c) {
    const q = C.field;
    if (q) {
      const key = `${Math.round(q.sw / 6)},${Math.round(q.sh / 6)},${Math.round(q.z / 8)},${Math.round(q.D / 20)}`;
      if (c.state.key !== key) { c.state.key = key; c.setTargets(glowSet(q)); }
    }
    // the ink per point scales with the rect's area (inkArea): a phone's plate is a quarter of the tuned one
    // (wave 8, ORRERY) the glow stood behind a plate whose capture covered it; behind a mark of light it is bare, and at
    // the plate's strength it drowned the mark in fog (a phone's most): it was { ink: 2.2 } on a phone, 1 elsewhere
    return { ink: q && q.phone ? 0.55 : 0.5 };
  },
};

export default {
  formations: { field: glow },
  blend: false,
  // the figure brings itself in, as the plate did (README "The glass signal"): the host adds no focus pull of its own
  glassEntry: true,
  /** @param {any} c */
  frame(c) {
    const vw = c.vw, vh = c.vh, y = c.scrollY, phone = c.phone;
    // the pass's module, where the listener above was taken with a page before the stage's first frame
    if (!orAsked && document.documentElement.classList.contains("stage-on")) orLoad();
    // Now's top in the document: the end of the cover's flight
    const nowTop = Math.max(1, c.section.y + y);
    C.nowTop = nowTop;
    const k = flightK(c);
    // (wave 8, ORRERY) the figure where the plate stood (its place, lift, ride, spring, flash and presence are
    // orreryAsk's, the plate's own laws); P is the glow's footprint behind the mark, as the plate's was behind it:
    // about twice the mark's height
    // (wave 9, J2b NOW) gone: how far Now has gone past (with the captions, from its last caption's let-go; orreryAsk)
    const { ask, P: F, lx, ly, ride, gone, tall, rail } = orreryAsk(c);
    const side = clamp(1.9 * F.H, 110, 480);
    const P = { cx: F.cx, cy: F.cy, w: side, h: side, cz: 0 };
    const enter = ask.a;
    // ------------------------------------------------ the field behind the plate (FZ behind the page, out of focus)
    const FZ = -520, D = clamp(1.25 * Math.hypot(vw, vh), 1100, 2600), kP = D / (D - P.cz), kF = D / (D - FZ);
    C.field = { sw: P.w * kP, sh: P.h * kP, z: FZ, D, phone };
    // only from the flight on: at rest the hall's four formations (the name's face and depth, the shafts, the sheen)
    // hold the stage's four slots
    // (round 12, COVER3FIX) only once the name's points have gone dark behind the lens (world.js gone(), k 0.42-0.5):
    // handed over while dark, they appear on the glow's places instead of flying across the screen as blue streaks
    // (wave 9, J2r RAIL) on the rail the glow stands deeper than the mark and so lags it in the pan (true parallax): it
    // goes over the pan's second half, as the figure leaves the frame (gone: how far the eye has travelled, in steps)
    const hw = mix(0.3, 1, sstep(0.55, 1, k)) * enter * sstep(0.52, 0.62, k) * (1 - (rail ? sstep(0.6, 1, gone) : sstep(0.3, 0.8, gone)));
    // Now's keep-outs once the letters are behind the eye (during the pass they cut rectangles out of them)
    // (round 12, COVER3FIX) the title from the live DOM (the host's rect of it is taken under its rise mask), and the
    // header's words: no chip over them
    // (wave 9, J2b NOW) with the captions the title is held at the foot inside its caption, which is a text block of its
    // own (measured where it is held, its lines' rise undone): the live title's rect, read twice a second and then
    // moved with the page, would wander off a held title into the band between two reads
    // (wave 9, J2b NOW) and with the captions from the start: the first caption's block is a text only while it is shown
    // (its step holds the reading line, a little before it rises into the screen), so it asks for nothing earlier; but
    // a flick runs the scroll far ahead of the flight's damped k, and the caption's first line came up into the cosmos's
    // light before k reached 0.45 (strips t4: p95 up to 93 over its first line at the screen's foot)
    const keep = k < 0.45 && !tall ? [] : c.texts.filter((/** @type {any} */ r) => r.tag !== "h2").map((/** @type {any} */ r) => ({ x: r.x - 16, y: r.y - 16, w: r.w + 32, h: r.h + 32 })).concat(liveKeeps(c, !tall));
    if (gone >= 1) return null;
    // the hall's chips and wall at the end of the flight and in Now's own view (the same numbers as the hero's, so the
    // host's blend is one field; the hero alone brings the light): the plate arrives among the SerSan marks, which
    // thin out as Now leaves
    let field;
    if (k > 0.88 || y >= nowTop) {
      field = hallField(c, { at: C.at ?? 99, k });
      // (wave 7, STAGE) the hall's back is the cosmos now (no `wall`): reading field.wall threw here and the host marked
      // the scene broken for good (no plate, no keep-outs over Now's text from the first frame of the flight on). In the
      // home the cosmos runs on behind Now into the gallery's room: only the chips thin out as Now leaves
      if (field) { const g = 1 - sstep(0.05, 0.5, gone); field.chips.alpha *= g; if (field.wall) field.wall.alpha *= g; }
    }
    const fx = vw / 2 + (P.cx + lx - vw / 2) * (kP / kF), fy = vh / 2 + (P.cy + ride + ly - vh / 2) * (kP / kF);
    // (wave 8, ORRERY) the pass is asked for beside the name's splats, when those are on; never while it is dark
    // (nothing of it is drawn on the first half of the flight)
    const sp = SN ? SN.nameFrame(c) : null;
    const passes = OR && ask.a > 0 ? { ...(sp || {}), orrery: ask } : sp;
    // (wave 7, STAGE) the cover's one shot is one look: Now asks the hero's (the host mixes the scenes' looks by weight,
    // and a scene that asks none counts at the stage's defaults: Now would have pulled the hall's depth in mid-flight)
    // (wave 9, J2b NOW) the soft keep-outs while Now holds the frame (half a screen past its top; with the captions, until
    // half a screen past its last caption's let-go: gone is that measure in both)
    if (typeof c.look === "function") c.look({ far: Math.round(-2.6 * D), near: Math.round(4.7 * D), keepFeather: k > 0.45 && gone < 0.5 ? 40 : 6 });
    return {
      ...(passes ? { passes } : {}),
      swarm: [{ id: "field", weight: hw, rect: { x: fx - P.w / 2, y: fy - P.h / 2, w: P.w, h: P.h } }],
      // (wave 8, ORRERY) no slab any more: the figure is the pass's
      slabs: [],
      keepouts: keep,
      camera: coverCamera(c), field,
      // (wave 8, ORRERY) the system turns on the stage's clock: the long rest window in Now's own view too (it was the flight's only)
      rest: 14,
      // (wave 8, ORRERY) the mark is light: it glows a little in place (the capture was a picture, 0.12), more on a press
      bloom: { strength: mix(0.6, phone ? 0.14 : 0.24, sstep(0.45, 1, k)) + 0.12 * ask.flash, threshold: 0.36, plates: mix(0.12, 0.03, k) },
    };
  },
};

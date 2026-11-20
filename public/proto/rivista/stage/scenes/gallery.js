// @ts-check
/**
 * gallery — the Work page's nine works (spec 50 §4): nine thick plates of clear glass standing on a curved line in
 * depth, and the reader's scroll is the camera travelling along it.
 *
 * THE FRAME (decided before it was built, then corrected on captures; docs/redesign/rivista-story/build/z-work.md):
 *  - The text of the step holds the left column; the glass holds the figure's half. The plate in step stands at the
 *    apex of an arc that bulges toward the reader: near (cz > 0), sharp, almost square to the eye, the pointer tilting
 *    it a few degrees with inertia. The next plates queue behind it, up and to the right, each deeper, smaller, turned
 *    further from the eye, softer and dimmer, seen through the near plate's glass. The plate that has been read swings
 *    out past the camera to the right, nearer and out of focus, and leaves the frame.
 *  - Under them a fine line of light runs along the arc, where the plates stand: thin it is cobalt, where its strands
 *    gather it is white; its points drift along it with the travel. Behind everything the room's mist, turning a little
 *    with the travel so the depth reads.
 *  - Inside the step the plates hold still (the reader is reading); they travel only across the boundary between two
 *    steps, while the text itself is pulling focus. Every motion is damped on the host's clock and follows the scroll:
 *    it never runs on its own and never fights the reader.
 *  - Six plates hold the work's real capture at mid-thickness (<img data-slab> in the step); three are clear glass with
 *    the case's own key words etched and frosted in the display face (read from the step's [data-slab-words]: the
 *    words live in parts/cases.json, never in this file).
 *
 * Placement is composed in SCREEN space (where a plate should appear, how wide) and converted to the stage's world
 * through its own perspective (stage.js: eye distance D = 1.25 x the viewport diagonal, 1100..2600 px, eye at the
 * viewport's centre), so the composition holds from a phone to a wide screen whatever the depth.
 */
import mistDef from "../night/mist.js";
import { room } from "./lib/room.js";
import { speedLens, drift } from "./lib/camera.js";
import { span, pageK, through } from "./lib/page.js";
import { lifted } from "./case/lift.js";

/* (lane m-fly) THE LIFTED CAPTURES ARE ASKED FOR ONE AT A TIME while the eye arrives. Asked together on the room's first
   frame, the six pictures decoded together and their levels were set back to back in one task of about 50 ms: the hole
   in the frames just inside the door on a first visit. A capture not asked yet is asked 45 ms after the one before it
   (the plate shows the capture as it is meanwhile, as it did for the frame or two the lift took) */
/** @type {Set<string>} */ const LIFT = new Set();
let liftAt = -1e9;

const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sm = (/** @type {number} */ e0, /** @type {number} */ e1, /** @type {number} */ x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const damp = (/** @type {number} */ cur, /** @type {number} */ to, /** @type {number} */ dt, /** @type {number} */ tau) => cur + (to - cur) * (1 - Math.exp(-dt / Math.max(tau, 1e-4)));

/** the stage's eye distance for a viewport (stage.js LOOK.eye, clamped as there) */
const eyeD = (/** @type {number} */ vw, /** @type {number} */ vh) => Math.min(2600, Math.max(1100, 1.25 * Math.hypot(vw, vh)));
/** perspective scale of depth z (px toward the reader) */
const persp = (/** @type {number} */ D, /** @type {number} */ z) => D / Math.max(D - z, 1);
const ease = (/** @type {number} */ x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

/** the room's seed for every scene of the Work page (their blades coincide in a crossfade) */
export const WORK_SEED = 4;
/** the subject's light behind a plate (the room's default 0.42 lit the whole grid evenly behind a capture) */
export const SUBJECT_K = 0.36;
/** the soft fall of the light round the kept-clear text (px): a lit wall cut at 40 px still read as a dark card */
export const KEEP_FEATHER = 90;
/** on a phone the measured bars run 11–18 px under their rows' text: a long fall would put them out */
export const KEEP_FEATHER_PHONE = 24;
/** a phone's room: its wall fills the narrow screen behind the text, so it stays near its unlit level (a lit grid
 *  round the kept-clear text read as dark cards) */
export const PHONE_DIM = 0.1;

/**
 * (wave 1, lane WORK) THE EYE OF THE WORK PAGE: one continuous shot from the head of the gallery to the dawn. Both
 * scenes of the page (gallery, evidence) ask this for the eye, from the document's scroll alone, so the host mixes two
 * equal poses and the eye never jumps. It starts a little back, low and left (the room seen whole), pushes in and
 * pans right along the gallery while the plates come up the arc, and holds square to the page by the measured rows
 * (whose bars of light must stay on their lines: the eye is at the straight view's depth there). Returns the offset
 * from the straight view (px; z toward the reader), the room's temperature (cool at the top, warm toward the dawn) and
 * the straight view's depth D.
 * @param {any} c
 */
export function workEye(c) {
  const vw = c.vw, vh = c.vh, D = eyeD(vw, vh), ph = vw < 1024;
  const g = span(c, '[data-stage="gallery"]'), e = span(c, '[data-stage="evidence"]');
  const kg = ease(through(c, g)), ke = ease(through(c, e));
  const A = ph ? [-0.04 * vw, 0.03 * vh, 0.06 * D] : [-0.05 * vw, 0.05 * vh, 0.07 * D];
  const B = ph ? [0.05 * vw, -0.02 * vh, 0] : [0.1 * vw, -0.03 * vh, 0];
  const E = ph ? [0.02 * vw, 0.01 * vh, 0] : [0.04 * vw, 0.015 * vh, 0];
  const d = A.map((a, i) => a + (B[i] - a) * kg + E[i] * ke);
  return { d, D, pos: [vw / 2 + d[0], vh / 2 + d[1], D + d[2]], temp: 0.12 + 0.7 * pageK(c) };
}

/** a placement composed in SCREEN px as the straight view would see it (X, Y, depth z) to the stage's world, for an eye
 *  translated by C (straight look): the plate draws where it was composed whatever the eye's travel
 *  @param {number[]} C @param {any} L @param {number} X @param {number} Y @param {number} z */
function toWorld(C, L, X, Y, z) {
  const d = L.D - z;
  return { cx: C[0] + ((X - L.vw / 2) * d) / L.D, cy: C[1] + ((Y - L.vh / 2) * d) / L.D, cz: C[2] - d, s: L.D / Math.max(d, 1) };
}

/** where the plates stand. u = the plate's place on the arc relative to the reader: 0 the plate in step, 1, 2, … the
 *  ones queued behind, −1 the one just read. Returns the plate's SCREEN centre (X, Y), its depth z, yaw, focus and
 *  presence.
 *  (wave 1, lane WORK) the queue is a dolly: the plates stand on a line in the room that runs deep toward the upper
 *  right (its vanishing point), one plate a step apart; the reader's scroll moves the eye along that line, so the next
 *  plate grows and slides into the apex as a real approach in perspective (never a swap in place). The plate just read
 *  swings out past the eye to the right. @param {number} u @param {any} L the layout */
function arc(u, L) {
  if (u >= 0) {
    const d0 = L.D - L.cz, sz = L.sz;
    const lx = ((L.ax - L.vw / 2) * d0) / L.D + (u * (L.vpx - L.vw / 2) * sz) / L.D;
    const ly = ((L.ay - L.vh / 2) * d0) / L.D + (u * (L.vpy - L.vh / 2) * sz) / L.D;
    const d = d0 + u * sz;
    return {
      X: L.vw / 2 + (lx * L.D) / d,
      Y: L.vh / 2 + (ly * L.D) / d,
      z: L.D - d,
      yaw: L.yaw0 - 0.3 * clamp(u, 0, 1.4),
      sharp: 1 - 0.75 * sm(0, 1.2, u),
      alpha: 1 - sm(2.6, 3.5, u),
    };
  }
  // the plate just read leaves twice as fast as the next arrives: it is gone before the next is halfway in
  const v = -u * 1.9;
  return {
    X: L.ax + L.pw * 1.1 * v + L.pw * 0.3 * v * v,
    Y: L.ay + L.ph * 0.18 * v,
    z: L.cz + (L.phone ? 280 : 420) * v,
    yaw: L.yaw0 + 0.55 * v,
    sharp: 1 - 0.85 * sm(0, 0.7, v),
    alpha: 1 - sm(0.3, 0.85, v),
  };
}

/** the opening frame (the head, "Nine works"): the nine plates at once, a row of glass standing in depth across the
 *  figure's half, each turned like the next, the first nearest. @param {number} i 0..8 @param {any} L */
function lineup(i, L) {
  const k = i / 8;
  return L.phone
    ? { X: L.vw * 0.3 + L.vw * 0.56 * k, Y: L.ay + L.ph * 0.12 - L.ph * 0.5 * k, z: -40 - 900 * k, yaw: -0.62, sharp: 1 - 0.55 * k, alpha: 1, scale: 0.62 }
    : { X: L.fx + L.fw * 0.2 + L.fw * 0.64 * k, Y: L.ay + L.ph * 0.1 - L.ph * 0.42 * k, z: -40 - 1500 * k, yaw: -0.66, sharp: 1 - 0.6 * k, alpha: 1, scale: 0.6 };
}

/** the layout of the scene for this viewport and figure half @param {any} c */
function layout(c) {
  const phone = c.vw < 1024, f = c.fig, vw = c.vw, vh = c.vh;
  // the near plate: 4:3 like the captures, as large as the figure's half allows with room for the queue on its right
  const pw = phone ? Math.min(vw * 0.7, (f.h - 90) * 1.25) : Math.min(f.w * 0.62, vh * 0.58 * (4 / 3), 700);
  const ph = pw * 0.75;
  const ax = phone ? vw * 0.42 : f.x + Math.max(pw * 0.5 + 24, f.w * 0.36);
  // phone: 0.40 of the height (was 0.42): the larger type of chain 10 lifts the step's first line into the plate's foot
  const ay = phone ? Math.max(64 + ph * 0.75, vh * 0.4) : vh * 0.53;
  return {
    phone, vw, vh, fx: f.x, fw: f.w, pw, ph, ax, ay, cz: phone ? 30 : 46, yaw0: phone ? -0.2 : -0.28, D: eyeD(vw, vh), t: phone ? 22 : 34,
    // the line's vanishing point (screen) and the step between two plates along it (px of depth)
    vpx: phone ? vw * 0.9 : vw * 0.95, vpy: phone ? vh * 0.08 : vh * 0.17, sz: phone ? 560 : 780,
  };
}

/** the room's mist, turning a little with the travel */
const mist = { ...mistDef, update(/** @type {any} */ c) { return { rotate: [0, ((c.scene.progress || 0) - 0.5) * 0.16, 0] }; } };

/** the etched key words: the figure fitted large to the plate's width, the line under it, both in the display face,
 *  capitals, white on transparent (the stage frosts the alpha into the glass) @param {string} fig @param {string} line */
function etchCanvas(fig, line) {
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
  // the line: wrapped to the width, a fifth of the figure's size at most
  // (wave 2, GLOW-WORK) larger: the line read as small print on the glass
  const ls = Math.min(size * 0.27, 136);
  g.font = `800 ${ls}px ${face}`;
  const words = Ln.split(/\s+/), rows = [];
  let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > W - 2 * pad && cur) { rows.push(cur); cur = w; } else cur = t; }
  if (cur) rows.push(cur);
  let y = H - pad - (rows.length - 1) * ls * 0.92;
  for (const r of rows) { g.fillText(r, pad, y); y += ls * 0.92; }
  return cv;
}

export default {
  // (FIX3D) its plates give way to the evidence's text as it comes up
  yields: true,
  formations: { mist },
  /** @param {any} c */
  frame(c) {
    const S = c.state;
    // the works in gallery order: the capture of each step, or its key words
    if (!S.works) {
      const sec = document.querySelector('[data-stage="gallery"]');
      S.works = sec ? [...sec.querySelectorAll("li[data-stage-step]")].map((li) => {
        const img = li.querySelector("img[data-slab]"), words = li.querySelector("[data-slab-words]");
        return {
          n: parseInt(li.getAttribute("data-stage-step") || "0", 10),
          slab: img ? img.getAttribute("data-slab") : null,
          words: words ? (words.getAttribute("data-slab-words") || "w") : null,
          fig: words ? (words.querySelector(".wk-words-fig")?.textContent || "").trim() : "",
          line: words ? (words.querySelector(".wk-words-line")?.textContent || "").trim() : "",
          etched: false,
        };
      }) : [];
      S.s = null; S.tilt = { x: 0, y: 0, vx: 0, vy: 0 };
    }
    const L = layout(c);
    const EYE = workEye(c), C = EYE.pos;
    const dt = Math.min(c.dt || 0, 0.1);
    // (FIX3D) a phone: the step's text scrolls through the plate's band, and the plate hid there (Voice AI and Supply
    // Chain had no plate at all, the etched ones were ghosts): the apex moves into the tallest band no text crosses
    // (damped) and the plate fits it
    if (L.phone) {
      // (wave 2, GLOW-WORK) ONE band per step: measured while the step's text rests (the middle of the step) and kept
      // through the step's edges, where a text block passing through the screen moved the apex from band to band (it
      // hopped); a text block crossing the kept band hides the plate (below), it never moves it
      S.bands = S.bands || {};
      // a step not yet measured takes the last one's: at rest every step lays out alike, so the apex never moves
      let band = S.bands[c.step] || S.lastBand;
      if (!band || (c.local > 0.3 && c.local < 0.7)) {
        const cuts = c.texts.map((/** @type {any} */ r) => [r.y - 16, r.y + r.h + 16]).sort((/** @type {number[]} */ p, /** @type {number[]} */ q) => p[0] - q[0]);
        let best = [0, 0], at = 70;
        for (const [p, q] of cuts) { if (p - at > best[1] - best[0]) best = [at, p]; at = Math.max(at, q); }
        if (c.vh - at > best[1] - best[0]) best = [at, c.vh];
        // outside the middle of a step a band is only taken when there is none yet (a reload mid-step)
        if (c.local > 0.3 && c.local < 0.7 ? best[1] - best[0] > 150 : !band) band = S.bands[c.step] = best;
        S.lastBand = band;
      }
      const gh = band[1] - band[0];
      if (gh > 150) {
        const ay = band[0] + gh * 0.5;
        // between two steps the apex glides from one step's band to the next with the travel (never on its own)
        S.ay = S.ay == null || dt <= 0 ? ay : damp(S.ay, ay, dt, 0.45);
        const pwMax = Math.max(130, (gh - 30) / 0.75 / 1.06);
        if (L.pw > pwMax) { L.pw = pwMax; L.ph = L.pw * 0.75; }
        L.ay = S.ay;
        L.band = band;
      }
    }

    // the reader's place along the arc: plates hold through the middle of a step, travel across its edges
    // (FIX3D) one long glide: half the travel runs evenly through the whole step, the other half eases across the
    // boundary (a hold in the middle and a quick dolly at the edge read as a cut between plates)
    // (wave 2, GLOW-WORK) most of the travel now runs where the two steps' texts trade places (the outer fifth of each
    // step): with half of it spread through the step, a fast reader saw the next work's plate beside this one's text
    // centred where the two texts trade places: a step's title is on screen from about 0.2 of its step to 0.2 of the
    // next (measured: .shots/r-work/_scripts/gdbg.mjs), so the plates glide there, never beside the other work's text.
    // Continuous across the boundary: the reader's place x on the line of works, the nearest work n, the glide r about it
    const off = 0.22;
    const hold = (/** @type {number} */ x) => { const n = Math.round(x), r = x - n; return n + r * 0.16 + Math.sign(r) * 0.42 * sm(0.24, 0.5, Math.abs(r)); };
    // the last plate stays at the apex: it leaves with the scene, as the measured figures come up
    const last = Math.max(0, S.works.length - 1);
    const target = c.step === 0 ? -0.5 * sm(0.45, 1, c.local) : Math.min(last, Math.max(-0.5, hold(c.step - 1 + c.local - 0.5 - off)));
    S.s = S.s == null ? target : dt > 0 ? damp(S.s, target, dt, 0.16) : S.s;
    if (Math.abs(S.s - target) < 1e-4) S.s = target;
    const s = S.s;
    if (S.dbg ??= /[?&]debug=1/.test(location.search)) /** @type {any} */ (window).__gallery = { sy: Math.round(c.scrollY), wy: Math.round(window.scrollY), step: c.step, local: c.local, s, target, texts: c.texts.map((/** @type {any} */ t) => Math.round(t.y)) };

    // the pointer tilts the near plate, with inertia (a damped spring on the host's clock)
    const T = S.tilt;
    const px = c.pointer.present && !L.phone ? c.pointer.nx : 0, py = c.pointer.present && !L.phone ? c.pointer.ny : 0;
    if (dt > 0) {
      const k = 16, d = 2 * 0.6 * Math.sqrt(k);
      T.vx += (k * (px * 0.11 - T.x) - d * T.vx) * dt; T.x += T.vx * dt;
      T.vy += (k * (-py * 0.07 - T.y) - d * T.vy) * dt; T.y += T.vy * dt;
    }

    // etched plates: drawn once the display face is in
    const fontsIn = !document.fonts || document.fonts.check('800 100px "Sofia Sans Extra Condensed"');
    if (fontsIn) for (const w of S.works) if (w.words && !w.etched) { w.etched = true; c.texture("etch-" + w.words, etchCanvas(w.fig, w.line)); }

    // the opening frame gives way to the travel as the first work comes up
    const kTo = c.step === 0 ? 1 - sm(0.45, 1, c.local) : 0;
    S.k = S.k == null ? kTo : dt > 0 ? damp(S.k, kTo, dt, 0.16) : S.k;
    const K = S.k;

    // PHONE lane (chain 9): on a phone the queue stands almost straight behind the near plate. When the work in step is
    // clear glass with etched words, a bright capture behind its face sat behind the words (SerSan behind Maintech's
    // "9"): while a clear plate is in step the queue steps aside and, where it is still behind the face, dims away.
    // clear: how much the plate at the apex is an etched one (0..1, eased across the step boundary like the travel)
    let clear = 0;
    // (wave 1, WORK) on a desktop too: the dolly's queue stands behind the apex, and a capture showed through the clear
    // glass of Maintech's "9"
    let clearI = -1;
    S.works.forEach((/** @type {any} */ w, /** @type {number} */ i) => { if (w.words) { const k = 1 - sm(0, 0.85, Math.abs(i - s)); if (k > clear) { clear = k; clearI = i; } } });
    clear *= 1 - S.k;
    const ps0 = persp(L.D, L.cz), face = { x0: L.ax - (L.pw * ps0) / 2, x1: L.ax + (L.pw * ps0) / 2, y0: L.ay - (L.ph * ps0) / 2, y1: L.ay + (L.ph * ps0) / 2 };

    /** @type {any[]} */ const slabs = [];
    S.works.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
      const u = i - s;
      let a = u < -0.7 || u > 3.5 ? null : arc(u, L), sc = 1;
      // (wave 2, FIX) the clear plate never steps aside from its own face (it dimmed itself as it arrived: the etched
      // plates passed dim for ~300 ms on a fast wheel, and Badante stood at 0.17 at its own step on a phone)
      if (a && clear > 0.001 && u > 0.05 && i !== clearI) {
        // aside: further right and deeper, then dimmed by how much of it is still behind the clear face
        const g = clamp(u, 0, 1) * clear;
        a.X += L.pw * (L.phone ? 0.44 : 0.8) * g; a.Y -= L.phone ? 0 : L.ph * 0.2 * g; a.z -= 160 * g;
        const ps = persp(L.D, a.z), hw = (L.pw * ps) / 2, hh = (L.ph * ps) / 2;
        const ox = Math.max(0, Math.min(face.x1, a.X + hw) - Math.max(face.x0, a.X - hw)), oy = Math.max(0, Math.min(face.y1, a.Y + hh) - Math.max(face.y0, a.Y - hh));
        a.alpha *= 1 - (L.phone ? 0.85 : 0.97) * clear * clamp((ox * oy) / (4 * hw * hh) * (L.phone ? 1.6 : 4));
      }
      if (K > 0.001) {
        const b = lineup(i, L);
        if (!a) a = { ...b, alpha: 0 };
        const m = (/** @type {number} */ x, /** @type {number} */ y) => x + (y - x) * K;
        a = { X: m(a.X, b.X), Y: m(a.Y, b.Y), z: m(a.z, b.z), yaw: m(a.yaw, b.yaw), sharp: m(a.sharp, b.sharp), alpha: m(a.alpha, b.alpha) };
        sc = m(1, b.scale);
      }
      if (!a || a.alpha < 0.01) return;
      // a plate draws over the page: where a block of text passes through it (a phone, between two steps, when the
      // leaving text scrolls up through the figure's part of the screen) the plate gives way, by how deep the text is in
      const ps = persp(L.D, a.z), hw = (L.pw * sc * ps) / 2 + 10, hh = (L.ph * sc * ps) / 2 + 10;
      // (wave 2, FIX) a phone: the plate in step stays inside its step's band. The glide's rest (r x 0.16) leaves the
      // apex plate a few hundredths up the line, which lifted it ~15 px into the last step's text box; the hide below
      // then took Badante's plate to 0.17 (a ghost at its own step)
      if (L.phone && L.band && u > -0.5 && u < 0.6) {
        const lo = L.band[0] + hh, hi = L.band[1] - hh;
        a.Y = lo <= hi ? clamp(a.Y, lo, hi) : (L.band[0] + L.band[1]) / 2;
      }
      let hide = 0;
      for (const t of c.texts) {
        const ix = Math.min(a.X + hw, t.x + t.w) - Math.max(a.X - hw, t.x), iy = Math.min(a.Y + hh, t.y + t.h) - Math.max(a.Y - hh, t.y);
        if (ix > 0 && iy > 0) hide = Math.max(hide, clamp(Math.min(ix, iy) / 40));
      }
      a.alpha *= 1 - hide;      // the last plate goes in the second half of its step (integrate: on a phone it lingered as a dim empty box
      // above "Measured before and after.")
      // (FIX3D) it stays to the end of its step: the host then steps it back from "Measured before and after." as that
      // head comes up under it (yields), so the room is never empty between the two
      if (i === last && c.step >= S.works.length) a.alpha *= 1 - sm(0.82, 1, c.step > S.works.length ? 1 : c.local);
      if (a.alpha < 0.01) return;
      const near = (1 - sm(0, 1, Math.abs(u))) * (1 - K);
      const p = toWorld(C, L, a.X, a.Y, a.z);
      const img = w.slab ? c.imgs[w.slab] : null;
      // (wave 2, GLOW-WORK) a dark capture lifted so it reads (case/lift.js)
      let lift = null;
      if (img && img.el) {
        if (LIFT.has(w.slab)) lift = img.tex ? lifted(c, "gallery", w.slab, img) : null;
        else { const now = performance.now(); if (now - liftAt > 45) { liftAt = now; LIFT.add(w.slab); lifted(c, "gallery", w.slab, img); } }
      }
      if (near > 0.5) S.apex = { x: p.cx, y: p.cy, z: p.cz, w: L.pw * sc, h: L.ph * sc };
      slabs.push({
        id: "w" + w.n, cx: p.cx, cy: p.cy, cz: p.cz,
        yaw: a.yaw + T.x * near, pitch: 0.02 + T.y * near, roll: 0,
        w: L.pw * sc, h: L.ph * sc, t: L.t * (0.7 + 0.3 * sc),
        tex: lift || (img ? img.tex : null), etch: w.words ? "gallery:etch-" + w.words : undefined,
        alpha: a.alpha,
        // an etched plate is clear glass: its edges carry it (and its words read); a capture's edges a little less
        glow: Math.min(1, w.words ? 0.7 + 0.4 * near + 0.2 * K : 0.45 + 0.5 * near + 0.25 * K), sharp: a.sharp,
        // (wave 3, LIGHT3) a narrow arris: cut glass with a thin lit line, not a rounded tube (11 px read as a metal frame)
        bevel: w.words ? 4.5 : 3.5,
        // (wave 2, GLOW-WORK) the bevels' own light: the glass is seen by its lit edges (plates.js s.edge)
        edge: (w.words ? 0.6 : 0.36) * (0.3 + 0.7 * Math.max(near, K)),
        // the broad face keeps a breath of the studio, never a grey card (an etched one: only its bevels)
        sheen: w.words ? 0.04 : 0.14,
      });
    });

    // ------------------------------------------------ the room (lib/room.js): the wall's grid, the chips, the blades;
    // the subject's light behind the plate at the apex. Cool at the top of the page, warm toward the dawn.
    const a0 = toWorld(C, L, L.ax, L.ay, L.cz), ap = S.apex || { x: a0.cx, y: a0.cy, z: a0.cz };
    const R = room(c, { temp: EYE.temp, seed: WORK_SEED, eye: C, subject: { x: ap.x, y: ap.y, z: ap.z, w: L.pw, h: L.ph, strength: L.phone ? SUBJECT_K * 0.5 : SUBJECT_K }, sweep: L.phone ? undefined : [0.05, 1], dim: L.phone ? PHONE_DIM : 0, glow: 1 });
    if (c.look) c.look({ ...R.look, keepFeather: L.phone ? KEEP_FEATHER_PHONE : KEEP_FEATHER });
    // ------------------------------------------------ the eye: the page's shot, a slow drift at rest on the stage's
    // clock, the hand orbiting it about the plate at the apex, the lens a little wider while the reader runs
    const dr = drift(c.clock ? c.clock.time : 0, L.phone ? 6 : 10);
    const pos = [C[0] + dr[0], C[1] + dr[1], C[2] + dr[2]];
    const piv = [ap.x, ap.y, ap.z];
    const enter = sm(0, 0.35, c.through);
    return {
      swarm: [
        { id: "mist", weight: 0.55, rect: { x: 0, y: 0, w: c.vw, h: c.vh }, scene: { step: c.step, local: c.local, progress: (s + 0.5) / 8.5 } },
      ],
      slabs,
      camera: {
        pos, target: [C[0] + dr[0] * 0.5, C[1] + dr[1] * 0.5, C[2] - L.D], lens: speedLens(1, c.speed),
        focus: Math.hypot(piv[0] - pos[0], piv[1] - pos[1], piv[2] - pos[2]), aperture: 0.9, damp: 0,
        orbit: { yaw: L.phone ? 0.16 : 0.18, pitch: 0.08, damp: 1.1, pivot: piv }, fog: [3 * L.D, 7 * L.D],
      },
      bloom: { strength: 0.5 * enter + 0.12, threshold: 0.5, knee: 0.3, plates: 0.16 },
      field: R.field,
      keepouts: R.keepouts,
      rest: 14,
    };
  },
};

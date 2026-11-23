// @ts-check
/**
 * gallery — the Work page's works (spec 50 §4; eleven since wave 7): thick plates of clear glass standing on a curved line in
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
import { speedLens, drift, follow, glideK } from "./lib/camera.js";
import { span, pageK, through } from "./lib/page.js";
import { lifted } from "./case/lift.js";
// (wave 7, STAGE) one etched drawing for the gallery and a case's opening plate (balanced rows, a size floor)
import { etchCanvas } from "./case/etch.js";

/* (lane m-fly) THE LIFTED CAPTURES ARE ASKED FOR ONE AT A TIME while the eye arrives. Asked together on the room's first
   frame, the six pictures decoded together and their levels were set back to back in one task of about 50 ms: the hole
   in the frames just inside the door on a first visit. A capture not asked yet is asked 45 ms after the one before it
   (the plate shows the capture as it is meanwhile, as it did for the frame or two the lift took) */
/** @type {Set<string>} */ const LIFT = new Set();
let liftAt = -1e9;

const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sm = (/** @type {number} */ e0, /** @type {number} */ e1, /** @type {number} */ x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

/** the stage's eye distance for a viewport (stage.js LOOK.eye, clamped as there) */
const eyeD = (/** @type {number} */ vw, /** @type {number} */ vh) => Math.min(2600, Math.max(1100, 1.25 * Math.hypot(vw, vh)));
/** perspective scale of depth z (px toward the reader) */
const persp = (/** @type {number} */ D, /** @type {number} */ z) => D / Math.max(D - z, 1);
const ease = (/** @type {number} */ x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

/** the room's seed for the Work page (it was shared with the page's second scene, evidence, removed on 22 November,
 *  so that their blades coincided in the crossfade) */
const WORK_SEED = 4;
/** the subject's light behind a plate (the room's default 0.42 lit the whole grid evenly behind a capture) */
const SUBJECT_K = 0.36;
/** the soft fall of the light round the kept-clear text (px): a lit wall cut at 40 px still read as a dark card */
const KEEP_FEATHER = 90;
/** on a phone a short fall: it was set for the measured bars that ran 11–18 px under their rows' text (the scene
 *  evidence, removed on 22 November); the gallery has drawn with it since, and keeps it */
const KEEP_FEATHER_PHONE = 24;
/** a phone's room: its wall fills the narrow screen behind the text, so it stays near its unlit level (a lit grid
 *  round the kept-clear text read as dark cards) */
const PHONE_DIM = 0.1;

/**
 * (wave 1, lane WORK) THE EYE OF THE WORK PAGE: one continuous shot from the head of the gallery to the dawn, read
 * from the document's scroll alone. It starts a little back, low and left (the room seen whole), pushes in and pans
 * right along the gallery while the plates come up the arc, and reaches the straight view's depth as the last plate
 * leaves; the next scene takes the eye from there (the dawn close's straight view on Work, About's stack in the
 * home). Until 22 November the page's second scene, evidence ("Measured before and after.", removed at Alberto's
 * word), asked this too and the eye held square to the page by its rows. Returns the offset from the straight view
 * (px; z toward the reader), the room's temperature (cool at the top, warm toward the dawn) and the straight view's
 * depth D.
 * @param {any} c
 */
function workEye(c) {
  const vw = c.vw, vh = c.vh, D = eyeD(vw, vh), ph = vw < 1024;
  const kg = ease(through(c, span(c, '[data-stage="gallery"]')));
  const A = ph ? [-0.04 * vw, 0.03 * vh, 0.06 * D] : [-0.05 * vw, 0.05 * vh, 0.07 * D];
  const B = ph ? [0.05 * vw, -0.02 * vh, 0] : [0.1 * vw, -0.03 * vh, 0];
  const d = A.map((a, i) => a + (B[i] - a) * kg);
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

/** the opening frame (the head, "Eleven works"): every plate at once, a row of glass standing in depth across the
 *  figure's half, each turned like the next, the first nearest. (wave 7, STAGE) spread over the works there are (L.n:
 *  it was i / 8, and with eleven works the last two stood past the row's end) @param {number} i 0..n-1 @param {any} L */
function lineup(i, L) {
  const k = i / Math.max(1, (L.n || 9) - 1);
  return L.phone
    ? { X: L.vw * 0.3 + L.vw * 0.56 * k, Y: L.ay + L.ph * 0.12 - L.ph * 0.5 * k, z: -40 - 900 * k, yaw: -0.62, sharp: 1 - 0.55 * k, alpha: 1, scale: 0.62 }
    : { X: L.fx + L.fw * 0.2 + L.fw * 0.64 * k, Y: L.ay + L.ph * 0.1 - L.ph * 0.42 * k, z: -40 - 1500 * k, yaw: -0.66, sharp: 1 - 0.6 * k, alpha: 1, scale: 0.6 };
}

/** (wave 9, J2a CAPTION) a phone's caption band: the room the header leaves at the top of the frame (its 64 px and a
 *  breath), and the share of the band's height the plate in step takes (the rest is air round it). (wave 9, J3
 *  VIEWPORT) The header is taller by the top safe area under a notch (c.safeTop, 0 elsewhere): the room follows it */
const CAP_HDR = 80, CAP_FILL = 0.84;

/** the layout of the scene for this viewport and figure half @param {any} c */
function layout(c) {
  const phone = c.vw < 1024, f = c.fig, vw = c.vw, vh = c.vh;
  const safe = c.safeTop || 0, capHdr = CAP_HDR + safe;   // (wave 9, J3 VIEWPORT)
  // the near plate: 4:3 like the captures, as large as the figure's half allows with room for the queue on its right
  let pw = phone ? Math.min(vw * 0.7, (f.h - 90) * 1.25) : Math.min(f.w * 0.62, vh * 0.58 * (4 / 3), 700);
  const ax = phone ? vw * 0.42 : f.x + Math.max(pw * 0.5 + 24, f.w * 0.36);
  // phone: 0.40 of the height (was 0.42): the larger type of chain 10 lifts the step's first line into the plate's foot
  let ay = phone ? Math.max(64 + safe + pw * 0.75 * 0.75, vh * 0.4) : vh * 0.53;
  const D = eyeD(vw, vh), cz = phone ? 30 : 46;
  /* (wave 9, J2a CAPTION) A PHONE WITH THE CAPTION AT THE FOOT (c.caption; css/scene.css): no text ever enters the
     figure's band (the host's c.fig: from the view's top to a gap above the tallest caption), so the plate in step
     stands in that band, whole and in one place for every step: centred under the header's room, as large as the band
     holds (its projected height CAP_FILL of the band) and never wider than the phone's plate was (0.7 of the width) */
  const cap = phone && c.caption ? c.caption : null;
  if (cap) {
    const top = f.y + capHdr, room = Math.max(120, f.y + f.h - top);
    pw = Math.min(vw * 0.7, (room * CAP_FILL) / 0.75 / persp(D, cz));
    ay = top + room / 2;
  }
  const ph = pw * 0.75;
  return {
    phone, cap, vw, vh, fx: f.x, fw: f.w, pw, ph, ax, ay, cz, yaw0: phone ? -0.2 : -0.28, D, t: phone ? 22 : 34,
    // the line's vanishing point (screen) and the step between two plates along it (px of depth)
    // (wave 9, J2a CAPTION) with the caption, the queue recedes toward a point inside the frame, under the header's room:
    // at 0.9 of the width the far plates stood cut by the screen's right edge (build/j-walk.md)
    vpx: cap ? vw * 0.76 : phone ? vw * 0.9 : vw * 0.95, vpy: cap ? f.y + capHdr : phone ? vh * 0.08 : vh * 0.17, sz: phone ? 560 : 780,
  };
}

/** the room's mist, turning a little with the travel */
const mist = { ...mistDef, update(/** @type {any} */ c) { return { rotate: [0, ((c.scene.progress || 0) - 0.5) * 0.16, 0] }; } };

export default {
  // (FIX3D) its plates give way to another scene's text as it comes up (in the home, About's head under the last plate)
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
    L.n = S.works.length;
    // (wave 9, J2a CAPTION) THE LAST FRAME LEAVES WHOLE. With the caption at the foot the scene's last caption is let go
    // as its step's end reaches the view's foot (css/scene.css: halfway through the step, the step's top at the view's
    // top) and leaves with the page, its room above the next scene's top: from that moment the band rises with it, the
    // plate kept above its caption as it was at rest, and both leave the frame together, as the head came in with the
    // opening row. (A plate swung out early left the band empty for the rest of the step; one standing still met the
    // rising caption.)
    if (L.cap && c.step >= S.works.length) L.ay -= Math.max(0, (c.local - 0.5) * c.vh);
    const EYE = workEye(c), C = EYE.pos;
    const dt = Math.min(c.dt || 0, 0.1);
    // (FIX3D) a phone: the step's text scrolls through the plate's band, and the plate hid there (Voice AI and Supply
    // Chain had no plate at all, the etched ones were ghosts): the apex moves into the tallest band no text crosses
    // (damped) and the plate fits it
    // (wave 9, J2a CAPTION) not with the caption at the foot (L.cap): no text crosses the band, the plate stands in it
    if (L.phone && !L.cap) {
      // (wave 2, GLOW-WORK) ONE band per step, kept through the step's edges; a text block crossing the kept band hides
      // the plate (below), it never moves it.
      // (wave 8, SMOOTH) THE BAND, FOLLOWED. It was measured again every frame while the step's middle crossed the
      // reading line (local 0.3..0.7), so it followed the text as the text scrolled, and froze outside: the plate's
      // place, size and clamp jumped 22 to 46 px in one frame as that window opened and closed. Now the band is the free
      // one the apex stands in, measured at every frame (it moves with the text, and stops when the page stops), and
      // the apex keeps to it unless another is clearly taller or it gets too short (a text passing through moved the
      // apex from band to band); the plate's place, size and limits ride springs toward it (follow)
      const cuts = c.texts.map((/** @type {any} */ r) => [r.y - 16, r.y + r.h + 16]).sort((/** @type {number[]} */ p, /** @type {number[]} */ q) => p[0] - q[0]);
      /** @type {number[][]} */ const bands = [];
      let at = 70;
      for (const [p, q] of cuts) { if (p > at) bands.push([at, p]); at = Math.max(at, q); }
      if (c.vh > at) bands.push([at, c.vh]);
      const size = (/** @type {number[]} */ b) => b[1] - b[0];
      const best = bands.reduce((p, q) => (size(q) > size(p) ? q : p), [0, 0]);
      const ref = typeof S.ayT === "number" ? S.ayT : L.ay, here = bands.find((b) => b[0] <= ref && b[1] >= ref);
      const band = here && size(here) > 150 && size(here) >= 0.8 * size(best) ? here : best;
      const gh = size(band), ok = gh > 150;
      if (ok) S.ayT = band[0] + gh * 0.5;
      // between two steps the apex glides from one step's band to the next on the springs (never a jump)
      L.ay = follow(S, "ay", typeof S.ayT === "number" ? S.ayT : L.ay, dt, 0.14, 0.01);
      L.pw = follow(S, "pwA", ok ? Math.min(L.pw, Math.max(130, (gh - 30) / 0.75 / 1.06)) : L.pw, dt, 0.14, 0.01);
      L.ph = L.pw * 0.75;
      if (ok) { follow(S, "b0", band[0], dt, 0.14, 0.01); follow(S, "b1", band[1], dt, 0.14, 0.01); }
      // how much the band holds the plate in step (0 while no band is tall enough), eased in and out
      L.bandK = follow(S, "bandK", ok ? 1 : 0, dt, 0.1, 1e-3);
      if (typeof S.b0 === "number") L.band = [S.b0, S.b1];
    }

    // the reader's place along the arc: plates hold through the middle of a step, travel across its edges
    // (FIX3D) one long glide: half the travel runs evenly through the whole step, the other half eases across the
    // boundary (a hold in the middle and a quick dolly at the edge read as a cut between plates)
    // (wave 2, GLOW-WORK) most of the travel now runs where the two steps' texts trade places (the outer fifth of each
    // step): with half of it spread through the step, a fast reader saw the next work's plate beside this one's text
    // centred where the two texts trade places: a step's title is on screen from about 0.2 of its step to 0.2 of the
    // next (measured: .shots/r-work/_scripts/gdbg.mjs), so the plates glide there, never beside the other work's text.
    // Continuous across the boundary: the reader's place x on the line of works, the nearest work n, the glide r about it
    // (wave 9, J2a CAPTION) with the caption at the foot the texts trade places in one place, at the step's boundary (the
    // reading line, where the caption changes): the glide is centred there
    const off = L.cap ? 0 : 0.22;
    // (wave 8, SMOOTH) ONE GLIDE PER BOUNDARY. The glide was two smoothsteps mirrored about the boundary, so its speed
    // fell back to the base slope exactly where the plates trade places: a hesitation mid-slide (0.64, 0.45, 0.64
    // plates/s inside one turn of the wheel). Now the 0.84 of the travel is ONE quintic across 0.24..0.76 of the way
    // (glideK: no speed and no acceleration at its ends) over the even base: the same places at rest, one bell of speed
    const glide = (/** @type {number} */ x) => { const n = Math.floor(x), f = x - n; return n + f * 0.16 + 0.84 * glideK(0.24, 0.76, f); };
    // the last plate stays at the apex: it leaves with the scene, as the next one comes up (the dawn, About's stack)
    const last = Math.max(0, S.works.length - 1);
    const target = c.step === 0 ? -0.5 * sm(0.45, 1, c.local) : Math.min(last, Math.max(-0.5, glide(c.step - 1 + c.local - 0.5 - off)));
    // (wave 8, SMOOTH) the plates ride a critically damped spring (lib/camera.js follow): they keep their speed when the
    // reader's scroll changes pace and come to rest with no corner in their speed (the first-order lag braked with one)
    const s = follow(S, "s", target, dt, 0.09);
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
    const K = follow(S, "k", kTo, dt, 0.09);

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

    /* (wave 7, STAGE) the opening row: a plate standing behind an etched one steps back from its face, by how much of it
       the face covers (with SerSan Agent OS first, SphereNode's own words read through the clear glass across "EARNED
       AUTONOMY"): the etched words read, the row still recedes behind them */
    const fronts = K > 0.001 ? S.works.map((/** @type {any} */ w, /** @type {number} */ i) => {
      if (!w.words) return null;
      const b = lineup(i, L), ps = persp(L.D, b.z), hw = (L.pw * b.scale * ps) / 2, hh = (L.ph * b.scale * ps) / 2;
      return { i, x0: b.X - hw, x1: b.X + hw, y0: b.Y - hh, y1: b.Y + hh };
    }).filter(Boolean) : [];
    // the top of the day on screen (the dawn close's straight edge), if any: see the plates' last rule below
    const day = c.dawn && c.dawn.length ? Math.min(...c.dawn.map((/** @type {any} */ d) => d.y)) : Infinity;
    /** @type {any[]} */ const slabs = [];
    S.works.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
      const u = i - s;
      let a = u < -0.7 || u > 3.5 ? null : arc(u, L), sc = 1;
      // (wave 2, FIX) the clear plate never steps aside from its own face (it dimmed itself as it arrived: the etched
      // plates passed dim for ~300 ms on a fast wheel, and Badante stood at 0.17 at its own step on a phone)
      if (a && clear > 0.001 && u > 0.05 && i !== clearI) {
        // aside: further right and deeper, then dimmed by how much of it is still behind the clear face
        const g = clamp(u, 0, 1) * clear;
        // (wave 9, J2a CAPTION) with the caption at the foot the queue steps UP out of the clear face (the band has room
        // above the plate): stepping right it stood cut by the screen's edge
        a.X += L.pw * (L.cap ? 0.14 : L.phone ? 0.44 : 0.8) * g; a.Y -= L.cap ? L.ph * 0.42 * g : L.phone ? 0 : L.ph * 0.2 * g; a.z -= 160 * g;
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
        let cover = 0;
        for (const f of /** @type {any[]} */ (fronts)) {
          if (f.i >= i) continue;
          const ps = persp(L.D, b.z), hw = (L.pw * b.scale * ps) / 2, hh = (L.ph * b.scale * ps) / 2;
          const ox = Math.max(0, Math.min(f.x1, b.X + hw) - Math.max(f.x0, b.X - hw)), oy = Math.max(0, Math.min(f.y1, b.Y + hh) - Math.max(f.y0, b.Y - hh));
          cover = Math.max(cover, (ox * oy) / Math.max(1, 4 * hw * hh));
        }
        // (run 2) 0.7 left SphereNode's capture reading through "EARNED AUTONOMY" (1:1, 1440): a plate mostly behind
        // an etched face is all but gone there (a tenth), the row still recedes past the face's edge
        a.alpha *= 1 - 0.9 * K * clamp(cover * 3);
      }
      if (!a || a.alpha < 0.01) return;
      // a plate draws over the page: where a block of text passes through it (a phone, between two steps, when the
      // leaving text scrolls up through the figure's part of the screen) the plate gives way, by how deep the text is in
      const ps = persp(L.D, a.z), hw = (L.pw * sc * ps) / 2 + 10, hh = (L.ph * sc * ps) / 2 + 10;
      // (wave 2, FIX) a phone: the plate in step stays inside its step's band. The glide's rest (r x 0.16) leaves the
      // apex plate a few hundredths up the line, which lifted it ~15 px into the last step's text box; the hide below
      // then took Badante's plate to 0.17 (a ghost at its own step)
      // (wave 8, SMOOTH) by a weight that eases in and out with the plate's place (it switched on and off at u -0.5 and
      // 0.6: a plate held up by the band dropped to its own place in one frame)
      const wc = L.phone && L.band ? L.bandK * sm(-0.6, -0.42, u) * (1 - sm(0.42, 0.62, u)) : 0;
      if (wc > 0) {
        const lo = L.band[0] + hh, hi = L.band[1] - hh;
        a.Y += ((lo <= hi ? clamp(a.Y, lo, hi) : (L.band[0] + L.band[1]) / 2) - a.Y) * wc;
      }
      // (wave 9, J2a CAPTION) with the caption at the foot no text of the gallery enters the band (c.texts holds only the
      // caption on screen, below it), so this never fires in the layouts it was built for (measured: 0 frames); it stays
      // as the guard for a caption taller than the screen leaves room for (a page zoomed far in), and there it takes the
      // glass off within 12 px, not 40 (the glass drawn over the first 40 px of a rising title: build/j-walk.md)
      let hide = 0;
      for (const t of c.texts) {
        const ix = Math.min(a.X + hw, t.x + t.w) - Math.max(a.X - hw, t.x), iy = Math.min(a.Y + hh, t.y + t.h) - Math.max(a.Y - hh, t.y);
        if (ix > 0 && iy > 0) hide = Math.max(hide, clamp(Math.min(ix, iy) / (L.cap ? 12 : 40)));
      }
      a.alpha *= 1 - hide;
      // the last plate goes in the last fifth of its step (integrate: on a phone it lingered as a dim empty box above
      // the next scene's head). (FIX3D) it stays to the end of its step and leaves as the next scene comes up under it:
      // on Work the dawn's edge, which takes the night's light with it (fx-stage.js nightRoom); in the home About's head,
      // which it steps back from (yields) while the stack comes in. Until 22 November the next scene was evidence
      // ("Measured before and after.", removed): the room is never empty between the two
      if (i === last && c.step >= S.works.length) a.alpha *= 1 - sm(0.82, 1, c.step > S.works.length ? 1 : c.local);
      // (k-evidence, 22 November) THE MORNING COMES UP UNDER THE PLATES: on Work the dawn close now follows the last
      // plate (the measured figures stood between them until then) and its glass crossed onto the paper as a grey slab.
      // A plate goes while the day's straight edge rises toward it, gone before the edge reaches its foot (as obla.js)
      if (day < Infinity) a.alpha *= sm(a.Y + hh, a.Y + hh + 0.12 * c.vh, day);
      if (a.alpha < 0.01) return;
      const near = (1 - sm(0, 1, Math.abs(u))) * (1 - K);
      const p = toWorld(C, L, a.X, a.Y, a.z);
      const img = w.slab ? c.imgs[w.slab] : null;
      // (wave 2, GLOW-WORK) a dark capture lifted so it reads (case/lift.js)
      // (k-evidence, 22 November) the lifted picture stands on its own: it no longer waits on the page image's texture,
      // which no plate draws once the lift is in, so it is the first a full set of layers gives up (plates.js), and
      // the plate went blank with it for a few frames (the home's last plate, as About's stack made its names)
      let lift = null;
      if (img && img.el) {
        if (LIFT.has(w.slab)) lift = lifted(c, "gallery", w.slab, img);
        else { const now = performance.now(); if (now - liftAt > 45) { liftAt = now; LIFT.add(w.slab); lifted(c, "gallery", w.slab, img); } }
      }
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
    // (wave 8, SMOOTH) THE APEX ITSELF, not the plate nearest it: the subject's light, the hand's orbit and the focus
    // stand where the plate in step rests. Taken from the nearest plate, all three jumped the moment the next plate came
    // nearer than the last (halfway through the glide, from 445 px in front of the page to 344 behind it): the eye
    // jumped 49 px in one frame with the pointer off-centre and the focus snapped onto the arriving plate. Now the plate
    // gliding in comes into focus as it reaches its place, and the one leaving goes soft as it swings out
    const a0 = toWorld(C, L, L.ax, L.ay, L.cz), ap = { x: a0.cx, y: a0.cy, z: a0.cz };
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

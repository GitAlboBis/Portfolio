// @ts-check
/**
 * case — the opener of a case page (lane CASE, chain 8; CASE2, chain 9): the work's plate, the same plate as its step
 * in the Work gallery (its capture held at mid-thickness, or its key words etched for a work with no capture).
 *
 *   first frame  the room is already alive where the plate will stand: the even glow of Now (case/glow.js, a
 *            low-discrepancy field, never random patches; its light set by ink, never by thinning its points) and the room's mist draw from the stage's first frame.
 *   arrival  once per load, from the frame the glass can draw (ctx.glass) and the cut's sheet has started to leave: the
 *            plate is there from that frame, far, small, soft but lit, turned away, and stands in its place, in focus,
 *            within ARRIVE_S. A capture still decoding arrives as clear glass and takes its print while it is soft.
 *   step 1   "what it is": the text holds the left column; the plate stands in the figure's half, large, turned some
 *            twenty degrees so its thickness and its edges show; the glow gathers deep behind it, held off the text's
 *            column (its light falls off before the column, so no edge of a keep-out is ever seen). On a phone the
 *            plate takes the upper part of the first screen (the text starts under it, case.css).
 *   step 2   "look at it": the plate turns square to the reader and comes near, as large as the screen allows above
 *            its caption; on a phone the plate stands right on its caption and the pair sits at the optical centre.
 *   leaving  as the opener's view lets go, the plate rises with it, nearer and out of focus, and fades; the glow
 *            thins and the mist of the chapters (the "mist" scene on main) takes the room.
 *
 * A picture with a framing ([data-slab-crop] "x0 y0 x1 y1", fractions of the picture) is held cropped to it: a wide
 * diagram with empty margins fills the plate with its classes.
 *
 * The pointer slides the two lights (the stage) and tilts the plate a few degrees with inertia. A plate never draws
 * over text: the poses keep it out of the text's column and band, and a block of text crossing it hides it.
 * Placement is composed in SCREEN px and converted through the stage's perspective (as gallery.js does).
 */
import mistDef from "../night/mist.js";
import { glow } from "./case/glow.js";
import { C } from "./cover/shared.js";
import { etchCanvas } from "./case/etch.js";
import { room } from "./lib/room.js";
import { speedLens, drift, follow, glideK } from "./lib/camera.js";
import { span, pageK, through } from "./lib/page.js";
import { lifted, withLevels } from "./case/lift.js";

const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sm = (/** @type {number} */ e0, /** @type {number} */ e1, /** @type {number} */ x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
/** (wave 8, lane SMOOTH) how near (px) a block of text beside the plate starts to push it: the push grows as the
 *  text's rows come within this of the plate's, so the plate starts moving before the text shares its rows and lets go
 *  after (a text entering or leaving the plate's rows switched the push on or off whole, in one frame). Under the 44 px
 *  that step 2 keeps between the plate and its caption, so the caption never pushes the plate at rest */
const PUSH_CUSHION = 40;
/** the stage's eye distance (stage.js LOOK.eye, clamped as there) */
const eyeD = (/** @type {number} */ vw, /** @type {number} */ vh) => Math.min(2600, Math.max(1100, 1.25 * Math.hypot(vw, vh)));
const persp = (/** @type {number} */ D, /** @type {number} */ z) => D / Math.max(D - z, 1);

/** the room's seed on a case page (both its scenes: their blades coincide in a crossfade) */
export const CASE_SEED = 7;
/** the arrival's state, shared with the chapters' scene (mist.js), which asks for the same eye; and (lane CASES) the
 *  work's plate as the opener holds it (its texture or its etched words, its aspect), which the "what" chapter parks
 *  at depth (case/figures.js) */
export const CASE = { arrive: 1, tex: /** @type {string | null} */ (null), etch: /** @type {string | null} */ (null), asp: 16 / 10 };

/**
 * (wave 1, lane WORK) THE EYE OF A CASE PAGE: one continuous shot, from the document's scroll (and the plate's
 * arrival) alone, so the opener and the chapters' mist give the host two equal poses. On the arrival the eye is back
 * and pushes in with the plate; through the two steps it comes square and in to the straight depth (the plate faces
 * the reader); down the chapters it pans slowly left. Returns the offset from the straight view, the eye, its depth D
 * and the room's temperature (cool at the top, warm toward the dawn).
 * @param {any} c @param {number} [arrive] 0..1 the plate's arrival (1: arrived)
 */
export function caseEye(c, arrive = 1) {
  const vw = c.vw, vh = c.vh, D = eyeD(vw, vh), ph = vw < 1024;
  const op = span(c, '[data-stage="case"]');
  const k = through(c, op), ke = k * k * (3 - 2 * k);
  const max = Math.max(1, document.documentElement.scrollHeight - vh), s0 = op ? op.bottom - vh : 0;
  const kc = clamp((c.scrollY - s0) / Math.max(1, max - s0));
  const a = clamp(arrive), ae = a * a * (3 - 2 * a);
  // (lane CASES) down the chapters the eye travels on: a slow lateral sway and a rise and fall, one smooth function of
  // the scroll (no jump at a chapter's edge); its depth stays the straight one (the bars stand on the page plane)
  const sway = Math.sin(kc * Math.PI * 2.5), lift = Math.sin(kc * Math.PI * 1.5);
  const d = [
    (ph ? 0.02 : 0.035) * vw * (1 - ke) - (ph ? 0.02 : 0.03) * vw * kc + (ph ? 0.012 : 0.03) * vw * sway * ke,
    0.02 * vh * (1 - ke) - 0.01 * vh * kc - (ph ? 0.01 : 0.025) * vh * lift * ke,
    0.07 * D * (1 - ke) + 0.12 * D * (1 - ae),
  ];
  return { d, D, pos: [vw / 2 + d[0], vh / 2 + d[1], D + d[2]], temp: 0.12 + 0.7 * pageK(c) };
}

/** (wave 1, WORK) the glow's share: the room's subject light now lights the wall behind the plate, and under the
 *  free camera the glow's 40k points cost 1.2 ms at 1440 DPR 2; half of them, each a little brighter (C.field.ink) */
const GLOW_W = 0.5;

const ARRIVE_S = 0.85;   // the arrival, from deep in the room to the plate's place
const PULL_S = 0.45;     // a reader restored lower down: a focus pull where the plate stands
const FIELD_Z = -520;    // the glow's depth behind the page
const REACH = 0.74;      // how far the glow reaches past its rect's half size (case/glow.js: |t|^0.7 and a soft tail)
const CLEAR = 44;        // the dark kept between the glow's reach and a block of text (px)
/** the room's mist, its light set by ink (as the glow's: thinning it by weight left separate soft discs) */
let MIST_INK = 1;
const mist = { ...mistDef, update(/** @type {any} */ c) { const b = /** @type {any} */ (mistDef).update ? /** @type {any} */ (mistDef).update(c) || {} : {}; return { ...b, ink: (b.ink ?? 1) * MIST_INK }; } };

/** a page picture cropped to its framing, as a canvas (null until decoded)
 *  @param {HTMLImageElement} el @param {number[]} f */
async function cropped(el, f) {
  const im = new Image();
  im.decoding = "async";
  im.src = el.currentSrc || el.src;
  await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight;
  const sx = Math.round(f[0] * W), sy = Math.round(f[1] * H), sw = Math.round((f[2] - f[0]) * W), sh = Math.round((f[3] - f[1]) * H);
  const cv = document.createElement("canvas");
  cv.width = sw; cv.height = sh;
  /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d")).drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
  return cv;
}

export default {
  formations: { field: glow, mist },
  // the scene weighs itself: the plate is whole while the opener holds the screen, and leaves with the view
  blend: false,
  // the plate brings itself in on ctx.glass (README "The glass signal"): the host adds no focus pull of its own
  glassEntry: true,
  /** @param {any} c */
  frame(c) {
    const S = c.state, vw = c.vw, vh = c.vh, dt = Math.min(c.dt || 0, 0.1);
    const phone = vw < 1024, D = eyeD(vw, vh);
    // ------------------------------------------------ once: the work's picture, the caption's block
    if (!S.init) {
      S.init = true;
      const sec = document.querySelector('[data-stage="case"]');
      const img = sec && sec.querySelector("img[data-slab]");
      const words = sec && sec.querySelector("[data-slab-words]");
      S.sec = sec;
      S.slab = img ? img.getAttribute("data-slab") : null;
      S.el = img;
      const cr = img && (img.getAttribute("data-slab-crop") || "").trim().split(/\s+/).map(Number);
      S.crop = cr && cr.length === 4 && cr.every((v) => v >= 0 && v <= 1) && cr[2] > cr[0] && cr[3] > cr[1] ? cr : null;
      S.cropState = 0;   // 0 not asked, 1 decoding, 2 handed to the stage, -1 failed (the whole picture then)
      S.words = words ? {
        fig: (words.querySelector(".cs-plate-fig")?.textContent || "").trim(),
        line: (words.querySelector(".cs-plate-line")?.textContent || "").trim(),
      } : null;
      // a reader who lands lower on the page (a reload, an anchor) gets a focus pull, not the arrival
      S.restored = c.scrollY > vh * 0.5;
      S.arr = -1; S.etched = false; S.capKey = ""; S.capH = phone ? 220 : 150;
      S.tilt = { x: 0, y: 0, vx: 0, vy: 0 }; S.flash = 0; S.down = false; S.hide = 0;
      S.held = false; S.swap = 0;
    }
    // the caption's block (step 2's column), measured again when the viewport changes
    const key = vw + "x" + vh;
    // the header's height (--hdr: 64 px on a phone, 72 px on a desktop), read again with the viewport
    if (S.hdrKey !== key) {
      S.hdrKey = key;
      const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const hv = getComputedStyle(document.documentElement).getPropertyValue("--hdr").trim();
      S.hdr = hv.endsWith("rem") ? parseFloat(hv) * fs : parseFloat(hv) || (phone ? 64 : 72);
    }
    const HDR = S.hdr;
    if (S.capKey !== key && S.sec) {
      const b = S.sec.querySelector(".cs-look .sc-in");
      const r = b ? b.getBoundingClientRect() : null;
      if (r && r.height > 1) { S.capH = r.height + (parseFloat(getComputedStyle(b).bottom) || 0); S.capKey = key; }
    }
    const img = S.slab ? c.imgs[S.slab] : null;
    // the framing: cropped once the page's picture is decoded (the host's own copy says it is)
    if (S.crop && S.cropState === 0 && img && img.tex && S.el) {
      S.cropState = 1;
      cropped(S.el, S.crop).then((cv0) => { const cv = withLevels(cv0) || cv0; c.texture("crop", cv); S.cropState = 2; S.cropAt = performance.now(); }, () => { S.cropState = -1; });
    }
    const useCrop = !!S.crop && S.cropState !== -1;
    // the crop's texture is held by the host a few frames after it is handed over (an upload): until then clear glass
    const cropReady = S.cropState === 2 && performance.now() - S.cropAt > 120;
    // (wave 2, GLOW-WORK) a dark capture with its levels set, as in the gallery (case/lift.js)
    const tex = useCrop ? (cropReady ? "case:crop" : null) : img && img.tex ? lifted(c, "case", S.slab, img) || img.tex : null;
    const asp = S.words ? 4 / 3 : useCrop && img ? (img.aspect * (S.crop[2] - S.crop[0])) / (S.crop[3] - S.crop[1]) : img && img.aspect ? img.aspect : 16 / 10;
    // etched words: drawn once the display face is in
    if (S.words && !S.etched && (!document.fonts || document.fonts.check('800 100px "Sofia Sans Extra Condensed"'))) {
      S.etched = true;
      c.texture("etch", etchCanvas(S.words.fig, S.words.line));
    }
    CASE.tex = S.words ? null : tex; CASE.etch = S.words && S.etched ? "case:etch" : null; CASE.asp = asp;

    // ------------------------------------------------ the arrival: from the frame the glass can draw, once the cut's
    // sheet has started to leave (a reader restored lower down: a focus pull instead)
    const gl = c.glass || { ready: true, age: 99 };
    // (lane FIXCASES, asked by FLIGHT) the host says whether a sheet covers the page (ctx.arrival.under) and whether the
    // page was reached by a flight (a cut with no sheet: the eye comes through the door with nothing over the room, so
    // the plate stands in the frame from the first frame after the door and only comes nearer)
    const AV = c.arrival || null;
    const sheetOn = AV ? !!AV.under : document.documentElement.hasAttribute("data-arrive");
    if (S.flown == null) S.flown = !!(AV && AV.cut && !AV.under);
    if (S.arr < 0) { if (gl.ready && !sheetOn) S.arr = S.restored ? 1 : 0; }
    else if (S.arr < 1) S.arr = Math.min(1, S.arr + dt / ARRIVE_S);
    if (S.arr >= 0 && S.pullT == null) S.pullT = 0;
    if (S.pullT != null) S.pullT += dt;
    const ar = S.arr < 0 ? 0 : S.arr;
    const ae = 1 - Math.pow(1 - ar, 3);   // fast out of the depth, settling into place
    const pull = S.restored ? sm(0, PULL_S, S.pullT || 0) : 1;
    // the print switches on inside the plate: a breath of focus hides the switch
    if (tex && !S.held) { S.held = true; if (S.arr > 0.02) S.swap = 1; }
    if (dt > 0) S.swap *= Math.exp(-dt / 0.22);

    // ------------------------------------------------ where the reader is: u 0..2 through the two blocks
    // (wave 8, lane SMOOTH) at ONE rate of the scroll on both sides of the boundary: step 2 is 1.75 screens to step 1's
    // one, so a u counted in each step's own length slowed the plate's turn by 43 % at the boundary, at the height of
    // its travel (the step in its speed came mid-turn). Step 2 is counted in step 1's length (its ratio measured with
    // the viewport), and nothing else reads u.
    // The turn is ONE quintic (lib/camera.js glideK: no speed and no acceleration at either end) over the very scroll it
    // had (from 0.72 of step 1 on a phone, 0.55 on a desktop, to 0.28 / 0.2 of step 2, each in its own length). The
    // smoothstep stopped the plate dead under its caption: on a phone's fling, 1000 px/s to nothing in 50 ms (and
    // counted at step 1's rate it ended 180 px sooner, so harder still)
    if (S.stepKey !== key && S.sec) {
      const st = S.sec.querySelectorAll("[data-stage-step]");
      const a = st[0] && st[0].getBoundingClientRect(), b = st[1] && st[1].getBoundingClientRect();
      if (a && b && b.top - a.top > 1 && b.height > 1) { S.uR = b.height / (b.top - a.top); S.stepKey = key; }
    }
    const uR = S.uR || 1;
    const u = c.step <= 0 ? 0 : c.step === 1 ? c.local : 1 + c.local * uR;
    const e = phone ? glideK(0.72, 1 + 0.28 * uR, u) : glideK(0.55, 1 + 0.2 * uR, u);
    const vy = c.view.y;                                        // the sticky view's top (it lets go at the end)
    const secBottom = c.section.y + c.section.h;
    const lv = 1 - clamp((secBottom - vh * 0.5) / (vh * 0.5));  // 0 while the view holds, 1 once half of it has gone

    /** the plate's size for a width: the picture's aspect inside its inset @param {number} w */
    const size = (w) => { const i = Math.max(6, w * 0.035); return { sw: w, inset: i, sh: S.words ? w * 0.75 : (w - 2 * i) / asp + 2 * i }; };

    // ------------------------------------------------ pose A: the figure's half, turned
    /** @type {{ X: number, Y: number, z: number, w: number, yaw: number, pitch: number, t: number }} */ let A;
    if (!phone) {
      const f = c.fig;
      const w = Math.min(f.w * 0.84, vh * 0.64 * asp, 900);
      A = { X: f.x + f.w * 0.48, Y: vy + vh * 0.52, z: 40, w, yaw: -0.36, pitch: 0.035, t: 44 };
    } else {
      // the band between the header and the text's first line (case.css: the step starts at hdr + 36svh)
      const top = HDR + 10, bot = HDR + vh * 0.36 - 14, bh = bot - top;
      const w = Math.min(vw * 0.8, bh * 0.94 * asp);
      A = { X: vw * 0.5, Y: c.section.y + top + bh * 0.5, z: 30, w, yaw: -0.3, pitch: 0.04, t: 26 };
    }
    // ------------------------------------------------ pose B: square to the reader, near, above the caption
    const gap = phone ? 22 : 44;
    let foot = vy + vh - S.capH - gap;
    for (const t of c.texts) if (t.tag === "figcaption" && t.y < vh) foot = Math.min(foot, Math.max(t.y - gap, vy + vh * 0.42));
    const y0 = vy + HDR + (phone ? 14 : 22), y1 = Math.max(y0 + 80, foot);
    /** @type {typeof A} */ let B;
    if (!phone) {
      const bw = Math.min(vw - vw * 0.12, (y1 - y0) * asp, 1240);
      B = { X: vw * 0.5, Y: (y0 + y1) / 2, z: 30, w: bw, yaw: -0.035, pitch: 0.012, t: 40 };
    } else {
      // the plate stands right on its caption (case.css lifts the caption so the pair sits at the optical centre),
      // as wide as the screen allows with a hair of margin
      let bw = vw - 20;
      const hB = size(bw).sh;
      if (hB > y1 - y0) bw *= (y1 - y0) / hB;
      B = { X: vw * 0.5, Y: y1 - size(bw).sh / 2, z: 20, w: bw, yaw: -0.035, pitch: 0.012, t: 24 };
    }

    // ------------------------------------------------ the pose: A to B with the scroll, then leaving with the view
    const P0 = { X: mix(A.X, B.X, e), Y: mix(A.Y, B.Y, e), z: mix(A.z, B.z, e), w: mix(A.w, B.w, e), yaw: mix(A.yaw, B.yaw, e), pitch: mix(A.pitch, B.pitch, e), t: mix(A.t, B.t, e) };
    P0.Y -= lv * vh * 0.18; P0.z += lv * 220;
    // the arrival's start: deep, small (the perspective does it), turned away, a little up and to the right
    const P = { ...P0 };
    if (ae < 1) {
      const k = 1 - ae;
      // (a phone's eye is short: the depth pulls hard toward the middle, so it starts higher, over the empty top)
      // (a flown arrival: the eye itself travels, so the plate starts nearer, inside the frame, where it will stand)
      const fl = !!S.flown;
      P.X += k * (phone ? vw * (fl ? 0.02 : 0.06) : vw * (fl ? 0.04 : 0.08)); P.Y -= k * vh * (phone ? (fl ? 0.02 : 0.5) : (fl ? 0.02 : 0.05));
      P.z = mix(P.z, fl ? (phone ? -900 : -1500) : -2600, k); P.yaw += (fl ? 0.25 : 0.4) * k; P.pitch += 0.06 * k;
    }

    // the pointer: a few degrees, with inertia (a damped spring on the host's clock); a press lights the edges
    const T = S.tilt, p = c.pointer;
    const px = p.present && !phone ? p.nx : 0, py = p.present && !phone ? p.ny : 0;
    if (dt > 0) {
      const k = 16, d = 2 * 0.6 * Math.sqrt(k);
      T.vx += (k * (px * 0.1 - T.x) - d * T.vx) * dt; T.x += T.vx * dt;
      T.vy += (k * (-py * 0.065 - T.y) - d * T.vy) * dt; T.y += T.vy * dt;
      if (p.down && !S.down) S.flash = 1;
      S.flash *= Math.exp(-dt / 0.38);
    }
    S.down = p.down;

    // ------------------------------------------------ the plate's size and its room beside the text
    // sizes are composed in screen px at the pose's own depth (P0); the arrival's depth then really makes the plate
    // small and draws it toward the eye's centre (scr: its screen scale against its place)
    const s = persp(D, P0.z), scr = persp(D, P.z) / s;
    let { sw, sh, inset } = size(P.w);
    // on a wide screen the plate keeps right of the text it shares rows with (step 1's text leaving upward while the
    // plate turns to the reader): it slides right and, if it must, gets smaller, never over the words
    if (!phone) {
      const half = (sw * Math.cos(P0.yaw)) / 2, left = P0.X - half;
      // (wave 8, SMOOTH) each block pushes the plate's left edge past its words by how near its rows are to the plate's
      // (whole once they share rows, nothing past PUSH_CUSHION): the push follows the scroll with no step in it
      let xMin = -1e9;
      for (const t of c.texts) {
        const gap = Math.max(t.y - (P0.Y + sh / 2), P0.Y - sh / 2 - (t.y + t.h));
        const q = 1 - sm(0, PUSH_CUSHION, gap);
        if (q > 0) xMin = Math.max(xMin, left + q * Math.max(0, t.x + t.w + 32 - left));
      }
      let k = 1, dx = 0;
      if (left < xMin) {
        const room = vw - 24 - xMin;
        if (room < 2 * half) k = Math.max(0.45, room / (2 * half));
        dx = xMin + half * k - P0.X;
      }
      // (wave 8, SMOOTH) and the plate rides a critically damped spring to that place and size (lib/camera.js follow):
      // the first-order lag it rode set off at full speed whenever the push changed and braked with a corner
      follow(S, "kx", k, dt, 0.05, 1e-4);
      follow(S, "dx", dx, dt, 0.05, 0.01);
      if (S.kx < 0.999) ({ sw, sh, inset } = size(sw * S.kx));
      P.X += S.dx; P0.X += S.dx;
    }
    // a block of text crossing the plate hides it (a phone between the blocks; never a plate over text)
    const ex = vw / 2, ey = vh / 2;
    const hw = (sw * Math.cos(P.yaw) * scr) / 2, hh = (sh * scr) / 2;
    const Xs = ex + (P.X - ex) * scr, Ys = ey + (P.Y - ey) * scr;   // where it draws now
    let hide = 0;
    for (const t of c.texts) {
      // a block's box is its lines of text: padded to what the reader sees (a button's fill), and a short block (one
      // line of buttons) hides the plate fully once the plate covers it, not only after 36 px of overlap
      const tx = t.x - 12, ty = t.y - 12, tw = t.w + 24, th = t.h + 24;
      const ix = Math.min(Xs + hw, tx + tw) - Math.max(Xs - hw, tx), iy = Math.min(Ys + hh, ty + th) - Math.max(Ys - hh, ty);
      if (ix > 0 && iy > 0) hide = Math.max(hide, clamp(Math.min(ix, iy) / Math.min(36, tw, th)));
    }
    // the chapters start where the opener ends (their text is the mist scene's): the plate never crosses that line
    hide = Math.max(hide, clamp((P0.Y + sh / 2 - (secBottom - 12)) / 36));
    // presence: there from the arrival's first frame (far and small, so no cut-in), leaving with the view; (wave 8,
    // SMOOTH) the way back after a text has passed rides a spring (the hiding itself is the text's own, at once)
    follow(S, "hide", hide, dt, 0.04, 1e-3);
    const alpha = clamp(ar / 0.04) * pull * (1 - sm(0, 0.7, lv)) * (1 - Math.max(S.hide, hide));
    if (S.dbg ??= /[?&]debug=1/.test(location.search)) /** @type {any} */ (window).__case = { step: c.step, local: c.local, u, e, AY: A.Y, BY: B.Y, P0Y: P0.Y, PY: P.Y, vy, lv, hide, alpha, uR: S.uR };
    // focus: soft but lit while it travels, pulled in at the end of the arrival, a breath soft while it turns or
    // takes its print, soft as it leaves
    const sharp = mix(0.3, 1, sm(0.3, 0.95, ar)) * mix(0.3, 1, pull) * (1 - (S.words ? 0.04 : 0.3) * Math.sin(Math.PI * e)) * (1 - 0.55 * S.swap) * (1 - 0.8 * sm(0, 0.8, lv));
    // (wave 1, WORK) the page's eye: the plate is composed in screen px as the straight view would see it, then placed
    // in the room for the travelling eye (a pure translation: it draws where it was composed, the room moves behind it)
    CASE.arrive = ar;
    const EYE = caseEye(c, S.arr < 0 ? 0 : ar), Cp = EYE.pos;
    const dP = D - P.z, W0 = { x: Cp[0] + ((P.X - ex) * dP) / D, y: Cp[1] + ((P.Y - ey) * dP) / D, z: Cp[2] - dP };
    /** @type {any[]} */ const slabs = alpha > 0.005 ? [{
      id: "plate", cx: W0.x, cy: W0.y, cz: W0.z,
      yaw: P.yaw + T.x, pitch: P.pitch + T.y, roll: 0,
      w: sw / s, h: sh / s, t: P.t,
      tex: S.words ? null : tex, etch: S.words ? "case:etch" : undefined,
      inset: S.words ? undefined : inset / s,
      alpha, glow: clamp(mix(S.words ? 0.95 : 0.7, S.words ? 1 : 0.6, e) + 0.4 * S.flash), sharp,
      // (wave 3, LIGHT3) a narrow arris, as in the gallery: cut glass with a thin lit line, not a frame
      bevel: S.words ? 4.5 : 3.5,
      // (wave 2, GLOW-WORK) the bevels' own light (plates.js s.edge): the glass read by its lit edges
      edge: (S.words ? 0.6 : 0.36) * sm(0.2, 0.9, ar),
      // the broad face keeps a breath of the studio, never a grey card (an etched plate: only its bevels)
      sheen: S.words ? 0.04 : 0.14,
    }] : [];

    // ------------------------------------------------ the glow behind the plate's place, the room's mist
    // The glow stands where the plate WILL stand (P0, not the arriving pose), from the stage's first frame. Its reach
    // is held off every block of text: on each block it overlaps, the axis that keeps more of the glow is shortened,
    // so the light has fallen off before the keep-out and no edge of one is ever seen
    let fsw = sw, fsh = sh;

    for (const t of c.texts) {
      const L = t.x - CLEAR, R = t.x + t.w + CLEAR, Tp = t.y - CLEAR, Bt = t.y + t.h + CLEAR;
      const hx = fsw * REACH, hy = fsh * REACH;
      if (P0.X + hx <= L || P0.X - hx >= R || P0.Y + hy <= Tp || P0.Y - hy >= Bt) continue;
      const rx = P0.X >= R ? (P0.X - R) / REACH : P0.X <= L ? (L - P0.X) / REACH : 0;
      const ry = P0.Y >= Bt ? (P0.Y - Bt) / REACH : P0.Y <= Tp ? (Tp - P0.Y) / REACH : 0;
      if (rx / fsw >= ry / fsh) fsw = Math.min(fsw, rx); else fsh = Math.min(fsh, ry);
    }
    // a glow squeezed thinner than a third of the plate is no glow: it thins away instead
    const squeeze = sm(0.2, 0.45, Math.min(fsw / sw, fsh / sh));
    fsw = Math.max(fsw, sw * 0.2); fsh = Math.max(fsh, sh * 0.2);
    const kF = persp(D, FIELD_Z);
    // the glow's centre draws behind the plate's: its rect is placed in the glow's own depth (see now.js)
    const fx = ex + (P0.X - ex) / kF, fy = ey + (P0.Y - ey) / kF;
    const fieldRect = { x: fx - fsw / 2 + EYE.d[0], y: fy - fsh / 2 + EYE.d[1], w: fsw, h: fsh };
    // alive from the first frame (a little under its full light until the plate stands); clear glass with etched
    // words shows the glow through it: read large, the glow steps back so the words read
    // (its brightness is its ink: its weight, its share of the points, stays whole until the view lets go)
    const fInk = mix(0.6, 1, sm(0, 0.8, ar)) * squeeze * (1 - Math.max(S.hide, hide)) * (1 - (S.words ? 0.4 : 0.3) * e) * (1 - sm(0, 0.8, lv));
    // squeezed or hidden with the plate, the glow also gives back its points: crowded into its smallest rect they
    // would read as a bright blot under the text however low their ink
    const fw = (1 - sm(0.7, 1, lv)) * mix(0.08, 1, squeeze * (1 - Math.max(S.hide, hide)));
    // (wave 2, GLOW-WORK) behind clear glass with etched words the glow read as a soft cloud in the plate: half of it
    C.field = { sw: fsw, sh: fsh, z: FIELD_Z, D, phone: vw < 760, ink: fInk * (S.words ? 0.75 : 1.5) };
    MIST_INK = 1 - (S.words ? 0.85 : 0.6) * e;
    // ------------------------------------------------ the room: the wall behind the plate, chips, the blades kept on the
    // figure's half (the text holds the left column on a wide screen), the subject's light behind the plate
    const R = room(c, {
      temp: EYE.temp, seed: CASE_SEED, eye: Cp, sweep: phone ? undefined : [0.05, 1], chips: phone ? 4500 : 7000, dim: phone ? 0.3 : 0, glow: 1,
      // the scene weighs itself (blend: false): its room leaves with the view, or the host pools its blades into the chapters
      alpha: 1 - sm(0, 1, lv),
      subject: { x: W0.x, y: W0.y, z: W0.z, w: sw, h: sh, strength: (phone ? 0.2 : 0.4) * (1 - sm(0, 0.8, lv)) },
    });
    if (c.look) c.look({ ...R.look, keepFeather: phone ? 24 : 80 });
    // ------------------------------------------------ the eye: the page's shot, a drift on the stage's clock, the hand
    // orbiting it about the plate, the lens a little wider while the reader runs
    const dr = drift(c.clock ? c.clock.time : 0, phone ? 5 : 9);
    const pos = [Cp[0] + dr[0], Cp[1] + dr[1], Cp[2] + dr[2]];
    const piv = [W0.x, W0.y, W0.z];
    return {
      swarm: [
        { id: "field", weight: fw * GLOW_W, rect: fieldRect },
        // the room's mist, thinner while the plate is read large (its near points would haze the capture)
        { id: "mist", weight: 0.45 * clamp(c.weight), rect: { x: 0, y: 0, w: vw, h: vh } },
      ],
      slabs,
      keepouts: R.keepouts,
      camera: {
        pos, target: [Cp[0] + dr[0] * 0.5, Cp[1] + dr[1] * 0.5, Cp[2] - D], lens: speedLens(1, c.speed),
        focus: Math.max(200, Math.hypot(piv[0] - pos[0], piv[1] - pos[1], piv[2] - pos[2])), aperture: 0.9, damp: 0,
        orbit: { yaw: phone ? 0.14 : 0.16, pitch: 0.07, damp: 1.1, pivot: piv }, fog: [3 * D, 7 * D],
      },
      bloom: { strength: 0.5, threshold: 0.5, knee: 0.3, plates: S.words ? 0.22 : 0.14 },
      field: R.field,
      rest: 14,
    };
  },
};

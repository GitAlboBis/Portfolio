// @ts-check
/**
 * stack — About, "Capabilities" (spec 50 §4): eight thin layers of clear glass, one above the other, seen from three
 * quarters in the figure's half. The head shows the stack closed, a block of glass with light passing through it; it
 * opens as the reader enters the steps. In step k the layers part above and below layer k and it slides out of the
 * stack toward the reader, sharp, its edges lit by a sheet of light (the swarm) that runs through it in its own plane;
 * every layer carries its group's name etched. The whole stack turns slowly with the scroll (its own turn about its
 * own axis, so it never leaves its half), damped.
 *
 * Frames (1440 x 900): the text column left, the stack centred in the right half, about 0.38 of the viewport wide,
 * its top layer clear of the header. Phone: the stack in the upper half of the screen, the text below it.
 *
 * Conventions (stage.js header): a slab turns roll (z), then pitch (x), then yaw (y); a formation's `rotate` is the
 * same turn with x and y negated. The scene builds one orientation V (tilt a about x after turn b about y) and gives
 * the plates V·X(π/2) (lying flat) and the sheet V.
 */
import mist from "../night/mist.js";
import { eyeD, home, shot, lookFor, roomFor, bloomOf, SEED, LIT } from "../night/shot.js";

const N_LAYERS = 8;
const THREADS = 7, PER = 360;

const clamp = (/** @type {number} */ x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// (wave 2) settles exactly: a value that creeps by one ulp a frame moved the camera's pivot and the plates, and the
// stage never slept on About (2 frames every 3 s at rest)
const damp = (/** @type {number} */ cur, /** @type {number} */ to, /** @type {number} */ dt, /** @type {number} */ tau) => {
  const v = cur + (to - cur) * (1 - Math.exp(-dt / Math.max(1e-4, tau)));
  return Math.abs(to - v) < 1e-3 ? to : v;
};

/* ---------------------------------------------------------------- 3 x 3 turns, row-major, the slab's signs */
/** @typedef {number[][]} M3 */
/** @param {number} t @returns {M3} */ const RX = (t) => [[1, 0, 0], [0, Math.cos(t), Math.sin(t)], [0, -Math.sin(t), Math.cos(t)]];
/** @param {number} t @returns {M3} */ const RY = (t) => [[Math.cos(t), 0, -Math.sin(t)], [0, 1, 0], [Math.sin(t), 0, Math.cos(t)]];
/** @param {M3} A @param {M3} B @returns {M3} */
const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
/** @param {M3} A @param {number[]} v */
const app = (A, v) => A.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
/** a turn as the slab's yaw, pitch, roll (M = Y(yaw) X(pitch) Z(roll)) @param {M3} M */
const euler = (M) => ({ pitch: Math.asin(clamp(M[1][2], -1, 1)), roll: Math.atan2(M[1][0], M[1][1]), yaw: Math.atan2(-M[0][2], M[2][2]) });

/* ---------------------------------------------------------------- the sheet of light through the layer in step */
/** what the scene hands the sheet every frame */
const sheet = { rotate: [0, 0, 0], offset: [0, 0, 0], w: 520, d: 340, phone: false, inkK: 1, run: 1, reach: 1, boost: 1 };

/** threads across the layer's plane (local x along the layer, z across its depth, y = 0), past its two ends
 * @param {any} H @param {number} w @param {number} d */
function sheetTargets(H, w, d) {
  const out = [];
  for (let k = 0; k < THREADS; k++) {
    const f = (k + 0.5) / THREADS, z = (f - 0.5) * d * 0.84, ph = k * 1.7, pts = [];
    for (let i = 0; i <= 48; i++) {
      const u = i / 48, x = (u - 0.5) * w * 1.55;
      // a slow wave across the plane, flat enough to stay inside the layer's thickness where it passes through
      const zz = z + Math.sin(u * 5.2 + ph) * d * 0.035;
      const yy = Math.sin(u * 3.1 + ph) * 1.6;
      // brightest where it passes through the glass, thinning to nothing at its two ends
      const e = Math.sin(Math.PI * u);
      pts.push([x, yy, zz, 0.15 + 0.85 * Math.pow(e, 0.7)]);
    }
    out.push(H.polyline(pts, PER));
  }
  return H.join(out);
}

const light = {
  share: 0.22, fill: 1, fit: "px", emit: -1, capacity: THREADS * PER, inkArea: 2300000,
  targets: (/** @type {any} */ H) => sheetTargets(H, 520, 340),
  look: { ink: 0.08, size: 0.75, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3.2, speed: 1400, inertia: 0.25, fuzz: 0.6 },
  flow: { amp: 1.2, wavelength: 300, evolution: 0.05, z: 0.2 },
  respond: { hand: 0.5, wind: 0.3, fadeIn: 0.9, fadeOut: 1.1 },
  tails: { share: 0, length: 60, emitters: 60 },
  /** @param {any} c */
  update(c) {
    const st = c.state, I = sheet;
    const key = `${Math.round(I.w / 8)},${Math.round(I.d / 8)}`;
    if (st.key !== key) { st.key = key; c.setTargets(sheetTargets(c.H, I.w, I.d)); }
    return { rotate: I.rotate, offset: I.offset, scale: [I.reach, 1, 1], shift: c.time * 26 * I.run, ink: I.inkK * I.boost * (I.phone ? 1.8 : 1) };
  },
};

/* ---------------------------------------------------------------- (wave 1, NIGHT) the far layers as outlines
   Eight plates traced at full cost halved the swarm three times at 1440 DPR 2 (3.2 ms). Now only the layer in step and
   its two neighbours are glass; every layer also has its four straight edges drawn in light by the swarm, so the far
   layers read as thin layers whose edges catch the room's light (and the near ones get a lit rim). */
/** what the scene hands the outlines every frame: per layer [y, slide, on] in the stack's own frame */
const rims = { rotate: [0, 0, 0], offset: [0, 0, 0], w: 520, d: 340, ys: new Float32Array(N_LAYERS * 3), inkK: 1, key: "" };
const RIM_PER = 220;
/** @param {any} H */
function rimTargets(H) {
  const out = [], I = rims, hw = I.w / 2, hd = I.d / 2;
  for (let i = 0; i < N_LAYERS; i++) {
    const y = I.ys[i * 3], sl = I.ys[i * 3 + 1], on = I.ys[i * 3 + 2];
    const w = 0.35 + 0.4 * (1 - on);   // the glass layers carry their own edge light: their rims are fainter
    const P = [[-hw, y, -hd + sl], [hw, y, -hd + sl], [hw, y, hd + sl], [-hw, y, hd + sl]];
    const pts = [];
    for (let e = 0; e <= 4; e++) { const p = P[e % 4]; pts.push([p[0], p[1], p[2], w]); }
    out.push(H.polyline(pts, RIM_PER));
  }
  return H.join(out);
}
const outlines = {
  share: 0.12, fill: 1, fit: "px", emit: 0, capacity: N_LAYERS * RIM_PER, inkArea: 2300000, carry: 1,
  targets: (/** @type {any} */ H) => rimTargets(H),
  look: { ink: 0.07, size: 0.8, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 7, speed: 2200, inertia: 0.08, fuzz: 0.15 },
  flow: { amp: 0.4, wavelength: 300, evolution: 0.03, z: 0.1 },
  respond: { hand: 0.2, wind: 0.1, fadeIn: 0.9, fadeOut: 1.1 },
  tails: { share: 0, length: 60, emitters: 60 },
  /** @param {any} c */
  update(c) {
    const st = c.state, I = rims;
    if (st.key !== I.key) { st.key = I.key; c.setTargets(rimTargets(c.H)); }
    return { rotate: I.rotate, offset: I.offset, ink: I.inkK };
  },
};

/** the groups' names, read once from the page (each step's title): what each layer carries etched
 *  (wave 7, INTEGRATE) read again once the title they came from has left the document (the router keeps this module
 *  across pages: a language flight kept the other edition's names) */
/** @type {string[] | null} */ let NAMES = null;
/** @type {Element | null} */ let NAMES_EL = null;
function names() {
  if (NAMES && NAMES_EL && NAMES_EL.isConnected) return NAMES;
  const els = document.querySelectorAll('#stack [data-stage-step] .stp-t, [data-stage="stack"] [data-stage-step] .stp-t');
  const seen = new Set(), out = [];
  for (const e of els) { if (seen.has(e)) continue; seen.add(e); out.push((e.textContent || "").replace(/\s+/g, " ").trim()); }
  NAMES = out.slice(0, N_LAYERS);
  NAMES_EL = els[0] || null;
  return NAMES;
}

export default {
  // (FIX3D) its plates give way to the next scene's text (the path's head lay bent double under the last plate)
  yields: true,
  formations: { light, outlines, mist },
  /** @param {any} c */
  frame(c) {
    const s = c.state, f = c.fig, ph = c.phone;
    const dt = Math.min(0.1, c.dt || 0);
    // ------------------------------------------------ where the reader is: the head (0), then the eight steps
    const open = c.step >= 1 ? 1 : sstep(0.55, 1, c.local);
    const xs = c.step >= 1 ? c.step - 1 + c.local - 0.5 : -0.5;
    const n0 = Math.floor(xs), kf = c.step >= 1 ? clamp(n0 + sstep(0.3, 0.7, xs - n0), 0, N_LAYERS - 1) : 0;
    if (s.k == null) { s.k = kf; s.open = open; s.turn = c.progress; }
    s.k = damp(s.k, kf, dt, 0.28);
    s.open = damp(s.open, open, dt, 0.35);
    s.turn = damp(s.turn, c.progress, dt, 0.6);
    const act = s.open;                                       // how much a layer stands out at all

    // ------------------------------------------------ the frame: the stack in the figure's half
    // the figure on top (a phone, a narrow or zoomed window): the stack fits the figure's height too, and when the
    // text column stands at the left of the figure (a short landscape window) it moves into the room right of the
    // text (INTEGRATE, from DRIVE: at 900 x 900 and at 200 % zoom the front plate covered the step's title and tools)
    // and when the text crosses the stack where it stands (a short window: the text fills the top), it moves to the
    // widest band of the view that no text crosses, sized to it
    let room = f.w, cx0 = f.x + f.w * 0.5, cy0 = f.y + f.h * (ph ? 0.7 : 0.53);
    const lw0 = ph ? Math.min(f.w * 0.62, 300) : Math.min(f.w * 0.62, 540);
    let sc0 = 1, fade = 1;
    if (c.side === "top") {
      let tx1 = -1;
      for (const r of c.texts) if (r.y < f.y + f.h && r.y + r.h > f.y) tx1 = Math.max(tx1, r.x + r.w);
      if (tx1 > 0 && tx1 < f.x + f.w * 0.55) { cx0 = (tx1 + f.x + f.w) / 2; room = f.x + f.w - tx1; }
      sc0 = clamp(Math.min(f.h * 0.62, room * 0.62) / lw0, 0.4, 1);
      // the stack's half height at scale 1 (the layers, the parting, the plate's depth seen from above)
      const H1 = 3.5 * (ph ? 18 : 36) + (ph ? 16 : 40) + 0.42 * lw0 * 0.64;
      const hx0 = cx0 - lw0 * sc0 * 0.8, hx1 = cx0 + lw0 * sc0 * 0.8, pad = 16;
      const tx = c.texts.filter((/** @type {any} */ r) => r.x < hx1 && r.x + r.w > hx0);
      const hit = (/** @type {number} */ y, /** @type {number} */ h) => tx.some((/** @type {any} */ r) => r.y - pad < y + h && r.y + r.h + pad > y - h);
      // a tall screen (a phone upright): only a step's text passing through on its way crosses it, and the stack
      // steps back while it does; a short window (landscape, zoom): the text fills the top for good, the stack moves
      const crossed = hit(cy0, H1 * sc0 + 12);
      // (FIX3D) a phone upright too: the stack moves into the tallest band no text crosses and fits it, and steps back
      // only when no band is tall enough (it hid from step 6 on, where the step's text crossed its band for good)
      fade = 1;
      if (crossed) {
        const cuts = tx.map((/** @type {any} */ r) => [r.y - pad, r.y + r.h + pad]).sort((/** @type {number[]} */ p, /** @type {number[]} */ q) => p[0] - q[0]);
        let best = [0, 0], at = 64;
        for (const [p, q] of cuts) { if (p - at > best[1] - best[0]) best = [at, p]; at = Math.max(at, q); }
        if (c.vh - at > best[1] - best[0]) best = [at, c.vh];
        const gh = best[1] - best[0];
        if (gh > (c.vh >= 600 ? 150 : 80)) { cy0 = (best[0] + best[1]) / 2; sc0 = clamp(Math.min(sc0, (gh / 2 - 12) / H1), 0.3, 1); }
        else fade = 0;
      }
    }
    s.cx = s.cx == null ? cx0 : damp(s.cx, cx0, dt, 0.4);
    s.cy = s.cy == null ? cy0 : damp(s.cy, cy0, dt, 0.4);
    s.sc = s.sc == null ? sc0 : damp(s.sc, sc0, dt, 0.4);
    s.fade = s.fade == null ? fade : damp(s.fade, fade, dt, 0.12);
    const sc = s.sc;
    const lw = lw0 * sc;
    const ld = lw * 0.64;
    const g = ((ph ? 8 : 14) + ((ph ? 18 : 36) - (ph ? 8 : 14)) * s.open) * sc;   // the gap between layers: closed at the head
    const part = (ph ? 16 : 40) * act * sc;                   // the extra room above and below the layer in step
    const slide = (ph ? 0.3 : 0.36) * ld * act;               // how far it slides out toward the reader
    const t = (ph ? 10 : 15) * Math.max(0.7, sc);
    const cx = s.cx, cy = s.cy;
    // three quarters: the stack turned about its own axis and seen from above; it turns on with the scroll
    const b = 0.94 - 0.34 * s.turn + 0.06 * c.pointer.nx * (c.pointer.present ? 1 : 0);
    const a = 0.56 - 0.1 * s.turn;
    const V = mul(RX(a), RY(b));
    const flat = euler(mul(V, RX(-Math.PI / 2)));   // lying flat, its etched face up

    // ------------------------------------------------ the eight layers
    const L = names();
    const slabs = [];
    for (let i = 0; i < N_LAYERS; i++) {
      const d = i - s.k;
      const near = clamp(1 - Math.abs(d));                    // 1 for the layer in step, easing to 0 at its neighbours
      const on = sstep(0, 1, near) * act;
      // rest height (index 0 on top), the parting round the layer in step, its lift and slide
      const y = (i - (N_LAYERS - 1) / 2) * g + part * Math.tanh(d * 1.6) - (ph ? 6 : 10) * on;
      const p = app(V, [0, y, slide * on]);
      // the name etched: full in the layer in step, faint in the others (two textures; the switch rides the focus pull)
      // (FIX3D) at the head (the stack closed) the top layer carries its name bright: lit glass from the first frame
      const strong = on > 0.5 || (i === 0 && act < 0.5);
      const eo = { w: Math.round(lw), h: Math.round(ld), pad: lw * 0.12, colour: strong ? "#ffffff" : "rgba(255,255,255,0.17)" };
      const etch = L[i] ? c.etch((strong ? "cap" : "capf") + i, [L[i]], eo) : null;
      // only the layer in step and its neighbours are glass (cost: three plates at most, the far ones are outlines)
      // (FIX3D) the layer in step alone while it is read, two across a boundary (three cost 2.4–2.6 ms at rest at 1440
      // DPR 2 with the room lit: at the limit); the neighbours keep their outlines of light
      const glassK = 1 - clamp((Math.abs(d) - 0.55) / 0.45);
      rims.ys[i * 3] = y; rims.ys[i * 3 + 1] = slide * on; rims.ys[i * 3 + 2] = glassK;
      if (glassK <= 0.01) continue;
      const slab = {
        id: "l" + i, cx: cx + p[0], cy: cy + p[1], cz: p[2] - 30,
        yaw: flat.yaw, pitch: flat.pitch, roll: flat.roll,
        w: lw, h: ld, t, tex: null, etch, bevel: 4,
        alpha: s.fade * glassK, glow: clamp(0.3 + 0.7 * on + 0.55 * (1 - act)), sharp: 0.95 - 0.4 * act + 0.45 * on, sheen: 0.22,
      };
      slabs.push(slab);
    }

    // ------------------------------------------------ the sheet of light: in the plane of the layer in step, following
    // it between steps (at the head, through the middle of the closed block)
    const o = app(V, [0, ((s.k - (N_LAYERS - 1) / 2) * g - (ph ? 6 : 10)) * act, slide * act]);
    const ev = euler(V);
    sheet.rotate = [-ev.pitch, -ev.yaw, ev.roll];
    // a formation turns about its rect's centre: the rect sits on the stack's centre, the offset carries the plane
    sheet.offset = [o[0], o[1], o[2] - 30];
    sheet.w = lw; sheet.d = ld; sheet.phone = ph; sheet.inkK = c.inkK;
    sheet.run = 1;
    sheet.reach = 1 + 0.6 * (1 - act);
    sheet.boost = 1 + (ph ? 0.8 : 1.6) * (1 - act);                    // at the head the light runs far through the closed block
    const R = Math.max(lw, ld) * 1.4;
    rims.rotate = sheet.rotate; rims.offset = [0, 0, -30]; rims.w = lw; rims.d = ld; rims.inkK = c.inkK;
    rims.key = Array.from(rims.ys, (v) => Math.round(v)).join(",") + "|" + Math.round(lw);

    // ------------------------------------------------ (wave 1, NIGHT) the room and the shot: the eye comes down the
    // stack with the layer in step (it follows that layer's height), a little closer and from a little to the side
    // while the stack is open; at the head and past the last step it stands at the straight view, so the page's shot
    // runs on into the path without a jump
    const D = eyeD(c.vw, c.vh), H = home(c);
    const lay = [cx + o[0], cy + o[1], o[2] - 30];
    const out = 1 - clamp((c.progress - 0.9) / 0.1);           // back to the straight view as the scene ends
    const k = act * out;
    const T = [0.05 * c.vw * k, o[1] * 0.85 * k, -0.07 * D * k];
    const pose = { ...H, pos: [H.pos[0] + T[0] + 0.04 * D * k, H.pos[1] + T[1] - 0.04 * D * k, H.pos[2] + T[2]],
      target: [H.target[0] + T[0], H.target[1] + T[1], 0], pivot: lay };
    pose.focus = Math.hypot(pose.pos[0] - lay[0], pose.pos[1] - lay[1], pose.pos[2] - lay[2]);
    const RM = roomFor(c, {
      seed: SEED.about, wall: { z: -1.1 * D }, eye: [c.vw / 2, c.vh / 2, D],
      subject: { x: lay[0], y: lay[1] + 0.3 * c.vh, z: lay[2], w: lw * 1.3, h: 1.5 * c.vh },
      ...LIT(c),
    });
    lookFor(c, RM, 2.6);   // the same look as the path below it (one page, one look)
    return {
      swarm: [
        { id: "light", weight: (0.85 + 0.15 * act) * s.fade, rect: { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R } },
        { id: "outlines", weight: s.fade, rect: { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R } },
        { id: "mist", weight: 0.2, rect: { x: 0, y: 0, w: c.vw, h: c.vh } },
      ],
      slabs,
      camera: shot(c, pose, { fog: [3 * D, 7 * D], aperture: 0.7 }),
      bloom: bloomOf(0.5),
      field: RM.field,
      keepouts: [...RM.keepouts, ...c.texts.map((/** @type {any} */ r) => ({ x: r.x - 10, y: r.y - 8, w: r.w + 20, h: r.h + 16 }))],
      rest: 14,
    };
  },
};

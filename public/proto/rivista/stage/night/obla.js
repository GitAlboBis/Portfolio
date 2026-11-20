// @ts-check
/**
 * obla — Obla, the personal agent (spec "Storia" §3.5, §5, §6.2).
 *
 * The character is drawn as a lit body (character.js, the stage's body extension point); the
 * particles are the light around it, and both follow its state, which follows the scene's step:
 *
 *   1 listening   eyes wide, blue rim; the light streams in toward it from every side
 *   2 thinking    a slow sway, eyes up and aside, violet rim; the light orbits it on tilted rings
 *   3 working     the hem ripples, teal rim; streams leave it toward three small windows of light
 *                 (sessions) and come back
 *   4 approval    an upward bob, eyes wide, amber rim; one card of light held in front of it
 *   5 sleeping    eyes closed, a slow breath, grey rim; the light lies still like a night sky
 *     finished    at the end of the last step the eyes open happy, green rim: the morning report,
 *                 a page of light above it
 *
 * Every change of state is tweened (state weights, body parameters and colour ease over about a
 * third of a second), never cut. No text is drawn: the windows, the card and the report are rows
 * of light, not words.
 */
import { clamp, smooth, approach, rng, inkFor, hurry, camera } from "./lib.js";
import { characterBody, COLORS, rgb, insidePillow, BODY } from "./character.js";
import { DEPTH } from "./shot.js";

const M = 5200;                 // light points
const R = 0.42;                 // the character's R (local units)
const CY = 0.14;                // its centre (local y)
const RXu = BODY.rx * R, RYu = BODY.ry * R;
const STATES = ["idle", "listening", "thinking", "working", "approval", "sleeping", "finished"];
const SESS = [[-0.66, -0.6], [0, -0.8], [0.66, -0.6]];
const SW = 0.19, SH = 0.12;     // a session window's half size

/** per-state body parameters (the product's states.ts, translated) */
const CFG = {
  idle:      { col: COLORS.idle, tint: 0, wide: 1, happy: 0, closed: 0, sway: 0, bounce: 0, ripple: 0, breathe: 0, look: null, lp: 0 },
  listening: { col: COLORS.listening, tint: 0.6, wide: 1.12, happy: 0, closed: 0, sway: 0, bounce: 0, ripple: 0, breathe: 0, look: null, lp: 0, es: 1.06 },
  thinking:  { col: COLORS.thinking, tint: 0.6, wide: 1, happy: 0, closed: 0, sway: 0.06, bounce: 0, ripple: 0, breathe: 0, look: [0.5, 0.5], lp: 0 },
  working:   { col: COLORS.working, tint: 0.6, wide: 1, happy: 0, closed: 0, sway: 0, bounce: 0, ripple: 1, breathe: 0, look: null, lp: 0.16 },
  approval:  { col: COLORS.approval, tint: 0.7, wide: 1.12, happy: 0, closed: 0, sway: 0, bounce: 0.05, ripple: 0, breathe: 0, look: null, lp: -0.12 },
  sleeping:  { col: COLORS.sleeping, tint: 0.3, wide: 1, happy: 0, closed: 1, sway: 0, bounce: 0, ripple: 0, breathe: 1, look: null, lp: 0 },
  finished:  { col: COLORS.finished, tint: 0.4, wide: 1, happy: 1, closed: 0, sway: 0, bounce: 0, ripple: 0, breathe: 0, look: null, lp: 0.16 },
};

/** the box's half extents in local units (contain: the smaller side is 1), set every frame */
const EXT = [1, 1, 1];   // x, y, and the squeeze of what sits above the body on a short box

const P = (() => { const r = rng(2026), a = new Float32Array(M * 6); for (let i = 0; i < a.length; i++) a[i] = r(); return a; })();

/** a point on the outline or the rows of a small window of light (no text: bars) */
function windowPt(cx = 0, cy = 0, hw = 0.1, hh = 0.1, a = 0, b = 0, rows = 3) {
  if (a < 0.55) {
    const per = 2 * (hw + hh), s = (a / 0.55) * 2 * per;
    const t = s % per, side = s < per ? 0 : 1;
    if (t < 2 * hw) return [cx - hw + t, side ? cy + hh : cy - hh, 1];
    return [side ? cx - hw : cx + hw, cy - hh + (t - 2 * hw), 1];
  }
  const q = (a - 0.55) / 0.45, row = Math.min(rows - 1, Math.floor(q * rows));
  const len = row === 0 ? 0.55 : 0.85 - 0.25 * ((row * 37) % 3) / 2;
  return [cx - hw * 0.78 + b * 2 * hw * 0.78 * len, cy - hh * 0.5 + (row / Math.max(rows - 1, 1)) * hh * 1.05, row === 0 ? 0.95 : 0.6];
}

/** where point i is in state `st` at time t: [x, y, z, ink] */
function layout(st = "idle", i = 0, t = 0) {
  const r1 = P[i * 6], r2 = P[i * 6 + 1], r3 = P[i * 6 + 2], r4 = P[i * 6 + 3], r5 = P[i * 6 + 4], r6 = P[i * 6 + 5];
  switch (st) {
    case "listening": {
      // (wave 4, PRISM) LINES OF SOUND: four short straight strokes at one side of its head, at ear height, fanned a
      // little and of different lengths, pulsing in turn on the stage's clock (the strokes above and beside it read
      // as an arc over the head, a sun's half)
      const k = Math.floor(r1 * LST.length), L = LST[k];
      const rad = 1.16 + L[1] * r3, pulse = 0.5 + 0.5 * Math.sin((t * 1.6 - L[2]) * Math.PI * 2);
      const ink = 0.85 * (0.3 + 0.7 * pulse * pulse) * (1 - 0.35 * r3);
      return [Math.cos(L[0]) * rad * RXu, CY - 0.12 * RYu + Math.sin(L[0]) * rad * RYu * 0.9, (r2 - 0.5) * 0.01, ink];
    }
    case "thinking": {
      // (wave 3, LIGHT3) three small squares in a row above its head, lit one after another (the scribbled cloud of
      // tilted rings is gone); the other points wait hidden behind the body
      if (r1 < 0.5) {
        const k = Math.floor(r2 * 3), q = TSQ, cx = (k - 1) * q * 3.2, cy = CY - RYu - 0.27;
        // the outline (most points: a crisp square) and a dim fill
        let x, y;
        if (r3 < 0.72) { const e = windowPt(cx, cy, q, q, r4 * 0.55, 0, 1); x = e[0]; y = e[1]; }
        else { x = cx + (r4 * 2 - 1) * q * 0.7; y = cy + (r5 * 2 - 1) * q * 0.7; }
        const f = ((t * 0.9 - k / 3) % 1 + 1) % 1, on = Math.exp(-Math.pow((f - 0.18) / 0.16, 2));
        return [x, y, 0.02, (r3 < 0.72 ? 1 : 0.45) * (0.16 + 0.84 * on)];
      }
      return HIDE(r2, r3);
    }
    case "working": {
      // the sessions: three small windows of light, their frames bright and sharp, two rows inside (fix-stage: the
      // frames carry more of the light, so they read as rectangles the streams reach, not as smoke above the head)
      if (r1 < 0.55) {
        const s = SESS[Math.floor(r2 * 3)], w = windowPt(s[0], s[1] * EXT[2], SW, SH, r3 * 0.85, r4, 3);
        return [w[0], w[1], 0.02, 1.25 * w[2]];
      }
      // a stream: out on one lane, back on the other
      const k = Math.floor(r2 * 3), s = SESS[k];
      const ph = (((r3 + t * 0.42) % 1) + 1) % 1, out = ph < 0.5, u = out ? ph * 2 : 2 - ph * 2;
      const ax = (k - 1) * 0.16, ay = CY - RYu * 0.92, bx = s[0], by = s[1] * EXT[2] + SH + 0.015;
      const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
      const off = (out ? 1 : -1) * 0.028 + (r5 - 0.5) * 0.016;
      const cx = mx - (dy / l) * off * 2, cy = my + (dx / l) * off * 2;
      const x = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx;
      const y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
      const pulse = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin((u * 3 - t * (out ? 1.2 : -1.2)) * Math.PI * 2), 3);
      return [x, y, Math.sin(u * Math.PI) * 0.12 * (out ? 1 : -1), pulse * smooth(0, 0.08, u) * 0.9];
    }
    case "approval": {
      if (r1 < 0.62) {
        // the card held in front of it, a little toward the reader; a filled mark where the yes goes
        const cx = 0, cy = CY + RYu + 0.22, hw = 0.3, hh = 0.15;
        if (r2 < 0.16) return [cx + hw * 0.55 + (r3 - 0.5) * 0.14, cy + hh * 0.5 + (r4 - 0.5) * 0.06, 0.2, 0.7];
        const w = windowPt(cx, cy - 0.02, hw, hh, r3, r4, 2);
        return [w[0], w[1], 0.2, 0.62 * w[2]];
      }
      // (wave 3, LIGHT3) no rays: the rest of the light waits hidden behind the body
      return HIDE(r2, r3);
    }
    case "sleeping": {
      // a night sky: still points over the whole box, a few brighter, none on the body
      let x = (r1 * 2 - 1) * EXT[0] * 0.97, y = (r2 * 2 - 1) * EXT[1] * 0.97;
      if (insidePillow(x / (R * 1.3), (y - CY) / (R * 1.3))) { x = (r5 * 2 - 1) * EXT[0] * 0.97; y = (r2 < 0.5 ? -1 : 1) * (0.5 + 0.47 * r6) * EXT[1]; }
      return [x, y, -0.55 + 0.75 * r3, 0.07 + 0.95 * Math.pow(r4, 7)];
    }
    case "finished": {
      if (r1 < 0.58) {
        // the morning report: a page of light above it, a heading bar and rows
        const w = windowPt(0, -0.62 * EXT[2], 0.27, 0.2, r2, r3, 6);
        return [w[0], w[1], 0.05, 0.95 * w[2]];
      }
      // the night sky fades toward morning: the same still points, dimmer, none on the body or the page
      const x = (r4 * 2 - 1) * EXT[0] * 0.97, y = (r5 * 2 - 1) * EXT[1] * 0.97;
      const off = insidePillow(x / (R * 1.3), (y - CY) / (R * 1.3)) || (Math.abs(x) < 0.34 && Math.abs(y + 0.62 * EXT[2]) < 0.27);
      return [x, y, -0.5 + 0.7 * r6, off ? 0 : 0.04 + 0.35 * Math.pow(r2, 6)];
    }
    default: {
      // (wave 3, LIGHT3) idle: no rays at all (a full circle of them was a drawn sun). Obla is lit by its blade, the
      // room's chips around it; the points wait hidden behind the body, where listening draws them out
      return HIDE(r2, r3);
    }
  }
}

/** (wave 4) listening's strokes: [angle (rad; 0 = its right, y grows down), length (in R), the pulse's phase]: four,
 *  at its right side about ear height, a narrow fan of different lengths (never an arc over the head) */
const LST = [[-0.36, 0.22, 0.0], [-0.12, 0.34, 0.25], [0.12, 0.28, 0.5], [0.36, 0.18, 0.75]];
/** (wave 3) thinking's squares: half size (local units) */
const TSQ = 0.05;
/** a point hidden behind the body (its ink 0: the body hides it and the light rises from there) */
const HIDE = (/** @type {number} */ a, /** @type {number} */ b) => [(a - 0.5) * RXu, CY + (b - 0.5) * RYu, -0.2, 0];

/** the state the scene asks for @param {{ step: number, local: number }} sc */
function wanted(sc) {
  if (sc.step === 5 && sc.local > 0.72) return "finished";
  return ["idle", "listening", "thinking", "working", "approval", "sleeping"][clamp(Math.round(sc.step), 0, 5)];
}

export default {
  share: 0.5, fill: 0.96, fit: "contain", inkArea: 280000, capacity: M,
  look: { ink: 0.028, size: 1.2, mistInk: 0.01, mistSize: 1.2 },
  motion: { spring: 5, speed: 1000, inertia: 0.15, fuzz: 1.4 },
  flow: { amp: 5, wavelength: 180, evolution: 0.08, z: 0.8 },
  respond: { hand: 0.5, wind: 0.3, fadeIn: 5, fadeOut: 6 },
  emit: 0,
  targets() {
    const d = new Float32Array(M * 4);
    for (let i = 0; i < M; i++) { const p = layout("idle", i, 0); d.set(p, i * 4); }
    return { data: d, path: 0, closed: false };
  },
  body: characterBody((ctx) => ctx.state.body || null),
  /** @param {any} c */
  update(c) {
    const s = c.state, t = c.time, dt = c.dt;
    const want = wanted(c.scene);
    s.w ??= Object.fromEntries(STATES.map((k) => [k, k === want ? 1 : 0]));
    for (const k of STATES) s.w[k] = approach(s.w[k], k === want ? 1 : 0, dt, 0.24);
    // body parameters, tweened toward the state's
    const cf = /** @type {any} */ (CFG)[want];
    s.b ??= { tint: cf.tint, wide: cf.wide, happy: cf.happy, closed: cf.closed, sway: cf.sway, bounce: cf.bounce, ripple: cf.ripple, breathe: cf.breathe, yaw: 0, pitch: 0, es: 1, col: rgb(cf.col) };
    const b = s.b, tau = 0.26;
    for (const k of ["tint", "wide", "happy", "closed", "sway", "bounce", "ripple", "breathe"]) b[k] = approach(b[k], cf[k], dt, tau);
    b.es = approach(b.es, cf.es ?? 1, dt, 0.2);
    const tc = rgb(cf.col);
    b.col = b.col.map((/** @type {number} */ v, /** @type {number} */ j) => approach(v, tc[j], dt, 0.3));
    // where it looks: the state's look, or the reader's pointer in the box (the product's lookTarget)
    const p = c.pointer, lx = p.present && p.inside ? clamp(p.local.x, -1, 1) : 0, ly = p.present && p.inside ? clamp(p.local.y - CY, -1, 1) : 0;
    const ty = cf.look ? cf.look[0] * 0.55 + lx * 0.2 : lx * 0.45;
    const tp = cf.look ? cf.look[1] * 0.5 : -ly * 0.3 + cf.lp;
    b.yaw = approach(b.yaw, ty, dt, 0.3); b.pitch = approach(b.pitch, tp, dt, 0.3);
    // the camera in the box: it turns a little with the scroll through the scene and with the hand, damped; the
    // light around Obla turns with it, and its face turns by part of it, so the body reads in depth
    const cam = camera(c, c.scene.progress, 0.26, 0.12);
    // a blink now and then (never asleep)
    s.blink ??= t + 2.4;
    if (t > s.blink) { s.blinkAt = t; s.blink = t + 2.4 + ((t * 7919) % 3); }
    const bt = s.blinkAt != null ? t - s.blinkAt : 9;
    const open = b.closed > 0.5 ? 1 : bt < 0.07 ? 1 - 0.92 * (bt / 0.07) : bt < 0.2 ? 0.08 + 0.92 * ((bt - 0.07) / 0.13) : 1;
    s.phase = (s.phase ?? 0) + dt * (1.2 + b.ripple * 4);
    const breathe = Math.sin(t * 1.7) * 0.035 * b.breathe;
    const u = Math.min(c.rect.w, c.rect.h) / 2;
    EXT[0] = c.rect.w / 2 / u; EXT[1] = c.rect.h / 2 / u; EXT[2] = Math.min(1, EXT[1] / 1.12);
    s.body = {
      cx: c.rect.x + c.rect.w / 2, cy: c.rect.y + c.rect.h / 2 + CY * u + (-Math.abs(Math.sin(t * 4.6)) * b.bounce - 0.04) * R * u,
      z: DEPTH.obla || 0, R: R * u, tilt: Math.sin(t * 1.6) * b.sway, sx: 1 - breathe * 0.6, sy: 1 + breathe, opacity: clamp(c.weight * 1.4),
      yaw: b.yaw + cam[1] * 0.7, pitch: b.pitch - cam[0] * 0.5, es: b.es, open, wide: b.wide, happy: b.happy, closed: b.closed,
      hem: 0.07 * (1 + b.ripple * 0.4), phase: s.phase, tint: b.tint, col: b.col,
    };
    // the light: the weighted sum of where each state puts every point
    const d = s.d || (s.d = new Float32Array(M * 4));
    const act = STATES.filter((k) => s.w[k] > 0.004);
    const tot = act.reduce((a, k) => a + s.w[k], 0) || 1;
    for (let i = 0; i < M; i++) {
      let x = 0, y = 0, z = 0, w = 0;
      for (const k of act) { const q = layout(k, i, t), f = s.w[k] / tot; x += q[0] * f; y += q[1] * f; z += q[2] * f; w += q[3] * f; }
      // behind the body it is hidden; in front of its face only a little light passes (no speckle on the face)
      if (insidePillow(x / R, (y - CY) / R)) w *= z < 0 ? 0 : 0.18 * s.w.thinking;
      d[i * 4] = x; d[i * 4 + 1] = y; d[i * 4 + 2] = z; d[i * 4 + 3] = w;
    }
    c.setTargets({ data: d, path: 0, closed: false });
    const sleepy = s.w.sleeping;
    // a change of state lands fast (fix-stage: the light used to streak for two or three seconds before it settled)
    const h = hurry(c, want, { spring: 5, speed: 1000, inertia: 0.15 }, 5 * (1 - 0.9 * sleepy));
    return {
      rotate: [cam[0], cam[1], 0],
      offset: [0, 0, DEPTH.obla || 0],
      ink: inkFor(c.rect, 280000, 0.8),
      // asleep, the sky holds still
      flow: { amp: h.flow.amp, evolution: 0.08 * (1 - 0.8 * sleepy) },
      motion: { ...h.motion, fuzz: (1.4 - 0.8 * sleepy - 0.8 * s.w.working) * (1 - 0.4 * h.k) },
    };
  },
};

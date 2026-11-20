// @ts-check
/**
 * agents — Consulting 4, multi-agent systems, built and tested (spec "Storia" §3.5, §6.1).
 *
 * A hub and six agents as crisp nodes (wave 1, NIGHT: square frames of light with a square inside, no soft round
 * knots), joined by straight links: hub to every agent, and each agent to its neighbours. Every link is a narrow
 * loop, out on one straight lane and back on the parallel one, so light runs along it in both directions in
 * pulses: work handed out, results coming back.
 *
 * The test is the figure's point. Pressing near an agent fails it: its core scatters, its links go
 * dark, and the work reroutes: a bypass lights between its two neighbours and their links to the
 * hub carry more. Within about two seconds the agent gathers itself and its links relight.
 */
import { clamp, smooth, rng, stepProgress, inkFor, rackFocus, hurry, camera } from "./lib.js";

const N = 96;                      // points per loop (every loop has the same count: a path set)
const AG = 6;
const RAD = 0.9;                   // the agents' ring (local units)
const PITCH = -0.42;               // the ring seen from a little above (flatter: every node near the focus)
const FAIL_S = 2.2;                // how long a failure lasts

/** the agents' home positions (local, before the formation's rotation) */
const AGENTS = Array.from({ length: AG }, (_, k) => {
  const a = (k / AG) * Math.PI * 2 + 0.26;
  return [Math.sin(a) * RAD, (k % 2 ? 0.1 : -0.08), Math.cos(a) * RAD];
});
const HUB = [0, 0, 0];

// the loops, in a fixed order: 6 links hub-agent, 6 ring links, 6 bypasses, hub orbits, agent orbits
const L_LINK = 0, L_RING = AG, L_BYP = 2 * AG, L_HUB = 3 * AG, HUB_ORBITS = 3, AG_ORBITS = 2;
/** the nodes' half sides (local units): the hub's two frames and its core, an agent's frame and its core */
const HUB_SQ = [0.11, 0.075, 0.03], AG_SQ = [0.065, 0.028];
const L_AGO = L_HUB + HUB_ORBITS;
const LOOPS = L_AGO + AG * AG_ORBITS;

/** an orbit's fixed orientation and radius, per orbit loop */
const ORB = (() => {
  const r = rng(77), o = [];
  for (let i = 0; i < HUB_ORBITS + AG * AG_ORBITS; i++) {
    // a random plane: two orthonormal vectors
    const u = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1];
    let l = Math.hypot(u[0], u[1], u[2]) || 1; u[0] /= l; u[1] /= l; u[2] /= l;
    const t = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const v = [u[1] * t[2] - u[2] * t[1], u[2] * t[0] - u[0] * t[2], u[0] * t[1] - u[1] * t[0]];
    l = Math.hypot(v[0], v[1], v[2]) || 1; v[0] /= l; v[1] /= l; v[2] /= l;
    const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    o.push({ v, w, r: i < HUB_ORBITS ? 0.07 + 0.045 * r() : 0.036 + 0.028 * r(), ph: r() });
  }
  return o;
})();
const SCAT = (() => { const r = rng(91), a = new Float32Array(AG * AG_ORBITS * N * 3); for (let i = 0; i < a.length; i++) a[i] = r() * 2 - 1; return a; })();

/**
 * A link loop between a and b: out along one lane (bulging up), back along the other (bulging
 * down). s in [0, 1): the first half goes a -> b, the second b -> a.
 * @param {number[]} a @param {number[]} b @param {number} s @param {number} bow
 */
function lane(a, b, s, bow, ra = 0.08, rb = 0.08) {
  const out = s < 0.5, t = out ? s * 2 : (s - 0.5) * 2, u0 = out ? t : 1 - t;
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz) || 1;
  // straight, from the edge of one node's frame to the other's (wave 1: no bow, the two lanes parallel and close)
  const u = ra / len + u0 * Math.max(0, 1 - (ra + rb) / len);
  const lx = Math.hypot(dx, dy) || 1, side = (out ? 1 : -1) * (0.011 + 0.004 * Math.sign(bow));
  return [a[0] + dx * u - (dy / lx) * side, a[1] + dy * u + (dx / lx) * side, a[2] + dz * u];
}

/** a point on a square frame of half side h, seen square-on in the formation's plane (x, y), s in [0, 1) around it */
function square(/** @type {number[]} */ c, /** @type {number} */ h, /** @type {number} */ s, /** @type {number} */ turn = 0) {
  const q = (s * 4) % 4, e = Math.floor(q), f = q - e;
  const P = [[-h, -h], [h, -h], [h, h], [-h, h]], A = P[e], B = P[(e + 1) % 4];
  let x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f;
  if (turn) { const ct = Math.cos(turn), st = Math.sin(turn); [x, y] = [x * ct - y * st, x * st + y * ct]; }
  return [c[0] + x, c[1] + y, c[2]];
}

/** a pulse train along a loop: a few bright packets riding a faint lane @param {number} s @param {number} ph @param {number} k */
function pulses(s, ph, k) {
  let v = 0;
  for (let j = 0; j < k; j++) {
    const d = ((s - ph - j / k) % 1 + 1.5) % 1 - 0.5;
    v += Math.exp(-(d * d) / (2 * 0.024 * 0.024));
  }
  return v;
}

/** @param {any} st @param {number} time */
function build(st, time) {
  const d = new Float32Array(LOOPS * N * 4);
  const f = st.fail, e = f ? smooth(0, 0.12, time - f.t0) * (1 - smooth(1.1, FAIL_S, time - f.t0)) : 0;
  const k0 = f ? f.k : -1;
  const pos = AGENTS.map((p, k) => (k === k0 ? [p[0], p[1] - 0.06 * e, p[2]] : p));
  let o = 0;
  const put = (/** @type {number[]} */ p, /** @type {number} */ w) => { d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = w; o += 4; };
  const flow = time * 0.16;
  for (let L = 0; L < LOOPS; L++) {
    for (let i = 0; i < N; i++) {
      const s = i / N;
      if (L < L_RING) {
        // hub <-> agent
        const k = L - L_LINK, dead = k === k0 ? 1 - e : 1;
        const busy = f && (k === (k0 + 1) % AG || k === (k0 + AG - 1) % AG) ? 1 + 1.2 * e : 1;
        put(lane(HUB, pos[k], s, 0.06, HUB_SQ[0] * 1.3, AG_SQ[0] * 1.3), (0.16 + 1.25 * pulses(s, flow + k * 0.37, 3) * busy) * dead);
      } else if (L < L_BYP) {
        // agent <-> next agent
        const k = L - L_RING, k2 = (k + 1) % AG, dead = k === k0 || k2 === k0 ? 1 - e : 1;
        put(lane(pos[k], pos[k2], s, 0.08, AG_SQ[0] * 1.3, AG_SQ[0] * 1.3), (0.1 + 0.8 * pulses(s, flow * 1.3 + k * 0.21, 2)) * dead);
      } else if (L < L_HUB) {
        // the bypass between the failed agent's neighbours: dark unless one fails
        const k = L - L_BYP, a = (k + AG - 1) % AG, b = (k + 1) % AG, on = k === k0 ? e : 0;
        put(lane(pos[a], pos[b], s, -0.1, AG_SQ[0] * 1.3, AG_SQ[0] * 1.3), on * (0.35 + 1.6 * pulses(s, flow * 1.6, 3)));
      } else {
        // the nodes: square frames of light (the hub's two, turned 45 deg apart, and a small core; an agent's frame and
        // its core), crisp, with a slow pulse running round them; a failing agent's frame flies apart and gathers again
        const j = L - L_HUB, isHub = j < HUB_ORBITS, k = isHub ? -1 : ((j - HUB_ORBITS) / AG_ORBITS) | 0;
        const c = isHub ? HUB : pos[k], r = isHub ? j : (j - HUB_ORBITS) % AG_ORBITS;
        const h = isHub ? HUB_SQ[r] : AG_SQ[r], turn = isHub && r === 1 ? Math.PI / 4 : 0;
        let p = square(c, h, s, turn);
        // (FIX3D) the hub's frames lighter: six links already end on it, and together they bloomed into a soft square
        let w = (isHub ? [0.42, 0.34, 0.5][r] : [0.6, 0.85][r]) * (0.75 + 0.5 * pulses(s, time * 0.12 + j * 0.31, 1));
        if (k === k0 && e > 0) {
          const q = ((j - HUB_ORBITS) * N + i) * 3, sc = 0.3 * e;
          p = [p[0] + SCAT[q] * sc + (p[0] - c[0]) * 2.5 * e, p[1] + SCAT[q + 1] * sc + (p[1] - c[1]) * 2.5 * e, p[2] + SCAT[q + 2] * sc * 0.4];
          w *= 1 - 0.4 * e;
        }
        put(p, w);
      }
    }
  }
  return { data: d, path: N, closed: true };
}

/** local -> document px for a point of this formation (same rotation as the stage: Ry Rx, no roll) */
function toDoc(/** @type {number[]} */ p, /** @type {any} */ rect, /** @type {number} */ rx, /** @type {number} */ ry, /** @type {number} */ D) {
  const u = Math.min(rect.w, rect.h) / 2;
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  const x = cy * p[0] + sy * sx * p[1] + sy * cx * p[2];
  const y = cx * p[1] - sx * p[2];
  const z = -sy * p[0] + cy * sx * p[1] + cy * cx * p[2];
  return { x: rect.x + rect.w / 2 + x * u, y: rect.y + rect.h / 2 + y * u, z: z * u, s: D / (D - z * u) };
}

export default {
  share: 0.5, fill: 0.97, fit: "contain", inkArea: 300000, capacity: LOOPS * N,
  look: { ink: 0.03, size: 1.15, mistInk: 0.01, mistSize: 1.2 },
  motion: { spring: 6, speed: 1100, inertia: 0.11, fuzz: 1.1 },
  flow: { amp: 3, wavelength: 160, evolution: 0.08, z: 0.8 },
  respond: { hand: 0.3, wind: 0.3, fadeIn: 6, fadeOut: 6 },
  emit: 0,
  targets() { return build({}, 0); },
  /** @param {any} c */
  update(c) {
    const s = c.state, t = c.time;
    s.yaw ??= -0.15;
    // the constellation turns slowly while the page moves, and with the step
    s.yaw += c.dt * 0.07;
    // the camera in the box turns a little with the scroll and the hand (damped): the ring reads as a ring in depth
    const cam = camera(c, stepProgress(c.scene, 4), 0.32, 0.16);
    const yaw = s.yaw + stepProgress(c.scene, 4) * 0.9 + cam[1], pitch = PITCH + cam[0];
    // a press near an agent fails it (one failure at a time)
    const p = c.pointer;
    if (p.clicked && p.inside && !(s.fail && t - s.fail.t0 < FAIL_S)) {
      const D = Math.min(2600, Math.max(1100, 1.25 * Math.hypot(c.view.w, c.view.h)));
      let best = -1, bd = 1e9;
      AGENTS.forEach((a, k) => {
        const q = toDoc(a, c.rect, pitch, yaw, D);
        // the screen position under perspective, as the stage draws it (eye at the view's centre)
        const ex = c.scroll.x + c.view.w / 2, ey = c.scroll.y + c.view.h / 2;
        const sx = ex + (q.x - ex) * q.s, sy = ey + (q.y - ey) * q.s;
        const dd = Math.hypot(sx - p.doc.x, sy - p.doc.y);
        if (dd < bd) { bd = dd; best = k; }
      });
      if (best >= 0 && bd < Math.min(c.rect.w, c.rect.h) * 0.2) s.fail = { k: best, t0: t };
    }
    if (s.fail && t - s.fail.t0 > FAIL_S) s.fail = null;
    c.setTargets(build(s, t));
    // it arrives fast when the reader reaches step 4 (or comes back to it): no seconds of streaks
    const h = hurry(c, c.scene.step >= 4 ? 4 : 0, { spring: 6, speed: 1100, inertia: 0.11 }, 3);
    return {
      rotate: [pitch, yaw, 0],
      offset: [0, 0, rackFocus(c, 4)],
      shift: t * 0.16 * N,
      ink: inkFor(c.rect, 300000, 0.75),
      motion: h.motion, flow: h.flow,
    };
  },
};

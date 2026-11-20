// @ts-check
/**
 * path — About, the path (spec 50 §4): one line of light through the room with five upright panes of clear glass,
 * each etched with when it began (read from the step's own label). The newest is nearest, the oldest farthest: reading
 * down the steps travels back in time.
 *
 * Wave 1 (lane NIGHT): one travelling shot. The line stands still in the studio's lit room (scenes/lib/room.js) and the
 * EYE flies along it: at the head it stands at the straight view and the whole line recedes in the figure's half; from
 * step 1 it stands behind the pane in step, a little to its right and above, looking down the line, so each pane
 * passes close and lit as it comes and the next ones wait deeper; the passed ones go out past the eye. A blade stands
 * on the pane in step; the room warms toward the dawn, and the eye returns to the straight view before it.
 *
 * Wave 6 (lane ROOMS): THE DATES NEVER COLLIDE. Seen down the line through the stage's long lens (D = 1.25 x the
 * diagonal) every pane after the next converged on one vanishing point and their months and years piled up (wave 4 to
 * 5). Now (1) on a wide screen the line BOWS: each node stands a little further right of the last than the one before
 * did, so from behind any pane the ones ahead fan out instead of stacking, and the head's straight view lays three
 * (1440) to five (1920) panes apart; (2) THE GUARD: every frame each pane's box is projected with the frame's real eye
 * (the pose, the clock's drift, the hand's orbit as the stage damps it, the lens), the pane nearest its step first; a
 * pane within GAP of one already shown steps back to nothing, and one two stations away waits for the one before it
 * (never a skip); (3) the line ends, feathered, where it would leave the figure's half (it ran under the text).
 */
import mist from "../night/mist.js";

import { eyeD, home, shot, aimAt, mixP, stations, lookFor, roomFor, bloomOf, SEED, freeBand, LIT, clearOf, project } from "../night/shot.js";

const NODES = 5;
const S0 = -0.7, S1 = 5.2;      // where the line starts (near the reader) and ends (far in the past), in nodes
// (wave 2, GLOW-NIGHT) a fuller line: one line of light through all five panes, not a short comet out of the one in step
const PER = 2600;
/** (wave 2) one node every STEP_D eye distances into the depth (0.5 put the far panes small and the wall far: a dark,
 *  sparse room); the wall stands WALL_D behind the page plane, just past the line's far end */
const STEP_D = 0.34, WALL_D = 1.85;

const clamp = (/** @type {number} */ x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
/** (wave 6) the guard's gap between two panes' boxes, css px: nothing shows at GAP[0] or closer, all of it from GAP[1] */
const GAP = [6, 30];

/** (wave 6) v turned about the pivot by the hand's orbit [yaw, pitch], as stage.js orbitAbout draws it
 *  @param {number[]} v @param {number[]} piv @param {number[]} o */
function orbitAbout(v, piv, o) {
  if (!o[0] && !o[1]) return v;
  let x = v[0] - piv[0], y = v[1] - piv[1], z = v[2] - piv[2];
  const cy = Math.cos(o[0]), sy = Math.sin(o[0]);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const l = Math.hypot(x, z) || 1, rx = z / l, rz = -x / l;
  const cp = Math.cos(o[1]), sp = Math.sin(o[1]), dot = rx * x + rz * z;
  const cxv = -rz * y, cyv = rz * x - rx * z, czv = rx * y;
  return [piv[0] + x * cp + cxv * sp + rx * dot * (1 - cp), piv[1] + y * cp + cyv * sp, piv[2] + z * cp + czv * sp + rz * dot * (1 - cp)];
}

/** (wave 6) a pane's box on screen for an eye: its eight corners turned as plates.js turns a plate (roll, pitch, yaw),
 *  plus the plate's own pad (bevel and blur); null if a corner is behind the eye
 *  @param {any} c @param {any} eye @param {any} s @returns {number[] | null} [x0, y0, x1, y1] */
function boxOf(c, eye, s) {
  const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch), cr = Math.cos(s.roll), sr = Math.sin(s.roll);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let k = 0; k < 8; k++) {
    const a = k & 1 ? s.w / 2 : -s.w / 2, b = k & 2 ? s.h / 2 : -s.h / 2, t = k & 4 ? s.t / 2 : -s.t / 2;
    const x = a * cr - b * sr, yr = a * sr + b * cr, y = yr * cp + t * sp, z = -yr * sp + t * cp;
    const p = project(c, eye, [s.cx + x * cy - z * sy, s.cy + y, s.cz + x * sy + z * cy]);
    if (!p) return null;
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  const pad = 3 + (1 - s.sharp) * 18;
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}
const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** (wave 2) damped and SETTLING: within eps it lands exactly, or it creeps by one ulp a frame and the stage never sleeps
 * @param {number} cur @param {number} to @param {number} dt @param {number} tau @param {number} [eps] */
const ease = (cur, to, dt, tau, eps = 1e-3) => { const v = cur + (to - cur) * (1 - Math.exp(-dt / tau)); return Math.abs(to - v) < eps ? to : v; };

/* (wave 1, NIGHT) The line stands in the room's WORLD (viewport px, z toward the reader) and the EYE flies along it.
   At the straight view the newest node is low in the figure's half and the line recedes, swaying a little, toward a
   vanishing point higher up the same half; one node every half eye distance into the depth. */
/** the line's geometry for this viewport @param {number} vw @param {number} vh @param {boolean} ph */
function geom(vw, vh, ph) {
  const D = eyeD(vw, vh), cx = vw / 2, cy = vh / 2;
  // (wave 6, ROOMS) a wide screen: node 0 lower and further left, the line vanishing higher and nearer the middle, so
  // the straight view at the head lays the panes apart up the figure's half (they stacked into one pile of dates)
  const S = ph ? { x: 0.5 * vw, y: 0.4 * vh } : { x: 0.14 * vw, y: 0.78 * vh };     // node 0 on screen (straight view)
  const V = ph ? { x: 0.56 * vw, y: 0.1 * vh } : { x: 0.46 * vw, y: 0.16 * vh };    // the vanishing point
  const step = STEP_D * D, z0 = 0.05 * D;
  const X0 = [cx + (S.x - cx) * (D - z0) / D, cy + (S.y - cy) * (D - z0) / D, z0];
  const d = [((V.x - cx) / D) * step, ((V.y - cy) / D) * step, -step];
  // (wave 2) a wider sway: on a straight line each pane hid the ones behind it; on this curve they stand apart in depth
  const sw = ph ? 0.05 * vw : 0.085 * vw, sh = ph ? 0.02 * vh : 0.04 * vh;
  // (wave 6, ROOMS) a wide screen: the sideways sway is a BOW (each step to the next node a little longer than the last)
  // with a third of the old sine on it for the line's S: steps of 0.97, 0.81, 0.93, 1.59 x sw, never back toward the
  // pane in step, so from behind any pane the next ones fan out to the right (the whole sine swung the third and
  // fourth nodes back over it). A phone keeps its sine (one pane at a time there).
  const sn = (/** @type {number} */ s) => Math.sin(s * 1.25 + 0.3) - Math.sin(0.3);
  /** @param {number} s */
  const fx = ph ? sn : (s) => 0.62 * s + 0.14 * s * Math.min(s, 4.4) + 0.35 * sn(s);
  /** @param {number} s nodes from the newest */
  const at = (s) => [X0[0] + d[0] * s + sw * fx(s), X0[1] + d[1] * s + sh * Math.sin(s * 0.9 + 1.1) - sh * Math.sin(1.1), X0[2] + d[2] * s];
  return { D, at, d, ph, key: vw + "x" + vh + (ph ? "p" : "") };
}

/** what the scene hands the line every frame */
const line = { reveal: [0, 1, 0.02], g: /** @type {any} */ (null), inkK: 1, boost: 1 };

/** @param {any} H @param {any} g */
function lineTargets(H, g) {
  const pts = [];
  for (let i = 0; i <= 260; i++) {
    const s = S0 + ((S1 - S0) * i) / 260, p = g.at(s);
    // brightest round the nodes, thinner between them, fading out far in the past
    const near = Math.pow(Math.cos(Math.PI * (s - Math.round(s))), 6);
    const far = 1 - sstep(4.3, S1, s);
    // (FIX3D) nearly even along its length, a little more ink deeper (the depth thins it): a line, not a comet
    // (wave 2) even through all five panes, a knot of light at each (the pane's edges catch it)
    pts.push([p[0], p[1], p[2], (0.78 + 0.22 * near) * (g.ph ? 1 / (1 + 0.3 * Math.max(0, s)) : 0.9 + 0.1 * Math.max(0, s)) * (0.2 + 0.8 * far)]);
  }
  return H.polyline(pts, PER);
}

const light = {
  share: 0.2, fill: 1, fit: "px", emit: 0, capacity: PER, inkArea: 10000, carry: 0,
  targets: (/** @type {any} */ H) => lineTargets(H, geom(1440, 900, false)),
  look: { ink: 0.15, size: 0.85, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3, speed: 1600, inertia: 0.25, fuzz: 1.0 },
  flow: { amp: 1.2, wavelength: 300, evolution: 0.05, z: 0.3 },
  respond: { hand: 0.5, wind: 0.25, fadeIn: 0.9, fadeOut: 1.1 },
  tails: { share: 0, length: 60, emitters: 60 },
  /** @param {any} c */
  update(c) {
    const st = c.state, I = line;
    if (I.g && st.key !== I.g.key) { st.key = I.g.key; c.setTargets(lineTargets(c.H, I.g)); }
    // the swarm runs along the line, toward the past
    return { reveal: I.reveal, shift: c.time * 34, ink: I.inkK * I.boost };
  },
};

/** the five "when" labels, read once from the page (each step's first label): what each pane carries etched */
/** @type {string[][] | null} */ let WHEN = null;
function whens() {
  if (WHEN) return WHEN;
  const out = [];
  for (const el of document.querySelectorAll('[data-stage="path"] [data-stage-step] .stp-when .t-acc')) {
    const t = (el.textContent || "").split(/[–-]/)[0].replace(/\s+/g, " ").trim();
    out.push(t.split(" ").filter(Boolean));
  }
  WHEN = out.slice(0, NODES);
  return WHEN;
}

export default {
  formations: { light, mist },
  /** @param {any} c */
  frame(c) {
    const ph = c.phone, g = geom(c.vw, c.vh, ph), D = g.D;
    line.g = g; line.inkK = c.inkK;
    // ------------------------------------------------ where the eye stands on the line (in nodes), and how much it
    // still stands at the straight view (the head, and the scene's last part before the dawn)
    const x = c.step >= 1 ? c.step - 1 + c.local - 0.5 : 0;
    const kf = stations(Math.max(0, x), NODES);
    // (wave 2, GLOW-NIGHT) the eye goes back to the straight view only once the LAST step's text has left the screen
    // (it blended from progress 0.93, while the B.Sc. was still being read beside the SEP 2026 pane): each step keeps
    // its own pane beside its text to the end of the scene
    let tb = 0;
    for (const r of c.texts) tb = Math.max(tb, r.y + r.h);
    const gone = c.step >= NODES ? 1 - sstep(0.04 * c.vh, 0.3 * c.vh, tb) : 0;
    const m = Math.max(c.step >= 1 ? 0 : 1 - sstep(0.35, 1, c.local), gone * sstep(0.5, 1, c.local));
    line.boost = (ph ? 1.1 : 1.45) - 0.2 * m;
    // the line starts just behind the eye's own pane (in front of it, near the eye, it would be a fat streak of light)
    // (FIX3D: its first points, near and blurred, piled into a bright comet head that read as a drop on the phone)
    // (wave 4, PRISM) a phone: the near end starts a little further on and comes in over a longer stretch, so the line
    // thins out toward the eye instead of ending in a soft round head of blurred points
    // (wave 6) a wide screen: a longer feather (the far end is cut mid-line now, below) with the near end's fade
    // starting where it did
    line.reveal = [clamp((kf - 0.1 * (1 - m) - (S0 + 0.12) * m - S0) / (S1 - S0) + (ph ? 0.06 : 0.04)), 1, ph ? 0.26 : 0.12];

    // ------------------------------------------------ the shot: behind the node in step, a little to its right and above,
    // looking down the line; it shows at F, the figure's focus
    const f = c.fig;
    const st = c.state, dt = Math.min(0.1, c.dt || 0);
    let F = ph ? { x: f.x + f.w * 0.5, y: f.y + f.h * 0.62 } : { x: f.x + f.w * 0.42, y: f.y + f.h * 0.56 };
    // (FIX3D) a phone: the step's text scrolls through the figure's band, and the panes hid there nearly all the time;
    // the line's focus moves into the tallest band no text crosses (damped) and the panes fit it
    let fitK = 1, bandOk = 1;
    if (ph) {
      const b = freeBand(c, 0, c.vw, 18, 70), gh = b[1] - b[0];
      const fy = gh > 0 ? b[0] + gh * 0.58 : F.y;
      st.fy = st.fy == null || dt <= 0 ? fy : ease(st.fy, fy, dt, 0.35, 0.05);
      F = { x: F.x, y: st.fy };
      fitK = clamp(gh / 360, 0.5, 1);
      bandOk = gh > 170 ? 1 : 0;
    }
    const A = g.at(kf), dl = Math.hypot(g.d[0], g.d[1], g.d[2]);
    const L = (ph ? 0.62 : 0.56) * D;
    // the eye's offset from the line sets where the line's far end vanishes on screen: at F + side x D / L (the far panes
    // recede up and a little right of the pane in step, inside the figure's half, never toward the text)
    const v = [-g.d[0] / dl * L + (ph ? 0.07 : 0.12) * D, -g.d[1] / dl * L - (ph ? 0.1 : 0.09) * D, -g.d[2] / dl * L];
    const near = aimAt(c, A, F, v);
    const pose = mixP(near, { ...home(c), pivot: g.at(0.5) }, m);

    // ------------------------------------------------ the five panes, upright in the line's room
    const W = whens();
    const pw = ph ? 104 * fitK : 176, phh = pw * 1.3;
    // a pane draws opaque over the page: the panes step back while a text block crosses the band they stand in (a
    // phone: only when no free band is tall enough), and come back when it has passed
    let clear = bandOk;
    if (!ph && c.side === "top") {
      const L2 = (ph ? 0.62 : 0.56), sz = phh / L2, y0 = F.y - sz * 0.75, y1 = F.y + sz * 0.6;
      if (c.texts.some((/** @type {any} */ r) => r.y < y1 && r.y + r.h > y0)) clear = 0;
    }
    st.clear = st.clear == null ? clear : ease(st.clear, clear, dt, 0.12);
    // (wave 6, ROOMS) the frame's REAL eye: the pose with the stage clock's drift (shot), turned by the hand's orbit the
    // way the stage damps it (the same input and time constant), through the lens of the scroll's speed. The panes'
    // boxes, the text test and the guard all see the screen the stage draws (the bare pose missed the orbit's 0.22 rad)
    const cam = shot(c, pose, { fog: [3.6 * D, 8 * D], aperture: 0.28 });
    const ob = cam.orbit, aim = c.aim || { x: 0, y: 0 };
    const goal = [ob.yaw * (aim.x || 0), -ob.pitch * (aim.y || 0)];
    if (!st.orb) st.orb = goal;
    else if (dt > 0) st.orb = [ease(st.orb[0], goal[0], dt, ob.damp || 1.1, 1e-4), ease(st.orb[1], goal[1], dt, ob.damp || 1.1, 1e-4)];
    const piv = ob.pivot || cam.target;
    const eye = { pos: orbitAbout(cam.pos, piv, st.orb), target: orbitAbout(cam.target, piv, st.orb), lens: cam.lens };
    // (wave 6) a wide screen: the line ends, faded, well inside the figure's half (the bow carried its far end to the
    // text column, a bright tip pointing at the heading)
    if (!ph && c.side === "left" && c.fig) {
      const xl = c.fig.x + c.fig.w - 0.06 * c.vw, fe = line.reveal[2];
      for (let s = Math.max(0, kf - 0.5); s <= S1; s += 0.08) {
        const p = project(c, eye, g.at(s));
        if (p && p.x > xl) { line.reveal = [line.reveal[0], Math.max(line.reveal[0] + 0.02, (s - S0) / (S1 - S0) - fe), fe]; break; }
      }
    }
    /** @type {{ j: number, s: any, box: number[] | null }[]} */ const cand = [];
    /** @type {number[] | null} */ let qIn = null;
    for (let j = 0; j < NODES; j++) {
      const d = j - kf, q0 = g.at(j);
      // (wave 2, FIX) the pane stands BESIDE the line, above it (a station's sign over its track): through its middle the
      // line crossed out the month and the year
      // the line recedes up and to the right: the pane stands up and LEFT of it, so the far line runs past its right edge
      const q = [q0[0] - pw * (ph ? 0.66 : 0.5), q0[1] - phh * (ph ? 0.3 : 0.5), q0[2]];
      if (j === Math.round(kf)) qIn = q;
      const close = clamp(1 - Math.abs(d)) * (1 - m);
      const s = {
        id: "n" + j, cx: q[0], cy: q[1], cz: q[2],
        yaw: -0.36 + 0.1 * Math.sin(j * 1.9), pitch: 0.06, roll: 0.03 * Math.sin(j * 2.7),
        w: pw, h: phh, t: ph ? 14 : 22, tex: null, etch: /** @type {any} */ (null), bevel: ph ? 5 : 9, sheen: 0.6,
        // (FIX3D) clear glass, barely tinted: at full absorption a pane drew darker than the lit wall, a black card
        tint: 0.2,
        // (wave 2) every pane a lit station: its edges full of the line's light, the far ones sharp enough to read
        alpha: 0, glow: 1, sharp: Math.min(1, 0.72 + 0.28 * sstep(0, 1, close) + 0.3 * m),
      };
      const box = boxOf(c, eye, s);
      // the passed ones go out past the eye (the stage fades them inside `nearFull`); the far ones fade into the past
      // a pane draws opaque over the page: one whose box on screen (seen from this frame's eye) meets a text block steps
      // back until the text has gone; a passed pane on its way out past the eye grew into huge dim numerals behind the
      // step's text (phone, 1920): it is now held to zero there
      // (wave 4, PRISM) a phone: a wide margin above and below, so a pane has gone before a text block (the dates line of
      // the step's text) reaches it, never while its numerals lie over the words
      const mx = 20, my = ph ? 64 : 20;
      const hit = box && c.texts.some((/** @type {any} */ r) => r.x < box[2] + mx && r.x + r.w > box[0] - mx && r.y < box[3] + my && r.y + r.h > box[1] - my) ? 1 : 0;
      st["h" + j] = st["h" + j] == null ? hit : ease(st["h" + j], hit, dt, ph && hit > st["h" + j] ? 0.04 : 0.08);
      // the passed ones leave quickly (gone by a third of the way to the next station)
      // (wave 4, PRISM) a phone: a passed pane leaves sooner (its fading numerals lay over the next step's dates line)
      const alpha = Math.max(m, ph ? sstep(-0.24, -0.04, d) : sstep(-0.4, -0.08, d)) * (1 - sstep(3.4, 4.6, d)) * st.clear * (1 - st["h" + j])
        // and they wait until the path holds most of the screen: the stack's text above is not this scene's to see
        * sstep(0.6, 0.9, c.share ?? 1)
        // (wave 3, LIGHT3) a phone: only the pane in step. On a narrow screen the deeper panes stood behind it and beside
        // the line as ghost numerals (cut by the near pane, the line running behind them), and at the head the five
        // stacked into one grey pile of dates; the next pane comes up only as the reader reaches it
        * (ph ? 1 - sstep(0.3, 0.75, d) : 1);
      s.alpha = alpha;
      cand.push({ j, s, box });
    }
    // (wave 6, ROOMS) THE GUARD: the pane nearest its step first; each next one steps back while its box comes within
    // GAP of a pane already shown (all of it at GAP[0]: two dates never touch), and a pane two or more stations away
    // waits for the one before it (the line never skips a station). Geometry only, every frame: no lag behind a fast
    // scroll or the hand, and it settles with them.
    const ord = cand.slice().sort((a, b) => Math.abs(a.j - kf) - Math.abs(b.j - kf) || a.j - b.j);
    /** @type {typeof cand} */ const shown = [];
    for (const p of ord) {
      let a = p.s.alpha;
      if (a >= 0.01 && Math.abs(p.j - kf) > 1) { const pr = cand[p.j + (p.j > kf ? -1 : 1)]; a *= pr ? sstep(0.15, 0.6, pr.s.alpha) : 0; }
      if (a >= 0.01 && p.box) {
        for (const q of shown) {
          const b = /** @type {number[]} */ (q.box), gap = Math.max(b[0] - p.box[2], p.box[0] - b[2], b[1] - p.box[3], p.box[1] - b[3]);
          a *= 1 - sstep(0, 0.12, q.s.alpha) * (1 - sstep(GAP[0], GAP[1], gap));
        }
      }
      p.s.alpha = a;
      if (a >= 0.01 && p.box) shown.push(p);
    }
    const slabs = [];
    for (const p of cand) {
      if (p.s.alpha < 0.01) continue;
      const w = W[p.j];
      p.s.etch = w && w.length ? c.etch("when" + p.j, w, { w: Math.round(pw), h: Math.round(phh), pad: pw * 0.13 }) : null;
      slabs.push(p.s);
    }
    const R = roomFor(c, {
      seed: SEED.about, wall: { z: -WALL_D * D }, eye: [c.vw / 2, c.vh / 2, D],
      subject: { x: A[0], y: A[1] + 0.3 * c.vh, z: A[2], w: pw * 3, h: 1.5 * c.vh, strength: 0.5 },
      ...LIT(c),
      // (wave 2, FIX) no chip in front of the pane in step (chips crossed its month and year)
      clear: qIn && m < 0.5 ? clearOf(c, pose, qIn, pw, phh, 16) : null,
    });
    lookFor(c, R, 2.6);
    return {
      swarm: [
        { id: "light", weight: 1, rect: { x: -50, y: -50, w: 100, h: 100 } },
        { id: "mist", weight: 0.25, rect: { x: 0, y: 0, w: c.vw, h: c.vh } },
      ],
      slabs,
      // (wave 2) a deep focus: at 0.7 the line past the pane in step blurred past the bokeh limit and faded (a comet)
      camera: cam,
      bloom: bloomOf(0.55), field: R.field, rest: 14,
      keepouts: [...R.keepouts, ...c.texts.map((/** @type {any} */ r) => ({ x: r.x - 10, y: r.y - 8, w: r.w + 20, h: r.h + 16 }))],
    };
  },
};

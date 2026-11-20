// @ts-check
/**
 * cut — Consulting 2, video editing (spec "Storia" §3.5, §6.1).
 *
 * The picture of `gen` becomes a strip of frames on a timeline: three shots of the same mark (a push
 * in, a pan across, a wide), each frame a small plate with its perforations, the shots separated by
 * a cut; under them the audio track as a waveform of light, over them a ruler, and a playhead
 * standing still in the middle while the reel moves under it. As the step advances the reel plays
 * (it slides left); the reader's pointer, inside the box, takes the reel and scrubs it by its x;
 * let go (or out of the box), the reel eases back to where playback has it. The frame under the
 * playhead is the brightest: the one on screen.
 */
import { Sets, plate, clamp, smooth, approach, stepProgress, inkFor, rackFocus, hurry } from "./lib.js";
import { DEPTH } from "./shot.js";

const TH = 0.15;                 // a thumbnail's half side
const PITCH = 0.355;             // frame to frame inside a shot
const SHOT_GAP = 0.06;           // extra space at a cut
const SHOTS = [                  // [zoom, crop x, crop y] per frame, three shots
  [[1.0, 0, 0.02], [1.18, 0, 0.0], [1.38, 0, -0.03]],
  [[1.9, -0.32, -0.1], [1.9, -0.12, -0.08], [1.9, 0.1, -0.06]],
  [[0.82, 0.02, 0.04], [0.86, 0.02, 0.04]],
];
const FRAMES = SHOTS.flat();
const K = FRAMES.length;
const PERIOD = K * PITCH + SHOTS.length * SHOT_GAP;
const WIN = 0.92;                // the visible window (local x), the reel fades out past it
const PTS_A = 760;               // points of the A in one frame
const PTS_MON = 2600;            // points of the A in the monitor
const MH = 0.4;                  // the monitor's half side
const Y = { mon: -0.5, ruler: 0.05, frame: 0.28, wave: 0.67, top: -0.01, bottom: 0.84 };

/** Static description of the reel: per target x (reel coordinate), y, z, ink, kind (0 reel, 1 fixed), frame index */
/** @type {{ x: Float32Array, y: Float32Array, z: Float32Array, w: Float32Array, kind: Uint8Array, fr: Int16Array, n: number } | null} */
let reel = null;
/** @type {Float32Array | null} */ let A0 = null;

/** @param {number} k */
const shotOf = (k) => { let n = 0; for (let s = 0; s < SHOTS.length; s++) { n += SHOTS[s].length; if (k < n) return s; } return SHOTS.length - 1; };

/** frame k's centre on the reel @param {number} k */
function frameX(k) {
  let x = 0, kk = 0;
  for (let s = 0; s < SHOTS.length; s++) {
    for (let f = 0; f < SHOTS[s].length; f++, kk++) {
      if (kk === k) return x;
      x += PITCH;
    }
    x += SHOT_GAP;
  }
  return x;
}

/** @param {Float32Array} A the plate's points (x, y, light) */
function buildReel(A) {
  const S = new Sets(20000);
  /** @type {number[]} */ const kind = [];
  /** @type {number[]} */ const fr = [];
  const add = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z, /** @type {number} */ w, /** @type {number} */ k, /** @type {number} */ f) => { S.push(x, y, z, w); kind.push(k); fr.push(f); };
  for (let k = 0; k < K; k++) {
    const cx = frameX(k), [zm, ox, oy] = FRAMES[k];
    // the frame's edge
    const per = 64;
    for (let i = 0; i < per; i++) {
      const t = i / per;
      add(cx - TH + 2 * TH * t, Y.frame - TH, 0, 0.42, 0, k); add(cx + TH, Y.frame - TH + 2 * TH * t, 0, 0.42, 0, k);
      add(cx + TH - 2 * TH * t, Y.frame + TH, 0, 0.42, 0, k); add(cx - TH, Y.frame + TH - 2 * TH * t, 0, 0.42, 0, k);
    }
    // the A inside it, cropped by the shot's framing (points outside the frame wait dark on its edge)
    for (let i = 0; i < PTS_A; i++) {
      const j = ((i * 7919 + k * 104729) % 16000) * 3;
      const px = (A[j] - ox) * zm * 0.9, py = (A[j + 1] - oy) * zm * 0.9;
      const inside = Math.abs(px) < 0.97 && Math.abs(py) < 0.97;
      add(cx + clamp(px, -0.97, 0.97) * TH, Y.frame + clamp(py, -0.97, 0.97) * TH, 0.004, inside ? 0.3 + 1.0 * A[j + 2] : 0, 0, k);
    }
    // perforations above and below the frame
    for (let h = 0; h < 5; h++) {
      const hx = cx - TH + (h + 0.5) * (2 * TH / 5);
      for (const hy of [Y.frame - TH - 0.045, Y.frame + TH + 0.045]) {
        for (let q = 0; q < 8; q++) {
          const a = (q / 8) * Math.PI * 2;
          add(hx + Math.cos(a) * 0.011, hy + Math.sin(a) * 0.008, 0, 0.22, 0, k);
        }
      }
    }
  }
  // the ruler's ticks (a long one every second, every fourth a little taller)
  const tick = PERIOD / 32;
  for (let t = 0; t < 32; t++) {
    const x = t * tick, hgt = t % 4 === 0 ? 0.05 : 0.022;
    for (let q = 0; q < 8; q++) add(x, Y.ruler - (q / 7) * hgt, 0, 0.34, 0, -1);
  }
  // the audio track: a waveform of light, quieter at the cuts
  const bars = 96;
  for (let b = 0; b < bars; b++) {
    const x = (b / bars) * PERIOD;
    let cut = 1;
    for (let s = 1; s <= SHOTS.length; s++) {
      let ex = 0; for (let k = 0; k < s; k++) ex += SHOTS[k].length * PITCH + SHOT_GAP;
      ex -= SHOT_GAP * 0.5 + PITCH * 0.5;
      cut = Math.min(cut, smooth(0.0, 0.08, Math.abs(((x - ex + PERIOD * 1.5) % PERIOD) - PERIOD * 0.5)));
    }
    const env = 0.25 + 0.75 * Math.abs(Math.sin(x * 2.1) * 0.6 + Math.sin(x * 5.3 + 1) * 0.3 + Math.sin(x * 13.7 + 2) * 0.25);
    const a = 0.012 + 0.11 * env * (0.25 + 0.75 * cut);
    for (let q = 0; q < 22; q++) add(x, Y.wave - a + (q / 21) * 2 * a, 0, 0.3, 0, -1);
  }
  // fixed parts: the ruler's line, the track's centre line, the playhead and its cap
  for (let i = 0; i < 260; i++) { const x = -WIN + (2 * WIN * i) / 259; add(x, Y.ruler, 0, 0.22, 1, -1); }
  for (let i = 0; i < 180; i++) { const x = -WIN + (2 * WIN * i) / 179; add(x, Y.wave, 0, 0.1, 1, -1); }
  for (let i = 0; i < 300; i++) add(0, Y.top + 0.06 + (i / 299) * (Y.bottom - Y.top - 0.06), 0.02, 1.0, 1, -1);
  for (let i = 0; i < 90; i++) { const r = i / 90; const a = r * Math.PI * 2 * 3; add(Math.cos(a) * 0.022 * (0.3 + r), Y.top + 0.03 + Math.sin(a) * 0.022 * (0.3 + r), 0.02, 1.2, 1, -1); }
  // the monitor: the frame under the playhead, large, above the timeline (its picture is laid per frame)
  for (let i = 0; i < 4 * 120; i++) {
    const sd = (i / 120) | 0, t = (i % 120) / 120, e = MH + 0.03;
    const x = sd === 0 ? -e + 2 * e * t : sd === 1 ? e : sd === 2 ? e - 2 * e * t : -e;
    const y = sd === 0 ? -e : sd === 1 ? -e + 2 * e * t : sd === 2 ? e : e - 2 * e * t;
    add(x, Y.mon + y, 0, 0.4, 1, -1);
  }
  for (let i = 0; i < PTS_MON; i++) add(0, Y.mon, 0, 0, 2, ((i * 6151) % 16000));
  const n = S.n, d = S.d;
  const o = { x: new Float32Array(n), y: new Float32Array(n), z: new Float32Array(n), w: new Float32Array(n), kind: Uint8Array.from(kind), fr: Int16Array.from(fr), n };
  for (let i = 0; i < n; i++) { o.x[i] = d[i * 4]; o.y[i] = d[i * 4 + 1]; o.z[i] = d[i * 4 + 2]; o.w[i] = d[i * 4 + 3]; }
  return o;
}

/** The reel placed at offset `off` (the reel coordinate under the playhead). @param {number} off */
function layout(off) {
  if (!reel) return null;
  const d = new Float32Array(reel.n * 4);
  // the frame under the playhead
  let cur = 0, best = 1e9;
  for (let k = 0; k < K; k++) {
    let dx = ((frameX(k) - off) % PERIOD + PERIOD * 1.5) % PERIOD - PERIOD * 0.5;
    if (Math.abs(dx) < best) { best = Math.abs(dx); cur = k; }
  }
  // the monitor's framing: between two frames of a shot it glides, across a cut it jumps
  const fx = (((off - frameX(cur)) % PERIOD) + PERIOD * 1.5) % PERIOD - PERIOD * 0.5;
  const nb = fx >= 0 ? (cur + 1) % K : (cur + K - 1) % K;
  const sameShot = shotOf(nb) === shotOf(cur);
  const g = sameShot ? Math.min(1, Math.abs(fx) / PITCH) : 0;
  const F = FRAMES[cur].map((v, q) => v + (FRAMES[nb][q] - v) * g);
  for (let i = 0; i < reel.n; i++) {
    let x = reel.x[i], w = reel.w[i], z = reel.z[i];
    if (reel.kind[i] === 2 && A0) {
      const j = reel.fr[i] * 3;
      const px = (A0[j] - F[1]) * F[0] * 0.9, py = (A0[j + 1] - F[2]) * F[0] * 0.9;
      const inside = Math.abs(px) < 0.985 && Math.abs(py) < 0.985;
      d[i * 4] = clamp(px, -0.985, 0.985) * MH; d[i * 4 + 1] = Y.mon + clamp(py, -0.985, 0.985) * MH;
      d[i * 4 + 2] = 0.03 * A0[j + 2]; d[i * 4 + 3] = inside ? 0.18 + 0.85 * A0[j + 2] : 0;
      continue;
    }
    if (reel.kind[i] === 0) {
      x = ((x - off) % PERIOD + PERIOD * 1.5) % PERIOD - PERIOD * 0.5;
      // a gentle curve of the reel in depth, like film on a drum: the ends lean away
      z += -0.22 * x * x;
      w *= 1 - smooth(WIN - 0.22, WIN, Math.abs(x));
      if (reel.fr[i] === cur) w *= 1.55; else if (reel.fr[i] >= 0) w *= 0.8;
    }
    d[i * 4] = x; d[i * 4 + 1] = reel.y[i]; d[i * 4 + 2] = z; d[i * 4 + 3] = w;
  }
  return { data: d, path: 0, closed: false };
}

export default {
  share: 0.5, fill: 0.97, fit: "contain", inkArea: 300000, capacity: 22000,
  look: { ink: 0.03, size: 1.15, mistInk: 0.01, mistSize: 1.2 },
  motion: { spring: 6.5, speed: 900, inertia: 0.12, fuzz: 0.8 },
  flow: { amp: 2.5, wavelength: 200, evolution: 0.05, z: 0.6 },
  respond: { hand: 0.4, wind: 0.3, fadeIn: 4, fadeOut: 9 },
  emit: 0,
  async targets() {
    const P = await plate(16000);
    A0 = P.pts;
    reel = buildReel(P.pts);
    return /** @type {any} */ (layout(frameX(0)));
  },
  /** @param {any} c */
  update(c) {
    const s = c.state;
    // playback: the reel plays as the step advances (two shots' worth over the step)
    const play = frameX(0) + stepProgress(c.scene, 2) * (PERIOD * 0.62);
    s.off ??= play;
    const p = c.pointer;
    // the hand on the reel: a hovering pointer or a touching finger inside the box
    const scrub = p.present && p.inside;
    let want = play;
    if (scrub) want = play + clamp(p.local.x, -1, 1) * PERIOD * 0.45;
    s.off = approach(s.off, want, c.dt, scrub ? 0.09 : 0.42);
    if (s.laid == null || Math.abs(s.off - s.laid) > 0.0004) {
      const set = layout(s.off);
      if (set) { c.setTargets(set); s.laid = s.off; }
    }
    // arriving from gen it is already in place (gen shrinks into the monitor); leaving, it recedes
    // the figure lands fast on its step (fix-stage: no seconds of streaks after a step change)
    const h = hurry(c, c.scene.step >= 2 ? 2 : 0, { spring: 6.5, speed: 900, inertia: 0.12 }, 2.5);
    return { rotate: [0.08, -0.1, 0], offset: [0, 0, typeof DEPTH.cut === "number" ? DEPTH.cut : c.scene.step > 2 ? rackFocus(c, 2) : 0], ink: inkFor(c.rect, 300000, 0.7), motion: h.motion, flow: h.flow };
  },
};

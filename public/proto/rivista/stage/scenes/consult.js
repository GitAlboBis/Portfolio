// @ts-check
/**
 * consult — Consulting's scene (spec 50 §4; the figures as built, spec 10 §6.1): four ways to work with him, one
 * living figure per step, in light: gen (step 1), cut (2), code (3), agents (4).
 *
 * Wave 1 (lane NIGHT, plan 70 phase 1): the figures stand in the studio's lit room (scenes/lib/room.js: the wall's
 * grid, the chips cut as the A and the SerSan mark, blades of light with body, the bloom), each at ITS OWN PLACE in the
 * room's depth, and the page is one continuous shot: the eye walks through the room from one figure to the next (a
 * truck to the side and a step deeper per figure, holding while a step is read, travelling across the boundary),
 * never a cut and never a figure swapping in place. While the eye walks, the same points leave the figure behind and
 * gather at the next one ahead. A blade of light stands on the figure in step; the room warms down the page. At rest
 * the eye drifts on the stage's clock; the hand orbits it about the figure (a horizontal drag on touch); a fast
 * scroll widens the lens a little.
 *
 * The first screen (the head) opens on gen, already half made, lit, in the room.
 */
import gen, { frame } from "../night/gen.js";
import cut from "../night/cut.js";
import code from "../night/code.js";
import agents from "../night/agents.js";
import { DEPTH, eyeD, home, shot, stations, sstep, lookFor, roomFor, bloomOf, SEED, LIT } from "../night/shot.js";
import { GEN, genSigma } from "../night/gen.js";

const IDS = ["gen", "cut", "code", "agents"];

/** (wave 5, GLASS2) THE MADE MARK AS ONE SOLID OF LIGHT. Three rounds of points (lattice, rows, larger points) still left
 *  a fine mottle and the wall's grid showing through the made SerSan mark: points cannot close into flat faces. Once
 *  gen's picture is made, the mark is a thin block of Gaussian splats (stage/splat: gen.mark(), the end card's crop the
 *  points are drawn from) laid exactly over the points' picture, its own colours (the white half paper, the blue half
 *  cobalt), flat; the points fade under it (GEN.cover, read by night/gen.js) only while the set is on a live pass.
 *  The pass is loaded after the first frame (a dynamic import, as the cover's splat name): no cost to the boot; with
 *  ?failsplat=1, a dead pass, no WebGPU or ?stage=0 the points' picture stays as it was. */
const GM = { /** @type {any} */ mod: null, loading: /** @type {Promise<void> | null} */ (null), dead: false };
function genMark() {
  if (GM.loading || GM.dead) return;
  GM.loading = import("../splat/splat.js").then(async (m) => { await m.putSplats("genmark", m.gen.mark({ res: 520, depth: 0.03, colors: { light: "#f4f1ea", dark: "#3d58de" }, rings: [0.9, 2.1, 3.3], ringSigma: 0.5, sides: false })); GM.mod = m; }, () => { GM.dead = true; })
    .catch(() => { GM.dead = true; });
}

/** each figure's place in the room, against the first (x in viewport widths, y in heights, z in eye distances D) */
const PLACES = {
  desk: [[0, 0, 0], [0.24, 0, -0.3], [-0.03, 0.02, -0.6], [0.2, 0, -0.9]],
  phone: [[0, 0, 0], [0.1, -0.02, -0.3], [-0.06, 0.02, -0.6], [0.08, 0, -0.9]],
};

export default {
  // the frame of gen's picture is its own still formation (night/gen.js). It is registered FIRST: the host numbers the
  // formations in page order and neighbours must alternate (an odd and an even order draw from opposite ends of the
  // population), so frame 0, gen 1, cut 2, code 3, agents 4 and the dawn's threads 5 keep every neighbour apart
  formations: { frame, gen, cut, code, agents },
  /** @param {any} c */
  frame(c) {
    const D = eyeD(c.vw, c.vh), ph = c.phone;
    // the reader's place: the head and step 1 hold on gen, then one station per step (the travel across a boundary)
    const x = c.step ? c.step - 1 + c.local - 0.5 : 0;
    const kf = stations(Math.max(0, x), 4);
    const P = (ph ? PLACES.phone : PLACES.desk).map((p) => [p[0] * c.vw, p[1] * c.vh, p[2] * D]);
    const i0 = Math.min(2, Math.floor(kf)), f = kf - i0;
    const T = [0, 1, 2].map((j) => P[i0][j] + (P[i0 + 1][j] - P[i0][j]) * f);
    // the figure's rect as the page gave it, moved to its place (it shows there, at that size, when the eye stands at
    // its station)
    const R0 = inset(c.fig, ph);
    const swarm = IDS.flatMap((id, k) => {
      DEPTH[id] = P[k][2];
      // (FIX3D) a longer overlap: halfway between two stations both figures hold about 0.6 (at 1.15 both were 0.39 and
      // the frame went sparse for a beat)
      const w = sstep(0, 1, 1 - Math.abs(kf - k) * 0.85);
      const rect = { x: R0.x + P[k][0], y: R0.y + P[k][1], w: R0.w, h: R0.h };
      const it = { id, weight: w, rect };
      return k === 0 ? [it, { ...it, id: "frame" }] : [it];
    });
    // the eye: the straight view carried to the station (a truck and a step into the room), holding the figure where
    // the page put it; the hand orbits it about the figure
    const H = home(c);
    const piv = [R0.x + R0.w / 2 + T[0], R0.y + R0.h / 2 + T[1], T[2]];
    const pose = { ...H, pos: [H.pos[0] + T[0], H.pos[1] + T[1], H.pos[2] + T[2]], target: [H.target[0] + T[0], H.target[1] + T[1], H.target[2] + T[2]], pivot: piv };
    // the room: its wall far behind the last figure; a blade on the figure in step
    const R = roomFor(c, {
      seed: SEED.consult, wall: { z: -1.55 * D }, eye: [c.vw / 2, c.vh / 2, D],
      center: [c.vw / 2 + 0.5 * P[3][0], c.vh / 2],
      // a tall soft band behind the figure: its lower edge falls below the frame (no line across the room)
      subject: { x: piv[0], y: piv[1] + 0.3 * c.vh, z: piv[2], w: R0.w * 1.1, h: 1.5 * c.vh },
      ...LIT(c),
    });
    lookFor(c, R);
    // (GLASS2) the made mark: over gen's points' picture once it is made (u: the picture's local unit, half the rect's
    // smaller side at the formation's fill; the splat crop's 240 px are 1.28 u of the points' 300 px crop, 0.9 of a set unit)
    genMark();
    const made = sstep(0.03, 0.0, genSigma({ step: c.step, local: c.local }));
    const gw = sstep(0, 1, 1 - Math.abs(kf) * 0.85);
    let passes;
    const shown = GM.mod ? GM.mod.splatShown("genmark") : 0;
    if (GM.mod && made * gw > 0.002) {
      const u = (Math.min(R0.w, R0.h) / 2) * 0.97;
      passes = { splat: { sets: [{ id: "genmark", pos: [R0.x + R0.w / 2 + P[0][0] + 0.016 * u, R0.y + R0.h / 2 + P[0][1] - 0.021 * u, P[0][2]],
        size: Math.round(((1.28 * u) / 0.9) * 100) / 100, rot: [0, 0, 0], settle: 1, alpha: Math.round(made * gw * 1e4) / 1e4, shade: 0, shadeColor: [0.24, 0.345, 0.87], emit: 0.45 }] } };
    }
    GEN.cover = shown > 0 ? Math.round(made * gw * shown * 1e4) / 1e4 : 0;
    return {
      ...(passes ? { passes } : {}),
      swarm,
      // (wave 5, GLASS2) the lens closes as the section leaves the screen: blended with the dawn close, a wide aperture
      // drew its ruled ink strokes as a soft blue band (the dawn asks for a sharp page plane)
      camera: shot(c, pose, { fog: [3.4 * D, 7.5 * D], aperture: 0.7 * (c.section ? 0.02 + 0.98 * sstep(0.8, 1.15, (c.section.y + c.section.h) / c.vh) : 1) }),
      bloom: bloomOf(0.55),
      field: R.field, keepouts: R.keepouts, rest: 14,
    };
  },
};

/** the figure's half with a margin, so a figure never touches the view's edge @param {any} f @param {boolean} phone */
function inset(f, phone) {
  const m = Math.min(f.w, f.h) * (phone ? 0.04 : 0.08);
  return { x: f.x + m, y: f.y + m, w: Math.max(1, f.w - 2 * m), h: Math.max(1, f.h - 2 * m) };
}


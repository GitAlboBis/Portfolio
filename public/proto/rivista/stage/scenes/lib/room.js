// @ts-check
/**
 * room.js — THE ROOM (wave 1, lane KIT): any scene stands in the cover's lit hall with one call. The cover's own code
 * (scenes/cover/world.js hallField) stays the cover's; this is the same room, generalised for a page that looks at it
 * from the page's straight view (or from a camera the scene moves through it):
 *
 *   wall    the studio's back wall, its grid in relief (the cover's cell, line, relief, specular, shimmer)
 *   chips   cut glass shaped as the letter A and the SerSan mark at every depth, with the cover's classes (a few large
 *           near ones, a middle population, the marks deep, a far dust by the wall) and their edge light (rim)
 *   lights  two BLADES that travel across the wall on the stage's clock (half a cycle apart: one is always in the
 *           room), with haze (their shafts, at a slant from above); the HAND's blade where the pointer aims (desktop,
 *           with weight); optionally a SUBJECT's light, a broad soft band on the wall behind a plate or a figure, that
 *           follows it with weight
 *   keep    the scene's text kept clear: the light, the chips and the swarm stay out of these rectangles (the host's
 *           ctx.textRects(): text blocks at their final layout box, display titles, controls, the header's words)
 *
 *   import { room } from "./lib/room.js";
 *   const R = room(c, { temp: 0.2, seed: 3 });
 *   if (c.look) c.look({ ...R.look });            // soft edges round the kept-clear text (40 px, outward only)
 *   return { camera, bloom: 0.5, field: R.field, keepouts: [...R.keepouts, ...mine] };
 *
 * Returns { field, keepouts, look } (field null when the scene's weight is 0 or `off`). Everything is in the free camera's
 * space (x, y viewport css px at the current scroll, z px toward the reader, the page plane z = 0); the room is fixed
 * to the viewport (the scroll moves the page through it), like the cover's hall. Nothing here reads the DOM.
 * Anything that moves at rest runs on c.clock.time (the stage's clock: it stops when the stage sleeps).
 */

const clamp = (/** @type {number} */ x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const fr = (/** @type {number} */ x) => x - Math.floor(x);

/** the stage's eye distance at lens 1 (stage.js LOOK.eye x the viewport's diagonal, clamped): the straight view's eye
 *  stands at z = eyeD above the page plane */
export const eyeD = (/** @type {number} */ w, /** @type {number} */ h) => clamp(1.25 * Math.hypot(w, h), 1100, 2600);

/** seconds a travelling blade takes to cross and come round (the cover's BLADE_S) */
export const ROOM_BLADE_S = 30;

/** chips at tier A by device, and each tier's share of that (the field then draws B half, C a quarter) */
// (lane o-fix) 9000 / 6000 -> 4000 / 2600: the chips filled every room and the index and competed with the prism, the
// plates and the emblems (the critic's finding 7); a room keeps them as depth, not as a pattern over everything
const CHIPS = { desk: 4000, phone: 2600 };
const TIER_K = /** @type {Record<string, number>} */ ({ A: 1, B: 0.8, C: 0.6 });
const HAZE_K = /** @type {Record<string, number>} */ ({ A: 1, B: 0.7, C: 0 });

/**
 * @typedef {{
 *   center?: number[], eye?: number[],
 *   wall?: { z?: number, size?: number, alpha?: number },
 *   chips?: number, depth?: number, scale?: number,
 *   temp?: number, dim?: number, seed?: number,
 *   blades?: number, period?: number, haze?: number, hand?: boolean, sweep?: number[],
 *   subject?: { x: number, y: number, z?: number, w?: number, h?: number, strength?: number } | null,
 *   keep?: { x: number, y: number, w: number, h: number }[] | null, pad?: number, header?: boolean,
 *   clear?: { rect: number[], point: number[] } | null,
 *   fade?: number, alpha?: number, off?: boolean,
 * }} RoomOpts
 *   center   [x, y] the room's middle (viewport px; default the viewport's centre)
 *   eye      [x, y, z] where the eye stands (default the straight view, [vw/2, vh/2, D]); the chips reach to just short
 *            of it and the wall's size follows its distance
 *   wall     z the wall's depth (default -0.6 D: behind the page plane), size its extent against the default (1),
 *            alpha (1)
 *   chips    tier A's count (default 9000 desktop, 6000 phone; 0 = none); the kit thins it on tier B and C
 *   depth    how far the chips reach from the wall toward the eye, 0..1 (default 1: all the way)
 *   scale    the chips' size (1)
 *   temp     0 cool (toward cobalt) … 1 warm (paper white): the blades', the subject's and the chips' edge light
 *   dim      0 … 1: the room's light and chips go down (1 = the wall's grid barely there, no blades)
 *   seed     per page: the chips' scatter and the blades' phase
 *   blades   travelling blades (0–2, default 2); period s for one to cross and come round (30); haze their shafts
 *            (default 0.13 desktop, 0.09 phone; tier B 70 %, C none)
 *   hand     the hand's blade on a desktop (default true)
 *   sweep    [lo, hi] in -1 (the wall's left) .. 1 (its right): where the blades and the hand's blade may fall (default
 *            [-1, 1], the whole wall)
 *   subject  a plate or a figure: a soft broad light on the wall behind it, following it with weight (strength, default
 *            0.42)
 *   keep     rectangles to keep clear (viewport px); default c.textRects({ pad, header }) (pad 14, header true)
 *   clear    the field's clear rectangle (the chips nearer than `point` stay out of `rect`): a display object the scene
 *            draws in light (the cover's name)
 *   fade     s the field takes to come in (0.25: the page opens on a lit wall, as the cover does); alpha the whole
 *            room's presence (1); off: nothing
 *   keepDim  (wave 1, FIX3D) the wall round the kept text: { floor, fall, haze } it is DIMMED to floor inside a kept
 *            rect over a fall of that many px (default floor 0.18, fall 150 desktop / 0.22, 80 phone; haze 0.12), never
 *            cut out (a hole the size of a block of text read as a black card); false: cut, as before
 *   glow     (wave 2, GLOW-WORK) 0 … 1: the room as lit as the cover's hall (default 0: today's image). The blades come
 *            down as the cover's do (from high above, close in front of the wall: a column of light with body in its
 *            haze), their travel kept inside the part of the wall the frame shows (one is always on screen), brighter
 *            and with more haze; more chips, the middle population larger and rimmed as the cover's; the unlit wall a
 *            little up so its grid reads across the frame, not only round the subject
 */

/**
 * The room for this frame.
 * @param {any} c the scene's context
 * @param {RoomOpts} [o]
 * @returns {{ field: any, keepouts: { x: number, y: number, w: number, h: number }[], look: { keepFeather: number } }}
 */
export function room(c, o = {}) {
  const keepouts = o.keep ? o.keep.slice() : typeof c.textRects === "function" ? c.textRects({ pad: o.pad ?? 14, header: o.header !== false }) : [];
  /** @type {any} */ const kd = /** @type {any} */ (o).keepDim;
  // the keep-outs' fall, outward from each rect (the stage's look; the text itself is never touched): 6 px cut a hard
  // dark rectangle out of the lit wall (the cover's finding), 40 px is a soft shadow of the words
  const look = { keepFeather: 40 };
  if (o.off) return { field: null, keepouts, look };
  const vw = c.vw, vh = c.vh, ph = !!c.phone, tier = c.tier || "A", D = eyeD(vw, vh);
  const cx = o.center ? o.center[0] : vw / 2, cy = o.center ? o.center[1] : vh / 2;
  const eye = o.eye || [vw / 2, vh / 2, D];
  const temp = clamp(o.temp ?? 0.3), dim = clamp(o.dim ?? 0), live = 1 - dim, a0 = clamp(o.alpha ?? 1);
  const seed = Math.round(o.seed ?? 1);
  /** @type {number} */ const G = clamp(/** @type {any} */ (o).glow ?? 0);
  const t = c.clock ? c.clock.time : c.time || 0;
  /** @type {any} */ const S = c.state ? (c.state.__room = c.state.__room || {}) : {};

  // ------------------------------------------------ the box: from the wall to just short of the eye
  const wallZ = o.wall && typeof o.wall.z === "number" ? o.wall.z : -0.6 * D;
  const far = eye[2] - wallZ;                                                      // the wall's distance from the eye
  const front = mix(wallZ + 0.2 * far, eye[2] - 0.08 * D, clamp(o.depth ?? 1));
  const depth = Math.max(200, front - wallZ);
  // the wall's size on screen at its distance (the straight lens): the field's extent must outrun the frame
  const wallW = vw * far / D, wallH = vh * far / D, ws = o.wall && o.wall.size ? o.wall.size : 1;
  // the page plane's depth fraction in the box (where the middle population gathers)
  const fPage = clamp((0 - wallZ) / depth, 0.15, 0.85);

  const nC = Math.round((o.chips ?? (ph ? CHIPS.phone : CHIPS.desk)) * (TIER_K[tier] ?? 1) * (1 + 0.35 * G));
  const scl = o.scale ?? 1, sMid = mix(1, 1.3, G);
  /** @type {any} */ const field = {
    // (wave 2, GLOW-WORK) a page reached by a cut is lit under the arriving sheet: no rise at all (ctx.arrival, ARRIVE)
    fade: o.fade ?? (c.arrival && c.arrival.cut ? 0 : 0.25), hazeEnd: 0.6 * D,
    wall: {
      point: [cx, cy + 0.05 * vh, wallZ], normal: [0, 0, 1],
      cell: 0.058 * D, line: 1.6, relief: 0.06,
      extent: [(wallW * 1.6 + 1600) * ws, (wallH * 1.6 + 1200) * ws],
      unlit: mix(0.03, 0.05, G) * mix(1, 0.6, dim), lit: [0.9, 0.12], spec: 0.22, grain: 0.03, displace: 6,
      alpha: a0 * clamp(o.wall && typeof o.wall.alpha === "number" ? o.wall.alpha : 1) * (1 - 0.6 * dim),
      keep: kd === false ? null : { floor: (kd && kd.floor) ?? (ph ? 0.22 : 0.18), fall: (kd && kd.fall) ?? (ph ? 80 : 150), haze: (kd && kd.haze) ?? 0.12 },
    },
  };
  if (nC > 0) {
    field.chips = {
      count: Math.min(16000, nC),
      center: [cx, cy, (wallZ + front) / 2],
      size: [wallW * 1.5 + 900, wallH * 1.5 + 700, depth],
      wind: [6, -2.5, 7], spin: 0.32, sizes: ph ? [9, 22] : [9, 24],
      shapes: [
        // the near ones, large, a few cut by the frame's edge (the text's keep-outs hold them off the words)
        { shape: "A", weight: mix(0.08, 0.1, G), depth: 0.9, width: 0.06, scale: mix(2.4, 2.7, G) * scl },
        // the middle population, about the page's plane
        { shape: "A", weight: 0.44, depth: fPage, width: 0.26, scale: sMid * scl },
        // the SerSan marks deep (under about 10 device px the mark reads as a ring: kept large)
        { shape: "mark", weight: 0.2, depth: fPage * 0.45, width: 0.14, scale: 2.6 * scl },
        // the far dust by the wall
        { shape: "A", weight: 0.28, depth: 0.05, width: 0.07, scale: 0.75 * scl },
      ],
      body: 0.045, edge: mix(0.4, 0.55, G), rim: mix(mix(0.55, 1, temp), 1, G), bevel: 12, glint: 2.6, transmit: 0.34, near: 170, cap: 9,
      seed: 11 + seed * 7,
      alpha: a0 * (1 - 0.8 * dim),
    };
    if (o.clear && Array.isArray(o.clear.rect) && o.clear.point) field.chips.clear = { rect: o.clear.rect, point: o.clear.point };
  }

  // ------------------------------------------------ the light
  /** @type {any[]} */ const lights = [];
  const haze = (o.haze ?? mix(ph ? 0.09 : 0.13, ph ? 0.12 : 0.17, G)) * (HAZE_K[tier] ?? 1);
  // the blades: one cool and one warmer at temp 0, both near paper at temp 1 (the field's tint: 0 paper … 1 cobalt)
  const tints = [mix(0.72, 0.18, temp), mix(0.4, 0.0, temp)];
  const nB = Math.max(0, Math.min(2, Math.round(o.blades ?? 2))), period = Math.max(6, o.period ?? ROOM_BLADE_S);
  const ph0 = fr(seed * 0.6180339);
  // (wave 1, WORK) where the blades may cross the wall, -1 (its left) .. 1 (its right): a page with its text in one
  // half keeps the light on the figure's half (a blade cut by the text's keep-out read as a dark card)
  const sw0 = o.sweep ? clamp(o.sweep[0], -1, 1) : -1, sw1 = o.sweep ? clamp(o.sweep[1], -1, 1) : 1;
  // (wave 3, LIGHT3) PARALLEL SHAFTS. Two blades leaning opposite ways crossed behind every page as a large grey X (a
  // stamp, a page crossed out). Now every blade leans the same way as the cover's shaft (from the upper right, down to
  // the lower left), so light never draws a figure: the MAIN shaft swings slowly to and fro inside the sweep (it never
  // leaves the frame, so a page at rest always has its one clear shaft with its bright core), and a SECOND, narrower and
  // dimmer, keeps a fixed distance from it on one side (the seed's), fading out when that place leaves the sweep: it
  // can never touch or cross the main one. The seed places each page's shafts (phase, side, slant), so no two rooms
  // look stamped. Both run on the stage's clock.
  const hs = fr(seed * 0.3819660), side = hs < 0.5 ? -1 : 1;
  const lean = mix(0.85, 1.2, fr(seed * 0.7548777));               // the slant (per page, always the same way)
  const reach = mix(0.42, 0.34, G) * wallW;                          // the wall's half the frame shows (FIX3D, GLOW)
  const span = (sw1 - sw0) * reach, base = mix(cx, eye[0], G) + sw0 * reach;
  // to and fro: a cosine on the stage's clock, 1.6 x the old crossing's period (slow), the seed's phase
  const kx = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / (1.6 * period) + ph0));
  const x1 = base + span * mix(0.08, 0.92, kx);
  const sep = Math.max(0.5 * vw * far / D, 0.55 * span);              // at least half the frame apart on screen
  /** @type {any} */ const aim = /** @type {any} */ (o).aim;
  if (aim && Array.isArray(aim.at)) {
    // (wave 4, PRISM) THE AIMED SHAFT: the room's one shaft comes down from the upper right (the rooms' lean) onto a
    // subject (the index's prism) and ends in it (its length runs out there, so it never lights the wall beyond); the
    // second blade stays dark. at: the point it ends in; from: where it starts (default high above, a little right);
    // radius (px), strength, tint (0 paper … 1 cobalt)
    const A = aim.at, F = aim.from || [A[0] + 0.32 * vw, A[1] - 2.4 * vh, A[2] + 0.12 * D];
    const L = Math.hypot(A[0] - F[0], A[1] - F[1], A[2] - F[2]);
    const sx = aim.strength ?? 1.1;
    lights.push({
      pos: F, target: A, radius: aim.radius ?? 0.03 * D, aspect: aim.aspect ?? 1.4, roll: 0, spread: 0.004, soft: 0.5, across: [0, 0, 1],
      strength: Math.round(sx * live * a0 * 1e5) / 1e5, tint: aim.tint ?? 0.06, length: Math.round(L * (aim.over ?? 1.12)),
      haze: haze * (aim.haze ?? 1.5), wall: 0, chips: 1,
    });
  }
  for (let i = 0; i < (aim ? 0 : nB); i++) {
    const xw = i === 0 ? x1 : x1 + side * sep;
    // the second fades out as its place leaves the sweep (and so never lies across the text's half)
    const u = (xw - base) / Math.max(1, span);
    const env = i === 0 ? 1 : sstep(-0.05, 0.12, u) * (1 - sstep(0.88, 1.05, u));
    const k2 = i === 0 ? 1 : 0.62;
    if (env < 1e-3) continue;
    lights.push({
      // (GLOW) the cover's geometry: from high above, close in front of the wall, so the shaft stands as a column
      // (wave 2, FIX) a real slant (the cover's shafts read at ~25 degrees in its frame): the width axis is held toward
      // the reader (field `across`), so the leaning blade keeps its body instead of turning edge-on
      pos: [xw + lean * mix(0.55, 1.05, G) * vw, cy - 3.2 * vh, mix(Math.min(eye[2] - 0.3 * D, 0.2 * D), wallZ + 0.28 * D, G)],
      target: [xw, cy - 0.12 * wallH, wallZ],
      // (FIX) narrower, harder edged and deeper toward the reader: a shaft with a bright core, not a broad soft column
      radius: mix(0.075, 0.048, G) * D * k2, aspect: mix(2.2, 3.6, G), roll: 0, spread: mix(0.03, 0.012, G), soft: mix(0.75, 0.38, G),
      ...(G > 0 ? { across: [0, 0, 1] } : {}),
      // (wave 4, PRISM) a lit room's shafts no brighter at their core than the cover's: 1.45 / 1.9 read 0.20 against the
      // cover's 0.18 on the same measure (Obla's room), now about 15 % down
      strength: Math.round(mix(1.25, 1.24, G) * (i === 0 ? 1 : 0.55) * env * live * a0 * 1e5) / 1e5, tint: tints[i], length: 16000,
      haze: haze * mix(1, 1.6, G) * (i === 0 ? 1 : 0.6), wall: 1, chips: 1,
    });
  }
  // the subject's light: from just in front of it along the eye's ray onto the wall behind it, a broad soft band
  if (o.subject) {
    const sj = o.subject, sz = sj.z ?? 0;
    const k = S.sjT == null ? 1 : clamp((t - S.sjT) / 0.35);       // with weight: 0.35 s behind the subject
    S.sjT = t;
    S.sj = S.sj ? S.sj.map((v, i) => mix(v, [sj.x, sj.y, sz][i], k)) : [sj.x, sj.y, sz];
    const N = S.sj, h = Math.max(80, sj.h ?? 0.4 * vh), w = Math.max(80, sj.w ?? h * 1.6);
    const dir = norm([N[0] - eye[0], N[1] - eye[1], N[2] - eye[2]]), o0 = [N[0] - dir[0] * 0.15 * D, N[1] - dir[1] * 0.15 * D, N[2] - dir[2] * 0.15 * D];
    const s = (wallZ - N[2]) / (dir[2] || -1);
    const tw = [N[0] + dir[0] * s, N[1] + dir[1] * s - 0.15 * wallH, wallZ];
    const dist = Math.hypot(tw[0] - o0[0], tw[1] - o0[1], tw[2] - o0[2]);
    lights.push({
      pos: o0, target: tw, radius: h * 0.8, aspect: clamp(w / h, 1.2, 3), roll: 0,
      spread: Math.atan(Math.max(0, 0.36 * wallH - h * 0.8) / Math.max(1, dist)), soft: 1,
      // (lane o-fix) it goes in the cut's flight too, with the subject's plate
      strength: (typeof sj.strength === "number" ? sj.strength : 0.42) * live * a0 * (1 - sstep(0, 0.12, c.flight || 0)), tint: mix(0.5, 0.05, temp), length: 16000, haze: 0, wall: 1, chips: 0.35,
    });
  }
  // the hand's blade (a desktop pointer): it follows the aim with weight, a little slower than the camera's orbit
  if (!ph && o.hand !== false && lights.length < 4) {
    const aim = c.aim && !c.aim.touch ? c.aim : { x: c.pointer ? c.pointer.nx : 0, y: c.pointer ? c.pointer.ny : 0 };
    const present = c.pointer && c.pointer.present ? 1 : 0;
    const dt = clamp(c.dt ?? 1 / 60, 0, 0.1), w2 = 1 / 0.45;
    if (S.ax == null) { S.ax = aim.x; S.ay = aim.y; S.vx = 0; S.vy = 0; S.hand = 0; }
    S.vx += (w2 * w2 * (aim.x - S.ax) - 2 * w2 * S.vx) * dt; S.ax += S.vx * dt;
    S.vy += (w2 * w2 * (aim.y - S.ay) - 2 * w2 * S.vy) * dt; S.ay += S.vy * dt;
    S.hand += (present - S.hand) * (1 - Math.exp(-dt / 0.6));
    // (INTEGRATE) settle exactly: the host calls this on real time even at rest, and a value that keeps creeping by
    // one ulp changes the field every frame, so the stage never went to sleep while a pointer was on the page
    if (Math.abs(present - S.hand) < 1e-3) S.hand = present;
    if (Math.abs(aim.x - S.ax) < 1e-4 && Math.abs(S.vx) < 1e-4) { S.ax = aim.x; S.vx = 0; }
    if (Math.abs(aim.y - S.ay) < 1e-4 && Math.abs(S.vy) < 1e-4) { S.ay = aim.y; S.vy = 0; }
    if (S.hand > 0.001) lights.push({
      pos: [cx + 0.12 * vw, cy - 1.5 * vh, Math.min(eye[2] - 0.3 * D, 0.55 * D)],
      target: [cx + (o.sweep ? clamp(S.ax, sw0, sw1) : S.ax) * 0.5 * wallW, cy + Math.min(S.ay, 0.3) * 0.4 * wallH, wallZ],
      radius: 0.09 * D, aspect: 1.7, roll: 0.15, spread: 0.03, soft: 0.8,
      // (lane o-fix) gone in the cut's flight: with the plates leaving and the eye pushed in it stood alone as a tall grey
      // column inside the glass (c.flight, fx-stage.js)
      strength: Math.round(0.9 * S.hand * live * a0 * (1 - sstep(0, 0.12, c.flight || 0)) * 1e5) / 1e5, tint: mix(0.3, 0.05, temp), length: 16000, haze: 0, wall: 1, chips: 1,
    });
  }
  if (lights.length) field.lights = lights.slice(0, 4);
  return { field: a0 > 1e-3 ? field : null, keepouts, look };
}

/** @param {number[]} a */
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

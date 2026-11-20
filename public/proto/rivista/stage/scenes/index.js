// @ts-check
/**
 * index — the cover's index (spec 50 §4; lane COVER): four large rows, Work, About, Consulting, Obla, each a link with
 * one sentence and "Open" (data-stage-cue="work|about|consult|obla").
 *
 * (wave 4, PRISM; plan 70 phase 2, "the prism and the portals") THE PRISM. In the half of the frame the rows leave
 * free a large triangular prism of cut glass stands in the room (a plate of shape "prism", stage/plates/), turned so
 * its faces catch the light. The room's one shaft comes down onto it from the upper right (lib/room.js `aim`) with a
 * bright core of its own, and FOUR RAYS leave it, fanned, one per row in the rows' order, each to its own STATION in
 * the room's depth (lib/prism.js, the pass "rays"). All four are faintly lit at rest; the row under the hand (or with
 * the keyboard's focus, or tapped on a phone) has its ray at full light and the others dim, in about 0.3 s, and the
 * swarm gathers that row's emblem of light at the ray's station:
 *
 *   work     a fan of nine small plates of clear glass that opens from one pivot, their outlines in light just
 *            behind them so their edges catch it (formation fanlight + nine slabs)
 *   about    one line of light through the room with five nodes (formation path)
 *   consult  the hub and its agents (night/agents.js, Consulting's own figure)
 *   obla     Obla's outline in light (formation outline)
 *
 * No cue: the calm field: the mist, the prism and its four faint rays (the cover's still lattice of points is gone
 * here: at the stations' depth its knots drew as large soft discs). Through
 * the prism the wall's grid, the chips and the shaft are bent. It turns a few degrees with the hand and with the
 * scroll (damped on simulated time, settling exactly). On a phone the prism is small, right of the cued row's title
 * (the band of that line the row's words leave free), its rays short into the depth; a tap on a row lights its ray at
 * once, before the cut. Nothing here crosses the rows' text (every text block is a keep-out; the prism and its
 * stations stand right of the rows' last glyphs).
 * Cost (limit 3.0 ms at 1440x900 DPR 2): the prism is paid by the fan, whose nine plates now stand at a station a
 * third of the old emblem's size (about a ninth of the plates' pixels), and by the second blade (the room keeps one
 * shaft here).
 */
import "./lib/prism.js";
import { PRISM_BEAM, prismOutline } from "../plates/plates.js";
import mist from "../night/mist.js";
import agents from "../night/agents.js";
import { C, fanlight, path, outline, clamp, sstep, mix } from "./cover/shared.js";
import { DEPTH, eyeD, home, shot, sink, roomFor, bloomOf, SEED, LIT } from "../night/shot.js";

/** each formation's depth and the scale its px-fit figure takes there (keyed by formation id) */
/** @type {Record<string, { z: number, k: number }>} */ const AT = {};
/** a cover formation at its station's depth (px-fit ones are scaled with the depth so they keep their size on screen)
 *  @param {any} f @param {string} key */
const deep = (f, key, ink = 1) => ({ ...f, update(/** @type {any} */ c) {
  const o = (f.update && f.update(c)) || {};
  const at = AT[key] || { z: 0, k: 1 };
  const off = o.offset || [0, 0, 0];
  const px = f.fit === "px";
  const sc = typeof o.scale === "number" ? o.scale : 1;
  // (wave 2) a turn eased on real time creeps by one ulp a frame (outline's yaw): rounded, the stage can sleep
  const rot = Array.isArray(o.rotate) ? { rotate: o.rotate.map((/** @type {number} */ v) => Math.round(v * 1e4) / 1e4) } : {};
  const ik = ink !== 1 ? { ink: (typeof o.ink === "number" ? o.ink : 1) * ink } : {};
  return { ...o, ...rot, ...ik, offset: [off[0] * at.k, off[1] * at.k, (off[2] || 0) + at.z], ...(px ? { scale: sc * at.k } : {}) };
} });
const fanlight2 = deep(fanlight, "fanlight"), path2 = deep(path, "path"), outline2 = deep(outline, "outline", 1.4);

const ORDER = /** @type {const} */ (["work", "about", "consult", "obla"]);
const IDS = { work: "fanlight", about: "path", consult: "agents", obla: "outline" };
const FAN = 9;
/** the rays' colours, sRGB-encoded: paper white (Work) through two cooler whites to a light cobalt (Obla); no rainbow */
const PAPER = [0.957, 0.945, 0.918], ACC = [0.56, 0.635, 1.0], COB = [0.137, 0.25, 0.79];
const RGB = [PAPER, PAPER.map((v, i) => mix(v, ACC[i], 0.38)), PAPER.map((v, i) => mix(v, ACC[i], 0.75)), ACC.map((v, i) => mix(v, COB[i], 0.22))];
/** the rays' light: at rest, the cued one, the others while one is cued */
const K_REST = 0.42, K_ON = 1.0, K_OFF = 0.12;
/** (lane o-fix) ONE ray leaves the prism: the cued row's, else the last cued (Work at first). Four lit rays from one
 *  point read as a fan, a figure drawn by light; the others are dark and the light swings to a row in about 0.3 s */
const ONE = true;

export default {
  formations: { mist, fanlight: fanlight2, path: path2, agents, outline: outline2 },
  /** @param {any} c */
  frame(c) {
    const s = c.state, dt = Math.max(0, Math.min(0.1, c.dt || 0)), phone = c.phone, small = phone || c.vw < 1024;
    const t = c.clock ? c.clock.time : 0;
    const D = eyeD(c.vw, c.vh), cx0 = c.vw / 2, cy0 = c.vh / 2;
    /** a screen point seen at depth z by the straight view, as the world point there */
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) => { const k = (D - z) / D; return [cx0 + (x - cx0) * k, cy0 + (y - cy0) * k, z]; };
    // ------------------------------------------------ the cue (a tap on a phone lights its row's ray before the cut)
    let cue = c.cue && c.cue in IDS ? c.cue : null;
    if (small && c.pointer && c.pointer.down) {
      let best = null, by = -1e9;
      for (const id of ORDER) { const m = c.marks["ix-" + id]; if (m && m.y - 24 <= c.pointer.y && m.y > by) { by = m.y; best = id; } }
      if (best && (!s.tap || s.tap !== best)) { s.tap = best; s.tapT = t; }
    }
    if (s.tap && t - (s.tapT ?? -9) < 2.5) cue = s.tap;
    s.last ??= "work";
    if (cue) s.last = cue;
    // ------------------------------------------------ the layout: the prism, the stations (screen px, depth)
    /** @type {{ x: number, y: number, h: number, w: number, len: number, z: number }} */ let P;
    /** @type {{ x: number, y: number, z: number }[]} */ let ST;
    let Se;
    // (phone) the prism stands by one row at a time: when the cue moves to another row it fades out where it is and
    // comes back by the new row (0.2 s each way), never sliding over the words between them
    s.at ??= s.last; s.pf ??= 1;
    if (small) {
      const goal = s.at === s.last ? 1 : 0;
      s.pf += Math.sign(goal - s.pf) * Math.min(Math.abs(goal - s.pf), dt / 0.2);
      if (s.pf <= 0 && s.at !== s.last) s.at = s.last;
    } else { s.at = s.last; s.pf = 1; }
    const pf = s.pf;
    if (small) {
      // right of the cued row's title, on its line (the sentence is below it)
      const m = c.marks["ix-" + s.at];
      const gut = Math.max(16, c.vw * 0.04);
      const x0 = m ? m.x + m.w + 16 : c.vw * 0.6, x1 = c.vw - gut;
      const W = m ? clamp(Math.min(m.h * 0.78, (x1 - x0) * 0.4), 36, 80) : 64, H = W * 0.866;
      const y = m ? m.y + m.h * 0.42 : c.vh * 0.4;
      P = { x: x0 + W / 2 + 2, y, h: H, w: W, len: W * 0.8, z: -0.06 * D };
      const xs = Math.max(P.x + W, x1 - 4);
      // (GLASS2) level with the exit and a little below it, so the steep shaft and the fan never meet as a V
      ST = ORDER.map((_, i) => ({ x: xs, y: y + H * (0.1 + 0.2 * i), z: -0.42 * D }));
      Se = 0;
    } else {
      // right of the rows' last glyphs (their "Open"), up to the gutter
      let tx = c.fig.x;
      for (const r of c.texts) if (r.x < c.vw * 0.7) tx = Math.max(tx, r.x + r.w);
      const x0 = tx + c.vw * 0.05, x1 = c.vw - c.vw * 0.035, W = x1 - x0;
      const T = Math.min(c.vh * 0.42, W * 0.5);
      P = { x: x0 + W * 0.24, y: c.vh * 0.56, h: T * 0.866, w: T, len: T * 0.75, z: -0.1 * D };
      Se = Math.min(c.vh * 0.28, W * 0.36);
      const zs = [-0.5, -0.58, -0.54, -0.44];
      // (GLASS2) the fan leaves toward the prism's base side, right and a little down, with a small spread: the shaft comes
      // down from the upper right, so no ray runs back up beside it (no V)
      ST = ORDER.map((_, i) => ({ x: x0 + W * (0.8 + 0.03 * Math.sin(i * 1.7)), y: c.vh * (0.42 + 0.075 * i), z: zs[i] * D }));   // (lane o-fix) Obla's at 0.645 vh, not 0.75: it sat across the dawn's edge
    }
    // ------------------------------------------------ the rays' light (about 0.3 s; settles exactly: the stage sleeps)
    s.rk ??= ORDER.map(() => K_REST);
    const tau = s.tap && cue === s.tap && t - s.tapT < 0.4 ? 0.05 : 0.1;
    const kk = 1 - Math.exp(-dt / tau);
    ORDER.forEach((id, i) => {
      const want = ONE ? (id === (cue || s.last) ? (cue ? K_ON : K_REST) : 0) : cue ? (cue === id ? K_ON : K_OFF) : K_REST;
      s.rk[i] += (want - s.rk[i]) * kk;
      if (Math.abs(want - s.rk[i]) < 1e-3) s.rk[i] = want;
    });
    // ------------------------------------------------ the prism's turn: a few degrees with the hand and the scroll
    s.hy ??= 0;
    const hand = !small && c.pointer && c.pointer.present ? clamp(c.pointer.nx ?? 0, -1, 1) : 0;
    s.hy += (hand - s.hy) * (1 - Math.exp(-dt / 0.5));
    if (Math.abs(hand - s.hy) < 1e-4) s.hy = hand;
    const yaw = Math.round((0.42 + 0.09 * s.hy + 0.14 * ((c.progress ?? 0.5) - 0.5)) * 1e4) / 1e4;
    const PW = at(P.x, P.y, P.z), kP = (D - P.z) / D;
    const PITCH = -1.2708;
    // (lane m-glass) THE BEAM GOES THROUGH THE GLASS. The prism's own space in the room (plates.js packs it the same way:
    // roll, then pitch, then yaw), and in it the two points where the shaft's light enters the glass and where the row's
    // ray leaves it (plates.js PRISM_BEAM). Between them the glass draws the beam itself, inside (plates.wgsl.js prBeam):
    // a soft straight core with a breath of light round it, bent by the faces, mirrored faint in them; the shaft's core
    // ends where the light goes in, the row's ray starts where it comes out. (The line once drawn behind the prism for the
    // light turning inside read as one more edge of an outline drawing.)
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cpw = Math.cos(PITCH), spw = Math.sin(PITCH);
    const obj = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) => { const y2 = y * cpw + z * spw, z2 = -y * spw + z * cpw; return [x * cyw - z2 * syw, y2, x * syw + z2 * cyw]; };
    const PWr = [PW[0], PW[1], P.z], hxP = (P.w * kP) / 2, hyP = (P.len * kP) / 2, hzP = (P.w * kP * 0.866) / 2;
    const inPrism = (/** @type {number} */ u) => {
      const [lx, lz] = prismOutline(u, hxP, hzP), ly = PRISM_BEAM.y * hyP;
      const v = [obj(1, 0, 0), obj(0, 1, 0), obj(0, 0, 1)];
      return [0, 1, 2].map((k) => PWr[k] + v[0][k] * lx + v[1][k] * ly + v[2][k] * lz);
    };
    const enter = inPrism(PRISM_BEAM.u0), leave = inPrism(PRISM_BEAM.u1);
    // the beam's light in the glass: the shaft's, a little more while a row is cued (its ray at full light)
    const beamK = Math.round((0.6 + 0.4 * Math.max(...s.rk)) * pf * 1e4) / 1e4;
    const slabs = [{
      // (lane m-glass) inset below -1 carries the beam's light (plates.js PRISM_BEAM; -1 alone: a prism with no beam)
      id: "prism", shape: "prism", inset: -(1 + beamK), cx: PW[0], cy: PW[1], cz: P.z, yaw, pitch: PITCH, roll: 0,
      w: P.w * kP, h: P.len * kP, t: P.w * kP * 0.866, tex: null, alpha: Math.round(sstep(0, 1, pf) * 1e4) / 1e4,
      // (lane o-fix) edge 0.9 -> 0.4: its arrises read as an outline drawing; the faces (the room bent in them) carry it
      // (lane m-glass) the arrises now light up where the beam comes in and goes out and fall away from there
      glow: 0.45, edge: 0.4, sharp: 1, bevel: small ? 1.3 : 1.8, sheen: 0.72, dispersion: 0.02, tint: 0.3,
    }];
    // ------------------------------------------------ the stations and the emblems
    /** @type {Record<string, any>} */ const rects = {};
    ORDER.forEach((id, i) => {
      const q = ST[i];
      const box = { x: q.x - Se / 2, y: q.y - Se / 2, w: Math.max(1, Se), h: Math.max(1, Se) };
      const wb = sink(c, box, q.z);
      rects[id] = wb;
      AT[IDS[id]] = { z: q.z, k: (D - q.z) / D };
    });
    DEPTH.agents = AT.agents.z;
    // the fan (Work): opens on a damped spring while Work is the cue, at its station
    s.open ??= 0; s.ov ??= 0;
    const want = cue === "work" ? 1 : 0;
    if (dt > 0) { const k = 34, d = 2 * 0.8 * Math.sqrt(k); s.ov += (k * (want - s.open) - d * s.ov) * dt; s.open += s.ov * dt; }
    if (Math.abs(want - s.open) < 1e-4 && Math.abs(s.ov) < 1e-3) { s.open = want; s.ov = 0; }
    const o = clamp(s.open, 0, 1.08);
    const tilt = c.pointer && c.pointer.present ? (c.pointer.nx ?? 0) * 0.18 : 0;
    const S = Se, wbW = rects.work, kz = AT.fanlight.k, zz = AT.fanlight.z;
    const pw = S * 0.2, ph = S * 0.32, R = S * 0.36;
    const plates = [];
    if (!small) for (let k = 0; k < FAN; k++) {
      const th = (k - (FAN - 1) / 2) * 0.155 * o;
      const x = Math.sin(th) * R, y = S * 0.2 - Math.cos(th) * R;
      plates.push({ x, y, z: k * 5, w: pw, h: ph, roll: th });
      if (o > 0.01) slabs.push(/** @type {any} */ ({
        id: "fan" + k, cx: wbW.cx + x * kz, cy: wbW.cy + (y + S * 0.06) * kz, cz: zz + 30 + k * 5, yaw: -0.22 + tilt, pitch: 0.04, roll: th,
        // (lane m-glass) one ray for the three channels (dispersion 0): at the station's depth their split was under a
        // pixel, and nine plates of three rays each were the index's peak (3.9 ms with Work under the hand)
        // ... and sharp just under 0.8: no two extra edge rays per pixel (plates.wgsl.js fsPlate), which nine thin plates
        // seen through one another asked for nearly everywhere; at the station's depth they read as sharp (m-glass)
        w: pw * kz, h: ph * kz, t: 7, tex: null, alpha: sstep(0, 0.5, o), glow: 0.75, sharp: 0.79, bevel: 2, sheen: 0.08, edge: 0.45, dispersion: 0,
      }));
    }
    C.fan = { plates: plates.map((q) => ({ ...q, y: q.y + S * 0.06 })), z: -70, key: o.toFixed(3) + ":" + Math.round(S) };
    // ------------------------------------------------ the swarm
    const wts = { fanlight: 0, path: 0, agents: 0, outline: 0 };
    if (cue && !small) wts[/** @type {"fanlight"} */ (IDS[cue])] = 1;
    const field = small ? { x: 0, y: 0, w: c.vw, h: c.vh } : { x: c.fig.x, y: c.fig.y, w: c.fig.w, h: c.fig.h };
    const rr = (/** @type {any} */ r, f = 1) => ({ x: r.cx - (r.w * f) / 2, y: r.cy - (r.h * f) / 2, w: r.w * f, h: r.h * f });
    // the stations' column (the room's soft light behind them while no row is cued)
    const restR = small ? null : sink(c, { x: ST[0].x - Se * 0.9, y: ST[0].y - Se * 0.5, w: Se * 1.8, h: ST[3].y - ST[0].y + Se }, -0.64 * D);
    const swarm = [
      { id: "mist", weight: small ? 0.3 : cue ? 0.16 : 0.5, rect: field },
      { id: "fanlight", weight: wts.fanlight, rect: rr(rects.work) },
      { id: "path", weight: wts.path, rect: rr(rects.about) },
      { id: "agents", weight: wts.agents, rect: rr(rects.consult, 0.92) },
      { id: "outline", weight: wts.outline, rect: rr(rects.obla, 0.8) },
    ];
    // ------------------------------------------------ the rays: the shaft's core into the prism, four out of it
    const from = small ? at(P.x + P.w * 0.75, P.y - P.h * 3.4, P.z + 0.03 * D) : at(P.x + 0.2 * c.vw, -0.35 * c.vh, P.z + 0.06 * D);
    // (lane m-glass) the shaft's core ends where its light goes into the glass (the beam inside is the glass's own)
    const top = enter;
    // (drawn from the prism up: it fades in from above and is whole where it meets the glass)
    const rays = [{ a: top, b: [mix(top[0], from[0], 0.8), mix(top[1], from[1], 0.8), mix(top[2], from[2], 0.8)], w: small ? 1.3 : 2.0, k: Math.round(0.85 * pf * 1e4) / 1e4, rgb: PAPER }];
    const exit = leave;
    ORDER.forEach((id, i) => {
      const q = ST[i];
      // (GLASS2) all four from one point of the exit face (their cores meet there: the bright point where the light leaves)
      // (lane m-glass) the point where the beam inside the glass comes out
      const a = exit;
      const b0 = at(q.x, q.y, q.z);
      // the ray stops short of its emblem (it never crosses the figure it lights)
      const L = Math.hypot(b0[0] - a[0], b0[1] - a[1], b0[2] - a[2]) || 1, cut = small ? 0 : (Se * 0.55 * (D - q.z) / D) / L;
      const b = [mix(b0[0], a[0], cut), mix(b0[1], a[1], cut), mix(b0[2], a[2], cut)];
      if (s.rk[i] > 0) rays.push({ a, b, w: small ? 1.1 : 1.7, k: Math.round(s.rk[i] * pf * 1e4) / 1e4, rgb: RGB[i] });
    });
    // keep-outs: the text blocks; on a phone a row's link spans the screen, so there the titles' own glyphs only
    // (PRISM) on a phone a row's block spans the screen: it is kept above its title and below it at full width, and
    // on the title's own line only the glyphs (the mark), so the band right of the title stays free for the prism
    const mk = Object.values(c.marks);
    /** @type {any[]} */ const keepS = [];
    if (small) for (const r of c.texts) {
      const m = /** @type {any} */ (mk.find((/** @type {any} */ q) => q.y >= r.y - 2 && q.y + q.h <= r.y + r.h + 2));
      if (!m) { keepS.push({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }); continue; }
      if (m.y - r.y > 2) keepS.push({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: m.y - r.y + 4 });
      keepS.push({ x: m.x - 8, y: m.y - 8, w: m.w + 16, h: m.h + 16 });
      keepS.push({ x: r.x - 8, y: m.y + m.h + 4, w: r.w + 16, h: r.y + r.h - (m.y + m.h) + 4 });
    }
    const keep = small ? keepS
      : c.texts.map((/** @type {any} */ r) => ({ x: r.x - 10, y: r.y - 10, w: r.w + 20, h: r.h + 20 }));
    // the room: the cover's hall; its one shaft aimed at the prism (no second blade, no hand's blade: one shaft here)
    const cueR = cue && !small ? rects[cue] : restR;
    const RM = roomFor(c, { ...(small ? { keep } : {}), seed: SEED.cover, wall: { z: -0.6 * D }, eye: [c.vw / 2, c.vh / 2, D], ...LIT(c), hand: false,
      aim: { at: top, from, radius: P.w * kP * 0.42, strength: Math.round((small ? 0.9 : 1.05) * pf * 1e4) / 1e4, haze: 1.4 },
      subject: cueR ? { x: cueR.cx, y: cueR.cy + 0.25 * c.vh, z: cueR.z, w: Math.max(cueR.w, 0.3 * c.vw), h: 1.4 * c.vh, strength: cue ? 0.42 : 0.32 } : null });
    if (typeof c.look === "function") c.look({ far: Math.round(-2.6 * D), near: Math.round(4.7 * D), keepFeather: 40 });
    const pose = { ...home(c), pivot: PW };
    pose.focus = D + 0.64 * D;
    return {
      swarm, slabs, keepouts: [...RM.keepouts, ...keep],
      passes: { rays: { rays, ina: 0.012, outa: small ? 0.3 : 0.18 } },
      camera: shot(c, pose, { fog: [3 * D, 7 * D], aperture: 0.22, yaw: small ? 0.1 : 0.12, pitch: small ? 0.05 : 0.06 }),
      bloom: bloomOf(0.5), field: RM.field, rest: 14, subject: { x: P.x, y: P.y },
    };
  },
};

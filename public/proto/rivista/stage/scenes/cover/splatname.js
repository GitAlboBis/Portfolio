// @ts-check
/**
 * scenes/cover/splatname.js — THE NAME BUILT OF GAUSSIANS (lane NAME, plan 70 §8.2 "the swarm settles into gaussians").
 * Only with ?name=splat on the cover: hero.js imports this file dynamically when the switch is in the address, never
 * otherwise (without it the cover is HEAD's, frame for frame). Notes: docs/redesign/rivista-story/build/p-name.md.
 *
 * Each letter of ALBERTO TUVERI is a solid block of flat gaussians (stage/splat/gen.js extrude): a paper-white face, its
 * sides in cobalt (the light comes from the upper right and in front, so the left and lower sides the rest pose sees
 * are in shade), a ring of thin gaussians along the edge (the clean cut). The glyphs are drawn exactly as world.js
 * draws the swarm's name (the h1's face, weight and tracking, the same raster size and layout), so the block's face
 * stands where the swarm's face stands: at z = Zn, the block reaching DEPTH of the letter's height behind it.
 *
 *   build   on the cover's first frame with the switch, never before it: splat.js is imported then (its pipelines
 *           compile while the opening runs) and the letters are extruded one distinct glyph at a time in idle slices
 *           (E, R and T are shared), each step yielding (no task over a few ms)
 *   opening letter i settles (0 to 1) from the swarm's ignition of that letter on (or from the moment the sets are on
 *           the GPU, if later); once a letter is settled, the swarm's points on it (face and receding outlines) are
 *           handed over: the stage's reveal window of those formations starts after it (world.js reads C.nameSplat)
 *   flight  the blocks fade as the swarm's name does (k 0.42 to 0.5); the stage's near fade passes the eye through them
 *   failure no live pass (?failsplat=1, a lost device) or no font: nothing is handed over, the swarm's name stays
 */
import { C, clamp, sstep } from "./shared.js";

/** the block's depth as a fraction of a letter's height */
const DEPTH = 0.42;
/** seconds a letter takes to settle; the ignition's start and step (hero.js IGN0, IGN_DT) */
const SET_S = 0.42, IGN0 = 0.15, IGN_DT = 0.1;
/** a letter's swarm points are handed over once it has settled this far */
const HAND = 0.9;
/** the room's light for the blocks: upper right, in front (world: y down, z toward the reader) */
// (wave 5, GLASS2) nearly frontal, a breath from the upper right: the face takes it whole, the sides only grazing light,
// so they fall into the night (upper right, the sides the rest pose sees took paper and saturated cobalt: a logo)
const LIGHT = [0.1, -0.14, 0.985];
/** the share of the lit face's alpha given up as light (it glows in the bloom, as the swarm's face did) */
// (GLASS2) 0.9: the face gives nearly all its light to the bloom, which reads it as light, as today's name
const EMIT = 0.9;
/** the glyph masks are drawn at this fraction of the layout's raster (fewer splats; the edge is the rings', not the res) */
const MASK = { desk: 0.8, phone: 0.62 };
/** a tile in shade: the site's cobalt (sRGB 0..1, #2340c9) */
// (GLASS2) a deep night cobalt, not the saturated #2340c9: the sides are dim and darken to the back (sideFade)
const COBALT = [0.05, 0.075, 0.2];

/** @type {{ mod: any, loading: any, dead: boolean, key: string | null, layout: any, readyAt: number | null, ready: (number | null)[] | null, t: number, out: any }} */
// (bench only) ?nsdbg=nosides|r3: a look at what makes an edge
const DBGQ = typeof location !== "undefined" ? new URLSearchParams(location.search).get("nsdbg") || "" : "";
const DBG = { sides: DBGQ.includes("nosides") ? false : undefined, emit: /emit=([\d.]+)/.exec(DBGQ) };
const S = { mod: null, loading: null, dead: false, key: null, layout: null, readyAt: null, ready: null, t: -1, out: null };

const idle = () => new Promise((r) => {
  const ric = /** @type {any} */ (globalThis).requestIdleCallback;
  if (typeof ric === "function") ric(() => r(0), { timeout: 40 }); else setTimeout(r, 0);
});

/** the site's paper and cobalt from the tokens (gen.js defaults if unread) */
function colors() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const p = cs.getPropertyValue("--paper").trim(), b = cs.getPropertyValue("--cobalt").trim();
    return { light: /^#[0-9a-f]{6}$/i.test(p) ? p : "#f4f1ea", dark: /^#[0-9a-f]{6}$/i.test(b) ? b : "#2340c9" };
  } catch { return { light: "#f4f1ea", dark: "#2340c9" }; }
}

/**
 * The letters' blocks for this world (W.key): the same raster as world.js nameSets (font px P, pad, baseline, the
 * widest line scaled to W.Wn, lines stacked about the centre at lead 0.8).
 * @param {any} W
 */
async function build(W) {
  const key = W.key;
  const h1 = /** @type {HTMLElement | null} */ (document.getElementById("hero-h1"));
  if (!h1) return;
  const words = Array.from(h1.querySelectorAll(".ln")).map((e) => (e.textContent || "").trim()).filter(Boolean);
  if (!words.length) return;
  const cs = getComputedStyle(h1), fs = parseFloat(cs.fontSize) || 100;
  const up = cs.textTransform === "uppercase";
  const family = cs.fontFamily, weight = cs.fontWeight || "800", track = (parseFloat(cs.letterSpacing) || 0) / fs;
  const lines = (W.phone ? words : [words.join(" ")]).map((l) => (up ? l.toUpperCase() : l));
  const P = W.phone ? 360 : 300, font = `${weight} ${P}px ${family}`;
  const probe = /** @type {OffscreenCanvasRenderingContext2D} */ (new OffscreenCanvas(8, 8).getContext("2d"));
  probe.font = font;
  const pad = Math.ceil(P * 0.06), H = Math.ceil(P * 0.86) + 2 * pad, base = pad + P * 0.74;
  const R = lines.map((text) => {
    const adv = Array.from(text).map((ch) => probe.measureText(ch).width + track * P);
    return { text, adv, width: adv.reduce((a, b) => a + b, 0) - track * P };
  });
  const sc = W.Wn / Math.max(...R.map((r) => r.width)), lineH = P * 0.8 * sc;
  /** @type {{ ch: string, xl: number, li: number, r: any }[]} */ const glyphs = [];
  R.forEach((r, li) => { let x = pad; Array.from(r.text).forEach((ch, i) => { if (ch.trim()) glyphs.push({ ch, xl: x, li, r }); x += r.adv[i]; }); });
  // one block per distinct glyph
  // (wave 5, GLASS2) the face in the swarm's own white (the brightest channel at 1: the bloom's threshold takes it as the
  // swarm's face, a glow round the letters), the shade the tokens' cobalt
  const col = { ...colors(), light: "#ffffff" };
  /** @type {Map<string, any>} */ const blocks = new Map();
  // the mask's own raster: ms of the layout's (its ink box scaled back by 1 / ms below)
  const ms = W.phone ? MASK.phone : MASK.desk, mpad = Math.ceil(pad * ms), mH = Math.ceil(H * ms), mbase = mpad + P * ms * 0.74;
  const mfont = `${weight} ${P * ms}px ${family}`;
  for (const g of glyphs) {
    if (blocks.has(g.ch)) continue;
    await idle();
    if (S.key !== key) return;
    probe.font = mfont;
    const w = Math.ceil(probe.measureText(g.ch).width) + 2 * mpad, H = mH;
    const cv = new OffscreenCanvas(w, H), cx = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
    cx.font = mfont; cx.textBaseline = "alphabetic"; cx.fillStyle = "#fff";
    cx.fillText(g.ch, mpad, mbase);
    const px = cx.getImageData(0, 0, w, H).data, alpha = new Uint8Array(w * H);
    let x0 = w, y0 = H, x1 = -1, y1 = -1;
    for (let i = 0; i < w * H; i++) {
      alpha[i] = px[i * 4 + 3];
      if (alpha[i] > 127) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) continue;
    // three rings 0.9, 2.1 and 3.3 px in from the edge, narrow across (the face's finest tiles stop about 3 px in: one or
    // two rings left a fainter dashed line between them), the sides every 4 mask px along the edge, darker to the back
    const d = await S.mod.gen.extrude({ w, h: H, alpha }, { depth: DEPTH, colors: col, grid: 8, rings: [0.9, 2.1, 3.3], ringSigma: 0.5, sideGrid: 4, sides: DBG.sides, sideFade: 0.85 });
    // the ink box's centre in the layout's raster px and its height (extrude's local unit)
    blocks.set(g.ch, { d, bx: (x0 + x1 + 1) / 2 / ms + (pad - mpad / ms), by: (y0 + y1 + 1) / 2 / ms + (base - mbase / ms), bh: (y1 - y0 + 1) / ms, c: d.bounds.center });
  }
  // a set per letter (a set's range on the GPU is found by its id: one id twice in a frame draws once), E R T twice
  /** @type {string[]} */ const ids = [];
  for (let i = 0; i < glyphs.length; i++) {
    const b = blocks.get(glyphs[i].ch);
    if (!b) { ids.push(""); continue; }
    await idle();
    if (S.key !== key) return;
    const id = `nm:${P}:${i}`;
    await S.mod.putSplats(id, b.d);
    ids.push(id);
  }
  if (S.key !== key) return;
  const letters = glyphs.map((g, i) => {
    const b = blocks.get(g.ch);
    if (!b) return null;
    const oy = (g.li - (R.length - 1) / 2) * lineH, ox = -g.r.width * sc / 2;
    const size = b.bh * sc;
    // local origin (the ink box's centre, mid-depth) placed at the swarm's letter, its face on z = Zn; pos is where the
    // set's mean centre lands (splat.js: the set's centre sits at pos)
    const lx = ox + (g.xl + (b.bx - pad) - pad) * sc, ly = oy + (b.by - (base - P * 0.35)) * sc, lz = W.Zn - size * DEPTH / 2;
    return { id: ids[i], pos: [W.X0 + lx + size * b.c[0], W.Y0 + ly + size * b.c[1], lz + size * b.c[2]], size, count: b.d.count };
  }).filter(Boolean);
  S.layout = { key, letters, splats: letters.reduce((s, l) => s + (l ? l.count : 0), 0) };
  if (S.readyAt != null) { S.readyAt = -1; S.ready = null; }     // a rebuild (a resize): the blocks come in at once, already settled
  /** @type {any} */ (globalThis).__nameSplat = { letters: letters.length, distinct: blocks.size, splats: S.layout.splats };
}

/**
 * Start early (hero.js, once the display face is in and the world is laid out, before the stage's first frame): splat.js
 * is imported (its pass compiles beside the stage's pipelines) and the blocks are built in idle slices, so the name can
 * settle with the opening's first letters. ?nsdbg=late keeps it to the first frame (a comparison).
 */
export function prebuild() {
  if (DBGQ.includes("late") || S.dead) return;
  const W = C.world;
  if (!W) return;
  const go = () => { if (S.key !== W.key && C.world === W) { S.key = W.key; S.layout = null; build(W).catch(() => { S.dead = true; }); } };
  if (S.mod) go();
  else if (!S.loading) S.loading = import("../../splat/splat.js").then((m) => { S.mod = m; go(); }, () => { S.dead = true; });
}

/** true once a letter's block is on the GPU (the pass lives): hero.js moves the plates only then (?failsplat=1: never) */
export const live = () => !!(S.layout && S.ready && S.ready.some((r) => r != null));

/**
 * The splat pass's config for this frame and the hand-over of the swarm's name (C.nameSplat). Called by hero.js and
 * now.js (the host takes the heaviest scene's config; both give the same one). null until the blocks exist.
 * @param {any} c the scene's ctx
 */
export function nameFrame(c) {
  if (S.t === c.time) return S.out;
  S.t = c.time;
  const W = C.world;
  S.out = null;
  if (!W || S.dead) { C.nameSplat = undefined; return null; }
  if (!S.mod) {
    if (!S.loading) S.loading = import("../../splat/splat.js").then((m) => { S.mod = m; }, () => { S.dead = true; });
    return null;
  }
  if (S.key !== W.key) { S.key = W.key; S.layout = null; build(W).catch(() => { S.dead = true; }); }
  const L = S.layout;
  if (!L || L.key !== W.key) return null;
  const at = C.at ?? 99;
  const shown = L.letters.map((/** @type {any} */ l) => S.mod.splatShown(l.id));
  if (S.readyAt == null && shown.every((/** @type {number} */ v) => v > 0)) { S.readyAt = at; /** @type {any} */ (globalThis).__nameSplat.readyAt = at; /** @type {any} */ (globalThis).__nameSplat.readyMs = Math.round(performance.now()); }
  // each letter from the moment its own set is on the GPU (the A need not wait for the I)
  if (!S.ready || S.ready.length !== shown.length) S.ready = shown.map(() => /** @type {number | null} */ (null));
  shown.forEach((/** @type {number} */ v, /** @type {number} */ i) => { if (v > 0 && S.ready[i] == null) S.ready[i] = S.readyAt === -1 ? -1 : at; });
  const gone = 1 - sstep(0.42, 0.5, C.ks ?? 0);
  let m = 0, open = true;
  const sets = L.letters.map((/** @type {any} */ l, /** @type {number} */ i) => {
    let settle = 0, on = 0;
    const r = S.ready[i], ready = r != null && shown[i] > 0;
    if (ready) {
      const t0 = r === -1 ? -99 : Math.max(IGN0 + i * IGN_DT, /** @type {number} */ (r) + 0.04);
      settle = clamp((at - t0) / SET_S);
      // a letter shows nothing before its own turn (its scatter waiting at settle 0 read as a mist ahead of the opening)
      on = clamp((at - t0) / 0.08);
    }
    if (open && settle >= HAND && shown[i] >= 0.9) m++; else open = false;
    return { id: l.id, pos: l.pos, size: l.size, rot: [0, 0, 0], settle, alpha: gone * on,
      light: LIGHT, ambient: 0.03, spec: 0.12, shadeColor: COBALT, emit: DBG.emit ? +DBG.emit[1] : EMIT, spread: 0.9, stagger: 0.5, drift: 6, pointAlpha: 0.3 };
  });
  // the hand-over: the stage's reveal window of the swarm's face and outlines starts past the settled letters
  const Lt = W.letters;
  C.nameSplat = m > 0 && Lt.length === L.letters.length
    ? { faceLo: Lt[m - 1].f1 + 0.0005, deepLo: Lt[m - 1].d1 + 0.0005, all: m === Lt.length }
    : undefined;
  S.out = { splat: { sets } };
  return S.out;
}

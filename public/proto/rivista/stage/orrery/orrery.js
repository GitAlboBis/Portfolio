// @ts-check
/**
 * orrery.js — THE ORRERY (wave 8, lane ORRERY): the figure of "Now at SerSan", where the plate with the sersan.io
 * capture stood. An extra pass of the stage (stage.js registerPass, scenes/README.md "An extra pass"), drawn by the
 * site's own WebGPU stage: the SerSan mark as a volume of light in two layers at the centre, and nine bodies turning
 * round it as a carousel (layout.js: one angular speed, 40 degrees apart, the three shells alternating, so none ever
 * overtakes another), each a small figure of points for a kind of work Alberto does, each with its name drawn as light
 * under it (all nine all the turn on a desktop, the one at the front in a phone's band). Importing this file registers
 * the pass "orrery"; a scene switches it on by returning
 *
 *   passes: { orrery: { x, y, z?, hx, hy, A, k, a, ax, ay, flash, px, py, pin, phone, lab: [x0, y0, x1, y1], words, font } }
 *
 * x, y the mark's centre (viewport css px at the current scroll; z px toward the reader, default the page plane);
 * hx, hy where it rests under the straight view (viewport css px: it faces the eye from there);
 * A the outer orbit's radius (css px at the page plane): everything else is a share of it (layout.js SHAPE; the scene
 * fits A to its room with layout.js EXTENT); k the cover's flight 0..1 (each body condenses out of its own scatter in
 * the flight's last third, one after another round the turn: a function of the scroll, it reverses); a presence 0..1;
 * ax, ay the hand's tilt (rad); flash 0..1 (a press); px, py, pin the pointer (viewport css px, 1 present: the body
 * under it comes forward and names itself, the motes under it lift); phone 1: the low band's shape, one word at a
 * time (2: the tall band's, a phone held upright with Now's captions at the foot: layout.js SHAPE.tall); c0 the k
 * where the bodies start condensing (0.66 by default; the tall band's arrives earlier); all 0: the figure is too
 * small for nine names, the three nearest the front show theirs (default: all nine);
 * lab the rectangle words may stand in; words the nine names; font the page's label face { family, weight, size, ls,
 * lang }.
 *
 * STATELESS: every pose is a function of the stage's clock (ctx.time, simulated seconds: they stop when the stage
 * rests) and of what the scene sends; nothing is integrated here, so the stage sleeps on an exact frame. The orbits
 * are never drawn. Light only (added, the swarm's cobalt to paper white), kept off the keep-outs and the dawn.
 * Far down the hall the figure is the mark alone, small and sharp; under 16 css px on screen (12 on a phone) it is
 * not drawn (a speck of light reads as a ring).
 * Failure: ?failorrery=1 makes init throw, ?failorrery=2 makes a frame throw: the stage draws on without the pass, and
 * html.orrery-off tells the page to print the nine names as type.
 */
import { registerPass } from "../stage.js";
import { orreryWGSL, labelWGSL, MAX_LABELS, HEAD_F, BODY_F, UNI_F, LHEAD_F, LAB_F, LUNI_F } from "./orrery.wgsl.js";
import { buildPoints, BODIES, MODE, REC, CLAP_HINGE, MOVES } from "./bodies.js";
import { rasterLabels, labelKey } from "./labels.js";
import { orreryLayout, orreryHover, orreryBoxes, orreryWords, orreryScan, straight, gapOf, boxOf, mv } from "./layout.js";
export { orreryLayout, orreryScan } from "./layout.js";

const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
const ease = (/** @type {number} */ t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const fr = (/** @type {number} */ x) => x - Math.floor(x);
const num = (/** @type {any} */ v, /** @type {number} */ d) => (typeof v === "number" && isFinite(v) ? v : d);
const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;

const FAIL = typeof location !== "undefined" ? (/[?&]failorrery=(\d)/.exec(location.search) || [])[1] : null;
const FADE_MS = 500;       // the figure comes in once its points are on the GPU (never in one frame)
const LAB_MS = 350;        // and its words once their atlas is
/** a word's widest line, in em: a longer name stands in two balanced lines under its body (0 in a phone's band: one line) */
const WRAP_EM = 7;

/** what moves inside a body at time t: [q.x, q.y, v.z, v.w] of its mode (orrery.wgsl.js); never past bodies.js MOVES,
 *  which the hulls are taken over @param {string} id @param {number} t */
function anim(id, t) {
  switch (id) {
    case "stack": return [MOVES.stack * Math.sin(t * 0.55), 0, 0, 0];
    case "apart": return [0.045 + (MOVES.apart - 0.045) * (0.5 - 0.5 * Math.cos(t * 0.62)), MOVES.pull, 0, 0];
    // the glint hops the six nodes: a quick run along an edge, a beat on the node
    case "agents": { const x = t * 0.85, j = Math.floor(x) % 6, f = ease(clamp((x - Math.floor(x)) * 1.6)); return [((j + f) / 6) % 1, 2.6, 0.02, 1]; }
    case "chain": { const p = fr(t / 4.4), env = sstep(0, 0.08, p) * (1 - sstep(0.86, 1, p)); return [ease(clamp(p * 1.45)), 2.4 * env, 0.075, 0]; }
    // the value rides the curve with the curve's own easing
    case "curve": { const p = fr(t / 3.8), env = sstep(0, 0.06, p) * (1 - sstep(0.88, 1, p)); return [ease(clamp(p * 1.4)), 2.6 * env, 0.055, 0]; }
    case "term": return [fr(t * 0.8) < 0.58 ? 1 : 0.12, 0, 0, 0];
    case "clap": {
      // open at about 20 degrees; every nine seconds it claps: shut fast, a beat, open again
      const p = fr(t / 9), open = MOVES.clap;
      let a = open;
      if (p > 0.86 && p <= 0.875) a = open * (1 - Math.pow((p - 0.86) / 0.015, 2));
      else if (p > 0.875 && p <= 0.9) a = 0;
      else if (p > 0.9 && p < 0.97) a = open * (1 - Math.pow(1 - (p - 0.9) / 0.07, 3));
      return [a, 0, CLAP_HINGE[0], CLAP_HINGE[1]];
    }
    case "gen": return [-0.06 + 0.3 * Math.sin(t * 0.42), 0, 0, 0];
    default: return [0, 0, 0, 0];
  }
}

/* ================================================================ the pass */

/** every live instance (a probe reads orreryStats() and orreryProof()) */
/** @type {Set<any>} */ const LIVE = new Set();
export function orreryStats() { return [...LIVE].map((x) => x.stats()); }
/** the lane's proof on the live figure: layout.js orreryScan with the hulls on the GPU, the words' atlas and the
 *  config the scene last sent, the figure in its resting place @param {any} [o] */
export function orreryProof(o) { const x = [...LIVE][0]; return x ? x.proof(o || {}) : null; }

/** the page prints the nine names as type when the pass cannot draw them (css/page-cover.css: html.orrery-off) */
let OFF = false;
function off() { OFF = true; try { document.documentElement.classList.add("orrery-off"); } catch { /* no document */ } }
/** true once the pass could not draw: a scene says so again on every page (the router's swap takes html's classes) */
export function orreryOff() { return OFF; }
/** the pass, or the page's own list in its place: a failed init or a frame that throws leaves the names printed
 *  @param {any} api { device, format, frameLayout, frameWGSL, blend, tier, log } */
async function init(api) {
  try {
    const inst = await make(api);
    const draw = inst.encode;
    inst.encode = (/** @type {any} */ rp, /** @type {any} */ ctx) => { try { draw(rp, ctx); } catch (e) { off(); throw e; } };
    return inst;
  } catch (e) { off(); throw e; }
}
/** @param {any} api */
async function make(api) {
  if (FAIL === "1") throw new Error("[orrery] off on purpose (?failorrery=1)");
  const { device, format, frameLayout, frameWGSL, blend } = api;
  const tier = /** @type {"A" | "B" | "C"} */ (/^[ABC]$/.test(api.tier) ? api.tier : "A");
  const log = api.log || (() => {});
  const t0 = performance.now();
  const S = GPUShaderStage, Bu = GPUBufferUsage;
  const layout = device.createBindGroupLayout({ label: "orrery.layout", entries: [
    { binding: 0, visibility: S.VERTEX, buffer: { type: "uniform" } },
    { binding: 1, visibility: S.VERTEX, buffer: { type: "read-only-storage" } }] });
  const lLayout = device.createBindGroupLayout({ label: "orrery.words", entries: [
    { binding: 0, visibility: S.VERTEX, buffer: { type: "uniform" } },
    { binding: 1, visibility: S.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 2, visibility: S.FRAGMENT, sampler: { type: "filtering" } }] });
  const mod = device.createShaderModule({ label: "orrery", code: frameWGSL + orreryWGSL });
  const lMod = device.createShaderModule({ label: "orrery.words", code: frameWGSL + labelWGSL });
  const [pipe, lPipe, pts] = await Promise.all([
    device.createRenderPipelineAsync({ label: "orrery", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] }),
      vertex: { module: mod, entryPoint: "vsO" }, fragment: { module: mod, entryPoint: "fsO", targets: [{ format, blend }] }, primitive: { topology: "triangle-strip" } }),
    device.createRenderPipelineAsync({ label: "orrery.words", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, lLayout] }),
      vertex: { module: lMod, entryPoint: "vsL" }, fragment: { module: lMod, entryPoint: "fsL", targets: [{ format, blend }] }, primitive: { topology: "triangle-strip" } }),
    buildPoints(tier),
  ]);
  const pbuf = device.createBuffer({ label: "orrery.points", size: pts.count * REC * 4, usage: Bu.STORAGE | Bu.COPY_DST });
  device.queue.writeBuffer(pbuf, 0, pts.data);
  const ubuf = device.createBuffer({ label: "orrery.u", size: UNI_F * 4, usage: Bu.UNIFORM | Bu.COPY_DST });
  const lbuf = device.createBuffer({ label: "orrery.words.u", size: LUNI_F * 4, usage: Bu.UNIFORM | Bu.COPY_DST });
  const group = device.createBindGroup({ label: "orrery.group", layout, entries: [{ binding: 0, resource: { buffer: ubuf } }, { binding: 1, resource: { buffer: pbuf } }] });
  const smp = device.createSampler({ magFilter: "linear", minFilter: "linear" });
  const U = new Float32Array(UNI_F), LUf = new Float32Array(LUNI_F);
  // a tier draws the points under its share (bodies.js: by rank, a fair sample of every line and fill): fewer points,
  // each wider by nearly as much as they are fewer, so the points of a LINE still run closer than one disc (a line
  // stays a line, never a row of dots); the ink a little less, since a fill then covers more
  const share = pts.count / pts.ranges.reduce((/** @type {number} */ s, /** @type {any} */ r) => s + r.all, 0);
  const tierSize = Math.pow(share, -0.9), tierInk = Math.pow(share, 0.15);
  /** @type {Float32Array[]} */ const hulls = pts.hulls;
  const readyAt = performance.now();
  /** @type {any} */ let cfg = null;
  /** @type {any} */ let atlas = null;
  let atlasKey = "", atlasWant = "", atlasFail = "", atlasAt = 0, destroyed = false, busy = false, frames = 0;
  /** @type {any} */ let last = null;
  /** @type {any} */ let seen = null;

  /** the words' atlas for this face and ratio: once the face is in (or after 1.2 s without it), off the frame's path */
  function makeAtlas(/** @type {string[]} */ words, /** @type {any} */ font, /** @type {number} */ dpr, /** @type {string} */ key) {
    const fs = `${font.weight || 600} ${Math.max(8, font.size || 16)}px ${font.family || '"Sofia Sans Condensed"'}`;
    /** @type {Promise<any>} */ const face = typeof document !== "undefined" && document.fonts ? Promise.race([document.fonts.load(fs, words.join(" ").toUpperCase()).catch(() => null), new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    face.then(() => new Promise((r) => setTimeout(r, 0))).then(() => {
      if (destroyed || atlasWant !== key) return;
      const L = rasterLabels(words, font, dpr);
      const w = L.canvas.width, h = L.canvas.height;
      const tex = device.createTexture({ label: "orrery.words", size: [w, h], format: "rgba8unorm", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
      device.queue.copyExternalImageToTexture({ source: /** @type {any} */ (L.canvas) }, { texture: tex }, [w, h]);
      const g = device.createBindGroup({ label: "orrery.words", layout: lLayout, entries: [{ binding: 0, resource: { buffer: lbuf } }, { binding: 1, resource: tex.createView() }, { binding: 2, resource: smp }] });
      if (atlas) { const old = atlas.tex; setTimeout(() => { try { old.destroy(); } catch { /* gone */ } }, 200); }
      atlas = { tex, group: g, rects: L.rects, size: [w, h], font: L.font, px: L.px };
      atlasKey = key; atlasAt = performance.now();
    // an atlas that cannot be made is not asked for again (a retry a frame kept the stage awake), and the page
    // prints the names
    }).catch((e) => { atlasFail = key; atlasWant = atlasKey; off(); log(`[orrery] words off: ${(e && e.message) || e}`); });
  }

  const inst = {
    /** @param {any} c the scene's config (+ weight) */
    set(c) { cfg = c; return true; },
    /** @param {GPURenderPassEncoder} rp @param {any} ctx */
    encode(rp, ctx) {
      busy = false;
      const c = ctx.cfg || cfg;
      if (destroyed || !c) return;
      if (FAIL === "2" && ++frames > 30) throw new Error("[orrery] a frame thrown on purpose (?failorrery=2)");
      const now = performance.now();
      const fk = clamp((now - readyAt) / FADE_MS);
      if (fk < 1) busy = true;
      const pres = clamp(num(c.a, 1)) * clamp(num(c.weight, 1)) * fk * fk * (3 - 2 * fk);
      if (pres <= 0.002 || ctx.allDawn) { last = null; return; }
      const vw = ctx.view.w, vh = ctx.view.h, sx = ctx.scroll.x, sy = ctx.scroll.y, t = ctx.time || 0;
      const env = { time: t, vw, vh, sx, sy };
      const L = orreryLayout(c, env);
      const k = clamp(num(c.k, 1)), inPlace = sstep(0.88, 0.975, k);
      const R = ctx.R, P = ctx.P, O = ctx.O, D = ctx.D;
      /** world -> [viewport x, y, perspective scale, view z] (the stage's projection, without the eye's few px of offset) */
      const proj = (/** @type {number[]} */ p) => {
        const q = [p[0] - P[0], p[1] - P[1], p[2] - P[2]], v = mv(R, q);
        const z = v[2] + O[2], s = D / Math.max(D - z, 1);
        return [vw / 2 + (v[0] + O[0] - sx - vw / 2) * s, vh / 2 + (v[1] + O[1] - sy - vh / 2) * s, s, z];
      };
      // ---- the hand: the body nearest the pointer comes forward (a pure function of where the pointer is)
      const scr0 = L.bodies.map((/** @type {any} */ b) => proj(b.p));
      const pin = clamp(num(c.pin, 0)) * inPlace, px = num(c.px, -9999), py = num(c.py, -9999);
      const dist = scr0.map((/** @type {number[]} */ s) => Math.hypot(s[0] - px, s[1] - py));
      const hov = dist.map((/** @type {number} */ d, /** @type {number} */ i) => {
        if (pin <= 0) return 0;
        const reach = Math.max(34, 0.8 * L.bodies[i].size * scr0[i][2]);
        let other = 1e9;
        for (let j = 0; j < dist.length; j++) if (j !== i) other = Math.min(other, dist[j]);
        return pin * sstep(reach, reach * 0.42, d) * clamp(0.5 + (other - d) / 24);
      });
      orreryHover(L, hov);
      const scr = L.bodies.map((/** @type {any} */ b) => proj(b.p));
      // every figure's reach on screen, through the stage's own camera (the words stand clear of them)
      const boxes = orreryBoxes(L, proj, hulls);
      // ---- the far mark: under 16 css px on screen (12 in a phone's band) it goes, as the room's chips do (a speck of
      // light reads as a ring); from there up it is the small sharp mark, and its motes come in when it can carry them
      const markPx = L.H * proj(L.mark.p)[2], lim = L.band ? 12 : 16;
      const markVis = sstep(0.75 * lim, lim, markPx), motes = sstep(40, 100, markPx);

      // ---- the head
      U.fill(0);
      U.set([1 + BODIES.length, tierInk, tierSize, pres], 0);
      U.set([L.C0[0], L.C0[1], L.C0[2], 0], 4);
      // a small figure: its motes dimmer (a mote under a px is fog) and their drift shorter
      const small = clamp(L.S / 58, 0.5, 1);
      U.set([1.15, 0, 0, clamp(L.S / 58, 0.45, 1)], 8);
      // the figure's own lens: sharpest on the near arc; far down the hall the stage's own lens takes the bodies
      const zf = proj([L.C0[0], L.C0[1], L.C0[2] + 0.45 * L.zNear])[3];
      U.set([0.16, 1 - sstep(0.55, 0.92, k), zf, clamp(num(c.flash, 0))], 12);
      // the band of light across the mark: 3.4 s across, then still, every 11 s of the stage's clock
      const bp = (t % 11) / 3.4;
      U.set([mix(-0.8, 0.8, clamp(bp)), 0.1, 0.35, bp < 1 ? sstep(0, 0.12, bp) * (1 - sstep(0.88, 1, bp)) : 0], 16);
      U.set([t, 2.2 * small, 2.6 * small, pin], 20);

      // ---- the mark (body 0), then the nine
      const put = (/** @type {number} */ i, /** @type {number[][]} */ Rb, /** @type {number} */ size, /** @type {number[]} */ p, /** @type {number[]} */ q, /** @type {number[]} */ v) => {
        const o = HEAD_F + i * BODY_F;
        for (let r = 0; r < 3; r++) U.set([Rb[r][0] * size, Rb[r][1] * size, Rb[r][2] * size, p[r]], o + r * 4);
        U.set(q, o + 12); U.set(v, o + 16);
      };
      // v.z 0: no share of the stage's lens (sharp at any distance); v.w its motes
      // q.x: how far round the hand the crust is blown off the mark (css px at the page plane)
      put(0, L.mark.R, L.H, L.mark.p, [0.46 * L.H, 0, MODE.mark, 1], [clamp(Math.pow(180 / L.H, 0.25), 0.9, 1.3) * markVis, 0, 0, motes]);
      // (wave 9, J2b NOW) where the condensing starts (c0: a phone held upright asks for it earlier, scenes/now.js)
      const c0 = clamp(num(c.c0, 0.66), 0, 0.8);
      L.bodies.forEach((/** @type {any} */ b, /** @type {number} */ i) => {
        const h = hov[i], an = anim(b.id, t);
        // each condenses in its turn round the carousel, a few tens of ms of scroll after the one before
        const st = c0 + 0.02 * b.slot, cond = sstep(st, st + 0.15, k);
        // a smaller body carries its light in fewer px; what is at the back of the turn is a little dimmer
        const light = clamp(Math.pow(62 / b.size, 0.5), 0.85, 1.6) * mix(0.74, 1, sstep(-0.9, 0.5, b.sin));
        put(1 + i, b.R, b.size, b.p, [an[0], an[1], b.mode, cond], [light * (1 + 0.6 * h), 0.22 * h, an[2], an[3]]);
      });
      device.queue.writeBuffer(ubuf, 0, U);
      rp.setPipeline(pipe);
      rp.setBindGroup(1, group);
      rp.draw(4, pts.count);

      // ---- the words (layout.js orreryWords): the nearest the front and the body under the hand, each clear of every
      // body, of the mark and of every other word, or not there; none in the flight
      const words = Array.isArray(c.words) ? c.words.slice(0, BODIES.length) : [];
      // (always-on words) a desktop's nine stand in two balanced lines where a name is long; a band's one word in one line
      const lfont = { ...(c.font || {}), wrap: c.phone ? 0 : WRAP_EM };
      const lk = words.length ? labelKey(words, lfont, ctx.dpr) : "";
      if (lk && lk !== atlasKey && lk !== atlasWant && lk !== atlasFail) { atlasWant = lk; makeAtlas(words, lfont, ctx.dpr, lk); }
      if (lk && atlasWant !== atlasKey) busy = true;
      /** @type {number[]} */ const alpha = new Array(BODIES.length).fill(0);
      const lab = Array.isArray(c.lab) && c.lab.length === 4 ? c.lab : [8, 72, vw - 8, vh - 8];
      if (atlas && atlasKey === lk && lk) {
        const lf = clamp((now - atlasAt) / LAB_MS);
        if (lf < 1) busy = true;
        const W = orreryWords(L, boxes, atlas.rects, lab, { hov, placed: sstep(0.9, 0.975, k) });
        LUf.fill(0);
        W.forEach((q, i) => {
          const a = q.a * lf * lf * (3 - 2 * lf) * pres, rc = atlas.rects[i];
          if (a <= 0.004 || !rc) return;
          alpha[i] = a;
          const o = LHEAD_F + i * LAB_F, b = L.bodies[i];
          LUf.set([b.p[0], b.p[1], b.p[2], a], o);
          LUf.set([rc.w, rc.h, q.x - scr[i][0], q.y - scr[i][1]], o + 4);
          LUf.set([rc.u0, rc.v0, rc.u1, rc.v1], o + 8);
        });
        device.queue.writeBuffer(lbuf, 0, LUf);
        rp.setPipeline(lPipe);
        rp.setBindGroup(1, atlas.group);
        rp.draw(4, MAX_LABELS);
      }
      // ---- what a probe reads: this frame's places and its smallest gaps, through the stage's own camera
      let gb = 1e9, gm = 1e9;
      for (let i = 0; i < boxes.bodies.length; i++) { gm = Math.min(gm, gapOf(boxes.bodies[i], boxes.mark)); for (let j = i + 1; j < boxes.bodies.length; j++) gb = Math.min(gb, gapOf(boxes.bodies[i], boxes.bodies[j])); }
      const mp = proj(L.mark.p);
      seen = { c, env: { vw, vh, sx, sy }, lab };
      last = { t, k, pres, A: L.A, S: r1(L.S), band: L.band, gap: [r1(gb), r1(gm)],
        mark: { x: Math.round(mp[0]), y: Math.round(mp[1]), h: Math.round(L.H), px: r1(markPx), vis: r1(markVis), box: boxOf(boxes.mark).map(Math.round) },
        bodies: L.bodies.map((/** @type {any} */ b, /** @type {number} */ i) => ({ id: b.id, x: Math.round(scr[i][0]), y: Math.round(scr[i][1]), s: Math.round(scr[i][2] * 1000) / 1000, size: r1(b.size * scr[i][2]), sin: Math.round(b.sin * 100) / 100, word: Math.round(alpha[i] * 100) / 100, hover: Math.round(hov[i] * 100) / 100, box: boxOf(boxes.bodies[i]).map(Math.round) })) };
    },
    busy() { return busy; },
    stats() { return { tier, points: pts.count, ranges: pts.ranges, aspect: pts.aspect, build: { ms: pts.ms, mark: pts.markMs, slice: pts.slice }, initMs: Math.round(readyAt - t0), words: atlas ? { size: atlas.size, font: atlas.font, px: atlas.px, rects: atlas.rects.map((/** @type {any} */ r) => [Math.round(r.w), Math.round(r.h)]) } : null, busy, last,
      cfg: seen ? { ...seen.c, words: undefined, font: undefined } : null }; },
    /** layout.js orreryScan on what is live: the figure in its resting place (Now's view at the top), no hand unless asked
     *  @param {any} o { steps, hover, tilt } */
    proof(o) {
      if (!seen) return null;
      const c = { ...seen.c, x: num(seen.c.hx, seen.c.x), y: num(seen.c.hy, seen.c.y), ax: 0, ay: 0 };
      const res = /** @type {any} */ (orreryScan(c, seen.env, hulls, atlas ? atlas.rects : [], seen.lab, o));
      // how far the straight view the scan uses stands from the camera this frame was drawn with (css px, the bodies' places)
      if (last) {
        const L = orreryLayout(seen.c, { ...seen.env, time: last.t }), pr = straight(seen.env, L.D0);
        res.camDev = r1(Math.max(...L.bodies.map((/** @type {any} */ b, /** @type {number} */ i) => { const q = pr(b.p); return last.bodies[i].hover > 0 ? 0 : Math.hypot(q[0] - last.bodies[i].x, q[1] - last.bodies[i].y); })));
      }
      res.room = seen.lab; res.centre = [c.x, c.y];
      return res;
    },
    destroy() {
      destroyed = true; LIVE.delete(inst);
      for (const b of [pbuf, ubuf, lbuf]) { try { b.destroy(); } catch { /* gone */ } }
      if (atlas) { try { atlas.tex.destroy(); } catch { /* gone */ } }
    },
  };
  LIVE.add(inst);
  log(`[orrery] ready: tier ${tier}, ${pts.count.toLocaleString("en-US")} points (built in ${pts.ms} ms, longest slice ${pts.slice} ms), init ${(readyAt - t0).toFixed(0)} ms`);
  return inst;
}

/** the pass's definition (stage.js registerPass): over the swarm and the chips, after the rays and the splats */
export const orreryPass = Object.freeze({ id: "orrery", layer: "over", rank: 2, init });
registerPass(orreryPass);

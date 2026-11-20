// @ts-check
/**
 * splat.js — GAUSSIAN SPLATTING in the stage (lane SPLAT, wave 2; plan 70 §8.2). An opt-in extra pass of the stage
 * (stage.js registerPass): no three.js, no library, no second canvas. Importing this file registers the pass "splat";
 * a scene switches it on by returning `passes: { splat: cfg }`; the data are put in by id.
 *
 *   import { putSplats, gen } from "../splat/splat.js";
 *   await putSplats("A", gen.letter({ text: "A" }));           // or loadSplats(url) (.ply / .splat), gen.mark(), gen.relief(img)
 *   // a scene's frame:
 *   passes: { splat: { sets: [ { id: "A", pos: [x, y, z], size: 520, rot: [yaw, pitch, roll], settle: 0..1,
 *                                alpha?, shade?, light?: [x, y, z], ambient?, spread?, point?, drift?, stagger? } ] } }
 *
 * A set: pos the centre in VIEWPORT css px at the current scroll and z px toward the reader (the free camera's space);
 * size css px for one local unit (a generated figure is 1 tall, so size = its height); rot radians: yaw brings its
 * right side toward the reader, pitch its top, roll turns it clockwise; settle 0 = round points scattered like the swarm
 * round the set's centre, drifting on the stage's clock, 1 = in place and in shape (each splat staggered a little);
 * shadeColor [r, g, b] (0..1, sRGB) the colour of a tile in shade (default the stage's accent);
 * shade 0..1 how much the tiles are lit by their normal (default 1 for a generated block, 0 for a capture or a relief:
 * their own colour); light the direction toward the light (world, y down; default upper left, in front); spread the
 * scatter's half-width as a multiple of the set's radius (1.3; a box 1.6 : 0.9 : 1.2, never a ball); point the scattered
 * point's sigma in css px (1.0); pointAlpha its opacity (0.35; one splat in fourteen shows as a point (wave 3: a faint, sparse
 * scatter, never a mist over the frame), the rest come in as
 * they settle).
 * Up to 16 sets a frame. Cap per tier (the pool): A 400,000 · B 150,000 · C 60,000; a set over what is left keeps its
 * splats nearest its centre (every set is stored nearest first).
 * Relation to the rest of the stage: the pass draws "over" the swarm and the chips, after them, so a settled figure
 * covers the light behind it (and a point that happens to be in front of it: there is no depth buffer); with plates on
 * screen it draws into the light the plates bend (the stage's hook: always BEHIND the plates, bent by them like the
 * swarm). It reads the stage's camera, depth of field, fog, keep-outs, dawn and clock, and the bloom reads it.
 * Failure: ?failsplat=1 breaks the shader; init rejects and the stage draws on without the pass (one debug line).
 */
import { registerPass } from "../stage.js";
import { splatSortWGSL, splatDrawWGSL } from "./splat.wgsl.js";
import * as gen from "./gen.js";
import { capNearest, loadSplats, parsePly, parseSplat, writePly, writeSplat, diffSplats, withBounds } from "./formats.js";

export { gen, capNearest, loadSplats, parsePly, parseSplat, writePly, writeSplat, diffSplats, withBounds };

/** the pool by tier (splats resident on the GPU at once) */
export const SPLAT_CAP = Object.freeze({ A: 400000, B: 150000, C: 60000 });
// (lane NAME) 16: the cover's name is a set a letter (thirteen); splat.wgsl.js MAXS follows
export const MAX_SETS = 16;
const STRIDE = 48;                 // bytes a splat (splat.wgsl.js Splat)
const BINS = 65536;
const SET_F = 36;                 // floats a set in the uniform (splat.wgsl.js SSet: nine vec4)
const UNI = (8 + MAX_SETS * SET_F / 4) * 16;
const UPLOAD = 65536;              // splats uploaded a frame at most (3 MB)
const FADE_MS = 450;               // a set fades in once it is on the GPU (never at once)
const DMAX = 16384;                // distances keyed (px from the eye)

// ---------------------------------------------------------------- the store (data by id, shared by every stage)
/** @type {Map<string, { buf: ArrayBuffer, count: number, center: number[], radius: number, kind: string, v: number }>} */
const STORE = new Map();
let storeV = 0;
const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Put a set in (or replace it): a SplatData, or a promise of one. Packed for the GPU nearest first (a cap keeps the
 * nearest), in slices (no long task). Resolves { id, count, radius, kind }.
 * @param {string} id @param {any} data
 */
export async function putSplats(id, data) {
  const d = await data;
  if (!d || !d.count) throw new Error(`[splat] ${id}: no splats`);
  if (!d.bounds) withBounds(d);
  const n = Math.min(d.count, SPLAT_CAP.A);
  const c = d.bounds.center;
  // the order nearest first: a counting sort on the quantised distance (O(n))
  const r2 = new Float32Array(d.count);
  let mx = 0;
  for (let i = 0; i < d.count; i++) { const x = d.pos[i * 3] - c[0], y = d.pos[i * 3 + 1] - c[1], z = d.pos[i * 3 + 2] - c[2]; r2[i] = Math.sqrt(x * x + y * y + z * z); if (r2[i] > mx) mx = r2[i]; }
  const Q = 4096, cnt = new Uint32Array(Q + 1), qk = new Uint16Array(d.count);
  for (let i = 0; i < d.count; i++) { qk[i] = Math.min(Q - 1, Math.floor((r2[i] / (mx || 1)) * Q)); cnt[qk[i] + 1]++; }
  for (let i = 0; i < Q; i++) cnt[i + 1] += cnt[i];
  const ord = new Uint32Array(d.count);
  for (let i = 0; i < d.count; i++) ord[cnt[qk[i]]++] = i;
  await tick();
  const buf = new ArrayBuffer(n * STRIDE), f = new Float32Array(buf), u = new Uint32Array(buf);
  for (let j = 0; j < n; j++) {
    if (j && j % 60000 === 0) await tick();
    const i = ord[j], o = j * 12;
    f[o] = d.pos[i * 3]; f[o + 1] = d.pos[i * 3 + 1]; f[o + 2] = d.pos[i * 3 + 2]; f[o + 3] = d.color[i * 4 + 3] / 255;
    f[o + 4] = d.rot[i * 4]; f[o + 5] = d.rot[i * 4 + 1]; f[o + 6] = d.rot[i * 4 + 2]; f[o + 7] = d.rot[i * 4 + 3];
    f[o + 8] = Math.max(1e-6, d.scale[i * 3]); f[o + 9] = Math.max(1e-6, d.scale[i * 3 + 1]); f[o + 10] = Math.max(1e-6, d.scale[i * 3 + 2]);
    u[o + 11] = (d.color[i * 4] | (d.color[i * 4 + 1] << 8) | (d.color[i * 4 + 2] << 16) | (255 << 24)) >>> 0;
  }
  const kind = (d.meta && d.meta.kind) || "capture";
  STORE.set(id, { buf, count: n, center: [...c], radius: d.bounds.radius, kind, v: ++storeV });
  return { id, count: n, radius: d.bounds.radius, kind };
}
/** take a set out @param {string} id */
export function dropSplats(id) { STORE.delete(id); storeV++; }
/** what the store holds */
export function splatStore() { return [...STORE.entries()].map(([id, s]) => ({ id, count: s.count, kind: s.kind })); }

/** every live instance's numbers (bench) */
/** @type {Set<any>} */ const LIVE = new Set();
export function splatStats() { return [...LIVE].map((x) => x.stats()); }
/** (lane NAME) how far a set has come in on a live pass: 0 not on the GPU (or no pass: ?failsplat=1, a dead device),
 *  0..1 its fade once uploaded. A scene hands its own figure over to the set only when this is above 0.
 *  @param {string} id */
export function splatShown(id) { let v = 0; for (const x of LIVE) v = Math.max(v, x.shown(id)); return v; }

// ---------------------------------------------------------------- the pass
const num = (/** @type {any} */ v, /** @type {number} */ d) => (typeof v === "number" && isFinite(v) ? v : d);
/** rows of Ry(yaw) Rx(pitch) Rz(roll) (y down, z toward the reader) @param {number[]} r */
function turn(r) {
  const [yw, pt, rl] = [num(r && r[0], 0), num(r && r[1], 0), num(r && r[2], 0)];
  const cy = Math.cos(yw), sy = Math.sin(yw), cx = Math.cos(pt), sx = Math.sin(pt), cz = Math.cos(rl), sz = Math.sin(rl);
  const Ry = [[cy, 0, -sy], [0, 1, 0], [sy, 0, cy]], Rx = [[1, 0, 0], [0, cx, sx], [0, -sx, cx]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
  const mul = (/** @type {number[][]} */ A, /** @type {number[][]} */ B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
  return mul(mul(Ry, Rx), Rz);
}

/** @param {GPUDevice} device @param {string} label @param {() => any} fn */
async function scoped(device, label, fn) {
  device.pushErrorScope("validation");
  /** @type {any} */ let out, thrown = null;
  try { out = fn(); } catch (e) { thrown = e; }
  const err = await device.popErrorScope();
  if (thrown) throw thrown;
  if (err) throw new Error(`[splat] ${label}: ${err.message.split(String.fromCharCode(10))[0]}`);
  return out;
}

/** @param {any} api { device, format, frameLayout, frameWGSL, blend, tier, log } */
async function init(api) {
  const { device, format, frameLayout, frameWGSL, blend } = api;
  const tier = /** @type {"A" | "B" | "C"} */ (api.tier in SPLAT_CAP ? api.tier : "A");
  const log = api.log || (() => {});
  const t0 = performance.now();
  // ?failsplat=1 (a test): the shader does not compile; the stage must keep drawing without the pass, silently
  const fail = typeof location !== "undefined" && /[?&]failsplat=1/.test(location.search);
  const cap = SPLAT_CAP[tier];
  const S = GPUShaderStage, B = GPUBufferUsage;
  const sortLayout = await scoped(device, "layout", () => device.createBindGroupLayout({ label: "splat.sort", entries: [
    { binding: 0, visibility: S.COMPUTE, buffer: { type: "uniform" } },
    { binding: 1, visibility: S.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 2, visibility: S.COMPUTE, buffer: { type: "storage" } },
    { binding: 3, visibility: S.COMPUTE, buffer: { type: "storage" } },
    { binding: 4, visibility: S.COMPUTE, buffer: { type: "storage" } },
    { binding: 5, visibility: S.COMPUTE, buffer: { type: "storage" } }] }));
  const drawLayout = await scoped(device, "layout", () => device.createBindGroupLayout({ label: "splat.draw", entries: [
    { binding: 0, visibility: S.VERTEX, buffer: { type: "uniform" } },
    { binding: 1, visibility: S.VERTEX, buffer: { type: "read-only-storage" } },
    { binding: 2, visibility: S.VERTEX, buffer: { type: "read-only-storage" } }] }));
  const sortMod = await scoped(device, "sort shader", () => device.createShaderModule({ label: "splat.sort", code: splatSortWGSL + (fail ? " fn broken( { " : "") }));
  const drawMod = await scoped(device, "draw shader", () => device.createShaderModule({ label: "splat.draw", code: frameWGSL + splatDrawWGSL }));
  const sortPL = device.createPipelineLayout({ bindGroupLayouts: [sortLayout] });
  const cp = (/** @type {string} */ e) => device.createComputePipelineAsync({ label: "splat." + e, layout: sortPL, compute: { module: sortMod, entryPoint: e } });
  let pipes;
  try {
    pipes = await Promise.all([cp("cKeys"), cp("cScan"), cp("cScatter"), device.createRenderPipelineAsync({
      label: "splat.draw", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, drawLayout] }),
      vertex: { module: drawMod, entryPoint: "vs" }, fragment: { module: drawMod, entryPoint: "fs", targets: [{ format, blend }] },
      primitive: { topology: "triangle-list" } })]);
  } catch (e) {
    let msg = "";
    try { const info = await (fail ? sortMod : drawMod).getCompilationInfo(); msg = info.messages.filter((x) => x.type === "error").slice(0, 2).map((x) => `${x.lineNum}:${x.linePos} ${x.message}`).join("; "); } catch { /* gone */ }
    throw new Error(`[splat] pipelines: ${(e && /** @type {any} */ (e).message) || e}${msg ? " " + msg : ""}`);
  }
  const [pKeys, pScan, pScatter, pDraw] = pipes;
  const ms = performance.now() - t0;

  // buffers (inside an error scope: an out-of-memory turns the pass off, not the stage)
  const bufs = await scoped(device, "buffers", () => ({
    splats: device.createBuffer({ label: "splat.pool", size: cap * STRIDE, usage: B.STORAGE | B.COPY_DST }),
    keys: device.createBuffer({ label: "splat.keys", size: cap * 4, usage: B.STORAGE }),
    order: device.createBuffer({ label: "splat.order", size: cap * 4, usage: B.STORAGE }),
    hist: device.createBuffer({ label: "splat.hist", size: BINS * 4, usage: B.STORAGE | B.COPY_DST }),
    args: device.createBuffer({ label: "splat.args", size: 16, usage: B.STORAGE | B.INDIRECT | B.COPY_DST }),
    uni: device.createBuffer({ label: "splat.u", size: UNI, usage: B.UNIFORM | B.COPY_DST }),
  }));
  const sortGroup = device.createBindGroup({ label: "splat.sort", layout: sortLayout, entries: [
    { binding: 0, resource: { buffer: bufs.uni } }, { binding: 1, resource: { buffer: bufs.splats } }, { binding: 2, resource: { buffer: bufs.keys } },
    { binding: 3, resource: { buffer: bufs.hist } }, { binding: 4, resource: { buffer: bufs.order } }, { binding: 5, resource: { buffer: bufs.args } }] });
  const drawGroup = device.createBindGroup({ label: "splat.draw", layout: drawLayout, entries: [
    { binding: 0, resource: { buffer: bufs.uni } }, { binding: 1, resource: { buffer: bufs.splats } }, { binding: 2, resource: { buffer: bufs.order } }] });
  // the sort's own GPU time (when the device has timestamps)
  const tsOn = device.features.has("timestamp-query");
  const ts = tsOn ? { set: device.createQuerySet({ type: "timestamp", count: 2 }), res: device.createBuffer({ size: 16, usage: B.QUERY_RESOLVE | B.COPY_SRC }),
    stage: [0, 1].map(() => ({ buf: device.createBuffer({ size: 16, usage: B.MAP_READ | B.COPY_DST }), busy: false })) } : null;

  /** @type {Map<string, { start: number, count: number, up: number, v: number, at: number }>} */ const pool = new Map();
  let used = 0, destroyed = false, drawing = false, busy = false;
  /** @type {any} */ let cfg = null;
  const U = new Float32Array(UNI / 4);
  const st = { sets: 0, splats: 0, sortMs: 0, sortHist: /** @type {number[]} */ ([]), uploads: 0, compileMs: Math.round(ms), cap, tier, timestamps: tsOn };

  /** room for the sets wanted now: kept where they are; when the pool is full, rebuilt with only these */
  function place(/** @type {string[]} */ ids) {
    const need = ids.filter((id) => STORE.has(id) && (!pool.has(id) || /** @type {any} */ (pool.get(id)).v !== /** @type {any} */ (STORE.get(id)).v));
    if (!need.length) return;
    let free = cap - used;
    const want = need.reduce((s, id) => s + /** @type {any} */ (STORE.get(id)).count, 0);
    if (want > free) {
      // compact: only the sets this frame wants, in this order (their data re-uploaded)
      pool.clear(); used = 0; free = cap;
      for (const id of ids) if (STORE.has(id) && !need.includes(id)) need.push(id);
    }
    for (const id of need) {
      const rec = /** @type {any} */ (STORE.get(id));
      const n = Math.min(rec.count, cap - used);
      if (n < rec.count) log(`[splat] ${id}: ${rec.count} splats, ${n} kept (tier ${tier} pool)`);
      if (n <= 0) continue;
      pool.set(id, { start: used, count: n, up: 0, v: rec.v, at: 0 });
      used += n;
    }
  }
  /** upload a slice of what is not on the GPU yet; true while some is left */
  function upload() {
    let budget = UPLOAD, left = false;
    for (const [id, p] of pool) {
      if (p.up >= p.count) continue;
      const rec = STORE.get(id);
      if (!rec || rec.v !== p.v) { pool.delete(id); continue; }
      const n = Math.min(budget, p.count - p.up);
      if (n > 0) {
        device.queue.writeBuffer(bufs.splats, (p.start + p.up) * STRIDE, rec.buf, p.up * STRIDE, n * STRIDE);
        p.up += n; budget -= n; st.uploads++;
        if (p.up >= p.count) p.at = performance.now();
      }
      if (p.up < p.count) left = true;
      if (budget <= 0) { left = left || [...pool.values()].some((q) => q.up < q.count); break; }
    }
    return left;
  }

  const inst = {
    /** @param {any} c the scene's cfg (+ weight) */
    set(c) { cfg = c; return true; },
    /** the order, on the frame's encoder before any render pass @param {GPUCommandEncoder} enc @param {any} ctx */
    compute(enc, ctx) {
      drawing = false; busy = false;
      const c = ctx.cfg || cfg;
      if (destroyed || !c) return;
      const sets = (Array.isArray(c.sets) ? c.sets : []).filter((s) => s && typeof s.id === "string").slice(0, MAX_SETS);
      place(sets.map((s) => s.id));
      if (upload()) busy = true;
      const now = performance.now();
      U.fill(0);
      let n = 0;
      for (const s of sets) {
        const p = pool.get(s.id), rec = STORE.get(s.id);
        if (!p || !rec || p.up < p.count) continue;
        const fadeK = Math.min(1, (now - p.at) / FADE_MS);
        if (fadeK < 1) busy = true;
        const size = Math.max(1e-3, num(s.size, 400));
        const R = turn(s.rot), pos = Array.isArray(s.pos) ? s.pos : [ctx.view.w / 2, ctx.view.h / 2, 0];
        // the local centre sits at pos: translation = pos + scroll - M c
        const lc = rec.center;
        const t = [0, 1, 2].map((k) => num(pos[k], 0) + (k === 0 ? ctx.scroll.x : k === 1 ? ctx.scroll.y : 0) - size * (R[k][0] * lc[0] + R[k][1] * lc[1] + R[k][2] * lc[2]));
        const o = 32 + n * SET_F;
        for (let k = 0; k < 3; k++) U.set([R[k][0] * size, R[k][1] * size, R[k][2] * size, t[k]], o + k * 4);
        const ease = fadeK * fadeK * (3 - 2 * fadeK);
        U.set([p.start, p.count, Math.max(0, Math.min(1, num(s.settle, 1))), Math.max(0, Math.min(1, num(s.alpha, 1))) * ease], o + 12);
        const shade = num(s.shade, rec.kind === "block" ? 1 : 0);
        U.set([shade, rec.radius * num(s.spread, 1.3), num(s.point, 1.0), size], o + 16);
        const L = Array.isArray(s.light) ? s.light : [-0.36, -0.46, 0.81];
        U.set([num(L[0], 0), num(L[1], 0), num(L[2], 1), num(s.ambient, 0.1)], o + 20);
        U.set([lc[0], lc[1], lc[2], (rec.kind === "block" || rec.kind === "relief") && s.surface !== false ? 1 : 0], o + 24);
        U.set([num(s.stagger, 0.6), num(s.drift, 16), num(s.pointAlpha, 0.35), num(s.spec, 0.45)], o + 28);
        // (lane NAME) shadeColor: [r, g, b] 0..1 sRGB, the colour of a tile in shade (default: the stage's accent)
        const sc = Array.isArray(s.shadeColor) ? s.shadeColor : null;
        // emit 0..1: the share of a lit tile's alpha given up (its light added over the room: the bloom reads it); needs shadeColor
        U.set(sc ? [num(sc[0], 0), num(sc[1], 0), num(sc[2], 0), 1 + Math.max(0, Math.min(1, num(s.emit, 0)))] : [0, 0, 0, 0], o + 32);
        n++;
      }
      st.sets = n;
      if (!n) return;
      const R = ctx.R, P = ctx.P, O = ctx.O;
      U.set([n, used, ctx.time || 0, Math.max(0, Math.min(1, num(c.weight, 1)))], 0);
      U.set([R[0][0], R[0][1], R[0][2], 0, R[1][0], R[1][1], R[1][2], 0, R[2][0], R[2][1], R[2][2], 0], 4);
      U.set([P[0], P[1], P[2], 0, O[0], O[1], O[2], 0], 16);
      U.set([ctx.D, ctx.clip ? num(ctx.clip[0], 1) : 1, ctx.view.w, ctx.view.h, ctx.scroll.x, ctx.scroll.y, DMAX, 0], 24);
      device.queue.writeBuffer(bufs.uni, 0, U);
      enc.clearBuffer(bufs.hist);
      const tsSlot = ts ? ts.stage.findIndex((x) => !x.busy) : -1;
      const pass = enc.beginComputePass({ label: "splat.sort", timestampWrites: tsSlot >= 0 && ts ? { querySet: ts.set, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 } : undefined });
      pass.setBindGroup(0, sortGroup);
      const wg = Math.ceil(used / 256);
      pass.setPipeline(pKeys); pass.dispatchWorkgroups(wg);
      pass.setPipeline(pScan); pass.dispatchWorkgroups(1);
      pass.setPipeline(pScatter); pass.dispatchWorkgroups(wg);
      pass.end();
      if (tsSlot >= 0 && ts) {
        const sb = ts.stage[tsSlot];
        enc.resolveQuerySet(ts.set, 0, 2, ts.res, 0);
        enc.copyBufferToBuffer(ts.res, 0, sb.buf, 0, 16);
        sb.busy = true;
        // read after this frame's submit
        queueMicrotask(() => setTimeout(() => sb.buf.mapAsync(GPUMapMode.READ).then(() => {
          const v = new BigUint64Array(sb.buf.getMappedRange().slice(0)); sb.buf.unmap(); sb.busy = false;
          if (v[1] > v[0] && v[0] > 0n) { st.sortMs = Number(v[1] - v[0]) / 1e6; st.sortHist.push(st.sortMs); if (st.sortHist.length > 30) st.sortHist.shift(); }
        }, () => { sb.busy = false; }), 0));
      }
      st.splats = [...pool.values()].reduce((s2, p) => s2 + (p.up >= p.count ? p.count : 0), 0);
      drawing = true;
    },
    /** @param {GPURenderPassEncoder} rp */
    encode(rp) {
      if (!drawing || destroyed) return;
      rp.setPipeline(pDraw);
      rp.setBindGroup(1, drawGroup);
      rp.drawIndirect(bufs.args, 0);
    },
    busy() { return busy; },
    /** @param {string} id */
    shown(id) { const p = pool.get(id), rec = STORE.get(id); if (destroyed || !p || !rec || p.v !== rec.v || p.up < p.count) return 0; return Math.min(1, (performance.now() - p.at) / FADE_MS); },
    stats() {
      const h = st.sortHist.slice().sort((a, b) => a - b);
      return { ...st, busy, sortMed: h.length ? h[h.length >> 1] : st.sortMs, used, pool: [...pool.entries()].map(([id, p]) => ({ id, count: p.count, on: p.up >= p.count })) };
    },
    destroy() {
      destroyed = true; LIVE.delete(inst);
      for (const b of Object.values(bufs)) { try { b.destroy(); } catch { /* gone */ } }
      if (ts) { ts.set.destroy(); ts.res.destroy(); for (const s of ts.stage) s.buf.destroy(); }
    },
  };
  LIVE.add(inst);
  log(`[splat] ready: tier ${tier}, pool ${cap.toLocaleString("en-US")}, pipelines ${ms.toFixed(0)} ms`);
  return inst;
}

/** the pass's definition (stage.js registerPass) */
export const splatPass = Object.freeze({ id: "splat", layer: "over", rank: 0, init });
registerPass(splatPass);

// @ts-check
/**
 * field.js — THE FIELD (lane FIELD, round 11): chips of cut glass in the hall's air, the studio's back wall in relief,
 * and shafts of light that make both shimmer. Opt-in per scene; nothing asked, nothing drawn. The API a scene writes is
 * in stage/scenes/README.md ("The field"); this file is the engine side:
 *
 *   fieldKit({ device, format, frameLayout }) -> Promise<kit>   its pipelines (stage.js prepareStage starts it once the
 *        swarm's pipelines are in; inside error scopes: a failure is a rejected promise and the stage draws without it)
 *   kit.make({ device, tier, winBuf, colors, log }) -> field     per stage
 *   field.set(spec | [{ field, weight }] | null)                 the frame's field (a host's blend of scenes, or one)
 *   field.pack(cam) -> { wall, haze, chips, busy } | null        the frame's uniform, in VIEW space (cam: the stage's
 *        camera rows R, pivot P, origin O and scroll); null = nothing to draw this frame
 *   field.encodeWall(pass), field.encodeChips(pass, k)           inside the stage's passes (k: the swarm's depth window)
 *   field.stats(), field.destroy()
 *
 * Chips are stateless (a hash of the index places, sizes, shapes and turns each one; the wind and the tumble run on
 * the stage's clock, so they stand still when the stage rests). Lights, chips and the wall all live in the free
 * camera's space: x, y viewport css px at the current scroll, z px toward the reader (the page plane is 0).
 */
import { frameWGSL } from "../wgsl/frame.wgsl.js";
import { noiseWGSL } from "../wgsl/noise.wgsl.js";
import { fieldWGSL, FU, FIELD_SIZE, CELL, CELLS } from "./field.wgsl.js";
import { buildCells, ownMask, SHAPE } from "./atlas.js";

/** chips by tier: the scene's count is tier A's */
export const FIELD_TIER = Object.freeze({ A: 1, B: 0.5, C: 0.25 });
export const MAX_CHIPS = 16000;
export const MAX_LIGHTS = 4;

/** The defaults (README "The field"). */
export const FIELD_DEF = Object.freeze({
  light: { radius: 110, aspect: 1.8, roll: 0, spread: 0.04, soft: 0.55, strength: 1, tint: 0.15, length: 6000, haze: 0, wall: 1, chips: 1 },
  chips: { count: 8000, center: [720, 450, -900], size: [2600, 1600, 2400], wind: [6, -3, 4], spin: 0.55, sizes: [7, 22],
    shapes: [{ shape: "A", weight: 1, depth: 0.5, width: 0 }], body: 0.03, edge: 0.05, glint: 2.2, shininess: 80,
    transmit: 0.3, bevel: 7, edgeFade: 0.06, alpha: 1, seed: 1, cap: 0, near: 160, rim: 0, clear: null },
  wall: { point: [720, 450, -2600], normal: [0, 0, 1], cell: 72, line: 1.4, relief: 0.12, extent: [3200, 2000], unlit: 0.06,
    lit: [0.9, 0.1], spec: 0.55, grain: 0.035, displace: 7, alpha: 1 },
});

/** @param {GPUDevice} device @param {string} label @param {() => any} fn */
async function scoped(device, label, fn) {
  device.pushErrorScope("validation");
  /** @type {any} */ let out, thrown = null;
  try { out = fn(); } catch (e) { thrown = e; }
  const err = await device.popErrorScope();
  if (thrown) throw thrown;
  if (err) throw new Error(`[field] ${label}: ${err.message.split(String.fromCharCode(10))[0]}`);
  return out;
}

/** The field's pipelines. @param {{ device: GPUDevice, format: GPUTextureFormat, frameLayout: GPUBindGroupLayout }} o */
export async function fieldKit(o) {
  const { device, format, frameLayout } = o;
  const t0 = performance.now();
  // ?failfield=1 (a test): the field's shader does not compile; the stage must keep drawing without it, silently
  const fail = typeof location !== "undefined" && /[?&]failfield=1/.test(location.search);
  const code = frameWGSL + noiseWGSL + fieldWGSL + (fail ? " fn broken( { " : "");
  const layout = await scoped(device, "layout", () => device.createBindGroupLayout({ label: "field.layout", entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
    { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
  ] }));
  const mod = await scoped(device, "shader", () => device.createShaderModule({ label: "stage.field", code }));
  const pl = device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] });
  // light adds (premultiplied, alpha 0), the stage's own blend
  const blend = { color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" } };
  const mk = (/** @type {string} */ vs, /** @type {string} */ fs) => device.createRenderPipelineAsync({
    label: "field." + fs, layout: pl, vertex: { module: mod, entryPoint: vs },
    fragment: { module: mod, entryPoint: fs, targets: [{ format, blend: /** @type {GPUBlendState} */ (blend) }] }, primitive: { topology: "triangle-list" },
  });
  let pipes;
  try { pipes = await Promise.all([mk("vsWall", "fsWall"), mk("vsWall", "fsHaze"), mk("vsChip", "fsChip")]); }
  catch (e) {
    let msg = "";
    try { const info = await mod.getCompilationInfo(); msg = info.messages.filter((x) => x.type === "error").map((x) => `${x.lineNum}:${x.linePos} ${x.message}`).join("; "); } catch { /* gone */ }
    throw new Error(`[field] pipelines: ${(e && /** @type {any} */ (e).message) || e}${msg ? " " + msg : ""}`);
  }
  const [wall, haze, chips] = pipes;
  const ms = performance.now() - t0;
  return { layout, wall, haze, chips, ms, make: (/** @type {any} */ m) => makeField({ ...m, kit: { layout, wall, haze, chips, ms } }) };
}

// ---------------------------------------------------------------- reading a scene's field
const num = (/** @type {any} */ v, /** @type {number} */ d) => (typeof v === "number" && isFinite(v) ? v : d);
/** @param {any} v @param {number[]} d */
const v3 = (v, d) => (Array.isArray(v) ? [num(v[0], d[0]), num(v[1], d[1]), num(v[2], d[2])] : v && typeof v === "object" ? [num(v.x, d[0]), num(v.y, d[1]), num(v.z, d[2])] : [...d]);
/** @param {any} v @param {number[]} d */
const v2 = (v, d) => (Array.isArray(v) ? [num(v[0], d[0]), num(v[1], d[1])] : [...d]);
const norm = (/** @type {number[]} */ a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** one light, filled with defaults @param {any} l @param {number} w */
function readLight(l, w) {
  const D = FIELD_DEF.light;
  const pos = v3(l.pos || l.position, [0, 0, 0]);
  const dir = l.target ? norm(v3(l.target, [0, 0, 0]).map((x, i) => x - pos[i])) : norm(v3(l.dir || l.direction, [0, 0, -1]));
  // the section: its width axis normal to the direction, turned by the roll about it
  const ref = Math.abs(dir[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
  const a0 = norm([dir[1] * ref[2] - dir[2] * ref[1], dir[2] * ref[0] - dir[0] * ref[2], dir[0] * ref[1] - dir[1] * ref[0]]);
  const b0 = [dir[1] * a0[2] - dir[2] * a0[1], dir[2] * a0[0] - dir[0] * a0[2], dir[0] * a0[1] - dir[1] * a0[0]];
  const rl = num(l.roll, D.roll), cr = Math.cos(rl), sr = Math.sin(rl);
  let across = norm(a0.map((x, i) => x * cr + b0[i] * sr));
  // (wave 2, FIX) an explicit width axis (WORLD), made normal to the direction: the reference above flips from x to y
  // when a shaft leans past ~18 degrees, which turned a leaning blade edge-on (it vanished); `across` holds its face
  if (Array.isArray(l.across)) {
    const g = v3(l.across, [0, 0, 1]), k = g[0] * dir[0] + g[1] * dir[1] + g[2] * dir[2];
    const q = [g[0] - k * dir[0], g[1] - k * dir[1], g[2] - k * dir[2]];
    if (Math.hypot(q[0], q[1], q[2]) > 1e-3) across = norm(q);
  }
  return { pos, dir, across, aspect: Math.max(0, Math.min(12, num(l.aspect, D.aspect))), radius: Math.max(1, num(l.radius, D.radius)), spread: Math.max(0, Math.min(1.2, num(l.spread, D.spread))),
    soft: Math.max(0.02, Math.min(1, num(l.soft, D.soft))), strength: Math.max(0, num(l.strength, D.strength)) * w,
    tint: Math.max(0, Math.min(1, num(l.tint, D.tint))), length: Math.max(10, num(l.length, D.length)),
    haze: Math.max(0, num(l.haze, D.haze)), wall: Math.max(0, num(l.wall, D.wall)), chips: Math.max(0, num(l.chips, D.chips)) };
}
/** @param {any} c */
function readChips(c) {
  const D = FIELD_DEF.chips;
  const shapes = (Array.isArray(c.shapes) && c.shapes.length ? c.shapes : D.shapes).slice(0, 4).map((/** @type {any} */ s) => ({
    cell: typeof s.shape === "number" ? s.shape : SHAPE[/** @type {keyof typeof SHAPE} */ (s.shape)] ?? 0,
    weight: Math.max(0, num(s.weight, 1)), depth: num(s.depth, 0.5), width: Math.max(0, num(s.width, 0)),
    scale: Math.max(0.1, Math.min(9.9, num(s.scale, 1))) }));
  return { count: Math.max(0, Math.min(MAX_CHIPS, num(c.count, D.count))), center: v3(c.center, D.center), size: v3(c.size, D.size),
    wind: v3(c.wind, D.wind), spin: num(c.spin, D.spin), sizes: v2(c.sizes, D.sizes), shapes,
    body: num(c.body, D.body), edge: num(c.edge, D.edge), glint: num(c.glint, D.glint), shininess: Math.max(2, num(c.shininess, D.shininess)),
    transmit: num(c.transmit, D.transmit), bevel: num(c.bevel, D.bevel), edgeFade: num(c.edgeFade, D.edgeFade),
    alpha: Math.max(0, Math.min(1, num(c.alpha, D.alpha))), seed: Math.round(num(c.seed, D.seed)) >>> 0, cap: num(c.cap, D.cap), near: num(c.near, D.near),
    mask: c.mask || null,
    // (round 12) rim: the cut edge's colour toward paper (0 cobalt = before); clear: { rect: [x, y, w, h] viewport css
    // px, point: [x, y, z] } no chip nearer than the point's depth inside the rect (null = none)
    rim: Math.max(0, Math.min(1, num(c.rim, D.rim))),
    clear: c.clear && Array.isArray(c.clear.rect) && c.clear.point ? { rect: v2(c.clear.rect, [0, 0]).concat([num(c.clear.rect[2], 0), num(c.clear.rect[3], 0)]), point: v3(c.clear.point, [0, 0, 0]) } : null };
}
/** @param {any} w */
function readWall(w) {
  const D = FIELD_DEF.wall;
  const lit = Array.isArray(w.lit) ? [num(w.lit[0], D.lit[0]), num(w.lit[1], D.lit[1])] : [...D.lit];
  return { point: v3(w.point, D.point), normal: norm(v3(w.normal, D.normal)), cell: Math.max(4, num(w.cell, D.cell)), line: Math.max(0.2, num(w.line, D.line)),
    relief: num(w.relief, D.relief), extent: v2(w.extent, D.extent), unlit: num(w.unlit, D.unlit), lit, spec: num(w.spec, D.spec),
    grain: num(w.grain, D.grain), displace: num(w.displace, D.displace), alpha: Math.max(0, Math.min(1, num(w.alpha, D.alpha))),
    // (wave 1, FIX3D) keep: { floor, fall, haze } the wall dimmed round the kept text instead of cut (fall 0: cut, as before)
    keepFloor: Math.max(0, Math.min(1, num(w.keep && w.keep.floor, 0))), keepFall: Math.max(0, num(w.keep && w.keep.fall, 0)),
    keepHaze: Math.max(0, Math.min(1, num(w.keep && w.keep.haze, 0))) };
}

/**
 * The host's blend of the scenes' fields: lights pooled (each one's strength x its scene's weight, the four strongest
 * kept); chips and wall: their numbers mixed by weight, their presence the sum of the weights; the shapes and the mask
 * of the heaviest. @param {any} input a field, or [{ field, weight }], or null
 */
export function mixFields(input) {
  if (!input) return null;
  const list = Array.isArray(input) ? input.filter((x) => x && x.field && num(x.weight, 0) > 1e-4) : [{ field: input, weight: 1 }];
  if (!list.length) return null;
  /** @type {any[]} */ const lights = [];
  /** @type {{ c: any, w: number }[]} */ const chips = [];
  /** @type {{ c: any, w: number }[]} */ const walls = [];
  // (round 12) fade: seconds the field takes to come in (default 0.7), the heaviest scene's
  let fade = 0.7, fw = -1, hazeEnd = 0, hw = -1;
  for (const { field: f, weight } of list) {
    if (typeof f.fade === "number" && isFinite(f.fade) && weight > fw) { fade = Math.max(0, f.fade); fw = weight; }
    // (round 12) hazeEnd: px over which the shafts' haze thins before the wall (0 = a hard end, as before)
    if (typeof f.hazeEnd === "number" && isFinite(f.hazeEnd) && weight > hw) { hazeEnd = Math.max(0, f.hazeEnd); hw = weight; }
    const w = Math.min(1, weight) * Math.max(0, Math.min(1, num(f.alpha, 1)));
    if (w <= 0) continue;
    for (const l of (Array.isArray(f.lights) ? f.lights : []).slice(0, 8)) if (l) lights.push(readLight(l, w));
    if (f.chips) chips.push({ c: readChips(f.chips), w });
    if (f.wall) walls.push({ c: readWall(f.wall), w });
  }
  lights.sort((a, b) => b.strength - a.strength);
  return { lights: lights.slice(0, MAX_LIGHTS).filter((l) => l.strength > 1e-4), chips: blend(chips), wall: blend(walls), fade, hazeEnd };
}
/** numbers and arrays of numbers mixed by weight; the rest from the heaviest @param {{ c: any, w: number }[]} a */
function blend(a) {
  if (!a.length) return null;
  const tw = a.reduce((s, x) => s + x.w, 0);
  const heavy = a.reduce((p, x) => (x.w > p.w ? x : p)).c;
  if (a.length === 1) return { ...heavy, alpha: heavy.alpha * Math.min(1, tw) };
  /** @type {any} */ const out = { ...heavy };
  for (const k of Object.keys(heavy)) {
    const h = heavy[k];
    if (typeof h === "number") out[k] = a.reduce((s, x) => s + x.c[k] * x.w, 0) / tw;
    else if (Array.isArray(h) && h.every((v) => typeof v === "number")) out[k] = h.map((_, i) => a.reduce((s, x) => s + x.c[k][i] * x.w, 0) / tw);
  }
  out.count = Math.round(out.count);
  out.alpha = Math.min(1, a.reduce((s, x) => s + x.c.alpha * x.w, 0));
  if ("seed" in heavy) out.seed = heavy.seed;
  return out;
}

// ---------------------------------------------------------------- the field of one stage
/**
 * @param {{ device: GPUDevice, kit: any, tier: "A" | "B" | "C", winBuf: GPUBuffer, win?: number,
 *   colors: { paper: number[], accent: number[], light: number[] }, log?: (m: string) => void }} o
 */
function makeField(o) {
  const { device, kit, tier, winBuf } = o;
  const win = o.win || 512; // bytes of one depth window (stage.js WIN)
  const log = o.log || (() => {});
  const ubuf = device.createBuffer({ label: "field.u", size: FIELD_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const atlas = device.createTexture({ label: "field.atlas", size: [CELL * CELLS, CELL], format: "rgba8unorm", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
  const smp = device.createSampler({ label: "field.smp", magFilter: "linear", minFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
  const aview = atlas.createView();
  const groups = [0, 1, 2].map((k) => device.createBindGroup({ label: "field.g" + k, layout: kit.layout, entries: [
    { binding: 0, resource: { buffer: ubuf } }, { binding: 1, resource: aview }, { binding: 2, resource: smp },
    { binding: 3, resource: { buffer: winBuf, offset: win * k, size: win } }] }));
  const F = new Float32Array(FIELD_SIZE / 4);
  const put = (/** @type {number} */ k, /** @type {number[]} */ v) => F.set(v, k * 4);
  /** @type {any} */ let spec = null;
  let specKey = "";
  let atlasAt = 0, atlasAsked = false, atlasFailed = false, destroyed = false;
  /** @type {any} */ let maskSrc = null;
  let made = performance.now();   // the field fades in from its pipelines being ready, and again whenever it comes back from nothing
  const st = { chips: 0, lights: 0, wall: false, haze: false };

  /** @param {number} cell @param {Uint8Array} bytes */
  const writeCell = (cell, bytes) => device.queue.writeTexture({ texture: atlas, origin: [cell * CELL, 0, 0] }, bytes, { bytesPerRow: CELL * 4, rowsPerImage: CELL }, [CELL, CELL, 1]);
  function askAtlas() {
    if (atlasAsked) return;
    atlasAsked = true;
    const t0 = performance.now();
    buildCells().then((cells) => {
      if (destroyed) return;
      cells.forEach((b, i) => writeCell(i, b));
      atlasAt = performance.now();
      log(`[field] atlas ready: ${(atlasAt - t0).toFixed(0)} ms`);
    }, (e) => { atlasFailed = true; log(`[field] atlas failed: ${(e && e.message) || e}`); });
  }
  // (wave 2, FIX) the shapes are cut as soon as the field exists, not at the first scene's ask: a page reached by a cut
  // had its chips join ~300 ms after its room (the atlas started only with the first frame). Only under an arriving
  // sheet: on a cold load cutting them first put the first frame ~60 ms later (measured), and there nothing covers it
  if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-arrive")) askAtlas();

  /** @param {any} input */
  function set(input) {
    const s = mixFields(input);
    const key = s ? JSON.stringify(s, (k, v) => (k === "mask" ? !!v : v)) : "";
    if (s && s.chips) {
      askAtlas();
      if (s.chips.mask && s.chips.mask !== maskSrc) {
        maskSrc = s.chips.mask;
        try { writeCell(SHAPE.own, ownMask(maskSrc)); } catch (e) { log(`[field] mask: ${e}`); }
      }
    }
    if (key === specKey) return false;
    if (s && !spec) made = Math.max(made, performance.now());
    spec = s; specKey = key;
    return true;
  }

  /**
   * @param {{ R: number[][], P: number[], O: number[], scroll: { x: number, y: number }, view: { w: number, h: number },
   *   D: number, time: number, allDawn: boolean }} cam
   */
  function pack(cam) {
    if (!spec || cam.allDawn) return null;
    const { R, P, O } = cam, sx = cam.scroll.x, sy = cam.scroll.y;
    const vp = (/** @type {number[]} */ p) => { const q = [p[0] + sx - P[0], p[1] + sy - P[1], p[2] - P[2]]; return [0, 1, 2].map((k) => R[k][0] * q[0] + R[k][1] * q[1] + R[k][2] * q[2] + O[k]); };
    const vd = (/** @type {number[]} */ d) => [0, 1, 2].map((k) => R[k][0] * d[0] + R[k][1] * d[1] + R[k][2] * d[2]);
    // the field enters when its pipelines are in (never at once): 0.7 s, and the chips again once their shapes are
    const now = performance.now();
    const fms = Math.max(1, (spec.fade ?? 0.7) * 1000);
    const inK = Math.min(1, (now - made) / fms), chipK = atlasAt ? Math.min(1, (now - atlasAt) / fms) : 0;
    const ease = (/** @type {number} */ x) => x * x * (3 - 2 * x);
    F.fill(0);
    const C = o.colors;
    const lights = spec.lights;
    lights.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
      const b = FU.light + i * 5;
      const col = [0, 1, 2].map((k) => (C.paper[k] + (C.light[k] - C.paper[k]) * l.tint) * l.strength * ease(inK));
      put(b, [...vp(l.pos), l.radius]);
      put(b + 1, [...vd(l.dir), Math.tan(l.spread)]);
      put(b + 2, [...col, l.soft]);
      put(b + 3, [l.length, l.haze, l.wall, l.chips]);
      put(b + 4, [...vd(l.across), l.aspect]);
    });
    const ch = spec.chips;
    const count = ch && chipK > 0 ? Math.round(ch.count * FIELD_TIER[tier]) : 0;
    const chipsA = ch ? ch.alpha * ease(inK) * ease(chipK) : 0;
    const wl = spec.wall;
    const wallA = wl ? wl.alpha * ease(inK) : 0;
    const haze = lights.some((/** @type {any} */ l) => l.haze > 0);
    put(FU.head, [cam.time, lights.length, count, chipsA]);
    put(FU.head2, [wallA, haze ? 1 : 0, CELLS, spec.hazeEnd || 0]);
    if (ch) {
      put(FU.boxC, [ch.center[0] + sx, ch.center[1] + sy, ch.center[2], ch.edgeFade]);
      put(FU.boxS, [...ch.size, ch.seed]);
      put(FU.wind, [...ch.wind, ch.spin]);
      put(FU.size, [ch.sizes[0], ch.sizes[1], ch.body, ch.edge]);
      put(FU.look, [ch.glint, ch.shininess, ch.transmit, ch.bevel]);
      ch.shapes.forEach((/** @type {any} */ s, /** @type {number} */ i) => put(FU.shape + i, [s.cell + s.scale / 10, s.weight, s.depth, s.width]));
      put(FU.shapes, [ch.shapes.length, ch.cap, ch.near, 0]);
      if (ch.rim > 0 || ch.clear) {
        const cl = ch.clear;
        put(FU.extra, [ch.rim, cl ? vp(cl.point)[2] : 0, cl ? 1 : 0, 0]);
        if (cl) put(FU.clear, [cl.rect[0], cl.rect[1], cl.rect[0] + cl.rect[2], cl.rect[1] + cl.rect[3]]);
      }
    }
    if (wl) {
      const Pw = vp(wl.point), eye = [sx + cam.view.w / 2, sy + cam.view.h / 2, cam.D];
      let N = vd(wl.normal);
      // the normal faces the eye (a wall seen from behind turns round)
      if ((eye[0] - Pw[0]) * N[0] + (eye[1] - Pw[1]) * N[1] + (eye[2] - Pw[2]) * N[2] < 0) N = N.map((x) => -x);
      const n = wl.normal, up = Math.abs(n[1]) > 0.9 ? [0, 0, -1] : [0, 1, 0];
      // in-plane axes: U across (right), V down the wall
      const U = norm([up[1] * n[2] - up[2] * n[1], up[2] * n[0] - up[0] * n[2], up[0] * n[1] - up[1] * n[0]]);
      const V = [n[1] * U[2] - n[2] * U[1], n[2] * U[0] - n[0] * U[2], n[0] * U[1] - n[1] * U[0]];
      put(FU.wallP, [...Pw, wallA]);
      put(FU.wallN, [...N, wl.cell]);
      put(FU.wallU, [...vd(U), wl.line]);
      put(FU.wallV, [...vd(V), wl.relief]);
      put(FU.wallE, [wl.extent[0], wl.extent[1], wl.unlit, wl.displace]);
      put(FU.wallL, [wl.lit[0], wl.lit[1], wl.spec, wl.grain]);
      if (wl.keepFall > 0.5) put(FU.wallK, [wl.keepFloor, wl.keepFall, wl.keepHaze, 0]);
    }
    device.queue.writeBuffer(ubuf, 0, F);
    st.chips = chipsA > 0.002 ? count : 0; st.lights = lights.length; st.wall = wallA > 0.002; st.haze = haze;
    return { wall: st.wall, haze, chips: st.chips > 0, busy: inK < 1 || (!!ch && !atlasFailed && chipK < 1) };   // finite: the stage stops drawing once both fades are done (or the shapes failed)
  }

  return {
    set, pack,
    /** the wall (and the shafts' haze) at the back of the frame, before the swarm @param {GPURenderPassEncoder} rp */
    encodeWall(rp) {
      if (!st.wall && !st.haze) return;
      rp.setBindGroup(1, groups[0]);
      if (st.wall) { rp.setPipeline(kit.wall); rp.draw(3); }
      if (st.haze) { rp.setPipeline(kit.haze); rp.draw(3); }
    },
    /** the chips in the swarm's depth window k (0 all, 1 behind the plates, 2 in front) @param {GPURenderPassEncoder} rp @param {number} k */
    encodeChips(rp, k) {
      if (!st.chips) return;
      rp.setPipeline(kit.chips); rp.setBindGroup(1, groups[k]); rp.draw(6, st.chips);
    },
    stats() { return { on: !!spec, chips: st.chips, lights: st.lights, wall: st.wall, haze: st.haze, atlas: !!atlasAt, compileMs: Math.round(kit.ms) }; },
    destroy() { destroyed = true; ubuf.destroy(); atlas.destroy(); },
  };
}

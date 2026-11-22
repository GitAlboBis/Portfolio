// @ts-check
/**
 * field.js — THE FIELD (lane FIELD, round 11; wave 7, lane COSMOS): the night beyond the room, chips of cut glass in
 * the room's air, and the lights the glass catches. Opt-in per scene; nothing asked, nothing drawn. The API a scene
 * writes is in stage/scenes/README.md ("The field"); this file is the engine side:
 *
 *   fieldKit({ device, format, frameLayout }) -> Promise<kit>   its pipelines and the cosmos's web (stage.js
 *        prepareStage starts it once the swarm's pipelines are in; inside error scopes: a failure is a rejected promise
 *        and the stage draws without it)
 *   kit.make({ device, tier, winBuf, colors, log }) -> field     per stage
 *   field.set(spec | [{ field, weight }] | null)                 the frame's field (a host's blend of scenes, or one)
 *   field.journey(c) -> bool                                     (wave 7) where the page is in the cosmos (the host's
 *        { key, slug, y, vh, max, parts }: cosmos/web.js journeyOf); true when the place moved
 *   field.pack(cam) -> { wall, haze, chips, busy } | null        the frame's uniform, in VIEW space (cam: the stage's
 *        camera rows R, pivot P, origin O, scroll, eye offset); null = nothing to draw this frame (wall: the cosmos)
 *   field.encodeWall(pass), field.encodeChips(pass, k)           inside the stage's passes (k: the swarm's depth window)
 *   field.stats(), field.destroy()
 *
 * (wave 7, COSMOS) THE WALL IS GONE (Alberto: «non mi piace lo sfondo a griglia»); the scene's `cosmos` (room.js,
 * cover/world.js) puts THE NEURAL COSMOS behind the room (cosmos/web.js; field.wgsl.js vsCosmos): one web seeded once,
 * the same on every page, every room a place in it. A scene that still returns a `wall` gets the cosmos at the wall's
 * depth. Its impulses (a signal along a filament, node to node) run on the stage's clock, a few seconds apart, only
 * while the stage is awake, and go out with it.
 *
 * Chips are stateless (a hash of the index places, sizes, shapes and turns each one; the wind and the tumble run on
 * the stage's clock, so they stand still when the stage rests). Lights, chips and the cosmos's near plane all live in
 * the free camera's space: x, y viewport css px at the current scroll, z px toward the reader (the page plane is 0).
 */
import { frameWGSL } from "../wgsl/frame.wgsl.js";
import { noiseWGSL } from "../wgsl/noise.wgsl.js";
import { fieldWGSL, FU, FIELD_SIZE, CELL, CELLS, SPARKS } from "./field.wgsl.js";
import { buildCells, ownMask, SHAPE } from "./atlas.js";
import { makeWebAsync, journeyOf, placeOf, BOX, FIL } from "../cosmos/web.js";

/** chips by tier: the scene's count is tier A's */
export const FIELD_TIER = Object.freeze({ A: 1, B: 0.5, C: 0.25 });
export const MAX_CHIPS = 16000;
export const MAX_LIGHTS = 4;
/** (wave 7) the cosmos's galaxies and stars by tier (a prefix of the web: a fair sample) */
export const TIER_COSMOS = Object.freeze({ A: [1, 1], B: [0.5, 0.7], C: [0.3, 0.5] });
/** (wave 7) seconds between the chances of an impulse, and the share of them that fire */
const PULSE_S = 3.4, PULSE_P = 0.72;
/** (wave 7) pieces a filament's strip of light is drawn in (field.wgsl.js RSEG) */
const RSEG = 20;
/** (wave 7) the web, made once per document (any stage on any device reads the same arrays) */
/** @type {Promise<any> | null} */ let WEB = null;
const webOnce = () => (WEB = WEB || makeWebAsync());
/** (wave 7, STAGE) the web started early (stage/boot.js, while the adapter and the device are asked for): its slices run
 *  in the boot's idle wait instead of beside the field's pipelines, which held the first frame (~0.12 s of slices on
 *  the critical path; the home's long page left them less room still) */
export const webEarly = () => { webOnce(); };

/** The defaults (README "The field"). */
export const FIELD_DEF = Object.freeze({
  light: { radius: 110, aspect: 1.8, roll: 0, spread: 0.04, soft: 0.55, strength: 1, tint: 0.15, length: 6000, haze: 0, wall: 1, chips: 1 },
  chips: { count: 8000, center: [720, 450, -900], size: [2600, 1600, 2400], wind: [6, -3, 4], spin: 0.55, sizes: [7, 22],
    shapes: [{ shape: "A", weight: 1, depth: 0.5, width: 0 }], body: 0.03, edge: 0.05, glint: 2.2, shininess: 80,
    transmit: 0.3, bevel: 7, edgeFade: 0.06, alpha: 1, seed: 1, cap: 0, near: 160, rim: 0, clear: null, floor: 0 },
  // (wave 7) the cosmos: its presence, brightness (gain, the stars' own), the thin light's share of paper (white), the
  // room's back plane (z px: only what lies behind it draws), the fog's end (far, in D), the depth of field's factor
  // (x the stage's aperture: deep focus), the dim round the text (keep: floor, fall px, the haze's floor)
  // (run 5) gain 2.6 and a galaxy's ceiling 0.42 (were 3.4 and 0.28): under the old ceiling every galaxy near or far sat
  // between 0.2 and 0.28, the power law squashed flat (an even grey dust); now the many stay faint and the few bright
  // ones read as stars, still under the glow's threshold
  cosmos: { alpha: 1, gain: 2.6, stars: 0.16, white: 0.32, z: -1200, far: 7, dof: 0.012, keep: { floor: 0.04, fall: 140, haze: 0.12 },
    // (run 3) thread: the filaments' light [core gain, halo gain, core width, halo width (x the gas's sigma)]; cap: [a
    // galaxy's ceiling, a node core's ceiling (past the glow's threshold), a core's reach (0..1 of the node's radius), its
    // size (x a galaxy's)]
    thread: [0.068, 0.011, 0.3, 0.9], cap: [0.42, 1, 0.1, 1.7] },
});

/** The field's pipelines. @param {{ device: GPUDevice, format: GPUTextureFormat, frameLayout: GPUBindGroupLayout }} o */
export async function fieldKit(o) {
  const { device, format, frameLayout } = o;
  const t0 = performance.now();
  // ?failfield=1 (a test): the field's shader does not compile; the stage must keep drawing without it, silently
  const fail = typeof location !== "undefined" && /[?&]failfield=1/.test(location.search);
  const code = frameWGSL + noiseWGSL + fieldWGSL + (fail ? " fn broken( { " : "");
  // (wave 7) the cosmos's web is made across a few tasks while the pipelines compile
  const web = webOnce();
  // (k-fix3d) the layout's and the shader's scope is read beside the pipelines, not before them: two awaited round trips
  // to a GPU process busy with the swarm's and the plates' shaders put the field's pipelines 60 to 105 ms after the
  // device, and the first frame waits for them (whenField). A shader that does not compile still rejects its pipelines
  // (caught below), never as an uncaptured error
  device.pushErrorScope("validation");
  const layout = device.createBindGroupLayout({ label: "field.layout", entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
    { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
    { binding: 4, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
    { binding: 5, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
  ] });
  const mod = device.createShaderModule({ label: "stage.field", code });
  const scope = device.popErrorScope();
  const pl = device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] });
  // light adds (premultiplied, alpha 0), the stage's own blend
  const blend = { color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" } };
  // (wave 7, run 3) the cosmos's quads are strips of four vertices (corner4 in field.wgsl.js): a third less vertex work
  // than two triangles of six, the most of its cost on 120,000 galaxies
  const mk = (/** @type {string} */ vs, /** @type {string} */ fs, /** @type {GPUPrimitiveTopology} */ topo = "triangle-list") => device.createRenderPipelineAsync({
    label: "field." + fs, layout: pl, vertex: { module: mod, entryPoint: vs },
    fragment: { module: mod, entryPoint: fs, targets: [{ format, blend: /** @type {GPUBlendState} */ (blend) }] }, primitive: { topology: topo },
  });
  const all = Promise.all([mk("vsCosmos", "fsCosmos", "triangle-strip"), mk("vsWall", "fsHaze"), mk("vsChip", "fsChip"), mk("vsRibbon", "fsRibbon", "triangle-strip")]);
  all.catch(() => {});
  const err = await scope;
  if (err) throw new Error(`[field] layout or shader: ${err.message.split(String.fromCharCode(10))[0]}`);
  let pipes;
  try { pipes = await all; }
  catch (e) {
    let msg = "";
    try { const info = await mod.getCompilationInfo(); msg = info.messages.filter((x) => x.type === "error").map((x) => `${x.lineNum}:${x.linePos} ${x.message}`).join("; "); } catch { /* gone */ }
    throw new Error(`[field] pipelines: ${(e && /** @type {any} */ (e).message) || e}${msg ? " " + msg : ""}`);
  }
  const [cosmos, haze, chips, ribbon] = pipes;
  const w = await web;
  const ms = performance.now() - t0;
  return { layout, cosmos, haze, chips, ribbon, ms, web: w, make: (/** @type {any} */ m) => makeField({ ...m, kit: { layout, cosmos, haze, chips, ribbon, ms, web: w } }) };
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
    // (wave 7) floor: css px on screen under which a chip fades out (0 = none)
    floor: Math.max(0, Math.min(40, num(c.floor, D.floor))),
    clear: c.clear && Array.isArray(c.clear.rect) && c.clear.point ? { rect: v2(c.clear.rect, [0, 0]).concat([num(c.clear.rect[2], 0), num(c.clear.rect[3], 0)]), point: v3(c.clear.point, [0, 0, 0]) } : null };
}
/** (wave 7) the cosmos as a scene asks for it @param {any} c */
function readCosmos(c) {
  const D = FIELD_DEF.cosmos, k = c.keep || {};
  return { alpha: Math.max(0, Math.min(1, num(c.alpha, D.alpha))), gain: Math.max(0, num(c.gain, D.gain)), stars: Math.max(0, num(c.stars, D.stars)),
    white: Math.max(0, Math.min(1, num(c.white, D.white))), z: num(c.z, D.z), far: Math.max(2, Math.min(BOX * 0.9, num(c.far, D.far))),
    dof: Math.max(0, Math.min(1, num(c.dof, D.dof))),
    thread: D.thread.map((v, i) => Math.max(0, num(Array.isArray(c.thread) ? c.thread[i] : undefined, v))),
    cap: D.cap.map((v, i) => Math.max(0, num(Array.isArray(c.cap) ? c.cap[i] : undefined, v))),
    // the dim round the kept text: never above a few hundredths of the night (text is sacred)
    keepFloor: Math.max(0, Math.min(0.08, num(k.floor, D.keep.floor))), keepFall: Math.max(1, num(k.fall, D.keep.fall)),
    keepHaze: Math.max(0, Math.min(1, num(k.haze, D.keep.haze))) };
}
/** a scene that still returns the old wall gets the cosmos at its depth, as present as the wall was @param {any} w */
function wallAsCosmos(w) {
  const pt = Array.isArray(w.point) ? w.point : null;
  return readCosmos({ alpha: w.alpha, z: pt ? pt[2] : undefined, keep: w.keep && w.keep.fall ? w.keep : undefined });
}

/**
 * The host's blend of the scenes' fields: lights pooled (each one's strength x its scene's weight, the four strongest
 * kept); chips and cosmos: their numbers mixed by weight, their presence the sum of the weights; the shapes and the mask
 * of the heaviest. @param {any} input a field, or [{ field, weight }], or null
 */
export function mixFields(input) {
  if (!input) return null;
  const list = Array.isArray(input) ? input.filter((x) => x && x.field && num(x.weight, 0) > 1e-4) : [{ field: input, weight: 1 }];
  if (!list.length) return null;
  /** @type {any[]} */ const lights = [];
  /** @type {{ c: any, w: number }[]} */ const chips = [];
  /** @type {{ c: any, w: number }[]} */ const cosmoi = [];
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
    if (f.cosmos) cosmoi.push({ c: readCosmos(f.cosmos), w });
    else if (f.wall) cosmoi.push({ c: wallAsCosmos(f.wall), w });
  }
  lights.sort((a, b) => b.strength - a.strength);
  return { lights: lights.slice(0, MAX_LIGHTS).filter((l) => l.strength > 1e-4), chips: blend(chips), cosmos: blend(cosmoi), fade, hazeEnd };
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
  // (wave 7) the cosmos's points, once (the web is the same for every stage of the document)
  const web = kit.web;
  const cbuf = device.createBuffer({ label: "field.cosmos", size: Math.max(16, web.data.byteLength), usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(cbuf, 0, web.data);
  const rbuf = device.createBuffer({ label: "field.ribbons", size: Math.max(16, web.rib.byteLength), usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(rbuf, 0, web.rib);
  const groups = [0, 1, 2].map((k) => device.createBindGroup({ label: "field.g" + k, layout: kit.layout, entries: [
    { binding: 0, resource: { buffer: ubuf } }, { binding: 1, resource: aview }, { binding: 2, resource: smp },
    { binding: 3, resource: { buffer: winBuf, offset: win * k, size: win } }, { binding: 4, resource: { buffer: cbuf } }, { binding: 5, resource: { buffer: rbuf } }] }));
  const F = new Float32Array(FIELD_SIZE / 4);
  const put = (/** @type {number} */ k, /** @type {number[]} */ v) => F.set(v, k * 4);
  /** @type {any} */ let spec = null;
  let specKey = "";
  let atlasAt = 0, atlasAsked = false, atlasFailed = false, destroyed = false;
  /** @type {any} */ let maskSrc = null;
  let made = performance.now();   // the field fades in from its pipelines being ready, and again whenever it comes back from nothing
  const st = { chips: 0, lights: 0, wall: false, haze: false, cosmos: 0, gal: 0, stars: 0, sparks: 0, /** @type {number[]} */ pulseAt: [] };
  // (wave 7) where the page is in the cosmos (journeyOf: the distance j along the journey, D; side: a step aside)
  let jr = { j: 0, side: 0 };
  /** @type {any} */ let lookCos = null;   // a probe's live overrides of the cosmos's look (window.__cosmosLook)
  // the impulses: the slot of the stage's clock last looked at, the impulses running
  /** @type {{ slot: number, list: any[] }} */ const ps = { slot: -1, list: [] };

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

  /** (wave 7) the page's place in the cosmos @param {any} c @returns {boolean} the place moved */
  function journey(c) {
    const n = journeyOf(c);
    if (Math.abs(n.j - jr.j) < 1e-7 && n.side === jr.side) return false;
    jr = n;
    return true;
  }

  /** a stable hash of an integer pair to [0, 1) @param {number} a @param {number} b */
  const h2 = (a, b) => { let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0) / 4294967296; };

  /**
   * (wave 7) the impulses: on the stage's clock a chance every PULSE_S s; one fires on a filament the frame shows whole
   * (both nodes on screen, at mid depth, long enough to read), runs from node to node, and the node it reaches lights up.
   * @param {number} time @param {boolean} fly @param {(p: number[]) => number[]} view box -> VIEW @param {(v: number[]) => number[]} scr VIEW -> screen
   * @param {number[]} wf the window's centre in the box (fraction) @param {number} D0 @param {number} vw @param {number} vh
   */
  function impulses(time, fly, view, scr, wf, D0, vw, vh) {
    const slot = Math.floor(time / PULSE_S);
    if (slot !== ps.slot) {
      const fresh = ps.slot >= 0;
      ps.slot = slot;
      if (fresh && !fly && ps.list.length < 2 && h2(slot, 7) < PULSE_P) {
        const F = web.fil, cands = [];
        for (let f = 0; f < web.nFil; f++) {
          const e = ends(f, wf), v0 = view(e[0]), v2 = view(e[2]);
          const d0 = Math.hypot(v0[0] - eyeNow[0], v0[1] - eyeNow[1], v0[2] - eyeNow[2]), d2 = Math.hypot(v2[0] - eyeNow[0], v2[1] - eyeNow[1], v2[2] - eyeNow[2]);
          if (d0 < 2.2 * D0 || d2 < 2.2 * D0 || d0 > 7.5 * D0 || d2 > 7.5 * D0) continue;
          const s0 = scr(v0), s2 = scr(v2);
          if (!(s0[2] > 0 && s2[2] > 0)) continue;
          const m = 30;
          if (s0[0] < m || s0[0] > vw - m || s0[1] < m || s0[1] > vh - m || s2[0] < m || s2[0] > vw - m || s2[1] < m || s2[1] > vh - m) continue;
          const len = Math.hypot(s2[0] - s0[0], s2[1] - s0[1]);
          if (len < 150) continue;
          cands.push({ f, len });
        }
        if (cands.length) {
          const c = cands[Math.floor(h2(slot, 3) * cands.length) % cands.length];
          const dir = h2(slot, 5) < 0.5 ? 1 : -1;
          ps.list.push({ f: c.f, t0: time, dur: Math.max(0.9, Math.min(2.6, c.len / 380)), dir, node: F[c.f * FIL + (dir > 0 ? 7 : 3)] });
        }
      }
    }
    // the running ones: the head runs past the far node by a quarter (its trail slides into it), then the node's light
    ps.list = ps.list.filter((p) => time - p.t0 < p.dur * 1.25 + 1.6 && time >= p.t0);
    return ps.list;
  }
  /** a filament's three points in the box, moved by whole boxes to the window about wf @param {number} f @param {number[]} wf */
  function ends(f, wf) {
    const F = web.fil, b = f * FIL;
    const m = [0, 1, 2].map((k) => 0.25 * F[b + k] + 0.5 * F[b + 4 + k] + 0.25 * F[b + 8 + k]);
    const o = m.map((v, k) => { const r = v - wf[k] + 0.5; return (r - Math.floor(r) - 0.5) - (v - wf[k]); });
    return [0, 4, 8].map((q) => [F[b + q] + o[0], F[b + q + 1] + o[1], F[b + q + 2] + o[2]]);
  }
  /** @type {number[]} */ let eyeNow = [0, 0, 0];

  /**
   * @param {{ R: number[][], P: number[], O: number[], scroll: { x: number, y: number }, view: { w: number, h: number },
   *   D: number, time: number, allDawn: boolean, eye?: number[], fly?: boolean }} cam
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
    const cs = spec.cosmos;
    const cosA = cs ? cs.alpha * ease(inK) : 0;
    const haze = lights.some((/** @type {any} */ l) => l.haze > 0);
    put(FU.head, [cam.time, lights.length, count, chipsA]);
    put(FU.head2, [cosA, haze ? 1 : 0, CELLS, spec.hazeEnd || 0]);
    if (ch) {
      put(FU.boxC, [ch.center[0] + sx, ch.center[1] + sy, ch.center[2], ch.edgeFade]);
      put(FU.boxS, [...ch.size, ch.seed]);
      put(FU.wind, [...ch.wind, ch.spin]);
      put(FU.size, [ch.sizes[0], ch.sizes[1], ch.body, ch.edge]);
      put(FU.look, [ch.glint, ch.shininess, ch.transmit, ch.bevel]);
      ch.shapes.forEach((/** @type {any} */ s, /** @type {number} */ i) => put(FU.shape + i, [s.cell + s.scale / 10, s.weight, s.depth, s.width]));
      put(FU.shapes, [ch.shapes.length, ch.cap, ch.near, ch.floor || 0]);
      if (ch.rim > 0 || ch.clear) {
        const cl = ch.clear;
        put(FU.extra, [ch.rim, cl ? vp(cl.point)[2] : 0, cl ? 1 : 0, 0]);
        if (cl) put(FU.clear, [cl.rect[0], cl.rect[1], cl.rect[0] + cl.rect[2], cl.rect[1] + cl.rect[3]]);
      }
    }
    st.cosmos = 0; st.gal = 0; st.stars = 0; st.sparks = 0; st.pulseAt = [];
    if (cs && cosA > 0.002) {
      // ------------------------------------------------ (wave 7) THE COSMOS this frame
      const lk = /** @type {any} */ (globalThis).__cosmosLook;
      if (lk && typeof lk === "object") lookCos = lk;
      const L = lookCos || {};
      const vw = cam.view.w, vh = cam.view.h;
      // its scale: the lens-1 eye distance of this viewport (a lens that zooms does not resize the cosmos)
      const D0 = Math.max(1100, Math.min(2600, 1.25 * Math.hypot(vw, vh))), S = BOX * D0;
      const eo = cam.eye || [0, 0];
      // the eye: VIEW space (the stage's projection puts it there), then the room's space (R^T (v - O) + P - scroll)
      const eyeV = [sx + vw / 2 + eo[0], sy + vh / 2 + eo[1], cam.D];
      eyeNow = eyeV;
      const q = [eyeV[0] - O[0], eyeV[1] - O[1], eyeV[2] - O[2]];
      const eyeR = [0, 1, 2].map((k) => R[0][k] * q[0] + R[1][k] * q[1] + R[2][k] * q[2] + P[k] - (k === 0 ? sx : k === 1 ? sy : 0));
      // its place in the box: the page's place on the journey plus the eye in the room; the window's centre half a box
      // ahead along the eye's axis (its fraction: the shader wraps every point about it)
      const pl = placeOf(jr.j, jr.side);
      const fwd = [-R[2][0], -R[2][1], -R[2][2]];
      const wc = [0, 1, 2].map((k) => (pl[k] * D0 + eyeR[k]) / S + 0.5 * fwd[k]);
      const wf = wc.map((v) => v - Math.floor(v));
      const nV = [R[0][2], R[1][2], R[2][2]];
      const cz = cs.z - P[2] + nV[0] * O[0] + nV[1] * O[1] + nV[2] * O[2];
      const TK = TIER_COSMOS[tier] || TIER_COSMOS.A;
      const nG = Math.round(web.nGal * TK[0]), nS = Math.round(web.nStar * TK[1]);
      const center = [eyeV[0], eyeV[1], eyeV[2] - 0.5 * S];
      put(FU.cosP, [...center, cosA]);
      put(FU.cosU, [wf[0], wf[1], wf[2], S]);
      put(FU.cosN, [...nV, cz]);
      put(FU.cosL, [cs.gain * num(L.gain, 1), num(L.white, cs.white), D0, num(L.far, cs.far) * D0]);
      put(FU.cosK, [0.32 * D0, 1.0 * D0, num(L.dof, cs.dof), cs.stars * num(L.stars, 1)]);
      const th = cs.thread || FIELD_DEF.cosmos.thread, cp = cs.cap || FIELD_DEF.cosmos.cap;
      put(FU.cosR, [num(L.core, th[0]), num(L.halo, th[1]), num(L.coreW, th[2]), num(L.haloW, th[3])]);
      put(FU.cosC, [num(L.cap, cp[0]), num(L.nodeCap, cp[1]), num(L.coreT, cp[2]), num(L.coreSize, cp[3])]);
      put(FU.wallK, [cs.keepFloor, cs.keepFall, cs.keepHaze, 0]);
      // the impulses (VIEW: the window's centre plus the box turned by the camera)
      // a box point near the window (ends: moved by whole boxes about wf) in VIEW space, as the shader places it
      const view = (/** @type {number[]} */ b) => { const r = [b[0] - wf[0], b[1] - wf[1], b[2] - wf[2]]; return [0, 1, 2].map((k) => center[k] + S * (R[k][0] * r[0] + R[k][1] * r[1] + R[k][2] * r[2])); };
      const scr = (/** @type {number[]} */ v) => { const s = cam.D / Math.max(1, cam.D - v[2]); const ex = vw / 2 + eo[0], ey = vh / 2 + eo[1]; return [ex + (v[0] - sx - ex) * s, ey + (v[1] - sy - ey) * s, s]; };
      const run = impulses(cam.time, !!cam.fly, view, scr, wf, D0, vw, vh);
      let nP = 0;
      const flash = [-1, 0, -1, 0];
      run.slice(0, 2).forEach((p, i) => {
        const u = (cam.time - p.t0) / p.dur;
        const head = p.dir > 0 ? u : 1 - u;
        const amp = Math.min(1, u / 0.06) * (1 - Math.min(1, Math.max(0, (u - 1) / 0.25)));
        const e = ends(p.f, wf).map(view);
        put(FU.pulse + i * 4, [head, amp, p.f, p.dir]);
        put(FU.pulse + i * 4 + 1, [...e[0], 0]);
        put(FU.pulse + i * 4 + 2, [...e[1], 0]);
        put(FU.pulse + i * 4 + 3, [...e[2], 0]);
        if (amp > 0) nP = (i + 1) * SPARKS;
        // (a probe's) where the impulse's two nodes are on screen, css px
        if (i === 0) { const a = scr(e[0]), z = scr(e[2]); st.pulseAt = [a[0], a[1], z[0], z[1]].map((v) => Math.round(v)); }
        const after = cam.time - p.t0 - p.dur * 0.98;
        if (after > 0) { flash[i * 2] = p.node; flash[i * 2 + 1] = Math.exp(-after / 0.45) * Math.min(1, after / 0.08); }
      });
      put(FU.flash, flash);
      put(FU.cosE, [nG, nS, nP, web.nGal]);
      st.cosmos = nG + nS + nP; st.gal = nG; st.stars = nS; st.sparks = nP;
    }
    device.queue.writeBuffer(ubuf, 0, F);
    st.chips = chipsA > 0.002 ? count : 0; st.lights = lights.length; st.wall = st.cosmos > 0; st.haze = haze;
    return { wall: st.wall, haze, chips: st.chips > 0, busy: inK < 1 || (!!ch && !atlasFailed && chipK < 1) };   // finite: the stage stops drawing once both fades are done (or the shapes failed)
  }

  return {
    set, pack, journey,
    /** the cosmos (and the shafts' haze) at the back of the frame, before the swarm @param {GPURenderPassEncoder} rp */
    encodeWall(rp) {
      if (!st.cosmos && !st.haze) return;
      rp.setBindGroup(1, groups[0]);
      // the filaments' own light first, then their galaxies, the stars and the sparks over it
      // (a probe's window.__cosmosLook.skip: "rib", "gal" leave a part out, to weigh it)
      const sk = String((lookCos && lookCos.skip) || "");
      if (st.cosmos && !sk.includes("rib")) { rp.setPipeline(kit.ribbon); rp.draw(4, web.nFil * RSEG); }
      if (st.cosmos && !sk.includes("gal")) { rp.setPipeline(kit.cosmos); rp.draw(4, st.cosmos); }
      if (st.haze) { rp.setPipeline(kit.haze); rp.draw(3); }
    },
    /** the chips in the swarm's depth window k (0 all, 1 behind the plates, 2 in front) @param {GPURenderPassEncoder} rp @param {number} k */
    encodeChips(rp, k) {
      if (!st.chips) return;
      rp.setPipeline(kit.chips); rp.setBindGroup(1, groups[k]); rp.draw(6, st.chips);
    },
    stats() { return { on: !!spec, chips: st.chips, lights: st.lights, wall: st.wall, haze: st.haze, atlas: !!atlasAt, compileMs: Math.round(kit.ms),
      cosmos: { gal: st.gal, stars: st.stars, sparks: st.sparks, j: Math.round(jr.j * 1e3) / 1e3, side: Math.round(jr.side * 1e3) / 1e3, webMs: Math.round(web.ms), impulses: ps.list.length, pulseAt: st.pulseAt } }; },
    destroy() { destroyed = true; ubuf.destroy(); atlas.destroy(); cbuf.destroy(); rbuf.destroy(); },
  };
}

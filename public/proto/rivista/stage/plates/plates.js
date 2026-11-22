// @ts-check
/**
 * plates.js — the renderer of plates of clear glass inside the stage (spec 50 §5). stage.js owns it: the
 * host never imports this file; it calls stage.slabTexture / stage.setBackdrop / stage.set({ slabs })
 * (documented at the top of stage.js). The shading is in plates.wgsl.js.
 *
 * What lives here: the image array (every texture a plate may hold, one layer each, with its mip chain),
 * the backdrop (the display type the host rasterised, with mips for the soft plates), the ink texture
 * (pass A: the swarm behind the plates), the studio's lights and their swing with the pointer (damped on
 * simulated time, so they stop with the stage's rest), and the packing of up to 12 plates per frame:
 * world -> view through the camera, local axes from yaw, pitch, roll, the screen rectangle of the
 * projected box, the order far to near.
 */

import { platesWGSL, MAX_SLABS, SLAB_SIZE, PLATES_SIZE } from "./plates.wgsl.js";
import { createMipper, mipKit, mipCount } from "./mips.js";

export { MAX_SLABS };

/** Layer side of the image array by tier, and the most layers it grows to. */
const LAYER_SIDE = Object.freeze({ A: 1024, B: 768, C: 512 });
const MAX_LAYERS = 16;

/** The tier rule of the plates: what each tier computes per pixel. */
export const PLATE_TIER = Object.freeze({
  A: { dispersion: true, through: true, inner: true, glow: true },
  B: { dispersion: false, through: true, inner: true, glow: true },
  C: { dispersion: false, through: false, inner: false, glow: false },
});

/** The material and the studio, tuned on captures (docs/redesign/rivista-story/build/z-core.md). */
export const PLATE_LOOK = Object.freeze({
  ior: 1.5,
  dispersion: 0.014,      // ior step per channel (red lower, blue higher), grows on the bevels
  bevel: 12.0,            // px at w = 600 (scaled with the plate's smaller side, 2.5..7)
  tint: 1.0,              // gain of the absorption below
  absorb: [0.0011, 0.00072, 0.0005],   // per px of path, linear (a faint cool cast that deepens with the path)
  glowGain: 3.2,          // light the edges take from the swarm behind
  glowRadius: 34,         // css px of the ring of taps that gathers it
  inkZ: -320,             // the view depth of the plane the swarm's light is read from behind a plate
  // the studio, by azimuth and elevation of a reflected ray (rad; az 0 = toward the reader, > 0 his right):
  // two tall soft boxes either side of him; top: the overhead box, on the ceiling plane (x, z per unit of height)
  key: [1.1, 0.1, 0.02, 0.42], fill: [-0.38, 0.12, 0.016, 0.3], top: [0.0, -0.5, 0.7, 0.016],
  gains: [8.0, 3.6, 2.4, 5.0],          // key, fill, overhead, rim
  amb: [0.16, 0.45, 0.35],              // the sweep: gain, elevation of its band, width (rad)
  rim: [-0.55, -0.25, -0.8, 30],          // direction (view, toward the light), exponent
  swing: [0.34, 0.14],    // how far the pointer moves the lights (rad per half viewport)
  swingDamp: 0.45,        // s
});

/** (wave 4, PRISM) a slab is a prism when it says shape: "prism", or (through a host that passes only the stage's
 *  numeric fields: fx-stage.js copies inset, bevel, ior, dispersion, tint, sheen, edge) when its inset is negative
 *  @param {any} s */
export const isPrismSlab = (s) => s.shape === "prism" || (typeof s.inset === "number" && s.inset < 0);

/** (lane m-glass) THE PRISM'S BEAM (plates.wgsl.js prBeam): the light of the room's shaft goes into the prism where
 *  `u0` stands on the triangle's outline and leaves it where `u1` stands, at `y` along the axis (-1..1 of the half
 *  length, + toward the triangle the eye sees). The outline runs 0..3: the right face from the apex down, the back face
 *  from right to left, the left face from the back up to the apex. Its light: the slab's `inset` below -1, as -(1 + k)
 *  (a host passes inset through; inset < 0 already says "prism"). index.js aims the shaft at u0 and the row's ray from u1 */
export const PRISM_BEAM = Object.freeze({ u0: 2.86, u1: 0.5, y: 0.9 });

/** the place u on the outline of a prism of half sizes hx (across), hz (deep), as [x, z] in its own space
 *  @param {number} u @param {number} hx @param {number} hz @returns {[number, number]} */
export function prismOutline(u, hx, hz) {
  if (u < 1) return [hx * u, hz - 2 * hz * u];
  if (u < 2) return [hx - 2 * hx * (u - 1), -hz];
  return [-hx + hx * (u - 2), -hz + 2 * hz * (u - 2)];
}

/** @param {number} x */ const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** The plates' bind group layout (group 1). @param {GPUDevice} device */
function platesLayout(device) {
  return device.createBindGroupLayout({ label: "plates.layout", entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d-array" } },
    { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
  ] });
}

/**
 * The plates' pipelines (the plate, the blit of pass A, the mipper), compiled at once and off the main path (BOOT):
 * stage.js starts them with the swarm's, the swarm draws as soon as its own are done, and the plates join when this
 * resolves. Tier-free (the tier is a uniform). A compile error rejects with the WGSL messages.
 * @param {{ device: GPUDevice, format: GPUTextureFormat, frameLayout: GPUBindGroupLayout, frameWGSL: string, blend: GPUBlendState }} o
 * @returns {Promise<{ layout: GPUBindGroupLayout, pPlate: GPURenderPipeline, pBlit: GPURenderPipeline, mips: any, ms: number }>}
 */
export async function platesKit(o) {
  const { device, format, frameLayout, blend } = o;
  const t0 = performance.now();
  const layout = platesLayout(device);
  const code = o.frameWGSL + platesWGSL;
  const mod = device.createShaderModule({ label: "plates", code });
  const pl = device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] });
  try {
    const [pPlate, pBlit, mips] = await Promise.all([
      device.createRenderPipelineAsync({ label: "plates.plate", layout: pl, vertex: { module: mod, entryPoint: "vsPlate" }, fragment: { module: mod, entryPoint: "fsPlate", targets: [{ format, blend }] }, primitive: { topology: "triangle-strip" } }),
      device.createRenderPipelineAsync({ label: "plates.blit", layout: pl, vertex: { module: mod, entryPoint: "vsBlit" }, fragment: { module: mod, entryPoint: "fsBlit", targets: [{ format, blend }] }, primitive: { topology: "triangle-list" } }),
      mipKit(device),
    ]);
    return { layout, pPlate, pBlit, mips, ms: performance.now() - t0 };
  } catch (e) {
    // the messages of a WGSL error, for the log (a pipeline error alone only says that it failed)
    let msg = "";
    try {
      const info = await mod.getCompilationInfo(), lines = code.split("\n");
      msg = info.messages.filter((m) => m.type === "error").map((x) => `${x.lineNum}:${x.linePos} ${x.message}\n    ${(lines[x.lineNum - 1] || "").trim()}`).join("\n");
    } catch (e2) { /* the device may be gone */ }
    throw new Error("[plates] pipeline: " + ((e && /** @type {any} */ (e).message) || e) + (msg ? "\n" + msg : ""));
  }
}

/**
 * The plates, once their pipelines are compiled (o.kit, from platesKit; without it they are compiled here).
 * @param {{ device: GPUDevice, format: GPUTextureFormat, frameLayout: GPUBindGroupLayout, frameWGSL: string,
 *   blend: GPUBlendState, tier: "A" | "B" | "C", log: (m: string) => void, look?: any, kit?: any }} o
 */
export async function createPlates(o) {
  return makePlates(o, o.kit || await platesKit(o));
}

/**
 * @param {{ device: GPUDevice, format: GPUTextureFormat, tier: "A" | "B" | "C", log: (m: string) => void, look?: any }} o
 * @param {{ layout: GPUBindGroupLayout, pPlate: GPURenderPipeline, pBlit: GPURenderPipeline, mips: any }} kit
 */
export function makePlates(o, kit) {
  const { device, format, log } = o;
  const tierCfg = { ...PLATE_TIER[o.tier] };
  /** @type {any} */ const look = JSON.parse(JSON.stringify(PLATE_LOOK));
  /** look overrides; "key.2": v sets one entry of an array @param {any} l */
  const applyLook = (l) => { for (const [k, v] of Object.entries(l || {})) { const [n, i] = k.split("."); if (i != null && Array.isArray(look[n])) look[n][+i] = v; else look[n] = v; } };
  applyLook(o.look);
  const side = LAYER_SIDE[o.tier];
  const mipper = createMipper(device, kit.mips);
  const { layout, pPlate, pBlit } = kit;

  const ubuf = device.createBuffer({ label: "plates.u", size: PLATES_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const smp = device.createSampler({ label: "plates.smp", magFilter: "linear", minFilter: "linear", mipmapFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });

  // ---------------------------------------------------------------- textures
  const blank = device.createTexture({ label: "plates.blank", size: [1, 1], format: "rgba8unorm", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
  device.queue.writeTexture({ texture: blank }, new Uint8Array([0, 0, 0, 0]), { bytesPerRow: 4 }, [1, 1]);
  /** @type {GPUTexture | null} */ let bdTex = null;
  /** @type {{ x: number, y: number, w: number, h: number } | null} */ let bdRect = null;
  /** @type {GPUTexture | null} */ let inkTex = null;
  /** @type {GPUTexture | null} */ let imgTex = null;
  let layers = 0;
  /** @type {GPUBindGroup | null} */ let group = null;
  let inkW = 0, inkH = 0;
  const mips = mipCount(side, side);

  function rebind() {
    if (!imgTex) growImages(2);
    group = device.createBindGroup({ label: "plates.group", layout, entries: [
      { binding: 0, resource: { buffer: ubuf } },
      { binding: 1, resource: (bdTex || blank).createView() },
      { binding: 2, resource: (inkTex || blank).createView() },
      { binding: 3, resource: /** @type {GPUTexture} */ (imgTex).createView({ dimension: "2d-array" }) },
      { binding: 4, resource: smp },
    ] });
  }

  /** @param {number} n layers */
  function growImages(n) {
    const old = imgTex, oldN = layers;
    const nt = device.createTexture({ label: "plates.images", size: [side, side, n], mipLevelCount: mips, format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT });
    if (old && oldN) {
      const e = device.createCommandEncoder({ label: "plates.images.grow" });
      for (let m = 0; m < mips; m++) {
        const s = Math.max(1, side >> m);
        e.copyTextureToTexture({ texture: old, mipLevel: m }, { texture: nt, mipLevel: m }, [s, s, oldN]);
      }
      device.queue.submit([e.finish()]);
      old.destroy();
    }
    imgTex = nt; layers = n;
  }

  /** @param {number} w @param {number} h */
  function ensureInk(w, h) {
    if (inkTex && inkW === w && inkH === h) return;
    inkTex?.destroy();
    inkTex = device.createTexture({ label: "plates.ink", size: [w, h], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
    inkW = w; inkH = h;
    rebind();
  }

  /**
   * The backdrop: the display type a plate may bend, in document px.
   * @param {HTMLCanvasElement | OffscreenCanvas | ImageBitmap | null} source @param {{ x: number, y: number, w: number, h: number } | null} rect
   */
  function setBackdrop(source, rect) {
    if (!source || !rect) { bdTex?.destroy(); bdTex = null; bdRect = null; rebind(); return; }
    const w = source.width, h = source.height;
    if (!bdTex || bdTex.width !== w || bdTex.height !== h) {
      bdTex?.destroy();
      bdTex = device.createTexture({ label: "plates.backdrop", size: [w, h], mipLevelCount: Math.min(6, mipCount(w, h)), format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
      rebind();
    }
    device.queue.copyExternalImageToTexture({ source }, { texture: bdTex }, [w, h]);
    mipper.generate(bdTex, 0);
    bdRect = { ...rect };
  }

  // ---------------------------------------------------------------- the images plates hold
  /** @type {Map<string, { layer: number, aspect: number, used: number }>} */ const tex = new Map();
  let useClock = 0;

  /**
   * A texture a plate may hold (`tex`) or carry etched (`etch`). The source is stretched into one layer
   * of the array (its aspect is kept aside and the shader fits it back), with its mip chain. Etched
   * lettering reads the source's ALPHA: draw it white (or any colour) on a transparent canvas.
   * @param {string} id @param {HTMLImageElement | ImageBitmap | HTMLCanvasElement | OffscreenCanvas} source
   */
  async function slabTexture(id, source) {
    if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
      if (!source.complete || !source.naturalWidth) await source.decode();
    }
    const sw = "naturalWidth" in source ? source.naturalWidth : source.width;
    const sh = "naturalHeight" in source ? source.naturalHeight : source.height;
    if (!sw || !sh) throw new Error(`[plates] slabTexture "${id}": empty source`);
    // the layer: the id's own, a free one, a new one, or the least recently used
    let rec = tex.get(id);
    if (!rec) {
      const taken = new Set([...tex.values()].map((r) => r.layer));
      let layer = -1;
      for (let i = 0; i < layers; i++) if (!taken.has(i)) { layer = i; break; }
      if (layer < 0 && layers < MAX_LAYERS) { const n = Math.min(MAX_LAYERS, Math.max(2, layers * 2)); const at = layers; growImages(n); rebind(); layer = at; }
      if (layer < 0) {
        // (k-evidence, 22 November) the least recently DRAWN, never one a plate drew in the latest frame while another
        // will do. Two scenes on screen together can need more textures than layers (in the home the gallery's last
        // plate and About's stack, since Work's measured figures no longer stand between them): each makes again what
        // it lost (fx-stage.js held), what was just made counted as just drawn, and a tie went to the oldest entry,
        // the plate on screen, whose picture was gone for a few frames
        let lru = /** @type {string | null} */ (null), u = Infinity;
        for (const [k, r] of tex) if (r.used < useClock && r.used < u) { u = r.used; lru = k; }
        if (lru === null) for (const [k, r] of tex) if (r.used < u) { u = r.used; lru = k; }
        layer = /** @type {any} */ (tex.get(/** @type {string} */ (lru))).layer; tex.delete(/** @type {string} */ (lru));
      }
      // a texture made now ranks behind every one drawn in the latest frame and ahead of all drawn before it
      rec = { layer, aspect: sw / sh, used: useClock - 0.5 };
      tex.set(id, rec);
    }
    rec.aspect = sw / sh;
    const cv = new OffscreenCanvas(side, side);
    const g = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d"));
    g.imageSmoothingQuality = "high";
    g.drawImage(/** @type {CanvasImageSource} */ (source), 0, 0, side, side);
    device.queue.copyExternalImageToTexture({ source: cv }, { texture: /** @type {GPUTexture} */ (imgTex), origin: [0, 0, rec.layer] }, [side, side, 1]);
    mipper.generate(/** @type {GPUTexture} */ (imgTex), rec.layer);
    log(`[plates] texture "${id}" in layer ${rec.layer} (${sw}x${sh})`);
  }

  // ---------------------------------------------------------------- the studio's swing
  const swing = [0, 0];

  // ---------------------------------------------------------------- packing
  const U = new Float32Array(PLATES_SIZE / 4);
  const UU = new Uint32Array(U.buffer);
  let count = 0, splitZ = -1e9;
  // (lane m-fly, run 3) the first plate drawn (far to near): the plates behind a door that hides the whole frame are
  // packed (the door's glass shows them, through) but not drawn, their every pixel painted over by the door's
  let drawFrom = 0;
  // (lane m-glass) the door's glass hides the whole frame (stage.js skips the blit then)
  let coveredF = false;
  /** @type {any[]} */ let last = [];

  /**
   * Pack the plates of this frame. Returns true when one is on screen.
   * world -> view = R (p - pivot) + origin (the stage's camera, either kind). free: the free camera's lens (near
   * distances, fog, focus) or null for the orbiting camera (its old hard cull); soften 0..1: the cut's push (the
   * plates go soft with the swarm).
   * @param {{ slabs: any[], R: number[][], pivot: number[], origin?: number[], dolly?: number, scroll: { x: number, y: number },
   *   view: { w: number, h: number }, D: number, eye: number[], pointer: any, dt: number, dpr: number,
   *   free?: { near: number, nearFull: number, fog: number[] | null, focusZ: number, aperture: number, plateFocus: boolean } | null,
   *   soften?: number }} f
   */
  function pack(f) {
    U.fill(0);
    count = 0; splitZ = -1e9; last = []; coveredF = false;
    useClock++;
    // the lights swing with the pointer (damped, simulated time)
    const p = f.pointer;
    const sx = p.present ? (p.x - f.view.w / 2) / (f.view.w / 2) : 0, sy = p.present ? (p.y - f.view.h / 2) / (f.view.h / 2) : 0;
    if (f.dt > 0) { const k = 1 - Math.exp(-f.dt / look.swingDamp); swing[0] += (sx * look.swing[0] - swing[0]) * k; swing[1] += (sy * look.swing[1] - swing[1]) * k; }

    const ex = f.view.w / 2 + f.eye[0], ey = f.view.h / 2 + f.eye[1], D = f.D;
    /** @param {number[]} q @returns {number[]} */
    const scr = (q) => { const s = D / Math.max(D - q[2], 1); return [ex + (q[0] - f.scroll.x - ex) * s, ey + (q[1] - f.scroll.y - ey) * s]; };
    const R = f.R, P = f.pivot;
    const O = f.origin || [P[0], P[1], P[2] + (f.dolly || 0)];
    const F = f.free || null;
    const ss = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    /** @param {number[]} v */ const rot = (v) => [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]];

    /** @type {any[]} */ const items = [];
    for (const s of (f.slabs || []).slice(0, MAX_SLABS)) {
      const alpha = clamp01(s.alpha ?? 1);
      if (alpha <= 0.002 || !(s.w > 0) || !(s.h > 0)) continue;
      const t = Math.max(1, s.t ?? 40);
      const wc = [f.scroll.x + (s.cx ?? 0), f.scroll.y + (s.cy ?? 0), s.cz ?? 0];
      const rc = rot([wc[0] - P[0], wc[1] - P[1], wc[2] - P[2]]);
      const c = [rc[0] + O[0], rc[1] + O[1], rc[2] + O[2]];
      // (lane n-flight) s.near === false: the cut's door, which the eye flies into (never faded near the lens);
      // f.nearFade [near, nearFull]: the orbiting camera in a flight fades plates near the lens as the free one does
      const door = s.near === false, NF = /** @type {any} */ (f).nearFade || null;
      if (!F && !door && !NF && c[2] > D * 0.7) continue;
      // the plate's own turn: yaw brings its right edge toward the reader, pitch its top edge, roll turns it clockwise
      const cy = Math.cos(s.yaw || 0), sy_ = Math.sin(s.yaw || 0), cp = Math.cos(s.pitch || 0), sp = Math.sin(s.pitch || 0), cr = Math.cos(s.roll || 0), sr = Math.sin(s.roll || 0);
      /** @param {number[]} v */
      const obj = (v) => {
        // roll (z), then pitch (x), then yaw (y)
        const x = v[0] * cr - v[1] * sr;
        let y = v[0] * sr + v[1] * cr, z = v[2];
        const y2 = y * cp + z * sp, z2 = -y * sp + z * cp;
        y = y2; z = z2;
        const x3 = x * cy - z * sy_, z3 = x * sy_ + z * cy;
        return [x3, y, z3];
      };
      const ax = rot(obj([1, 0, 0])), ay = rot(obj([0, 1, 0])), az = rot(obj([0, 0, 1]));
      const hw = s.w / 2, hh = s.h / 2, ht = t / 2;
      // the screen rectangle of the projected box (+ the bevel, the blur, a pixel)
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false, zmax = -1e9;
      for (let k = 0; k < 8; k++) {
        const a = k & 1 ? hw : -hw, b = k & 2 ? hh : -hh, d = k & 4 ? ht : -ht;
        const q = [c[0] + ax[0] * a + ay[0] * b + az[0] * d, c[1] + ax[1] * a + ay[1] * b + az[1] * d, c[2] + ax[2] * a + ay[2] * b + az[2] * d];
        if (q[2] > D * 0.85) behind = true;
        zmax = Math.max(zmax, q[2]);
        const sc = scr(q);
        x0 = Math.min(x0, sc[0]); y0 = Math.min(y0, sc[1]); x1 = Math.max(x1, sc[0]); y1 = Math.max(y1, sc[1]);
      }
      let pres = 1, focusK = 1;
      if (F) {
        // the free camera: a plate whose nearest corner comes nearer than the near distance fades out before it
        // reaches the lens (never a pop, never a box around the eye); past the fog's end it falls into the night
        pres = door ? 1 : ss(F.near, F.nearFull, D - zmax);
        if (F.fog && !door) pres *= 1 - ss(F.fog[0], F.fog[1], D - c[2]);
        if (pres <= 0.002) continue;
        // and it goes soft away from the focal plane, as the swarm does (circle of confusion at its centre)
        if (F.plateFocus && !door) { const coc = F.aperture * Math.abs(c[2] - F.focusZ) * D / Math.max(D - c[2], 1); focusK = Math.max(0.1, Math.min(1, 1 - coc / 26)); }
      } else if (door) { /* drawn to the lens */ }
      else if (NF) { pres = ss(NF[0], NF[1], D - zmax); if (pres <= 0.002 || zmax > D - 1) continue; }
      else if (behind) continue;
      const sharp = clamp01((s.sharp ?? 1) * focusK * (1 - 0.75 * (f.soften || 0)));
      const pad = 3 + (1 - sharp) * 18;
      x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
      // (k-fix3d) a door whose room beyond is the morning (not s.night) stops at the edge of day risen from the frame's
      // foot (f.dayY, stage.js): below it the page itself is seen, its paper and its words rising, not the glass's
      // picture of an empty sheet. A straight cut, where the day's edge is; the night's door stands whole on the paper
      let clipped = false;
      if (door && !s.night && Number.isFinite(/** @type {any} */ (f).dayY) && /** @type {any} */ (f).dayY < y1) { y1 = /** @type {any} */ (f).dayY; clipped = true; }
      if (x1 < 0 || y1 < 0 || x0 > f.view.w || y0 > f.view.h || y1 <= y0) continue;
      const img = s.tex != null && !isPrismSlab(s) && s.shape !== "door" ? tex.get(s.tex) : undefined;
      const etch = s.etch != null && !isPrismSlab(s) && s.shape !== "door" ? tex.get(s.etch) : undefined;
      if (img) img.used = useClock;
      if (etch) etch.used = useClock;
      // the image rect on the mid plane: inset from the edges (default 5 % of the smaller side, at least the bevel x 2)
      const bevel = s.bevel ?? Math.max(2.5, Math.min(7, look.bevel * Math.min(s.w, s.h) / 600));
      const inset = s.inset ?? Math.max(bevel * 2.2, 0.03 * Math.min(s.w, s.h));
      items.push({ s, c, ax, ay, az, hw, hh, ht, alpha: alpha * pres, sharp, quad: [x0, y0, x1, y1], img, etch, bevel, inset, clipped });
    }
    items.sort((a, b) => a.c[2] - b.c[2]);
    // (lane m-fly, run 3) f.doorCover: the door's glass is opaque from edge to edge of the frame now (stage.js doorCover)
    const di = /** @type {any} */ (f).doorCover ? items.findIndex((it) => it.s.shape === "door") : -1;
    // (k-fix3d) a door cut at the edge of day covers only the night above it: what is behind is drawn as ever
    drawFrom = di > 0 && items[di].alpha >= 0.999 && !items[di].clipped ? di : 0;
    coveredF = di >= 0 && items[di].alpha >= 0.999 && !items[di].clipped;
    const SL = SLAB_SIZE / 4;
    items.forEach((it, i) => {
      const b = i * SL, s = it.s;
      U.set([it.c[0], it.c[1], it.c[2], it.alpha], b);
      U.set([...it.ax, it.hw], b + 4);
      U.set([...it.ay, it.hh], b + 8);
      U.set([...it.az, it.ht], b + 12);
      // (wave 2, GLOW-WORK) s.edge 0..1: the bevels' own light (plates.wgsl.js edgeOf), packed above the glow
      // (lane m-glass) a prism carries no image: its look.z is the light of the beam inside it (PRISM_BEAM)
      const beamK = isPrismSlab(s) && typeof s.inset === "number" && s.inset < -1 ? Math.min(2, -s.inset - 1) : 0;
      U.set([clamp01(s.glow ?? 0.5) + 2 * Math.round(1000 * clamp01(s.edge ?? 0)), it.sharp, isPrismSlab(s) ? beamK : it.img ? it.img.layer : -1, it.etch ? it.etch.layer : -1], b + 16);
      // (wave 4, PRISM) a prism: a triangular prism of cut glass inscribed in the plate's box (its axis the plate's
      // height, its triangle w wide and t deep, the apex edge along +z); it holds no image. Flagged by a negative image
      // aspect (plates.wgsl.js isPrism): every other plate packs exactly as before
      const prism = isPrismSlab(s);
      // (lane n-fix-flight) the cut's door (stage.js doorSlab: shape "door"): a block the eye flies through. A negative etch
      // aspect flags it, -(1 + the light inside it, s.light 0..1); the image aspect carries 1 + how much of that light is
      // the morning's paper (s.paper 0..1). It holds no image and no etching (plates.wgsl.js isDoor)
      const isDoor = s.shape === "door";
      // (the door holds no image: its image rect's x says whether plates stand behind it, 2, or none, 1: s.through)
      // (lane m-fly) s.night: the room beyond the door is the night whatever ground is on screen (image aspect 3)
      // (lane m-glass) a prism's image rect carries its beam: where it enters and leaves on the outline, and along the axis
      if (prism) U.set([PRISM_BEAM.u0, PRISM_BEAM.u1, -1, 1 + PRISM_BEAM.y], b + 20);
      else U.set([isDoor ? (s.through ? 2 : 1) : Math.max(1, it.hw - it.inset), Math.max(1, it.hh - it.inset), isDoor ? (s.night ? 3 : 1 + clamp01(s.paper ?? 0)) : it.img ? it.img.aspect : 1,
        isDoor ? -(1 + clamp01(s.light ?? 0)) : it.etch ? it.etch.aspect : 1], b + 20);
      U.set(it.quad, b + 24);
      // (round 12) s.sheen: how much of the studio the broad face reflects (1, the default: all, today's image; 0: only
      // the bevels, as an etched plate), packed above the tint gain (plates.wgsl.js tintOf / sheenCut)
      // (lane o-fix) s.rimSheen === 0: the bevels reflect none of the studio either (the cut's portal: its deep rims showed
      // the soft box as a tall grey column); packed as a cut of 64
      const cut = s.rimSheen === 0 ? 64 : Math.round(63 * (1 - clamp01(s.sheen ?? 1)));
      U.set([it.bevel, s.ior ?? look.ior, tierCfg.dispersion ? (s.dispersion ?? look.dispersion) : 0, Math.min(63.9, (s.tint ?? 1) * look.tint) + 64 * cut], b + 28);
      splitZ = Math.max(splitZ, it.c[2]);
      // the plate's mid plane, its normal turned toward the eye: a point is in front of the plate when
      // dot(n, p) >= w (draw.wgsl.js ZWin; the centre's depth alone cut letters in front of a turned plate)
      const eyeP = [f.scroll.x + ex, f.scroll.y + ey, D];
      let n = it.az;
      if ((eyeP[0] - it.c[0]) * n[0] + (eyeP[1] - it.c[1]) * n[1] + (eyeP[2] - it.c[2]) * n[2] < 0) n = [-n[0], -n[1], -n[2]];
      const plane = [n[0], n[1], n[2], n[0] * it.c[0] + n[1] * it.c[1] + n[2] * it.c[2]];
      last.push({ id: s.id, z: it.c[2], quad: it.quad, plane });
    });
    count = items.length;
    const o = MAX_SLABS * SL;
    for (let i = 0; i < MAX_SLABS; i++) UU[o + i] = i < count ? i : 0;
    const k = o + 12;
    // (lane n-flight) f.lean: the eye in a flight's fast part, the plates growing over the frame as they pass it: one ray
    // for the three channels, no inner bounce and no gathered edge light (bits 1, 4 and 8); the speed hides it
    // (lane m-fly) f.lean 1 arriving, 2 leaving. Both: no pixel takes its two extra edge rays (bit 16). Leaving: behind
    // a plate only the door is looked for, not the other plates (bit 32: the search over every plate for every pixel
    // of six plates at the lens was the flight's peak)
    const lean = +(/** @type {any} */ (f).lean) || 0;
    const flags = (((tierCfg.dispersion ? 1 : 0) | (tierCfg.through ? 2 : 0) | (tierCfg.inner ? 4 : 0) | (tierCfg.glow ? 8 : 0)) & (lean ? ~13 : ~0)) | (lean ? 16 : 0) | (lean === 2 ? 32 : 0);
    U.set([count, Math.min(look.inkZ, splitZ - 120), flags, look.glowRadius], k);
    U.set(bdRect ? [bdRect.x, bdRect.y, bdRect.w, bdRect.h] : [0, 0, 0, 0], k + 4);
    U.set([look.key[0] + swing[0], look.key[1] - swing[1], look.key[2], look.key[3]], k + 8);
    U.set([look.fill[0] + swing[0] * 0.7, look.fill[1] - swing[1], look.fill[2], look.fill[3]], k + 12);
    U.set([look.top[0] + swing[0] * 0.6, look.top[1] + swing[1] * 0.6, look.top[2], look.top[3]], k + 16);
    U.set(look.gains, k + 20);
    const rl = Math.hypot(look.rim[0], look.rim[1], look.rim[2]) || 1;
    U.set([look.rim[0] / rl, look.rim[1] / rl, look.rim[2] / rl, look.rim[3]], k + 24);
    U.set([...look.absorb, look.glowGain], k + 28);
    U.set([look.amb[0], look.amb[1], look.amb[2], 0], k + 32);
    if (count) device.queue.writeBuffer(ubuf, 0, U);
    return count > 0;
  }

  return {
    /** (lane n-flight) whether a texture is held now (the store lets the least recently used go) @param {string} id */
    hasTexture: (id) => tex.has(id),
    slabTexture, setBackdrop, ensureInk, pack,
    get splitZ() { return splitZ; },
    get count() { return count; },
    /** (lane m-glass) the door's glass hides the whole frame this frame (the plates behind it and the blit are not drawn) */
    get covered() { return coveredF; },
    get last() { return last; },
    get inkView() { return /** @type {GPUTexture} */ (inkTex).createView(); },
    get tier() { return tierCfg; },
    /** @param {any} l */ look(l) { applyLook(l); },
    /** @param {GPURenderPassEncoder} pass */
    encodeBlit(pass) { if (!group) return; pass.setPipeline(pBlit); pass.setBindGroup(1, group); pass.draw(3); },
    /** @param {GPURenderPassEncoder} pass */
    encodePlates(pass) { if (!group || !count) return; pass.setPipeline(pPlate); pass.setBindGroup(1, group); pass.draw(4, count - drawFrom, 0, drawFrom); },
    destroy() { ubuf.destroy(); blank.destroy(); bdTex?.destroy(); inkTex?.destroy(); imgTex?.destroy(); },
  };
}

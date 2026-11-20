// @ts-check
/**
 * prism.js — THE PRISM'S RAYS (wave 4, lane PRISM; plan 70 phase 2, "the prism and the portals"). An extra pass of the
 * stage (stage.js registerPass, README "An extra pass"): straight, thin rays of light with a soft core, drawn in the
 * room (behind the plates, so the prism bends what passes behind it, and the bloom reads them). Importing this file
 * registers the pass "rays"; a scene switches it on by returning
 *
 *   passes: { rays: { rays: [ { a: [x, y, z], b: [x, y, z], w, k, rgb: [r, g, b] } ], ina?, outa? } }
 *
 * a, b the ends in the free camera's space (viewport css px at the current scroll, z px toward the reader, as a slab's
 * cx, cy, cz); w the core's width in css px at the depth of the page plane (the perspective scales it, never under
 * 1.1 px on screen); k its light 0..1.5; rgb its colour (sRGB-encoded, 0..1: the site's paper white to cobalt);
 * ina / outa (for all the rays) the share of the length it takes to come in from a and to fade out toward b (0.06 / 0.22). Up to 8 rays.
 * The light is added (alpha 0: a ray never darkens), kept off the scene's keep-outs (stageKeep) and the dawn
 * (stageNight), through the lens and the fog (stageFade). Nothing moves by itself here: the scene sets every value.
 */
import { registerPass } from "../../stage.js";

const MAX = 8;
const RAY = 3;            // vec4 per ray
const UNI = (1 + MAX * RAY) * 16;

const WGSL = /* wgsl */ `
struct Rays { head : vec4f, r : array<vec4f, ${MAX * RAY}> };
@group(1) @binding(0) var<uniform> R : Rays;
struct RO {
  @builtin(position) pos : vec4f,
  @location(0) q : vec4f,            // across (css px, signed), half core width (css px), along 0..1, fade (lens, fog)
  @location(1) @interpolate(flat) id : u32,
};
@vertex fn vsRay(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> RO {
  var o : RO;
  let a = R.r[ii * 3u];
  let b = R.r[ii * 3u + 1u];
  let va = stageView(a.xyz);
  let vb = stageView(b.xyz);
  let sa = stageScreenV(va);
  let sb = stageScreenV(vb);
  var d = sb.xy - sa.xy;
  let L = max(length(d), 1e-3);
  d = d / L;
  let n = vec2f(-d.y, d.x);
  let end = f32(vi >> 1u);            // 0 at a, 1 at b
  let side = f32(vi & 1u) * 2.0 - 1.0;
  let sc = mix(sa.z, sb.z, end);
  let core = max(a.w * sc, 1.1);
  let half = core * 7.0 + 2.0;        // room for the soft halo
  let p = mix(sa.xy, sb.xy, end) + n * side * half;
  o.pos = stageClip(p);
  let fade = mix(stageFade(va), stageFade(vb), end);
  o.q = vec4f(side * half, core * 0.5, end, fade);
  o.id = ii;
  return o;
}
@fragment fn fsRay(i : RO) -> @location(0) vec4f {
  let b = R.r[i.id * 3u + 1u];
  let c = R.r[i.id * 3u + 2u];
  let x = abs(i.q.x);
  let hc = i.q.y;
  // a straight soft core and a faint halo round it (never a disc: the profile is across the line only)
  let core = exp(-(x * x) / (2.0 * hc * hc));
  let halo = exp(-x / (hc * 4.5)) * 0.16;
  let u = i.q.z;
  let ina = R.head.y;
  let outa = R.head.z;
  let along = smoothstep(0.0, max(ina, 1e-3), u) * (1.0 - smoothstep(1.0 - max(outa, 1e-3), 1.0, u));
  let k = b.w * R.head.w * along * i.q.w * stageKeep(i.pos.xy) * stageNight(i.pos.xy);
  let col = c.rgb * (core + halo) * k;
  if (max(col.r, max(col.g, col.b)) <= 1.0 / 1024.0) { discard; }
  // (lane m-glass) under the light's ceiling (1 on the 8-bit canvas; above paper white on an HDR canvas), with the grain
  // that keeps the halo's long dark tail from banding
  return vec4f(stageGrainLight(min(col, vec3f(frame.band.w)), i.pos.xy), 0.0);
}
`;

/** the pass (stage.js registerPass) */
export const raysPass = Object.freeze({
  id: "rays", layer: "over", rank: 1,
  /** @param {any} api */
  async init(api) {
    const { device, format, frameLayout, frameWGSL, blend, log } = api;
    const t0 = performance.now();
    const layout = device.createBindGroupLayout({ label: "rays.layout", entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }] });
    const mod = device.createShaderModule({ label: "rays", code: frameWGSL + WGSL });
    const pipe = await device.createRenderPipelineAsync({ label: "rays", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] }),
      vertex: { module: mod, entryPoint: "vsRay" }, fragment: { module: mod, entryPoint: "fsRay", targets: [{ format, blend }] }, primitive: { topology: "triangle-strip" } });
    const ubuf = device.createBuffer({ label: "rays.u", size: UNI, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const group = device.createBindGroup({ label: "rays.group", layout, entries: [{ binding: 0, resource: { buffer: ubuf } }] });
    const U = new Float32Array(UNI / 4);
    /** @type {any} */ let cfg = null;
    let n = 0, key = "";
    log(`[rays] ready: pipeline ${(performance.now() - t0).toFixed(0)} ms`);
    return {
      /** @param {any} c */
      set(c) { const k = JSON.stringify(c || null); if (k === key) return false; key = k; cfg = c; return true; },
      /** @param {GPURenderPassEncoder} rp @param {any} ctx */
      encode(rp, ctx) {
        const c = ctx.cfg || cfg;
        const list = c && Array.isArray(c.rays) ? c.rays.slice(0, MAX) : [];
        const wt = Math.max(0, Math.min(1, c && typeof c.weight === "number" ? c.weight : 1));
        if (!list.length || wt <= 1e-3) return;
        U.fill(0);
        const sx = ctx.scroll ? ctx.scroll.x : 0, sy = ctx.scroll ? ctx.scroll.y : 0;
        n = 0;
        for (const r of list) {
          if (!r || !Array.isArray(r.a) || !Array.isArray(r.b) || !(r.k > 0)) continue;
          const o = 4 + n * RAY * 4;
          U.set([r.a[0] + sx, r.a[1] + sy, r.a[2] || 0, r.w ?? 1.6], o);
          U.set([r.b[0] + sx, r.b[1] + sy, r.b[2] || 0, r.k], o + 4);
          const rgb = r.rgb || [0.96, 0.95, 0.92];
          U.set([rgb[0], rgb[1], rgb[2], 0], o + 8);
          n++;
        }
        if (!n) return;
        U.set([n, c.ina ?? 0.06, c.outa ?? 0.22, wt], 0);
        device.queue.writeBuffer(ubuf, 0, U);
        rp.setPipeline(pipe);
        rp.setBindGroup(1, group);
        rp.draw(4, n);
      },
      busy() { return false; },
      destroy() { ubuf.destroy(); },
    };
  },
});
registerPass(raysPass);

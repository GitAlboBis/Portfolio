// @ts-check
/**
 * mips.js — the mip chain of an rgba8unorm texture (2d or 2d-array, one layer at a time), by a linear
 * box filter, level from level. The plates read their images at the mip level of the pixel footprint,
 * and an out-of-focus plate at a coarser one.
 */

const CODE = /* wgsl */ `
@group(0) @binding(0) var src : texture_2d<f32>;
@group(0) @binding(1) var smp : sampler;
struct VO { @builtin(position) pos : vec4f, @location(0) uv : vec2f };
@vertex fn vs(@builtin(vertex_index) vi : u32) -> VO {
  let c = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  var o : VO;
  o.pos = vec4f(c * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(c.x, 1.0 - c.y);
  return o;
}
@fragment fn fs(i : VO) -> @location(0) vec4f { return textureSampleLevel(src, smp, i.uv, 0.0); }
`;

/** @param {number} w @param {number} h */
export const mipCount = (w, h) => 1 + Math.floor(Math.log2(Math.max(w, h, 1)));

/**
 * The mipper's pipeline, compiled off the main path (BOOT: every pipeline of the stage starts at once, early).
 * @param {GPUDevice} device @returns {Promise<{ layout: GPUBindGroupLayout, pipe: GPURenderPipeline }>}
 */
export async function mipKit(device) {
  const mod = device.createShaderModule({ label: "plates.mips", code: CODE });
  const layout = device.createBindGroupLayout({ label: "plates.mips", entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
  ] });
  const pipe = await device.createRenderPipelineAsync({
    label: "plates.mips", layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    vertex: { module: mod, entryPoint: "vs" },
    fragment: { module: mod, entryPoint: "fs", targets: [{ format: "rgba8unorm" }] },
    primitive: { topology: "triangle-list" },
  });
  return { layout, pipe };
}

/** @param {GPUDevice} device @param {{ layout: GPUBindGroupLayout, pipe: GPURenderPipeline }} kit (mipKit) */
export function createMipper(device, kit) {
  const { layout, pipe } = kit;
  const smp = device.createSampler({ minFilter: "linear", magFilter: "linear" });
  return {
    /** @param {GPUTexture} tex @param {number} [layer] */
    generate(tex, layer = 0) {
      const enc = device.createCommandEncoder({ label: "plates.mips" });
      const dim = /** @type {GPUTextureViewDimension} */ ("2d");
      for (let l = 1; l < tex.mipLevelCount; l++) {
        const src = tex.createView({ dimension: dim, baseMipLevel: l - 1, mipLevelCount: 1, baseArrayLayer: layer, arrayLayerCount: 1 });
        const dst = tex.createView({ dimension: dim, baseMipLevel: l, mipLevelCount: 1, baseArrayLayer: layer, arrayLayerCount: 1 });
        const group = device.createBindGroup({ layout, entries: [{ binding: 0, resource: src }, { binding: 1, resource: smp }] });
        const rp = enc.beginRenderPass({ colorAttachments: [{ view: dst, loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 0 } }] });
        rp.setPipeline(pipe); rp.setBindGroup(0, group); rp.draw(3); rp.end();
      }
      device.queue.submit([enc.finish()]);
    },
  };
}

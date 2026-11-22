// @ts-check
/**
 * resolve.wgsl.js — (wave 9, J1 LIGHT) THE CANVAS WRITTEN VALID. The stage draws its frame as it always has, but into a
 * texture of the canvas's own format and size (stage.js frameTex): its light added at alpha 0 (the swarm at night, the
 * cosmos and its threads, the haze, the chips, the orrery, the rays, a splat's glow), the glass and the dawn's ink with
 * their own alpha. One full-screen pass then writes that frame to the canvas with every pixel a valid premultiplied
 * colour: alpha at least the brightest channel wherever the colour is in 0..1. On the float16 HDR canvas a colour above 1
 * keeps alpha 1 and stays above it: an HDR highlight, never clamped.
 *
 * Why. Light written at alpha 0 is colour above its alpha: out of gamut for a premultiplied canvas, and the WebGPU spec
 * leaves what the screen shows then undefined ("Displayed to the screen: Compositing results are undefined",
 * GPUCanvasAlphaMode). Chrome adds it to the page, the look the stage was tuned on; Safari's compositor drops it (WebKit
 * bug 278926): on Alberto's iPhone, 22 November, only the plates were drawn, no name of light, no cosmos, no chips.
 *
 * How the look stays. The page composites the canvas as  out = rgb + page x (1 - a). Light at alpha 0 gave rgb + page.
 * Raising the alpha alone would hide the page under the light by a' (the night ground under a bright cobalt core: up to
 * 20 steps of its blue gone), so the colour takes back what the alpha hides of the GROUND the stage knows is there, G
 * (the night, or the dawn's paper inside a dawn rectangle):
 *     rgb' = rgb + G x (a' - a),    a' = max(a, max over the channels of (rgb - G x a) / (1 - G)), at most 1,
 * the least alpha that keeps rgb' at or under it. Over the ground the page shows exactly what it showed, rgb + G x (1 - a);
 * a pixel that was already valid (glass, ink, nothing at all) comes out as it went in, bit for bit, so the dawn's paper
 * stays its own colour. Over what is not the ground (type the light passes over, a picture of the page) the light now
 * hides a' of it, as any light with real alpha does; the keep-outs keep the light off the text, a few hundredths at most.
 * On the 8-bit canvas a' is rounded UP to a whole step and rgb' to the nearest: the write keeps every pixel valid.
 *
 * Two entries: fsResolve (the frame alone) and fsResolveGlow (the frame and the bloom's glow: the bloom's composite,
 * wgsl/bloom.wgsl.js fsComposite, done here in the same pass, so a frame with the glow still takes one full-screen pass
 * after the frame, as it did). Starts after frameWGSL + noiseWGSL. Group 1: binding 0 the frame (read texel for texel);
 * for the glow 1 the bloom's first level, 2 its linear sampler, 3 the bloom's uniform (its strength is read).
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

/** @param {boolean} eightBit the canvas is an 8-bit format (not rgba16float): the resolve writes whole steps */
export const resolveWGSL = (eightBit) => /* wgsl */ `
// ---------------------------------------------------------------- the resolve (wave 9, J1 LIGHT)
@group(1) @binding(0) var rFrame : texture_2d<f32>;
@group(1) @binding(1) var rGlow : texture_2d<f32>;
@group(1) @binding(2) var rSmp : sampler;
struct ResolveBloom { a : vec4f, b : vec4f };   // the bloom's uniform (bloom.wgsl.js Bloom): a.z its strength
@group(1) @binding(3) var<uniform> rB : ResolveBloom;

const R8 : bool = ${eightBit ? "true" : "false"};

struct RO { @builtin(position) pos : vec4f, @location(0) uv : vec2f };

@vertex fn vsResolve(@builtin(vertex_index) vi : u32) -> RO {
  let x = f32((vi << 1u) & 2u);
  let y = f32(vi & 2u);
  var o : RO;
  o.pos = vec4f(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
  o.uv = vec2f(x, y);
  return o;
}

// one pixel of the frame as drawn (premultiplied, encoded; light added at alpha 0) -> the same pixel valid premultiplied,
// composited by the page exactly as before wherever the page under it is the ground (the header above)
fn stageValid(c : vec4f, frag : vec2f) -> vec4f {
  let G = mix(frame.nightS.rgb, frame.paperS.rgb, stageDawnAt(frag / frame.backing.zw, 1.0 / frame.backing.z));
  let a = clamp(c.a, 0.0, 1.0);
  let rgb = max(c.rgb, vec3f(0.0));
  let need = (rgb - G * a) / max(vec3f(1.0) - G, vec3f(1.0 / 255.0));
  var a2 = min(1.0, max(a, max(need.r, max(need.g, need.b))));
  // 8 bit: the alpha a whole step UP (a pixel already valid keeps its own step: the margin takes the float's error)
  if (R8) { a2 = min(1.0, ceil(a2 * 255.0 - 0.001) / 255.0); }
  var o = rgb + G * (a2 - a);
  if (R8) { o = round(o * 255.0) / 255.0; }
  // in range the colour never passes the alpha (a guard on the rounding); at alpha 1 it may (HDR: never clamped)
  if (a2 < 1.0) { o = min(o, vec3f(a2)); }
  return vec4f(o, a2);
}

@fragment fn fsResolve(i : RO) -> @location(0) vec4f {
  return stageValid(textureLoad(rFrame, vec2i(i.pos.xy), 0), i.pos.xy);
}

// the bloom's tent (bloom.wgsl.js tent) on its first level
fn resolveTent(uv : vec2f) -> vec3f {
  let hp = 0.5 / vec2f(textureDimensions(rGlow));
  var s = textureSampleLevel(rGlow, rSmp, uv + vec2f(-hp.x * 2.0, 0.0), 0.0).rgb;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(hp.x * 2.0, 0.0), 0.0).rgb;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(0.0, -hp.y * 2.0), 0.0).rgb;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(0.0, hp.y * 2.0), 0.0).rgb;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(-hp.x, -hp.y), 0.0).rgb * 2.0;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(hp.x, -hp.y), 0.0).rgb * 2.0;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(-hp.x, hp.y), 0.0).rgb * 2.0;
  s = s + textureSampleLevel(rGlow, rSmp, uv + vec2f(hp.x, hp.y), 0.0).rgb * 2.0;
  return s / 12.0;
}

// the glow added as the bloom's composite added it (its strength, the dawn masked, the far tail cut, an exact 8-bit step
// with the same per-pixel dither: the dawn's paper gets 0, never a lifted grey), then the frame resolved
@fragment fn fsResolveGlow(i : RO) -> @location(0) vec4f {
  let c = textureLoad(rFrame, vec2i(i.pos.xy), 0);
  let night = 1.0 - stageDawnAt(i.uv * frame.view.xy, 1.0 / frame.backing.z);
  var g = resolveTent(i.uv) * rB.a.z * night;
  g = max(g - vec3f(0.6 / 255.0), vec3f(0.0));
  let h = hash3u(vec3u(vec2u(i.pos.xy), u32(frame.clock.w) & 255u)).x;
  g = floor(g * 255.0 + vec3f(h)) / 255.0;
  return stageValid(vec4f(c.rgb + g, c.a), i.pos.xy);
}
`;

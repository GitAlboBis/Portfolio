// @ts-check
/**
 * bloom.wgsl.js — light that glows (round 10, lane ENGINE): the bright cores of the stage's own canvas bleed softly into
 * the dark. Four kinds of full-screen pass, all reading the StageFrame (frame.wgsl.js) at group 0:
 *
 *   prefilter  the canvas (premultiplied, sRGB-encoded bytes, as drawn) -> level 1 at a half (tier A) or a quarter
 *              (tiers B, C) of the backing size: four bilinear taps that cover the block (a point smaller than a pixel
 *              is never missed, so the glow does not flicker), a soft-knee threshold on the brightest channel, the
 *              dawn rectangles masked out (the dawn never glows), and pixels of glass weighed by `plates` (alpha 1:
 *              a capture inside a plate glows less than light does).
 *   down       level i -> level i + 1: the dual filter's five taps.
 *   up         level i + 1 -> level i, added (blend one + one): the dual filter's eight-tap tent.
 *   composite  level 1 -> the canvas, added to its colour only (alpha untouched): where nothing glows the canvas stays
 *              exactly as transparent as it was drawn. A tail under 0.6 / 255 is cut and the rest is dithered to an
 *              exact 8-bit step, so a far pixel gets 0, never a lifted grey.
 *
 * Group 1: binding 0 the source texture, 1 a linear sampler, 2 the bloom uniform (BLOOM below).
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

/** The bloom uniform, 2 x vec4f: threshold, knee, strength, plates | source px per output px (prefilter), _, _, _ */
export const BLOOM_SIZE = 32;

export const bloomWGSL = /* wgsl */ `
// ---------------------------------------------------------------- bloom
struct Bloom {
  a : vec4f,   // threshold (0..1, brightest channel), knee, strength, weight of glass pixels
  b : vec4f,   // _, _, _, _
};
@group(1) @binding(0) var bsrc : texture_2d<f32>;
@group(1) @binding(1) var bsmp : sampler;
@group(1) @binding(2) var<uniform> BL : Bloom;

struct BO { @builtin(position) pos : vec4f, @location(0) uv : vec2f };

@vertex fn vsFull(@builtin(vertex_index) vi : u32) -> BO {
  let x = f32((vi << 1u) & 2u);
  let y = f32(vi & 2u);
  var o : BO;
  o.pos = vec4f(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
  o.uv = vec2f(x, y);
  return o;
}

fn bright(c : vec4f) -> vec3f {
  let b = max(c.r, max(c.g, c.b));
  let t = BL.a.x;
  let kn = max(BL.a.y, 1e-4);
  let s = clamp(b - t + kn, 0.0, 2.0 * kn);
  let w = max(s * s / (4.0 * kn), b - t) / max(b, 1e-4);
  // glass (alpha) glows by BL.a.w; light (alpha 0: added over the page) in full; and the Karis weight keeps a lone
  // bright point from flickering as it crosses the taps
  let g = mix(1.0, BL.a.w, clamp(c.a, 0.0, 1.0));
  return c.rgb * max(w, 0.0) * g / (1.0 + b);
}

@fragment fn fsPrefilter(i : BO) -> @location(0) vec4f {
  let ts = 1.0 / vec2f(textureDimensions(bsrc));
  var acc = vec3f(0.0);
  var wsum = 0.0;
  for (var k = 0u; k < 4u; k++) {
    let o = vec2f(select(-1.0, 1.0, (k & 1u) == 1u), select(-1.0, 1.0, (k & 2u) == 2u));
    let uv = i.uv + o * ts;
    // (lane m-glass) read under paper white: on an HDR canvas the light above it is the core's own, the glow stays today's
    let c = min(textureSampleLevel(bsrc, bsmp, uv, 0.0), vec4f(1.0));
    // the dawn never glows: the dawn rectangles are in viewport css px
    let night = 1.0 - stageDawnAt(uv * frame.view.xy, 2.0);
    acc = acc + bright(c) * night;
    wsum = wsum + 1.0;
  }
  return vec4f(acc / wsum, 1.0);
}

@fragment fn fsDown(i : BO) -> @location(0) vec4f {
  let hp = 0.5 / vec2f(textureDimensions(bsrc));
  var s = textureSampleLevel(bsrc, bsmp, i.uv, 0.0).rgb * 4.0;
  s = s + textureSampleLevel(bsrc, bsmp, i.uv + vec2f(-hp.x, -hp.y), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, i.uv + vec2f(hp.x, -hp.y), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, i.uv + vec2f(-hp.x, hp.y), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, i.uv + vec2f(hp.x, hp.y), 0.0).rgb;
  return vec4f(s / 8.0, 1.0);
}

fn tent(uv : vec2f) -> vec3f {
  let hp = 0.5 / vec2f(textureDimensions(bsrc));
  var s = textureSampleLevel(bsrc, bsmp, uv + vec2f(-hp.x * 2.0, 0.0), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(hp.x * 2.0, 0.0), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(0.0, -hp.y * 2.0), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(0.0, hp.y * 2.0), 0.0).rgb;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(-hp.x, -hp.y), 0.0).rgb * 2.0;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(hp.x, -hp.y), 0.0).rgb * 2.0;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(-hp.x, hp.y), 0.0).rgb * 2.0;
  s = s + textureSampleLevel(bsrc, bsmp, uv + vec2f(hp.x, hp.y), 0.0).rgb * 2.0;
  return s / 12.0;
}

@fragment fn fsUp(i : BO) -> @location(0) vec4f {
  return vec4f(tent(i.uv), 1.0);
}

@fragment fn fsComposite(i : BO) -> @location(0) vec4f {
  let night = 1.0 - stageDawnAt(i.uv * frame.view.xy, 1.0 / frame.backing.z);
  var g = tent(i.uv) * BL.a.z * night;
  // cut the far tail, then an exact 8-bit step with a per-pixel dither: 0 stays 0
  g = max(g - vec3f(0.6 / 255.0), vec3f(0.0));
  let h = hash3u(vec3u(vec2u(i.pos.xy), u32(frame.clock.w) & 255u)).x;
  g = floor(g * 255.0 + vec3f(h)) / 255.0;
  if (max(g.r, max(g.g, g.b)) <= 0.0) { discard; }
  return vec4f(g, 0.0);
}
`;

// @ts-check
/**
 * draw.wgsl.js — the one draw of the stage (spec 3.2, 3.4): instanced soft discs in perspective.
 *
 * Each particle is a gaussian disc of optical depth (its ink) placed by the camera, widened by the
 * depth of field and stretched along its screen velocity by a short shutter. Widening and stretching
 * conserve the disc's energy: the peak falls as the area grows, so a disc far from the page is a
 * large faint veil and never a brighter blot. Discs whose area would cost too many fragments are
 * thinned stochastically with a stable per-particle hash and the survivors carry the energy of the
 * others, which keeps the fill rate bounded without changing the tone.
 *
 * One blend for both worlds (premultiplied "over": one, one-minus-src-alpha):
 *  - dawn  (inside a dawn rectangle): ink, rgb = colour * a, alpha = a, a = 1 - exp(-tau)
 *  - night (everywhere else): light, rgb = colour * e, alpha = e * night alpha (0 = pure addition)
 * The dawn rectangles and the keep-outs are evaluated per fragment, so a disc that straddles the
 * DOM edge is cut exactly on it. Colours are the tokens' sRGB-encoded values: the canvas format is not -srgb
 * and the page composites in encoded space, so ink here mixes exactly like a CSS layer would.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

export const drawWGSL = /* wgsl */ `
// ---------------------------------------------------------------- draw
struct Particle {
  p : vec4f,
  v : vec4f,
};

@group(1) @binding(0) var<storage, read> parts : array<Particle>;
// the depth window of this draw. a = (lo, hi, mode, plates). mode 0: the VIEW z window [lo, hi): everything
// without a plate on screen; behind the frontmost plate (the light they bend) or in front of it (the orbiting
// camera's two passes). mode 1 / 2 (the free camera, a deep world): per plate. A point whose screen position is
// inside no plate's screen rectangle, or that is behind every plate covering it, goes to pass A (mode 1: bent by
// the plates, blitted elsewhere); every other point to pass B (mode 2: drawn over the plates), so a near point is
// never hidden by a far plate. quad: the plates' screen rectangles (viewport css px), pl: their mid planes in view
// space, the normal toward the eye (a point p is in front when dot(pl.xyz, p) >= pl.w; a turned plate's own depth,
// not its centre's, so a letter in front of a plate's near edge is never cut by it).
struct ZWin {
  a    : vec4f,
  quad : array<vec4f, 12>,
  pl   : array<vec4f, 12>,
};
@group(1) @binding(1) var<uniform> zwin : ZWin;

fn behindAll(sc : vec2f, p : vec3f) -> bool {
  let n = u32(zwin.a.w);
  for (var i = 0u; i < n; i++) {
    let q = zwin.quad[i];
    let pl = zwin.pl[i];
    if (sc.x >= q.x && sc.x <= q.z && sc.y >= q.y && sc.y <= q.w && dot(pl.xyz, p) >= pl.w) { return false; }
  }
  return true;
}

struct VOut {
  @builtin(position) pos : vec4f,
  @location(0) q : vec2f,                        // css px in the disc frame: x along the streak, y across
  @location(1) @interpolate(flat) prm : vec4f,   // half length, sigma (css px), peak optical depth, focus 0..1
  @location(2) @interpolate(flat) iid : u32,     // the instance, for the stochastic rounding
};

const SPAN : f32 = 2.6;   // the quad reaches SPAN sigma past the segment

fn corner(vi : u32) -> vec2f {
  // two triangles: (0,1,2) (2,1,3) over the corners (-1,-1) (1,-1) (-1,1) (1,1)
  let k = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u)[vi];
  return vec2f(f32(k & 1u) * 2.0 - 1.0, f32(k >> 1u) * 2.0 - 1.0);
}

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  var o : VOut;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);   // outside the clip volume: dropped
  o.q = vec2f(0.0);
  o.prm = vec4f(0.0);
  o.iid = ii;
  if (ii >= frame.count.y) { return o; }
  let P = parts[ii];
  // the camera first: depth of field, the depth window and the cull work in view space
  let pv = stageView(P.p.xyz);
  let mode = u32(zwin.a.z);
  if (mode == 0u && (pv.z < zwin.a.x || pv.z >= zwin.a.y)) { return o; }
  // the lens and the fog: a point nearer than the near distance or past the fog's end fades out (stageFade)
  let fade = stageFade(pv);
  if (fade <= 0.0) { return o; }
  let ink = P.p.w * frame.wind.z * fade;
  if (ink < 2e-4) { return o; }

  let sc = stageScreenV(pv);
  if (mode != 0u && (behindAll(sc.xy, pv) != (mode == 1u))) { return o; }
  let s = sc.z;
  let dpr = frame.backing.z;
  // the disc as asked, then the floor that keeps it from aliasing, then the depth of field
  let rq = max(P.v.w * s, 0.05);
  let r0 = max(rq, 0.62 / dpr);
  let coc = frame.cam.w * abs(pv.z - frame.depth.z) * s;
  let sg = min(sqrt(r0 * r0 + coc * coc), frame.depth.w);
  var peak = ink * (rq * rq) / (sg * sg);
  // no large soft discs floating in front of things: past camO.w css px of blur a disc fades out (free camera)
  if (frame.camO.w > 0.0) {
    peak *= 1.0 - smoothstep(frame.camO.w * 0.55, frame.camO.w, sg);
    if (peak <= 0.0) { return o; }
  }

  // the shutter: a streak along the screen velocity (turned by the camera), energy kept
  let vv = vec3f(dot(frame.camX.xyz, P.v.xyz), dot(frame.camY.xyz, P.v.xyz), 0.0);
  let vsc = vv.xy * s;
  let spd = length(vsc);
  let L = min(spd * frame.lookDay.z, 26.0 + 2.0 * sg) * 0.5;
  let dir = select(vec2f(1.0, 0.0), vsc / max(spd, 1e-4), spd > 1e-3);
  peak *= sg / (sg + 0.798 * L);

  // bounded fill: thin the large discs stochastically, the survivors carry the energy
  let ext = vec2f(L + SPAN * sg, SPAN * sg);
  let area = 4.0 * ext.x * ext.y * dpr * dpr;
  let budget = 900.0;
  if (area > budget) {
    let keep = budget / area;
    let h = hash3u(vec3u(ii, 0x5bd1u, 0x2f6bu)).x;
    if (h >= keep) { return o; }
    peak /= keep;
  }

  let c = corner(vi) * ext;
  let side = vec2f(-dir.y, dir.x);
  let css = sc.xy + dir * c.x + side * c.y;
  o.pos = stageClip(css);
  o.q = c;
  // focus: how sharp this disc is; a sharp thread is deeper ink by day and whiter light by night,
  // a defocused veil stays pure cobalt in both worlds
  let focus = r0 * r0 / (sg * sg);
  o.prm = vec4f(L, sg, peak, focus);
  return o;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4f {
  let L = in.prm.x;
  let sg = in.prm.y;
  let x = max(abs(in.q.x) - L, 0.0);
  let d2 = (x * x + in.q.y * in.q.y) / (sg * sg);
  if (d2 > SPAN * SPAN) { discard; }
  let g = exp(-0.5 * d2);
  var tau = in.prm.z * g * stageKeep(in.pos.xy);
  if (tau < 1.0 / 65536.0) { discard; }

  let nightK = stageNight(in.pos.xy);
  let core = in.prm.w * g;

  // day: cobalt ink; a sharp thread deepens toward navy
  let a = 1.0 - exp(-tau * frame.lookDay.x);
  let deep = frame.accentS.rgb * 0.6;
  let inkCol = mix(frame.accentS.rgb, deep, clamp(core * 0.8, 0.0, 1.0));
  let day = vec4f(inkCol * a, a);

  // night: the same particle as light. Every disc carries a little paper-white in its cobalt, more
  // when it is sharp, so the sum of many goes to white before any one channel clips into neon
  let e = tau * frame.lookNight.x;
  let w = clamp(frame.lookNight.z + frame.lookNight.y * core, 0.0, 1.0);
  let lightCol = mix(frame.accentS.rgb, frame.paperS.rgb, w);
  let night = vec4f(lightCol * e, min(e, 1.0) * frame.band.y);

  var out = mix(day, night, nightK);
  // stochastic rounding to the 8-bit target, one hash per pixel and disc shared by the four
  // channels: every value written is already an exact step (no rounding left to the hardware, whose
  // float-to-unorm conversion may round 0.49 up), its expectation is the true value, so a thousand
  // faint discs add up to the veil they make together and keep its hue; a shared hash keeps rgb <= a
  let hv = hash3u(vec3u(vec2u(in.pos.xy), in.iid)).x;
  let q = floor(out * 255.0 + vec4f(hv)) / 255.0;
  out = mix(out, q, frame.lookDay.w);
  if (max(out.a, max(out.r, max(out.g, out.b))) <= 0.0) { discard; }
  return out;
}
`;

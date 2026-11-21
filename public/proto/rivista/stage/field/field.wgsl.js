// @ts-check
/**
 * field.wgsl.js — THE FIELD's draws (lane FIELD, round 11; wave 7, lane COSMOS): the cosmos behind the room, the
 * shafts' haze and the chips of cut glass. Starts after frameWGSL + noiseWGSL (the stage's space, camera, fade, keep-outs,
 * night and hashes); group 1 is the field's own (the uniform below, the shape atlas, its sampler, the depth window the
 * swarm uses: ZWin of draw.wgsl.js, mirrored here, and the cosmos's points: cosmos/web.js).
 *
 * Every position and direction in the uniform is in VIEW space (field.js turns the scene's free-camera space into it
 * each frame with the stage's camera), so the shaders never invert the camera. Light is added (premultiplied colour,
 * alpha 0), as the swarm's light is: nothing here darkens or lifts the night ground toward grey; inside a dawn
 * rectangle nothing is drawn (stageNight), nor over DOM text (stageKeep, or the softer wallKeep).
 *
 * (wave 7, COSMOS) THE BACK WALL IS GONE: its ruled grid in relief (Ben Golus's pristine grid, the cells' tilt and
 * parallax under a blade) read as a wall of graph paper behind every page (Alberto, 20 November: «non mi piace lo sfondo
 * a griglia»). In its place the room opens onto THE NEURAL COSMOS (cosmos/web.js): the cosmic web as points of light in
 * the engine's own language (the swarm's energy-kept gaussian discs, the stage's depth of field at a small factor, its
 * stochastic rounding to the 8-bit canvas), in a periodic box wrapped about a window ahead of the eye, so the eye's
 * travel through the room is travel through it (parallax). Only what lies behind the room's back plane is drawn (the
 * room keeps its depth: plates, chips and figures stand in front of the night).
 *
 * The technique of the chips ("a parallax + normal map trick from game VFX"): a chip is one flat quad standing in 3D,
 * cut by a signed distance from the atlas; its cut edge is a bevel whose normal follows the distance's gradient (the
 * normal map), so a chip flashes its whole face when its own normal meets the half vector of a light and the eye, and
 * its edge glints at other angles. The lights no longer fall on a wall: they are the key lights the glass catches.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */
import { LMAX, SMAX } from "../cosmos/web.js";

/** Slots (vec4) of the field's uniform; field.js packs them. */
export const FU = Object.freeze({
  head: 0,      // time (s, simulated), lights in use, chips drawn, chips presence 0..1
  head2: 1,     // wall presence, any haze, atlas cells, haze's fade before the wall (px; 0 none)
  light: 2,     // 4 x 5 slots: origin.xyz radius | dir.xyz tanSpread | colour.rgb (encoded x strength) soft | length haze wallK chipK
                //              | the section's width axis (VIEW, unit, normal to dir) and aspect (0: a round section)
  boxC: 22,     // the chips' box centre (WORLD: document px, z), edge fade (fraction of the box)
  boxS: 23,     // the box's size w h d, seed
  wind: 24,     // wind xyz (px / s), spin (rad / s)
  size: 25,     // size min, max (css px at the box's centre plane), body, edge
  look: 26,     // specular, shininess, transmit, bevel (cell px)
  shape: 27,    // 4 x (atlas cell + size scale / 10, weight, depth centre 0..1, depth width; width 0 = everywhere)
  shapes: 31,   // shapes in use, blur cap (css px; 0 = the camera's bokeh), near size cap (css px), (wave 7) the size
                // floor (css px on screen: a smaller chip fades out; 0 = none)
  // (wave 7, COSMOS) the cosmos, where the wall's six slots were
  cosP: 32,     // the wrap window's centre (VIEW: straight ahead of the eye), presence 0..1
  cosU: 33,     // the same centre in the box (its fraction), the box's side (px)
  cosN: 34,     // the room's back plane (VIEW): its normal toward the reader, its offset (only what lies behind it draws)
  cosL: 35,     // gain, white (the thin light's share of paper), D0 (px: the lens-1 eye distance), fog end (px from the eye)
  cosE: 36,     // galaxies drawn, stars drawn, sparks drawn, the first star's index
  cosK: 37,     // near gone, near full (px from the eye), depth of field factor (x the stage's aperture), the stars' gain
  extra: 38,    // (round 12) chips' rim (cut edge toward paper 0..1), clear depth (VIEW z; a chip nearer than it inside
                // the clear rect is not drawn), clear on (0/1), _
  clear: 39,    // the clear rect (viewport css px): x0, y0, x1, y1
  wallK: 40,    // (wave 1, FIX3D) the light round the keep-outs: floor inside (0..1), fall (css px; 0 = the stage's
                // keep-out, a cut), haze floor, _ (wave 7: the cosmos's dim round the text)
  pulse: 41,    // (wave 7) 2 x 4 slots, an impulse along a filament: [head 0..1, amplitude, filament, direction +1 | -1],
                // its curve in VIEW space: [p0, _], [control, _], [p2, _]
  flash: 49,    // the nodes an impulse reached: node, amplitude, node, amplitude
  cosR: 50,     // (run 3) the filaments' light: core gain, halo gain, core width, halo width (x the gas's sigma)
  cosC: 51,     // (run 3) a galaxy's ceiling, a node core's ceiling, a node core's reach (0..1 of its radius), its size
});
export const FIELD_SIZE = 52 * 16;
/** sparks drawn along one impulse (its head and its trail) */
export const SPARKS = 16;
/** the atlas: CELLS cells of CELL px in one row; SPREAD px of distance on either side of an edge */
export const CELL = 128, CELLS = 4, SPREAD = 12;

export const fieldWGSL = /* wgsl */ `
// ---------------------------------------------------------------- the field
struct FieldU { v : array<vec4f, 52> };
@group(1) @binding(0) var<uniform> fu : FieldU;
@group(1) @binding(1) var atlas : texture_2d<f32>;
@group(1) @binding(2) var atlasS : sampler;
struct ZWin { a : vec4f, quad : array<vec4f, 12>, pl : array<vec4f, 12> };
@group(1) @binding(3) var<uniform> zwin : ZWin;

const CELLF : f32 = ${CELL}.0;
const NSPARK : u32 = ${SPARKS}u;
const LUM_L2 : f32 = ${Math.log2(LMAX).toFixed(6)};
const STAR_L2 : f32 = ${Math.log2(SMAX).toFixed(6)};
const NCELL : f32 = ${CELLS}.0;
const SPREADF : f32 = ${SPREAD}.0;

fn behindAll(sc : vec2f, p : vec3f) -> bool {
  let n = u32(zwin.a.w);
  for (var i = 0u; i < n; i++) {
    let q = zwin.quad[i];
    if (sc.x >= q.x && sc.x <= q.z && sc.y >= q.y && sc.y <= q.w && dot(zwin.pl[i].xyz, p) >= zwin.pl[i].w) { return false; }
  }
  return true;
}

// the eye in VIEW space (stageScreenV's eye: the viewport's centre plus the damped offset, D in front)
fn fieldEye() -> vec3f {
  return vec3f(frame.view.zw + frame.view.xy * 0.5 + frame.cam.yz, frame.cam.x);
}

// the distance of an offset (normal to the axis d) from the axis, measured so that the shaft's section is a blade
// with straight sides (a superellipse, half height r, half width r x aspect: the light of a tall window, never a round
// spot), or a circle when the aspect is 0
fn section(i : u32, off : vec3f, d : vec3f, r : f32) -> f32 {
  let a = fu.v[6u + i * 5u];
  if (a.w <= 0.0) { return length(off); }
  let x = abs(dot(off, a.xyz)) / a.w;
  let y = abs(dot(off, cross(d, a.xyz)));
  let x2 = x * x; let y2 = y * y;
  let n = x2 * x2 * x2 + y2 * y2 * y2;
  return pow(n, 1.0 / 6.0);
}

// how much of light i reaches the VIEW point p: a straight shaft from its origin along its direction, its radius
// growing with the spread, a soft edge, a short rise after the origin and a fall before its length
fn shaft(i : u32, p : vec3f) -> f32 {
  let o = fu.v[2u + i * 5u];
  let d = fu.v[3u + i * 5u];
  let c = fu.v[4u + i * 5u];
  let x = fu.v[5u + i * 5u];
  let t = dot(p - o.xyz, d.xyz);
  let r = max(o.w + max(t, 0.0) * d.w, 1.0);
  let rho = section(i, p - o.xyz - d.xyz * t, d.xyz, r);
  let edge = 1.0 - smoothstep(r * (1.0 - c.w), r, rho);
  let along = smoothstep(0.0, r * 0.6, t) * (1.0 - smoothstep(x.x * 0.75, x.x, t));
  return edge * along;
}

fn atlasAt(cell : f32, uv : vec2f) -> vec4f {
  let u = clamp(uv, vec2f(0.5 / CELLF), vec2f(1.0 - 0.5 / CELLF));
  return textureSampleLevel(atlas, atlasS, vec2f((cell + u.x) / NCELL, u.y), 0.0);
}

// (wave 1, FIX3D) the room's answer to the keep-outs: with a fall set (wallK.y > 0) the light is DIMMED round the kept
// text, to its floor inside the rect over a long soft fall, never cut out (a lit wall with a hole the size of a block
// of text read as a black card); with no fall it is the stage's keep-out. floor: wallK.x for the cosmos (wave 7: the
// back wall it was written for is gone), wallK.z for the haze.
fn wallKeep(frag : vec2f, floor : f32) -> f32 {
  let k = fu.v[40u];
  if (k.y <= 0.0) { return stageKeep(frag); }
  let css = frag / frame.backing.zw;
  var m = 1.0;
  let n = frame.count.z;
  for (var i = 0u; i < n; i++) {
    let r = frame.keep[i];
    let q = max(max(r.xy - css, css - r.zw), vec2f(0.0));
    m = min(m, smoothstep(0.0, k.y, length(q)));
  }
  return mix(floor, 1.0, m);
}

// ---------------------------------------------------------------- one fullscreen triangle (the haze's)
struct WOut { @builtin(position) pos : vec4f };

@vertex
fn vsWall(@builtin(vertex_index) vi : u32) -> WOut {
  var o : WOut;
  let p = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  return o;
}

// ---------------------------------------------------------------- THE COSMOS (wave 7): instanced points of light
@group(1) @binding(4) var<storage, read> cosmos : array<vec4u>;

struct KOut {
  @builtin(position) pos : vec4f,
  @location(0) q : vec2f,                        // css px from the point's centre
  @location(1) @interpolate(flat) prm : vec4f,   // sigma (css px), peak, white (the paper's share), instance
};

const KSPAN : f32 = 2.6;   // the quad reaches KSPAN sigma

// (run 3) a quad as a strip of four vertices (the cosmos's pipelines are triangle strips)
fn corner4(vi : u32) -> vec2f {
  return vec2f(f32(vi & 1u) * 2.0 - 1.0, f32(vi >> 1u) * 2.0 - 1.0);
}

// a quadratic curve (a filament: its two nodes and its control point)
fn bez(a : vec3f, b : vec3f, c : vec3f, t : f32) -> vec3f {
  let s = 1.0 - t;
  return a * (s * s) + b * (2.0 * s * t) + c * (t * t);
}

// how much of a VIEW point the cosmos shows: ahead of the eye, past the near distance, before the fog's end, behind
// the room's back plane (the room keeps its depth)
fn cosmosSeen(pv : vec3f, eye : vec3f) -> f32 {
  let dv = pv - eye;
  let d = length(dv);
  if (dv.z > -0.2 * d) { return 0.0; }
  let K = fu.v[37u];
  let L = fu.v[35u];
  let N = fu.v[34u];
  let near = smoothstep(K.x, K.y, d);
  let fog = 1.0 - smoothstep(L.w * 0.58, L.w, d);
  let back = 1.0 - smoothstep(-0.3 * L.z, 0.0, dot(N.xyz, pv) - N.w);
  return near * fog * back;
}

@vertex
fn vsCosmos(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> KOut {
  var o : KOut;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);
  o.q = vec2f(0.0);
  o.prm = vec4f(0.0);
  let P = fu.v[32u];
  if (P.w <= 0.0) { return o; }
  let U = fu.v[33u];
  let L = fu.v[35u];
  let E = fu.v[36u];
  let K = fu.v[37u];
  let nG = u32(E.x);
  let nS = u32(E.y);
  let eye = fieldEye();
  var pv = vec3f(0.0);
  var e = 0.0;
  var white = L.y;
  var soft = 1.0;      // the point's sharp size against the device pixel (a spark a little larger)
  var dof = true;
  if (ii < nG) {
    // a galaxy: its place in the box, wrapped about the window ahead of the eye, turned and set by the camera
    let g = cosmos[ii];
    let rel = fract(bitcast<vec3f>(g.xyz) - U.xyz + 0.5) - 0.5;
    pv = P.xyz + U.w * vec3f(dot(frame.camX.xyz, rel), dot(frame.camY.xyz, rel), dot(frame.camZ.xyz, rel));
    let vis = cosmosSeen(pv, eye);
    if (vis <= 0.0) { return o; }
    let m = g.w;
    let kind = (m >> 8u) & 3u;
    let el = (m >> 10u) & 1023u;
    let t = f32(m >> 20u) / 4095.0;
    // its luminosity (a power law: few bright, many faint) over its distance, the inverse square softened (the far web
    // stays a texture, the near one never a glare); the voids' sparse field fainter
    let lum = exp2((f32(m & 255u) / 255.0 - 1.0) * LUM_L2);
    let d = length(pv - eye);
    let kk = select(select(0.62, 1.0, kind == 1u), 0.86, kind == 2u);
    e = L.x * pow(lum, 0.6) * pow(L.z / d, 1.2) * kk * vis;
    // (wave 7) THE IMPULSE: a filament's galaxies light up as the signal passes (a sharp front, a trail behind it), a
    // node's as it arrives; on the stage's clock, gone as the stage comes to rest (frame.clock.z, the activity)
    var boost = 0.0;
    if (kind == 2u) {
      for (var p = 0u; p < 2u; p++) {
        let A = fu.v[41u + p * 4u];
        if (A.y > 0.0 && el == u32(A.z + 0.5)) {
          let x = (t - A.x) * A.w;
          boost += A.y * select(exp(x / 0.08), exp(-x * x / 0.0008), x > 0.0);
        }
      }
    } else if (kind == 1u) {
      let F = fu.v[49u];
      if (F.y > 0.0 && el == u32(F.x + 0.5)) { boost += F.y * (1.0 - 0.7 * t); }
      if (F.w > 0.0 && el == u32(F.z + 0.5)) { boost += F.w * (1.0 - 0.7 * t); }
    }
    boost *= frame.clock.z;
    e *= 1.0 + 3.2 * boost;
    white = clamp(white + 0.7 * smoothstep(0.03, 0.26, e) + 0.6 * boost, 0.0, 1.0);
    // (run 3) a ceiling with a soft knee (the nearer stays the brighter): a galaxy stays a point of light; a node's core
    // (its brightest galaxies, the cusp of its members) may rise past the glow's threshold: the bloom gathers there only
    let C = fu.v[51u];
    let core = kind == 1u && t < C.z;
    let cap = select(C.x, C.y, core) + 0.4 * boost;
    e = cap * (1.0 - exp(-e / max(cap, 1e-3)));
    // (run 5) a bright galaxy's point a little larger (the wings of the eye's own spread): the few bright ones read as
    // stars among the dust, the many faint stay one device pixel
    if (core) { soft = C.w; } else { soft = 1.0 + 0.55 * smoothstep(0.5 * C.x, C.x, e); }
  } else if (ii < nG + nS) {
    // a star: a direction at infinity (no parallax: it turns with the camera only), many faint, a few bright
    let g = cosmos[u32(E.w) + ii - nG];
    let dir = bitcast<vec3f>(g.xyz);
    let dV = vec3f(dot(frame.camX.xyz, dir), dot(frame.camY.xyz, dir), dot(frame.camZ.xyz, dir));
    if (dV.z > -0.25) { return o; }
    pv = eye + dV * (48.0 * L.z);
    let lum = exp2((f32(g.w & 255u) / 255.0 - 1.0) * STAR_L2);
    e = K.w * pow(lum, 0.72) * P.w;
    white = clamp(0.2 + 0.8 * smoothstep(0.02, 0.2, e), 0.0, 1.0);
    dof = false;
  } else {
    // a spark of an impulse: its head and its trail on the filament's curve
    let j = ii - nG - nS;
    let p = j / NSPARK;
    let k = j % NSPARK;
    if (p >= 2u) { return o; }
    let A = fu.v[41u + p * 4u];
    if (A.y <= 0.0) { return o; }
    let tk = A.x - f32(k) * 0.0065 * A.w;
    if (tk < 0.0 || tk > 1.0) { return o; }
    pv = bez(fu.v[42u + p * 4u].xyz, fu.v[43u + p * 4u].xyz, fu.v[44u + p * 4u].xyz, tk);
    let vis = cosmosSeen(pv, eye);
    if (vis <= 0.0) { return o; }
    e = 0.42 * A.y * exp(-f32(k) / 4.5) * vis * frame.clock.z;
    white = 1.0;
    soft = 1.5;
  }
  if (e < 1.0 / 2048.0) { return o; }
  let sc = stageScreenV(pv);
  if (sc.z <= 0.0) { return o; }
  let dpr = frame.backing.z;
  let r0 = 0.55 * soft / dpr;
  var sg = r0 * 1.12;
  if (dof) {
    let coc = frame.cam.w * K.z * abs(pv.z - frame.depth.z) * sc.z;
    sg = min(sqrt(r0 * r0 + coc * coc), 2.4);
  }
  let peak = e * (r0 * r0) / (sg * sg);
  if (peak < 1.0 / 4096.0) { return o; }
  let c = corner4(vi) * (KSPAN * sg);
  o.pos = stageClip(sc.xy + c);
  o.q = c;
  o.prm = vec4f(sg, peak, white, f32(ii));
  return o;
}

// ---------------------------------------------------------------- THE FILAMENTS' OWN LIGHT (wave 7): the gas along each
// filament as a strip of light with a gaussian section (one strip a filament, RSEG pieces along its curve), clumped
// along its length, under its galaxies: the web reads as threads (axons) between the nodes, not as a spray of dots.
// Its surface brightness does not fall with distance (an extended source): a far filament is thinner, and the fog
// takes it into the night. Strips are drawn by area, never as a fullscreen pass.
@group(1) @binding(5) var<storage, read> ribs : array<vec4f>;

struct ROut {
  @builtin(position) pos : vec4f,
  @location(0) a : vec2f,                        // across (css px from the curve), along (t, 0..1 node to node)
  @location(1) @interpolate(flat) prm : vec4f,   // the core's peak, white, filament, the halo's peak
  @location(2) e : f32,                          // this end's presence (fog, near, the back plane), interpolated
  @location(3) @interpolate(flat) sg : vec2f,    // (run 3) the core's sigma, the halo's (css px)
};

const RSEG : u32 = 20u;
const RSPAN : f32 = 2.4;

// the camera's turn of a box vector
fn rotB(v : vec3f) -> vec3f {
  return vec3f(dot(frame.camX.xyz, v), dot(frame.camY.xyz, v), dot(frame.camZ.xyz, v));
}

// a smooth 1D value noise along a filament (two octaves): the gas gathers in clumps
fn clump(t : f32, f : f32) -> f32 {
  let x = t * 9.0 + f * 7.31;
  let i = floor(x); let u = fract(x); let w = u * u * (3.0 - 2.0 * u);
  let a = hash3u(vec3u(u32(i), u32(f), 0x51a7u)).x;
  let b = hash3u(vec3u(u32(i + 1.0), u32(f), 0x51a7u)).x;
  let y = t * 26.0 + f * 3.17;
  let j = floor(y); let v = fract(y); let q = v * v * (3.0 - 2.0 * v);
  let c = hash3u(vec3u(u32(j), u32(f), 0x7c15u)).x;
  let d = hash3u(vec3u(u32(j + 1.0), u32(f), 0x7c15u)).x;
  return clamp(0.25 + 0.75 * mix(a, b, w) + 0.35 * (mix(c, d, q) - 0.5), 0.12, 1.2);
}

// a smooth 1D value noise (x >= 0), one per filament and salt
fn vnoise1(x : f32, f : f32, salt : u32) -> f32 {
  let i = floor(x); let u = fract(x); let w = u * u * (3.0 - 2.0 * u);
  let a = hash3u(vec3u(u32(i), u32(f), salt)).x;
  let b = hash3u(vec3u(u32(i + 1.0), u32(f), salt)).x;
  return mix(a, b, w);
}

// (run 5) the thread's knots: groups of galaxies along it at irregular places, the product of three incommensurate
// scales of value noise, sharpened. Run 3's even beads (one noise at seventy a filament) read as a string of pearls, dew
// on a thread (water): here no two knots are alike or evenly spaced, and the galaxies about the thread carry the grain
fn knots(t : f32, f : f32) -> f32 {
  let a = vnoise1(t * 17.0 + f * 5.31, f, 0x2b9du);
  let b = vnoise1(t * 41.0 + f * 2.17, f, 0x3c4eu);
  let c = vnoise1(t * 97.0 + f * 7.73, f, 0x4d5fu);
  let n = a * (0.55 + 0.9 * b) * (0.7 + 0.6 * c);
  return 0.25 + 1.5 * n * n;
}

@vertex
fn vsRibbon(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> ROut {
  var o : ROut;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);
  o.a = vec2f(0.0);
  o.prm = vec4f(0.0);
  o.e = 0.0;
  o.sg = vec2f(1.0);
  let P = fu.v[32u];
  if (P.w <= 0.0) { return o; }
  let U = fu.v[33u];
  let L = fu.v[35u];
  let K = fu.v[37u];
  let f = ii / RSEG;
  let k = ii % RSEG;
  let A = ribs[f * 3u];
  let B = ribs[f * 3u + 1u];
  let C = ribs[f * 3u + 2u];
  // the filament moved by whole boxes to the window about the eye (as its galaxies are, by its middle)
  let mid = bez(A.xyz, B.xyz, C.xyz, 0.5);
  let sh = (fract(mid - U.xyz + 0.5) - 0.5) - (mid - U.xyz);
  let a = A.xyz - U.xyz + sh;
  let b = B.xyz - U.xyz + sh;
  let c = C.xyz - U.xyz + sh;
  let eye = fieldEye();
  // the piece's two ends: both must be ahead of the eye (a piece is drawn whole or not at all)
  let t0 = f32(k) / f32(RSEG);
  let t1 = f32(k + 1u) / f32(RSEG);
  let q0 = P.xyz + U.w * rotB(bez(a, b, c, t0));
  let q1 = P.xyz + U.w * rotB(bez(a, b, c, t1));
  let v0 = cosmosSeen(q0, eye);
  let v1 = cosmosSeen(q1, eye);
  if (v0 + v1 <= 0.0) { return o; }
  if (q0.z - eye.z > -0.2 * length(q0 - eye) || q1.z - eye.z > -0.2 * length(q1 - eye)) { return o; }
  let cr = corner4(vi);
  let end = cr.x > 0.0;
  let t = select(t0, t1, end);
  let pv = select(q0, q1, end);
  let sc = stageScreenV(pv);
  // the section on screen, at right angles to the curve's tangent there
  let tg = rotB(2.0 * ((1.0 - t) * (b - a) + t * (c - b)));
  let sc2 = stageScreenV(pv + normalize(tg) * 40.0);
  let dir = normalize(sc2.xy - sc.xy + vec2f(1e-5, 0.0));
  let side = vec2f(-dir.y, dir.x);
  let dpr = frame.backing.z;
  let R = fu.v[50u];
  // the gas's sigma (box) at this depth (css px), its depth of field, a floor of most of a device pixel (no crawl)
  let sig0 = B.w * U.w * sc.z;
  let coc = frame.cam.w * K.z * abs(pv.z - frame.depth.z) * sc.z;
  let sMin = 0.75 / dpr;
  // (run 3) TWO SECTIONS, NEVER A TUBE: a strip as wide as the gas read as a soft cable near the eye. Now a thin core
  // (the thread an axon draws: a couple of px at most) and a faint halo of the gas round it, each kept in energy as it
  // thins or blurs; the galaxies scattered about the thread resolve into points up close
  // (run 5) narrower ceilings (core 1.5, halo 3.4 css px, were 2.2 and 8): a near filament seen at 8 px of halo read
  // as a soft blue cable across the room; a thread stays a thread at every distance
  let c0 = max(R.z * sig0, sMin);
  let sC = clamp(sqrt(c0 * c0 + coc * coc), sMin, 1.5);
  let h0 = max(R.w * sig0, 1.6 * sC);
  let sH = clamp(sqrt(h0 * h0 + coc * coc), 1.6 * sC, 3.4);
  // its surface brightness: the filament's richness, the distance's gentle fall (an extended source)
  let rich = A.w;
  // (run 5) a steeper fall with distance (0.5, was 0.35): the far lace finer and fainter, the near threads ahead of it
  let fall = pow(max(L.z / length(pv - eye), 0.05), 0.5) * (0.35 + rich);
  let pkC = min(L.x * R.x * fall * min(1.0, c0 / sC), 0.2);
  let pkH = min(L.x * R.y * fall * min(1.0, h0 / sH), 0.04);
  let half = RSPAN * sH;
  o.pos = stageClip(sc.xy + side * (cr.y * half));
  o.a = vec2f(cr.y * half, t);
  o.prm = vec4f(pkC, L.y * 0.75, f32(f), pkH);
  o.sg = vec2f(sC, sH);
  o.e = select(v0, v1, end) * smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.93, 1.0, t));
  return o;
}

@fragment
fn fsRibbon(in : ROut) -> @location(0) vec4f {
  let x = in.a.x;
  let cl = clump(in.a.y, in.prm.z);
  let xc = x / in.sg.x;
  let xh = x / in.sg.y;
  var e = (in.prm.x * exp(-0.5 * xc * xc) * cl * knots(in.a.y, in.prm.z) + in.prm.w * exp(-0.5 * xh * xh) * (0.6 + 0.4 * cl)) * in.e;
  // the impulse runs along the thread itself: a sharp front, a trail behind it
  var white = in.prm.y;
  for (var p = 0u; p < 2u; p++) {
    let A = fu.v[41u + p * 4u];
    if (A.y > 0.0 && u32(in.prm.z + 0.5) == u32(A.z + 0.5)) {
      let s = (in.a.y - A.x) * A.w;
      let g = A.y * select(exp(s / 0.07), exp(-s * s / 0.0006), s > 0.0) * frame.clock.z;
      e *= 1.0 + 5.0 * g;
      white = min(1.0, white + 0.8 * g);
    }
  }
  let k = fu.v[40u];
  e *= wallKeep(in.pos.xy, k.x) * stageNight(in.pos.xy);
  if (e <= 1.0 / 4096.0) { discard; }
  let col = mix(frame.accentS.rgb, frame.paperS.rgb, white) * e;
  // the grain of one 8-bit step where there is light (frame.wgsl.js): no bands in the soft section
  return vec4f(stageGrainLight(col, in.pos.xy), 0.0);
}

@fragment
fn fsCosmos(in : KOut) -> @location(0) vec4f {
  let sg = in.prm.x;
  let d2 = dot(in.q, in.q) / (sg * sg);
  if (d2 > KSPAN * KSPAN) { discard; }
  let k = fu.v[40u];
  let e = in.prm.y * exp(-0.5 * d2) * wallKeep(in.pos.xy, k.x) * stageNight(in.pos.xy);
  let col = mix(frame.accentS.rgb, frame.paperS.rgb, in.prm.z) * e;
  // stochastic rounding to the 8-bit target (draw.wgsl.js): the faint web keeps its expectation and its hue
  let hv = hash3u(vec3u(vec2u(in.pos.xy), u32(in.prm.w))).x;
  let q = floor(col * 255.0 + vec3f(hv)) / 255.0;
  let out = mix(col, q, frame.lookDay.w);
  if (max(out.r, max(out.g, out.b)) <= 0.0) { discard; }
  return vec4f(out, 0.0);
}

// The haze: a shaft's own light in the air (haze > 0), the ray's closest approach to the shaft's axis. (wave 7) No wall
// stops it now: it ends at its own length (the aimed shaft ends in its prism). One fullscreen triangle.
@fragment
fn fsHaze(in : WOut) -> @location(0) vec4f {
  let css = in.pos.xy / frame.backing.zw;
  let E = fieldEye();
  let rd = normalize(vec3f(css + frame.view.zw, 0.0) - E);
  let tw = 1e9;
  var col = vec3f(0.0);
  let nl = u32(fu.v[0u].y);
  for (var i = 0u; i < nl; i++) {
    let o = fu.v[2u + i * 5u];
    let d = fu.v[3u + i * 5u];
    let c = fu.v[4u + i * 5u];
    let x = fu.v[5u + i * 5u];
    if (x.y <= 0.0) { continue; }
    let w0 = E - o.xyz;
    let b = dot(rd, d.xyz);
    let dd = dot(rd, w0);
    let e = dot(d.xyz, w0);
    let dn = max(1.0 - b * b, 1e-4);
    let s = (b * e - dd) / dn;
    let u = (e - b * dd) / dn;
    if (s <= 0.0 || s > tw || u <= 0.0) { continue; }
    let cp = E + rd * s;
    let r = max(o.w + u * d.w, 1.0);
    let dist = section(i, w0 + rd * s - d.xyz * u, d.xyz, r);
    // the shaft in the air has the same straight soft edge as on the wall (a blade of light, not a glowing cloud)
    let prof = 1.0 - smoothstep(r * (1.0 - c.w), r, dist);
    let along = smoothstep(0.0, r * 2.0, u) * (1.0 - smoothstep(x.x * 0.6, x.x, u));
    // seen from inside (or close to) the shaft the air would glow everywhere and lift the night to grey: the haze
    // is a thing seen from outside, it fades as the eye comes within two radii of the axis
    let te = dot(E - o.xyz, d.xyz);
    let re = max(o.w + max(te, 0.0) * d.w, 1.0);
    let inside = smoothstep(re * 1.5, re * 4.0, section(i, E - o.xyz - d.xyz * te, d.xyz, re)) * smoothstep(500.0, 1800.0, s);
    // (round 12) head2.w > 0: the haze thins over that many px before the wall (no hard edge where a shaft meets it)
    let hz = fu.v[1u].w;
    let soon = select(1.0, 1.0 - smoothstep(tw - hz, tw, s), hz > 0.0);
    col += c.rgb * x.y * prof * along * stageFade(cp) * inside * soon;
  }
  let mask = wallKeep(in.pos.xy, fu.v[40u].z) * stageNight(in.pos.xy);
  if (max(col.r, max(col.g, col.b)) * mask <= 1.0 / 1024.0) { discard; }
  return vec4f(stageGrainLight(col * mask, in.pos.xy), 0.0);
}

// ---------------------------------------------------------------- THE CHIPS: stateless, one instanced quad each
struct COut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
  @location(1) @interpolate(flat) a : vec4f,     // atlas cell, energy, blur (cell px), on-screen size (css px)
  @location(2) @interpolate(flat) c : vec4f,     // the chip's centre (VIEW), its tone weight
  @location(3) @interpolate(flat) n : vec4f,     // its normal (VIEW)
  @location(4) @interpolate(flat) t : vec4f,     // its in-plane axes (VIEW): along uv.x
  @location(5) @interpolate(flat) b : vec4f,     //                              along uv.y
  @location(6) @interpolate(flat) li : vec4f,    // the four lights at its centre
};

fn corner(vi : u32) -> vec2f {
  let k = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u)[vi];
  return vec2f(f32(k & 1u) * 2.0 - 1.0, f32(k >> 1u) * 2.0 - 1.0);
}

// v turned about the unit axis k by angle a (Rodrigues)
fn turn(v : vec3f, k : vec3f, a : f32) -> vec3f {
  let c = cos(a); let s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

@vertex
fn vsChip(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> COut {
  var o : COut;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);
  o.uv = vec2f(0.0);
  o.a = vec4f(0.0); o.c = vec4f(0.0); o.n = vec4f(0.0); o.t = vec4f(0.0); o.b = vec4f(0.0); o.li = vec4f(0.0);
  let head = fu.v[0u];
  if (f32(ii) >= head.z) { return o; }
  let C = fu.v[22u];
  let S = fu.v[23u];
  let W = fu.v[24u];
  let Z = fu.v[25u];
  let seed = u32(S.w);
  let h1 = hash3u(vec3u(ii, seed, 0x1f3du));
  let h2 = hash3u(vec3u(ii, seed, 0x2b71u));
  let h3 = hash3u(vec3u(ii, seed, 0x3c95u));
  // the place: a hash in the box, carried by the wind and wrapped, so the field never empties; a soft fade near the
  // box's faces so a chip that wraps is never seen to jump
  let sz = max(S.xyz, vec3f(1.0));
  let w = fract(h1 + W.xyz * head.x / sz) - 0.5;
  let ef = max(C.w, 1e-3);
  let ew = smoothstep(vec3f(0.0), vec3f(ef), 0.5 - abs(w));
  let edgeK = ew.x * ew.y * ew.z;
  let pw = C.xyz + w * sz;
  // the shape: the mix by depth (0 the back of the box, 1 its front)
  let fz = w.z + 0.5;
  let ns = u32(fu.v[31u].x);
  var tot = 0.0;
  for (var i = 0u; i < ns; i++) {
    let s = fu.v[27u + i];
    let bell = select(1.0, exp(-pow((fz - s.z) / max(s.w, 1e-3), 2.0)), s.w > 0.0);
    tot += s.y * bell;
  }
  var pick = h2.x * tot;
  var cell = fu.v[27u].x;
  for (var i = 0u; i < ns; i++) {
    let s = fu.v[27u + i];
    let bell = select(1.0, exp(-pow((fz - s.z) / max(s.w, 1e-3), 2.0)), s.w > 0.0);
    pick -= s.y * bell;
    if (pick <= 0.0) { cell = s.x; break; }
  }
  // the shape's cell and its size scale share one float: cell + scale / 10 (field.js)
  let shapeK = max(fract(cell) * 10.0, 0.1);
  cell = floor(cell);
  // its size (more small ones than large), its tumble about its own axis on the stage's clock
  let half = 0.5 * mix(Z.x, Z.y, h2.y * h2.y) * shapeK;
  let ax = normalize(h3 * 2.0 - 1.0 + vec3f(1e-3, 0.0, 0.0));
  let rate = W.w * (0.35 + 1.3 * h2.z) * select(-1.0, 1.0, h1.x > 0.5);
  let ang = h3.x * 6.2831853 + rate * head.x;
  let b0 = normalize(cross(ax, vec3f(0.31, 0.83, 0.46)));
  let b1 = cross(ax, b0);
  // a base frame not aligned to the axis (the face sweeps a cone, not a line), then the turn
  let tw0 = normalize(b0 * 0.8 + ax * 0.6);
  let tw1 = normalize(cross(tw0, b1));
  let T = turn(tw0, ax, ang);
  let B = turn(tw1, ax, ang);
  // view space: the camera's rows (the same as stageView)
  let pv = stageView(pw);
  let Tv = vec3f(dot(frame.camX.xyz, T), dot(frame.camY.xyz, T), dot(frame.camZ.xyz, T));
  let Bv = vec3f(dot(frame.camX.xyz, B), dot(frame.camY.xyz, B), dot(frame.camZ.xyz, B));
  let mode = u32(zwin.a.z);
  if (mode == 0u && (pv.z < zwin.a.x || pv.z >= zwin.a.y)) { return o; }
  let fade = stageFade(pv) * edgeK * head.w;
  if (fade <= 0.0) { return o; }
  let sc = stageScreenV(pv);
  if (mode != 0u && (behindAll(sc.xy, pv) != (mode == 1u))) { return o; }
  let s = sc.z;
  // (round 12) the clear rect: no chip in front of a thing the scene keeps clear (the cover's name)
  let ex = fu.v[38u];
  if (ex.z > 0.0 && pv.z > ex.y) {
    let cr = fu.v[39u];
    let hr = half * s;
    if (sc.x > cr.x - hr && sc.x < cr.z + hr && sc.y > cr.y - hr && sc.y < cr.w + hr) { return o; }
  }
  // the depth of field: blur (css px) as the swarm's; energy kept; a chip blurred past the cap fades out
  let coc = frame.cam.w * abs(pv.z - frame.depth.z) * s;
  let on = 2.0 * half * s;
  var energy = fade * (on * on) / ((on + 1.6 * coc) * (on + 1.6 * coc));
  let cap = select(frame.camO.w, fu.v[31u].y, fu.v[31u].y > 0.0);
  if (cap > 0.0) { energy *= 1.0 - smoothstep(cap * 0.55, cap, coc); }
  // a chip that grows huge near the lens fades before it can fill the screen
  let big = fu.v[31u].z;
  if (big > 0.0) { energy *= 1.0 - smoothstep(big * 0.6, big, on); }
  // (wave 7, COSMOS) and one seen smaller than the floor fades out (fu.v[31u].w, css px; 0 none): in the void a cut A or
  // a mark under about ten css px read as a speck or a small ring over the cosmos, confetti rather than glass
  let small = fu.v[31u].w;
  if (small > 0.0) { energy *= smoothstep(small * 0.6, small, on); }
  if (energy < 1e-3 || on < 0.35) { return o; }
  let nv = normalize(cross(Tv, Bv));
  // the lights at its centre
  var li = vec4f(0.0);
  let nl = u32(head.y);
  for (var i = 0u; i < nl; i++) { li[i] = shaft(i, pv) * fu.v[5u + i * 5u].w; }
  // the quad, grown by the blur
  let m = min(coc / max(on * 0.5, 0.1), 2.0);
  let c2 = corner(vi);
  let cw = pv + (Tv * c2.x + Bv * c2.y) * half * (1.0 + m);
  let sp = stageScreenV(cw);
  o.pos = stageClip(sp.xy);
  o.uv = c2 * (1.0 + m) * 0.5 + 0.5;
  o.a = vec4f(cell, energy, coc / max(on, 0.1) * CELLF, on);
  o.c = vec4f(pv, 0.0);
  o.n = vec4f(nv, 0.0);
  o.t = vec4f(Tv, 0.0);
  o.b = vec4f(Bv, 0.0);
  o.li = li;
  return o;
}

@fragment
fn fsChip(in : COut) -> @location(0) vec4f {
  let cell = in.a.x;
  let s0 = atlasAt(cell, in.uv);
  let du = 1.0 / CELLF;
  let sx = atlasAt(cell, in.uv + vec2f(du, 0.0)).r;
  let sy = atlasAt(cell, in.uv + vec2f(0.0, du)).r;
  // signed distance in cell px (negative inside), continued past the cell's border
  let outside = length(in.uv - clamp(in.uv, vec2f(0.0), vec2f(1.0))) * CELLF;
  let d = (0.5 - s0.r) * 2.0 * SPREADF + outside;
  let fw = fwidth(d);
  // the distance is only known SPREAD cell px past the edge: the softening stays inside that band (a blurred chip
  // keeps its cut outline, never its quad's square), and nothing is drawn where the distance saturates
  let aw = min(max(fw, 1e-3) * 0.75 + in.a.z, SPREADF * 0.5);
  let cover = smoothstep(aw, -aw, d) * (1.0 - smoothstep(SPREADF * 0.6, SPREADF * 0.9, d));
  if (cover * in.a.y <= 1e-3) { discard; }
  let look = fu.v[26u];
  let Z = fu.v[25u];
  // the cut edge: a bevel whose normal leans along the distance's gradient (the normal map of the chip)
  let bev = 1.0 - smoothstep(0.0, max(look.w, 0.5), -d);
  let gr = vec2f(sx - s0.r, sy - s0.r);
  let gl = length(gr);
  let gdir = select(vec2f(0.0), -gr / max(gl, 1e-6), gl > 1e-6);
  let nC = in.n.xyz;
  let n = normalize(nC + (in.t.xyz * gdir.x + in.b.xyz * gdir.y) * bev * 1.4);
  let V = normalize(fieldEye() - in.c.xyz);
  let tone = s0.g;
  // the body: a faint cobalt, the cut edge a little brighter; the mark's white half a touch whiter
  let bodyCol = mix(frame.accentS.rgb, frame.paperS.rgb, 0.18 * tone);
  // (round 12) rim: the cut edge's own light toward paper (0 = cobalt, as before)
  var col = bodyCol * Z.z * (0.5 + 0.5 * tone) + mix(frame.accentS.rgb, frame.paperS.rgb, fu.v[38u].x) * Z.w * bev;
  let nl = u32(fu.v[0u].y);
  for (var i = 0u; i < nl; i++) {
    let I = in.li[i];
    if (I <= 0.0) { continue; }
    let o = fu.v[2u + i * 5u];
    let c = fu.v[4u + i * 5u];
    let L = normalize(o.xyz - in.c.xyz);
    let H = normalize(L + V);
    // glass has two faces: the flash comes whichever side meets the half vector
    let face = pow(abs(dot(nC, H)), look.y);
    let edge = pow(abs(dot(n, H)), look.y * 0.18) * bev;
    let glint = look.x * (face * (0.55 + 0.45 * tone) + 0.8 * edge);
    let trans = look.z * (0.4 + 0.6 * abs(dot(nC, L))) * (0.45 + 0.55 * tone);
    // a glint is paper-white whatever the light's tint; the glow keeps the tint
    col += I * (mix(c.rgb, vec3f(length(c.rgb) * 0.62), 0.6) * glint + c.rgb * trans);
  }
  let mask = stageKeep(in.pos.xy) * stageNight(in.pos.xy);
  return vec4f(col * cover * in.a.y * mask, 0.0);
}
`;

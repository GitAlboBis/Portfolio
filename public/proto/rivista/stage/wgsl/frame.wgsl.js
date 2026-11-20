// @ts-check
/**
 * frame.wgsl.js — the stage's Frame uniform and the helpers every stage shader starts with.
 *
 * `frameWGSL` declares `struct StageFrame` at @group(0) @binding(0) and the functions that place a
 * world point on the screen. A body (the extension point of stage.js) starts its shader with this
 * chunk and uses the bind group the stage hands it, so it sits in the same space, under the same
 * camera, split by the same dawn rectangles as the points.
 *
 * Space. The page is the plane z = 0. One world unit is one CSS pixel there. World x is the
 * document's x, world y the document's y (down), z points at the reader.
 *
 * The camera (spec 50 §5). stageView(p) turns the world about the pivot (document px; by default the
 * centre of the viewport on the page plane) by the camera's yaw and pitch and pushes it toward the
 * reader by the dolly. With the camera at zero stageView is the identity and a point at z = 0 lands
 * exactly on its DOM position. stageScreen(p) = stageScreenV(stageView(p)): the eye looks straight at
 * the page through the viewport with a lens shift, so the plane z = 0 of VIEW space never moves.
 *
 * Night and dawn. The ground is night: a point is light. Inside one of up to two dawn rectangles
 * (viewport css px) a point is ink. stageNight(frag) is 1 at night, 0 at dawn, antialiased on the
 * rectangles' edges.
 *
 * The byte layout is mirrored by FRAME (the packer's table in this file): change both together.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment (it ends the template).
 */

/** Members of StageFrame in order; every one is 16 bytes, `keep` is 16 of them. */
export const FRAME = Object.freeze({
  view: 0,       // css w, css h, scroll x, scroll y (document px of the viewport's top-left corner)
  backing: 1,    // backing w, h (px), backing px per css px along x, along y
  cam: 2,        // eye distance D (px), eye offset x, y (px), aperture (css px of blur per px of depth)
  clock: 3,      // time (s, simulated), dt (s, simulated), activity 0..1, frame index
  band: 4,       // dawn rectangles in use (0..2), night alpha (0 = pure light), the eye's aberration (css px at a corner,
                 // 0 at rest: m-glass), the light's ceiling as written (1 on the 8-bit canvas, more on an HDR canvas)
  pointer: 5,    // x, y (viewport css px), pressed 0..1, present 0 | 1
  pointerV: 6,   // vx, vy (css px / s), radius (css px), strength
  wind: 7,       // wind y (document px / s), scroll velocity (px / s), gain (drawn-count compensation), ambient alpha
  depth: 8,      // z far (negative), z near (positive), focus z, largest disc radius (css px)
  free: 9,       // strands in the whole population, free size (css px), free flow (px / s), free wavelength (px)
  free2: 10,     // free spring (1 / s), free inertia (s), free evolution (1 / s), free flow z factor
  paper: 11,     // tokens, linear rgb (paper = the dawn ground)
  ink: 12,
  accent: 13,
  night: 14,
  nightAcc: 15,  // night accent, sRGB-encoded (the light's thin colour is mixed in encoded space)
  paperS: 16,    // tokens, sRGB-encoded (bytes / 255)
  accentS: 17,
  nightS: 18,
  sigma: 19,     // Beer absorption per channel: ln(paper / accent), linear light
  lookDay: 20,   // ink gain, keep-out feather (css px), shutter (s), stochastic rounding 0..1
  lookNight: 21, // light gain, white added for a sharp disc, white in every disc, the grain (1: one 8-bit step; 0 on HDR)
  count: 22,     // u32: simulated, drawn, keep-outs, flags
  keep: 23,      // 16 x (x0, y0, x1, y1) viewport css px
  dawn: 39,      // 2 x (x0, y0, x1, y1) viewport css px
  camX: 41,      // the camera's rotation, rows: view = R (p - pivot) + pivot + (0, 0, dolly)
  camY: 42,
  camZ: 43,
  camP: 44,      // pivot x, y, z (document px), dolly (px toward the reader; folded into camO, kept for the record)
  camO: 45,      // view origin: view = R (p - pivot) + camO.xyz; w = the largest disc sigma before a point fades (0: off)
  clip: 46,      // distances from the eye (px): near gone, near full, fog start, fog end (fog end <= start: no fog)
});

/** Size of the Frame uniform in bytes. */
export const FRAME_SIZE = 47 * 16;

/** WGSL: the Frame struct, its binding and the space helpers. */
export const frameWGSL = /* wgsl */ `
// ---------------------------------------------------------------- stage frame
struct StageFrame {
  view      : vec4f,   // css w, css h, scroll x, scroll y
  backing   : vec4f,   // backing w, h, px per css px (x, y)
  cam       : vec4f,   // eye distance, eye offset x, y, aperture
  clock     : vec4f,   // time, dt, activity, frame index
  band      : vec4f,   // dawn rectangles in use, night alpha, aberration (css px), light ceiling
  pointer   : vec4f,   // x, y (viewport css px), pressed, present
  pointerV  : vec4f,   // vx, vy, radius, strength
  wind      : vec4f,   // wind y, scroll velocity, gain, ambient alpha
  depth     : vec4f,   // z far, z near, focus z, largest radius
  free      : vec4f,   // strands, free size, free flow, free wavelength
  free2     : vec4f,   // free spring, free inertia, free evolution, free flow z
  paper     : vec4f,   // linear (the dawn ground)
  ink       : vec4f,
  accent    : vec4f,
  night     : vec4f,
  nightAcc  : vec4f,   // sRGB-encoded
  paperS    : vec4f,   // sRGB-encoded
  accentS   : vec4f,
  nightS    : vec4f,
  sigma     : vec4f,
  lookDay   : vec4f,
  lookNight : vec4f,
  count     : vec4u,   // simulated, drawn, keep-outs, flags
  keep      : array<vec4f, 16>,
  dawn      : array<vec4f, 2>,
  camX      : vec4f,
  camY      : vec4f,
  camZ      : vec4f,
  camP      : vec4f,   // pivot (document px), dolly
  camO      : vec4f,   // view origin, largest disc sigma before a point fades (0: off)
  clip      : vec4f,   // eye distances: near gone, near full, fog start, fog end
};

@group(0) @binding(0) var<uniform> frame : StageFrame;

// World point -> view point: the camera turns the world about the pivot and sets it at the view origin
// (the pivot plus the dolly for the orbiting camera; the eye's own place for the free camera, stage.js).
fn stageView(p : vec3f) -> vec3f {
  let q = p - frame.camP.xyz;
  return vec3f(dot(frame.camX.xyz, q), dot(frame.camY.xyz, q), dot(frame.camZ.xyz, q)) + frame.camO.xyz;
}

// How much of a VIEW point survives the lens and the fog: 0 nearer than the near distance (nothing passes the
// lens as a blot: it fades out softly between "near full" and "near gone"), 0 past the fog's end (the hall falls
// into the night). With "near full" <= "near gone" the near cut is hard (the orbiting camera's old cull).
fn stageFade(q : vec3f) -> f32 {
  let d = frame.cam.x - q.z;
  var k = select(step(frame.clip.x, d), smoothstep(frame.clip.x, frame.clip.y, d), frame.clip.y > frame.clip.x);
  if (frame.clip.w > frame.clip.z) { k = k * (1.0 - smoothstep(frame.clip.z, frame.clip.w, d)); }
  return k;
}

// View point -> viewport css px in .xy, perspective scale in .z. The eye sits in front of the
// viewport's centre (plus the damped offset) and the projection is a lens shift, so the view plane
// z = 0 never moves: only what is off it slides against it.
fn stageScreenV(q : vec3f) -> vec3f {
  let D = frame.cam.x;
  let s = D / max(D - q.z, 1.0);
  let eye = frame.view.xy * 0.5 + frame.cam.yz;
  let v = q.xy - frame.view.zw;
  return vec3f(eye + (v - eye) * s, s);
}

// World point (document px, z toward the reader) -> viewport css px in .xy, perspective scale in .z.
fn stageScreen(p : vec3f) -> vec3f {
  return stageScreenV(stageView(p));
}

// Viewport css px -> clip space.
fn stageClip(css : vec2f) -> vec4f {
  return vec4f(css.x / frame.view.x * 2.0 - 1.0, 1.0 - css.y / frame.view.y * 2.0, 0.0, 1.0);
}

// World point -> clip space, in one call.
fn stageProject(p : vec3f) -> vec4f {
  return stageClip(stageScreen(p).xy);
}

// How much of a viewport point is dawn: 1 inside a dawn rectangle, 0 outside; px = the width of the
// antialiased edge in css px (one backing pixel for a fragment).
fn stageDawnAt(css : vec2f, px : f32) -> f32 {
  var d = 0.0;
  let n = u32(frame.band.x);
  for (var i = 0u; i < n; i++) {
    let r = frame.dawn[i];
    let k = clamp((css - r.xy) / px + 0.5, vec2f(0.0), vec2f(1.0)) * clamp((r.zw - css) / px + 0.5, vec2f(0.0), vec2f(1.0));
    d = max(d, k.x * k.y);
  }
  return d;
}

// How much of this fragment is night: 1 outside every dawn rectangle, 0 inside one, the covered
// fraction of the pixel on their edges. frag = @builtin(position).xy of the stage's canvas.
fn stageNight(frag : vec2f) -> f32 {
  return 1.0 - stageDawnAt(frag / frame.backing.zw, 1.0 / frame.backing.z);
}

// 1 outside every keep-out, 0 on and inside one, a few css px of fall just outside its edge.
fn stageKeep(frag : vec2f) -> f32 {
  let css = frag / frame.backing.zw;
  var k = 1.0;
  let n = frame.count.z;
  for (var i = 0u; i < n; i++) {
    let r = frame.keep[i];
    let q = max(max(r.xy - css, css - r.zw), vec2f(0.0));
    k *= smoothstep(0.0, frame.lookDay.y, length(q));
  }
  return k;
}

// Exact sRGB OETF (linear -> encoded): the canvas is not an -srgb format, bytes are written by hand.
fn stageOETF(c : vec3f) -> vec3f {
  let lo = c * 12.92;
  let hi = 1.055 * pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.4)) - vec3f(0.055);
  return select(hi, lo, c <= vec3f(0.0031308));
}

// (lane m-glass, plan 70 phase 4) THE GRAIN. A smooth dark gradient written into the 8-bit canvas is cut into bands one
// step apart; a dither of one step added to an ENCODED colour just before it is written breaks the bands (a grain added
// after the write cannot: the steps are already there). Triangular, mean zero, two steps wide at most: at 1:1 it is not
// seen as noise, it only removes the bands. Seeded from the stage's clock (simulated seconds, which stop at rest): the
// last frame keeps its grain and the stage sleeps. Amplitude lookNight.w: 1 on the 8-bit canvas, 0 on a float16 (HDR)
// canvas, which has no bands to break. frag: @builtin(position).xy
fn stageGrain(frag : vec2f) -> f32 {
  if (frame.lookNight.w <= 0.0) { return 0.0; }
  var x = (u32(frag.x) * 1973u) ^ (u32(frag.y) * 9277u) ^ ((u32(frame.clock.x * 60.0) & 4095u) * 26699u) ^ 0x9e3779b9u;
  x = (x ^ (x >> 16u)) * 0x7feb352du;
  x = (x ^ (x >> 15u)) * 0x846ca68bu;
  x = x ^ (x >> 16u);
  return (f32(x & 0xffffu) + f32(x >> 16u) - 65535.0) / 65535.0 * frame.lookNight.w / 255.0;
}
// the grain on light that is ADDED over the page (alpha 0): only where there is light, so the night between stays black
fn stageGrainLight(c : vec3f, frag : vec2f) -> vec3f {
  if (max(c.r, max(c.g, c.b)) <= 0.0) { return c; }
  return max(c + vec3f(stageGrain(frag)), vec3f(0.0));
}
`;

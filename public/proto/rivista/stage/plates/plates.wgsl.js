// @ts-check
/**
 * plates.wgsl.js — plates of clear glass (spec 50 §5): thick boxes with straight edges, drawn analytically.
 *
 * Every plate is an oriented box in VIEW space (the camera already applied on the CPU). For each pixel of
 * its screen rectangle the shader casts the stage camera's own ray (the eye of stageScreenV) and:
 *  1. intersects the box (slab test, no marching), the box inflated by one pixel so the silhouette can be
 *     antialiased from the ray's closest approach (the box's distance field at the slab planes); a pixel
 *     whose ray enters or leaves near an edge (the arris, a thin side face, a far edge seen through the
 *     face, a plate seen through it) is shaded with two more rays across it, and every light a ray reaches
 *     is prefiltered by the angle one pixel of that ray spans (keepLight), so a feature thinner than a pixel
 *     stays a continuous line;
 *  2. bends the face normal inside a bevel a few px wide at every edge (a rounded arris), which is where
 *     the light lines and the spectral split live;
 *  3. reflects (Fresnel, Schlick, n = ior) a studio of two soft rectangular lights that the pointer
 *     swings, a long strip above and a fixed rim;
 *  4. refracts in, one ray per colour channel on tier A (three indices), crosses the glass to the exit
 *     face (one internal reflection when the exit is total), refracts out and follows the ray: to another
 *     plate behind it (seen through), to the page (the display type the host rasterised: the backdrop), to
 *     the swarm behind (the ink texture of pass A, sampled where the ray meets the swarm's plane), or to
 *     the studio's lights;
 *  5. on the way, meets the image held at mid-thickness (a print inside the glass, opaque) or the frosted
 *     etched type (lit by what is around it);
 *  6. tints the light faintly cool with the path length (Beer), lights the edges with the swarm's light
 *     behind them (a ring of taps of the ink texture), and adds the second, fainter reflection of the
 *     lights off the back face (what makes a plate read thick);
 *  7. goes soft and dim when it is out of focus (sharp < 1): wider silhouette, softer lights, the image at
 *     a coarser mip level.
 * Shading is in linear light, written with stageOETF, premultiplied. No tone map.
 *
 * Night and dawn are decided per sample (stageDawnAt): the ground a ray reaches is the night or the dawn
 * ground, and the lights dim at dawn.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

/** Most plates in one frame. */
export const MAX_SLABS = 12;
/** Bytes of one Slab. */
export const SLAB_SIZE = 8 * 16;
/** Bytes of the shared uniform: the slabs, the draw order, then 8 vec4. */
export const PLATES_SIZE = MAX_SLABS * SLAB_SIZE + 3 * 16 + 9 * 16;

export const platesWGSL = /* wgsl */ `
// ---------------------------------------------------------------- plates
struct Slab {
  c    : vec4f,   // centre (view space, document px), presence 0..1
  ax   : vec4f,   // local x axis (view space, unit), half width (px)
  ay   : vec4f,   // local y axis, half height
  az   : vec4f,   // local z axis (the thickness), half thickness
  look : vec4f,   // edge glow, sharp, image layer (-1: none), etch layer (-1: none)
  img  : vec4f,   // image half size on the mid plane (px) x, y; image source aspect; etch source aspect
  quad : vec4f,   // screen rect (viewport css px) x0, y0, x1, y1
  mat  : vec4f,   // bevel (px), ior, dispersion (ior step per channel), tint gain (+ 64 x the face's sheen cut, 0..63: plates.js)
};
struct Plates {
  slabs : array<Slab, 12>,
  order : array<vec4u, 3>,  // draw order, far to near
  info  : vec4f,            // count, swarm plane z (view), flags (1 dispersion, 2 through, 4 inner, 8 glow), ink taps radius (css px)
  bd    : vec4f,            // backdrop document rect x, y, w, h (w = 0: none)
  key   : vec4f,            // key soft box: centre azimuth, elevation (rad), half widths (rad)
  fill  : vec4f,            // fill soft box
  top   : vec4f,            // the overhead box on the ceiling plane: centre x, z (per unit of height), half x, z
  gains : vec4f,            // key, fill, strip, rim gains (linear radiance)
  rim   : vec4f,            // rim direction (view, unit), sharpness exponent
  glass : vec4f,            // absorption per px r, g, b; edge glow gain
  amb   : vec4f,            // the sweep: gain, elevation of its brightest band (rad), its width (rad), _
};

@group(1) @binding(0) var<uniform> P : Plates;
@group(1) @binding(1) var bdTex : texture_2d<f32>;
@group(1) @binding(2) var inkTex : texture_2d<f32>;
@group(1) @binding(3) var imgTex : texture_2d_array<f32>;
@group(1) @binding(4) var smp : sampler;

struct PO {
  @builtin(position) pos : vec4f,
  @location(0) @interpolate(flat) id : u32,
};

@vertex fn vsPlate(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> PO {
  let id = P.order[ii >> 2u][ii & 3u];
  let r = P.slabs[id].quad;
  let c = vec2f(f32(vi & 1u), f32(vi >> 1u));
  var o : PO;
  o.pos = stageClip(mix(r.xy, r.zw, c));
  o.id = id;
  return o;
}
@vertex fn vsBlit(@builtin(vertex_index) vi : u32) -> PO {
  var o : PO;
  let c = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  o.pos = vec4f(c * 2.0 - 1.0, 0.0, 1.0);
  o.id = 0u;
  return o;
}
@fragment fn fsBlit(i : PO) -> @location(0) vec4f {
  let c = textureLoad(inkTex, vec2i(i.pos.xy), 0);
  // (lane m-glass) THE ABERRATION IN SPEED (frame.band.z, css px at a corner; 0 at rest: one load, as before): red read a
  // little farther out from the frame's centre, blue a little nearer, by the distance from the centre
  let k = frame.band.z;
  if (k <= 0.0) { return c; }
  let uv = i.pos.xy / frame.backing.xy;
  let o = (uv - vec2f(0.5)) * 2.0 / sqrt(2.0) * k / frame.view.xy;
  let r = textureSampleLevel(inkTex, smp, uv + o, 0.0);
  let b = textureSampleLevel(inkTex, smp, uv - o, 0.0);
  return vec4f(r.r, c.g, b.b, max(c.a, max(r.a, b.a)));
}

// (lane m-glass) the colour channel a ray of the glass carries (-1 red, 1 blue, 0 green or all three): the aberration in
// speed and the prism's beam read it
var<private> dCh : f32;

fn toLin(c : vec3f) -> vec3f {
  return select(pow((c + vec3f(0.055)) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}

// ---------------------------------------------------------------- the box
fn toLocal(s : Slab, v : vec3f) -> vec3f { return vec3f(dot(v, s.ax.xyz), dot(v, s.ay.xyz), dot(v, s.az.xyz)); }
fn toView(s : Slab, v : vec3f) -> vec3f { return v.x * s.ax.xyz + v.y * s.ay.xyz + v.z * s.az.xyz; }
fn halfOf(s : Slab) -> vec3f { return vec3f(s.ax.w, s.ay.w, s.az.w); }

fn safeDir(d : vec3f) -> vec3f { return select(d, vec3f(1e-7), abs(d) < vec3f(1e-7)); }

// entry and exit of a ray against the box of half size h (local space): (t near, t far)
fn slab(ro : vec3f, rd : vec3f, h : vec3f) -> vec2f {
  let inv = 1.0 / safeDir(rd);
  let t0 = (-h - ro) * inv;
  let t1 = (h - ro) * inv;
  let a = min(t0, t1);
  let b = max(t0, t1);
  return vec2f(max(max(a.x, a.y), a.z), min(min(b.x, b.y), b.z));
}

// the exit of a ray that starts inside the box: t of the first far plane
fn exitT(ro : vec3f, rd : vec3f, h : vec3f) -> f32 {
  let inv = 1.0 / safeDir(rd);
  let t = max((-h - ro) * inv, (h - ro) * inv);
  return max(min(min(t.x, t.y), t.z), 0.0);
}

fn sdBox(p : vec3f, h : vec3f) -> f32 {
  let q = abs(p) - h;
  return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// the outward normal of the face a surface point is on, its bevel bent in: within b px of an edge the
// normal turns toward the neighbouring face, up to 45 degrees at the arris (a rounded edge of radius b).
// .w = how much bevel this point is on (0 flat face, 1 at the arris)
fn faceNormalK(p : vec3f, h : vec3f, b : f32, amax : f32) -> vec4f {
  let q = abs(p) - h;
  var k = 0u;
  if (q.y > q.x && q.y >= q.z) { k = 1u; } else if (q.z > q.x && q.z > q.y) { k = 2u; }
  var n = vec3f(0.0);
  n[k] = select(-1.0, 1.0, p[k] >= 0.0);
  var bev = 0.0;
  for (var j = 0u; j < 3u; j++) {
    if (j == k) { continue; }
    let d = h[j] - abs(p[j]);
    let x = clamp(1.0 - d / max(b, 1e-3), 0.0, 1.0);
    // tan of the bend angle: a circular arc from 0 on the face to 45 degrees at the arris
    let a = x * amax;
    n[j] = n[j] + select(-1.0, 1.0, p[j] >= 0.0) * tan(a);
    bev = max(bev, x);
  }
  return vec4f(normalize(n), bev);
}
fn faceNormal(p : vec3f, h : vec3f, b : f32) -> vec4f { return faceNormalK(p, h, b, 0.7854); }
// the exit faces bend less (a softer arris seen from inside): fewer pixels flip between refraction and
// total reflection along the far edges, which would read as a dashed line
fn exitNormal(p : vec3f, h : vec3f, b : f32) -> vec3f { return faceNormalK(p, h, b, 0.45).xyz; }
// how fast the normal turns inside a bevel (rad per px across it); 0 on the flat face
fn turnRate(bev : f32, b : f32, amax : f32) -> f32 { return select(0.0, amax / max(b, 1e-3), bev > 0.0 && bev < 1.0); }

// a point on the box's surface closest to p (local), for the normal of an antialiasing ray that missed.
// On an edge or a corner (the point clamped onto two or three faces) it takes the face that faces the ray
// rd most, never one turned away (that flipped the normal pixel by pixel along a thin edge)
fn onBox(p : vec3f, h : vec3f, rd : vec3f) -> vec3f {
  let c = clamp(p, -h, h);
  let q = abs(c) - h;
  var k = 0u;
  if (q.y > q.x && q.y >= q.z) { k = 1u; } else if (q.z > q.x && q.z > q.y) { k = 2u; }
  var best = -2.0;
  for (var j = 0u; j < 3u; j++) {
    if (q[j] > q[k] - 1e-3) {
      let f = -rd[j] * select(-1.0, 1.0, c[j] >= 0.0);
      if (f > best) { best = f; k = j; }
    }
  }
  var o = c;
  o[k] = select(-h[k], h[k], c[k] >= 0.0);
  return o;
}

// ---------------------------------------------------------------- the studio
fn softBox(uv : vec2f, b : vec4f, soft : f32) -> f32 {
  let q = abs(uv - b.xy) - b.zw;
  let d = length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0);
  return 1.0 - smoothstep(-soft, soft, d);
}
// how much dimmer a box of half width w gets when its edge softness grows from s0 to s: it keeps its light
// (the energy across it) instead of glowing wider at full brightness; 1 when s = s0
fn keepLight(w : vec2f, s0 : f32, s : f32) -> f32 {
  let k = min(vec2f(1.0), 2.0 * w / (w + s)) / min(vec2f(1.0), 2.0 * w / (w + s0));
  return k.x * k.y;
}
// a soft box seen by a ray whose pixel spans fa radians: prefiltered (widened by fa, same light), so a box
// swept fast by a turning normal (an arris, a thin face) draws as a continuous line, not as dots
fn softBoxF(uv : vec2f, b : vec4f, soft : f32, fa : f32) -> f32 {
  if (fa <= 1e-4) { return softBox(uv, b, soft); }
  return softBox(uv, b, soft + fa) * keepLight(b.zw, soft, soft + fa);
}

// the lights a view ray sees, placed by azimuth and elevation (radians: az = 0 toward the reader, > 0 to his
// right; el > 0 up): two tall soft boxes standing either side of the reader (the pointer swings them), a strip
// above, and a fixed rim low behind the plates. soft widens their edges (focus). dim: 1 at night.
// fa: the angle one pixel of the ray spans (0: a point), what the lights are prefiltered by
fn lightsOf(r : vec3f, soft : f32, dim : f32, fa : f32) -> vec3f {
  var c = 0.0;
  if (r.z > -0.5) {
    let uv = vec2f(atan2(r.x, r.z), asin(clamp(-r.y, -1.0, 1.0)));
    let s = 0.009 + soft;
    // a soft box is brighter at its centre than at its edge (the diffuser's falloff)
    let kc = 1.0 - 0.35 * smoothstep(0.0, 1.0, length((uv - P.key.xy) / P.key.zw));
    let fc = 1.0 - 0.35 * smoothstep(0.0, 1.0, length((uv - P.fill.xy) / P.fill.zw));
    c = P.gains.x * softBoxF(uv, P.key, s, fa) * kc + P.gains.y * softBoxF(uv, P.fill, s, fa) * fc;
    // the sweep: a large dim card above and in front, brightest in a band; it gives every face a faint body
    let sw = exp(-pow((uv.y - P.amb.y) / P.amb.z, 2.0)) * (1.0 - smoothstep(0.9, 1.6, abs(uv.x)));
    c = c + P.amb.x * (0.25 + 0.75 * sw) * smoothstep(-0.5, 0.2, r.z);
  }
  // the overhead box: a rectangle on the ceiling plane (x, z over the height), what a plate seen from above
  // and every top bevel reflect
  if (-r.y > 0.15) {
    let uc = vec2f(r.x, r.z) / (-r.y);
    let oc = 1.0 - 0.3 * smoothstep(0.0, 1.0, length((uc - P.top.xy) / P.top.zw));
    c = c + P.gains.z * softBoxF(uc, P.top, 0.03 + soft * 4.0, fa / (r.y * r.y)) * oc * smoothstep(0.15, 0.35, -r.y);
  }
  let rim = P.gains.w * pow(max(dot(r, P.rim.xyz), 0.0), P.rim.w);
  return vec3f(1.0, 0.985, 0.965) * (c + rim) * dim;
}

// ---------------------------------------------------------------- what lies behind the glass
// the ground at a viewport point: night, or the dawn ground inside a dawn rectangle (sRGB-encoded)
fn groundAt(css : vec2f) -> vec3f {
  return mix(frame.nightS.rgb, frame.paperS.rgb, stageDawnAt(css, 1.0));
}

// the page and the swarm along a view ray that leaves the glass at pv in direction dv (linear light). fa: the
// angle one pixel of the ray spans; the page is read at the mip level of the beam's width where it lands
fn behindPage(pv : vec3f, dv : vec3f, blur : f32, fa : f32) -> vec3f {
  // the page plane (view z = 0): the display type the host rasterised, else the ground
  let tp = max(pv.z, 0.0) / max(-dv.z, 1e-3);
  let pp = pv + dv * tp;
  var css = pp.xy - frame.view.zw;
  // (lane m-fly) through the door the GROUND is the one under the pixel itself: read where the bent ray lands, the edge
  // of day seen through the block bowed and stood a little off the page's own (a straight edge stays straight)
  if (dMirror) { css = dCss; }
  var g = groundAt(css);
  if (dNight) { g = frame.nightS.rgb; }
  if (P.bd.z > 0.0 && !dNight) {
    let uv = (pp.xy - P.bd.xy) / P.bd.zw;
    if (all(uv >= vec2f(0.0)) && all(uv <= vec2f(1.0))) {
      let lod = log2(max(1.0, (blur * 0.5 + fa * tp) * frame.backing.z));
      g = textureSampleLevel(bdTex, smp, uv, lod).rgb;
    }
  }
  // the swarm: its light was drawn in pass A at screen positions; read it where this ray meets the
  // plane the swarm drifts in (a plane behind the page when the ray is already past it)
  let zi = min(dInkZ, pv.z);
  let ti = max(pv.z - zi, 0.0) / max(-dv.z, 1e-3);
  let sc = stageScreenV(pv + dv * ti).xy;
  var iu = sc / frame.view.xy;
  if (dMirror) { iu = vec2f(1.0) - abs(vec2f(1.0) - fract(iu * 0.5) * 2.0); }
  // (lane m-glass) the aberration in speed, as the blit has it: a ray that carries one channel reads it shifted by its
  // place in the frame (no read more). The door's one ray in a flight's fast part is not split: two more reads there
  // cost the arrival's last door frames more than they showed
  let ab = frame.band.z;
  let abO = (dCss / frame.view.xy - vec2f(0.5)) * 2.0 / sqrt(2.0) * ab / frame.view.xy;
  if (ab > 0.0 && dCh != 0.0) { iu = iu - abO * dCh; }
  if (!dNight && all(iu >= vec2f(0.0)) && all(iu <= vec2f(1.0))) {
    var k = textureSampleLevel(inkTex, smp, iu, 0.0);
    if (blur > 1.0) {
      let o = vec2f(blur * 0.5) / frame.view.xy;
      k = 0.25 * (k + textureSampleLevel(inkTex, smp, iu + vec2f(o.x, o.y * 0.3), 0.0) + textureSampleLevel(inkTex, smp, iu - vec2f(o.x * 0.3, o.y), 0.0) + textureSampleLevel(inkTex, smp, iu + vec2f(-o.x, o.y * 0.6), 0.0));
    }
    g = g * (1.0 - k.a) + k.rgb;
  }
  return toLin(clamp(g, vec3f(0.0), vec3f(1.0)));
}

// everything a view ray sees once out of the glass: going back, the page and the swarm (the studio's lights
// are never seen straight through the glass, only in its reflections); turned toward the reader by the glass,
// the lights in the dark room
fn envOf(pv : vec3f, dv : vec3f, blur : f32, dim : f32, fa : f32) -> vec3f {
  let back = smoothstep(0.02, -0.06, dv.z);
  var c = vec3f(0.0);
  if (back > 0.0) { c = behindPage(pv, dv, blur, fa) * back; }
  if (back < 1.0) { c = c + (lightsOf(dv, blur * 0.004, dim, fa) + toLin(frame.nightS.rgb) * 0.8) * (1.0 - back); }
  return c;
}

// the image held at mid-thickness, cover-fitted to its rect; lod from the pixel footprint
// (round 12, COVER3FIX) mat.w carries the tint gain (under 64) and, above it, 64 x a per-plate cut of the broad face's
// reflection of the studio (0: none, today's image; 63: only the bevels keep theirs, as an etched plate): a plate
// turned under the pointer's soft boxes no longer washes to a grey card
fn tintOf(s : Slab) -> f32 { return s.mat.w - 64.0 * floor(s.mat.w / 64.0); }
fn sheenCut(s : Slab) -> f32 { return floor(s.mat.w / 64.0) / 63.0; }
// (wave 2, GLOW-WORK) look.x carries the edge glow (0..1) and, above it, 2 x 100 x a per-plate EDGE light: the bevels and
// the side faces lit in paper white of their own, as if a light in the room caught them (0, the default: today's image)
fn glowOf(s : Slab) -> f32 { return s.look.x - 2.0 * floor(s.look.x * 0.5); }
fn edgeOf(s : Slab) -> f32 { return floor(s.look.x * 0.5) * 0.01; }
// (lane n-fix-flight) THE CUT'S DOOR: a long block of cut glass the eye flies into and through (stage.js doorSlab).
// Flagged by a negative etch aspect: plates.js packs -(1 + the light inside it, 0..1); img.z - 1 is how much of that
// light is the morning's paper. Every other plate packs an etch aspect above 0 and takes none of the door's branches.
// Seen from outside it is a slab like any other, with a deep body: a ray that meets one of its long walls is turned by
// total reflection and leaves by the back face, so the room beyond stands mirrored in a band along each edge (what
// thick glass does). Seen from INSIDE (the eye between its faces) the ray starts at the eye, bent as by a flat face just
// in front of it (a camera's port): the picture is continuous as the eye crosses either face, the middle of the frame
// is the room straight ahead, and the mirrored bands slide out of the frame as the back face comes
fn isDoor(s : Slab) -> bool { return s.img.w < -0.5; }
fn doorLight(s : Slab) -> f32 { return clamp(-s.img.w - 1.0, 0.0, 1.0); }
// the plane the swarm's light is read on behind a plate (P.info.y; the door: the room beyond its back face), and
// whether a turned ray that lands outside the frame is read mirrored at the frame's edge (the door) or dropped
var<private> dInkZ : f32;
var<private> dMirror : bool;
// (lane m-fly) the door of a flight that leaves a morning view: the room beyond its glass is the night, whatever ground
// is on screen (img.z 3: plates.js packs s.night). Its glass reads neither the page's ground nor the ink on it
var<private> dNight : bool;
// (lane m-fly, run 2) where the view ray, taken straight, meets the plane of the door's back face (local x): the pane's
// two tall sides are read there, so their seams are the back face's own edges, straight from top to bottom of the frame
// (read on the bent ray they bowed). shadeAt sets it for the door before it follows a channel
var<private> dBx : f32;
// the pixel being drawn, viewport css px (fsPlate): the ground the door shows is the one under it
var<private> dCss : vec2f;

fn imageAt(s : Slab, q : vec2f, layer : f32, aspect : f32, lod : f32) -> vec3f {
  let l = q / s.img.xy;                    // -1..1 over the image rect
  let ar = s.img.x / max(s.img.y, 1e-3);   // the rect's aspect
  var uv = l * 0.5;
  let k = ar / max(aspect, 1e-3);
  if (k < 1.0) { uv.x = uv.x * k; } else { uv.y = uv.y / k; }
  return toLin(textureSampleLevel(imgTex, smp, uv + vec2f(0.5), i32(layer), lod).rgb);
}
fn etchAt(s : Slab, q : vec2f, layer : f32, aspect : f32, lod : f32) -> f32 {
  let l = q / s.img.xy;
  let ar = s.img.x / max(s.img.y, 1e-3);
  var uv = l * 0.5;
  let k = ar / max(aspect, 1e-3);
  // contain: the etched lettering keeps its proportions inside the rect
  if (k > 1.0) { uv.x = uv.x * k; } else { uv.y = uv.y / k; }
  uv = uv + vec2f(0.5);
  if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { return 0.0; }
  return textureSampleLevel(imgTex, smp, uv, i32(layer), lod).a;
}

// another plate seen through this one: the nearest plate j != self that the view ray (pv, dv) meets.
// Shaded simply (one straight pass, its face's reflection, its image, its tint). Returns rgb and how
// much of it there is (presence, antialiased like the plate's own silhouette: the ray's beam, one pixel
// widened by the angle fa it spans, against the box's distance at the slab planes); 0 when none
fn throughOther(me : u32, pv : vec3f, dv : vec3f, blur : f32, dim : f32, pxw : f32, fa : f32) -> vec4f {
  let n = u32(P.info.x);
  var best = 1e9;
  var bj = 99u;
  var bw = 1.0;
  // (lane m-fly) flag 32 (a flight's leaving, its fast part): only the door is looked for behind a plate
  let doorOnly = (u32(P.info.z) & 32u) != 0u;
  for (var j = 0u; j < n; j++) {
    if (j == me) { continue; }
    let s = P.slabs[j];
    if (s.c.w < 0.01 || isPrism(s) || (doorOnly && !isDoor(s))) { continue; }
    // (lane m-fly) a ray that passes wide of the plate's bounding sphere (the box as it is tested below, grown by w) cannot
    // meet it: it is not brought into the plate's space at all. The same picture, for less: most rays pass wide of most
    // plates, and this search runs for every pixel of every plate
    let dc = s.c.xyz - pv;
    let w = pxw + fa * length(dc);
    let hs = halfOf(s);
    let rr = length(hs) + 1.75 * w;
    let tm = dot(dc, dv);
    if (tm < -rr || dot(dc, dc) - tm * tm > rr * rr) { continue; }
    let ro = toLocal(s, -dc);
    let rd = toLocal(s, dv);
    let t = slab(ro, rd, hs + vec3f(w));
    if (t.x < t.y && t.x > 0.5 && t.x < best) { best = t.x; bj = j; bw = w; }
  }
  if (bj == 99u) { return vec4f(0.0); }
  let s = P.slabs[bj];
  let h = halfOf(s);
  let ro = toLocal(s, pv - s.c.xyz);
  let rd = toLocal(s, dv);
  var dmin = 1e9;
  let inv = 1.0 / safeDir(rd);
  for (var k = 0u; k < 3u; k++) {
    for (var sgn = -1; sgn <= 1; sgn++) {
      let tt = (f32(sgn) * h[k] - ro[k]) * inv[k];
      if (tt > 0.0) { dmin = min(dmin, sdBox(ro + rd * tt, h)); }
    }
  }
  let pres = clamp(0.5 - dmin / bw, 0.0, 1.0) * s.c.w;
  if (pres <= 0.002) { return vec4f(0.0); }
  let p0 = onBox(ro + rd * best, h, rd);
  let nb = faceNormal(p0, h, s.mat.x);
  let cosi = clamp(-dot(rd, nb.xyz), 0.0, 1.0);
  let fr = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
  let soft = (1.0 - s.look.y) * 0.08;
  let faR = 2.0 * turnRate(nb.w, s.mat.x, 0.7854) * pxw / max(cosi, 0.08);
  let refl = lightsOf(toView(s, reflect(rd, nb.xyz)), soft + blur * 0.004, dim, faR);
  if (edgeDist(p0, h) < 2.0 * bw / max(cosi, 0.08)) { thruNear = true; }
  let tE = exitT(p0, rd, h);
  var col : vec3f;
  var hitImg = false;
  var etch = 0.0;
  if ((s.look.z >= 0.0 || s.look.w >= 0.0) && abs(rd.z) > 1e-4) {
    let ti = -p0.z / rd.z;
    let q = p0.xy + rd.xy * ti;
    if (ti > 0.0 && ti < tE && all(abs(q) <= s.img.xy)) {
      let lod = log2(max(1.0, (f32(textureDimensions(imgTex).x) * 0.5 / max(s.img.x, 1.0)) * pxw)) + (1.0 - s.look.y) * 3.0;
      if (s.look.z >= 0.0) {
        col = imageAt(s, q, s.look.z, s.img.z, lod) * exp(-P.glass.xyz * ti * tintOf(s));
        hitImg = true;
      }
      if (s.look.w >= 0.0) { etch = etchAt(s, q, s.look.w, s.img.w, lod + 0.5); }
    }
  }
  if (!hitImg) {
    let pe = p0 + rd * tE;
    col = envOf(s.c.xyz + toView(s, pe), dv, blur + (1.0 - s.look.y) * 10.0, dim, fa) * exp(-P.glass.xyz * tE * tintOf(s));
  }
  // (wave 5, GLASS2) seen through another plate (or the prism), a plate keeps what it is: its sheen setting (an etched
  // or a sheen-cut face keeps only a breath of the studio, its bevels theirs: it never washes to a grey card), its
  // etching (the frost, as fsPlate draws it, without the swarm's gathered light) and its lit arris (edgeOf)
  let rk = select(mix(1.0, 0.04 + 0.96 * nb.w, min(sheenCut(s), 1.0)), 0.04 + 0.96 * nb.w, s.look.w >= 0.0);
  col = (1.0 - fr) * col + fr * refl * rk;
  if (etch > 0.001) {
    let full = mix(0.22, 1.0, smoothstep(0.35, 0.9, etch));
    let frost = (vec3f(0.70, 0.71, 0.74) + toLin(frame.nightAcc.rgb) * 0.22) * dim * full;
    col = mix(col, frost, clamp(etch, 0.0, 1.0) * 0.94);
  }
  let ek = edgeOf(s);
  if (ek > 0.0 && nb.w > 0.0) {
    let dA = s.mat.x * (1.0 - nb.w);
    let lw = 1.7 + 0.8 * bw;
    let side = select(0.0, 1.0, abs(p0.z) < h.z - 0.01);
    col = col * mix(1.0, 0.24, side) + vec3f(0.96, 0.95, 0.92) * (1.0 - smoothstep(0.35 * lw, lw, dA)) * dim * (0.55 + 1.1 * ek) * 0.8;
  }
  col = col * mix(0.55, 1.0, s.look.y);
  return vec4f(col, pres);
}

// one channel's way out of the glass from p0 (local) along d1: to the exit face, bent out (one internal
// reflection when the exit is total), then to what lies behind. Returns rgb (only .c is meant) and the
// the plate seen through, shared by the three channels of one ray when thruMode is 2 (the extra rays of an
// edge pixel: the middle channel looks for it, red and blue reuse it); 0: each channel looks for its own
var<private> thruMode : u32;
var<private> thruLast : vec4f;
// set when a ray meets the plate seen through near one of its edges (that pixel takes the extra rays too)
var<private> thruNear : bool;
// (lane m-fly, run 3) how the last channelOut left the glass: the exit face's normal (local; .w its bevel) and whether
// the ray was turned inside it (a total reflection, or the door's carrying). shadeAt reads them after the middle channel
var<private> chExit : vec4f;
var<private> chTurned : bool;

// length of the path inside the glass in .w. fa: the angle one pixel of d1 spans (what the entry bevel
// spread it by); the exit bevel and the refraction out widen it, and the lights it reaches are prefiltered by it
fn channelOut(s : Slab, me : u32, p0 : vec3f, d1 : vec3f, ic : f32, blur : f32, dim : f32, pxw : f32, fa0 : f32) -> vec4f {
  let h = halfOf(s);
  let b = s.mat.x;
  var tE = exitT(p0, d1, h);
  var p1 = p0 + d1 * tE;
  var nk = faceNormalK(p1, h, b, 0.45);
  var n2 = nk.xyz;
  var d2 = refract(d1, -n2, ic);
  var L = tE;
  var din = d1;
  var fa = fa0;
  var tir = false;
  // (lane m-fly) THE DOOR TURNS NOTHING BACK. A wall that mirrored the room showed everything in it twice (a second
  // "CORE", the name with a piece of itself beside it); a wall that showed nothing was a dark corridor with a window at
  // its end; and the bevel of the back face folded a sliver of the room over at each seam. Every ray in the door is
  // carried on to the plane of its back face and leaves there as through a flat face: the room beyond is ONE picture
  // from edge to edge of the block. Beyond the back face's two tall edges (the pane's thick sides, seen through its
  // own glass) the picture is stretched outward from the seam, a little more for blue than for red: continuous at the
  // seam, so nothing is shown twice and nothing is skipped, and wider the farther from it, as a cut edge shows a room
  var carried = false;
  if (isDoor(s) && d1.z < -1e-3) {
    carried = true;
    L = (-h.z - p0.z) / d1.z;
    p1 = p0 + d1 * L;
    let e = abs(dBx) - h.x;
    var dg = d1;
    if (e > 0.0) {
      // (never by more than a small angle: a wide band at the frame's edge read the room beyond the frame, folded back)
      let m = 0.16 + 1.5 * (ic - s.mat.y);
      let dx = min(m * e, 0.035 * L * abs(d1.z));
      dg = normalize(p1 + vec3f(select(-1.0, 1.0, dBx >= 0.0) * dx, 0.0, 0.0) - p0);
    }
    n2 = vec3f(0.0, 0.0, -1.0);
    nk = vec4f(n2, 0.0);
    din = dg;
    d2 = refract(dg, -n2, ic);
    if (dot(d2, d2) < 0.5) { d2 = normalize(vec3f(dg.xy * 2.0, dg.z)); }
  }
  if (!carried && dot(d2, d2) < 0.5) {
    // total internal reflection: once more across the glass
    tir = true;
    let dr = reflect(d1, n2);
    fa = fa + 2.0 * turnRate(nk.w, b, 0.45) * pxw / max(abs(dot(d1, n2)), 0.08);
    let p1b = p1 - n2 * 0.05;
    let t2 = exitT(p1b, dr, h);
    p1 = p1b + dr * t2;
    L = L + t2;
    nk = faceNormalK(p1, h, b, 0.45);
    n2 = nk.xyz;
    din = dr;
    d2 = refract(dr, -n2, ic);
    if (dot(d2, d2) < 0.5) { d2 = reflect(dr, n2); }
  }
  // out through the exit face: Snell spreads the angle by ic cos(in) / cos(out), the bevel turns it
  let ci = abs(dot(din, n2));
  let co = abs(dot(d2, n2));
  let dn = turnRate(nk.w, b, 0.45) * pxw / max(ci, 0.08);
  let amp = ic * ci / max(co, 0.1);
  fa = min(amp * fa + (amp + 1.0) * dn, 1.0);
  let pv = s.c.xyz + toView(s, p1);
  let dv = normalize(toView(s, d2));
  // the light lost to the exit face's own reflection
  let ce = clamp(abs(dot(d2, n2)), 0.0, 1.0);
  let f0 = pow((ic - 1.0) / (ic + 1.0), 2.0);
  let tr = 1.0 - (f0 + (1.0 - f0) * pow(1.0 - ce, 5.0));
  var col = vec3f(0.0);
  if (sheenCut(s) > 1.0) {
    // (lane o-fix) the cut's portal (rimSheen 0): a ray its deep rim turns toward the reader sees the dark room, never
    // the studio's soft boxes (they stood in the rim as a tall grey column with a rounded end)
    let bk = smoothstep(0.02, -0.06, dv.z);
    if (bk > 0.0) { col = behindPage(pv, dv, blur, fa) * bk; }
    col = col + toLin(frame.nightS.rgb) * 0.8 * (1.0 - bk);
  } else {
    col = envOf(pv, dv, blur, dim, fa);
  }
  // (lane n-fix-flight) the cut's door looks for plates behind it only when it is told there are some (img.x 2: the
  // arriving room seen through the glass); leaving, the whole room is in front of it, and the search over every plate
  // for every pixel of the block was the flight's peak
  // (lane m-fly) ... and never in a ray one of its long walls turned: a wall mirrors the room's own light, dimly, not the
  // plates in it (a second "CORE", a second name beside the first)
  if ((u32(P.info.z) & 2u) != 0u && (!isDoor(s) || (s.img.x > 1.5 && !tir))) {
    var o = thruLast;
    if (thruMode != 2u) { o = throughOther(me, pv, dv, blur, dim, pxw, fa); thruLast = o; }
    col = mix(col, o.rgb, o.w);
  }
  chExit = nk;
  chTurned = tir || carried;
  return vec4f(col * tr, L);
}

// how far a surface point is from the nearest edge of the face it is on (px)
fn edgeDist(p : vec3f, h : vec3f) -> f32 {
  let q = abs(p) - h;
  var k = 0u;
  if (q.y > q.x && q.y >= q.z) { k = 1u; } else if (q.z > q.x && q.z > q.y) { k = 2u; }
  var d = 1e9;
  for (var j = 0u; j < 3u; j++) { if (j != k) { d = min(d, h[j] - abs(p[j])); } }
  return d;
}

// what one ray brings back from a plate: its light (linear, before the edge glow), how much edge glow and
// etching it meets, whether it met the (inflated) box, and whether it passes near an edge
struct Shade { col : vec3f, gw : f32, etch : f32, hit : f32, near : f32 };

// one ray (ro, rd: the plate's own space) through a plate: reflection, refraction, what lies behind
// (cheap: an extra ray of an edge pixel, whose three channels share one look for the plate seen through)
fn shadeAt(s : Slab, id : u32, ro : vec3f, rd : vec3f, fw : f32, pxw : f32, blur : f32, dim : f32, flags : u32, cheap : bool) -> Shade {
  var o : Shade;
  thruNear = false;
  let h = halfOf(s);
  let t = slab(ro, rd, h + vec3f(fw));
  if (!(t.x < t.y) || t.y <= 0.0) { return o; }
  let sharp = s.look.y;

  // the entry point (on the true box) and its normal with the bevel
  var pIn = onBox(ro + rd * max(t.x, 0.0), h, rd);
  var nb = faceNormal(pIn, h, s.mat.x);
  // (lane n-fix-flight) the eye inside the door: the ray starts at the eye, bent as by a flat face in front of it
  let door = isDoor(s);
  let eyeIn = door && all(abs(ro) < h);
  if (eyeIn) { pIn = ro; nb = vec4f(0.0, 0.0, select(1.0, -1.0, rd.z > 0.0), 0.0); }
  let tBs = (-h.z - ro.z) / min(rd.z, -1e-3);
  if (door) { dBx = ro.x + rd.x * tBs; }
  let n = nb.xyz;
  let cosi = clamp(-dot(rd, n), 0.0, 1.0);
  let ior = s.mat.y;
  let f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
  let fr = select(f0 + (1.0 - f0) * pow(1.0 - cosi, 5.0), 0.0, eyeIn);
  let softL = (1.0 - sharp) * 0.09;

  // the reflection of the studio on the face, prefiltered by how far the bevel turns the normal within a pixel
  let dnIn = turnRate(nb.w, s.mat.x, 0.7854) * pxw / max(cosi, 0.08);
  let rv = toView(s, reflect(rd, n));
  let refl = lightsOf(rv, softL, dim, 2.0 * dnIn);
  let faIn = dnIn * (1.0 - 1.0 / ior);

  // into the glass: the image or the etching at mid-thickness, met by the middle channel
  let d1m = refract(rd, n, 1.0 / ior);
  let tEm = exitT(pIn, d1m, h);
  var held = false;
  var imgCol = vec3f(0.0);
  var etch = 0.0;
  if (abs(d1m.z) > 1e-4) {
    let ti = -pIn.z / d1m.z;
    let q = pIn.xy + d1m.xy * ti;
    if (ti > 0.0 && ti < tEm && all(abs(q) <= s.img.xy)) {
      let lod = log2(max(1.0, (f32(textureDimensions(imgTex).x) * 0.5 / max(s.img.x, 1.0)) * pxw)) + (1.0 - sharp) * 3.0;
      if (s.look.z >= 0.0) {
        imgCol = imageAt(s, q, s.look.z, s.img.z, lod) * exp(-P.glass.xyz * ti * tintOf(s));
        held = true;
      }
      if (s.look.w >= 0.0) { etch = etchAt(s, q, s.look.w, s.img.w, lod + 0.5); }
    }
  }

  // through the glass, one ray per channel when dispersion is on (else one ray for the three). One call site of
  // channelOut for both cases: the backend inlines every call, and two sites doubled the shader it compiles (BOOT)
  var trans = imgCol;
  var L = tEm;
  if (!held) {
    // (lane o-fix) a plate with no dispersion of its own (the cut's portal: a full-frame plate) traces one ray, not three
    let disp = (flags & 1u) != 0u && s.mat.z > 0.0;
    // the split grows where the face is steep to the ray (the bevels): clean through the middle of the face
    let spread = s.mat.z * (1.0 + 3.0 * nb.w + 2.0 * pow(1.0 - cosi, 2.0));
    // (lane m-fly, run 3) THE SPLIT WHERE IT SHOWS. In by a flat face and out by the flat face opposite it, the three
    // channels leave the glass in one direction, side by side: under half a pixel apart (red to blue) they are one
    // picture, and the middle channel's ray is the colour of all three (the same image, for a third of the cost). The
    // bevels, a side face, a ray turned inside the glass and the door keep their three rays: the faint split stays
    // wherever the glass turns the channels apart
    var oneRay = false;
    if (disp && !door && nb.w <= 0.0) {
      let T = 2.0 * dot(abs(n), h);
      let dR = refract(rd, n, 1.0 / (ior - spread));
      let dB = refract(rd, n, 1.0 / (ior + spread));
      oneRay = T * length(dR / max(abs(dot(dR, n)), 1e-3) - dB / max(abs(dot(dB, n)), 1e-3)) < 1.0 * pxw;
    }
    let nch = select(1u, 3u, disp);
    for (var kc = 0u; kc < nch; kc++) {
      // the middle channel first, so a cheap ray's red and blue reuse what it saw through
      let ch = i32((kc + 1u) % 3u);
      thruMode = select(0u, select(select(1u, 2u, kc > 0u), 0u, !cheap), disp);
      let ic = select(ior, ior + spread * f32(ch - 1), disp);
      let d1 = select(d1m, refract(rd, n, 1.0 / ic), disp);
      dCh = select(0.0, f32(ch - 1), disp);
      let oc = channelOut(s, id, pIn, d1, ic, blur, dim, pxw, faIn);
      dCh = 0.0;
      if (kc == 0u && oneRay && !chTurned && chExit.w <= 0.0 && dot(chExit.xyz, n) < -0.999) {
        trans = oc.rgb * exp(-P.glass.xyz * oc.w * tintOf(s));
        L = oc.w;
        break;
      }
      if (disp) {
        trans[ch] = oc[ch] * exp(-P.glass[ch] * oc.w * tintOf(s));
        if (ch == 1) { L = oc.w; }
      } else {
        trans = oc.rgb * exp(-P.glass.xyz * oc.w * tintOf(s));
        L = oc.w;
      }
    }
  }

  // the second reflection: part of the light inside is reflected by the back face and leaves through the
  // front: a fainter, offset copy of the lights (the thickness, seen)
  var inner = vec3f(0.0);
  if ((flags & 4u) != 0u && !held) {
    let p1 = pIn + d1m * tEm;
    let nk2 = faceNormal(p1, h, s.mat.x);
    let n2 = nk2.xyz;
    let c2 = clamp(dot(d1m, n2), 0.0, 1.0);
    let fr2 = f0 + (1.0 - f0) * pow(1.0 - c2, 5.0);
    let dr = reflect(d1m, n2);
    let pr = p1 - n2 * 0.05;
    let t3 = exitT(pr, dr, h);
    let p3 = pr + dr * t3;
    let nk3 = faceNormal(p3, h, s.mat.x);
    let n3 = nk3.xyz;
    let d3 = refract(dr, -n3, ior);
    if (dot(d3, d3) > 0.5) {
      // it fades out as the exit nears total reflection (the exit face's own Fresnel, 1 face-on), not at a
      // hard threshold; the lights are prefiltered by the angle the two bevels spread one pixel over
      let ci3 = abs(dot(dr, n3));
      let co3 = abs(dot(d3, n3));
      let t3w = min(1.0, (1.0 - (f0 + (1.0 - f0) * pow(1.0 - co3, 5.0))) / (1.0 - f0));
      let amp3 = ior * ci3 / max(co3, 0.1);
      let dn3 = turnRate(nk3.w, s.mat.x, 0.7854) * pxw / max(ci3, 0.08);
      let faB = faIn + 2.0 * turnRate(nk2.w, s.mat.x, 0.7854) * pxw / max(c2, 0.08);
      let faI = min(amp3 * faB + (amp3 + 1.0) * dn3, 1.0);
      inner = fr2 * (1.0 - fr) * t3w * lightsOf(toView(s, d3), softL, dim, faI) * exp(-P.glass.xyz * (tEm + t3) * tintOf(s));
    }
  }

  // the frosted etching: the glass scatters what lights it, so the lettering glows with the studio
  // and the swarm around it
  // clear glass carrying an etching (CASE2): its broad face keeps only a breath of the studio's reflections (a soft
  // box sweeping it during a turn read as a grey card); the bevels keep theirs, so the rims stay bright
  // (lane o-fix) a cut above 1 (plates.js rimSheen 0): the bevels keep none of the studio either
  let scut = sheenCut(s);
  let rkb = select(0.04 + 0.96 * nb.w, 0.04, scut > 1.0);
  let rk = select(mix(1.0, rkb, min(scut, 1.0)), rkb, s.look.w >= 0.0);
  o.col = (1.0 - fr) * trans + (fr * refl + inner) * rk;

  // the edges: the bevels and the side faces gather the swarm's light behind the plate
  let side = select(0.0, 1.0, abs(pIn.z) < h.z - 0.01 && !eyeIn);
  var edgeK = max(nb.w, side);
  let ek = edgeOf(s);
  if (door) {
    // (lane m-fly) THE DOOR'S BODY: thick cut glass, clear in the middle and dense along its walls. Where the middle ray
    // leaves: the back face (the room beyond, bent by its bevels) or a long wall. A wall no longer mirrors the room (a
    // second "CORE", a second name beside the first one): it is the edge of the block, the dark cool depth thick glass
    // has when one looks along it, with a breath of the room's light at its far end. The seam between the back face and
    // a wall is a cut bevel: a narrow darker line on the face's side, where the bevel turns the room away, and a line
    // of light with the faint split every arris has here (red toward the wall, blue toward the face), brightest toward
    // the upper right, where the rooms' shafts come from, and falling away down the seam: never one even line. No
    // facets (a row of them read as the lines of a grid) and all but no light of its own in the body (at 0.05 it was the
    // plain grey of the passage). On a morning ground the walls stay clear, as before: dark walls on paper were two bars
    // (run 2) the walls no longer mirror and are no longer dark: every ray is carried on to the back plane (channelOut),
    // so the room beyond is whole across the block. Only the pane's two tall sides are drawn as glass, and they are
    // read on that plane (pB): beyond the back face's tall edge the band is a little denser and cooler the nearer
    // the eye's end of the block, and its seam is one straight line from the top of the frame to the bottom, lit, with
    // its split, and a narrow groove on the face's side. The top and bottom walls draw nothing (their seams closed the
    // two tall ones into a rectangle: a window frame, a grid's line)
    let pO = pIn + d1m * tEm;
    let eB = abs(dBx) - h.x;
    let wall = select(0.0, 1.0, eB > 0.0);
    let cssPx = max(length(rd) * tBs, 1.0) / frame.cam.x;
    let xs = eB / cssPx;      // css px across the seam: > 0 in the band, < 0 on the face
    let g = doorLight(s);
    let day = clamp((1.0 - dim) / 0.65, 0.0, 1.0);
    let far = exp(-(pO.z + h.z) / (0.3 * frame.cam.x));
    let deep = toLin(frame.nightS.rgb) * 0.9 + vec3f(0.0, 0.0008, 0.003);
    let dens = mix(0.6, 0.88, far);
    let wallCol = mix(o.col * vec3f(0.82, 0.88, 1.0) * dens + deep * (1.0 - dens), o.col * 0.955, day);
    let slant = smoothstep(-0.55, 0.55, rd.x - rd.y);
    let lightN = (vec3f(0.74, 0.76, 0.82) + toLin(frame.nightAcc.rgb) * 0.2) * dim;
    var body = mix(o.col, wallCol, wall);
    body = mix(body, lightN, clamp(g * mix(0.6, 1.0, slant) * (1.0 - 0.7 * wall), 0.0, 1.0));
    let lw = 1.15;
    let lR = 1.0 - smoothstep(0.4 * lw, lw, abs(xs - 0.6));
    let lG = 1.0 - smoothstep(0.4 * lw, lw, abs(xs));
    let lB = 1.0 - smoothstep(0.4 * lw, lw, abs(xs + 0.6));
    // the bevel of the back face turns the room away over its own width: darker there, so the strip it folds over is
    // the cut's shadow and never a second, mirrored piece of the room
    let bevPx = max(2.5, s.mat.x / cssPx);
    // (on the morning's paper the seam cannot be a line of light: the groove stays, fainter, as the cut's fine line)
    let groove = (1.0 - smoothstep(0.5 * bevPx, 1.25 * bevPx, -xs)) * (1.0 - wall) * (1.0 - 0.8 * day);
    let ur = smoothstep(-0.9, 0.9, 0.5 * (pO.x / max(h.x, 1.0) - pO.y / max(h.y, 1.0)));
    let seamK = select(0.3, 1.0, eyeIn) * (0.06 + 0.5 * ur * ur) * (1.0 - 0.8 * day);
    o.col = body * (1.0 - 0.72 * groove) + vec3f(0.96, 0.95, 0.92) * mix(vec3f(lG), vec3f(lR, lG, lB), 0.4) * dim * seamK;
  }
  if (ek > 0.0) {
    // (wave 3, LIGHT3) CUT GLASS, not a frame. The wave-2 edge light lit the whole bevel and the side faces in grey: a
    // broad band round the plate, an aluminium frame round a screen. Now the side of the slab is a dark edge, and the
    // light is one thin line along the arris (about 2 css px), brighter toward one corner (the upper right, where the
    // room's shafts come from), with a faint spectral split across it (red just outside, blue just inside)
    let dA = s.mat.x * (1.0 - nb.w);                                   // px from the arris, on the face it is on
    let lw = 1.7 + 0.8 * pxw;
    let lR = 1.0 - smoothstep(0.35 * lw, lw, max(0.0, dA - 0.55));
    let lG = 1.0 - smoothstep(0.35 * lw, lw, dA);
    let lB = 1.0 - smoothstep(0.35 * lw, lw, dA + 0.55);
    // faint: two thirds of the line is white, a third carries the split (a full split read as an amber wire)
    let line = select(vec3f(0.0), mix(vec3f(lG), vec3f(lR, lG, lB), 0.35), nb.w > 0.0);
    let u = clamp(0.5 * (pIn.x / max(h.x, 1.0) - pIn.y / max(h.y, 1.0)), -1.0, 1.0);
    let cd = length(vec2f(h.x - pIn.x, h.y + pIn.y)) / max(1.0, min(h.x, h.y));
    let corner = mix(0.42, 1.0, smoothstep(-0.7, 1.0, u)) + 0.9 * exp(-cd * 3.0);
    o.col = o.col * mix(1.0, 0.24, side) + vec3f(0.96, 0.95, 0.92) * line * corner * dim * (0.55 + 1.1 * ek);
    edgeK = max(max(line.x, line.y), line.z);
  }
  o.gw = glowOf(s) * edgeK * (0.6 + 0.4 * nb.w);
  o.etch = etch;
  o.hit = 1.0;
  // near an edge: the entry or the exit point within two pixel footprints of an edge of its face (a side
  // face thinner than that is near all over). The bevel's lights need no more rays: they are prefiltered
  // (lane m-fly, run 3) asked only where the extra rays can follow (fsPlate): not in a flight's fast part, not on a
  // plate out of focus
  var nearK = false;
  if ((flags & 16u) == 0u && (sharp >= 0.8 || door)) {
    let pOut = pIn + d1m * tEm;
    let nOut = faceNormal(pOut, h, 0.0).xyz;
    let fpIn = 2.0 * pxw / max(cosi, 0.08);
    let fpOut = 2.0 * pxw / max(abs(dot(d1m, nOut)), 0.08);
    nearK = (!eyeIn && edgeDist(pIn, h) < fpIn) || edgeDist(pOut, h) < fpOut || thruNear;
  }
  o.near = select(0.0, 1.0, nearK);
  return o;
}

// ---------------------------------------------------------------- the prism (wave 4, lane PRISM)
// A convex solid of cut glass bounded by planes, traced like the box: a triangular prism inscribed in the plate's box,
// its axis the local y (the plate's height), its triangle in the local x z plane: the back face at z = -h.z, the two
// faces meeting at the apex edge z = +h.z (toward the reader), x from -h.x to h.x at the back. img.z < 0 flags it.
fn isPrism(s : Slab) -> bool { return s.img.z < -0.5; }

// the prism's five planes, set once per fragment (prSet): outward normal in .xyz, n . p <= .w inside
var<private> PRP : array<vec4f, 5>;
fn prSet(h : vec3f) {
  let L = sqrt(4.0 * h.z * h.z + h.x * h.x);
  let dd = h.x * h.z / L;
  PRP[0] = vec4f(0.0, 1.0, 0.0, h.y);
  PRP[1] = vec4f(0.0, -1.0, 0.0, h.y);
  PRP[2] = vec4f(0.0, 0.0, -1.0, h.z);
  PRP[3] = vec4f(2.0 * h.z / L, 0.0, h.x / L, dd);
  PRP[4] = vec4f(-2.0 * h.z / L, 0.0, h.x / L, dd);
}
// plane i of the prism (local space; prSet first)
fn prPlane(h : vec3f, i : u32) -> vec4f { return PRP[i]; }
// entry and exit of a ray against the prism grown by w px: (t near, t far)
fn prHit(ro : vec3f, rd : vec3f, h : vec3f, w : f32) -> vec2f {
  var tn = -1e9;
  var tf = 1e9;
  for (var i = 0u; i < 5u; i++) {
    let pl = prPlane(h, i);
    let dn = dot(pl.xyz, rd);
    let num = pl.w + w - dot(pl.xyz, ro);
    if (abs(dn) < 1e-7) { if (num < 0.0) { tn = 1e9; } continue; }
    let tt = num / dn;
    if (dn < 0.0) { tn = max(tn, tt); } else { tf = min(tf, tt); }
  }
  return vec2f(tn, tf);
}
// the exit of a ray that starts inside: t of the first plane it leaves through
fn prExit(p : vec3f, d : vec3f, h : vec3f) -> f32 {
  var t = 1e9;
  for (var i = 0u; i < 5u; i++) {
    let pl = prPlane(h, i);
    let dn = dot(pl.xyz, d);
    if (dn > 1e-6) { t = min(t, (pl.w - dot(pl.xyz, p)) / dn); }
  }
  return max(t, 0.0);
}
// a lower bound of the distance to the solid (exact on the faces, less near an edge): the antialiased silhouette
fn prSd(p : vec3f, h : vec3f) -> f32 {
  var m = -1e9;
  for (var i = 0u; i < 5u; i++) { let pl = prPlane(h, i); m = max(m, dot(pl.xyz, p) - pl.w); }
  return m;
}
// the face a surface point is on, and how far it is from the nearest edge of that face (px, in the face's plane)
fn prFace(p : vec3f, h : vec3f) -> u32 {
  var m = -1e9;
  var k = 0u;
  for (var i = 0u; i < 5u; i++) { let pl = prPlane(h, i); let e = dot(pl.xyz, p) - pl.w; if (e > m) { m = e; k = i; } }
  return k;
}
fn prEdge(p : vec3f, h : vec3f) -> f32 {
  let k = prFace(p, h);
  let nk = prPlane(h, k).xyz;
  var d = 1e9;
  for (var j = 0u; j < 5u; j++) {
    if (j == k) { continue; }
    let pj = prPlane(h, j);
    let l = length(pj.xyz - dot(pj.xyz, nk) * nk);
    if (l < 0.1) { continue; }
    d = min(d, (pj.w - dot(pj.xyz, p)) / l);
  }
  return d;
}
// the outward normal with the bevel bent in (as faceNormalK: toward each neighbouring face, up to amax at the arris)
fn prNormal(p : vec3f, h : vec3f, b : f32, amax : f32) -> vec4f {
  let k = prFace(p, h);
  let nk = prPlane(h, k).xyz;
  var n = nk;
  var bev = 0.0;
  for (var j = 0u; j < 5u; j++) {
    if (j == k) { continue; }
    let pj = prPlane(h, j);
    let tj = pj.xyz - dot(pj.xyz, nk) * nk;
    let l = length(tj);
    if (l < 0.1) { continue; }
    let x = clamp(1.0 - ((pj.w - dot(pj.xyz, p)) / l) / max(b, 1e-3), 0.0, 1.0);
    n = n + (tj / l) * tan(x * amax);
    bev = max(bev, x);
  }
  return vec4f(normalize(n), bev);
}
// (lane m-glass) THE BEAM IN THE GLASS. The light of the room's shaft goes INTO the prism and through it: from the place
// where the shaft meets the glass to the place where the ray to the row leaves it (plates.js PRISM_BEAM: two places on
// the triangle's outline, img.x and img.y, 0..3 = the right face from the apex, the back face, the left face up to the
// apex; at one place along the axis, img.w - 1 of the half length; look.z its light, 0 for none; index.js aims the shaft
// and the ray at the same two points). Drawn by the glass itself, inside it: a straight soft core with a faint body of
// light round it in the glass, seen through the faces and bent by them, and again, fainter, in the faces' total
// reflections (thick glass shows a beam twice). Toward the exit red and blue part a little (the faint split, never a
// rainbow): each channel's beam ends a hair apart.
var<private> bmA : vec3f;
var<private> bmB : vec3f;
var<private> bmK : f32;
var<private> bmS : f32;
// the beam's light the last prChannel met along its path inside the glass (shadePrism reads it per channel)
var<private> bmLast : f32;
// how the last prChannel left the glass: the exit face's normal (.w its bevel) and whether the glass turned it back
var<private> prExitN : vec4f;
var<private> prTurned : bool;
// a place on the triangle's outline (local x, z)
fn prOutline(u : f32, h : vec3f) -> vec2f {
  if (u < 1.0) { return vec2f(h.x * u, h.z - 2.0 * h.z * u); }
  if (u < 2.0) { return vec2f(h.x - 2.0 * h.x * (u - 1.0), -h.z); }
  return vec2f(-h.x + h.x * (u - 2.0), -h.z + 2.0 * h.z * (u - 2.0));
}
fn prBeamSet(s : Slab, h : vec3f, pxw : f32) {
  bmK = max(s.look.z, 0.0);
  let y = (s.img.w - 1.0) * h.y;
  let a = prOutline(s.img.x, h);
  let b = prOutline(s.img.y, h);
  bmA = vec3f(a.x, y, a.y);
  bmB = vec3f(b.x, y, b.y);
  // the core: about 1.6 css px across at the prism's depth, never under a backing pixel
  bmS = max(0.005 * h.x, 0.9 * pxw);
}
// the beam's light along one stretch of a view ray inside the glass: from p along d (unit) for len px (local space)
fn prBeam(p : vec3f, d : vec3f, len : f32) -> f32 {
  if (bmK <= 0.0 || len <= 0.0) { return 0.0; }
  var B = bmB;
  let ab = bmB - bmA;
  let L = length(ab);
  if (dCh != 0.0) {
    // each channel's beam ends a hair apart (red toward the apex side, blue toward the base)
    let pp = normalize(vec3f(-ab.z, 0.0, ab.x));
    B = B + pp * dCh * 0.006 * L;
  }
  let e = normalize(B - bmA);
  let LB = length(B - bmA);
  // the closest approach of the two segments
  let w0 = p - bmA;
  let b = dot(d, e);
  let dd = dot(d, w0);
  let ee = dot(e, w0);
  let den = max(1.0 - b * b, 1e-5);
  var t = clamp((b * ee - dd) / den, 0.0, len);
  var sb = clamp(ee + b * t, 0.0, LB);
  t = clamp(b * sb - dd, 0.0, len);
  let q = w0 + d * t - e * sb;
  let r = length(q);
  let x = r / bmS;
  // a straight soft core, a faint halo round it (the profile is across the line only: never a disc), the glass's own
  // body of light a little wider; brightest where the light comes in, a little less where it leaves
  let core = exp(-0.5 * x * x) + 0.16 * exp(-x / 4.5);
  let body = 0.07 * exp(-r / (0.1 * L));
  let along = mix(1.0, 0.72, sb / max(LB, 1.0));
  return bmK * (core * 1.25 + body) * along;
}
// one channel's way out of the prism from p0 along d1 (one internal reflection when the exit is total): what lies
// behind (a plate seen through it too), and the path inside in .w (channelOut's, for the prism)
fn prChannel(s : Slab, p0 : vec3f, d1 : vec3f, ic : f32, blur : f32, dim : f32, pxw : f32, fa0 : f32) -> vec4f {
  let h = halfOf(s);
  let b = s.mat.x;
  var tE = prExit(p0, d1, h);
  var p1 = p0 + d1 * tE;
  var nk = prNormal(p1, h, b, 0.45);
  var n2 = nk.xyz;
  var d2 = refract(d1, -n2, ic);
  var L = tE;
  var din = d1;
  var fa = fa0;
  // (lane m-glass) the beam met on the way through the glass
  bmLast = prBeam(p0, d1, tE);
  prTurned = false;
  if (dot(d2, d2) < 0.5) {
    prTurned = true;
    let dr = reflect(d1, n2);
    fa = fa + 2.0 * turnRate(nk.w, b, 0.45) * pxw / max(abs(dot(d1, n2)), 0.08);
    let p1b = p1 - n2 * 0.05;
    let t2 = prExit(p1b, dr, h);
    // ... and once more in the face's total reflection: the glass shows the beam again, fainter
    bmLast = bmLast + 0.32 * prBeam(p1b, dr, t2);
    p1 = p1b + dr * t2;
    L = L + t2;
    nk = prNormal(p1, h, b, 0.45);
    n2 = nk.xyz;
    din = dr;
    d2 = refract(dr, -n2, ic);
    if (dot(d2, d2) < 0.5) { d2 = reflect(dr, n2); }
  }
  let ci = abs(dot(din, n2));
  let co = abs(dot(d2, n2));
  let dn = turnRate(nk.w, b, 0.45) * pxw / max(ci, 0.08);
  let amp = ic * ci / max(co, 0.1);
  fa = min(amp * fa + (amp + 1.0) * dn, 1.0);
  prExitN = nk;
  let pv = s.c.xyz + toView(s, p1);
  let dv = normalize(toView(s, d2));
  let ce = clamp(co, 0.0, 1.0);
  let f0 = pow((ic - 1.0) / (ic + 1.0), 2.0);
  let tr = 1.0 - (f0 + (1.0 - f0) * pow(1.0 - ce, 5.0));
  var col = prEnv(pv, dv, blur, dim, fa);
  // (GLASS2) a plate seen through the prism (the middle channel looks for it, red and blue reuse it: thruMode)
  if ((u32(P.info.z) & 2u) != 0u) {
    var o = thruLast;
    if (thruMode != 2u) { o = throughOther(99u, pv, dv, blur, dim, pxw, fa); thruLast = o; }
    col = mix(col, o.rgb, o.w);
  }
  return vec4f(col * tr, L);
}
// (wave 5, GLASS2) THE PRISM IS CLEAR GLASS. The slabs' studio (two tall soft boxes, the sweep, the overhead box) seen in
// the prism's steep faces and in its internal reflections filled whole faces with one grey (a tent of grey card). The
// prism sees its own studio: the two soft boxes narrowed to thin strips (a narrow bright reflection on a face, never a
// panel), no sweep, the overhead box faint; and a ray the glass turns back toward the reader meets, instead of a grey
// room, the room behind mirrored (what a clear block of glass shows in its total reflections: the room again, bent)
fn prLights(r : vec3f, soft : f32, dim : f32, fa : f32) -> vec3f {
  var c = 0.0;
  if (r.z > -0.5) {
    let uv = vec2f(atan2(r.x, r.z), asin(clamp(-r.y, -1.0, 1.0)));
    let s = 0.006 + soft;
    let kb = vec4f(P.key.xy, P.key.z * 0.16, P.key.w * 0.8);
    let fb = vec4f(P.fill.xy, P.fill.z * 0.12, P.fill.w * 0.7);
    c = 1.3 * P.gains.x * softBoxF(uv, kb, s, fa) + 0.8 * P.gains.y * softBoxF(uv, fb, s, fa);
  }
  if (-r.y > 0.15) {
    let uc = vec2f(r.x, r.z) / (-r.y);
    c = c + 0.0 * P.gains.z * softBoxF(uc, P.top, 0.03 + soft * 4.0, fa / (r.y * r.y)) * smoothstep(0.15, 0.35, -r.y);
  }
  let rim = P.gains.w * pow(max(dot(r, P.rim.xyz), 0.0), P.rim.w);
  return vec3f(1.0, 0.985, 0.965) * (c + rim) * dim;
}
fn prEnv(pv : vec3f, dv : vec3f, blur : f32, dim : f32, fa : f32) -> vec3f {
  let back = smoothstep(0.02, -0.06, dv.z);
  // the room seen through, a little brighter than around it (the glass gathers the light it passes)
  var c = behindPage(pv, dv, blur, fa) * 1.18 * back;
  if (back < 1.0) {
    let dm = normalize(vec3f(dv.x, dv.y, -max(abs(dv.z), 0.12)));
    // (lane m-glass) a ray the glass turns back toward the eye carries the tone of the room it now faces (the faces'
    // own, shadePrism): the total reflections inside read as planes of the solid, lighter above, darker below
    let sky = (0.03 + 0.07 * smoothstep(-0.1, 0.85, -dv.y)) * vec3f(0.84, 0.88, 1.0) * dim;
    c = c + (behindPage(pv, dm, blur, fa) * 1.0 + prLights(dv, blur * 0.004, dim, fa) + sky) * (1.0 - back);
  }
  return c;
}
// one ray through the prism: reflection, refraction (three indices on tier A: the faint split the bevels have, grown
// by the prism's steep faces), the lit arris (the plate's edge light), the edge glow
fn shadePrism(s : Slab, ro : vec3f, rd : vec3f, fw : f32, pxw : f32, blur : f32, dim : f32, flags : u32) -> Shade {
  var o : Shade;
  let h = halfOf(s);
  prSet(h);
  let t = prHit(ro, rd, h, fw);
  if (!(t.x < t.y) || t.y <= 0.0) { return o; }
  let sharp = s.look.y;
  prBeamSet(s, h, pxw);
  // the entry point on the true solid: where the ray enters the last of the planes it enters
  // (GLASS2) pushed along the ray, not along each plane's normal: a push along one normal moved the point off the face
  // it had just been pushed onto, and a band along every slanted arris took the full bevel (a grey bar ten px wide)
  var tIn = max(t.x, 0.0);
  for (var i = 0u; i < 5u; i++) {
    let pl = prPlane(h, i);
    let dn = dot(pl.xyz, rd);
    if (dn < -1e-6) { tIn = max(tIn, (pl.w - dot(pl.xyz, ro)) / dn); }
  }
  var pIn = ro + rd * tIn;
  let nb = prNormal(pIn, h, s.mat.x, 0.7854);
  let n = nb.xyz;
  let cosi = clamp(-dot(rd, n), 0.0, 1.0);
  let ior = s.mat.y;
  let f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
  let fr = f0 + (1.0 - f0) * pow(1.0 - cosi, 5.0);
  let softL = (1.0 - sharp) * 0.09;
  let dnIn = turnRate(nb.w, s.mat.x, 0.7854) * pxw / max(cosi, 0.08);
  // the face's reflection: the narrow strips, and the room (mirrored, as prEnv): a face seen at a grazing angle
  // carries the room again instead of going black or grey
  let rvP = toView(s, reflect(rd, n));
  // (lane m-glass) A SOLID, NOT A DRAWING: each face takes the tone of the room it faces. A face turned up mirrors the
  // lit air under the shaft and the ceiling's dark, a face turned down the floor's darker night: the faces part from
  // one another by tone (with Fresnel, brighter as they turn away from the eye), as the faces of a cut block do. Never a
  // grey card: it is a few hundredths, the room's own blue-white, and nothing on a face that looks straight at the eye
  let sky = (0.035 + 0.06 * smoothstep(-0.1, 0.85, -rvP.y)) * vec3f(0.84, 0.88, 1.0) * dim;
  let refl = prLights(rvP, softL, dim, 2.0 * dnIn) + sky + 0.85 * behindPage(s.c.xyz + toView(s, pIn), normalize(vec3f(rvP.x, rvP.y, -max(abs(rvP.z), 0.12))), blur, 2.0 * dnIn);
  let faIn = dnIn * (1.0 - 1.0 / ior);
  let d1m = refract(rd, n, 1.0 / ior);
  var trans = vec3f(0.0);
  var L = 0.0;
  let disp = (flags & 1u) != 0u;
  let spread = s.mat.z * (1.0 + 3.0 * nb.w + 2.0 * pow(1.0 - cosi, 2.0));
  let nch = select(1u, 3u, disp);
  var bm = vec3f(0.0);
  for (var kc = 0u; kc < nch; kc++) {
    let ch = i32((kc + 1u) % 3u);
    let ic = select(ior, ior + spread * f32(ch - 1), disp);
    let d1 = select(d1m, refract(rd, n, 1.0 / ic), disp);
    thruMode = select(0u, select(1u, 2u, kc > 0u), disp);
    dCh = select(0.0, f32(ch - 1), disp);
    let oc = prChannel(s, pIn, d1, ic, blur, dim, pxw, faIn);
    dCh = 0.0;
    // (lane m-glass) the split where it shows (as the slabs' oneRay): in by one cap and out by the other, flat to flat,
    // not turned and far from the beam, the three channels leave a hair apart; there the middle channel's ray is all
    // three (the triangle the eye looks through, most of the prism, for a third of the cost)
    if (kc == 0u && disp && nb.w <= 0.0 && !prTurned && prExitN.w <= 0.0 && dot(prExitN.xyz, n) < -0.999 && bmLast < 0.004) {
      trans = oc.rgb * exp(-P.glass.xyz * oc.w * tintOf(s));
      bm = vec3f(bmLast);
      L = oc.w;
      break;
    }
    if (disp) {
      trans[ch] = oc[ch] * exp(-P.glass[ch] * oc.w * tintOf(s));
      bm[ch] = bmLast;
      if (ch == 1) { L = oc.w; }
    } else {
      trans = oc.rgb * exp(-P.glass.xyz * oc.w * tintOf(s));
      bm = vec3f(bmLast);
      L = oc.w;
    }
  }
  let rk = mix(1.0, 0.04 + 0.96 * nb.w, sheenCut(s));
  o.col = (1.0 - fr) * trans + fr * refl * rk;
  // (lane m-glass) the beam in the glass, seen through the face it is behind (paper white, in linear light)
  o.col = o.col + (1.0 - fr) * bm * vec3f(0.92, 0.9, 0.84) * dim;
  // the light the room's shaft brings into it through the top (the edge light's gain): the glass holds a breath of it,
  // brightest under the top face and gone well before the foot (a solid lit from above, not a black window)
  let ekS = edgeOf(s);
  o.col = o.col + vec3f(0.96, 0.95, 0.92) * 0.06 * ekS * exp(-(pIn.y + h.y) / (0.55 * h.y)) * smoothstep(-0.2, 1.0, 1.0 - abs(pIn.x) / max(h.x, 1.0)) * dim;
  // (GLASS2) the narrow reflection: a strip light seen in the right face, one hairline along the glass parallel to the
  // arrises, high on the face; the pointer's swing of the key light moves it a little across. (The light turning inside
  // is the scene's: index.js draws the beam inside the glass, from where the shaft enters to where the fan leaves.)
  let kf = prFace(pIn, h);
  if (kf == 3u && ekS > 0.0) {
    let yN = select(-h.y, h.y, ro.y > 0.0);
    let u = abs(pIn.y - yN) / max(2.0 * h.y, 1.0);
    let v = pIn.z / max(h.z, 1.0);
    let ev = 1.5 * pxw / max(h.z, 1.0);
    let vc = 0.62 + 0.25 * (P.key.x - 1.1);
    let bw = 1.1 * ev;
    let sb = (1.0 - smoothstep(0.25 * bw, bw, abs(v - vc))) * smoothstep(0.03, 0.2, u) * (1.0 - smoothstep(0.55, 0.9, u));
    o.col = o.col + vec3f(0.96, 0.95, 0.92) * 1.1 * ekS * sb * dim;
  }
  // the arrises: one thin line of light along each (LIGHT3's cut glass), brighter toward the top where the shaft
  // comes in, the faint split across it
  var edgeK = nb.w;
  let ek = edgeOf(s);
  if (ek > 0.0) {
    // (GLASS2) thinner and brighter than a slab's: a hairline of light about one css px each side of the arris, the
    // faint split across it (red just outside, blue just inside), never a grey bar
    let dA = s.mat.x * (1.0 - nb.w);
    let lw = 0.9 + 0.6 * pxw;
    let lR = 1.0 - smoothstep(0.3 * lw, lw, max(0.0, dA - 0.45));
    let lG = 1.0 - smoothstep(0.3 * lw, lw, dA);
    let lB = 1.0 - smoothstep(0.3 * lw, lw, dA + 0.45);
    let line = select(vec3f(0.0), mix(vec3f(lG), vec3f(lR, lG, lB), 0.4), nb.w > 0.0);
    let up = mix(0.5, 1.0, smoothstep(0.6, -0.9, pIn.y / max(h.y, 1.0)));
    // (lane m-glass) CUT GLASS, NOT A DRAWING: the arrises catch the light where the beam comes in and goes out and fall
    // away from there (an even line round every edge read as an outline drawing); without a beam, as before
    let glint = select(1.0, 0.13 + 1.4 * max(exp(-distance(pIn, bmA) / (0.6 * h.x)), 0.75 * exp(-distance(pIn, bmB) / (0.45 * h.x))), bmK > 0.0);
    o.col = o.col + vec3f(0.96, 0.95, 0.92) * line * up * glint * dim * (1.0 + 1.8 * ek);
    edgeK = max(max(line.x, line.y), line.z);
  }
  o.gw = glowOf(s) * edgeK * (0.6 + 0.4 * nb.w);
  o.hit = 1.0;
  let pOut = pIn + d1m * prExit(pIn, d1m, h);
  o.near = select(0.0, 1.0, prEdge(pIn, h) < 2.0 * pxw / max(cosi, 0.08) || prEdge(pOut, h) < 2.0 * pxw);
  return o;
}

@fragment fn fsPlate(i : PO) -> @location(0) vec4f {
  let s = P.slabs[i.id];
  let css = i.pos.xy / frame.backing.zw;
  dCss = css;
  let D = frame.cam.x;
  let eye2 = frame.view.xy * 0.5 + frame.cam.yz;
  let E = vec3f(frame.view.zw + eye2, D);
  let dv = normalize(vec3f(frame.view.zw + css, 0.0) - E);
  let flags = u32(P.info.z);
  let dawnK = stageDawnAt(css, 1.0 / frame.backing.z);
  var dim = mix(1.0, 0.35, dawnK);

  // one backing pixel at the plate's depth, in document px; the blur of an out-of-focus plate (css px)
  let sharp = s.look.y;
  let blur = (1.0 - sharp) * 16.0;
  let pxw = max(D - s.c.z, 1.0) / D / frame.backing.z;
  let fw = pxw + blur * max(D - s.c.z, 1.0) / D;

  // the ray in the plate's own space
  let h = halfOf(s);
  let ro = toLocal(s, E - s.c.xyz);
  let rd = toLocal(s, dv);
  let pr = isPrism(s);
  // (lane n-fix-flight) the cut's door reads the room beyond its back face, mirrored at the frame's edge; the eye
  // between its faces sees glass over the whole frame
  dInkZ = P.info.y;
  dMirror = false;
  dNight = false;
  var eyeIn = false;
  // (the room beyond is read by the ray's DIRECTION, a plane far away: a wall of the block is a mirror, and a mirrored
  // room keeps its heights; a near plane stretched it into wedges)
  // The door is whole wherever the ray meets the true block: the closest approach read at the mid planes (made for a
  // thin plate) gave half a coverage to every ray that crosses a deep block from its face to a wall, and the block drew
  // as a cross of light (the rays that do reach a mid plane) on four half-drawn quadrants
  if (isDoor(s)) {
    dInkZ = -40.0 * D; dMirror = true; let t0 = slab(ro, rd, h); eyeIn = all(abs(ro) < h) || (t0.x < t0.y && t0.y > 0.0);
    if (s.img.z > 2.5) { dNight = true; dim = 1.0; }
  }
  var dmin = 1e9;
  if (pr) {
    // (PRISM) the same coverage against the prism's planes
    prSet(h);
    let t = prHit(ro, rd, h, fw);
    if (!(t.x < t.y) || t.y <= 0.0) { discard; }
    for (var k = 0u; k < 5u; k++) {
      let pl = prPlane(h, k);
      let dn = dot(pl.xyz, rd);
      if (abs(dn) > 1e-6) {
        let tt = (pl.w - dot(pl.xyz, ro)) / dn;
        if (tt > 0.0) { dmin = min(dmin, prSd(ro + rd * tt, h)); }
      }
    }
  } else {
  let t = slab(ro, rd, h + vec3f(fw));
  if (!(t.x < t.y) || t.y <= 0.0) { discard; }
  // coverage: the box's distance field at the slab planes the ray crosses (its closest approach)
  let inv = 1.0 / safeDir(rd);
  for (var k = 0u; k < 3u; k++) {
    for (var sgn = -1; sgn <= 1; sgn++) {
      let tt = (f32(sgn) * h[k] - ro[k]) * inv[k];
      if (tt > 0.0) { dmin = min(dmin, sdBox(ro + rd * tt, h)); }
    }
  }
  }
  let cov = select(clamp(0.5 - dmin / fw, 0.0, 1.0), 1.0, eyeIn) * s.c.w;
  if (cov <= 0.002) { discard; }

  // a feature thinner than a pixel (the side face of a thin plate, an arris, a far edge seen through the
  // face, a plate seen through it) shaded once per pixel draws as a dashed line along a slanted edge: near
  // an edge, two more rays across the pixel, averaged in linear light (with the prefiltered lights, three
  // rays keep the line whole). The rest of the plate keeps one ray. One call site of shadeAt for the three
  // rays: the backend inlines every call, and two sites doubled the shader it compiles (BOOT)
  var acc = vec3f(0.0);
  var gw = 0.0;
  var et = 0.0;
  var nh = 0.0;
  var near = false;
  for (var k = 0u; k < 3u; k++) {
    var dk = dv;
    if (k > 0u) {
      // (lane m-fly) flag 16: a flight's fast part, where no pixel takes its two extra edge rays (the speed hides it)
      // (lane m-fly, run 3) ... and none on a plate out of focus (sharp under 0.8: its edges are already soft over more
      // than three css px, the extra rays changed nothing a 1:1 crop shows, and in the gallery's row they were a quarter
      // of the frame's cost). The prism and the door keep theirs
      if (!near || (flags & 16u) != 0u || (sharp < 0.8 && !pr && !isDoor(s))) { break; }
      let o = vec2f(0.25, 0.375) * select(-1.0, 1.0, k == 2u);
      dk = normalize(vec3f(frame.view.zw + css + o / frame.backing.zw, 0.0) - E);
    }
    var sk : Shade;
    if (pr) { sk = shadePrism(s, ro, toLocal(s, dk), fw, pxw, blur, dim, flags); }
    else { sk = shadeAt(s, i.id, ro, toLocal(s, dk), fw, pxw, blur, dim, flags, k > 0u); }
    if (k == 0u) { near = sk.near > 0.0; acc = sk.col; gw = sk.gw; et = sk.etch; nh = 1.0; }
    else if (sk.hit > 0.0) { acc = acc + sk.col; gw = gw + sk.gw; et = et + sk.etch; nh = nh + 1.0; }
  }
  let sh = Shade(acc / nh, gw / nh, et / nh, 1.0, 0.0);
  var col = sh.col;
  let etch = sh.etch;

  // the edges: the bevels and the side faces gather the swarm's light behind the plate
  var glowL = vec3f(0.0);
  if ((flags & 8u) != 0u && (sh.gw > 0.01 * glowOf(s) * 0.6 || etch > 0.01)) {
    let R = P.info.w;
    for (var k = 0u; k < 8u; k++) {
      let a = f32(k) * 0.7854 + 0.3;
      let iu = (css + vec2f(cos(a), sin(a)) * R) / frame.view.xy;
      if (all(iu >= vec2f(0.0)) && all(iu <= vec2f(1.0))) {
        let kk = textureSampleLevel(inkTex, smp, iu, 0.0);
        glowL = glowL + toLin(clamp(kk.rgb, vec3f(0.0), vec3f(1.0)));
      }
    }
    glowL = glowL / 8.0;
  }
  col = col + glowL * P.glass.w * sh.gw;
  if (etch > 0.001) {
    // the engraving catches the light (CASE2): the brightest thing on the plate, the warm white of the type with a
    // breath of cobalt, as if lit from the plate's edge, and brighter still where the swarm passes behind it
    // A faint etching (a texture drawn at low alpha: the stack's other layers) stays faint: the light gathers in
    // full engraving only
    let full = mix(0.22, 1.0, smoothstep(0.35, 0.9, etch));
    let frost = (vec3f(0.70, 0.71, 0.74) + toLin(frame.nightAcc.rgb) * 0.22) * dim * full + glowL * 1.4;
    col = mix(col, frost, clamp(etch, 0.0, 1.0) * 0.94);
  }
  // out of focus: soft and dim
  col = col * mix(0.5, 1.0, sharp);
  // (lane m-glass) written under the light's ceiling (1 on the 8-bit canvas: its own clamp; above paper white on an HDR
  // canvas), with the grain that keeps the glass's dark gradients from banding
  let enc = min(stageOETF(col), vec3f(frame.band.w));
  return vec4f(max(enc + vec3f(stageGrain(i.pos.xy)), vec3f(0.0)) * cov, cov);
}
`;

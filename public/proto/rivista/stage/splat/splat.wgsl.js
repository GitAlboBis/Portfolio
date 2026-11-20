// @ts-check
/**
 * splat.wgsl.js — the shaders of the splat pass (lane SPLAT, wave 2): anisotropic 3D gaussians, sorted far to near on
 * the GPU, projected as ellipses and drawn premultiplied "over".
 *
 * A splat (48 bytes): p = (x, y, z, opacity) local units; q = rotation (w, x, y, z); s = standard deviations on its three
 * axes (local units); c = its colour, rgba8 sRGB-encoded (alpha unused). A set (up to MAXS a frame: 16 since lane NAME, the cover's thirteen letters) places a range of the
 * pool in the stage's world: M (three rows: scale x rotation, translation in document px), its settle 0..1 (0 round points
 * scattered like the swarm, 1 in place and in shape), its shading against the room's light.
 *
 * The order (compute, three dispatches between a clear and the draw): cKeys gives every splat of a set on screen a 16-bit
 * key of its distance from the eye (far first) and counts it in a histogram of 65536 bins; cScan turns the histogram into
 * offsets (one workgroup, 256 bins a thread) and writes the draw's instance count; cScatter writes each splat's index at
 * its bin's next place. The draw reads the indices in that order: back to front.
 * The draw: the 3D covariance R S S^T R^T taken through the set's matrix and the camera's rows, then through the
 * Jacobian of the stage's own projection (stageScreenV) to a 2D conic in css px; widened by the stage's depth of field and
 * a low-pass of 0.3 backing px^2 with its opacity scaled so the energy is kept (a defocused splat is fainter, never a
 * blot); a quad along the conic's eigenvectors, cut where the gaussian falls under 1/255.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

/** members shared by both modules (the uniform's binding is declared by each) */
const common = /* wgsl */ `
const MAXS : u32 = 16u;
const NONE : u32 = 0xffffffffu;
const BUDGET : f32 = 160.0;
const POINTS_SHARE : f32 = 0.07;
struct Splat { p : vec4f, q : vec4f, s : vec3f, c : u32 };
// m0..m2: the rows of the set's matrix (scale x turn), w = translation (document px); a: start, count, settle, alpha;
// b: shade 0..1, scatter radius (local), point sigma (css px), scale (css px a local unit); l: light direction (world,
// toward the light), ambient; c: centre (local), surface (1: a block's or a relief's tiles: back-facing ones culled once
// settled, cut at 2.2 sigma); e: stagger, drift (css px), point opacity, specular
// f (lane NAME): the shade's own colour (sRGB-encoded) when w > 0.5, else the stage's accent (as before); w - 1 the
// emission: a lit tile's alpha given up to that share, so its light is added over the room and the bloom reads it
struct SSet { m0 : vec4f, m1 : vec4f, m2 : vec4f, a : vec4f, b : vec4f, l : vec4f, c : vec4f, e : vec4f, f : vec4f };
// head: sets, pool used, clock (s), weight; cx..co: the camera rows, pivot and origin (as stageView); ck: D, near, view w, h;
// sc: scroll x, y, the farthest distance keyed (px), _
struct SUni { head : vec4f, cx : vec4f, cy : vec4f, cz : vec4f, cp : vec4f, co : vec4f, ck : vec4f, sc : vec4f, sets : array<SSet, 16> };

fn spPcg(v0 : vec3u) -> vec3u {
  var v = v0 * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> vec3u(16u);
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
fn spHash(i : u32, k : u32) -> vec3f { return vec3f(spPcg(vec3u(i, k, 0x9e37u))) / 4294967296.0; }

fn spFind(i : u32) -> u32 {
  let n = min(u32(su.head.x), MAXS);
  for (var s = 0u; s < n; s++) {
    let a = su.sets[s].a;
    let st = u32(a.x);
    if (i >= st && i < st + u32(a.y)) { return s; }
  }
  return NONE;
}
// this splat's own settle: the set's, staggered by a hash (a splat arrives a little before or after its neighbours)
fn spSettle(S : SSet, i : u32) -> f32 {
  let st = S.e.x;
  let t = clamp(S.a.z * (1.0 + st) - st * spHash(i, 3u).x, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
// the splat's local place: scattered in a soft ball round the set's centre, drifting on the stage's clock, at k = 0;
// its own place at k = 1
fn spLocal(S : SSet, i : u32, p : vec3f, k : f32) -> vec3f {
  if (k >= 1.0) { return p; }
  // a wide box, even (never a round cloud: no soft disc of light), wider than tall, as the swarm's mist
  let h = spHash(i, 1u);
  let g = (h * 2.0 - 1.0) * vec3f(1.6, 0.9, 1.2);
  let dr = S.e.y / max(S.b.w, 1e-3);
  let drift = sin(vec3f(0.061, 0.047, 0.053) * su.head.z * 6.2831 + h * 6.2831) * dr;
  return mix(S.c.xyz + g * S.b.y + drift, p, k);
}
// the rotation of a quaternion (w, x, y, z), as columns
fn spQuat(q : vec4f) -> mat3x3f {
  let w = q.x; let x = q.y; let y = q.z; let z = q.w;
  return mat3x3f(
    vec3f(1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y + w * z), 2.0 * (x * z - w * y)),
    vec3f(2.0 * (x * y - w * z), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z + w * x)),
    vec3f(2.0 * (x * z + w * y), 2.0 * (y * z - w * x), 1.0 - 2.0 * (x * x + y * y)));
}
// a tile's normal: its smallest axis
fn spAxis(P : Splat) -> u32 {
  var ax = 2u;
  if (P.s.x <= P.s.y && P.s.x <= P.s.z) { ax = 0u; } else if (P.s.y <= P.s.z) { ax = 1u; }
  return ax;
}
fn spWorld(S : SSet, l : vec3f) -> vec3f {
  return vec3f(dot(S.m0.xyz, l) + S.m0.w, dot(S.m1.xyz, l) + S.m1.w, dot(S.m2.xyz, l) + S.m2.w);
}
`;

/** the order: keys, scan, scatter */
export const splatSortWGSL = /* wgsl */ `
@group(0) @binding(0) var<uniform> su : SUni;
@group(0) @binding(1) var<storage, read> sp : array<Splat>;
@group(0) @binding(2) var<storage, read_write> keys : array<u32>;
@group(0) @binding(3) var<storage, read_write> hist : array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> order : array<u32>;
@group(0) @binding(5) var<storage, read_write> args : array<u32>;
${common}

@compute @workgroup_size(256)
fn cKeys(@builtin(global_invocation_id) gid : vec3u) {
  let i = gid.x;
  if (i >= u32(su.head.y)) { return; }
  let s = spFind(i);
  if (s == NONE) { keys[i] = NONE; return; }
  let S = su.sets[s];
  let P = sp[i];
  let k = spSettle(S, i);
  let w = spWorld(S, spLocal(S, i, P.p.xyz, k));
  let q = w - su.cp.xyz;
  let v = vec3f(dot(su.cx.xyz, q), dot(su.cy.xyz, q), dot(su.cz.xyz, q)) + su.co.xyz;
  let D = su.ck.x;
  // a solid block, settled: a tile that faces away from the eye is behind the block's near side (not drawn: half the fill)
  if (S.c.w > 0.5 && k > 0.98) {
    let nw = mat3x3f(vec3f(S.m0.x, S.m1.x, S.m2.x), vec3f(S.m0.y, S.m1.y, S.m2.y), vec3f(S.m0.z, S.m1.z, S.m2.z)) * spQuat(P.q)[spAxis(P)];
    let nv = vec3f(dot(su.cx.xyz, nw), dot(su.cy.xyz, nw), dot(su.cz.xyz, nw));
    let eyeV = vec3f(su.sc.xy + su.ck.zw * 0.5, D);
    if (dot(nv, eyeV - v) < 0.0) { keys[i] = NONE; return; }
  }
  let dist = D - v.z;
  if (dist <= max(su.ck.y, 1.0)) { keys[i] = NONE; return; }
  // well off the viewport: not drawn (a generous margin: a large splat may reach in)
  let eye = su.ck.zw * 0.5;
  let scr = eye + (v.xy - su.sc.xy - eye) * (D / dist);
  let m = max(su.ck.z, su.ck.w) * 0.4 + 160.0;
  if (scr.x < -m || scr.y < -m || scr.x > su.ck.z + m || scr.y > su.ck.w + m) { keys[i] = NONE; return; }
  let key = 65535u - u32(clamp(dist / su.sc.z, 0.0, 1.0) * 65535.0);
  keys[i] = key;
  atomicAdd(&hist[key], 1u);
}

var<workgroup> part : array<u32, 256>;
@compute @workgroup_size(256)
fn cScan(@builtin(local_invocation_index) t : u32) {
  let base = t * 256u;
  var sum = 0u;
  for (var j = 0u; j < 256u; j++) { sum += atomicLoad(&hist[base + j]); }
  part[t] = sum;
  workgroupBarrier();
  for (var off = 1u; off < 256u; off = off << 1u) {
    var v = 0u;
    if (t >= off) { v = part[t - off]; }
    workgroupBarrier();
    part[t] += v;
    workgroupBarrier();
  }
  var run = part[t] - sum;
  for (var j = 0u; j < 256u; j++) {
    let c = atomicLoad(&hist[base + j]);
    atomicStore(&hist[base + j], run);
    run += c;
  }
  if (t == 255u) { args[0] = 6u; args[1] = part[255]; args[2] = 0u; args[3] = 0u; }
}

@compute @workgroup_size(256)
fn cScatter(@builtin(global_invocation_id) gid : vec3u) {
  let i = gid.x;
  if (i >= u32(su.head.y)) { return; }
  let k = keys[i];
  if (k == NONE) { return; }
  order[atomicAdd(&hist[k], 1u)] = i;
}
`;

/** the draw (the stage's frameWGSL goes first: group 0) */
export const splatDrawWGSL = /* wgsl */ `
@group(1) @binding(0) var<uniform> su : SUni;
@group(1) @binding(1) var<storage, read> sp : array<Splat>;
@group(1) @binding(2) var<storage, read> order : array<u32>;
${common}

struct VO {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,                        // the fragment in sigmas along the conic's axes
  @location(1) @interpolate(flat) col : vec4f,    // colour (sRGB-encoded), peak opacity
  @location(2) @interpolate(flat) k : vec2f,      // settle (solid 0..1), cut-off radius squared (sigmas)
  @location(3) @interpolate(flat) em : f32,       // the share of its alpha a lit tile gives up (emits as light)
};

fn spCorner(vi : u32) -> vec2f {
  let k = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u)[vi];
  return vec2f(f32(k & 1u) * 2.0 - 1.0, f32(k >> 1u) * 2.0 - 1.0);
}

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VO {
  var o : VO;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);
  o.uv = vec2f(0.0); o.col = vec4f(0.0); o.k = vec2f(0.0); o.em = 0.0;
  let i = order[ii];
  let s = spFind(i);
  if (s == NONE) { return o; }
  let S = su.sets[s];
  let P = sp[i];
  let k = spSettle(S, i);
  let pv = stageView(spWorld(S, spLocal(S, i, P.p.xyz, k)));
  let fade = stageFade(pv);
  if (fade <= 0.0) { return o; }
  let sc = stageScreenV(pv);
  let sS = sc.z;
  let dz = max(frame.cam.x - pv.z, 1.0);

  // the 3D covariance in view space: (C A R diag(sigma)) (C A R diag(sigma))^T; a scattered splat is a round point
  let sig = mix(vec3f(S.b.z / max(S.b.w, 1e-3)), P.s, k);
  let Rq = spQuat(P.q);
  let A = transpose(mat3x3f(S.m0.xyz, S.m1.xyz, S.m2.xyz));
  let C = transpose(mat3x3f(frame.camX.xyz, frame.camY.xyz, frame.camZ.xyz));
  let T = C * A * mat3x3f(Rq[0] * sig.x, Rq[1] * sig.y, Rq[2] * sig.z);
  let V = T * transpose(T);
  // through the Jacobian of stageScreenV: screen = eye + (v - eye) * D / (D - z)
  let ex = frame.view.xy * 0.5 + frame.cam.yz;
  let vxy = pv.xy - frame.view.zw;
  let j0 = vec3f(sS, 0.0, (vxy.x - ex.x) * sS / dz);
  let j1 = vec3f(0.0, sS, (vxy.y - ex.y) * sS / dz);
  var a = dot(j0, V * j0);
  let b = dot(j0, V * j1);
  var c = dot(j1, V * j1);
  let det0 = max(a * c - b * b, 0.0);
  // the stage's depth of field and a low-pass of 0.3 backing px^2; the energy kept
  let dpr = frame.backing.z;
  let coc = frame.cam.w * abs(pv.z - frame.depth.z) * sS;
  let lp = 0.3 / (dpr * dpr) + coc * coc;
  a += lp; c += lp;
  let det1 = max(a * c - b * b, 1e-8);
  // scattered, only one splat in POINTS_SHARE shows (the swarm is sparse); the rest come in as they settle
  let shown = max(select(0.0, 1.0, spHash(i, 4u).x < POINTS_SHARE), k * k);
  var alpha = P.p.w * mix(S.e.z, 1.0, k) * shown * S.a.w * su.head.w * fade * sqrt(det0 / det1);
  // no large soft discs in front of things (free camera): past camO.w css px of blur a splat fades out
  if (frame.camO.w > 0.0) { alpha *= 1.0 - smoothstep(frame.camO.w * 0.55, frame.camO.w, coc); }
  if (alpha * 255.0 < 1.0) { return o; }
  alpha = min(alpha, 0.995);
  // a surface (a block's tiles, a relief) settled: its tiles overlap their neighbours, so 2.2 sigma is enough (a third of
  // the fill of 3 sigma, the edge is the ring's); a capture keeps the whole gaussian
  let cut = min(select(3.0, mix(3.0, 2.2, k), S.c.w > 0.5), sqrt(2.0 * log(255.0 * alpha)));

  // the conic's axes
  let mid = 0.5 * (a + c);
  let rr = sqrt(max(0.25 * (a - c) * (a - c) + b * b, 0.0));
  let l1 = mid + rr;
  let l2 = max(mid - rr, 1e-6);
  var e1 = vec2f(1.0, 0.0);
  if (abs(b) > 1e-7) { e1 = normalize(vec2f(b, l1 - a)); } else if (c > a) { e1 = vec2f(0.0, 1.0); }
  let e2 = vec2f(-e1.y, e1.x);
  let r1 = sqrt(l1) * cut;
  let r2 = sqrt(l2) * cut;
  if (r1 > 1600.0) { return o; }
  // bounded fill, as the swarm's discs: a splat widened past its budget of backing px^2 (the depth of field) is kept with a
  // stable per-splat chance and the survivors carry the energy (a widened splat is faint: its alpha scales linearly)
  // the budget follows the splat's own sharp footprint, so a blurred surface costs about what it costs in focus
  let area = 3.1416 * r1 * r2 * dpr * dpr;
  let budget = max(BUDGET, 3.0 * 3.1416 * cut * cut * sqrt(det0) * dpr * dpr);
  if (area > budget) {
    let keep = budget / area;
    if (spHash(i, 5u).x >= keep) { return o; }
    alpha = min(alpha / keep, 0.995);
  }
  let cn = spCorner(vi);
  o.pos = stageClip(sc.xy + e1 * (cn.x * r1) + e2 * (cn.y * r2));
  o.uv = cn * cut;

  // the colour: a shaded tile (its smallest axis is its outward normal) or the capture's own colour; a scattered splat
  // is the swarm's light
  let alb = unpack4x8unorm(P.c).rgb;
  let nw = normalize(A * Rq[spAxis(P)]);
  let L = normalize(S.l.xyz);
  let dl = max(dot(nw, L), 0.0);
  let lit = clamp(S.l.w + (1.0 - S.l.w) * dl, 0.0, 1.0);
  let hv = normalize(C * L + vec3f(0.0, 0.0, 1.0));
  let spec = pow(max(dot(C * nw, hv), 0.0), 48.0) * S.e.w;
  var shade = frame.accentS.rgb * (0.32 + 0.4 * dot(alb, vec3f(0.3333)));
  if (S.f.w > 0.5) { shade = S.f.rgb * (0.15 + 0.85 * dot(alb, vec3f(0.3333))); }
  let solidC = min(mix(shade, alb, pow(lit, 0.6)) + spec * frame.paperS.rgb, vec3f(1.0));
  let surf = mix(alb, solidC, S.b.x);
  let pointC = mix(frame.accentS.rgb, frame.paperS.rgb, 0.4);
  o.col = vec4f(mix(pointC, surf, k), alpha);
  o.k = vec2f(k, cut * cut);
  o.em = select(0.0, clamp(S.f.w - 1.0, 0.0, 1.0) * pow(lit, 3.0) * S.b.x * k, S.f.w > 0.5);
  return o;
}

@fragment
fn fs(in : VO) -> @location(0) vec4f {
  let d2 = dot(in.uv, in.uv);
  if (d2 > in.k.y) { discard; }
  let a = in.col.a * exp(-0.5 * d2) * stageKeep(in.pos.xy);
  if (a < 1.0 / 255.0) { discard; }
  let nightK = stageNight(in.pos.xy);
  // night: the solid occludes; a scattered point adds light as the swarm's discs do (night alpha)
  let night = vec4f(in.col.rgb * a, a * mix(frame.band.y, 1.0, in.k.x) * (1.0 - in.em));
  // dawn: cobalt ink
  let day = vec4f(frame.accentS.rgb * mix(1.0, 0.72, in.k.x) * a, a);
  return mix(day, night, nightK);
}
`;

// @ts-check
/**
 * field.wgsl.js — THE FIELD's two draws (lane FIELD, round 11): the back wall in relief and the chips of cut glass,
 * both lit by up to four shafts of light. Starts after frameWGSL + noiseWGSL (the stage's space, camera, fade, keep-outs,
 * night and hashes); group 1 is the field's own (the uniform below, the shape atlas, its sampler, the depth window the
 * swarm uses: ZWin of draw.wgsl.js, mirrored here).
 *
 * Every position and direction in the uniform is in VIEW space (field.js turns the scene's free-camera space into it
 * each frame with the stage's camera), so the shaders never invert the camera. Light is added (premultiplied colour,
 * alpha 0), as the swarm's light is: nothing here darkens or lifts the night ground toward grey; inside a dawn
 * rectangle nothing is drawn (stageNight), nor over DOM text (stageKeep).
 *
 * The technique of the reference ("a parallax + normal map trick from game VFX"): a chip is one flat quad standing in
 * 3D, cut by a signed distance from the atlas; its cut edge is a bevel whose normal follows the distance's gradient
 * (the normal map), so a chip flashes its whole face when its own normal meets the half vector of a light and the eye,
 * and its edge glints at other angles. The wall's cells are tilted a little each (a normal per cell and a fine grain);
 * inside a light the grid is offset per cell along that tilt (the parallax), so the light's sweep reads as relief.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

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
  shapes: 31,   // shapes in use, blur cap (css px; 0 = the camera's bokeh), near size cap (css px), _
  wallP: 32,    // a point of the wall (VIEW), presence
  wallN: 33,    // its normal (VIEW, toward the eye), cell px
  wallU: 34,    // its in-plane axes (VIEW), line px
  wallV: 35,    //                          , relief (tilt of a cell)
  wallE: 36,    // extent half w, half h (px), unlit line level, displacement (px)
  wallL: 37,    // lit line, lit cell, specular, grain
  extra: 38,    // (round 12) chips' rim (cut edge toward paper 0..1), clear depth (VIEW z; a chip nearer than it inside
                // the clear rect is not drawn), clear on (0/1), _
  clear: 39,    // the clear rect (viewport css px): x0, y0, x1, y1
  wallK: 40,    // (wave 1, FIX3D) the wall and haze round the keep-outs: floor inside (0..1), fall (css px; 0 = the stage's
                // keep-out as before: a cut), haze floor, _
});
export const FIELD_SIZE = 41 * 16;
/** the atlas: CELLS cells of CELL px in one row; SPREAD px of distance on either side of an edge */
export const CELL = 128, CELLS = 4, SPREAD = 12;

export const fieldWGSL = /* wgsl */ `
// ---------------------------------------------------------------- the field
struct FieldU { v : array<vec4f, 41> };
@group(1) @binding(0) var<uniform> fu : FieldU;
@group(1) @binding(1) var atlas : texture_2d<f32>;
@group(1) @binding(2) var atlasS : sampler;
struct ZWin { a : vec4f, quad : array<vec4f, 12>, pl : array<vec4f, 12> };
@group(1) @binding(3) var<uniform> zwin : ZWin;

const CELLF : f32 = ${CELL}.0;
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

// (wave 1, FIX3D) the wall's answer to the keep-outs: with a fall set (wallK.y > 0) the wall is DIMMED round the kept
// text, to its floor inside the rect over a long soft fall, never cut out (a lit wall with a hole the size of a block
// of text read as a black card); with no fall it is the stage's keep-out, as before (the cover). floor: wallK.x for the
// wall, wallK.z for the haze.
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

// ---------------------------------------------------------------- THE WALL: an analytic plane, one fullscreen triangle
struct WOut { @builtin(position) pos : vec4f };

@vertex
fn vsWall(@builtin(vertex_index) vi : u32) -> WOut {
  var o : WOut;
  let p = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  return o;
}

// Ben Golus's pristine grid: crisp at any distance, it turns into the lines' mean cover where the cells get smaller
// than a pixel (no moire, no crawl)
fn pristine(g : vec2f, dg : vec2f, lw : f32) -> f32 {
  let w = vec2f(lw);
  let draw = clamp(w, dg, vec2f(0.5));
  let aa = dg * 1.5;
  let guv = 1.0 - abs(fract(g) * 2.0 - 1.0);
  var l = smoothstep(draw + aa, draw - aa, guv);
  l *= clamp(w / draw, vec2f(0.0), vec2f(1.0));
  l = mix(l, w, clamp(dg * 2.0 - 1.0, vec2f(0.0), vec2f(1.0)));
  return mix(l.x, 1.0, l.y);
}

@fragment
fn fsWall(in : WOut) -> @location(0) vec4f {
  let css = in.pos.xy / frame.backing.zw;
  let E = fieldEye();
  let rd = normalize(vec3f(css + frame.view.zw, 0.0) - E);
  let P = fu.v[32u];
  let N = fu.v[33u];
  let U = fu.v[34u];
  let V = fu.v[35u];
  let ext = fu.v[36u];
  let wl = fu.v[37u];
  let den = dot(rd, N.xyz);
  let ok = P.w > 0.0 && den < -1e-4;
  let t = select(-1.0, dot(P.xyz - E, N.xyz) / select(-1.0, den, abs(den) > 1e-6), ok);
  let hit = E + rd * max(t, 0.0);
  let pl = vec2f(dot(hit - P.xyz, U.xyz), dot(hit - P.xyz, V.xyz));
  // the light on the wall first: the displacement needs it, the derivatives need the final grid coordinate
  // (lane m-fly, run 3) each shaft once per pixel, kept for the colour below (it was traced twice, two pow each)
  var lit = 0.0;
  var li = array<f32, 4>(0.0, 0.0, 0.0, 0.0);
  let nl = min(u32(fu.v[0u].y), 4u);
  for (var i = 0u; i < nl; i++) { let I = shaft(i, hit) * fu.v[5u + i * 5u].z; li[i] = I; lit += I; }
  let cell = max(N.w, 4.0);
  let g0 = pl / cell;
  let id = floor(g0);
  let hc = hash3u(vec3u(bitcast<vec2u>(vec2i(id)), 0x7a11u));
  let tilt = (hc.xy * 2.0 - 1.0) * V.w;
  // the parallax: inside a light each cell's lines move a little along its own tilt (stepwise, cell by cell: relief)
  let g = g0 + tilt * (ext.w / cell) * min(lit, 1.5);
  let dg = max(fwidth(g), vec2f(1e-5));
  let line = pristine(g, dg, U.w / cell);
  if (!ok) { discard; }
  // the extent: a soft fall to nothing (no visible edge, no horizon), the lens and the fog of the hall
  let q = pl / max(ext.xy, vec2f(1.0));
  let fall = 1.0 - smoothstep(0.45, 1.0, length(q));
  let fade = stageFade(hit) * fall * P.w;
  let mask = wallKeep(in.pos.xy, fu.v[40u].x) * stageNight(in.pos.xy);
  if (fade * mask <= 0.0) { discard; }
  // unlit: the grid is barely there, thin cobalt
  var col = frame.accentS.rgb * line * ext.z;
  // (lane m-fly, run 3) the relief's normal shades only the light that reaches the wall: where no shaft does (most of
  // the wall), the grain's noise is not computed at all. The same picture
  if (lit > 0.0) {
  // the relief's normal: the cell's tilt and a fine grain (gone where the cells are small on screen)
  // (a smooth gradient noise, never a mosaic of little squares)
  let fine = noised(vec3f(g0 * 5.0, 3.7)).yz * 0.35;
  let grain = fine * wl.w * (1.0 - smoothstep(0.04, 0.2, max(dg.x, dg.y)));
  let nloc = normalize(vec3f(tilt + grain, 1.0));
  let n = normalize(U.xyz * nloc.x + V.xyz * nloc.y + N.xyz * nloc.z);
  for (var i = 0u; i < nl; i++) {
    let I = li[i];
    if (I <= 0.0) { continue; }
    let o = fu.v[2u + i * 5u];
    let c = fu.v[4u + i * 5u];
    let L = normalize(o.xyz - hit);
    let diff = 0.3 + 0.7 * max(dot(n, L), 0.0);
    let H = normalize(L - rd);
    let sp = pow(max(dot(n, H), 0.0), 48.0);
    col += c.rgb * I * (diff * mix(wl.y, wl.x, line) + wl.z * sp * (0.35 + 0.65 * line));
  }
  }
  // a shoulder: where two shafts overlap or the camera comes close the wall saturates softly, never to a burnt white
  col = col / (1.0 + 0.8 * col);
  // (wave 6) the grain of one 8-bit step where there is light (frame.wgsl.js): no bands in the shafts' fall on the wall
  return vec4f(stageGrainLight(col * fade * mask, in.pos.xy), 0.0);
}

// The haze: a shaft's own light in the air (haze > 0), the ray's closest approach to the shaft's axis, stopped by the
// wall. Drawn in the wall's pass (one fullscreen triangle).
@fragment
fn fsHaze(in : WOut) -> @location(0) vec4f {
  let css = in.pos.xy / frame.backing.zw;
  let E = fieldEye();
  let rd = normalize(vec3f(css + frame.view.zw, 0.0) - E);
  let P = fu.v[32u];
  let N = fu.v[33u];
  let den = dot(rd, N.xyz);
  let tw = select(1e9, dot(P.xyz - E, N.xyz) / den, P.w > 0.0 && den < -1e-4);
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

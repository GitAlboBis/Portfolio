// @ts-check
/**
 * orrery.wgsl.js — the orrery's two draws (wave 8, lane ORRERY). The stage's frameWGSL goes first (group 0: the camera,
 * the lens, the fog, the clock, the keep-outs, the dawn).
 *
 *  - the sprites: every point of the mark and of the nine bodies as a small gaussian disc of light, the same light as
 *    the swarm's (stage/wgsl/draw.wgsl.js): its energy kept when the lens widens it, cobalt where it is thin and paper
 *    white where it is dense or sharp (lookNight), added to the night (alpha = the night's own), the stage's stochastic
 *    rounding to the 8-bit canvas, never over a keep-out or in the dawn (taken per sprite: a sprite is a few px and the
 *    keep-out's own feather is its fall), faded by the lens and the fog, gone past the stage's cap on blur discs.
 *  - the words: one textured quad a word, paper white, added, snapped to the backing grid (type stays sharp).
 * Nothing here keeps a state: what moves is a function of the stage's clock (frame.clock.x, and what orrery.js works
 * out from ctx.time every frame).
 * (run B) No dust across the system any more: a body condenses out of its OWN scatter, inside one and a half of its
 * size, and before it starts it is not there. The mark takes no share of the stage's lens (far down the hall it is the
 * small sharp mark, never a soft round dot) and its motes come in only once it is large enough to carry them.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

export const MAX_BODIES = 10;
export const MAX_LABELS = 10;
/** floats: the head (6 vec4) and a body (5 vec4) */
export const HEAD_F = 24, BODY_F = 20;
export const UNI_F = HEAD_F + MAX_BODIES * BODY_F;
/** floats: the labels' head (1 vec4) and a label (3 vec4) */
export const LHEAD_F = 4, LAB_F = 12;
export const LUNI_F = LHEAD_F + MAX_LABELS * LAB_F;

export const orreryWGSL = /* wgsl */ `
// ---------------------------------------------------------------- the orrery: sprites
struct OBody {
  r0 : vec4f,   // the body's turn x its size (css px a unit), row 0; w: its place, world x
  r1 : vec4f,
  r2 : vec4f,
  q  : vec4f,   // what moves inside it, two numbers (orrery.js); its mode; how far it has condensed 0..1
  v  : vec4f,   // its light, white added, two more numbers of its mode (the mark: its share of the stage's lens, its motes' light)
};
struct OUni {
  head : vec4f,   // bodies, the tier's ink, the tier's size, the whole figure's presence
  sys  : vec4f,   // the system's centre (world), 0
  scat : vec4f,   // a condensing point's sigma (css px at the page plane), 0, 0, the spores' light
  lens : vec4f,   // the figure's own depth of field (of the stage's aperture), the stage's own share, its focus (view z), flash
  band : vec4f,   // the mark's band of light: its place, width, slant, strength
  misc : vec4f,   // time, the spores' breath (css px at the page plane), their slide (css px), the hand's push 0..1
  b    : array<OBody, ${MAX_BODIES}>,
};
struct OPt {
  a : vec4f,   // x y z (units), sigma (units)
  n : vec4f,   // a spore's normal or a scattered point's offset; ink
  c : vec4f,   // white, u along its path, seed, flags (body + 16 kind + 128 part)
};
@group(1) @binding(0) var<uniform> U : OUni;
@group(1) @binding(1) var<storage, read> pts : array<OPt>;

struct OV {
  @builtin(position) pos : vec4f,
  @location(0) q : vec2f,                        // css px from the disc's centre
  @location(1) @interpolate(flat) prm : vec4f,   // sigma (css px), peak, white, focus
  @location(2) @interpolate(flat) iid : u32,
};

const O_SPAN : f32 = 2.4;
// toward the key light, in the view's own space (x right, y down, z toward the eye): up, left and in front, a unit
const O_KEY : vec3f = vec3f(-0.48, -0.60, 0.64);

fn oPcg(v : u32) -> u32 {
  var x = v * 747796405u + 2891336453u;
  x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u;
  return (x >> 22u) ^ x;
}
fn oH(i : u32, k : u32) -> f32 { return f32(oPcg(i * 16u + k) >> 8u) / 16777216.0; }

// 1 clear of every keep-out, 0 on one, the keep-out's own feather between (css px, the sprite's centre)
fn oKeep(css : vec2f) -> f32 {
  var k = 1.0;
  let n = frame.count.z;
  for (var i = 0u; i < n; i++) {
    let r = frame.keep[i];
    let q = max(max(r.xy - css, css - r.zw), vec2f(0.0));
    k *= smoothstep(0.0, max(frame.lookDay.y, 1.0), length(q));
  }
  return k;
}

@vertex
fn vsO(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> OV {
  var o : OV;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);
  o.q = vec2f(0.0);
  o.prm = vec4f(0.0);
  o.iid = ii;
  let P = pts[ii];
  let fl = u32(P.c.w);
  let bi = fl & 15u;
  let kind = (fl >> 4u) & 7u;
  let part = (fl >> 7u) & 31u;
  let B = U.b[bi];
  var ink = P.n.w * B.v.x;
  if (ink <= 0.0) { return o; }
  var l = P.a.xyz;
  var white = P.c.x + B.v.y;
  var size = P.a.w;
  let mode = u32(B.q.z);
  let t = U.misc.x;
  let scale = max(length(B.r0.xyz), 1e-3);

  // ---- what moves inside a body
  if (mode == 1u) {
    // a cube taken apart: the part's low three bits are its block's octant, bit 3 the block pulled further out
    let sg = vec3f(f32(part & 1u), f32((part >> 1u) & 1u), f32((part >> 2u) & 1u)) * 2.0 - 1.0;
    l += sg * B.q.x * select(1.0, B.q.y, (part & 8u) != 0u);
  } else if (mode == 2u) {
    // three slabs: the gaps breathe
    l.y += (f32(part) - 1.0) * B.q.x;
  } else if (mode == 3u) {
    // the clapper's stick turns about its hinge
    if (part == 1u) {
      let d = l.xy - B.v.zw;
      let ca = cos(B.q.x);
      let sa = sin(B.q.x);
      l = vec3f(B.v.z + d.x * ca + d.y * sa, B.v.w - d.x * sa + d.y * ca, l.z);
    }
  } else if (mode == 4u) {
    // scattered points resolve into rows across the frame: scattered left of the front, in their rows right of it
    if (kind == 0u && part == 1u) {
      let sk = 1.0 - smoothstep(B.q.x - 0.26, B.q.x + 0.26, l.x);
      l += P.n.xyz * sk;
      ink *= mix(1.0, 0.5, sk);
      white *= mix(1.0, 0.3, sk);
    }
  } else if (mode == 5u) {
    // a glint runs the path (B.q.x its place along it, B.q.y its strength, B.v.z its width, B.v.w 1: the path is a ring)
    if (kind == 2u) {
      var d = abs(P.c.y - B.q.x);
      if (B.v.w > 0.5) { d = min(d, 1.0 - d); }
      let g = exp(-(d * d) / (B.v.z * B.v.z));
      ink *= 1.0 + B.q.y * g;
      white += 0.7 * g * min(B.q.y, 1.0);
    }
  } else if (mode == 6u) {
    // the cursor blinks
    if (part == 1u) { ink *= B.q.x; }
  } else if (mode == 7u) {
    // the mark: a band of light crosses it now and then; a press flashes its core
    let x = l.x + U.band.z * l.y - U.band.x;
    let g = exp(-(x * x) / (U.band.y * U.band.y)) * U.band.w;
    // (the lead) a lit solid has highlights of its own: the band is a breath of light across it, not a white stroke
    ink *= 1.0 + 0.55 * g + U.lens.w * (0.25 + 0.5 * P.c.x);
    white += 0.3 * g + 0.3 * U.lens.w;
  }

  // ---- the spores: a mote hovers off the form, breathes along its normal and slides along the form, on its own phase
  if (kind == 1u) {
    ink *= U.scat.w;
    // the mark's motes only once the mark is large enough on screen to carry them (under that they are fog round a speck)
    if (mode == 7u) { ink *= B.v.w; }
    if (ink <= 0.0) { return o; }
    let ph = P.c.z * 6.2832;
    let nr = P.n.xyz;
    let tg = normalize(cross(nr, vec3f(0.31, 0.63, 0.71)) + vec3f(1e-4, 0.0, 0.0));
    l += (nr * (U.misc.y * (0.5 + 0.5 * sin(t * (0.45 + 0.6 * P.c.y) + ph))) + tg * (U.misc.z * sin(t * (0.21 + 0.3 * P.c.z) + ph * 1.7))) / scale;
    size *= 1.0 + 0.16 * sin(t * 0.7 + ph * 2.3);
    // the hand: the motes under it lift off the form and light up (the mark's own crust is blown off it: further down)
    if (U.misc.w > 0.0 && mode != 7u) {
      let s0 = stageScreen(vec3f(dot(B.r0.xyz, l) + B.r0.w, dot(B.r1.xyz, l) + B.r1.w, dot(B.r2.xyz, l) + B.r2.w));
      let dp = (s0.xy - frame.pointer.xy) / 52.0;
      let push = U.misc.w * exp(-dot(dp, dp));
      l += nr * (9.0 * push / scale);
      ink *= 1.0 + 1.6 * push;
      white += 0.35 * push;
    }
  }

  var w = vec3f(dot(B.r0.xyz, l) + B.r0.w, dot(B.r1.xyz, l) + B.r1.w, dot(B.r2.xyz, l) + B.r2.w);
  var sig = size * scale;

  // ---- the arrival: a body condenses out of its OWN scatter, a cloud one and a half of its size round its own place,
  // each point in its turn (a function of the scroll: it reverses). Before it starts the body is not there: no dust
  // across the system, no band, no cloud round the mark
  let c = B.q.w;
  if (c < 1.0) {
    let st = oH(ii, 8u) * 0.5;
    let e = smoothstep(st, st + 0.5, c);
    if (e <= 0.0) { return o; }
    let h = vec3f(oH(ii, 1u) + oH(ii, 2u), oH(ii, 3u) + oH(ii, 4u), oH(ii, 5u) + oH(ii, 6u)) - 1.0;
    let home = vec3f(B.r0.w, B.r1.w, B.r2.w);
    w = mix(home + h * (0.75 * scale), w, e);
    ink *= e * e;
    sig = mix(U.scat.x, sig, e);
    white *= e;
  }

  // ---- the stage's camera, lens and fog
  var pv = stageView(w);

  // ---- THE MARK IS A SOLID OF GRAINS, lit by one key light from up, left and in front (O_KEY). A grain of the cut
  // carries a normal (its face's own facet, the cut edge's chamfer, the wall's way out): what faces away from the eye
  // is not there (a solid, never a cage of contours), what faces the light is paper white, what faces away the deep
  // cobalt, and a facet that throws the key light straight at the eye glints. A mote takes the light of the side it
  // hovers off. Then the hand: round it the crust is blown off the form and the core under it shows hot
  if (mode == 7u) {
    let eye = frame.view.xy * 0.5 + frame.cam.yz;
    let vv = normalize(vec3f(eye - (pv.xy - frame.view.zw), frame.cam.x - pv.z));
    let nl = P.n.xyz;
    if (dot(nl, nl) > 0.25) {
      let nw = vec3f(dot(B.r0.xyz, nl), dot(B.r1.xyz, nl), dot(B.r2.xyz, nl)) / scale;
      let nv = normalize(vec3f(dot(frame.camX.xyz, nw), dot(frame.camY.xyz, nw), dot(frame.camZ.xyz, nw)));
      let ndl = max(dot(nv, O_KEY), 0.0);
      if (kind == 0u) {
        let seen = smoothstep(-0.02, 0.2, dot(nv, vv));
        if (nl.z > 0.3 && nl.z < 0.75) {
          // the cut edge: all light where it faces the key, all but gone where it faces away (so the cut reads as a
          // cut in a solid, never as an outline drawn round a flat sign)
          ink *= seen * (0.08 + 1.5 * ndl * ndl);
          white += 0.5 * (ndl - 0.5);
        } else {
          // a face's grain or a wall's: the key light by its facet, a soft sheen, and now and then a glint: the few
          // facets that throw the key straight at the eye, paper white for as long as they do (a grain's own size:
          // larger, they read as bubbles)
          let nh = max(dot(nv, normalize(O_KEY + vv)), 0.0);
          let sheen = pow(nh, 12.0);
          let glint = pow(nh, 400.0);
          ink *= seen * (0.5 + 0.8 * ndl + 0.4 * sheen + 9.0 * glint);
          white += 0.5 * (ndl - 0.55) + 0.2 * sheen + glint;
        }
      } else {
        ink *= 0.5 + 0.9 * ndl;
        white += 0.3 * (ndl - 0.4);
      }
    }
    if (U.misc.w > 0.0) {
      let s0 = stageScreenV(pv);
      let dv = s0.xy - frame.pointer.xy;
      let d = length(dv);
      let rb = max(B.q.x * s0.z, 1.0);
      let bare = U.misc.w * (1.0 - smoothstep(0.0, rb, d));
      if (bare > 0.0) {
        if (kind == 1u) {
          // each mote its own flight (many a little, few far): out from the hand and a little off the straight way
          // out, toward the eye, dragged along the hand's own way; alight while it flies
          let h1 = oH(ii, 11u);
          let f = bare * (0.2 + 0.8 * h1 * h1);
          let an = (oH(ii, 12u) - 0.5) * 1.6;
          let dr = dv / max(d, 0.5);
          let dir = vec2f(dr.x * cos(an) - dr.y * sin(an), dr.x * sin(an) + dr.y * cos(an));
          let pl = length(frame.pointerV.xy);
          let drag = frame.pointerV.xy * (min(pl, 900.0) / max(pl, 1.0)) * 0.05;
          pv += vec3f((dir * (0.65 * rb) + drag) * (f / s0.z), 0.5 * rb * f / s0.z);
          ink *= 1.0 + 1.3 * f;
          white += 0.4 * f;
        } else {
          // the core under the hand: hotter, never a flat white (its grain stays)
          let hot = bare * bare;
          ink *= 1.0 + 0.5 * hot;
          white += 0.3 * hot;
        }
      }
    }
    if (ink <= 0.0) { return o; }
  }

  let fade = stageFade(pv);
  if (fade <= 0.0) { return o; }
  let sc = stageScreenV(pv);
  let s = sc.z;
  let dpr = frame.backing.z;
  let rq = max(sig * s * U.head.z, 0.05);
  let r0 = max(rq, 0.62 / dpr);
  // the depth of field: far away the stage's own lens (never on the mark: B.v.z); in place a gentle one of the
  // figure's own, sharpest on the near arc
  let cf = (pv.z - frame.depth.z) * U.lens.y * select(1.0, B.v.z, mode == 7u);
  let co = (pv.z - U.lens.z) * U.lens.x;
  let coc = frame.cam.w * sqrt(cf * cf + co * co) * s;
  let sg = min(sqrt(r0 * r0 + coc * coc), frame.depth.w);
  var peak = ink * U.head.y * U.head.w * fade * (rq * rq) / (sg * sg);
  if (frame.camO.w > 0.0) { peak *= 1.0 - smoothstep(frame.camO.w * 0.55, frame.camO.w, sg); }
  peak *= oKeep(sc.xy) * (1.0 - stageDawnAt(sc.xy, 1.0));
  if (peak < 1.0 / 4096.0) { return o; }

  // bounded fill, as the swarm's discs: a disc the lens widened past its budget is kept by chance, the kept carry the light
  let ext = O_SPAN * sg;
  let area = 4.0 * ext * ext * dpr * dpr;
  let budget = 700.0;
  if (area > budget) {
    let keep = budget / area;
    if (oH(ii, 9u) >= keep) { return o; }
    peak /= keep;
  }
  let cn = vec2f(f32(vi & 1u) * 2.0 - 1.0, f32(vi >> 1u) * 2.0 - 1.0) * ext;
  o.pos = stageClip(sc.xy + cn);
  o.q = cn;
  o.prm = vec4f(sg, peak, clamp(white, 0.0, 1.0), r0 * r0 / (sg * sg));
  return o;
}

@fragment
fn fsO(i : OV) -> @location(0) vec4f {
  let d2 = dot(i.q, i.q) / (i.prm.x * i.prm.x);
  if (d2 > O_SPAN * O_SPAN) { discard; }
  let g = exp(-0.5 * d2);
  let e = i.prm.y * g * frame.lookNight.x;
  if (e < 1.0 / 65536.0) { discard; }
  // the swarm's law: every disc carries a little paper white in its cobalt, more when it is sharp, so a pile of them
  // goes to white before any one channel clips into neon; a point of the hot face is paper white already
  let w = clamp(i.prm.z + (1.0 - i.prm.z) * (frame.lookNight.z + frame.lookNight.y * i.prm.w * g), 0.0, 1.0);
  let col = min(mix(frame.accentS.rgb, frame.paperS.rgb, w) * e, vec3f(frame.band.w));
  var out = vec4f(col, min(e, 1.0) * frame.band.y);
  let hv = f32(oPcg((u32(i.pos.x) * 1973u) ^ (u32(i.pos.y) * 9277u) ^ (i.iid * 26699u)) >> 8u) / 16777216.0;
  let qd = floor(out * 255.0 + vec4f(hv)) / 255.0;
  out = mix(out, qd, frame.lookDay.w);
  if (max(out.r, max(out.g, out.b)) <= 0.0) { discard; }
  return out;
}
`;

export const labelWGSL = /* wgsl */ `
// ---------------------------------------------------------------- the orrery: words
struct OLab {
  a  : vec4f,   // the body's place (world), the word's presence 0..1
  b  : vec4f,   // the word's width, height (css px), its top left from the body's place on screen (css px)
  uv : vec4f,   // its rectangle in the atlas
};
struct OLabs {
  par : vec4f,  // kept for what a word may need next (0)
  l   : array<OLab, ${MAX_LABELS}>,
};
@group(1) @binding(0) var<uniform> LU : OLabs;
@group(1) @binding(1) var lTex : texture_2d<f32>;
@group(1) @binding(2) var lSmp : sampler;

struct LV {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
  @location(1) @interpolate(flat) a : f32,
};

@vertex
fn vsL(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> LV {
  var o : LV;
  o.pos = vec4f(4.0, 4.0, 0.0, 1.0);
  o.uv = vec2f(0.0);
  o.a = 0.0;
  let L = LU.l[ii];
  if (L.a.w <= 0.004) { return o; }
  let pv = stageView(L.a.xyz);
  let fade = stageFade(pv);
  if (fade <= 0.0) { return o; }
  let sc = stageScreenV(pv);
  // where orrery.js stood it (layout.js orreryWords: clear of every body, of the mark and of every other word), from
  // its body's place on screen; on the backing grid: a texel of the atlas is a pixel of the canvas
  let dpr = frame.backing.zw;
  let p0 = floor((sc.xy + L.b.zw) * dpr + vec2f(0.5)) / dpr;
  let k = vec2f(f32(vi & 1u), f32(vi >> 1u));
  o.pos = stageClip(p0 + k * L.b.xy);
  o.uv = mix(L.uv.xy, L.uv.zw, k);
  o.a = L.a.w * fade;
  return o;
}

@fragment
fn fsL(i : LV) -> @location(0) vec4f {
  let cov = textureSampleLevel(lTex, lSmp, i.uv, 0.0).r;
  let e = cov * i.a * stageNight(i.pos.xy);
  if (e < 1.0 / 255.0) { discard; }
  return vec4f(min(frame.paperS.rgb * e, vec3f(frame.band.w)), e * frame.band.y);
}
`;

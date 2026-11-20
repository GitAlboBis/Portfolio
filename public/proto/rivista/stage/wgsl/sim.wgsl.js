// @ts-check
/**
 * sim.wgsl.js — the one compute pass that integrates every particle (spec 3.3).
 *
 * A particle is two vec4f: p = (position xyz, ink) and v = (velocity xyz, radius). Everything else
 * about it is derived from its index: which formation it belongs to (rank), which target it takes
 * (u), where it sits in a strand of mist (s, w) and its small personal constants (two hashes).
 * rank, u, s and w are the four axes of a low-discrepancy sequence, so any share of the particles
 * covers any formation evenly, and a share that grows or shrinks moves only the particles at its
 * border: a change of weights is a migration.
 *
 * Forces: a spring to the target (speed-capped, so far travel is a stream), the curl flow, the
 * reader's hand, the wind of the scroll, damping through a short inertia.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */

/** Fixed-point multipliers of the R4 sequence (fract(i * alpha_k) as i * round(alpha_k * 2^32), all odd). */
export const R4 = Object.freeze([3679390609, 3152041523, 2700274807, 2313257605]);

/** Bytes of one Slot in the Slots uniform (13 vec4f). */
export const SLOT_SIZE = 13 * 16;

export const simWGSL = /* wgsl */ `
// ---------------------------------------------------------------- simulation
struct Particle {
  p : vec4f,   // position (document px, z toward the reader), ink (peak optical depth)
  v : vec4f,   // velocity (px / s), radius (css px)
};

struct Slot {
  ax    : vec4f,   // local x axis in world px, w = rank lo
  ay    : vec4f,   // local y axis, w = rank hi
  az    : vec4f,   // local z axis, w = fill (share of its strands that take a target)
  org   : vec4f,   // world origin, w = emit (< 0 fly in, 0 appear on the target, 1 leave the spawn point)
  spawn : vec4f,   // spawn point (world), w = spawn radius (px)
  tgt   : vec4f,   // first target, count, path length (0 = a cloud of points), shift (targets)
  rev   : vec4f,   // reveal lo, hi (normalised index), feather, closed paths 0 | 1
  dyn   : vec4f,   // spring (1 / s), top speed (px / s), inertia (s), fuzz (px)
  flow  : vec4f,   // flow (px / s), wavelength (px), evolution (1 / s), z factor
  look  : vec4f,   // ink, radius (css px), ink of its free strands, their radius
  resp  : vec4f,   // response to the hand, to the wind, fade in (1 / s), fade out (1 / s)
  tails : vec4f,   // share of its bound particles that are tails, tail length (px), emitters, curl 0..1
  carry : vec4f,   // how far the formation's box moved since the last simulated frame (document px), w = _
};

struct Slots { s : array<Slot, 4> };

@group(1) @binding(0) var<uniform> slots : Slots;
@group(1) @binding(1) var<storage, read_write> parts : array<Particle>;
@group(1) @binding(2) var<storage, read> targets : array<vec4f>;

const R4_0 : u32 = ${R4[0]}u;
const R4_1 : u32 = ${R4[1]}u;
const R4_2 : u32 = ${R4[2]}u;
const R4_3 : u32 = ${R4[3]}u;
const INV24 : f32 = 1.0 / 16777216.0;
const GONE : f32 = 2e-4;

struct Tg {
  t : vec4f,   // local position, ink
  n : f32,     // normalised index of the target it rides (the reveal key)
};

// The target a particle takes in a formation. u spreads the particles evenly over the set; on a
// path they also fill the gaps between consecutive targets, so a few hundred targets draw a
// continuous thread.
fn slotTarget(S : Slot, u : f32) -> Tg {
  let off = u32(S.tgt.x);
  let cnt = S.tgt.y;
  let seg = S.tgt.z;
  let shift = S.tgt.w;
  let f = min(u * cnt, cnt - 0.001);
  var o : Tg;
  if (seg < 2.0) {
    var j = floor(f) + floor(shift);
    j = j - floor(j / cnt) * cnt;
    o.t = targets[off + u32(j)];
    o.n = (j + 0.5) / cnt;
    return o;
  }
  let base = floor(f / seg) * seg;
  var ja : f32;
  var jb : f32;
  var l : f32;
  if (S.rev.w > 0.5) {
    l = f - base + shift;
    l = l - floor(l / seg) * seg;
    ja = min(floor(l), seg - 1.0);
    jb = ja + 1.0;
    if (jb >= seg) { jb = 0.0; }
  } else {
    let span = seg - 1.0;
    l = (f - base) / seg * span + shift;
    l = l - floor(l / span) * span;
    ja = min(floor(l), span - 1.0);
    jb = ja + 1.0;
  }
  let fr = clamp(l - ja, 0.0, 1.0);
  let A = targets[off + u32(base + ja)];
  let B = targets[off + u32(base + jb)];
  o.t = mix(A, B, fr);
  o.n = (base + ja + fr) / cnt;
  return o;
}

struct Strand {
  pos : vec3f,   // where the particle sits on its strand (document px)
  per : vec2f,   // the lattice period at this strand's depth
  ink : f32,     // taper along the strand
};

// A strand of mist: a small bundle of threads, at its own depth and slope, that opens like a
// plume along its length. Strands repeat in a lattice a little larger than the view at their
// depth, so the mist follows the reader down the page and never runs out.
fn freeStrand(g : u32, s : f32, w : f32, hg : vec3f) -> Strand {
  let h1 = hash3u(vec3u(g, 0x2du, 0x77u));
  let h2 = hash3u(vec3u(g, 0x63u, 0x0bu));
  let D = frame.cam.x;
  // most strands near the page, a tail far behind it, a few close to the lens
  let t = h1.z * 2.0 - 1.0;
  let c = sign(t) * pow(abs(t), 1.7);
  let z0 = frame.depth.z + select(c * frame.depth.y, -c * frame.depth.x, c < 0.0);
  let blur = abs(z0 - frame.depth.z);
  let L = mix(230.0, 520.0, h2.z) * (1.0 + blur / 380.0);
  let slope = (h2.y - 0.5) * 0.8;
  let zmin = z0 - 0.5 * L * abs(slope) - 80.0;
  let per = frame.view.xy * ((D - zmin) / D) + vec2f(280.0);
  let ang = (h2.x - 0.5) * 2.3 + 1.5708 + step(0.5, hg.z) * 3.14159;
  let dir = normalize(vec3f(cos(ang), sin(ang), slope));
  let side = vec3f(-dir.y, dir.x, 0.0) / max(length(dir.xy), 1e-3);
  let K = 1.0 + floor(hg.x * 3.0);
  let k = min(floor(w * K), K - 1.0);
  let hk = hash3u(vec3u(g, u32(k), 0x91u));
  let open = 0.2 + 1.6 * s * s;
  let across = (k - (K - 1.0) * 0.5) * (5.0 + 10.0 * hk.x) * open + (w * K - k - 0.5) * 0.7;
  let bow = sin(s * 3.14159) * (h1.x - 0.5) * 110.0;
  var p = vec3f(h1.xy * per, z0) + dir * ((s - 0.5) * L) + side * (across + bow);
  p.z += (hk.z - 0.5) * 44.0;
  var o : Strand;
  o.pos = p;
  o.per = per;
  o.ink = pow(max(sin(s * 3.14159), 0.0), 0.6) * (0.55 + 0.9 * hk.y);
  return o;
}

// The reader's hand in the ink, as a velocity (document px / s). A moving hand drags the ink it
// touches and the ink it pushes aside curls back behind it; a pressed one stirs.
fn handFlow(pos : vec3f) -> vec3f {
  if (frame.pointer.w < 0.5) { return vec3f(0.0); }
  let sc = stageScreen(pos);
  let dp = sc.xy - frame.pointer.xy;
  let R = frame.pointerV.z;
  let r2 = dot(dp, dp);
  let fall = exp(-r2 / (R * R));
  if (fall < 0.003) { return vec3f(0.0); }
  let r = sqrt(r2) + 1e-3;
  let n = dp / r;
  let tng = vec2f(-n.y, n.x);
  let U = frame.pointerV.xy;
  let sideways = U.x * n.y - U.y * n.x;
  var v = U * (fall * 0.5) + tng * (sideways * fall * 0.85 * smoothstep(0.0, R * 0.3, r));
  v += (tng * 210.0 + n * 70.0) * (frame.pointer.z * fall);
  return vec3f(v / sc.z, 0.0) * frame.pointerV.w;
}

@compute @workgroup_size(64)
fn sim(@builtin(global_invocation_id) gid : vec3u) {
  let i = gid.x;
  if (i >= frame.count.x) { return; }
  let dt = frame.clock.y;
  let P = parts[i];
  var pos = P.p.xyz;
  var ink = P.p.w;
  var vel = P.v.xyz;
  var size = P.v.w;

  let rank = f32((i * R4_0) >> 8u) * INV24;
  let u = f32((i * R4_1) >> 8u) * INV24;
  let cs = f32((i * R4_2) >> 8u) * INV24;
  let cw = f32((i * R4_3) >> 8u) * INV24;
  let hp = hash3u(vec3u(i, 0x9e37u, 0x79b9u));
  let hq = hash3u(vec3u(i, 0x85ebu, 0xc2b2u));

  var si = 4u;
  for (var k = 0u; k < 4u; k++) {
    if (rank >= slots.s[k].ax.w && rank < slots.s[k].ay.w) { si = k; }
  }
  let g = u32(floor(rank * max(frame.free.x, 1.0)));
  let hg = hash3u(vec3u(g, 0x51u, 0x1fu));

  // what this particle is asked to be this frame: by default a strand of the ambient mist
  var tgt = vec3f(0.0);
  var wantInk = frame.wind.w;
  var wantSize = frame.free.y;
  var spring = frame.free2.x;
  var vmax = 520.0;
  var inertia = frame.free2.y;
  var famp = frame.free.z;
  var fwl = frame.free.w;
  var fspd = frame.free2.z;
  var fz = frame.free2.w;
  var hand = 1.0;
  var windK = 1.0;
  var up = 1.5;
  var dn = 2.2;
  var emit = 0.0;
  var spawn = vec3f(0.0);
  var spawnR = 0.0;
  var bound = false;
  var tail = 0.0;

  if (si < 4u) {
    let S = slots.s[si];
    hand = S.resp.x;
    windK = S.resp.y;
    up = S.resp.z;
    dn = S.resp.w;
    wantInk = S.look.z;
    wantSize = S.look.w;
    if (S.tgt.y >= 1.0 && hg.y < S.az.w) {
      bound = true;
      // tails: a share of the members leave from a few emitter points of the shape and lie along
      // the flow downstream of it, many per emitter, so they draw tendrils: ink leaving a shape
      let isTail = hq.x < S.tails.x;
      var uu = u;
      if (isTail) { uu = (floor(u * S.tails.z) + 0.5) / max(S.tails.z, 1.0); }
      let T = slotTarget(S, uu);
      let shown = smoothstep(S.rev.x - S.rev.z, S.rev.x, T.n) * (1.0 - smoothstep(S.rev.y, S.rev.y + S.rev.z, T.n));
      let stray = hq.y * hq.y * hq.y;
      tgt = S.org.xyz + S.ax.xyz * T.t.x + S.ay.xyz * T.t.y + S.az.xyz * T.t.z
          + (hp * 2.0 - 1.0) * (S.dyn.w * (0.35 + 1.4 * stray));
      var tInk = 1.0;
      if (isTail) {
        let s = hq.z;
        tail = S.tails.y * s;
        tInk = (1.0 - s) * 0.95 + 0.12;
      }
      wantInk = S.look.x * T.t.w * shown * (0.85 + 0.3 * hq.y) * tInk;
      wantSize = S.look.y * (0.85 + 0.3 * hq.z + 0.8 * stray);
      spring = S.dyn.x * (0.65 + 0.7 * hp.x);
      vmax = S.dyn.y * (0.55 + 0.9 * hp.y);
      inertia = S.dyn.z;
      famp = S.flow.x;
      fwl = S.flow.y;
      fspd = S.flow.z;
      fz = S.flow.w;
      emit = S.org.w;
      spawn = S.spawn.xyz;
      spawnR = S.spawn.w;
      // the box moved (a sticky figure while the page scrolls): the ink inside it moves with it, so the figure
      // never trails behind its own box; only a change of shape is left to the spring
      if (ink >= GONE) { pos += S.carry.xyz; }
    }
  }

  if (!bound) {
    let F = freeStrand(g, cs, cw, hg);
    // the particle stays in the window around the view centre: the jump is off screen
    let ctr = frame.view.zw + frame.view.xy * 0.5;
    pos = vec3f(pos.xy - round((pos.xy - ctr) / F.per) * F.per, pos.z);
    tgt = vec3f(F.pos.xy + round((pos.xy - F.pos.xy) / F.per) * F.per, F.pos.z);
    // the mist gathers: a slow field over the page decides where it is thick and where the water
    // is clear, so it is never a uniform haze
    let cl = noised(vec3f(tgt.xy / 1150.0, 3.7 + f32(g & 3u) * 0.31)).x;
    wantInk *= F.ink * smoothstep(-0.12, 0.38, cl) * 1.7;
    wantSize *= 0.8 + 0.5 * hq.z;
    // neighbours on a thread answer the flow almost alike, so the thread bends instead of fraying
    spring *= 0.9 + 0.2 * hp.x;
  }

  var fl = flowAt(pos, fwl, frame.clock.x * fspd);
  fl.z *= fz;
  if (tail > 0.0) {
    // follow the streamline from the emitter in three steps: the tendril curls with the water
    var q = tgt;
    for (var k = 0; k < 3; k++) {
      var f = flowAt(q, fwl, frame.clock.x * fspd);
      f.z *= fz;
      q += f * (tail / (3.0 * max(length(f), 0.05)));
    }
    tgt = q;
  }

  if (ink < GONE) {
    if (wantInk <= 0.0) {
      // nothing to show: it waits on its place
      parts[i] = Particle(vec4f(tgt, 0.0), vec4f(0.0, 0.0, 0.0, wantSize));
      return;
    }
    // it appears: on its target, or at the formation's spawn point, or it flies in (emit < 0)
    if (emit >= 0.0) {
      pos = mix(tgt, spawn + (hq * 2.0 - 1.0) * spawnR, clamp(emit, 0.0, 1.0));
      vel = vec3f(0.0);
    }
    size = wantSize;
  }

  let d = tgt - pos;
  let dist = length(d);
  var vs = d * spring;
  let sp = length(vs);
  if (sp > vmax) { vs *= vmax / sp; }
  // on a long way the flow has more say, so a migration meanders instead of flying straight
  let far = smoothstep(40.0, 420.0, dist);
  var want = vs + fl * (famp * (1.0 + 1.5 * far));
  want += handFlow(pos) * hand;
  want.y += frame.wind.x * windK * (0.4 + 1.2 * hp.z);
  vel += (want - vel) * (1.0 - exp(-dt / max(inertia, 0.01)));
  pos += vel * dt;
  pos.z = clamp(pos.z, frame.depth.x, frame.depth.y);

  let rate = select(dn, up, wantInk > ink);
  ink += (wantInk - ink) * (1.0 - exp(-dt * rate));
  size += (wantSize - size) * (1.0 - exp(-dt * 3.0));
  parts[i] = Particle(vec4f(pos, ink), vec4f(vel, size));
}
`;

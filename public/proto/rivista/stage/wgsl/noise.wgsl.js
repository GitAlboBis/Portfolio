// @ts-check
/**
 * noise.wgsl.js — integer hashes, gradient noise with analytic derivatives and the flow field.
 *
 * The flow is the cross product of two noise gradients, which is divergence-free by construction
 * (div(grad a x grad b) = 0): it carries ink without ever piling it up or thinning it out, so a
 * thread stays a thread and a sheet folds instead of dissolving into dots.
 * Rule for every *.wgsl.js file: never a backtick inside a WGSL comment.
 */
export const noiseWGSL = /* wgsl */ `
// ---------------------------------------------------------------- hashes and noise
fn pcg3d(v0 : vec3u) -> vec3u {
  var v = v0 * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> vec3u(16u);
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}

// three floats in [0, 1)
fn hash3u(v : vec3u) -> vec3f {
  return vec3f(pcg3d(v) >> vec3u(8u)) * (1.0 / 16777216.0);
}

// lattice gradient in [-1, 1]^3
fn latticeGrad(c : vec3i) -> vec3f {
  return hash3u(bitcast<vec3u>(c)) * 2.0 - 1.0;
}

// Gradient noise: value in .x, analytic derivative in .yzw (quintic fade, so the derivative is smooth).
fn noised(x : vec3f) -> vec4f {
  let i = vec3i(floor(x));
  let f = fract(x);
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let du = 30.0 * f * f * (f * (f - 2.0) + 1.0);

  let ga = latticeGrad(i + vec3i(0, 0, 0));
  let gb = latticeGrad(i + vec3i(1, 0, 0));
  let gc = latticeGrad(i + vec3i(0, 1, 0));
  let gd = latticeGrad(i + vec3i(1, 1, 0));
  let ge = latticeGrad(i + vec3i(0, 0, 1));
  let gf = latticeGrad(i + vec3i(1, 0, 1));
  let gg = latticeGrad(i + vec3i(0, 1, 1));
  let gh = latticeGrad(i + vec3i(1, 1, 1));

  let va = dot(ga, f - vec3f(0.0, 0.0, 0.0));
  let vb = dot(gb, f - vec3f(1.0, 0.0, 0.0));
  let vc = dot(gc, f - vec3f(0.0, 1.0, 0.0));
  let vd = dot(gd, f - vec3f(1.0, 1.0, 0.0));
  let ve = dot(ge, f - vec3f(0.0, 0.0, 1.0));
  let vf = dot(gf, f - vec3f(1.0, 0.0, 1.0));
  let vg = dot(gg, f - vec3f(0.0, 1.0, 1.0));
  let vh = dot(gh, f - vec3f(1.0, 1.0, 1.0));

  let k0 = va - vb - vc + vd;
  let k1 = va - vc - ve + vg;
  let k2 = va - vb - ve + vf;
  let k3 = -va + vb + vc - vd + ve - vf - vg + vh;

  let v = va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va)
        + u.x * u.y * k0 + u.y * u.z * k1 + u.z * u.x * k2 + k3 * u.x * u.y * u.z;
  let d = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.z * (ge - ga)
        + u.x * u.y * (ga - gb - gc + gd) + u.y * u.z * (ga - gc - ge + gg) + u.z * u.x * (ga - gb - ge + gf)
        + (-ga + gb + gc - gd + ge - gf - gg + gh) * u.x * u.y * u.z
        + du * (vec3f(vb, vc, ve) - va + u.yzx * vec3f(k0, k1, k2) + u.zxy * vec3f(k2, k0, k1) + u.yzx * u.zxy * k3);
  return vec4f(v, d);
}

// The flow at a world point: a slow large swirl plus a finer one that evolves a little faster.
// wl = wavelength of the large swirl in px, tt = evolution clock. Magnitude is about 1.
fn flowAt(p : vec3f, wl : f32, tt : f32) -> vec3f {
  let q = p / wl + vec3f(0.0, 0.0, tt);
  let a = noised(q);
  let b = noised(q + vec3f(37.2, 11.7, 5.3));
  var v = cross(a.yzw, b.yzw);
  let q2 = q * 2.13 + vec3f(3.1, 7.7, 1.9 + tt * 0.7);
  let c = noised(q2);
  let d = noised(q2 + vec3f(19.1, 4.3, 27.9));
  v += 0.55 * cross(c.yzw, d.yzw);
  return v * 2.4;
}
`;

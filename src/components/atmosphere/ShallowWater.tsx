"use client";

/*
  ShallowWater — sun-through-shallow-water light over warm paper, behind the /about
  intro ("la costa del Sulcis" — the literal coast the bio opens on), and on /work +
  /work/[slug].

  ── TWO PATHS ────────────────────────────────────────────────────────────────────
  SIMULATED (WebGL2 + renderable float): a REAL height-field water surface. The
  caustics are not drawn — they are computed by refracting light through the
  simulated surface and measuring how much the projected area shrinks. Faithful port
  of Evan Wallace's WebGL Water (2011) via jeantimex/webgpu-water (MIT):

      update   info.g += (average - info.r) * 2.0;   // 4-tap von-Neumann average
               info.g *= 0.995;                      // damp AFTER accel
               info.r += info.g;                     // symplectic Euler
      drop     info.r += (0.5 - cos(clamp(1 - d/radius) * PI) * 0.5) * strength
      normal   normalize(cross(dy, dx)) from height differences, stored in .ba
      caustics intensity = oldArea / newArea, areas via screen-space derivatives of
               the flat-water vs displaced-water projection onto the floor

  Those five lines are the effect and are reproduced verbatim (2.0, 0.995, the *0.25
  4-tap, the cosine drop kernel, radius 0.03 / strength 0.01, IOR 1/1.333, 2 sim
  substeps per frame then normals then caustics — all upstream values). What we drop
  is scene-specific and has no meaning here: the pool box, the sphere and its shadow.
  What we add is the interaction: the pointer drops real ripples, plus a slow ambient
  rain so the pool is alive at rest.

  PROCEDURAL (fallback — WebGL1, or no renderable float): the previous implementation,
  unchanged. A re-theme of Ksenia Kondrashova's "Lightweight Water Distortion Effect"
  (codepen.io/ksenia-k/pen/RwXVMMY, MIT) — a 10-layer counter-rotating sine field.

  Both paths share ONE composition and therefore one contrast guarantee (below).

  ── CONTRAST IS STRUCTURAL, NOT STATISTICAL ──────────────────────────────────────
  The caustic term enters as clamp(..., 0.0, 1.0) and is mixed at ca * 0.25, with the
  broad shading capped at 0.55. Those clamps bound the composite for ANY input field,
  so swapping the procedural field for the simulated one cannot move the audited
  ratios: ink ≥ 13:1, ink-mute ≥ 5.9:1, ember-ink ≥ 4.5:1 on paper.

  Conventions match the repo's raw WebGL components (NightSky): section-scoped canvas,
  one rAF gated by a geometry self-check (Lenis scrolls via transform, so
  IntersectionObserver is unreliable here), DPR capped at 1.5, a LOW variant on
  small/coarse devices, full dispose on unmount, cursor response on pointer:fine only.

  DECORATIVE + non-blocking: aria-hidden, pointer-events:none. prefers-reduced-motion
  → one static procedural frame, no simulation, no loop. no-WebGL or a lost context →
  renders nothing and the section's own `bg-paper` shows through.
*/

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────────
// Upstream constants — do not retune without re-reading _refs/DOSSIERS.md §3.
// ─────────────────────────────────────────────────────────────────────────────────
const SIM_SIZE = 256; // webgpu-water main.ts:231 — the simulation grid
const DROP_RADIUS = 0.03; // main.ts:357/443 — every addDrop() call upstream
const DROP_STRENGTH = 0.01; // main.ts:357/443 — ±0.01
const SIM_SUBSTEPS = 2; // main.ts:760-761 — stepSimulation() twice per frame

const VERT = `attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// GLSL ES 1.00. `#define LOW 1` is prepended on small/coarse devices to drop the
// surface-field iterations (fewer per-pixel ALU, same composition).
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform float uFade;    // mount fade-in 0..1 (1 under reduced-motion)
uniform vec2  uMouse;   // cursor in band space (0..1, y-up); rest = (0.5, 0.5)
uniform float uMouseK;  // cursor strength 0..1 (0 on touch / off-band / reduced-motion)

// ── Golden Hour @theme tokens (sRGB, mirrors tokens.ts) ──────────────────────
const vec3 PAPER = vec3(0.984, 0.965, 0.937); // #fbf6ef  page ground
const vec3 DEEP  = vec3(0.945, 0.894, 0.827); // #f1e4d3  water shading
const vec3 AMBER = vec3(0.949, 0.639, 0.235); // #f2a33c  caustic light
const vec3 CORAL = vec3(1.000, 0.541, 0.298); // #ff8a4c  caustic light (mid)

// Ashima 2D simplex (as in the source pen)
vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x * 34.) + 1.) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m * m;
  m = m * m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}

mat2 rotate2D(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r)); }

#ifdef LOW
#define ITER 6
#else
#define ITER 10
#endif

// The pen's surface field: layers of counter-rotating, mutually-fed sine waves —
// this accumulation is what reads as sunlight refracted by a water surface.
float surfaceNoise(vec2 uv, float t, float scale) {
  vec2 n = vec2(.1);
  vec2 N = vec2(.1);
  mat2 m = rotate2D(.5);
  for (int j = 0; j < ITER; j++) {
    uv *= m;
    n *= m;
    vec2 q = uv * scale + float(j) + n + (.5 + .5 * float(j)) * (mod(float(j), 2.) - 1.) * t;
    n += sin(q);
    N += cos(q) / scale;
    scale *= 1.2;
  }
  return N.x + N.y + .1;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;           // y up: 0 bottom, 1 top
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Tidal pace — a fraction of the pen's t (= .002 * ms): calm, not busy.
  float t = uTime * 0.55;

  // ── the water body: a slow simplex swell (drives displacement + shading)
  float swell = snoise((0.3 + 0.1 * sin(t)) * p + vec2(0.0, 0.2 * t));

  // ── cursor: a local rise of the surface — the water answers the pointer
  vec2 mp = vec2(uMouse.x * aspect, uMouse.y);
  float spot = smoothstep(0.5, 0.0, length(p - mp)) * uMouseK;

  // ── the surface light field, its uv displaced by the swell — the pen's
  //    "surface_noise_uv = 2. * uv + outer_noise * .2" distortion, verbatim
  vec2 suv = 2.0 * p + swell * (0.2 + 0.3 * spot);
  float s = surfaceNoise(suv, t, 7.0);
  s = s * s; // sharpen into filaments (the pen's pow(x, 2.), NaN-safe)

  // ── waterline: full water over the upper band, dissolving into dry paper
  //    below; the edge undulates with the swell (never a straight line)
  float shore = smoothstep(0.02, 0.50, uv.y + 0.07 * swell);
  float veil = shore * uFade;

  // ── compose on paper
  vec3 col = PAPER;
  // broad shading — the swell pools the ground toward paper-deep (≤ .55; keeps
  // ink-mute ≥ 5.9:1 and ember-ink ≥ 4.6:1 on the deepest pools)
  col = mix(col, DEEP, clamp(0.26 + 0.34 * swell, 0.0, 0.55) * veil);
  // golden caustic web (≤ .25). Livelier in the airy top band, calmer where the
  // copy sits. The light is lifted toward paper so LUMINANCE (not saturation)
  // carries it — real caustics are bright — which keeps even ember-ink glyphs
  // over the brightest filaments ≥ 4.5:1 (the lift co-occurs with the mix and
  // raises the floor).
  float lively = mix(0.85, 1.35, smoothstep(0.40, 0.95, uv.y));
  float ca = clamp(s * lively * (1.15 + 0.55 * spot), 0.0, 1.0) * veil;
  col *= 1.0 + 0.09 * ca;                       // illumination lift
  col = mix(col, mix(mix(AMBER, CORAL, 0.4), PAPER, 0.25), ca * 0.25);

  // fine grain (breaks banding on the subtle washes). The time phase is wrapped —
  // an unbounded uTime*60 collapses fp32 fract() into structured stripes within
  // minutes; a 4 s loop on random speckle is imperceptible and bounded forever.
  col += (hash21(gl_FragCoord.xy + mod(uTime, 4.0) * 60.0) - 0.5) * 0.012;

  gl_FragColor = vec4(col, 1.0);
}`;

// ═════════════════════════════════════════════════════════════════════════════════
// SIMULATED PATH — GLSL ES 3.00 (WebGL2)
// ═════════════════════════════════════════════════════════════════════════════════

const V3_QUAD = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

/** update.frag.wgsl — the ripple integrator, verbatim. R=height G=velocity BA=normal.xz */
const F3_UPDATE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uWater;
uniform vec2 uDelta;          // texel size (1/w, 1/h)
out vec4 fragColor;
void main(){
  vec4 info = texture(uWater, vUv);
  vec2 dx = vec2(uDelta.x, 0.0);
  vec2 dy = vec2(0.0, uDelta.y);
  float average = (
    texture(uWater, vUv - dx).r +
    texture(uWater, vUv - dy).r +
    texture(uWater, vUv + dx).r +
    texture(uWater, vUv + dy).r
  ) * 0.25;
  info.g += (average - info.r) * 2.0;   // acceleration toward the local mean
  info.g *= 0.995;                      // damping, AFTER accel, BEFORE integration
  info.r += info.g;                     // semi-implicit (symplectic) Euler
  fragColor = info;
}`;

/** drop.frag.wgsl — cosine falloff kernel, verbatim */
const F3_DROP = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uWater;
uniform vec2 uCenter;         // [-1,1]
uniform float uRadius;
uniform float uStrength;
out vec4 fragColor;
void main(){
  vec4 info = texture(uWater, vUv);
  float drop = max(0.0, 1.0 - length(uCenter * 0.5 + 0.5 - vUv) / uRadius);
  drop = 0.5 - cos(drop * 3.14159265) * 0.5;
  info.r += drop * uStrength;
  fragColor = info;
}`;

/** normal.frag.wgsl — normal from height differences, verbatim */
const F3_NORMAL = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uWater;
uniform vec2 uDelta;
out vec4 fragColor;
void main(){
  vec4 info = texture(uWater, vUv);
  float val_dx = texture(uWater, vec2(vUv.x + uDelta.x, vUv.y)).r;
  float val_dy = texture(uWater, vec2(vUv.x, vUv.y + uDelta.y)).r;
  vec3 dx = vec3(uDelta.x, val_dx - info.r, 0.0);
  vec3 dy = vec3(0.0, val_dy - info.r, uDelta.y);
  vec3 normal = normalize(cross(dy, dx));
  info.b = normal.x;
  info.a = normal.z;
  fragColor = info;
}`;

/*
  caustics.{vert,frag}.wgsl — the real thing.

  Each grid vertex refracts the sun through the simulated surface normal and is
  projected onto the floor (our paper) twice: once as if the water were flat
  (oldPos) and once through the actual displaced surface (newPos). The fragment
  then measures how much the projected patch shrank using screen-space
  derivatives — light converges where the triangle shrinks. That ratio IS the
  caustic; nothing is drawn.

  Adaptation: upstream projects into a pool box (intersectCube) and subtracts a
  sphere shadow. We have neither, so the floor is a plane at y = -DEPTH and the
  projection is the plain ray-plane hit. The refraction, the IOR, the area-ratio
  intensity and the normal reconstruction are untouched.
*/
const V3_CAUSTICS = `#version 300 es
in vec2 aGrid;                // [-1,1] x [-1,1] lattice over the water plane
uniform sampler2D uWater;
uniform vec3 uLightDir;       // normalized
uniform float uDepth;         // distance from the surface down to the paper
out vec3 vOldPos;
out vec3 vNewPos;

const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;

// ray-plane hit against the floor at y = -uDepth
vec3 project(vec3 origin, vec3 ray){
  float t = (-uDepth - origin.y) / ray.y;
  return origin + ray * t;
}

void main(){
  vec2 uv = aGrid * 0.5 + 0.5;
  vec4 info = texture(uWater, uv);

  // reconstruct the normal (scaled down for stability — upstream does the same)
  vec2 ba = info.ba * 0.5;
  vec3 normal = vec3(ba.x, sqrt(max(0.0, 1.0 - dot(ba, ba))), ba.y);

  vec3 lightDir = normalize(uLightDir);
  vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
  vec3 ray = refract(-lightDir, normal, IOR_AIR / IOR_WATER);

  vec3 pos = vec3(aGrid.x, 0.0, aGrid.y);
  vOldPos = project(pos, refractedLight);
  vNewPos = project(pos + vec3(0.0, info.r, 0.0), ray);

  // Rasterize where the light lands — but first walk the hit point back UP along the
  // refracted light to y = 0. Without this the whole pattern is translated by the
  // sun's lateral throw (here ~0.66 units) and a wedge of the target falls outside
  // clip space, leaving a dead band. This is upstream's line, verbatim:
  //   0.75 * (newPos.xz - newPos.y * refractedLight.xz / refractedLight.y)
  // The 0.75 is upstream's margin so displaced rays never rasterize off-target; the
  // composite samples back through the same factor.
  vec2 projected = 0.75 * (vNewPos.xz - vNewPos.y * refractedLight.xz / refractedLight.y);
  gl_Position = vec4(projected.x, projected.y, 0.0, 1.0);
}`;

const F3_CAUSTICS = `#version 300 es
precision highp float;
in vec3 vOldPos;
in vec3 vNewPos;
uniform float uIntensity;
out vec4 fragColor;
void main(){
  // Light converges where the projected patch shrinks, diverges where it grows.
  float oldArea = length(dFdx(vOldPos)) * length(dFdy(vOldPos));
  float newArea = length(dFdx(vNewPos)) * length(dFdy(vNewPos));
  float intensity = oldArea / max(newArea, 1e-6) * uIntensity;
  fragColor = vec4(intensity, 0.0, 0.0, 1.0);
}`;

/*
  Composite — identical composition to the procedural path (same tokens, same
  waterline, same caps), except `s` is now the SIMULATED caustic field instead of
  the sine accumulation. The clamp(...,0,1) + ca*0.25 + 0.55 shading cap are what
  bound the contrast, so this substitution cannot move the audited AA ratios.
*/
const F3_COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uFade;
uniform sampler2D uCaustics;
out vec4 fragColor;

const vec3 PAPER = vec3(0.984, 0.965, 0.937);
const vec3 DEEP  = vec3(0.945, 0.894, 0.827);
const vec3 AMBER = vec3(0.949, 0.639, 0.235);
const vec3 CORAL = vec3(1.000, 0.541, 0.298);

vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x * 34.) + 1.) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m * m; m = m * m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.55;

  // the water BODY is still the slow simplex swell: it supplies the large-scale
  // pooling the ripple field (a small, fast surface) has no business producing.
  float swell = snoise((0.3 + 0.1 * sin(t)) * p + vec2(0.0, 0.2 * t));

  // the LIGHT is now real: refraction-derived caustics off the simulated surface.
  // The caustics pass rasterizes into a 0.75-scaled window (upstream's margin), so
  // sample back through the same factor: clip [-0.75,0.75] -> texcoord [0.125,0.875].
  // A flat surface projects area-for-area (ratio == 1 -> stored 0.55), so subtracting
  // 0.50 makes the value read as the DEVIATION from uniform illumination — which is
  // what a caustic physically is — leaving only a whisper of ambient on still water.
  // Then sharpened like the pen's pow(x, 2.) so bright filaments separate.
  float caustic = texture(uCaustics, uv * 0.75 + 0.125).r;
  float s = max(0.0, caustic - 0.50) * 2.2;
  s = s * s;

  float shore = smoothstep(0.02, 0.50, uv.y + 0.07 * swell);
  float veil = shore * uFade;

  vec3 col = PAPER;
  col = mix(col, DEEP, clamp(0.26 + 0.34 * swell, 0.0, 0.55) * veil);
  float lively = mix(0.85, 1.35, smoothstep(0.40, 0.95, uv.y));
  float ca = clamp(s * lively, 0.0, 1.0) * veil;
  col *= 1.0 + 0.09 * ca;
  col = mix(col, mix(mix(AMBER, CORAL, 0.4), PAPER, 0.25), ca * 0.25);

  col += (hash21(gl_FragCoord.xy + mod(uTime, 4.0) * 60.0) - 0.5) * 0.012;

  fragColor = vec4(col, 1.0);
}`;

// ─────────────────────────────────────────────────────────────────────────────────

function compile(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // surfaced in dev so a shader typo is never silent; failsafe bg still shows.
    console.error("[ShallowWater] shader compile:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vsSrc: string,
  fsSrc: string,
): { prog: WebGLProgram; vs: WebGLShader; fs: WebGLShader } | null {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("[ShallowWater] program link:", gl.getProgramInfoLog(prog));
    return null;
  }
  return { prog, vs, fs };
}

export function ShallowWater({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const low =
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";

    const ctxAttrs: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    };

    // The simulation needs WebGL2 (GLSL ES 3.00 derivatives + renderable float RTs).
    // Reduced-motion never simulates: it gets one static procedural frame.
    const gl2 = reduced ? null : (canvas.getContext("webgl2", ctxAttrs) as WebGL2RenderingContext | null);
    const floatRT = gl2
      ? gl2.getExtension("EXT_color_buffer_float") || gl2.getExtension("EXT_color_buffer_half_float")
      : null;
    const simulated = !!(gl2 && floatRT);

    const gl = (gl2 ??
      canvas.getContext("webgl", ctxAttrs) ??
      canvas.getContext("experimental-webgl", { alpha: false })) as
      | WebGLRenderingContext
      | WebGL2RenderingContext
      | null;

    if (!gl) {
      setFailed(true); // no WebGL → the section's bg-paper stays (identical ground)
      return;
    }

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const disposers: Array<() => void> = [];
    let repaint: (() => void) | null = null;
    let w = 0;
    let h = 0;

    // fullscreen triangle, shared by every full-screen pass
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    disposers.push(() => gl.deleteBuffer(quadBuf));

    // ═══════════════════════════════════════════════════════════════════════════
    // SIMULATED PATH
    // ═══════════════════════════════════════════════════════════════════════════
    let drawSimulated: ((t: number, fade: number) => void) | null = null;
    let dropAt: ((x: number, y: number, strength: number) => void) | null = null;

    if (simulated && gl2) {
      const g = gl2;
      const CAUSTICS_SIZE = low ? 256 : 512;
      const GRID = low ? 64 : 128; // lattice resolution of the caustics mesh

      const progs = {
        update: link(g, V3_QUAD, F3_UPDATE),
        drop: link(g, V3_QUAD, F3_DROP),
        normal: link(g, V3_QUAD, F3_NORMAL),
        caustics: link(g, V3_CAUSTICS, F3_CAUSTICS),
        composite: link(g, V3_QUAD, F3_COMPOSITE),
      };
      if (Object.values(progs).some((p) => !p)) {
        setFailed(true);
        return;
      }
      for (const p of Object.values(progs)) {
        disposers.push(() => {
          g.deleteProgram(p!.prog);
          g.deleteShader(p!.vs);
          g.deleteShader(p!.fs);
        });
      }

      // ── ping-pong simulation textures. R=height G=velocity BA=normal.xz ──────
      const mkSimTex = () => {
        const tex = g.createTexture()!;
        g.bindTexture(g.TEXTURE_2D, tex);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, SIM_SIZE, SIM_SIZE, 0, g.RGBA, g.HALF_FLOAT, null);
        // LINEAR on half-float is core in WebGL2; CLAMP so ripples die at the rim
        // instead of wrapping around the pool.
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
        const fbo = g.createFramebuffer()!;
        g.bindFramebuffer(g.FRAMEBUFFER, fbo);
        g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
        disposers.push(() => {
          g.deleteTexture(tex);
          g.deleteFramebuffer(fbo);
        });
        return { tex, fbo };
      };
      let simA = mkSimTex();
      let simB = mkSimTex();

      // clear both to a flat, still surface
      for (const s of [simA, simB]) {
        g.bindFramebuffer(g.FRAMEBUFFER, s.fbo);
        g.clearColor(0, 0, 0, 1);
        g.clear(g.COLOR_BUFFER_BIT);
      }

      // ── caustics render target (R = intensity) ──────────────────────────────
      const causticsTex = g.createTexture()!;
      g.bindTexture(g.TEXTURE_2D, causticsTex);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, CAUSTICS_SIZE, CAUSTICS_SIZE, 0, g.RGBA, g.HALF_FLOAT, null);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      const causticsFbo = g.createFramebuffer()!;
      g.bindFramebuffer(g.FRAMEBUFFER, causticsFbo);
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, causticsTex, 0);
      disposers.push(() => {
        g.deleteTexture(causticsTex);
        g.deleteFramebuffer(causticsFbo);
      });

      // ── caustics lattice (a triangle strip grid over the water plane) ────────
      const verts: number[] = [];
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const x0 = (x / GRID) * 2 - 1;
          const x1 = ((x + 1) / GRID) * 2 - 1;
          const y0 = (y / GRID) * 2 - 1;
          const y1 = ((y + 1) / GRID) * 2 - 1;
          verts.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
        }
      }
      const gridBuf = g.createBuffer()!;
      g.bindBuffer(g.ARRAY_BUFFER, gridBuf);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array(verts), g.STATIC_DRAW);
      const gridCount = verts.length / 2;
      disposers.push(() => g.deleteBuffer(gridBuf));

      const simDelta = [1 / SIM_SIZE, 1 / SIM_SIZE] as const;
      // Golden hour: a low sun coming over the right shoulder. Upstream's default is
      // normalize(2, 2, -1); ours is lower on the Y axis so the refracted rays travel
      // further across the floor and the filaments stretch like a late-day sun.
      const LIGHT = (() => {
        const v = [1.6, 1.35, -0.9];
        const l = Math.hypot(v[0], v[1], v[2]);
        return [v[0] / l, v[1] / l, v[2] / l];
      })();
      const FLOOR_DEPTH = 1.0;
      // Chosen so flat water stores ~0.55 and the composite's 0.50 threshold leaves a
      // whisper of ambient; every value above that is genuine convergence.
      const CAUSTIC_INTENSITY = 0.55;

      const drawQuadInto = (
        p: { prog: WebGLProgram },
        fbo: WebGLFramebuffer,
        size: number,
        setup: () => void,
      ) => {
        g.bindFramebuffer(g.FRAMEBUFFER, fbo);
        g.viewport(0, 0, size, size);
        g.useProgram(p.prog);
        g.bindBuffer(g.ARRAY_BUFFER, quadBuf);
        const a = g.getAttribLocation(p.prog, "aPos");
        g.enableVertexAttribArray(a);
        g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
        setup();
        g.drawArrays(g.TRIANGLES, 0, 3);
      };

      /** Run a full-screen sim pass reading simA and writing simB, then swap. */
      const runSimPass = (p: { prog: WebGLProgram }, setup: (prog: WebGLProgram) => void) => {
        drawQuadInto(p, simB.fbo, SIM_SIZE, () => {
          g.activeTexture(g.TEXTURE0);
          g.bindTexture(g.TEXTURE_2D, simA.tex);
          g.uniform1i(g.getUniformLocation(p.prog, "uWater"), 0);
          setup(p.prog);
        });
        const t = simA;
        simA = simB;
        simB = t;
      };

      dropAt = (x: number, y: number, strength: number) => {
        runSimPass(progs.drop!, (prog) => {
          g.uniform2f(g.getUniformLocation(prog, "uCenter"), x * 2 - 1, y * 2 - 1);
          g.uniform1f(g.getUniformLocation(prog, "uRadius"), DROP_RADIUS);
          g.uniform1f(g.getUniformLocation(prog, "uStrength"), strength);
        });
      };

      // PRE-ROLL. Dropping N ripples and rendering immediately shows a nearly bare
      // field: at t=0 nothing has propagated yet, so the first paint is a handful of
      // lonely rings instead of a caustic web (the previous procedural look was dense
      // from frame one — arriving emptier would be a regression). Run the integrator
      // forward at the same drop cadence the live loop uses, so the canvas is first
      // shown already in steady state with wavefronts at every phase. 210 update
      // passes over a 256² target is a few ms, once, before anything is visible.
      const stepOnce = () =>
        runSimPass(progs.update!, (prog) => {
          g.uniform2f(g.getUniformLocation(prog, "uDelta"), simDelta[0], simDelta[1]);
        });
      for (let s = 0; s < 210; s++) {
        if (s % 7 === 0) {
          dropAt(Math.random(), Math.random(), Math.random() < 0.5 ? DROP_STRENGTH : -DROP_STRENGTH);
        }
        stepOnce();
      }

      drawSimulated = (t: number, fade: number) => {
        // 1-2. simulation substeps (upstream runs stepSimulation() twice per frame)
        for (let i = 0; i < SIM_SUBSTEPS; i++) {
          runSimPass(progs.update!, (prog) => {
            g.uniform2f(g.getUniformLocation(prog, "uDelta"), simDelta[0], simDelta[1]);
          });
        }
        // 3. normals from the fresh height field
        runSimPass(progs.normal!, (prog) => {
          g.uniform2f(g.getUniformLocation(prog, "uDelta"), simDelta[0], simDelta[1]);
        });

        // 4. caustics — rasterize the refracted lattice onto the floor
        g.bindFramebuffer(g.FRAMEBUFFER, causticsFbo);
        g.viewport(0, 0, CAUSTICS_SIZE, CAUSTICS_SIZE);
        g.clearColor(0, 0, 0, 1);
        g.clear(g.COLOR_BUFFER_BIT);
        const cp = progs.caustics!.prog;
        g.useProgram(cp);
        g.bindBuffer(g.ARRAY_BUFFER, gridBuf);
        const ag = g.getAttribLocation(cp, "aGrid");
        g.enableVertexAttribArray(ag);
        g.vertexAttribPointer(ag, 2, g.FLOAT, false, 0, 0);
        g.activeTexture(g.TEXTURE0);
        g.bindTexture(g.TEXTURE_2D, simA.tex);
        g.uniform1i(g.getUniformLocation(cp, "uWater"), 0);
        g.uniform3f(g.getUniformLocation(cp, "uLightDir"), LIGHT[0], LIGHT[1], LIGHT[2]);
        g.uniform1f(g.getUniformLocation(cp, "uDepth"), FLOOR_DEPTH);
        g.uniform1f(g.getUniformLocation(cp, "uIntensity"), CAUSTIC_INTENSITY);
        g.drawArrays(g.TRIANGLES, 0, gridCount);

        // 5. composite onto the page
        g.bindFramebuffer(g.FRAMEBUFFER, null);
        g.viewport(0, 0, w, h);
        const kp = progs.composite!.prog;
        g.useProgram(kp);
        g.bindBuffer(g.ARRAY_BUFFER, quadBuf);
        const aq = g.getAttribLocation(kp, "aPos");
        g.enableVertexAttribArray(aq);
        g.vertexAttribPointer(aq, 2, g.FLOAT, false, 0, 0);
        g.activeTexture(g.TEXTURE0);
        g.bindTexture(g.TEXTURE_2D, causticsTex);
        g.uniform1i(g.getUniformLocation(kp, "uCaustics"), 0);
        g.uniform2f(g.getUniformLocation(kp, "uRes"), w, h);
        g.uniform1f(g.getUniformLocation(kp, "uTime"), t);
        g.uniform1f(g.getUniformLocation(kp, "uFade"), fade);
        g.drawArrays(g.TRIANGLES, 0, 3);
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROCEDURAL PATH (fallback + reduced-motion)
    // ═══════════════════════════════════════════════════════════════════════════
    let drawProcedural: ((t: number, fade: number, mx: number, my: number, mk: number) => void) | null =
      null;

    if (!drawSimulated) {
      const fragSrc = (low ? "#define LOW 1\n" : "") + FRAG;
      const p = link(gl, VERT, fragSrc);
      if (!p) {
        setFailed(true);
        return;
      }
      disposers.push(() => {
        gl.deleteProgram(p.prog);
        gl.deleteShader(p.vs);
        gl.deleteShader(p.fs);
      });
      gl.useProgram(p.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      const aPos = gl.getAttribLocation(p.prog, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(p.prog, "uRes");
      const uTime = gl.getUniformLocation(p.prog, "uTime");
      const uFade = gl.getUniformLocation(p.prog, "uFade");
      const uMouseLoc = gl.getUniformLocation(p.prog, "uMouse");
      const uMouseKLoc = gl.getUniformLocation(p.prog, "uMouseK");

      drawProcedural = (t, fade, mx, my, mk) => {
        gl.useProgram(p.prog);
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uTime, t);
        gl.uniform1f(uFade, fade);
        gl.uniform2f(uMouseLoc, mx, my);
        gl.uniform1f(uMouseKLoc, mk);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
    }

    // ── sizing ────────────────────────────────────────────────────────────────
    // Reassigning canvas.width/height DISCARDS the drawing buffer, and on an
    // alpha:false context the cleared buffer composites as opaque BLACK — so
    // resize() must repaint immediately. Critical under reduced-motion (no loop
    // ever redraws): without this, a window resize / rotation / the EN/IT toggle
    // reflowing the section would leave a permanent black band under the copy.
    const resize = () => {
      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (cw === 0 || ch === 0) return;
      w = Math.round(cw * DPR);
      h = Math.round(ch * DPR);
      canvas.width = w;
      canvas.height = h;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      repaint?.();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    host.appendChild(canvas);

    // ── in-view gate (geometry self-check — Lenis doesn't fire IO reliably) ───
    const inViewNow = () => {
      const r = host.getBoundingClientRect();
      return r.bottom > -120 && r.top < window.innerHeight + 120;
    };

    // ── cursor response (pointer:fine only) ───────────────────────────────────
    // Procedural path: a lerped "spot" uniform. Simulated path: REAL drops in the
    // height field — the pointer disturbs the water and the ripples then live their
    // own life, propagate, reflect off the rim and decay.
    let mx = 0.5;
    let my = 0.5;
    let mk = 0;
    let tmx = 0.5;
    let tmy = 0.5;
    let tmk = 0;
    let lastDrop = 0;
    let lastPx = 0.5;
    let lastPy = 0.5;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (r.height === 0) return;
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        tmx = x;
        tmy = 1 - y; // flip to the shader's y-up band space
        tmk = 1;
        if (dropAt && inViewNow()) {
          const now = performance.now();
          // throttle to ~28 Hz; strength scales with pointer speed so a slow drift
          // barely dimples the surface and a fast sweep tears a real wake.
          if (now - lastDrop > 36) {
            const speed = Math.hypot(x - lastPx, y - lastPy);
            lastPx = x;
            lastPy = y;
            lastDrop = now;
            dropAt(x, 1 - y, -DROP_STRENGTH * Math.min(3, 0.6 + speed * 26));
          }
        }
      } else {
        tmk = 0;
      }
    };
    if (fine && !reduced) window.addEventListener("pointermove", onMove, { passive: true });

    // context-loss safety: stop drawing, reveal the failsafe bg.
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      canvas.style.display = "none";
    };
    canvas.addEventListener("webglcontextlost", onLost as EventListener, false);

    let raf = 0;
    const start = performance.now();
    let prev = start;
    let inView = true;
    let gateTick = 0;
    let fade = 0;
    // Ambient agitation — keeps the surface alive with nobody touching it. The
    // strength is upstream's (±0.01); only the CADENCE is ours, and it is set by the
    // integrator's own decay: damping 0.995 per substep x 2 substeps = 0.99/frame,
    // so a ripple e-folds in ~100 frames (~1.7 s). A "drip" cadence therefore leaves
    // the surface almost flat between drops and the caustics collapse to lonely
    // rings. At ~1 drop per 150 ms roughly a dozen wavefronts are always in flight
    // and they interfere — which is what produces the cellular web that shallow
    // water actually casts. This is the reference's own drop kernel at a coastal
    // rate, not a different technique.
    let nextRain = 120;

    const draw = (t: number) => {
      if (drawSimulated) drawSimulated(t, fade);
      else drawProcedural?.(t, fade, mx, my, mk);
    };

    if (reduced) {
      // one static frame — settled water light, no loop, no simulation
      fade = 1;
      draw(4.0);
      repaint = () => draw(4.0);
    } else {
      draw(0);
      repaint = () => draw((performance.now() - start) / 1000);
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if ((gateTick++ & 7) === 0) {
          const next = inViewNow();
          if (next && !inView) prev = performance.now();
          inView = next;
        }
        if (!inView || document.hidden) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        fade += (1 - fade) * Math.min(1, dt * 2); // gentle mount fade — no pop
        const ms = Math.min(1, dt * 6); // cursor follow / fade
        mx += (tmx - mx) * ms;
        my += (tmy - my) * ms;
        mk += (tmk - mk) * ms;
        const elapsed = now - start;
        if (dropAt && elapsed > nextRain) {
          nextRain = elapsed + 90 + Math.random() * 130;
          dropAt(Math.random(), Math.random(), Math.random() < 0.5 ? DROP_STRENGTH : -DROP_STRENGTH);
        }
        draw(elapsed / 1000);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost as EventListener);
      for (const d of disposers) d();
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  if (failed) return null;

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
    />
  );
}

export default ShallowWater;

"use client";

/*
  ShallowWater — sun-through-shallow-water light over warm paper, behind the /about
  intro ("la costa del Sulcis" — the literal coast the bio opens on).

  A procedural re-theme of Ksenia Kondrashova's "Lightweight Water Distortion Effect"
  (codepen.io/ksenia-k/pen/RwXVMMY, MIT). The pen's mechanism is kept intact — a slow
  simplex "swell" displaces the uv of a rotated-sine surface field (its 10-layer
  sin/cos accumulation IS the sunlit water surface), which then both shades and
  illuminates what's underneath. What changed: there is no image to distort — the
  field plays directly on the page ground, as golden-hour caustics over paper. The
  water pools toward the top of the band and dissolves into dry paper below (an
  undulating waterline, not a straight edge) so the bio reads on clean ground.

  Conventions match the repo's raw WebGL components (NightSky): section-scoped
  canvas, one rAF gated by a geometry self-check (Lenis scrolls via transform, so
  IntersectionObserver is unreliable here), DPR capped at 1.5, a LOW shader variant
  on small/coarse devices, full dispose on unmount, cursor response on pointer:fine
  only.

  DECORATIVE + non-blocking: aria-hidden, pointer-events:none. prefers-reduced-motion
  → one static frame, no loop. no-WebGL or a lost context → renders nothing and the
  section's own `bg-paper` shows through (the exact look this augments). Absolute
  fill → zero layout shift. Contrast-safe by construction: shading capped at .40,
  caustic mix at .25 with the light lifted toward paper — worst-case patches keep
  ink ≥ 13:1, ink-mute ≥ 5.9:1 and ember-ink (intro eyebrow, header toggle) ≥ 4.5:1.
*/

import { useEffect, useRef, useState } from "react";

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

function compile(gl: WebGLRenderingContext, type: number, src: string) {
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
    const gl = (canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    }) ||
      canvas.getContext("experimental-webgl", {
        alpha: false,
      })) as WebGLRenderingContext | null;

    if (!gl) {
      setFailed(true); // no WebGL → the section's bg-paper stays (identical ground)
      return;
    }

    // ── program ──────────────────────────────────────────────────────────────
    const fragSrc = (low ? "#define LOW 1\n" : "") + FRAG;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    const prog = gl.createProgram();
    if (!prog) {
      setFailed(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[ShallowWater] program link:", gl.getProgramInfoLog(prog));
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    // fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uFade = gl.getUniformLocation(prog, "uFade");
    const uMouseLoc = gl.getUniformLocation(prog, "uMouse");
    const uMouseKLoc = gl.getUniformLocation(prog, "uMouseK");

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    // Reassigning canvas.width/height DISCARDS the drawing buffer, and on an
    // alpha:false context the cleared buffer composites as opaque BLACK — so
    // resize() must repaint immediately. Critical under reduced-motion (no loop
    // ever redraws): without this, a window resize / rotation / the EN/IT toggle
    // reflowing the section would leave a permanent black band under the copy.
    let repaint: (() => void) | null = null;
    let w = 0;
    let h = 0;
    const resize = () => {
      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (cw === 0 || ch === 0) return;
      w = Math.round(cw * DPR);
      h = Math.round(ch * DPR);
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
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

    // ── cursor response (pointer:fine only): position + strength lerped in the
    //    loop; strength ramps to 0 when the pointer leaves the band.
    let mx = 0.5;
    let my = 0.5;
    let mk = 0;
    let tmx = 0.5;
    let tmy = 0.5;
    let tmk = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (r.height === 0) return;
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        tmx = x;
        tmy = 1 - y; // flip to the shader's y-up band space
        tmk = 1;
      } else {
        tmk = 0;
      }
    };
    if (fine && !reduced) window.addEventListener("pointermove", onMove, { passive: true });

    let fade = 0;
    const draw = (t: number) => {
      gl.uniform1f(uTime, t);
      gl.uniform1f(uFade, fade);
      gl.uniform2f(uMouseLoc, mx, my);
      gl.uniform1f(uMouseKLoc, mk);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // context-loss safety: stop drawing, reveal the failsafe bg.
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      canvas.style.display = "none";
    };
    canvas.addEventListener("webglcontextlost", onLost as EventListener, false);

    let raf = 0;
    let start = performance.now();
    let prev = start;
    let inView = true;
    let gateTick = 0;

    if (reduced) {
      // one static frame — settled water light, no loop
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
        draw((now - start) / 1000);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost as EventListener);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
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

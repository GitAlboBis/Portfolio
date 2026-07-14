"use client";

/*
  NightSky — the living dusk atmosphere behind the one dark band (Contact + Footer).

  Golden Hour ends here: the sun has just set below the bottom-left horizon, leaving
  a low amber→rose afterglow that pools along the bottom, deep plum night with the
  first cool stars above, and a sparse drift of warm embers rising — the last warmth
  of the day. A single full-screen fragment shader (one draw call) paints all of it
  from the @theme tokens; nothing is a sprite or a particle object, so it stays GPU-
  cheap. As you scroll INTO the band, `uReveal` ramps and the afterglow + embers
  ignite.

  Conventions match the repo's WebGL components (TechCloud): a section-scoped raw
  renderer (NOT R3F), one persistent rAF gated by a geometry self-check (Lenis drives
  scroll via transform, which does NOT reliably fire IntersectionObserver), DPR capped
  at 1.5, a LOW shader variant on small/coarse devices, full dispose on unmount.

  DECORATIVE + non-blocking: aria-hidden, pointer-events:none (the CTA / footer links
  stay clickable). prefers-reduced-motion → one static frame, no loop. no-WebGL or a
  lost context → the component renders nothing and the wrapper's solid `bg-night`
  (the exact look this replaces) shows through. Zero layout impact (absolute fill),
  so no CLS.
*/

import { useEffect, useRef, useState } from "react";

const VERT = `attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// GLSL ES 1.00. `#define LOW 1` is prepended on small/coarse devices to drop the
// extra star + ember layers (fewer per-pixel ALU, same composition).
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform float uReveal;
uniform float uConst;   // 0..1 — the "A" constellation forms as the page reaches its end
uniform float uFlare;   // 0..1 — tide-touch: the constellation flares when the sea meets you
uniform vec2  uMouse;   // cursor in band space (0..1, y-up); rest = (0.5, 0.5)
uniform float uMouseK;  // spotlight strength 0..1 (0 on touch / off-band / reduced-motion)

// ── Golden Hour @theme tokens (sRGB, mirrors tokens.ts) ──────────────────────
const vec3 NIGHT   = vec3(0.165, 0.094, 0.125); // #2a1820  band ground
const vec3 NIGHT_T = vec3(0.100, 0.058, 0.082); // deeper plum toward the top
const vec3 DUSK    = vec3(0.369, 0.294, 0.494); // #5e4b7e  cool twilight
const vec3 EMBER   = vec3(0.933, 0.357, 0.137); // #ee5b23  primary accent
const vec3 AMBER   = vec3(0.949, 0.639, 0.235); // #f2a33c  golden hour
const vec3 ROSE    = vec3(0.882, 0.365, 0.420); // #e15d6b  sunset rose
const vec3 STAR    = vec3(0.980, 0.950, 0.900); // warm white

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p){
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(262144.0, 32768.0) * n);
}

// a sparse twinkling star layer
float starLayer(vec2 p, float density, float size, float twk){
  vec2 g  = p * density;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  vec2 r  = hash22(id + 3.7);
  float present = step(0.82, hash21(id + 7.1));     // ~18% of cells
  vec2 off = (r - 0.5) * 0.7;
  float d  = length(f - off);
  float tw = 0.55 + 0.45 * sin(uTime * twk + r.x * 6.2831);
  return smoothstep(size, 0.0, d) * present * tw;
}

// one star of the "A" constellation: a bright core + soft halo, igniting at its
// own threshold as uConst rises (staggered — the letter assembles star by star)
float constStar(vec2 cp, vec2 pt, float th){
  float on = smoothstep(th, th + 0.22, uConst);
  float d = length(cp - pt);
  return (smoothstep(0.045, 0.0, d) + smoothstep(0.16, 0.0, d) * 0.25) * on;
}
// a constellation line drawing itself from a toward b once its stars are lit
float constLine(vec2 cp, vec2 a, vec2 b, float t0){
  float prog = clamp((uConst - t0) * 3.2, 0.0, 1.0);
  vec2 pa = cp - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float d = length(pa - ba * h);
  return smoothstep(0.022, 0.004, d) * step(h, prog) * smoothstep(0.0, 0.2, prog);
}

// one lane of warm embers drifting upward
float emberLayer(vec2 p, float speed, float density, float size, vec2 seed){
  vec2 e = p;
  e.y -= uTime * speed;
  vec2 g  = e * density;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  vec2 r  = hash22(id + seed);
  float present = step(0.86, hash21(id + seed * 2.3)); // ~14% of cells
  vec2 off = (r - 0.5) * 0.7;
  float d  = length((f - off) * vec2(1.0, 0.75));      // slight vertical stretch
  float fl = 0.5 + 0.5 * sin(uTime * 3.0 + r.y * 6.2831);
  return smoothstep(size, 0.0, d) * present * fl;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;          // y up: 0 bottom, 1 top
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y); // aspect-corrected horizontal
  float v = uv.y;
  float ground = smoothstep(0.0, 0.13, v); // 0 at the very bottom edge → 1 just above it

  // ── base vertical gradient: warm plum low → deeper plum high, cool dusk wash up top
  vec3 col = mix(NIGHT, NIGHT_T, smoothstep(0.12, 1.0, v));
  col = mix(col, mix(col, DUSK, 0.16), smoothstep(0.55, 1.0, v));
  col = mix(col, NIGHT_T, (1.0 - ground) * 0.5); // settle the very bottom into a calm ground

  // ── afterglow: the sun just set below the bottom-left horizon. Brightest just
  //    above the very bottom; the last ~13% eases into a darker foreground so the
  //    footer fine print keeps AA contrast.
  vec2 sun = vec2(-0.16, -0.04);
  float dl = length((p - sun) * vec2(0.60, 1.0)); // wide ellipse
  float glow = pow(smoothstep(1.16, 0.0, dl), 1.5);
  float horizon = pow(1.0 - v, 2.2);              // pooling toward the bottom
  float after = clamp(glow * 0.88 + horizon * 0.34, 0.0, 1.35) * uReveal;
  after *= mix(0.5, 1.0, ground);                 // calm the very-bottom ground
  vec3 glowCol = DUSK;
  glowCol = mix(glowCol, ROSE,  smoothstep(0.10, 0.50, after));
  glowCol = mix(glowCol, EMBER, smoothstep(0.45, 0.92, after));
  glowCol = mix(glowCol, AMBER, smoothstep(0.92, 1.30, after));
  col = mix(col, glowCol, clamp(after, 0.0, 0.86));

  // ── stars: upper sky only, fade where the afterglow is bright
  float skyMask = smoothstep(0.16, 0.60, v) * (1.0 - smoothstep(0.0, 0.78, after));
  float st = starLayer(p + vec2(3.0, 1.0), 17.0, 0.060, 1.7) * 0.55;
#ifndef LOW
  st += starLayer(p * 1.7 + vec2(11.0, 5.0), 29.0, 0.045, 2.3) * 0.34;
#endif
  col += STAR * st * skyMask * (0.45 + 0.55 * uReveal);

  // ── embers: sparse warm motes, concentrated low, igniting with reveal
  float em = emberLayer(p, 0.060, 7.0, 0.050, vec2(1.3, 2.7));
#ifndef LOW
  em += emberLayer(p, 0.090, 10.0, 0.040, vec2(5.1, 0.4));
  em += emberLayer(p, 0.045, 5.0, 0.062, vec2(9.2, 3.9));
#endif
  float emberMask = pow(1.0 - v, 1.3) * uReveal;
  col += mix(EMBER, AMBER, 0.4) * em * emberMask * 0.85;

  // ── cursor spotlight: a warm ember pool that follows the pointer — "the warmth
  //    answers to you". pointer:fine only (uMouseK gates it), and eased toward the
  //    very bottom so the footer fine print keeps its AA contrast.
  vec2 mp = vec2((uMouse.x - 0.5) * aspect, uMouse.y);
  float spot = pow(smoothstep(0.52, 0.0, length(p - mp)), 2.0) * uMouseK * uReveal;
  spot *= mix(0.4, 1.0, ground);
  col = mix(col, mix(EMBER, AMBER, 0.35), spot * 0.22);   // warm the night toward the cursor
  col += mix(EMBER, ROSE, 0.30) * spot * 0.10;            // faint additive bloom core

  // ── the "A" returns in the stars: as the page reaches its very end, seven
  //    stars ignite one by one high in the night and thin golden lines draw the
  //    hero's letter between them — the water "A" of the golden hour, remembered
  //    as a constellation. Centre clamps inside narrow (mobile) viewports.
  vec2 cc = vec2(min(0.40, aspect * 0.5 - 0.24), 0.72);
  vec2 cp = (p - cc) / 0.16;
  float cs = 0.0;
  cs += constStar(cp, vec2( 0.00,  0.95), 0.05);
  cs += constStar(cp, vec2(-0.31,  0.20), 0.15);
  cs += constStar(cp, vec2( 0.31,  0.20), 0.25);
  cs += constStar(cp, vec2(-0.30,  0.05), 0.35);
  cs += constStar(cp, vec2( 0.30,  0.05), 0.45);
  cs += constStar(cp, vec2(-0.62, -0.55), 0.55);
  cs += constStar(cp, vec2( 0.62, -0.55), 0.62);
  float cl = 0.0;
  cl += constLine(cp, vec2(0.00, 0.95), vec2(-0.62, -0.55), 0.55);
  cl += constLine(cp, vec2(0.00, 0.95), vec2( 0.62, -0.55), 0.66);
  cl += constLine(cp, vec2(-0.30, 0.05), vec2( 0.30, 0.05), 0.78);
  float ctw = 0.86 + 0.14 * sin(uTime * 1.4 + cp.x * 3.0);
  // tide-touch flare: the letter answers the sea — stars surge, lines brighten,
  // and a soft golden breath blooms around the constellation, then it all settles
  col += STAR * cs * ctw * (0.9 + uFlare * 1.3);
  col += mix(STAR, AMBER, 0.45) * cl * (0.28 + uFlare * 0.45);
  col += AMBER * uFlare * 0.10 * smoothstep(1.7, 0.0, length(cp)) * smoothstep(0.5, 1.0, uConst);

  // ── fine grain (breaks gradient banding on the dark plum). Wrapped time phase:
  //    unbounded uTime*60 collapses fp32 fract() into structured stripes within
  //    minutes; a 4 s loop on random speckle is imperceptible and bounded forever.
  col += (hash21(gl_FragCoord.xy + mod(uTime, 4.0) * 60.0) - 0.5) * 0.018;

  // ── gentle vignette + keep the lows off pure black
  float vig = smoothstep(1.25, 0.35, length((uv - vec2(0.5, 0.45)) * vec2(aspect, 1.0)));
  col *= mix(0.87, 1.0, vig);
  col = max(col, NIGHT * 0.92);

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // surfaced in dev so a shader typo is never silent; failsafe bg still shows.
    console.error("[NightSky] shader compile:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function NightSky({ className }: { className?: string }) {
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
      setFailed(true); // no WebGL → wrapper bg-night stays (identical to before)
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
      console.error("[NightSky] program link:", gl.getProgramInfoLog(prog));
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
    const uReveal = gl.getUniformLocation(prog, "uReveal");
    const uConstLoc = gl.getUniformLocation(prog, "uConst");
    const uFlareLoc = gl.getUniformLocation(prog, "uFlare");
    const uMouseLoc = gl.getUniformLocation(prog, "uMouse");
    const uMouseKLoc = gl.getUniformLocation(prog, "uMouseK");

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    // Reassigning canvas.width/height DISCARDS the drawing buffer (composites as
    // opaque black on an alpha:false context) — repaint immediately so a resize
    // can never leave a black band. Matters most under reduced-motion, where no
    // loop ever redraws (here black ≈ bg-night, but the frame content is lost).
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

    // ── reveal (how far the band is scrolled into view) + in-view gate ─────────
    let reveal = reduced ? 1 : 0;
    const sampleTarget = () => {
      const r = host.getBoundingClientRect();
      return Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.8)));
    };
    // constellation progress: 0 as the band enters → 1 exactly at the page's end
    // (the "A" completes only when the story does). Short bands fall back to reveal.
    let constN = reduced ? 1 : 0;
    const sampleConst = () => {
      const r = host.getBoundingClientRect();
      const denom = r.height - window.innerHeight;
      return denom > 40 ? Math.max(0, Math.min(1, -r.top / denom)) : reveal;
    };
    const inViewNow = () => {
      const r = host.getBoundingClientRect();
      return r.bottom > -120 && r.top < window.innerHeight + 120;
    };

    // ── cursor spotlight (pointer:fine only): a warm pool that follows the mouse
    //    over the band. Position + strength are lerped in the loop; strength (mk)
    //    ramps to 0 when the pointer leaves the band. Never attached on touch or
    //    reduced-motion, so it stays a mouse-only flourish.
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

    // tide-touch (TideEbb, page bottom): the constellation flares, then settles.
    // The band is always in view when the tide can be touched, so the running
    // loop decays it — no extra invalidation needed. Skipped under reduced.
    let flare = 0;
    const onTide = () => {
      flare = 1;
    };
    if (!reduced) window.addEventListener("tide-touch", onTide);

    const draw = (t: number) => {
      gl.uniform1f(uTime, t);
      gl.uniform1f(uReveal, reveal);
      gl.uniform1f(uConstLoc, constN);
      gl.uniform1f(uFlareLoc, flare);
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
      // one static frame — a settled dusk, no loop
      reveal = 1;
      draw(6.0);
      repaint = () => draw(6.0);
    } else {
      reveal = sampleTarget();
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
        reveal += (sampleTarget() - reveal) * Math.min(1, dt * 3);
        constN += (sampleConst() - constN) * Math.min(1, dt * 2.5);
        flare *= Math.exp(-dt * 1.6); // the flare breathes out over ~1.5s
        const ms = Math.min(1, dt * 6); // spotlight follow / fade
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
      window.removeEventListener("tide-touch", onTide);
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

export default NightSky;

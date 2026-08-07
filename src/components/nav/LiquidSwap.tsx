"use client";

import * as React from "react";

/*
  LiquidSwap — the menu portal's still layer, morphing like water.

  Technique port of ritamx287/Liquid-Morphology-Slideshow (technique only, no
  license file upstream; read in full, `_refs/DOSSIERS.md §8`). The morph:

    wave          = sin(uv.y·10 + time·0.5)          // 10 cycles, slow drift
    dispIntensity = sin(progress·π)·0.2              // BELL: zero at both rest
                                                     // states, peak 0.2 mid-swap
    delta.x       = noise(uv·5  + time)·dispIntensity·wave   // signed via wave
    delta.y       = (noise(uv·10 + time)·2−1)·dispIntensity  // re-centred (fix)
    s1 = 1 − p·0.1        // outgoing shrinks   1.00 → 0.90
    s2 = 1 + (1−p)·0.1    // incoming settles   1.10 → 1.00
    t_i = texture(tex_i, cover((uv−0.5)·s_i + 0.5 + delta·0.5))
    out = mix(t1, t2, p)

  Kept verbatim: the bell envelope (distortion exists only DURING the swap —
  the load-bearing idea), the counter-scale pair (what gives the dissolve a
  direction), the 5×/10× noise-octave split, the 10-cycle wave with its 0.5
  drift, the IQ value-noise (hash 43758.5453123, y·57 lattice — its aliasing
  is part of the look), and the plain mix(t1, t2, p) composite (the source
  computes a noisy mixFactor and then never uses it — dead code, not ported).

  Fixed on port (both recorded in the dossier): ① upstream adds
  `distortedPosition·0.5` where distortedPosition is `uv + delta` — an
  ABSOLUTE coordinate, so every sample lands at 1.5·uv and the image only
  survives on their abstract gradients; the authored intent is a
  displacement, so we add `delta·0.5`. ② the y noise is unsigned (the frame
  only ever sags down) — re-centred.

  Ours: hover/focus-driven progress through GSAP-free rAF-less draws — the
  bell is zero at rest, so we render ONLY while a swap tween is in flight
  (the driver calls setProgress per tick). No idle loop, no idle cost.
  WebGL2-only; when unavailable (or after context loss) `alive` goes false
  and MenuOverlay's DOM crossfade keeps working exactly as before.
*/

const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = vec2(p.x, 1.0 - p.y); /* image-space y-down so uploads need no flip */
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform float uProgress;
uniform float uTime;
uniform vec2 uRatio1; /* cover-fit ratio per texture (reference getCoverUv) */
uniform vec2 uRatio2;
in vec2 vUv;
out vec4 outColor;
#define PI 3.14159265359
float ls_hash(float n){ return fract(sin(n) * 43758.5453123); }
float ls_noise(vec2 x){
  vec2 p = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = p.x + p.y * 57.0;
  return mix(mix(ls_hash(n), ls_hash(n + 1.0), f.x),
             mix(ls_hash(n + 57.0), ls_hash(n + 58.0), f.x), f.y);
}
vec2 ls_cover(vec2 uv, vec2 ratio){ return uv * ratio + (1.0 - ratio) * 0.5; }
void main(){
  float wave = sin(vUv.y * 10.0 + uTime * 0.5);
  float dispIntensity = sin(uProgress * PI) * 0.2;
  vec2 delta = vec2(
    ls_noise(vUv * 5.0 + uTime) * dispIntensity * wave,
    (ls_noise(vUv * 10.0 + uTime) * 2.0 - 1.0) * dispIntensity
  );
  float s1 = 1.0 - uProgress * 0.1;
  float s2 = 1.0 + (1.0 - uProgress) * 0.1;
  vec2 c1 = (vUv - 0.5) * s1 + 0.5 + delta * 0.5;
  vec2 c2 = (vUv - 0.5) * s2 + 0.5 + delta * 0.5;
  vec4 t1 = texture(uTex1, ls_cover(c1, uRatio1));
  vec4 t2 = texture(uTex2, ls_cover(c2, uRatio2));
  outColor = mix(t1, t2, uProgress);
}`;

export type LiquidSwapHandle = {
  /** true once GL is up and the stills are painting (drives the img fallback) */
  alive: () => boolean;
  /** start a morph toward `to` (the from side is the last settled/dominant still) */
  begin: (to: string) => void;
  /** drive the morph (called from the GSAP tween's onUpdate) + draw */
  setProgress: (p: number) => void;
  /** hard-land on one still (reset / reduced / instant paths) */
  settle: (id: string) => void;
};

type Entry = { tex: WebGLTexture; w: number; h: number; ready: boolean };

export const LiquidSwap = React.forwardRef<
  LiquidSwapHandle,
  { previews: ReadonlyArray<{ id: string; src: string }>; onAlive?: (alive: boolean) => void }
>(function LiquidSwap({ previews, onAlive }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const api = React.useRef<{
    gl: WebGL2RenderingContext;
    entries: Map<string, Entry>;
    draw: () => void;
    from: string;
    to: string;
    p: number;
    t0: number;
    alive: boolean;
  } | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) {
      onAlive?.(false);
      return;
    }
    // effect-LOCAL liveness: the img.onload closures must die with THIS run.
    // (api.current is re-pointed by a StrictMode remount, so checking it lets
    // a dead run's onload bind its own already-deleted texture — measured as
    // "attempt to use a deleted object" warnings, one per preview.)
    let effectAlive = true;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onAlive?.(false);
      return;
    }
    gl.useProgram(prog);
    const loc = {
      t1: gl.getUniformLocation(prog, "uTex1"),
      t2: gl.getUniformLocation(prog, "uTex2"),
      p: gl.getUniformLocation(prog, "uProgress"),
      time: gl.getUniformLocation(prog, "uTime"),
      r1: gl.getUniformLocation(prog, "uRatio1"),
      r2: gl.getUniformLocation(prog, "uRatio2"),
    };

    const entries = new Map<string, Entry>();
    const makeEntry = (id: string, src: string) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // 1×1 night placeholder until the still decodes (no incomplete-texture
      // warnings — the UnderPaper review lesson)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([42, 24, 32, 255]),
      );
      const entry: Entry = { tex, w: 3, h: 2, ready: false };
      entries.set(id, entry);
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.onload = () => {
        if (!effectAlive || !state.alive) return;
        gl.bindTexture(gl.TEXTURE_2D, entry.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
        entry.w = img.naturalWidth;
        entry.h = img.naturalHeight;
        entry.ready = true;
        state.draw(); // late decode while resting on this still → repaint once
      };
      img.onerror = () => {};
    };
    previews.forEach((pv) => makeEntry(pv.id, pv.src));

    const ratio = (e: Entry): [number, number] => {
      // the reference's getCoverUv ratio, per texture
      const cw = Math.max(1, canvas.width);
      const ch = Math.max(1, canvas.height);
      return [Math.min(cw / ch / (e.w / e.h), 1), Math.min(ch / cw / (e.h / e.w), 1)];
    };

    const state = {
      gl,
      entries,
      from: previews[0]?.id ?? "home",
      to: previews[0]?.id ?? "home",
      p: 0,
      t0: performance.now(),
      alive: true,
      draw() {
        if (!state.alive) return;
        const f = entries.get(state.from);
        const t = entries.get(state.to);
        if (!f || !t) return;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, f.tex);
        gl.uniform1i(loc.t1, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.uniform1i(loc.t2, 1);
        gl.uniform1f(loc.p, state.p);
        // the wave keeps drifting across swaps (one shared clock)
        gl.uniform1f(loc.time, (performance.now() - state.t0) / 1000);
        const [r1x, r1y] = ratio(f);
        const [r2x, r2y] = ratio(t);
        gl.uniform2f(loc.r1, r1x, r1y);
        gl.uniform2f(loc.r2, r2x, r2y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
    api.current = state;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 4) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      state.draw();
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();

    const onLost = (e: Event) => {
      e.preventDefault();
      state.alive = false;
      onAlive?.(false); // the DOM imgs take back over, seamlessly
    };
    canvas.addEventListener("webglcontextlost", onLost);
    onAlive?.(true);

    return () => {
      effectAlive = false;
      state.alive = false;
      api.current = null;
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      entries.forEach((e) => gl.deleteTexture(e.tex));
      gl.deleteProgram(prog);
      // NO loseContext (the UnderPaper review lesson): getContext() returns
      // this same context on a future effect run, and a context lost via the
      // extension never comes back.
      onAlive?.(false);
    };
    // previews is a module constant at the call site; onAlive is stable enough
    // (state setter) — this effect must run exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useImperativeHandle(ref, () => ({
    alive: () => !!api.current?.alive,
    begin: (to) => {
      const s = api.current;
      if (!s?.alive || !s.entries.has(to)) return;
      // start from whichever still dominates right now: at rest (p 0 or 1)
      // and past mid-flight that is s.to; before mid-flight s.from still is
      if (s.p <= 0 || s.p >= 0.5) s.from = s.to;
      s.to = to;
      s.p = 0;
      s.draw();
    },
    setProgress: (p) => {
      const s = api.current;
      if (!s?.alive) return;
      s.p = Math.min(1, Math.max(0, p));
      s.draw();
    },
    settle: (id) => {
      const s = api.current;
      if (!s?.alive) return;
      s.from = id;
      s.to = id;
      s.p = 0;
      s.draw();
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
});

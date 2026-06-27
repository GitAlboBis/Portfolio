"use client";

import { useEffect, useRef } from "react";
import { useScrollStore, SECTION_BOUNDS } from "@/webgl/store/scrollStore";
import { CAUSTICS_VERT, CAUSTICS_FRAG } from "./caustics-layer.glsl";

/*
  AMBIENT CAUSTICS LIGHT LAYER

  A fixed, full-viewport WebGL2 layer that renders slow, animated sea-surface
  caustics — the rippling net of refracted sunlight you see on a seabed — in very
  low-alpha celeste/foam, blended (additively) over the DescendingWorld backdrop
  and below all content. There is NO geometry: a single full-screen triangle is
  emitted from gl_VertexID, so the draw is one attributeless drawArrays call.

  DEPTH-LINKED: the caustic intensity fades with scroll depth read from
  scrollStore — bright near the surface / hero handoff, dimming to near-black by
  Contact — reinforcing the dive. The mapping starts the layer essentially hidden
  during the hero (so it never competes with the water "A" / cinematic) and fades
  it in across the hero->content handoff, mirroring DescendingWorld's veil.

  PERFORMANCE
    - capped DPR (<=1.5), single rAF, no React re-render in the hot path
    - paused via IntersectionObserver (root sentinel) AND document visibility:
      offscreen or hidden tab => loop idles, zero GPU work
    - cheap procedural noise only; no textures, no network

  GRACEFUL DEGRADATION
    - no WebGL2 context  -> renders nothing (the <canvas> stays blank/transparent)
    - context lost       -> stops drawing cleanly; restores + re-inits on restore
    - prefers-reduced-motion -> draws ONE static caustic frame at low alpha, no rAF

  ACCESSIBILITY: purely decorative -> aria-hidden, pointer-events-none.
*/

// Read a CSS custom property (hex) from :root and return it as [r,g,b] in 0..1.
function readTokenRgb(name: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (!m) return fallback;
  const int = parseInt(m[1], 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

// Map global scroll progress (0..1) -> caustic master intensity (0..1).
// Hidden through the hero, fades in across the handoff, then dims with depth into
// the abyss so the seabed light goes out as the visitor descends to Contact.
function intensityFor(progress: number): number {
  // Mirror DescendingWorld's veil ramp so the two layers hand off together.
  const FADE_START = 0.48;
  const FADE_END = 0.58;
  if (progress <= FADE_START) return 0;
  const visible = Math.min(1, (progress - FADE_START) / (FADE_END - FADE_START));

  // Depth dimming across the content region: full at the handoff -> near-zero by
  // Contact. Use the Contact bound as the floor of the descent.
  const contactStart = SECTION_BOUNDS.contact[0];
  const span = Math.max(0.0001, contactStart - FADE_END);
  const depth = Math.min(1, Math.max(0, (progress - FADE_END) / span));
  // Quadratic falloff: light dies faster as pressure/dark builds toward Contact.
  const depthGain = 1 - depth * depth * 0.92;

  return visible * depthGain;
}

export function CausticsLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    // GRACEFUL NO-OP: no WebGL2 -> leave the canvas transparent, attach nothing.
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const celeste = readTokenRgb("--color-celeste", [0.608, 0.827, 0.933]);
    const foam = readTokenRgb("--color-foam", [0.957, 0.98, 0.984]);

    // --- GL program ------------------------------------------------------------
    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uDepth: WebGLUniformLocation | null = null;
    let uIntensity: WebGLUniformLocation | null = null;
    let uResolution: WebGLUniformLocation | null = null;

    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const buildProgram = (): boolean => {
      const vs = compile(gl.VERTEX_SHADER, "#version 300 es\n" + CAUSTICS_VERT);
      const fs = compile(gl.FRAGMENT_SHADER, "#version 300 es\n" + CAUSTICS_FRAG);
      if (!vs || !fs) return false;
      const prog = gl.createProgram();
      if (!prog) return false;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog);
        return false;
      }
      program = prog;
      // Attributeless draw still wants a bound VAO in core WebGL2.
      vao = gl.createVertexArray();

      gl.useProgram(program);
      uTime = gl.getUniformLocation(program, "uTime");
      uDepth = gl.getUniformLocation(program, "uDepth");
      uIntensity = gl.getUniformLocation(program, "uIntensity");
      uResolution = gl.getUniformLocation(program, "uResolution");
      // constant color tokens — set once
      gl.uniform3f(gl.getUniformLocation(program, "uCeleste"), celeste[0], celeste[1], celeste[2]);
      gl.uniform3f(gl.getUniformLocation(program, "uFoam"), foam[0], foam[1], foam[2]);

      // additive over the dark backdrop: light ADDS, never darkens text bg.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      return true;
    };

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const renderFrame = (timeSec: number, intensity: number, depth: number) => {
      if (!program) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (intensity <= 0.0008) return; // nothing visible — skip the draw

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      if (uTime) gl.uniform1f(uTime, timeSec);
      if (uDepth) gl.uniform1f(uDepth, depth);
      if (uIntensity) gl.uniform1f(uIntensity, intensity);
      if (uResolution) gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    if (!buildProgram()) {
      // shader/link failure -> behave like "no WebGL": draw nothing, clean up ctx.
      return;
    }
    resize();

    // ---- visibility gating ----------------------------------------------------
    // The layer only matters below the fold; gate on a full-viewport sentinel and
    // on tab visibility so an offscreen/background canvas costs nothing.
    let onScreen = true;
    let tabVisible = !document.hidden;

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      tabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    window.addEventListener("resize", resize);

    // ---- reduced motion: ONE static frame, no loop ----------------------------
    if (reduce) {
      // A representative mid-descent intensity so the seabed reads as lit but the
      // page stays motionless. Drawn once at a fixed time seed.
      renderFrame(8.0, 0.5, 0.3);
      return () => {
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", resize);
        const lose = gl.getExtension("WEBGL_lose_context");
        lose?.loseContext();
      };
    }

    // ---- context loss handling ------------------------------------------------
    let contextLost = false;
    const onLost = (e: Event) => {
      e.preventDefault(); // signal we intend to restore
      contextLost = true;
    };
    const onRestored = () => {
      contextLost = false;
      // rebuild GL objects against the fresh context
      program = null;
      vao = null;
      if (buildProgram()) resize();
    };
    canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
    canvas.addEventListener("webglcontextrestored", onRestored as EventListener, false);

    // ---- animation loop -------------------------------------------------------
    const start = performance.now();
    // smooth the intensity so velocity/section snaps don't pop the light on/off
    let smoothed = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (contextLost || !onScreen || !tabVisible) return;

      const progress = useScrollStore.getState().progress;
      const target = intensityFor(progress);
      smoothed += (target - smoothed) * 0.08;

      // depth value for the shader's own use (shaft falloff tuning headroom):
      // reuse normalized progress past the handoff.
      const depth = Math.min(1, Math.max(0, (progress - 0.58) / 0.42));

      const t = (performance.now() - start) * 0.001;
      renderFrame(t, smoothed, depth);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onRestored as EventListener);
      if (program) gl.deleteProgram(program);
      if (vao) gl.deleteVertexArray(vao);
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

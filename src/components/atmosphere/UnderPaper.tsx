"use client";

import * as React from "react";
import { useUI } from "@/store/ui";
import { palette } from "@/content/tokens";

/*
  UnderPaper — "the water under the paper".

  Dragging the pointer across the About opening erodes the page surface and
  the sea at golden hour shows through the fibres; lift the pointer and the
  paper heals. The site's thesis — interfaces that move like water — made
  literal: the water was under the page the whole time.

  Technique port of cullenwebber/three-skull (Codrops "Skeleton Fluid
  Reveal", intended-MIT — README links a LICENSE that was never committed;
  rewritten from the algorithm, no code reuse). Their "fluid" is NOT a
  Navier–Stokes solver (dossier's headline correction): it is a grayscale
  MORPHOLOGICAL EROSION on a ping-ponged mask — min() of 5 fbm-jittered taps
  — fed by a huge round-capped canvas stroke, plus a linear fade back to
  white. Kept exactly (these ARE the effect):
    • erosion cross: min of centre + ±x + ±y taps, arms = fbm(uv·20)·0.01
    • the fbm: 4 octaves, gain .5, lacunarity 2, rotation .5 rad, shift 100,
      hash (12.9898, 4.1414)·43758.5453, and the value noise is SQUARED —
      drop the square and the wispy filament character dies (gotcha #8)
    • +0.015/step fade to white (linear, NOT multiplicative — 67 steps ≈
      1.1 s of healing), pointer lerp 0.075/step, brush = max(20% of width,
      100px), round caps, opacity gate ±0.1/step on a 0.5px move threshold
    • coarse pointers get their trail Lissajous: (0.5+0.5·sin 1.3t,
      0.5+0.5·sin 2.6t) — the band lives on touch without a cursor

  Fixed on port (each recorded in the dossier's gotcha list):
    • the sim runs on a FIXED 60 Hz accumulator — upstream is per-frame and
      decays 2.4× faster at 144 Hz (#2); the constants stay per-STEP
    • sim at 512px, not viewport×DPR (#12 — two full-res RTs and a full-res
      canvas upload per frame; the huge brush + linear filtering make the
      downscale invisible); the trail canvas matches the sim size (#13)
    • aspectVec is a uniform, recomputed on resize (#4 — upstream bakes it)
    • mask SEEDED WHITE: the paper starts intact (their black start plays a
      full-screen skeleton→human dissolve we do not want)
    • their CRT grade (scanlines/grain/blue lift) dropped — Golden Hour has
      its own ground

  Composite: the canvas paints ONLY the revealed sea (premultiplied alpha =
  1 − mask), veiled 50% toward paper — you never fully pierce the page, you
  see the water THROUGH its fibres. That veil also floors the luminance, and
  the About text additionally sits on its own 85% reading shield, so ink AA
  holds no matter what the pointer does.

  Decorative: aria-hidden, pointer-events-none (we listen on window).
  Reduced-motion: the effect never starts — the band stays paper (zero
  hydration surface: nothing branches at render). No WebGL2 / context lost:
  transparent canvas, plain paper. IO + visibility gate the rAF.
*/

const SIM_W = 512;
const STEP = 1 / 60;

const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/* the erosion — the reference's whole "fluid", constants verbatim */
const FRAG_SIM = `#version 300 es
precision highp float;
uniform sampler2D uPrev;
uniform sampler2D uTrail;
uniform vec2 uAspectVec;
in vec2 vUv;
out vec4 outColor;
float up_rand(vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
float up_noise(vec2 p){
  vec2 ip = floor(p), u = fract(p);
  vec2 uu = u * u * (3.0 - 2.0 * u);
  float res = mix(mix(up_rand(ip), up_rand(ip + vec2(1.0, 0.0)), uu.x),
                  mix(up_rand(ip + vec2(0.0, 1.0)), up_rand(ip + vec2(1.0, 1.0)), uu.x), uu.y);
  return res * res; /* squared — the sparse, filament bias */
}
float up_fbm(vec2 x){
  float v = 0.0, a = 0.5;
  float c = cos(0.5), s = sin(0.5);
  mat2 rot = mat2(c, s, -s, c);
  for (int i = 0; i < 4; i++) {
    v += a * up_noise(x);
    x = rot * x * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}
void main(){
  vec2 disp = up_fbm(vUv * 20.0) * uAspectVec * 0.01;
  float m  = texture(uPrev, vUv).r;
  float m2 = texture(uPrev, vec2(vUv.x + disp.x, vUv.y)).r;
  float m3 = texture(uPrev, vec2(vUv.x - disp.x, vUv.y)).r;
  float m4 = texture(uPrev, vec2(vUv.x, vUv.y + disp.y)).r;
  float m5 = texture(uPrev, vec2(vUv.x, vUv.y - disp.y)).r;
  float flood = min(m, min(min(m2, m3), min(m4, m5)));
  float combined = min(flood, texture(uTrail, vUv).r);
  outColor = vec4(vec3(min(1.0, combined + 0.015)), 1.0);
}`;

/* the composite — revealed sea through the paper's fibres, premultiplied */
const FRAG_OUT = `#version 300 es
precision highp float;
uniform sampler2D uMask;
uniform sampler2D uSea;
uniform float uHasSea;
uniform vec3 uPaper;
uniform vec2 uCover; /* cover-fit scale for the sea texture */
in vec2 vUv;
out vec4 outColor;
void main(){
  float reveal = (1.0 - texture(uMask, vUv).r) * uHasSea;
  vec2 suv = (vUv - 0.5) * uCover + 0.5;
  vec3 sea = texture(uSea, suv).rgb;
  /* the fibre veil: never fully through the page (and a luminance floor) */
  sea = mix(sea, uPaper, 0.5);
  outColor = vec4(sea * reveal, reveal);
}`;

function hexToRgb01(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function UnderPaper({ className = "" }: { className?: string }) {
  const reduced = useUI((s) => s.reducedMotion);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
    });
    if (!gl) return; // no WebGL2 → the band stays paper

    let dead = false;
    let running = false;
    let lost = false; // sticky: a real GPU reset parks the band as paper for good
    let raf = 0;
    let acc = 0;
    let last = 0;
    let elapsed = 0;

    /* ── programs ─────────────────────────────────────────────────────── */
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const link = (fragSrc: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
      gl.linkProgram(p);
      return p;
    };
    const progSim = link(FRAG_SIM);
    const progOut = link(FRAG_OUT);
    if (!gl.getProgramParameter(progOut, gl.LINK_STATUS)) return;

    const uSim = {
      prev: gl.getUniformLocation(progSim, "uPrev"),
      trail: gl.getUniformLocation(progSim, "uTrail"),
      aspect: gl.getUniformLocation(progSim, "uAspectVec"),
    };
    const uOut = {
      mask: gl.getUniformLocation(progOut, "uMask"),
      sea: gl.getUniformLocation(progOut, "uSea"),
      hasSea: gl.getUniformLocation(progOut, "uHasSea"),
      paper: gl.getUniformLocation(progOut, "uPaper"),
      cover: gl.getUniformLocation(progOut, "uCover"),
    };

    /* ── sim state ────────────────────────────────────────────────────── */
    let simW = SIM_W;
    let simH = 256;
    const makeTex = (w: number, h: number) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return t;
    };
    let texA: WebGLTexture | null = null;
    let texB: WebGLTexture | null = null;
    let fbA: WebGLFramebuffer | null = null;
    let fbB: WebGLFramebuffer | null = null;

    /* trail canvas (CPU splat — the reference's 2D-canvas stroke, sim-sized) */
    const trail = document.createElement("canvas");
    const tctx = trail.getContext("2d")!;
    const trailTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, trailTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let brush = 100;
    let moveThr = 0.5;
    let curX: number | null = null;
    let curY = 0;
    let lastX = 0;
    let lastY = 0;
    let tgtX = 0.5;
    let tgtY = 0.5;
    let opacity = 0;

    const seed = () => {
      // paper intact: mask starts WHITE everywhere (inverse of upstream)
      gl.clearColor(1, 1, 1, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbA);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      curX = null;
      opacity = 0;
    };

    const allocSim = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      simW = SIM_W;
      simH = Math.max(64, Math.min(1024, Math.round((SIM_W * rect.height) / rect.width)));
      [texA, texB].forEach((t) => t && gl.deleteTexture(t));
      [fbA, fbB].forEach((f) => f && gl.deleteFramebuffer(f));
      texA = makeTex(simW, simH);
      texB = makeTex(simW, simH);
      fbA = gl.createFramebuffer();
      fbB = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbA);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texA, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texB, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      trail.width = simW;
      trail.height = simH;
      // brush: 20% of the band's width exactly; the 100px floor is CSS px
      brush = Math.max(0.2 * simW, 100 * (simW / rect.width));
      moveThr = 0.5 * (simW / (rect.width * Math.min(window.devicePixelRatio || 1, 2)));
      // display buffer + aspect
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      seed();
    };

    /* ── sea texture ──────────────────────────────────────────────────── */
    // allocated 1×1 immediately: an unallocated texture bound to a sampled
    // unit is "incomplete" and Chrome logs a RENDER WARNING per draw while
    // the poster decodes (review finding) — uHasSea keeps it invisible
    const seaTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, seaTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
    let hasSea = 0;
    let seaW = 3;
    let seaH = 2;
    const img = new Image();
    img.decoding = "async";
    img.src = "/coast/sea-poster.webp";
    img.onload = () => {
      if (dead || lost) return;
      gl.bindTexture(gl.TEXTURE_2D, seaTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      seaW = img.naturalWidth;
      seaH = img.naturalHeight;
      hasSea = 1;
    };
    // a failed fetch just leaves the band as paper (hasSea stays 0)
    img.onerror = () => {};

    /* ── pointer ──────────────────────────────────────────────────────── */
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      tgtX = (e.clientX - rect.left) / rect.width;
      tgtY = (e.clientY - rect.top) / rect.height;
    };
    if (!coarse) window.addEventListener("mousemove", onMove, { passive: true });

    /* ── one 60 Hz sim step (constants are per-STEP, as upstream per-frame) */
    const stepSim = () => {
      if (coarse) {
        // the reference's touch trail: a 1:2 Lissajous figure-8
        const t = elapsed * 1.3;
        tgtX = 0.5 + 0.5 * Math.sin(t);
        tgtY = 0.5 + 0.5 * Math.sin(t * 2.0);
      }
      const tx = tgtX * simW;
      const ty = tgtY * simH;
      if (curX === null) {
        curX = tx;
        curY = ty;
        lastX = tx;
        lastY = ty;
        return;
      }
      curX += (tx - curX) * 0.075;
      curY += (ty - curY) * 0.075;
      const d = Math.hypot(curX - lastX, curY - lastY);
      opacity = d > moveThr ? Math.min(1, opacity + 0.1) : Math.max(0, opacity - 0.1);

      tctx.fillStyle = "white";
      tctx.fillRect(0, 0, simW, simH);
      if (opacity > 0.01) {
        tctx.beginPath();
        tctx.moveTo(lastX, lastY);
        tctx.lineTo(curX, curY);
        tctx.lineCap = "round";
        tctx.lineWidth = brush;
        tctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
        tctx.stroke();
      }
      lastX = curX;
      lastY = curY;

      gl.bindTexture(gl.TEXTURE_2D, trailTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, trail);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      // erosion pass: A -> B, then swap
      gl.useProgram(progSim);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
      gl.viewport(0, 0, simW, simH);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.uniform1i(uSim.prev, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, trailTex);
      gl.uniform1i(uSim.trail, 1);
      // isotropic-in-pixels erosion arms (uniform, not baked — gotcha #4)
      const a = simH / simW;
      if (simW >= simH) gl.uniform2f(uSim.aspect, a, 1);
      else gl.uniform2f(uSim.aspect, 1, simW / simH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      [texA, texB] = [texB, texA];
      [fbA, fbB] = [fbB, fbA];
    };

    const paper = hexToRgb01(palette.paper);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // `lost` is sticky (the IO callback must not resurrect a dead context);
      // `!texA` guards the never-allocated path (review finding: stepSim on a
      // null framebuffer would paint the erosion INTO the visible canvas)
      if (!running || lost || !texA || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsed += dt;
      acc = Math.min(acc + dt, STEP * 3);
      while (acc >= STEP) {
        stepSim();
        acc -= STEP;
      }
      // composite: revealed sea over the DOM paper (premultiplied)
      gl.useProgram(progOut);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.uniform1i(uOut.mask, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, seaTex);
      gl.uniform1i(uOut.sea, 1);
      gl.uniform1f(uOut.hasSea, hasSea);
      gl.uniform3f(uOut.paper, paper[0], paper[1], paper[2]);
      // cover-fit the sea against the band
      const bandA = canvas.width / Math.max(1, canvas.height);
      const texA_ = seaW / seaH;
      if (bandA > texA_) gl.uniform2f(uOut.cover, 1, texA_ / bandA);
      else gl.uniform2f(uOut.cover, bandA / texA_, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /* ── gates & lifecycle ────────────────────────────────────────────── */
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) {
          // late first layout: retry the allocation the initial call skipped
          if (!texA) allocSim();
          // re-entry must not lerp the frozen brush toward wherever the
          // pointer went while we were away — that sweeps a full-width
          // erosion streak across the band (review finding). Snap instead.
          curX = null;
          opacity = 0;
        }
      },
      { rootMargin: "100px" },
    );
    io.observe(canvas);

    let resizeId = 0;
    const onResize = () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(allocSim, 150);
    };
    window.addEventListener("resize", onResize);

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true; // sticky — see the frame() gate
    };
    canvas.addEventListener("webglcontextlost", onLost);

    allocSim();
    raf = requestAnimationFrame((t) => {
      last = t;
      frame(t);
    });

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeId);
      io.disconnect();
      if (!coarse) window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onLost);
      [texA, texB, trailTex, seaTex].forEach((t) => t && gl.deleteTexture(t));
      [fbA, fbB].forEach((f) => f && gl.deleteFramebuffer(f));
      gl.deleteProgram(progSim);
      gl.deleteProgram(progOut);
      // Deliberately NO loseContext() here: getContext() returns the SAME
      // context object on the next effect run (StrictMode double-invoke, a
      // live reduced-motion flip), and a context lost via the extension
      // stays lost forever — the first draft killed itself that way (review
      // finding). Deleting the resources above frees the real memory; the
      // context dies with the canvas element on unmount. Clear the drawing
      // buffer so a flip-to-reduced doesn't freeze the last frame on screen.
      if (!gl.isContextLost()) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none ${className}`}
      // the reveal must die out before the band's edges — no hard seam against
      // the arch dome above or the horizontal journey below
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, #000 6%, #000 72%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, #000 6%, #000 72%, transparent 100%)",
      }}
    />
  );
}

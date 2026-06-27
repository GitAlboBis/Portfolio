"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useHeroStore } from "@/webgl/store/heroStore";
import { useScrollStore } from "@/webgl/store/scrollStore";

/*
  LIQUID-REVEAL TEXT (point 5) — the hero title rendered on a WebGL ortho quad and
  uncovered by water. The words ("Portfolio" eyebrow + "Alberto Tuveri") are drawn
  to an offscreen 2D canvas (a CanvasTexture), then a fragment shader sweeps a wavy
  "waterline" down the block as heroStore.reveal 0->1: above the line the text is
  dry and crisp; below it sits under a refracting, teal, caustic-lit sheet that
  retreats to uncover it, with a bright wet glint at the meniscus. Scroll velocity
  drives a vertical motion blur; a filmic grade + vignette + grain finish it.

  It runs on its own WebGL context (separate from the WebGPU water canvas) and
  only renders while the hero is on screen.
*/

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uText;
  uniform float uTime;
  uniform float uReveal;
  uniform float uVelocity;
  uniform vec2 uRes;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;

    // waterline descends (uv.y: 1=top, 0=bottom) as reveal grows; wobble it so it
    // reads like a real, restless water surface rather than a hard wipe.
    float wob = (fbm(vec2(uv.x * 3.0, t * 0.3)) - 0.5) * 0.05;
    float waterLine = mix(1.10, -0.10, uReveal) + wob;
    float band = 0.055;
    float dry = smoothstep(waterLine - band, waterLine + band, uv.y);
    float under = 1.0 - dry;

    // refraction: displace the text sample under / near the surface (kept gentle
    // so the letters stay legible as they emerge)
    vec2 disp = vec2(
      fbm(uv * 6.0 + t * 0.4) - 0.5,
      fbm(uv * 6.0 - t * 0.35 + 5.0) - 0.5
    ) * (under * 0.020 + 0.002);

    // subtle vertical motion blur on fast scroll (NOT enough to smear the letters)
    float mb = uVelocity * 0.005;
    vec4 tx = texture2D(uText, uv + disp + vec2(0.0, -2.0 * mb)) * 0.12;
    tx += texture2D(uText, uv + disp + vec2(0.0, -1.0 * mb)) * 0.24;
    tx += texture2D(uText, uv + disp) * 0.28;
    tx += texture2D(uText, uv + disp + vec2(0.0, 1.0 * mb)) * 0.24;
    tx += texture2D(uText, uv + disp + vec2(0.0, 2.0 * mb)) * 0.12;

    vec3 col = tx.rgb;
    float a = tx.a;

    // underwater: teal tint, dim, caustic shimmer
    float caustic = fbm(uv * 10.0 + vec2(t * 0.6, -t * 0.4));
    vec3 teal = vec3(0.42, 0.78, 0.86);
    col = mix(col, col * teal + caustic * 0.10 * teal, under * 0.8);
    col *= mix(1.0, 0.55, under);

    // wet meniscus glint on the letters at the surface
    float edge = smoothstep(band, 0.0, abs(uv.y - waterLine));
    col += vec3(0.62, 0.86, 0.96) * edge * a * 0.85;
    // fully submerged text is INVISIBLE (only the water "A" shows during the logo
    // beat); it materialises as the waterline passes, with a wet glint at the line.
    a = a * dry + edge * a * 0.5;

    // filmic finish: gentle lift, vignette, grain
    col = pow(max(col, 0.0), vec3(0.92));
    float d2 = dot(uv - 0.5, uv - 0.5);
    col *= 1.0 - 0.5 * d2;
    float grain = (hash(uv * uRes + fract(t) * vec2(91.7, 113.3)) - 0.5) * 0.06;
    col += grain;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

export function LiquidText() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);

    // offscreen text canvas -> texture
    const textCanvas = document.createElement("canvas");
    const tctx = textCanvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(textCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const uniforms = {
      uText: { value: texture },
      uTime: { value: 0 },
      uReveal: { value: reduce ? 1 : 0 },
      uVelocity: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const rootStyle = getComputedStyle(document.documentElement);
    const fraunces = rootStyle.getPropertyValue("--font-fraunces").trim() || "Georgia, serif";
    const hanken = rootStyle.getPropertyValue("--font-hanken").trim() || "system-ui, sans-serif";

    let cw = 1;
    let ch = 1;
    let dpr = 1;

    const drawText = () => {
      const W = textCanvas.width;
      const H = textCanvas.height;
      tctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const mid = H * 0.5;

      // ---- name: "ALBERTO" / "TUVERI" (grand serif, celeste-white gradient) ----
      const nameSize = Math.min(cw * 0.135, 210) * dpr;
      const lineH = nameSize * 0.92;
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.font = `500 ${nameSize}px ${fraunces}`;
      // gentle drop shadow for legibility over the sea
      tctx.shadowColor = "rgba(4,16,24,0.55)";
      tctx.shadowBlur = 26 * dpr;
      tctx.shadowOffsetY = 2 * dpr;

      const grad = tctx.createLinearGradient(cx - cw * dpr * 0.4, 0, cx + cw * dpr * 0.4, 0);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.38, "#ffffff");
      grad.addColorStop(0.5, "#9bd3ee");
      grad.addColorStop(0.62, "#ffffff");
      grad.addColorStop(1, "#ffffff");
      tctx.fillStyle = grad;

      const l1 = mid - lineH * 0.5; // ALBERTO (vertical center of the 2-line block)
      const l2 = mid + lineH * 0.5; // TUVERI
      tctx.fillText("ALBERTO", cx, l1);
      tctx.fillText("TUVERI", cx, l2);

      // ---- eyebrow: "Portfolio" (sans, letter-spaced small caps) ----
      tctx.shadowBlur = 8 * dpr;
      const ebSize = Math.max(11, cw * 0.0092) * dpr;
      tctx.font = `600 ${ebSize}px ${hanken}`;
      tctx.fillStyle = "rgba(244,250,251,0.86)";
      // canvas letterSpacing is supported in modern Chromium; guard for the rest
      try {
        (tctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${ebSize * 0.26}px`;
      } catch {}
      tctx.fillText("PORTFOLIO", cx, l1 - lineH * 0.78);
      try {
        (tctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
      } catch {}
      tctx.shadowColor = "transparent";
      tctx.shadowBlur = 0;
      tctx.shadowOffsetY = 0;

      texture.needsUpdate = true;
    };

    const resize = () => {
      cw = canvas.clientWidth || window.innerWidth;
      ch = canvas.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(cw, ch, false);
      textCanvas.width = Math.max(1, Math.floor(cw * dpr));
      textCanvas.height = Math.max(1, Math.floor(ch * dpr));
      uniforms.uRes.value.set(textCanvas.width, textCanvas.height);
      drawText();
    };

    resize();
    drawText();
    // redraw once webfonts have loaded (first paint may use the fallback metrics)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => drawText()).catch(() => {});
    }
    window.addEventListener("resize", resize);

    // only run while the hero is on screen
    let heroVisible = true;
    const heroEl = document.getElementById("hero");
    const io = heroEl
      ? new IntersectionObserver(
          (entries) => {
            heroVisible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0 },
        )
      : null;
    if (io && heroEl) io.observe(heroEl);

    let raf = 0;
    const start = performance.now();
    let vel = 0;
    let drewBlank = false; // ensure one clear so a stale frame never lingers
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!heroVisible) return;

      const reveal = reduce ? 1 : useHeroStore.getState().reveal;
      // smoothed scroll velocity -> motion blur amount (kept low so text stays sharp)
      const raw = Math.min(Math.abs(useScrollStore.getState().velocity) * 0.18, 0.6);
      vel += (raw - vel) * 0.2;

      // EARLY-OUT: for ~the first half of the hero the title is fully submerged
      // (reveal===0) and nothing is moving (no meniscus shimmer, no motion blur),
      // so the shader output is entirely transparent — skip the draw entirely.
      // We still clear ONCE so no previous frame is left on the canvas.
      if (reveal <= 0 && vel < 0.002) {
        if (!drewBlank) {
          renderer.clear();
          drewBlank = true;
        }
        return;
      }
      drewBlank = false;

      uniforms.uTime.value = (performance.now() - start) * 0.001;
      uniforms.uReveal.value = reveal;
      uniforms.uVelocity.value = vel;
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    // Decorative: the accessible hero title is the sr-only <h1> in hero.tsx.
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

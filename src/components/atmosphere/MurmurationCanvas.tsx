"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { palette } from "@/content/tokens";

/*
  MurmurationCanvas — the R3F half of the About atmosphere (see Murmuration.tsx
  for the shell/gating). A starling murmuration over the golden-hour band:

  • BOIDS on the CPU (separation / alignment / cohesion over a spatial hash),
    rendered as ONE InstancedMesh of paper-bird triangles — wing flap runs in
    the vertex shader off a per-instance phase, so per-frame JS cost is just
    the sim + matrix writes.
  • FORMATION — each bird owns a home point sampled from the letter "A"
    (Bricolage, drawn to an offscreen 2D canvas): idle, the flock settles into
    the mark — the hero's water "A" reborn as birds. Re-sampled once
    document.fonts is ready so the glyph is the real display cut.
  • DISPERSION — Lenis scroll velocity collapses the formation weight and
    injects turbulence + vertical wind: scrolling SCATTERS the flock; stop,
    and it slowly re-gathers (fast break / slow re-form asymmetry).
  • PREDATOR — the pointer repels nearby birds (fine pointers; the canvas is
    pointer-events-none so text stays selectable — we listen on window).

  House rules: frameloop="demand" + rect-poll FrameGate (same pattern as
  WorksGalleryCanvas — renders only while #about is on screen), dpr ≤ 1.5,
  transform-only DOM impact (it's a canvas), aria-hidden, reduced-motion never
  mounts this file at all.
*/

const CAM_Z = 16;
const FOV = 35;
const CELL = 0.7; // spatial-hash cell ≈ the largest perception radius

// ── forces / feel (world units: section height ≈ 10u) ─────────────────────
const SEP_R = 0.3;
const ALI_R = 0.65;
const COH_R = 0.65;
const MAX_NEIGHBORS = 12;
const MIN_SPEED = 0.45;

const _v = new THREE.Vector3();

// ── bird: 3 triangles, nose toward +Z (Object3D.lookAt convention), wings on
// X — the shader flaps whatever has |x| (tips), the body spine stays still.
function birdGeometry(count: number, rand: () => number) {
  const g = new THREE.InstancedBufferGeometry();
  // prettier-ignore
  const verts = new Float32Array([
    // body sliver
    0, 0.045, 0.55,   0, -0.025, 0.62,   0, -0.03, -0.48,
    // left wing
    0, 0, 0.18,   -0.75, 0.02, -0.12,   0, 0, -0.26,
    // right wing
    0, 0, 0.18,   0, 0, -0.26,   0.75, 0.02, -0.12,
  ]);
  g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  const phase = new Float32Array(count);
  const scale = new Float32Array(count);
  const shade = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phase[i] = rand() * Math.PI * 2;
    scale[i] = 0.085 + rand() * 0.075; // small silhouettes — the mark stays crisp
    shade[i] = rand();
  }
  g.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
  g.setAttribute("aScale", new THREE.InstancedBufferAttribute(scale, 1));
  g.setAttribute("aShade", new THREE.InstancedBufferAttribute(shade, 1));
  return g;
}

const VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aScale;
  attribute float aShade;
  uniform float uTime;
  varying float vShade;
  void main() {
    vec3 p = position;
    // per-bird flap frequency + phase; only |x| (wing tips) moves
    float flap = sin(uTime * (7.0 + fract(aPhase) * 5.0) + aPhase * 6.2831);
    p.y += abs(position.x) * flap * 0.55;
    p *= aScale;
    // downstroke reads a touch darker — cheap fake shading
    vShade = aShade * 0.8 + 0.2 * (flap * 0.5 + 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uFade;
  varying float vShade;
  void main() {
    gl_FragColor = vec4(mix(uInk, uFade, vShade * 0.55), 1.0);
    // ColorManagement feeds uniforms in LINEAR working space; without this the
    // raw values hit the sRGB framebuffer and the espresso inks crush to black.
    #include <colorspace_fragment>
  }
`;

/** Rect-poll render gate (Lenis' smoothed scroll makes IO unreliable here). */
function FrameGate() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const sec = document.getElementById("about");
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!sec || document.hidden) return;
      const r = sec.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);
  return null;
}

/** Sample N points inside the glyph "A" (display font) → world-space homes. */
function sampleGlyphHomes(
  home: Float32Array,
  count: number,
  opts: { cx: number; cy: number; height: number; rand: () => number },
) {
  const SIZE = 220;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const family =
    getComputedStyle(document.querySelector("#about .t-display") ?? document.body).fontFamily ||
    '"Bricolage Grotesque", sans-serif';
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.font = `700 ${SIZE * 0.86}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText("A", SIZE / 2, SIZE * 0.54);
  const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const hits: number[] = [];
  for (let i = 3; i < px.length; i += 4) if (px[i] > 140) hits.push((i - 3) / 4);
  if (!hits.length) return;
  const worldPer = opts.height / (SIZE * 0.86); // glyph em → world
  for (let i = 0; i < count; i++) {
    const p = hits[(opts.rand() * hits.length) | 0];
    const gx = p % SIZE;
    const gy = (p / SIZE) | 0;
    home[i * 3] = opts.cx + (gx - SIZE / 2 + (opts.rand() - 0.5) * 2) * worldPer;
    home[i * 3 + 1] = opts.cy - (gy - SIZE * 0.54 + (opts.rand() - 0.5) * 2) * worldPer;
    home[i * 3 + 2] = (opts.rand() - 0.5) * 0.9;
  }
}

function Flock({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { viewport, size, gl } = useThree();

  // Deterministic-ish per-mount RNG (no Math.random in render paths).
  const rand = useMemo(() => {
    let s = 1234567;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  }, []);

  const geometry = useMemo(() => birdGeometry(count, rand), [count, rand]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uInk: { value: new THREE.Color(palette.ink) },
          uFade: { value: new THREE.Color(palette.inkMute) },
        },
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const sim = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const home = new Float32Array(count * 3);
    const bx = viewport.width * 0.44;
    const by = viewport.height * 0.44;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() * 2 - 1) * bx;
      pos[i * 3 + 1] = (rand() * 2 - 1) * by;
      pos[i * 3 + 2] = (rand() - 0.5) * 1.2;
      const a = rand() * Math.PI * 2;
      vel[i * 3] = Math.cos(a) * 1.2;
      vel[i * 3 + 1] = Math.sin(a) * 1.2;
      vel[i * 3 + 2] = (rand() - 0.5) * 0.4;
      home[i * 3] = pos[i * 3];
      home[i * 3 + 1] = pos[i * 3 + 1];
      home[i * 3 + 2] = 0;
    }
    return { pos, vel, home, form: 0, time: 0 };
    // viewport extents only seed the start cloud — no need to re-create on resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, rand]);

  // Glyph homes: where the flock settles. Sized/positioned in VIEWPORT terms
  // (the canvas spans the whole tall section): ~62vh tall, right-of-center on
  // desktop, centered on mobile, its heart ~55vh below the section top.
  useEffect(() => {
    const place = () => {
      const wpp = viewport.height / size.height; // world units per CSS px
      const vhWorld = window.innerHeight * wpp;
      const isMobile = window.innerWidth < 768;
      const height = Math.min(vhWorld * 0.68, viewport.width * (isMobile ? 0.9 : 0.55));
      sampleGlyphHomes(sim.home, count, {
        cx: isMobile ? 0 : viewport.width * 0.21,
        cy: viewport.height / 2 - vhWorld * (isMobile ? 0.62 : 0.57),
        height,
        rand,
      });
    };
    place();
    let alive = true;
    document.fonts?.ready.then(() => alive && place()); // re-sample on the real display cut
    return () => {
      alive = false;
    };
  }, [sim, count, rand, viewport.width, viewport.height, size.height]);

  // Pointer predator — canvas is pointer-events-none, so listen on window.
  // Only SCREEN coords are stored here; the world projection happens per frame
  // against the LIVE canvas rect (a screen point stored as world coords goes
  // stale the moment the page scrolls under a stationary cursor, leaving a
  // phantom repulsion bubble parked on the glyph). Parked on blur/leave.
  const pointerScreen = useRef({ x: 0, y: 0, active: false });
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const p = pointerScreen.current;
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      p.active = true;
    };
    const park = () => {
      p.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", park);
    document.addEventListener("pointerleave", park);
    document.addEventListener("visibilitychange", park);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", park);
      document.removeEventListener("pointerleave", park);
      document.removeEventListener("visibilitychange", park);
    };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const grid = useMemo(() => new Map<number, number[]>(), []);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(Math.max(delta, 0.001), 0.033);
    const { pos, vel, home } = sim;
    sim.time += dt;
    material.uniforms.uTime.value = sim.time;

    // Scroll → formation weight. Fast break, slow re-gather — dt-normalized
    // exponential smoothing so the feel is identical at 60Hz and 144Hz.
    const lenis = (window as unknown as { __lenis?: { velocity?: number } }).__lenis;
    const v = lenis?.velocity ?? 0;
    const vAbs = Math.abs(v);
    const formTarget = Math.min(1, Math.max(0, 1 - (vAbs - 1.5) / 9));
    const formRate = formTarget < sim.form ? 12 : 1.8; // per second
    sim.form += (formTarget - sim.form) * (1 - Math.exp(-formRate * dt));
    const form = sim.form;

    // Formed, the flock must PACK into the glyph strokes: separation radius
    // and the swarm forces collapse with `form`, or 560 birds can physically
    // never fit the mark (sep 0.3u ≈ 54px » stroke width).
    const sepR = SEP_R * (1 - form * 0.75);
    const sepW = 3.2 * (1 - form * 0.55);
    const aliW = 0.9 * (1 - form * 0.85);
    const cohW = 0.55 * (1 - form * 0.9);
    const seekW = 0.06 + form * 2.1;
    const noiseW = 0.18 + (1 - form) * 2.6;
    const minSpeed = MIN_SPEED * (1 - form * 0.7);
    const windY = Math.max(-3.2, Math.min(3.2, v * 0.055)) * (1 - form * 0.6);
    const maxSpeed = 2.2 + (1 - form) * 2.6 + Math.min(vAbs * 0.03, 1.4);
    const bx = viewport.width * 0.47;
    const by = viewport.height * 0.47;
    // Predator world position from the LIVE rect (tracks scroll correctly).
    let px = -1e3;
    let py = -1e3;
    if (pointerScreen.current.active) {
      const rect = gl.domElement.getBoundingClientRect();
      const sy = pointerScreen.current.y;
      if (sy >= rect.top && sy <= rect.bottom) {
        const wpp = viewport.height / size.height;
        px = (pointerScreen.current.x - rect.left - rect.width / 2) * wpp;
        py = -(sy - rect.top - rect.height / 2) * wpp;
      }
    }

    // spatial hash rebuild
    grid.clear();
    for (let i = 0; i < count; i++) {
      const key =
        (((pos[i * 3] / CELL) | 0) + 512) * 1049600 +
        (((pos[i * 3 + 1] / CELL) | 0) + 512) * 1025 +
        ((pos[i * 3 + 2] / CELL) | 0) +
        512;
      const bucket = grid.get(key);
      if (bucket) bucket.push(i);
      else grid.set(key, [i]);
    }

    const t = sim.time;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = pos[ix];
      const y = pos[ix + 1];
      const z = pos[ix + 2];
      let fx = 0;
      let fy = 0;
      let fz = 0;

      // — neighbors (27-cell walk, capped)
      let n = 0;
      let sx = 0, sy = 0, sz = 0; // separation
      let ax = 0, ay = 0, az = 0; // alignment
      let cx = 0, cy = 0, cz = 0; // cohesion
      const cxi = (x / CELL) | 0;
      const cyi = (y / CELL) | 0;
      const czi = (z / CELL) | 0;
      outer: for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++)
          for (let oz = -1; oz <= 1; oz++) {
            const bucket = grid.get((cxi + ox + 512) * 1049600 + (cyi + oy + 512) * 1025 + (czi + oz + 512));
            if (!bucket) continue;
            for (const j of bucket) {
              if (j === i) continue;
              const jx = j * 3;
              const dx = pos[jx] - x;
              const dy = pos[jx + 1] - y;
              const dz = pos[jx + 2] - z;
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 > ALI_R * ALI_R) continue;
              const d = Math.sqrt(d2) || 1e-4;
              if (d < sepR) {
                sx -= (dx / d) * (1 - d / sepR);
                sy -= (dy / d) * (1 - d / sepR);
                sz -= (dz / d) * (1 - d / sepR);
              }
              ax += vel[jx];
              ay += vel[jx + 1];
              az += vel[jx + 2];
              if (d2 < COH_R * COH_R) {
                cx += dx;
                cy += dy;
                cz += dz;
              }
              if (++n >= MAX_NEIGHBORS) break outer;
            }
          }
      if (n > 0) {
        fx += sx * sepW + (ax / n) * aliW * 0.4 + (cx / n) * cohW;
        fy += sy * sepW + (ay / n) * aliW * 0.4 + (cy / n) * cohW;
        fz += sz * sepW + (az / n) * aliW * 0.4 + (cz / n) * cohW;
      }

      // — home seek (the "A"), arrive-damped
      const hx = home[ix] - x;
      const hy = home[ix + 1] - y;
      const hz = home[ix + 2] - z;
      const hd = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1e-4;
      const arrive = Math.min(1, hd / 0.5);
      fx += (hx / hd) * seekW * arrive * 3.2;
      fy += (hy / hd) * seekW * arrive * 3.2;
      fz += (hz / hd) * seekW * arrive * 3.2;

      // — wander/turbulence (cheap trig noise; explodes when the form breaks)
      fx += Math.sin(t * 1.3 + i * 1.7) * noiseW * 0.6;
      fy += Math.cos(t * 1.1 + i * 2.3) * noiseW * 0.5 + windY;
      fz += Math.sin(t * 0.9 + i * 3.1) * noiseW * 0.25;

      // — predator (pointer) flee
      const pdx = x - px;
      const pdy = y - py;
      const pd2 = pdx * pdx + pdy * pdy;
      if (pd2 < 1.8 * 1.8) {
        const pd = Math.sqrt(pd2) || 1e-4;
        const w = (1 - pd / 1.8) * 5;
        fx += (pdx / pd) * w;
        fy += (pdy / pd) * w;
      }

      // — soft bounds (spring past the frame) + z shell
      if (x > bx) fx -= (x - bx) * 2.4;
      else if (x < -bx) fx -= (x + bx) * 2.4;
      if (y > by) fy -= (y - by) * 2.4;
      else if (y < -by) fy -= (y + by) * 2.4;
      fz -= z * 0.4;

      // — integrate (accel cap, speed clamp)
      const fMag = Math.sqrt(fx * fx + fy * fy + fz * fz);
      const fCap = 9;
      if (fMag > fCap) {
        const k = fCap / fMag;
        fx *= k;
        fy *= k;
        fz *= k;
      }
      let vx = vel[ix] + fx * dt * 3.2;
      let vy = vel[ix + 1] + fy * dt * 3.2;
      let vz = vel[ix + 2] + fz * dt * 3.2;
      // settle: birds parked on their glyph point shed speed instead of orbiting
      if (hd < 0.35 && form > 0.5) {
        const damp = 1 - 0.1 * form;
        vx *= damp;
        vy *= damp;
        vz *= damp;
      }
      const sp = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1e-4;
      const cl = sp > maxSpeed ? maxSpeed / sp : sp < minSpeed ? minSpeed / sp : 1;
      vx *= cl;
      vy *= cl;
      vz *= cl;
      vel[ix] = vx;
      vel[ix + 1] = vy;
      vel[ix + 2] = vz;
      pos[ix] = x + vx * dt;
      pos[ix + 1] = y + vy * dt;
      pos[ix + 2] = z + vz * dt;

      dummy.position.set(pos[ix], pos[ix + 1], pos[ix + 2]);
      _v.set(pos[ix] + vx, pos[ix + 1] + vy, pos[ix + 2] + vz);
      dummy.lookAt(_v);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

export function MurmurationCanvas() {
  // Client-only file (dynamic ssr:false) — window is safe here.
  const isMobile = window.innerWidth < 768;
  // Mobile degrades gracefully: fewer birds, dpr cap 1.25, no MSAA — this
  // canvas spans the whole tall section, so framebuffer memory is the cost.
  return (
    <Canvas
      aria-hidden
      camera={{ position: [0, 0, CAM_Z], fov: FOV }}
      dpr={[1, isMobile ? 1.25 : 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: !isMobile, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <FrameGate />
      <Flock count={isMobile ? 260 : 560} />
    </Canvas>
  );
}

export default MurmurationCanvas;

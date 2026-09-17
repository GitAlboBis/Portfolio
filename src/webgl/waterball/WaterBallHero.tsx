"use client";
/// <reference types="@webgpu/types" />

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera } from "./camera";
import { MLSMPMSimulator, mlsmpmParticleStructSize } from "./mls-mpm/mls-mpm";
import { FluidRenderer } from "./render/fluidRender";
import { renderUniformsViews, renderUniformsValues, numParticlesMax } from "./common";
import { useHeroStore, type BenchTier } from "@/webgl/store/heroStore";
// leva (the debug GUI) is a DEV-ONLY authoring tool. Its bindings are referenced ONLY
// inside `if (IS_DEV) { ... }` branches below; because IS_DEV resolves from
// process.env.NODE_ENV — a build-time literal in Next.js — Terser drops the dead dev
// branch in production, leaving these imports unused so the bundler tree-shakes leva
// out of the prod bundle entirely. No leva markup is ever rendered in prod.
import { Leva, useControls } from "leva";

/*
  WaterBall on the TEST BENCH (REDESIGN-SPEC §E.5 / §F Phase A, G4 respected).

  A faithful embed of matsuoka-601/WaterBall's raw-WebGPU MLS-MPM fluid (their exact
  .ts + .wgsl, vendored under ./ — the solver in mls-mpm/** and common.ts are READ-ONLY).
  This component is the demo's main() as a React client component, re-staged as an
  INSTRUMENT instead of a full-viewport hero:

    - it fills the bench box it is mounted in (`absolute inset-0`; the box is the
      DOM: paper-field backdrop + 1px ink frame, see components/bench/TestBench.tsx);
    - the canvas is sized by a ResizeObserver on the box, backing = box × DPR cap
      (1.5 desktop / 1.0 mobile), NO CSS transform ever touches it;
    - the particle count is picked by tier: 120,000 desktop / 60,000 mobile
      (`matchMedia("(max-width: 767px)")` or `hardwareConcurrency <= 4`);
    - every readout of the bench is READ FROM HERE and published to heroStore:
      sim.numParticles, the measured frame time (500ms moving average of the loop's
      deltas), the applied DPR, the tier; status "live" only after the first frame
      has actually completed on the GPU, "lost" on device.lost;
    - the sea-reflection pass is compiled but inactive (refl_strength = 0);
    - the cursor poke is kept (hover tracked on window, mapped into the box);
    - the old scroll "drain" beat (heroStore.explode → solver, camera dolly, fade)
      is kept INTACT but has no writer any more (HeroScrollSettle is unmounted),
      so it stays 0 and the fluid just churns in its confinement.

  Drag-orbit and wheel-zoom are disabled so the page still scrolls.
*/

// Tiering (§E.5 budget): the ONE function that picks both the particle count and
// the readout "Tier" — the bench prints what the engine actually used.
export const PARTICLES_DESKTOP = 120000;
export const PARTICLES_MOBILE = 60000;
export const DPR_CAP: Record<BenchTier, number> = { desktop: 1.5, mobile: 1.0 };

export function benchTier(): BenchTier {
  if (typeof window === "undefined") return "desktop";
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  return narrow || weak ? "mobile" : "desktop";
}
export function particleCountForTier(tier: BenchTier = benchTier()): number {
  return tier === "mobile" ? PARTICLES_MOBILE : PARTICLES_DESKTOP;
}
export function dprCapForTier(tier: BenchTier = benchTier()): number {
  return DPR_CAP[tier];
}
/**
 * WP-3b — optical-thickness gain of the tier, specialized into the fluid pipeline
 * (render/fluid.wgsl.ts `override thickness_gain`). Thickness is accumulated per
 * particle, so half the budget is half the body: at 60,000 particles the 350x230
 * figure washed out to a pale beige. Derived from the BUDGET, never from the
 * backing resolution, so a DPR change never alters the image.
 */
export function thicknessGainForTier(tier: BenchTier = benchTier()): number {
  return PARTICLES_DESKTOP / particleCountForTier(tier);
}

// BIG box (the splash BOUND; the "A" confinement inside is the rest shape, in
// g2p.wgsl — G4). Wide XY = room for the spray to fly out around the letter; thin Z
// keeps the slab. Grid caps at 80/axis. [80,60] is 4:3 — the bench box (760×540 /
// 350×230) is framed by Camera.fitDistance on the same box.
const INIT_BOX = [80, 60, 18];
const SPHERE_RADIUS = 20; // fluid cohesion sphere radius (grid units)
const MOUSE_RADIUS = 7; // grid-cell radius of the mouse poke (WaterBall medium = 6)
const STRETCH = 2.0;
const FOV = (45 * Math.PI) / 180;
const MLS_RADIUS = 0.7;
const MLS_DIAMETER = 2 * MLS_RADIUS;
const ZOOM_RATE = 0.7;
// The letter is a FIGURE IN A BOX, not a full-bleed hero: pull the camera back
// from the exact fit so the "A" sits inside the ruled frame with a printed margin
// instead of touching the top and bottom rules (verified on screen, WP-3).
const FRAME_MARGIN = 1.2;
const AUTO_ROTATE = false; // the "A" should read head-on, not spin out of legibility
// readout cadence: the frame-time moving average is published every 500ms (§E.5)
const FRAME_WINDOW_MS = 500;
/* SETTLE BEFORE YOU SHOW (finish review F2). The solver is untouched (G4): what
   changes is only WHEN the first live frame is PRESENTED. From a cold start the
   sample needs about four seconds of stepping before the confined field reads as
   a letter — until then the box is an undifferentiated churn, and the caption
   above it claims a letter-A field. So the engine renders into a canvas that is
   still transparent, accumulates RENDERED time here (idle time while the bench
   is scrolled out of view does not count), and only then flips the status to
   "live" — at which point TestBench cross-fades its captured still out and the
   LIVE stamp lands. Nothing is faked in the meantime: the readouts are already
   the real measured values and the `state` readout prints "Settling". */
const SETTLE_MS = 4200;
// a box resize rebuilds the render targets; debounced so a live drag doesn't thrash
const RESIZE_DEBOUNCE_MS = 200;

// Build-time literal (Next.js inlines process.env.NODE_ENV). Lets Terser
// dead-code-eliminate every IS_DEV branch — and the leva import — in production.
const IS_DEV = process.env.NODE_ENV !== "production";

// ──────────────────────────────────────────────────────────────────────────────
// Tuned defaults — the single source of truth for the fluid feel (G4: FROZEN).
// These are the EXACT values that the leva panel used to seed; production reads them
// directly (no GUI), and in dev the leva panel is initialized FROM them so Alberto's
// panel shows + tunes the identical numbers. DO NOT change any value here without an
// explicit retune: the rendered feel is calibrated to these.
const SPLASH_DEFAULTS = {
  inflate: 4.0,
  gravity: 0.05,
  drag: 0,
  restoreK: 0.1,
  speedGate: 1.5,
  leashRadius: 60,
  pokeForce: 0.85,
  // world gravity on ESCAPED droplets only (hold≈0) — the splash arcs + rains back
  // down like real water; the resting "A" never feels it (see g2p.wgsl).
  ballistic: 0.35,
  // EXPLODE-burst feel (legacy drain beat; unused on the bench, kept intact).
  explodeOut: 4.0,
  explodeGrav: 2.5,
  explodeDamp: 0.08,
  explodeCap: 16.0,
} as const;

const CAM_DEFAULTS = {
  sway: 0.18,
  swaySpeed: 0.35,
} as const;

type SplashValues = { [K in keyof typeof SPLASH_DEFAULTS]: number };
type CamValues = { [K in keyof typeof CAM_DEFAULTS]: number };

// Dev-only: live leva panels seeded from the frozen defaults, so the panel shows and
// tunes the exact same numbers. Returns the live (editable) values each frame.
function useDevHeroControls(): { splash: SplashValues; cam: CamValues } {
  const splash = useControls("splash", {
    inflate: { value: SPLASH_DEFAULTS.inflate, min: 0, max: 12, step: 0.1 },
    gravity: { value: SPLASH_DEFAULTS.gravity, min: 0, max: 2, step: 0.01 },
    drag: { value: SPLASH_DEFAULTS.drag, min: 0, max: 0.2, step: 0.005 },
    restoreK: { value: SPLASH_DEFAULTS.restoreK, min: 0, max: 3, step: 0.01 },
    speedGate: { value: SPLASH_DEFAULTS.speedGate, min: 0.1, max: 60, step: 0.1 },
    leashRadius: { value: SPLASH_DEFAULTS.leashRadius, min: 5, max: 120, step: 1 },
    pokeForce: { value: SPLASH_DEFAULTS.pokeForce, min: 0, max: 4, step: 0.01 },
    ballistic: { value: SPLASH_DEFAULTS.ballistic, min: 0, max: 1.5, step: 0.05 },
    explodeOut: { value: SPLASH_DEFAULTS.explodeOut, min: 0, max: 20, step: 0.5 },
    explodeGrav: { value: SPLASH_DEFAULTS.explodeGrav, min: 0, max: 15, step: 0.5 },
    explodeDamp: { value: SPLASH_DEFAULTS.explodeDamp, min: 0, max: 0.4, step: 0.01 },
    explodeCap: { value: SPLASH_DEFAULTS.explodeCap, min: 2, max: 60, step: 1 },
  });
  const cam = useControls("camera", {
    sway: { value: CAM_DEFAULTS.sway, min: 0, max: 0.6, step: 0.01 },
    swaySpeed: { value: CAM_DEFAULTS.swaySpeed, min: 0, max: 2, step: 0.01 },
  });
  return { splash, cam };
}

// Prod: no GUI, no hooks, no leva — just the frozen defaults. Selecting the impl at
// module scope (not per-render) keeps React's hook order stable within a build.
function useProdHeroControls(): { splash: SplashValues; cam: CamValues } {
  return { splash: SPLASH_DEFAULTS, cam: CAM_DEFAULTS };
}

const useHeroControls = IS_DEV ? useDevHeroControls : useProdHeroControls;

/** Everything that depends on the canvas backing size — rebuilt on resize. */
type Scene = {
  sim: MLSMPMSimulator;
  renderer: FluidRenderer;
  camera: Camera;
  context: GPUCanvasContext;
  renderUniformBuffer: GPUBuffer;
  ratio: number;
  dispose: () => void;
};

export function WaterBallHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [unsupported, setUnsupported] = useState(false);
  // The leva panel is portaled to <body> (dev only) so its z-index is not trapped
  // inside the bench box. The mounted gate avoids an SSR/hydration mismatch.
  const [levaReady, setLevaReady] = useState(false);
  useEffect(() => setLevaReady(true), []);

  // live fluid + camera tuning (dev: leva panel seeded from the frozen defaults;
  // prod: the frozen consts). The loop reads the latest values through refs.
  const { splash, cam: camCtl } = useHeroControls();
  const splashRef = useRef(splash);
  splashRef.current = splash;
  const camCtlRef = useRef(camCtl);
  camCtlRef.current = camCtl;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const store = useHeroStore.getState();
    if (typeof navigator === "undefined" || !navigator.gpu) {
      setUnsupported(true);
      store.set({ status: "still", reason: "nogpu" });
      return;
    }

    // tier + budget — decided ONCE per mount, printed as-is by the readouts
    const tier = benchTier();
    const particleTarget = particleCountForTier(tier);
    const dprCap = dprCapForTier(tier);
    store.set({ tier, status: "compiling", reason: null, particles: 0, frameMs: 0, dpr: 0 });

    let cancelled = false;
    let rafId = 0;
    let device: GPUDevice | null = null;
    let cubemapTexture: GPUTexture | null = null;
    let particleBuffer: GPUBuffer | null = null;
    let posvelBuffer: GPUBuffer | null = null;
    let scene: Scene | null = null;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    let resizeTimer = 0;
    // perf: only run the (expensive) MLS-MPM compute + SSF render while the bench
    // box is actually on screen. Off-screen -> idle the GPU entirely (§E.5).
    let benchVisible = true;
    // pointer hover in canvas BACKING px (the poke); tracked on window so a sweep
    // entering the box pokes naturally, mapped through the box rect.
    let hoverX = 0;
    let hoverY = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (!scene) return;
      const r = canvas.getBoundingClientRect();
      hoverX = (e.clientX - r.left) * scene.ratio;
      hoverY = (e.clientY - r.top) * scene.ratio;
    };
    // frame-time instrument: sum of frame deltas over the last window
    let lastFrameT = 0;
    let winStart = 0;
    let winSum = 0;
    let winN = 0;
    let firstFrameReported = false;
    /** rendered (not idle) ms since the first presented frame — the settle clock */
    let settleAcc = 0;
    let settled = false;
    // LEGACY drain beat (no writer on the bench; kept intact)
    let drained = false;
    let lastOpacity = "";
    const swayStart = performance.now();

    const backingSize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, dprCap);
      const cw = wrap.clientWidth || 1;
      const ch = wrap.clientHeight || 1;
      return { ratio, cw, ch, w: Math.max(1, Math.floor(ratio * cw)), h: Math.max(1, Math.floor(ratio * ch)) };
    };

    // Build (or rebuild) everything that depends on the canvas backing size:
    // canvas config, render targets, sim (its bind groups hold the depth map),
    // renderer, camera. The particle buffers persist across rebuilds, so a resize
    // continues the SAME fluid (numParticles is restored) — only the first build
    // seeds it (initFountain).
    const build = (dev: GPUDevice, cubemapView: GPUTextureView, seed: boolean) => {
      const { ratio, cw, ch, w, h } = backingSize();
      canvas.width = w;
      canvas.height = h;

      const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
      if (!context) throw new Error("webgpu canvas context unavailable");
      const presentationFormat = navigator.gpu!.getPreferredCanvasFormat();
      // premultiplied alpha: non-fluid pixels are transparent -> the DOM bench
      // backdrop (paper-field) shows through (see render/fluid.wgsl).
      context.configure({ device: dev, format: presentationFormat, alphaMode: "premultiplied" });

      renderUniformsViews.texel_size.set([1.0 / w, 1.0 / h]);
      // sea-reflection pass OFF on the bench (§F.2): compiled, inactive
      renderUniformsViews.waterline.set([0]);
      renderUniformsViews.refl_strength.set([0]);

      const renderUniformBuffer = dev.createBuffer({
        size: renderUniformsValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const depthMapTexture = dev.createTexture({
        size: [w, h, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: "r32float",
      });
      const depthMapView = depthMapTexture.createView();

      const prevCount = scene?.sim.numParticles ?? 0;
      const sim = new MLSMPMSimulator(
        particleBuffer!,
        posvelBuffer!,
        MLS_DIAMETER,
        dev,
        renderUniformBuffer,
        depthMapView,
        canvas,
      );
      const renderer = new FluidRenderer(
        dev,
        canvas,
        presentationFormat,
        MLS_RADIUS,
        FOV,
        posvelBuffer!,
        renderUniformBuffer,
        cubemapView,
        depthMapView,
        sim.restDensity,
        thicknessGainForTier(tier),
      );

      // hover is driven by our own window listener (box-relative, backing px), so
      // the camera gets an inert target and never sees raw clientX/clientY.
      const camera = new Camera(canvas, { orbit: false, zoom: false, hoverTarget: new EventTarget() });
      sim.reset(INIT_BOX, SPHERE_RADIUS);
      if (seed) {
        // THE BIRTH: a coordinated fountain assembles the letter (initFountain aims
        // every droplet at its home; the confinement closes the shape).
        sim.initFountain(INIT_BOX, particleTarget);
      } else {
        // resize: same particles, same positions — just tell the new sim how many
        sim.changeNumParticles(prevCount);
      }
      // face the letter head-on (+Z) and frame the sim box in the bench aspect
      const distance = Camera.fitDistance(INIT_BOX, FOV, cw / ch) * FRAME_MARGIN;
      camera.reset(distance, [INIT_BOX[0] / 2, INIT_BOX[1] / 2, INIT_BOX[2] / 2], FOV, ZOOM_RATE);
      camera.currentXtheta = 0;
      camera.recalculateView();
      // seed hover coords so the first frames don't poke with NaN
      hoverX = w / 2;
      hoverY = h / 2;
      camera.currentHoverX = hoverX;
      camera.currentHoverY = hoverY;
      camera.prevHoverX = hoverX;
      camera.prevHoverY = hoverY;

      store.set({ particles: sim.numParticles, dpr: ratio });

      scene = {
        sim,
        renderer,
        camera,
        context,
        renderUniformBuffer,
        ratio,
        dispose: () => {
          camera.dispose();
          depthMapTexture.destroy();
          renderUniformBuffer.destroy();
          // the renderer's own targets die with the device (no destroy API in the
          // vendored class); on a plain resize they are garbage for the GC.
        },
      };
      return scene;
    };

    const frame = () => {
      if (cancelled || !device || !scene) return;
      const dev = device;
      const { sim, renderer, camera, context, renderUniformBuffer } = scene;
      // bench scrolled out of view -> idle the GPU (no compute, no render).
      // Render-only gate; the solver/params stay untouched (G4). The frame-time
      // window is dropped so the idle gap never pollutes the readout.
      if (!benchVisible) {
        lastFrameT = 0;
        rafId = requestAnimationFrame(frame);
        return;
      }

      // ── frame-time instrument: moving average over FRAME_WINDOW_MS ──
      const now = performance.now();
      if (lastFrameT > 0) {
        const dt = now - lastFrameT;
        // the settle clock counts RENDERED time only (§F, finish review F2)
        if (firstFrameReported && !settled) {
          settleAcc += dt;
          if (settleAcc >= SETTLE_MS) {
            settled = true;
            const st = useHeroStore.getState();
            if (st.status === "warming") st.set({ status: "live", reason: null });
          }
        }
        winSum += dt;
        winN += 1;
        if (winStart === 0) winStart = now;
        if (now - winStart >= FRAME_WINDOW_MS && winN > 0) {
          useHeroStore.getState().set({ frameMs: winSum / winN });
          winSum = 0;
          winN = 0;
          winStart = now;
        }
      }
      lastFrameT = now;

      // push the latest tuning values into the sim before stepping (dev: leva)
      const sp = splashRef.current;
      sim.splashInflate = sp.inflate;
      sim.splashGravity = sp.gravity;
      sim.splashDrag = sp.drag;
      sim.splashRestoreK = sp.restoreK;
      sim.splashSpeedGate = sp.speedGate;
      sim.splashLeashRadius = sp.leashRadius;
      sim.pokeForce = sp.pokeForce;
      sim.splashBallistic = sp.ballistic;
      sim.splashExplodeOut = sp.explodeOut;
      sim.splashExplodeGrav = sp.explodeGrav;
      sim.splashExplodeDamp = sp.explodeDamp;
      sim.splashExplodeCap = sp.explodeCap;

      // LEGACY drain beat — intact, unused on the bench (heroStore.explode has no
      // writer any more, so this stays 0: no burst, no dolly, opacity 1).
      const explodeBeat = useHeroStore.getState().explode;
      sim.splashExplode = explodeBeat;
      if (explodeBeat > 0.05) drained = true;
      if (explodeBeat <= 0.02 && drained) {
        drained = false;
        sim.splashExplode = 0;
        sim.initFromHomes(INIT_BOX, particleTarget); // reform the "A"
        useHeroStore.getState().set({ particles: sim.numParticles });
      }
      const fade = explodeBeat <= 0.78 ? 1 : Math.max(0, 1 - (explodeBeat - 0.78) / 0.22);
      const fadeStr = String(fade);
      if (fadeStr !== lastOpacity) {
        lastOpacity = fadeStr;
        canvas.style.opacity = fadeStr;
      }
      if (explodeBeat >= 0.999 && fade <= 0.002) {
        rafId = requestAnimationFrame(frame);
        return;
      }

      // camera sway (yaw via sin, pitch via cos): camera-only life for the resting
      // letter — the solver never feels it. Eased in over ~2.5s from head-on.
      const cc = camCtlRef.current;
      const elapsed = (now - swayStart) * 0.001;
      const ramp = Math.min(1, elapsed / 2.5);
      const phase = elapsed * cc.swaySpeed;
      camera.currentXtheta = ramp * cc.sway * Math.sin(phase);
      camera.currentYtheta = ramp * cc.sway * 0.55 * Math.cos(phase);
      camera.currentDistance =
        Camera.fitDistance(INIT_BOX, FOV, canvas.width / canvas.height) * FRAME_MARGIN - explodeBeat * 16;
      camera.recalculateView();
      sim.changeBoxSize(INIT_BOX);
      // animation clock for the render shaders (micro-ripples + foam breakup)
      renderUniformsViews.time.set([elapsed]);
      dev.queue.writeBuffer(renderUniformBuffer, 0, renderUniformsValues);

      const enc = dev.createCommandEncoder();
      camera.currentHoverX = hoverX;
      camera.currentHoverY = hoverY;
      const mouseVel = camera.calcMouseVelocity();
      sim.execute(
        enc,
        [hoverX / canvas.width, hoverY / canvas.height],
        mouseVel,
        sim.numParticles, // home-fill already seeded all particles -> keep the jet off
        MOUSE_RADIUS,
      );
      renderer.execute(context, enc, sim.numParticles, false, STRETCH);
      dev.queue.submit([enc.finish()]);
      camera.setNewPrevMouseCoord();
      if (AUTO_ROTATE) camera.stepAngle();

      // LIVE only when the first frame has actually completed on the GPU
      if (!firstFrameReported) {
        firstFrameReported = true;
        dev.queue.onSubmittedWorkDone().then(() => {
          if (cancelled) return;
          const s = useHeroStore.getState();
          // the pipelines are built and the GPU has produced a frame — but the
          // sample has not settled yet, so the bench is WARMING, not live.
          if (s.status === "compiling") s.set({ status: "warming", reason: null });
        });
      }
      rafId = requestAnimationFrame(frame);
    };

    const run = async () => {
      const adapter = await navigator.gpu!.requestAdapter();
      if (!adapter) {
        setUnsupported(true);
        store.set({ status: "still", reason: "nogpu" });
        return;
      }
      const dev = await adapter.requestDevice();
      if (cancelled) {
        dev.destroy();
        return;
      }
      device = dev;
      // device.lost → the bench freezes on its last frame and says so (§E.5).
      // `destroy()` on unmount also resolves this promise — guarded by `cancelled`.
      dev.lost.then(() => {
        if (cancelled) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        useHeroStore.getState().set({ status: "lost", reason: "lost" });
      });

      // workshop cubemap [+X,-X,+Y,-Y,+Z,-Z] from /public/cubemap
      const imgSrcs = ["posx", "negx", "posy", "negy", "posz", "negz"].map((n) => `/cubemap/${n}.png`);
      const bitmaps = await Promise.all(
        imgSrcs.map(async (s) => createImageBitmap(await (await fetch(s)).blob())),
      );
      if (cancelled) {
        dev.destroy();
        return;
      }
      cubemapTexture = dev.createTexture({
        dimension: "2d",
        size: [bitmaps[0].width, bitmaps[0].height, 6],
        format: "rgba8unorm",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      bitmaps.forEach((bm, i) =>
        dev.queue.copyExternalImageToTexture(
          { source: bm },
          { texture: cubemapTexture!, origin: [0, 0, i] },
          [bm.width, bm.height],
        ),
      );
      const cubemapView = cubemapTexture.createView({ dimension: "cube" });

      // particle storage persists across resizes (the fluid continues)
      particleBuffer = dev.createBuffer({
        size: mlsmpmParticleStructSize * numParticlesMax,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      posvelBuffer = dev.createBuffer({
        size: 32 * numParticlesMax,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });

      build(dev, cubemapView, true);

      io = new IntersectionObserver(
        (entries) => {
          benchVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0 },
      );
      io.observe(wrap);

      // the bench box drives the backing size; a real size change rebuilds the
      // targets (debounced) and the SAME fluid continues in the new frame
      ro = new ResizeObserver(() => {
        if (cancelled) return;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (cancelled || !device || !scene) return;
          const { w, h } = backingSize();
          if (w === canvas.width && h === canvas.height) return;
          scene.dispose();
          build(device, cubemapView, false);
          lastFrameT = 0;
        }, RESIZE_DEBOUNCE_MS);
      });
      ro.observe(wrap);
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      if (cancelled) return;
      rafId = requestAnimationFrame(frame);
    };

    run().catch((e) => {
      if (cancelled) return;
      console.error("[bench] engine init failed:", e);
      setUnsupported(true);
      useHeroStore.getState().set({ status: "still", reason: "nogpu" });
    });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      io?.disconnect();
      ro?.disconnect();
      scene?.dispose();
      scene = null;
      particleBuffer?.destroy();
      posvelBuffer?.destroy();
      cubemapTexture?.destroy();
      // destroys every remaining GPU object of this device (textures, pipelines)
      device?.destroy();
      device = null;
      useHeroStore.getState().resetBench();
    };
  }, []);

  if (unsupported) return null;
  return (
    <>
      {/* Dev-only debug GUI (collapsed pill). Rendered ONLY when IS_DEV; the whole
          subtree (and the leva import) is dead-code-eliminated in production. */}
      {IS_DEV && levaReady ? createPortal(<Leva collapsed />, document.body) : null}
      {/* fills the bench box: the DOM box provides the paper-field backdrop and the
          1px ink frame; the canvas is transparent where there is no fluid.
          NO transform on this element or the canvas — ever (§E.5). */}
      <div
        ref={wrapRef}
        aria-hidden
        data-bench-canvas
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: "var(--z-bench)" }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </>
  );
}

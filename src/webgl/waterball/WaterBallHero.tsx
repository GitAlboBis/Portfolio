"use client";
/// <reference types="@webgpu/types" />

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Camera } from "./camera";
import { MLSMPMSimulator, mlsmpmParticleStructSize } from "./mls-mpm/mls-mpm";
import { FluidRenderer } from "./render/fluidRender";
import { renderUniformsViews, renderUniformsValues, numParticlesMax } from "./common";
import { useHeroStore } from "@/webgl/store/heroStore";
// leva (the debug GUI) is a DEV-ONLY authoring tool. Its bindings are referenced ONLY
// inside `if (IS_DEV) { ... }` branches below; because IS_DEV resolves from
// process.env.NODE_ENV — a build-time literal in Next.js — Terser drops the dead dev
// branch in production, leaving these imports unused so the bundler tree-shakes leva
// out of the prod bundle entirely. No leva markup is ever rendered in prod.
import { Leva, useControls } from "leva";

/*
  WaterBall hero — a faithful embed of matsuoka-601/WaterBall's raw-WebGPU MLS-MPM
  fluid (their exact .ts + .wgsl, vendored under ./). This is the standalone demo's
  main() re-implemented as a React client component: a canvas ref instead of
  document.querySelector, a cancelable RAF loop, abortable async init (StrictMode-
  safe), and full GPU teardown on unmount. Controls are fixed to the "medium" tier
  (paramsIdx=1); drag-orbit and wheel-zoom are disabled so the page still scrolls —
  only the cursor poke + a slow auto-rotate remain. The "A" morph comes later by
  editing mls-mpm/g2p.wgsl.
*/

// Step 1a: the fill no longer comes from a timed jet but from sampling the "A" volume
// directly (initFromHomes). This is now the MAX cap for that home-fill; the actual
// count is derived from the sampling spacing (and auto-widened to never exceed this cap
// with a uniform fill). Lower if the "A" looks dense/heavy; the spacing in initFromHomes
// controls per-volume density (overpressure/balloon).
// Denser fill = smoother screen-space fluid: sparse particles render as spikes, so a
// higher count keeps the "A" (and its dispersal) cohesive and clean. Raised 40k->120k
// (cap is numParticlesMax = 200k). Pair with a tighter initFromHomes baseSpacing.
const NUM_PARTICLES = 120000;
// BIG box (Alberto's "two boxes": this is the splash BOUND; the "A" confinement inside is
// the rest shape). Wide XY = room for the spray to fly out around the letter; thin Z keeps
// the slab. Grid caps at 80/axis, so 80 wide is the max splash reach.
const INIT_BOX = [80, 60, 18];
const INIT_DISTANCE = 72; // frame the box (~screen) so the spray is visible around the "A"
const SPHERE_RADIUS = 20; // fluid cohesion sphere radius (grid units)
const MOUSE_RADIUS = 9; // grid-cell radius of the mouse poke (WaterBall medium = 6; wider = bigger splash)
const STRETCH = 2.0;
const FOV = (45 * Math.PI) / 180;
const MLS_RADIUS = 0.7;
const MLS_DIAMETER = 2 * MLS_RADIUS;
const ZOOM_RATE = 0.7;
const AUTO_ROTATE = false; // the "A" should read head-on, not spin out of legibility

// Build-time literal (Next.js inlines process.env.NODE_ENV). Lets Terser
// dead-code-eliminate every IS_DEV branch — and the leva import — in production.
const IS_DEV = process.env.NODE_ENV !== "production";

// ──────────────────────────────────────────────────────────────────────────────
// Tuned defaults — the single source of truth for the fluid feel.
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
  pokeForce: 0.5,
  // EXPLODE-burst feel (the slow-mo water splash). Dial these live in the leva
  // "splash" panel, then tell me the numbers to bake in.
  explodeOut: 4.0, // radial burst force (0 = no burst)
  explodeGrav: 2.5, // gravity pulling the burst down afterwards
  explodeDamp: 0.08, // per-frame damping — higher = slower/more syrupy (slow-mo)
  explodeCap: 16.0, // max particle speed at full explode (the slow-motion ceiling)
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

export function WaterBallHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxWrapRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [unsupported, setUnsupported] = useState(false);
  // The leva panel renders inside CanvasHost's `fixed inset-0 z-0` wrapper, which traps
  // its z-index BELOW the site header (z-50) -> the header eats its clicks. Portal it to
  // <body> (dev only) so its z-index actually wins and the panel is clickable. The
  // mounted gate avoids an SSR/hydration mismatch from the portal.
  const [levaReady, setLevaReady] = useState(false);
  useEffect(() => setLevaReady(true), []);

  // Entry animation (point 1): a brief lens "focus pull" — the water "A" zooms in
  // from slightly large + blurred while a lens vignette clears. Plays once on
  // mount; honored only when the sim is mounted (reduced-motion never mounts us).
  useEffect(() => {
    const wrap = fxWrapRef.current;
    if (!wrap) return;
    gsap.set(wrap, { opacity: 0, scale: 1.14, filter: "blur(16px)" });
    gsap.set(lensRef.current, { opacity: 0.95 });
    const tl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        // CRITICAL for sharpness: drop the filter/transform once the focus-pull
        // finishes. A lingering CSS filter/transform forces the canvas onto a
        // composited layer that gets rasterized + scaled -> the "A" looks soft.
        gsap.set(wrap, { clearProps: "filter,transform" });
      },
    });
    tl.to(wrap, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0);
    tl.to(wrap, { scale: 1, filter: "blur(0px)", duration: 1.9, ease: "power3.out" }, 0);
    tl.to(lensRef.current, { opacity: 0, duration: 1.5, ease: "power2.out" }, 0.1);
    return () => {
      tl.kill();
    };
  }, []);

  // live water + camera tuning. In DEV this is the leva panel (top-right), seeded from
  // SPLASH_DEFAULTS/CAM_DEFAULTS so the GUI shows + edits the exact tuned numbers; in
  // PROD it is those frozen consts directly (no GUI, leva tree-shaken out). Either way
  // the RAF loop reads the latest values through refs so dev edits take effect instantly,
  // without rebuilding the sim — and prod renders the identical calibrated feel.
  //   inflate/gravity = the CHURN ENGINE (the water moves on its own, like the original
  //     WaterBall): inflate fills + stirs the "A" tube, gravity gently pulls to its centerline.
  //   restoreK/speedGate/leashRadius = confinement + splash recall (speedGate high so the
  //     gentle inner churn is NOT recalled; only fast mouse pokes escape, then get reeled home).
  //   sway/swaySpeed = the gentle 3D camera "sway" — the only safe way to give the resting
  //     "A" life. Moving the FLUID at rest disperses it (motion lifts speed past the gate so
  //     the restore switches off and the water scatters — proven/reverted twice; see HANDOFF
  //     gotcha). Orbiting the CAMERA never touches the sim. Yaw+pitch trace a small ellipse so
  //     the flat letter "floats" in 3D yet stays legible. sway=0 -> static head-on.
  const { splash, cam: camCtl } = useHeroControls();
  const splashRef = useRef(splash);
  splashRef.current = splash;
  const camCtlRef = useRef(camCtl);
  camCtlRef.current = camCtl;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !navigator.gpu) {
      setUnsupported(true);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let device: GPUDevice | null = null;
    let camera: Camera | null = null;
    let io: IntersectionObserver | null = null;
    // perf: only run the (expensive) MLS-MPM compute + SSF render while the hero
    // section is actually on screen. Off-screen -> idle the GPU entirely.
    let heroVisible = true;

    const run = async () => {
      const adapter = await navigator.gpu!.requestAdapter();
      if (!adapter) {
        setUnsupported(true);
        return;
      }
      const dev = await adapter.requestDevice();
      if (cancelled) {
        dev.destroy();
        return;
      }
      device = dev;

      const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
      if (!context) {
        setUnsupported(true);
        return;
      }

      // backing resolution: bounded DPR. canvas.width/height MUST be set before the
      // simulator/renderer read them (they size textures + the mouse round-trip).
      const ratio = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
      const cw = canvas.clientWidth || window.innerWidth;
      const ch = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(ratio * cw));
      canvas.height = Math.max(1, Math.floor(ratio * ch));

      const presentationFormat = navigator.gpu!.getPreferredCanvasFormat();
      // premultiplied alpha so the fluid renders OVER the video backdrop (the
      // non-fluid pixels are transparent — see render/fluid.wgsl).
      context.configure({ device: dev, format: presentationFormat, alphaMode: "premultiplied" });

      // sky cubemap [+X,-X,+Y,-Y,+Z,-Z] from /public/cubemap
      const imgSrcs = ["posx", "negx", "posy", "negy", "posz", "negz"].map((n) => `/cubemap/${n}.png`);
      const bitmaps = await Promise.all(
        imgSrcs.map(async (s) => createImageBitmap(await (await fetch(s)).blob())),
      );
      if (cancelled) {
        dev.destroy();
        return;
      }
      const cubemapTexture = dev.createTexture({
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
          { texture: cubemapTexture, origin: [0, 0, i] },
          [bm.width, bm.height],
        ),
      );
      const cubemapView = cubemapTexture.createView({ dimension: "cube" });

      renderUniformsViews.texel_size.set([1.0 / canvas.width, 1.0 / canvas.height]);

      const particleBuffer = dev.createBuffer({
        size: mlsmpmParticleStructSize * numParticlesMax,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const posvelBuffer = dev.createBuffer({
        size: 32 * numParticlesMax,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const renderUniformBuffer = dev.createBuffer({
        size: renderUniformsValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const depthMapTexture = dev.createTexture({
        size: [canvas.width, canvas.height, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: "r32float",
      });
      const depthMapView = depthMapTexture.createView();

      const sim = new MLSMPMSimulator(
        particleBuffer,
        posvelBuffer,
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
        posvelBuffer,
        renderUniformBuffer,
        cubemapView,
        depthMapView,
        sim.restDensity,
      );

      camera = new Camera(canvas, { orbit: false, zoom: false, hoverTarget: window });
      sim.reset(INIT_BOX, SPHERE_RADIUS);
      // step 1a: fill the "A" instantly by seeding particles on sampled home positions
      // (replaces the ~13s jet). With no gravity, they hold the shape; the existing
      // g2p wall still confines. Disables the jet (numParticles already == target).
      sim.initFromHomes(INIT_BOX, NUM_PARTICLES);
      // face the "A" head-on (+Z) and frame its center. The letter lives in box XY
      // (apex y=52, feet y=9 -> center ~30.5); reset() defaults to a side-on angle that
      // suited the symmetric ball but would show the flat letter edge-on.
      camera.reset(INIT_DISTANCE, [INIT_BOX[0] / 2, INIT_BOX[1] / 2, INIT_BOX[2] / 2], FOV, ZOOM_RATE);
      camera.currentXtheta = 0;
      camera.recalculateView();
      // seed hover coords so the first frames don't poke with NaN
      camera.currentHoverX = cw / 2;
      camera.currentHoverY = ch / 2;
      camera.prevHoverX = camera.currentHoverX;
      camera.prevHoverY = camera.currentHoverY;
      const realBoxSize = [...INIT_BOX];
      const swayStart = performance.now();
      // DRAIN beat is scrub-driven (Direction A). Track whether we've drained so the
      // "A" is refilled cleanly once scrolled fully back to the top.
      let drained = false;

      const heroEl = document.getElementById("hero");
      if (heroEl) {
        io = new IntersectionObserver(
          (entries) => {
            heroVisible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0 },
        );
        io.observe(heroEl);
      }

      if (cancelled) {
        dev.destroy();
        return;
      }

      const frame = () => {
        if (cancelled || !device || !camera) return;
        // hero scrolled out of view -> idle the GPU (no compute, no render)
        if (!heroVisible) {
          rafId = requestAnimationFrame(frame);
          return;
        }
        // push the latest leva values into the sim before stepping (live tuning)
        const sp = splashRef.current;
        sim.splashInflate = sp.inflate;
        sim.splashGravity = sp.gravity;
        sim.splashDrag = sp.drag;
        sim.splashRestoreK = sp.restoreK;
        sim.splashSpeedGate = sp.speedGate;
        sim.splashLeashRadius = sp.leashRadius;
        sim.pokeForce = sp.pokeForce;
        sim.splashExplodeOut = sp.explodeOut;
        sim.splashExplodeGrav = sp.explodeGrav;
        sim.splashExplodeDamp = sp.explodeDamp;
        sim.splashExplodeCap = sp.explodeCap;

        // DRAIN beat (Direction A) — scrub-driven + reversible. hero.tsx writes
        // heroStore.explode 0->1 as you scroll in; we feed it STRAIGHT to the sim so
        // the "A" loses surface tension and POURS DOWNWARD into the dive (g2p), instead
        // of a wall-clock starburst. The canvas fades as the drain completes (the water
        // merges into the sea); scrolling back up reverses it and reforms the "A".
        const explodeBeat = useHeroStore.getState().explode;
        sim.splashExplode = explodeBeat;
        if (explodeBeat > 0.05) drained = true;
        if (explodeBeat <= 0.02 && drained) {
          drained = false;
          sim.splashExplode = 0;
          sim.initFromHomes(INIT_BOX, NUM_PARTICLES); // reform the "A"
          canvas.style.opacity = "1";
        }
        // fade the fluid as the slow burst finishes dispersing into the sea (tied to
        // scroll) — start late so the slow-motion dispersal is fully seen first.
        const fade = explodeBeat <= 0.78 ? 1 : Math.max(0, 1 - (explodeBeat - 0.78) / 0.22);
        canvas.style.opacity = String(fade);
        // fully drained + faded -> idle the GPU (skip the heavy sim+render) until scrolled back
        if (explodeBeat >= 0.999 && fade <= 0.002) {
          rafId = requestAnimationFrame(frame);
          return;
        }

        // step 1c: drive the camera-sway ellipse (yaw via sin, pitch via cos) and rebuild
        // the view BEFORE the uniform upload below, so THIS frame renders from the swayed
        // camera. Eased in over ~2.5s so the "A" starts exactly head-on (yaw=pitch=0) and
        // drifts into the float. Pitch amplitude is shallower (0.55x) so the flat letter
        // stays legible. Auto-rotate stays off (sway sets the angles absolutely).
        const cc = camCtlRef.current;
        const elapsed = (performance.now() - swayStart) * 0.001;
        const ramp = Math.min(1, elapsed / 2.5);
        const phase = elapsed * cc.swaySpeed;
        camera.currentXtheta = ramp * cc.sway * Math.sin(phase);
        camera.currentYtheta = ramp * cc.sway * 0.55 * Math.cos(phase);
        camera.recalculateView();
        sim.changeBoxSize(realBoxSize);
        dev.queue.writeBuffer(renderUniformBuffer, 0, renderUniformsValues);
        const enc = dev.createCommandEncoder();
        sim.execute(
          enc,
          [camera.currentHoverX / canvas.clientWidth, camera.currentHoverY / canvas.clientHeight],
          camera.calcMouseVelocity(),
          sim.numParticles, // home-fill already seeded all particles -> keep the jet off
          MOUSE_RADIUS,
        );
        renderer.execute(context, enc, sim.numParticles, false, STRETCH);
        dev.queue.submit([enc.finish()]);
        camera.setNewPrevMouseCoord();
        if (AUTO_ROTATE) camera.stepAngle();
        rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    };

    run().catch((e) => {
      console.error("[waterball] init failed:", e);
      setUnsupported(true);
    });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      io?.disconnect();
      camera?.dispose();
      device?.destroy();
    };
  }, []);

  if (unsupported) return null;
  return (
    <>
      {/* Dev-only debug GUI. Rendered ONLY when IS_DEV; the whole subtree (and the
          leva import) is dead-code-eliminated in production. Explicit mount keeps the
          panel deterministic and lets us collapse it by default. */}
      {IS_DEV && levaReady ? createPortal(<Leva collapsed={false} />, document.body) : null}
      <div ref={fxWrapRef} aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
        {/* lens vignette — clears during the entry "focus pull" (point 1) */}
        <div
          ref={lensRef}
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 92% at 50% 48%, transparent 46%, rgba(4,16,24,.5) 86%, rgba(3,12,20,.78) 100%)",
          }}
        />
      </div>
    </>
  );
}

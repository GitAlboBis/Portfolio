"use client";
/// <reference types="@webgpu/types" />

import { useEffect, useRef, useState } from "react";
import { Camera } from "./camera";
import { MLSMPMSimulator, mlsmpmParticleStructSize } from "./mls-mpm/mls-mpm";
import { FluidRenderer } from "./render/fluidRender";
import { renderUniformsViews, renderUniformsValues, numParticlesMax } from "./common";
import { useControls } from "leva";

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
const NUM_PARTICLES = 40000;
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

export function WaterBallHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  // live water tuning (leva panel, top-right). The RAF loop reads the latest values through
  // a ref so edits take effect instantly, without rebuilding the sim.
  //   inflate/gravity = the CHURN ENGINE (the water moves on its own, like the original
  //     WaterBall): inflate fills + stirs the "A" tube, gravity gently pulls to its centerline.
  //   restoreK/speedGate/leashRadius = confinement + splash recall (speedGate high so the
  //     gentle inner churn is NOT recalled; only fast mouse pokes escape, then get reeled home).
  const splash = useControls("splash", {
    inflate: { value: 4.0, min: 0, max: 12, step: 0.1 },
    gravity: { value: 0.05, min: 0, max: 2, step: 0.01 },
    drag: { value: 0, min: 0, max: 0.2, step: 0.005 },
    restoreK: { value: 0.1, min: 0, max: 3, step: 0.01 },
    speedGate: { value: 2.5, min: 0.1, max: 60, step: 0.1 },
    leashRadius: { value: 60, min: 5, max: 120, step: 1 },
    pokeForce: { value: 1.0, min: 0, max: 4, step: 0.01 },
  });
  const splashRef = useRef(splash);
  splashRef.current = splash;

  // step 1c: gentle 3D camera "sway" — the only safe way to give the resting "A" life.
  // Moving the FLUID at rest disperses it (any motion lifts speed past the gate so the
  // restore switches off and the water scatters — proven/reverted twice; see HANDOFF
  // gotcha). Orbiting the CAMERA never touches the sim. Yaw+pitch trace a small ellipse so
  // the flat letter "floats" in 3D yet stays legible (a full rotation would show it edge-
  // on). sway=0 -> static head-on. Read live via ref so the leva edits apply instantly.
  const camCtl = useControls("camera", {
    sway: { value: 0.18, min: 0, max: 0.6, step: 0.01 },
    swaySpeed: { value: 0.35, min: 0, max: 2, step: 0.01 },
  });
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
      context.configure({ device: dev, format: presentationFormat, alphaMode: "opaque" });

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

      if (cancelled) {
        dev.destroy();
        return;
      }

      const frame = () => {
        if (cancelled || !device || !camera) return;
        // push the latest leva values into the sim before stepping (live tuning)
        const sp = splashRef.current;
        sim.splashInflate = sp.inflate;
        sim.splashGravity = sp.gravity;
        sim.splashDrag = sp.drag;
        sim.splashRestoreK = sp.restoreK;
        sim.splashSpeedGate = sp.speedGate;
        sim.splashLeashRadius = sp.leashRadius;
        sim.pokeForce = sp.pokeForce;
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
      camera?.dispose();
      device?.destroy();
    };
  }, []);

  if (unsupported) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

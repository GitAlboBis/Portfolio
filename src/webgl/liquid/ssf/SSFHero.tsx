"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useFrame, useThree } from "@react-three/fiber";
import { useFluidSim, type FluidSim } from "./useFluidSim";
import { useMlsMpmSim } from "./useMlsMpmSim";
import {
  makeDepthMaterial,
  makeThicknessMaterial,
  makeDepthBlurMaterial,
  makeGaussianMaterial,
  makeCompositeMaterial,
  BG_SENTINEL,
} from "./materials";
import { FLUID_COUNT, LIQUID_LAYER, BACKDROP_LAYER } from "./constants";

/*
  Screen-space-fluid render manager for the "A". ONE component owns all rendering
  at useFrame priority 1 — which disables R3F's auto-render — and drives the seven
  passes by hand (blueprint §A/§B):

    P0 backdrop  -> backdropRT     (BACKDROP_LAYER)
    P1 depth     -> depthRT_A      (LIQUID_LAYER, spheres, eye-z, depth-tested)
    P2 blur(H,V) -> depthRT_A      (masked Gaussian, x2; silhouette-preserving)
    P3 thickness -> thicknessRT    (LIQUID_LAYER, additive, half-res)
    P4 blur(H,V) -> thickBlur_B    (Gaussian, half-res)
    P5 composite -> SCREEN         (Fresnel + sky reflection + backdrop refraction
                                    + Beer-Lambert + specular)

  The single invariant that prevents the "composite hides the model" bug: the ONLY
  pass that touches the default framebuffer is P5, and it runs LAST. All renderer
  state (autoClear, clear color+alpha, camera layer mask, render target) is saved
  on entry and restored in a finally block — the frame always ends on the default
  framebuffer. See HANDOFF §"Prossimi passi 1a".
*/

// dev-only leva panel for live water tuning; tree-shaken out of production
const SSFControls =
  process.env.NODE_ENV !== "production"
    ? dynamic(() => import("./SSFControls"), { ssr: false })
    : null;

function makeRedRT(nearest: boolean, depthBuffer: boolean, float = false) {
  return new THREE.RenderTarget(2, 2, {
    // depth targets use full FloatType (r32float) so the narrow-range filter and
    // finite-difference normals stay precise (Splash stores r32float eye-z); the
    // low-frequency thickness targets keep HalfFloat (r16float), matching Splash.
    type: float ? THREE.FloatType : THREE.HalfFloatType,
    format: THREE.RedFormat,
    minFilter: nearest ? THREE.NearestFilter : THREE.LinearFilter,
    magFilter: nearest ? THREE.NearestFilter : THREE.LinearFilter,
    depthBuffer,
  });
}

// projectedParticleConstant for the narrow-range depth filter — the screen-space
// kernel scale as a function of depth (Splash fluidRender.ts:67). Recomputed on
// resize because it depends on the render height. FOV matches CanvasHost (35deg).
const NR_FOV_RAD = (35 * Math.PI) / 180;
function narrowRangeProjConst(h: number) {
  // (blurFilterSize=12 * diameter=0.1 * 0.05 * (h/2)) / tan(fov/2)
  return (12 * 0.1 * 0.05 * (h / 2)) / Math.tan(NR_FOV_RAD / 2);
}

function makeColorRT() {
  return new THREE.RenderTarget(2, 2, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });
}

function SSFRender({ sim, onFail }: { sim: FluidSim; onFail?: () => void }) {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer;

  const r = useMemo(() => {
    const backdropRT = makeColorRT();
    const depthRT_A = makeRedRT(true, true, true); // r32float, depth-tested sphere pass
    const depthRT_B = makeRedRT(true, false, true); // r32float ping-pong target
    const thicknessRT = makeRedRT(false, false);
    const thickBlur_A = makeRedRT(false, false);
    const thickBlur_B = makeRedRT(false, false);

    const depthMat = makeDepthMaterial(sim.positions, sim.uRadius);
    const thickMat = makeThicknessMaterial(sim.positions, sim.uRadius);
    const depthBlurA = makeDepthBlurMaterial(depthRT_A); // reads A
    const depthBlurB = makeDepthBlurMaterial(depthRT_B); // reads B
    const thickGaussSrc = makeGaussianMaterial(thicknessRT); // reads source
    const thickGaussA = makeGaussianMaterial(thickBlur_A); // reads A
    // Real sky cubemap ("Sky Box - Sunny Day", from waterball) — sampled as a SHARP
    // MIRROR in the composite. THIS is where the water look comes from (a glossy
    // reflection of a detailed sky), NOT the page background. Self-contained, exactly
    // like the cloned sims. The cube loads async; the cubeTexture node picks up the 6
    // faces once they decode (water is flat-tinted for the first frame or two).
    const envCube = new THREE.CubeTextureLoader()
      .setPath("/cubemap-sky/")
      .load(["posx.png", "negx.png", "posy.png", "negy.png", "posz.png", "negz.png"]);
    envCube.colorSpace = THREE.SRGBColorSpace;

    const composite = makeCompositeMaterial({
      depthTex: depthRT_A.texture, // smoothed depth ends here after P2
      thickTex: thickBlur_B.texture,
      backdropTex: backdropRT.texture,
      env: envCube,
    });

    // TEMP: debug viz from ?dbg= (1=normal, 2=thickness, 3=fresnel)
    if (typeof window !== "undefined") {
      const dbg = Number(new URLSearchParams(window.location.search).get("dbg")) || 0;
      composite.uDebug.value = dbg;
    }

    const quad = new THREE.QuadMesh(composite.material);
    // billboard imposters: a 1x1 quad (positionLocal.xy in [-0.5,0.5]) oriented to
    // face the camera in the depth/thickness vertexNode (see materials.billboardClip)
    const geometry = new THREE.PlaneGeometry(1, 1);

    return {
      backdropRT,
      depthRT_A,
      depthRT_B,
      thicknessRT,
      thickBlur_A,
      thickBlur_B,
      depthMat,
      thickMat,
      depthBlurA,
      depthBlurB,
      thickGaussSrc,
      thickGaussA,
      composite,
      quad,
      geometry,
      envCube,
    };
  }, [gl, sim.positions, sim.uRadius]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const failed = useRef(false);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  // frame-loop scratch (no per-frame allocation)
  const sizeRef = useRef({ w: 0, h: 0 });
  const scratch = useRef({
    buf: new THREE.Vector2(),
    savedColor: new THREE.Color(),
    BLACK: new THREE.Color(0, 0, 0),
    SENTINEL: new THREE.Color(BG_SENTINEL, 0, 0),
  }).current;

  // Seed identity instance matrices (a zeroed instanceMatrix collapses the
  // node-driven positions to the origin — HANDOFF gotcha) and put the imposter
  // mesh on the liquid layer so the manager renders it in isolation.
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const id = new THREE.Matrix4();
    for (let i = 0; i < FLUID_COUNT; i++) m.setMatrixAt(i, id);
    m.instanceMatrix.needsUpdate = true;
    m.layers.set(LIQUID_LAYER);
  }, []);

  useEffect(
    () => () => {
      r.backdropRT.dispose();
      r.depthRT_A.dispose();
      r.depthRT_B.dispose();
      r.thicknessRT.dispose();
      r.thickBlur_A.dispose();
      r.thickBlur_B.dispose();
      r.depthMat.dispose();
      r.thickMat.dispose();
      r.depthBlurA.material.dispose();
      r.depthBlurB.material.dispose();
      r.thickGaussSrc.material.dispose();
      r.thickGaussA.material.dispose();
      r.composite.material.dispose();
      r.geometry.dispose();
      r.envCube.dispose();
    },
    [r],
  );

  function resize(w: number, h: number) {
    if (w === sizeRef.current.w && h === sizeRef.current.h) return;
    sizeRef.current = { w, h };
    r.backdropRT.setSize(w, h);
    r.depthRT_A.setSize(w, h);
    r.depthRT_B.setSize(w, h);
    // narrow-range filter kernel scale depends on render height
    const pc = narrowRangeProjConst(h);
    r.depthBlurA.uProjConst.value = pc;
    r.depthBlurB.uProjConst.value = pc;
    const hw = Math.max(1, Math.floor(w / 2));
    const hh = Math.max(1, Math.floor(h / 2));
    r.thicknessRT.setSize(hw, hh);
    r.thickBlur_A.setSize(hw, hh);
    r.thickBlur_B.setSize(hw, hh);
  }

  useFrame((state) => {
    const gl = state.gl as unknown as THREE.WebGPURenderer;
    const cam = state.camera;
    const scene = state.scene;
    const mesh = meshRef.current;
    if (!mesh || failed.current) return;
    // SSF is WebGPU-only; on a WebGL2 backend bail and let the fallback render.
    if (typeof (gl as unknown as { compute?: unknown }).compute !== "function") {
      if (!failed.current) {
        failed.current = true;
        onFailRef.current?.();
      }
      return;
    }

    // setClearColor/getClearColor accept (Color, alpha) at runtime, but the
    // WebGPURenderer typings demand a private Color4 — isolate the cast here.
    const setClear = (c: THREE.Color, a: number) =>
      (gl as unknown as { setClearColor(c: THREE.Color, a: number): void }).setClearColor(c, a);
    const getClear = (t: THREE.Color) =>
      (gl as unknown as { getClearColor(t: THREE.Color): void }).getClearColor(t);

    const prevAutoClear = gl.autoClear;
    getClear(scratch.savedColor);
    const prevAlpha = gl.getClearAlpha();
    const prevTarget = gl.getRenderTarget();
    const prevLayers = cam.layers.mask;

    try {
      gl.getDrawingBufferSize(scratch.buf);
      resize(scratch.buf.x, scratch.buf.y);
      const { w, h } = sizeRef.current;
      r.composite.uInvProj.value.copy(cam.projectionMatrixInverse);
      r.composite.uInvView.value.copy(cam.matrixWorld); // view->world for reflect/refract dirs
      r.composite.uView.value.copy(cam.matrixWorldInverse); // world->view for the glint light dir
      gl.autoClear = true;

      // P0 — backdrop into its own color target
      cam.layers.set(BACKDROP_LAYER);
      setClear(scratch.BLACK, 0);
      gl.setRenderTarget(r.backdropRT);
      gl.render(scene, cam);

      // P1 — sphere eye-depth (depth-tested) into depthRT_A
      cam.layers.set(LIQUID_LAYER);
      mesh.material = r.depthMat;
      setClear(scratch.SENTINEL, 1);
      gl.setRenderTarget(r.depthRT_A);
      gl.render(scene, cam);

      // P2 — narrow-range depth blur, 3 iterations of H then V (ends in depthRT_A);
      // more passes => smoother surface normals => smoother, less-patchy reflection.
      setClear(scratch.BLACK, 1);
      for (let it = 0; it < 3; it++) {
        r.depthBlurA.uTexel.value.set(1 / w, 0);
        r.quad.material = r.depthBlurA.material;
        gl.setRenderTarget(r.depthRT_B);
        r.quad.render(gl);
        r.depthBlurB.uTexel.value.set(0, 1 / h);
        r.quad.material = r.depthBlurB.material;
        gl.setRenderTarget(r.depthRT_A);
        r.quad.render(gl);
      }

      // P3 — additive thickness (half-res) into thicknessRT
      cam.layers.set(LIQUID_LAYER);
      mesh.material = r.thickMat;
      setClear(scratch.BLACK, 0);
      gl.setRenderTarget(r.thicknessRT);
      gl.render(scene, cam);

      // P4 — Gaussian thickness blur H then V (ends in thickBlur_B)
      const hw = Math.max(1, Math.floor(w / 2));
      const hh = Math.max(1, Math.floor(h / 2));
      r.thickGaussSrc.uTexel.value.set(1 / hw, 0);
      r.quad.material = r.thickGaussSrc.material;
      gl.setRenderTarget(r.thickBlur_A);
      r.quad.render(gl);
      r.thickGaussA.uTexel.value.set(0, 1 / hh);
      r.quad.material = r.thickGaussA.material;
      gl.setRenderTarget(r.thickBlur_B);
      r.quad.render(gl);

      // P5 — composite to the screen (the only pass that touches the framebuffer)
      gl.setRenderTarget(null);
      setClear(scratch.BLACK, 0);
      r.quad.material = r.composite.material;
      r.quad.render(gl);
    } catch (e) {
      if (!failed.current) {
        failed.current = true;
        console.warn("[ssf] render manager failed; degrading to direct spheres:", e);
        onFailRef.current?.();
      }
    } finally {
      gl.autoClear = prevAutoClear;
      setClear(scratch.savedColor, prevAlpha);
      cam.layers.mask = prevLayers;
      gl.setRenderTarget(prevTarget ?? null);
    }
  }, 1);

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[r.geometry, r.depthMat, FLUID_COUNT]}
        frustumCulled={false}
      />
      {SSFControls ? <SSFControls handle={r.composite} /> : null}
    </>
  );
}

// spring-to-glyph sim (the original) — holds the "A" rigidly, splashes on pointer.
function SpringHero({ onFail }: { onFail?: () => void }) {
  const sim = useFluidSim();
  return <SSFRender sim={sim} onFail={onFail} />;
}

// real MLS-MPM fluid sim (waterball port). Behind ?sim=mpm while it's tuned.
function MpmHero({ onFail }: { onFail?: () => void }) {
  const sim = useMlsMpmSim(FLUID_COUNT);
  return <SSFRender sim={sim} onFail={onFail} />;
}

export function SSFHero({ onFail }: { onFail?: () => void }) {
  // real MLS-MPM fluid is the default now; ?sim=spring keeps the old spring sim.
  const useSpring =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("sim") === "spring";
  return useSpring ? <SpringHero onFail={onFail} /> : <MpmHero onFail={onFail} />;
}

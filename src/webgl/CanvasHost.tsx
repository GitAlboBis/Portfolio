"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { FrameDriver } from "@/webgl/FrameDriver";
import { PhotoBackdrop } from "@/webgl/PhotoBackdrop";
import { FluidParticles } from "@/webgl/liquid/FluidParticles";
import { SceneErrorBoundary } from "@/webgl/SceneErrorBoundary";
import { useFxStore } from "@/webgl/store/fxStore";
import {
  detectTier,
  supportsWebGPU,
  createWebGPURenderer,
} from "@/webgl/renderer/createRenderer";

/*
  Persistent, full-screen R3F canvas mounted once in the root layout. It is the
  background visual layer (z-0): the DOM overlay (hero text, sections) sits above
  it at z>=10 and reads through where transparent. See docs/03-ARCHITECTURE.md.

  Renderer: WebGPURenderer (async `gl` factory) — required by the liquid-mesh
  hero's MeshPhysicalNodeMaterial + TSL. It auto-falls-back to a WebGL2 backend
  when navigator.gpu is absent, so the same TSL runs on both (docs/04 §6.1).

  Behind the canvas, a CSS sea gradient (-z-10) is always present — the
  reduced-motion / no-canvas static backdrop. The in-scene SeaBackdropTSL is the
  refraction content for the liquid mark.
*/

const SEA_GRADIENT =
  "linear-gradient(180deg,#5a9ccd 0%,#86bee2 34%,#bcddee 50%,#cfe6f0 53%,#2f93ab 60%,#176a8d 76%,#0c3d57 100%)";

export function CanvasHost() {
  const tier = useFxStore((s) => s.tier);

  useEffect(() => {
    useFxStore.getState().set({
      tier: detectTier(),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      webgpu: supportsWebGPU(),
    });
  }, []);

  return (
    <>
      {/* Sea backdrop — always present (also the reduced-motion static hero). */}
      <div
        id="sea-backdrop"
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: SEA_GRADIENT }}
      />

      {/* reduced-motion / weak GPU → tier "off": no canvas; gradient + DOM hero remain. */}
      {tier !== "off" && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <Canvas
            dpr={[1, tier === "lite" ? 1.5 : 2]}
            camera={{ position: [0, 0, 5], fov: 35 }}
            gl={createWebGPURenderer}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <FrameDriver />
            {/* photo background (placeholder for the hero video) */}
            <SceneErrorBoundary>
              <Suspense fallback={null}>
                <PhotoBackdrop />
              </Suspense>
            </SceneErrorBoundary>
            {/* the "A" fluid model; a GLB failure degrades to just the backdrop */}
            <SceneErrorBoundary>
              <Suspense fallback={null}>
                <FluidParticles />
              </Suspense>
            </SceneErrorBoundary>
          </Canvas>
        </div>
      )}
    </>
  );
}

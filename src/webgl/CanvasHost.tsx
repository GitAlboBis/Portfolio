"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { FrameDriver } from "@/webgl/FrameDriver";
import { SeaBackdrop } from "@/webgl/SeaBackdrop";
import { HeroLogo } from "@/webgl/HeroLogo";
import { useFxStore } from "@/webgl/store/fxStore";
import { detectTier, supportsWebGPU } from "@/webgl/renderer/createRenderer";

/*
  Persistent, full-screen R3F canvas mounted once in the root layout. It is the
  background visual layer (z-0): the DOM overlay (hero text, sections) sits above
  it at z>=10 and is transparent where the canvas should read through. See
  docs/03-ARCHITECTURE.md (Canvas globale + overlay DOM).

  Behind the canvas, a CSS sea gradient (-z-10) is always present — it is the
  bright Pan di Zucchero surface the water mark floats in, and the static
  backdrop when reduced-motion disables the canvas.

  TODO (Gate 6, WebGPU): pass a WebGPURenderer factory via the `gl` prop for the
  TSL compute path once Context7 is available. This WebGL2 renderer is the
  stable documented fallback and drives the current GPGPU sim (FBO ping-pong).
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
      <div id="sea-backdrop" aria-hidden className="fixed inset-0 -z-10" style={{ background: SEA_GRADIENT }} />

      {/* reduced-motion / weak GPU → no WebGL; the gradient + DOM hero remain. */}
      {tier !== "off" && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <Canvas
            dpr={[1, tier === "lite" ? 1.5 : 2]}
            camera={{ position: [0, 0, 5], fov: 35 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <FrameDriver />
            <SeaBackdrop />
            <Suspense fallback={null}>
              <HeroLogo />
            </Suspense>
          </Canvas>
        </div>
      )}
    </>
  );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { FrameDriver } from "@/webgl/FrameDriver";
import { PhotoBackdrop } from "@/webgl/PhotoBackdrop";
import { FluidParticles } from "@/webgl/liquid/FluidParticles";
import { SSFHero } from "@/webgl/liquid/ssf/SSFHero";
import { HeroLiquidLogo } from "@/webgl/HeroLiquidLogo";
import { BACKDROP_LAYER } from "@/webgl/liquid/ssf/constants";
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
  const webgpu = useFxStore((s) => s.webgpu);
  // SSF is the WebGPU/full-tier path; a runtime failure flips this to the
  // direct-render fallback without unmounting the canvas.
  const [ssfFailed, setSsfFailed] = useState(false);
  // dev A/B compare: ?hero=mesh → realistic PBR mesh (old material); default → SSF.
  const [heroMode] = useState<"ssf" | "mesh">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("hero") === "mesh"
      ? "mesh"
      : "ssf",
  );
  const useSSF = webgpu && tier === "full" && !ssfFailed;
  // SSF takes over the render loop only in its own mode; the mesh path uses
  // R3F auto-render (so the backdrop must share the default layer there).
  const ssfActive = useSSF && heroMode === "ssf";

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
            {/* photo background (placeholder for the hero video). On the SSF path
                it renders into its own target via a camera layer; on the fallback
                it shares layer 0 with the direct-render spheres. */}
            <SceneErrorBoundary>
              <Suspense fallback={null}>
                <PhotoBackdrop layer={ssfActive ? BACKDROP_LAYER : 0} />
              </Suspense>
            </SceneErrorBoundary>
            {/* the "A" hero. WebGPU/full → SSF particle water (default) OR the PBR
                glass mesh (?hero=mesh, A/B compare); otherwise direct-render spheres.
                A GLB/SSF failure degrades to the fallback (keyed remount). */}
            <SceneErrorBoundary
              key={`${useSSF ? "gpu" : "fallback"}-${heroMode}`}
              onError={() => setSsfFailed(true)}
            >
              <Suspense fallback={null}>
                {!useSSF ? (
                  <FluidParticles />
                ) : heroMode === "mesh" ? (
                  <HeroLiquidLogo />
                ) : (
                  <SSFHero onFail={() => setSsfFailed(true)} />
                )}
              </Suspense>
            </SceneErrorBoundary>
          </Canvas>
        </div>
      )}
    </>
  );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { FrameDriver } from "@/webgl/FrameDriver";
import { useFxStore } from "@/webgl/store/fxStore";
import { detectTier, supportsWebGPU } from "@/webgl/renderer/createRenderer";

/*
  Persistent, full-screen R3F canvas mounted once in the root layout, fixed
  behind the DOM content (aria-hidden, pointer-events:none). Scenes (HeroLogo,
  CinematicScene...) mount inside as scroll progress enters their section.
  See docs/03-ARCHITECTURE.md (Canvas globale + overlay DOM).

  TODO (Gate 4/6): pass a WebGPURenderer factory via the `gl` prop for the
  compute-shader hero path (consult Context7 for three 0.184 init). Default
  WebGL2 renderer is the stable documented fallback.
*/
export function CanvasHost() {
  const tier = useFxStore((s) => s.tier);

  useEffect(() => {
    useFxStore.getState().set({
      tier: detectTier(),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      webgpu: supportsWebGPU(),
    });
  }, []);

  // reduced-motion / weak GPU → no WebGL; the DOM renders a static hero instead.
  if (tier === "off") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={[1, tier === "lite" ? 1.5 : 2]}
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <FrameDriver />
        {/* Scenes mount here — Gate 4+ (HeroLogo, CinematicScene, DriftParticles) */}
      </Canvas>
    </div>
  );
}

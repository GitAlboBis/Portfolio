"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WaterBallHero, benchTier } from "@/webgl/waterball/WaterBallHero";
import { useHeroStore } from "@/webgl/store/heroStore";

/*
  Bench canvas host (REDESIGN-SPEC §F.3).

  Mounts the vendored matsuoka-601/WaterBall raw-WebGPU MLS-MPM fluid INSIDE the
  bench box it is rendered in (TestBench gives it a `position: relative` box on
  paper-field with a 1px ink frame — the backdrop and the frame are DOM, nothing
  is drawn behind the fluid by the GPU). No fixed layers, no gradient, no video.

  The gate is resolved AFTER mount (navigator.gpu is unknown during SSR, so the
  canvas is never server-rendered):
    - no WebGPU            -> no engine; heroStore.status "still", reason "nogpu"
    - prefers-reduced-motion -> no engine; status "still", reason "reduced"
    - otherwise            -> <WaterBallHero/> (status "compiling" -> "live")
  The readouts print the matching bench.reason* line — nothing live is faked.

  Route gate: the bench is the ONE heavy renderer of the site and lives on "/"
  only, inside the cover of the sheet. Unmounting on route change disposes the
  device (WaterBallHero cleanup) and resets the store (`resetBench`).

  Accessibility: the canvas is aria-hidden + pointer-events:none (set inside
  WaterBallHero). Decorative only — the readouts carry the information.
*/

const BENCH_ROUTES = new Set(["/"]);

export function CanvasHost() {
  const pathname = usePathname();
  // null until resolved client-side; then "engine" | "nogpu" | "reduced"
  const [gate, setGate] = useState<"engine" | "nogpu" | "reduced" | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resolve = () => {
      const hasGpu = typeof navigator !== "undefined" && !!navigator.gpu;
      const next = !hasGpu ? "nogpu" : mq.matches ? "reduced" : "engine";
      setGate(next);
      // A still has no engine to read from, so every measured value stays 0 (the
      // readouts print an em dash). `tier` is the exception: it is a real device
      // measurement, taken with the SAME function the engine tiers with — so a
      // phone that cannot run the bench still prints "Mobile", never a fiction.
      if (next !== "engine")
        useHeroStore
          .getState()
          .set({ status: "still", reason: next, frameMs: 0, particles: 0, dpr: 0, tier: benchTier() });
    };
    resolve();
    mq.addEventListener("change", resolve);
    return () => {
      mq.removeEventListener("change", resolve);
      useHeroStore.getState().resetBench();
    };
  }, []);

  if (!BENCH_ROUTES.has(pathname)) return null;
  if (gate !== "engine") return null;
  return <WaterBallHero />;
}

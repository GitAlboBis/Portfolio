import { create } from "zustand";

/*
  Bench instrument bus — the non-reactive bridge between the raw-WebGPU engine
  loop (WaterBallHero, the WRITER of every readout) and the DOM readouts of the
  test bench (BenchReadouts, the READER on the shared gsap.ticker). The engine
  writes here from its rAF loop via getState()/setState(); nothing here is read
  at render time except `status` (the LIVE / STILL word), so the loop never
  causes a React re-render. Keep it tiny.

  INSTRUMENT HONESTY (REDESIGN-SPEC §B raise 1): every value below is READ FROM
  THE ENGINE — `particles` is sim.numParticles after tiering, `frameMs` is the
  measured 500ms moving average of the loop's frame deltas, `dpr` is the backing
  ratio actually applied to the canvas, `tier` is the same function that picked
  the particle count. Nothing counts up, nothing is simulated when the renderer
  is absent: a missing renderer prints STILL + a reason line, never a number.

  status:    "compiling" while the device/pipelines/cubemap are being built;
             "live" after the first rendered frame has completed on the GPU;
             "still" when there is no renderer (no WebGPU / reduced motion);
             "lost" after device.lost (the last frame stays, readouts freeze).
  reason:    why the bench is a still ("nogpu" | "reduced" | "lost") — the
             readouts print the matching bench.reason* line from dict.ts.

  LEGACY (kept intact, unused by the bench — REDESIGN-SPEC §F Phase A):
  explode:   0..1 progress of the old "logo explodes / drain" scroll beat.
             WaterBallHero still feeds it straight to the solver; with no writer
             (HeroScrollSettle is no longer mounted) it stays 0.
  reveal / video: the old liquid-text and frame-scrub progress values. No
             readers and no writers left; the solver ignores them.
*/
export type BenchStatus = "compiling" | "live" | "still" | "lost";
export type BenchTier = "desktop" | "mobile";
export type BenchStillReason = "nogpu" | "reduced" | "lost" | null;

type HeroValues = {
  explode: number;
  reveal: number;
  video: number;
  /** measured frame time, ms — 500ms moving average of the engine loop; 0 until live */
  frameMs: number;
  /** sim.numParticles — the real count after tiering (0 until the sim is seeded) */
  particles: number;
  /** devicePixelRatio actually applied to the canvas backing store (after the tier cap) */
  dpr: number;
  tier: BenchTier;
  status: BenchStatus;
  reason: BenchStillReason;
};

type HeroState = HeroValues & {
  set: (p: Partial<HeroValues>) => void;
  /** back to the pre-mount instrument state (route change / unmount) */
  resetBench: () => void;
};

const BENCH_INITIAL: Pick<HeroValues, "frameMs" | "particles" | "dpr" | "tier" | "status" | "reason"> = {
  frameMs: 0,
  particles: 0,
  dpr: 0,
  tier: "desktop",
  status: "compiling",
  reason: null,
};

export const useHeroStore = create<HeroState>((set) => ({
  explode: 0,
  reveal: 0,
  video: 0,
  ...BENCH_INITIAL,
  set: (p) => set(p),
  resetBench: () => set({ ...BENCH_INITIAL }),
}));

// dev-only QA handle (same pattern as __heroOutST / __menuTL): lets probes read
// the live readouts the bench prints. Tree-shaken out of prod.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __heroStore?: typeof useHeroStore }).__heroStore = useHeroStore;
}

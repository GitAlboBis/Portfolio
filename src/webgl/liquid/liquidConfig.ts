/*
  Tunable parameters for the liquid-mesh "A" (docs/04 — liquid-mesh hero).
  Everything here is wired to a TSL `uniform`, so it is also live-tweakable at
  runtime (leva panel in dev, see HeroLiquidLogo). Wave maths run in the mesh's
  LOCAL space: the "A" is ~2.3 wide (X), 2.0 tall (Y), 0.36 deep (Z).
*/
import type { Tier } from "@/webgl/renderer/createRenderer";

export type LiquidParams = {
  // --- ring waves from pointer impacts (analytic, 3D distance) ---
  amplitude: number; // displacement along the surface normal (local units)
  frequency: number; // spatial frequency of the ring
  speed: number; // ring expansion speed (units / second)
  ringSharpness: number; // gaussian tightness of the ring band (higher = thinner)
  timeDecay: number; // ripple fade rate over its lifetime
  spaceDecay: number; // attenuation with distance from the impact point
  // --- idle background motion (never fully still) ---
  bgAmplitude: number;
  bgScale: number;
  bgSpeed: number;
  // --- foam on the crests / steep slopes ---
  foamThreshold: number; // slope where foam begins (0..1)
  foamWidth: number; // smoothstep width above the threshold
  foamGain: number; // multiplies slope before thresholding
  foamNoiseScale: number;
  foamNoiseSpeed: number;
  // --- normal recompute ---
  normalShift: number; // epsilon for the analytic neighbour samples (local units)
  // --- physical (glass / water) material ---
  transmission: number;
  ior: number;
  thickness: number;
  roughness: number;
  attenuationDistance: number;
  clearcoat: number; // wet sheen on top of the transmissive body
};

/** Base values, tuned for the bright Pan di Zucchero surface. */
export const LIQUID_BASE: LiquidParams = {
  amplitude: 0.06,
  frequency: 16,
  speed: 1.25,
  ringSharpness: 22,
  timeDecay: 1.1,
  spaceDecay: 0.6,
  bgAmplitude: 0.014,
  bgScale: 1.7,
  bgSpeed: 0.22,
  foamThreshold: 0.06,
  foamWidth: 0.16,
  foamGain: 3.2,
  foamNoiseScale: 3.2,
  foamNoiseSpeed: 0.5,
  normalShift: 0.012,
  transmission: 1.0,
  ior: 1.333,
  thickness: 1.8, // longer optical path -> richer teal body
  roughness: 0.05,
  attenuationDistance: 0.95, // stronger Beer-Lambert absorption (deeper teal)
  clearcoat: 0.25,
};

/** Aquatic palette (linear-ish sRGB triples). */
export const LIQUID_COLORS = {
  /** base tint of the glass body (kept light so it reads as clear water) */
  tint: [0.72, 0.9, 0.93] as [number, number, number],
  /** Beer-Lambert absorption colour through the thickness — the teal depth */
  attenuation: [0.09, 0.41, 0.49] as [number, number, number],
  /** foam / spray colour on the crests */
  foam: [1.0, 1.0, 1.0] as [number, number, number],
};

/* ------------------------------------------------------------------ *
 *  Splash / spray droplets that fly OFF the mark in the mouse's       *
 *  direction, scaled by pointer speed (CPU-simulated InstancedMesh).  *
 *  KEPT as-is per request — to be tuned later.                        *
 * ------------------------------------------------------------------ */
export type SplashConfig = {
  pool: number; // instanced droplet count
  dropMin: number; // world-scale of the smallest droplet
  dropMax: number;
  lifeMin: number; // seconds
  lifeMax: number;
  gravity: number; // world units / s^2 (negative = down)
  drag: number; // velocity damping per second
  speedToVel: number; // pointer world-speed -> launch speed along mouse dir
  popOut: number; // launch toward the viewer (off the surface)
  lift: number; // upward bias
  spread: number; // random scatter
  emitSpeedThreshold: number; // min pointer world-speed (units/s) to splash
  emitPerSpeed: number; // droplets ~ speed * this
  emitMax: number; // cap per emission
};

export function splashConfig(tier: Tier): SplashConfig {
  const base: SplashConfig = {
    pool: 460,
    dropMin: 0.012,
    dropMax: 0.045,
    lifeMin: 0.55,
    lifeMax: 1.2,
    gravity: -3.0,
    drag: 0.5,
    speedToVel: 0.85,
    popOut: 0.45,
    lift: 0.4,
    spread: 0.6,
    emitSpeedThreshold: 0.22,
    emitPerSpeed: 7,
    emitMax: 9,
  };
  if (tier === "lite") return { ...base, pool: 220, emitMax: 5 };
  return base;
}

/** How many simultaneous pointer impacts ripple at once (circular buffer). */
export function impactCount(tier: Tier): number {
  return tier === "lite" ? 5 : 8;
}

/** Per-tier overrides (mobile / weaker GPUs degrade gracefully). */
export function liquidParams(tier: Tier): LiquidParams {
  if (tier === "lite") {
    return {
      ...LIQUID_BASE,
      // cheaper fragment cost: thinner refraction, slightly rougher
      thickness: 1.2,
      roughness: 0.08,
      bgAmplitude: 0.01,
      clearcoat: 0.0,
    };
  }
  return LIQUID_BASE;
}

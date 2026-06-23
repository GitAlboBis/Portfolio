/*
  Two-layer GPGPU water-logo tuning. See docs/04-3D-HERO-WATER-LOGO.md §8/§9.
  `body` = dense opaque volume (the legible silhouette); `skin` = additive
  under-damped foam that splashes on pointer and returns like a wave (risacca).

  NOTE on values vs the doc §9 table:
   - POINT_SIZE here is a WORLD radius (the vertex shader scales it to pixels by
     perspective), not a raw px value — easier to keep size stable across DPR.
   - SIZE (grid side) starts a touch below the doc's 256/448 to guarantee 60fps
     on first QA; bump toward 256/448 once the frame budget is confirmed (the
     doc rule: scale the SKIN grid first). Lite halves it for coarse-pointer GPUs.
*/
import type { Tier } from "@/webgl/renderer/createRenderer";

export type Blending = "Normal" | "Additive";

export type LayerConfig = {
  /** grid side; particle count = SIZE*SIZE */
  SIZE: number;
  // --- surface sampling (docs §4) ---
  FRONT_BIAS: number;
  NORMAL_OFFSET: number;
  VOLUME_JITTER: number;
  // --- spring physics (docs §5) ---
  SPRING: number;
  DAMPING: number;
  PUSH: number;
  RADIUS: number;
  MAX_SPEED: number;
  TURB_BASE: number;
  TURB_MOVE: number;
  NOISE_SCALE: number;
  // --- render / shading (docs §7) ---
  POINT_SIZE: number; // world radius
  SIZE_SPEED: number; // how much speed inflates the point
  POINT_ALPHA: number;
  EMISSIVE: number;
  blending: Blending;
  depthWrite: boolean;
  renderOrder: number;
  COL_COLD: [number, number, number];
  COL_HOT: [number, number, number];
};

const BODY_BASE: Omit<LayerConfig, "SIZE"> = {
  FRONT_BIAS: 0.5,
  NORMAL_OFFSET: 0.0,
  VOLUME_JITTER: 0.06,
  SPRING: 36,
  DAMPING: 6.2, // zeta = 6.2 / (2*sqrt(36)) = 0.52 — near-critical
  PUSH: 22,
  RADIUS: 0.55,
  MAX_SPEED: 6.0,
  TURB_BASE: 0.15,
  TURB_MOVE: 0.4,
  NOISE_SCALE: 0.6,
  POINT_SIZE: 0.007, // slightly larger so the volume reads as a solid silhouette
  SIZE_SPEED: 0.6,
  POINT_ALPHA: 0.95,
  EMISSIVE: 0.1,
  blending: "Normal",
  depthWrite: true,
  renderOrder: 0,
  COL_COLD: [0.04, 0.22, 0.27],
  COL_HOT: [0.4, 0.85, 0.92],
};

const SKIN_BASE: Omit<LayerConfig, "SIZE"> = {
  FRONT_BIAS: 0.8,
  NORMAL_OFFSET: 0.03,
  VOLUME_JITTER: 0.0,
  SPRING: 20,
  DAMPING: 3.5, // zeta = 3.5 / (2*sqrt(20)) = 0.39 — under-damped (risacca)
  PUSH: 62,
  RADIUS: 1.35,
  MAX_SPEED: 14.0,
  TURB_BASE: 0.45,
  TURB_MOVE: 1.6,
  NOISE_SCALE: 0.9,
  POINT_SIZE: 0.011,
  SIZE_SPEED: 1.6,
  POINT_ALPHA: 0.45,
  EMISSIVE: 0.9,
  blending: "Additive",
  depthWrite: false,
  renderOrder: 1,
  COL_COLD: [0.06, 0.3, 0.34],
  COL_HOT: [0.75, 0.98, 1.0],
};

const SIZES: Record<"body" | "skin", Record<Tier, number>> = {
  body: { full: 192, lite: 112, off: 0 },
  skin: { full: 320, lite: 192, off: 0 },
};

export function bodyConfig(tier: Tier): LayerConfig {
  return { ...BODY_BASE, SIZE: SIZES.body[tier] };
}
export function skinConfig(tier: Tier): LayerConfig {
  return { ...SKIN_BASE, SIZE: SIZES.skin[tier] };
}

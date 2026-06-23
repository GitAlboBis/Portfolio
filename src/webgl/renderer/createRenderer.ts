/*
  Backend + capability detection for the dual-backend GPGPU hero.
  See docs/04-3D-HERO-WATER-LOGO.md §6.1 and §10.

  NOTE (Gate 4/6): the actual WebGPURenderer factory (passed to R3F <Canvas gl>)
  will be added here once the GPGPU compute path is built — consult Context7 for
  the exact three 0.184 WebGPURenderer.init() API before wiring it. Until then the
  Canvas uses the default WebGL2 renderer (stable), which is the documented fallback.
*/

/** Static capability check — call client-side before mounting the heavy scene. */
export function supportsWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/**
 * Canonical runtime backend detection given a three renderer instance.
 * WebGPURenderer leaves `backend.isWebGLBackend` UNDEFINED (not false) and exposes
 * a `compute` method; WebGLRenderer has neither. See docs/04 §6.1.
 */
export function isWebGPUBackend(renderer: unknown): boolean {
  const r = renderer as {
    backend?: { isWebGLBackend?: boolean };
    compute?: unknown;
  };
  return r?.backend?.isWebGLBackend !== true && typeof r?.compute === "function";
}

/** Heuristic performance tier (docs/04 §10). Validate on real devices in QA. */
export function detectTier(): Tier {
  if (typeof window === "undefined") return "full";
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "off";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (mem <= 4 || cores <= 4 || coarse) return "lite";
  return "full";
}

export type Tier = "full" | "lite" | "off";

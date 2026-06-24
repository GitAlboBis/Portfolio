/*
  Backend + capability detection AND the WebGPURenderer factory for the hero.
  See docs/04-3D-HERO-WATER-LOGO.md §6.1 and docs/03-ARCHITECTURE.md §3.3.

  The liquid-mesh hero (MeshPhysicalNodeMaterial + TSL) requires the node-based
  renderer, so the global Canvas now runs on WebGPURenderer. WebGPURenderer
  AUTO-FALLS-BACK to a WebGL2 backend inside init() when navigator.gpu is absent,
  which is the documented dual-backend path: identical TSL, two backends.
*/
import * as THREE from "three/webgpu";

export type Tier = "full" | "lite" | "off";

/**
 * Async factory for R3F's `gl` prop. In @react-three/fiber v9 a `gl` callback
 * receives the renderer CONSTRUCTOR PROPS (incl. the canvas) and may return a
 * promise — R3F awaits it before the first render. See the v9 migration guide.
 */
// `props` is loosely typed: R3F's DefaultGLProps allows powerPreference "default",
// which WebGPURendererParameters rejects — and we override it anyway. This mirrors
// the official R3F WebGPU example (`new WebGPURenderer(props as any)`).
export async function createWebGPURenderer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: any,
): Promise<THREE.WebGPURenderer> {
  const renderer = new THREE.WebGPURenderer({
    ...(props ?? {}),
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  await renderer.init();
  return renderer;
}

/** Static capability check — call client-side before mounting the heavy scene. */
export function supportsWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/**
 * Canonical runtime backend detection given a three renderer instance.
 * WebGPURenderer leaves `backend.isWebGLBackend` UNDEFINED (not false) and exposes
 * a `compute` method; a WebGL2 backend sets it true. See docs/04 §6.1.
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

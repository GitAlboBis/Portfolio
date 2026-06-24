import { create } from "zustand";
// three/webgpu (not "three") so the whole live canvas shares ONE three instance
// now that the renderer is WebGPURenderer. See docs/03-ARCHITECTURE.md.
import { Vector2, Vector3 } from "three/webgpu";

/*
  Pointer state. The Vector objects are mutated in place once per frame by the
  FrameDriver (no per-frame allocation, no React re-render): frame-loop code
  reads them via usePointerStore.getState(). See docs/03-ARCHITECTURE.md.
*/
type PointerState = {
  active: boolean;
  /** normalized device coords (-1..1), raw */
  ndc: Vector2;
  /** smoothed ndc (lerped in FrameDriver) */
  smooth: Vector2;
  /** projected world position on the hero plane (filled by HeroLogo, Gate 4) */
  world: Vector3;
  setActive: (a: boolean) => void;
};

export const usePointerStore = create<PointerState>((set) => ({
  active: false,
  ndc: new Vector2(),
  smooth: new Vector2(),
  world: new Vector3(),
  setActive: (active) => set({ active }),
}));

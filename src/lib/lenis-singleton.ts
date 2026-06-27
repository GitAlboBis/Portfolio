import Lenis from "lenis";

/*
  Single Lenis instance for the whole app. autoRaf is DISABLED: the FrameDriver
  drives lenis.raf() from R3F's useFrame so scroll + render share ONE rAF loop.
  See docs/03-ARCHITECTURE.md (sync Lenis <-> R3F).
*/
let instance: Lenis | null = null;

export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (!instance) {
    instance = new Lenis({
      // FrameDriver drives lenis.raf() from R3F's useFrame — keep this off.
      autoRaf: false,

      // Weighty "deep-sea glide": a low lerp gives a long, heavy settle without
      // feeling laggy. 0.08 reads as substantial inertia (the screen has mass)
      // while still tracking the input closely enough to feel responsive.
      lerp: 0.08,

      // Wheel: smoothed, at 1:1 sensitivity. Anything above ~1 makes a mouse
      // wheel feel jumpy and breaks the calm, editorial cadence.
      smoothWheel: true,
      wheelMultiplier: 1,

      // Touch: mirror the desktop smoothing so trackpad/touch share the same
      // weighty feel instead of native flick-scrolling. A slightly snappier
      // lerp (0.1) keeps direct-manipulation touch from feeling sluggish, and
      // touchMultiplier 1.6 compensates for the shorter finger travel.
      syncTouch: true,
      syncTouchLerp: 0.1,
      touchMultiplier: 1.6,
      touchInertiaExponent: 1.7,

      // Vertical, single-direction experience.
      orientation: "vertical",
      gestureOrientation: "vertical",
    });
  }
  return instance;
}

export function destroyLenis() {
  instance?.destroy();
  instance = null;
}

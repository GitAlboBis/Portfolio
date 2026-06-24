"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { getLenis } from "@/lib/lenis-singleton";
import { useScrollStore } from "@/webgl/store/scrollStore";
import { usePointerStore } from "@/webgl/store/pointerStore";

/*
  The single source of per-frame truth. Mounted INSIDE the R3F <Canvas>.
  - Drives Lenis from R3F's loop (one rAF for scroll + render).
  - Publishes scroll progress to scrollStore.
  - Tracks + smooths the pointer in pointerStore.
  See docs/03-ARCHITECTURE.md.
*/
export function FrameDriver() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const st = usePointerStore.getState();
      st.ndc.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      // snap the smoothed pointer to the real position on (re)entry, so the
      // first frame doesn't lerp from screen-center (0,0) and fire a stray
      // ripple in the middle of the mark.
      if (!st.active) st.smooth.copy(st.ndc);
      st.setActive(true);
    };
    const onLeave = () => usePointerStore.getState().setActive(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useFrame((_, delta) => {
    const lenis = getLenis();
    if (lenis) {
      lenis.raf(performance.now());
      useScrollStore.getState().set({
        progress: lenis.progress ?? 0,
        velocity: lenis.velocity ?? 0,
      });
    }
    const p = usePointerStore.getState();
    p.smooth.lerp(p.ndc, Math.min(1, delta * 8));
  });

  return null;
}

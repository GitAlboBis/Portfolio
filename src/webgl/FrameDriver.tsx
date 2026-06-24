"use client";

import { Vector3 } from "three/webgpu";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
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
  // frame-loop scratch (no per-frame allocation)
  const ray = useRef(new Vector3()).current;
  const wNow = useRef(new Vector3()).current;
  const instVel = useRef(new Vector3()).current;
  const seeded = useRef(false);

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

  useFrame((state, delta) => {
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

    // Project the smoothed pointer onto the hero plane (z=0) and derive a smoothed
    // world-space velocity — the single shared source for the splash direction +
    // speed (consumed by the fluid compute via uMouse/uMouseVel/uSpeed).
    if (p.active) {
      const cam = state.camera;
      ray.set(p.smooth.x, p.smooth.y, 0.5).unproject(cam).sub(cam.position).normalize();
      const tHit = -cam.position.z / ray.z;
      wNow.copy(cam.position).addScaledVector(ray, tHit);
      if (!seeded.current) {
        // first frame after entry — seed, no spurious velocity
        p.world.copy(wNow);
        p.worldPrev.copy(wNow);
        p.worldVel.set(0, 0, 0);
        p.speed = 0;
        seeded.current = true;
      } else {
        instVel.copy(wNow).sub(p.worldPrev).divideScalar(Math.max(delta, 1e-4));
        p.worldVel.lerp(instVel, Math.min(1, delta * 10));
        p.speed = p.worldVel.length();
        p.world.copy(wNow);
        p.worldPrev.copy(wNow);
      }
    } else {
      seeded.current = false;
      p.worldVel.set(0, 0, 0);
      p.speed = 0;
    }
  });

  return null;
}

"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { marea } from "@/lib/sound";

/*
  SoundScape — lifecycle glue between the store's soundEnabled flag and the
  MAREA engine (lib/sound.ts). Renders nothing.

  • enable/disable follow the persisted toggle (the click that flips the store
    IS the user gesture WebAudio needs — enable() runs in its effect frame).
  • while enabled, one callback on the SHARED gsap.ticker feeds Lenis scroll
    velocity into the surf (the sea rises as you dive) — no second loop.
  • tab hidden → suspend, visible → resume (no ambient in background tabs).
*/
export function SoundScape() {
  const enabled = useUI((s) => s.soundEnabled);

  React.useEffect(() => {
    if (!enabled) {
      marea.disable();
      return;
    }
    marea.enable();

    const tick = () => {
      if (document.hidden) return;
      const lenis = (window as unknown as { __lenis?: { velocity?: number } }).__lenis;
      marea.setIntensity(Math.abs(lenis?.velocity ?? 0) / 40);
    };
    gsap.ticker.add(tick);

    const onVisibility = () => (document.hidden ? marea.suspend() : marea.resume());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      marea.disable();
    };
  }, [enabled]);

  return null;
}

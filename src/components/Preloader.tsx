"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/**
 * Preloader — "the surface before the dive". A warm paper sheet present at first
 * paint (SSR'd, so there's no FOUC) while the fonts + WebGPU hero spin up: the "A"
 * focuses in over a thin ember progress line, then the whole sheet wipes upward to
 * reveal the hero water "A" beneath.
 *
 * Robustness: the exit is gated on document.fonts.ready RACED against a hard 1.1s
 * timeout, and globals.css gives `.preloader` a CSS failsafe animation that lifts
 * the sheet at 2.4s — so even if the JS never runs the page can NEVER stay trapped.
 * prefers-reduced-motion -> a short plain fade (no wipe). Sets ui.loaded on exit.
 * Decorative (aria-hidden); the real content is underneath the whole time.
 */
export function Preloader() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLDivElement>(null);
  const lineRef = React.useRef<HTMLDivElement>(null);
  const setLoaded = useUI((s) => s.setLoaded);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const done = () => {
        root.style.display = "none";
        setLoaded(true);
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.to(root, { autoAlpha: 0, duration: 0.3, delay: 0.2, onComplete: done });
        return;
      }

      gsap.timeline()
        .from(markRef.current, { autoAlpha: 0, yPercent: 22, filter: "blur(10px)", duration: 0.7, ease: "power3.out" }, 0.1)
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 0.15);

      const ready = Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 1100)),
      ]);

      ready.then(() => {
        gsap.timeline({ onComplete: done })
          .to([markRef.current, lineRef.current], { autoAlpha: 0, yPercent: -18, duration: 0.4, ease: "power2.in" })
          .to(root, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, "-=0.05");
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="preloader" aria-hidden>
      <div ref={markRef} className="preloader-mark">
        A
      </div>
      <div className="preloader-track">
        <div ref={lineRef} className="preloader-line" />
      </div>
    </div>
  );
}

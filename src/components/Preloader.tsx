"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { curtainPath } from "@/lib/curtain";
import { useUI } from "@/store/ui";

/**
 * Preloader — "the surface before the dive". A warm paper sheet present at first
 * paint (SSR'd, so there's no FOUC) while the fonts + WebGPU hero spin up: the "A"
 * focuses in over a thin ember progress line and a percentage counter, then the
 * whole sheet wipes upward — trailing a sunset hem (the same curtainPath language
 * as the menu/route curtains) — to reveal the hero water "A" beneath.
 *
 * The counter is honest about what we actually await: it rides the line to 99
 * while fonts load, holds, and only says 100 the instant the exit is unlocked.
 *
 * Robustness: the exit is gated on document.fonts.ready RACED against a hard 1.1s
 * timeout, and globals.css gives `.preloader` a CSS failsafe animation that lifts
 * the sheet at 2.4s — so even if the JS never runs the page can NEVER stay trapped
 * (the hem SVG lives inside the sheet, so it rides the failsafe too).
 * prefers-reduced-motion -> a short plain fade (no wipe). Sets ui.loaded on exit.
 * Decorative (aria-hidden); the real content is underneath the whole time.
 *
 * REPEAT VISITS SKIP: the intro is a first-impression beat, not a toll booth —
 * once seen in this tab session (sessionStorage) the sheet is hidden PRE-PAINT
 * by the inline script below (no flash: it runs during HTML parse) and `loaded`
 * flips immediately. `?nopre` forces the skip (QA / Lighthouse A-B hook).
 */
const SEEN_KEY = "at-preloader-seen";
const SKIP_SCRIPT = `try{if(sessionStorage.getItem("${SEEN_KEY}")||location.search.indexOf("nopre")>-1){document.getElementById("preloader").style.display="none"}}catch(e){}`;

export function Preloader() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLDivElement>(null);
  const lineRef = React.useRef<HTMLDivElement>(null);
  const countRef = React.useRef<HTMLParagraphElement>(null);
  const setLoaded = useUI((s) => s.setLoaded);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const done = () => {
        root.style.display = "none";
        setLoaded(true);
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
          /* storage unavailable (private mode) — the intro just replays */
        }
      };

      // Already hidden pre-paint by the inline skip script (repeat visit / ?nopre):
      // unlock the page immediately, no animations.
      if (root.style.display === "none" || getComputedStyle(root).display === "none") {
        done();
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.to(root, { autoAlpha: 0, duration: 0.3, delay: 0.2, onComplete: done });
        return;
      }

      // Counter: sweeps with the line to 99, then waits for the real gate.
      const count = { v: 0 };
      const renderCount = () => {
        if (countRef.current) countRef.current.textContent = `${Math.round(count.v)}%`;
      };

      gsap.timeline()
        .from(markRef.current, { autoAlpha: 0, yPercent: 22, filter: "blur(10px)", duration: DUR.swell, ease: EASE.tide }, 0.1)
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: EASE.dive }, 0.15)
        .to(count, { v: 99, duration: 0.9, ease: EASE.dive, onUpdate: renderCount }, 0.15);

      const ready = Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 1100)),
      ]);

      ready.then(() => {
        count.v = 100;
        renderCount();
        gsap.timeline({ onComplete: done })
          .to([markRef.current, lineRef.current, countRef.current], { autoAlpha: 0, yPercent: -18, duration: 0.4, ease: EASE.dive })
          .to(root, { yPercent: -100, duration: DUR.tide, ease: EASE.dive }, "-=0.05");
      });
    },
    { scope: rootRef },
  );

  return (
    <>
      <div ref={rootRef} id="preloader" className="preloader" aria-hidden>
      <div ref={markRef} className="preloader-mark">
        A
      </div>
      <div className="preloader-track">
        <div ref={lineRef} className="preloader-line" />
      </div>
      <p ref={countRef} className="t-index">
        0%
      </p>
      {/* Sunset hem — hangs below the sheet and sweeps the viewport as it lifts
          (one static curtainPath wave; the sheet's transform carries it). */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-full h-[10vh] w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="preloader-sunset" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="var(--color-amber)" />
            <stop offset="55%" stopColor="var(--color-coral)" />
            <stop offset="100%" stopColor="var(--color-ember)" />
          </linearGradient>
        </defs>
        <path d={curtainPath(0.85, 2.6)} fill="url(#preloader-sunset)" />
      </svg>
      </div>
      {/* Runs during HTML parse (pre-paint): repeat visits never see the sheet,
          not even for a frame. Must stay AFTER the #preloader div. */}
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
    </>
  );
}

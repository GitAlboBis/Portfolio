"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { useUI } from "@/store/ui";

/**
 * Preloader — "the surface before the dive". A warm paper sheet present at first
 * paint (SSR'd, so there's no FOUC) while the fonts + WebGPU hero spin up: the "A"
 * focuses in over a thin ember progress line and a percentage counter — then the
 * camera PLUNGES THROUGH the sheet (the brief's "preloader and intro" reference,
 * GreenSock pen YzbPYMx, `_refs/DOSSIERS.md §1`): the dolly's split between a 2D
 * scale and a Z translation under perspective (scale 2 · P/(P−350), P = 500 →
 * 6.667×) makes the sheet's EDGES sweep outward faster than its centre — the
 * parallax of physically diving into the page — while the ink "A" swells past
 * the viewport and the sheet burns through onto the water "A" already alive
 * beneath (the fade is ours: the pen's front plane keeps its image; an opaque
 * paper sheet must release, recorded adaptation). No slide, no wipe.
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
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLDivElement>(null);
  const lineRef = React.useRef<HTMLDivElement>(null);
  const countRef = React.useRef<HTMLParagraphElement>(null);
  const setLoaded = useUI((s) => s.setLoaded);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      // Split exit: `unlock` flips ui.loaded the INSTANT the reveal starts (the
      // hero copy entrance rides the same shot as the lifting sheet — one
      // continuous take, not curtain-then-scene); `finish` just retires the DOM.
      const unlock = () => {
        setLoaded(true);
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
          /* storage unavailable (private mode) — the intro just replays */
        }
      };
      const finish = () => {
        root.style.display = "none";
      };

      // Already hidden pre-paint by the inline skip script (repeat visit / ?nopre):
      // unlock the page immediately, no animations.
      if (root.style.display === "none" || getComputedStyle(root).display === "none") {
        unlock();
        finish();
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.to(root, {
          autoAlpha: 0,
          duration: 0.3,
          delay: 0.2,
          onComplete: () => {
            unlock();
            finish();
          },
        });
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
        const sheet = sheetRef.current;
        if (!sheet) return;
        // THE PLUNGE (YzbPYMx, time-based): chrome fades, then the camera
        // dives THROUGH the sheet. Kept from the pen: the scale-2 + z-350
        // split under perspective 500 (total 6.667×), power1.inOut — the
        // tunnel decelerates at both ends. Ours: the burn-through release in
        // the final approach (an opaque paper plane must let go; the pen's
        // plane keeps its image), and `unlock` at dive start so the hero
        // copy rises inside the same shot.
        root.style.perspective = "500px";
        gsap.timeline({ onComplete: finish })
          .to([lineRef.current, countRef.current], { autoAlpha: 0, yPercent: -14, duration: 0.35, ease: EASE.dive })
          .add("reveal", "-=0.05")
          .call(unlock, [], "reveal")
          .to(
            sheet,
            { scale: 2, z: 350, transformOrigin: "center center", ease: "power1.inOut", duration: 1.15, force3D: true },
            "reveal",
          )
          .to(sheet, { autoAlpha: 0, duration: 0.5, ease: "power1.in" }, "reveal+=0.55");
      });
    },
    { scope: rootRef },
  );

  return (
    <>
      {/* suppressHydrationWarning: the inline SKIP_SCRIPT below hides this node
          pre-paint on repeat visits by writing style.display BEFORE React
          hydrates — a deliberate, single-element attribute mismatch (this was
          the one recurring console error on every returning visit). */}
      <div ref={rootRef} id="preloader" className="preloader" aria-hidden suppressHydrationWarning>
        {/* the plane the intro dives through — bg + centering live here so the
            burn-through releases the paper too (root is the perspective box) */}
        <div ref={sheetRef} className="preloader-sheet">
          <div ref={markRef} className="preloader-mark">
            A
          </div>
          <div className="preloader-track">
            <div ref={lineRef} className="preloader-line" />
          </div>
          <p ref={countRef} className="t-index">
            0%
          </p>
        </div>
      </div>
      {/* Runs during HTML parse (pre-paint): repeat visits never see the sheet,
          not even for a frame. Must stay AFTER the #preloader div. */}
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
    </>
  );
}

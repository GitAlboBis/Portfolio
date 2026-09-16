"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { useUI } from "@/store/ui";

/**
 * Preloader — "THE FORM PRINTING ITSELF" (REDESIGN-SPEC §G).
 *
 * A sheet of `paper` present at first paint (SSR'd, no FOUC) while the fonts
 * load. On it the job order prints itself from the top in ~500ms: the header
 * strip rules in (its bottom rule draws from the left, then its cell dividers),
 * the safety band fills downward, its rule draws and its six phase cells are
 * divided. Nothing else — no counter, no letter mark, no wave: the skeleton
 * lands exactly where the real HeaderStrip and PhaseBand are, so when the sheet
 * lifts the same rules are already there, now carrying their type.
 *
 * Robustness (unchanged mechanics):
 *   • the exit is gated on document.fonts.ready RACED against a hard 1.1s
 *     timeout, and globals.css gives `.preloader` a CSS failsafe animation that
 *     lifts the sheet at 3s — the page can NEVER stay trapped if the JS dies;
 *   • split exit: `unlock` flips ui.loaded the INSTANT the lift starts (the page
 *     beneath rides the same shot), `finish` just retires the DOM;
 *   • repeat visits skip PRE-PAINT via the inline script below (sessionStorage,
 *     `?nopre` forces it) — no flash, no hydration error (suppressHydrationWarning);
 *   • prefers-reduced-motion → the rules are already drawn and the sheet fades.
 *
 * Decorative (aria-hidden); the real content is underneath the whole time.
 */
const SEEN_KEY = "at-preloader-seen";
const SKIP_SCRIPT = `try{if(sessionStorage.getItem("${SEEN_KEY}")||location.search.indexOf("nopre")>-1){document.getElementById("preloader").style.display="none"}}catch(e){}`;

/** Cell edges of the printed skeleton, as fractions of the width. */
const STRIP_DIVIDERS = [0.42, 0.56, 0.78];
const BAND_DIVIDERS = [1, 2, 3, 4, 5, 6, 7].map((i) => (i * 100) / 8 / 100);

export function Preloader() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const setLoaded = useUI((s) => s.setLoaded);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
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

      // Queried off the root — never a bare selector string (it would reach
      // outside this component's scope).
      const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
      const hRules = q("[data-print='rule']");
      const vRules = q("[data-print='divider']");
      const band = root.querySelector<HTMLElement>("[data-print='band']");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        // Everything already printed; the sheet just fades off the page.
        gsap.set([...hRules, ...vRules], { scaleX: 1, scaleY: 1, autoAlpha: 1 });
        if (band) gsap.set(band, { scaleY: 1, autoAlpha: 1 });
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

      // ── The print, ~500ms (DUR.print): rules draw, then the band fills. ──
      gsap
        .timeline()
        .fromTo(
          hRules,
          { scaleX: 0 },
          { scaleX: 1, duration: DUR.rule, ease: EASE.rule, stagger: 0.09 },
          0,
        )
        .fromTo(
          band,
          { scaleY: 0 },
          { scaleY: 1, duration: DUR.rule, ease: EASE.rule },
          0.1,
        )
        .fromTo(
          vRules,
          { scaleY: 0 },
          { scaleY: 1, duration: DUR.text, ease: EASE.rule, stagger: STAGGER.rows },
          0.16,
        );

      // What we actually await: the fonts (hard 1.1s cap) AND the print itself
      // — a warm cache must not cut the form in half.
      const ready = Promise.all([
        Promise.race([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise((r) => setTimeout(r, 1100)),
        ]),
        new Promise((r) => setTimeout(r, 620)),
      ]);

      ready.then(() => {
        // The sheet is pulled off the top — the same 420ms `sheet` as a route
        // cover — and the real form is underneath, already ruled.
        gsap
          .timeline({ onComplete: finish })
          .call(unlock)
          .to(root, { yPercent: -100, duration: DUR.sheet, ease: EASE.sheet });
      });
    },
    { scope: rootRef },
  );

  return (
    <>
      {/* suppressHydrationWarning: the inline SKIP_SCRIPT below hides this node
          pre-paint on repeat visits by writing style.display BEFORE React
          hydrates — a deliberate, single-element attribute mismatch. */}
      <div ref={rootRef} id="preloader" className="preloader" aria-hidden suppressHydrationWarning>
        <div className="absolute inset-x-0 top-0">
          {/* header strip skeleton — the same 40/48px cell row as HeaderStrip */}
          <div className="relative h-10 md:h-12">
            <div
              data-print="rule"
              className="absolute inset-x-0 bottom-0 h-px origin-left bg-ink"
            />
            {STRIP_DIVIDERS.map((x) => (
              <div
                key={x}
                data-print="divider"
                className="absolute top-0 h-full w-px origin-top bg-ink"
                style={{ left: `${x * 100}%` }}
              />
            ))}
          </div>
          {/* safety band skeleton — six phase cells, counter, email */}
          <div className="relative">
            <div
              data-print="band"
              className="band-h w-full origin-top bg-safety"
            />
            <div
              data-print="rule"
              className="absolute inset-x-0 bottom-0 h-px origin-left bg-ink"
            />
            {BAND_DIVIDERS.map((x) => (
              <div
                key={x}
                data-print="divider"
                className="absolute top-0 h-full w-px origin-top bg-ink"
                style={{ left: `${x * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Runs during HTML parse (pre-paint): repeat visits never see the sheet,
          not even for a frame. Must stay AFTER the #preloader div. */}
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
    </>
  );
}

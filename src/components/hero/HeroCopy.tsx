"use client";

import * as React from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";

/*
  HeroCopy — the hero finally speaks.

  The first viewport used to carry ZERO words: the water "A" is the visual title,
  but name / role / tagline / scroll cue existed only as dead dict keys. This
  mounts them bottom-left inside #hero, layered over the fixed WebGPU canvas
  (fixed inset-0 z-0) — the section scrolls away naturally, and a scrubbed
  fade/sink dissolves the copy in sync with the "A" draining (HeroScrollSettle
  writes heroStore.explode over the same span; separate elements, no transform
  collision).

  • ENTRANCE — SplitText `type:"lines"` + `mask:"lines"`: lines rise out of
    per-line clips, staggered, power4.out. `autoSplit` re-splits on late font
    loads ("lines" is the one type it supports) — re-splits render the text
    settled, never replay. The fonts gate is RACED against a 1.5s cap: waiting
    on `document.fonts.ready` alone held the entrance hostage for 13s on a slow
    tab (verified live) — worst case we split on the next/font fallback metrics,
    whose line breaks match at these short line lengths.
  • LOADED GATE — reads ui.loaded at effect time and subscribes for the flip
    (NOT an effect dependency: the pre-`loaded` failsafe may already have played,
    and a dep re-run would revert + replay the whole entrance on top of it).
    Failsafe delayedCall covers a Preloader that never reports (its own CSS
    failsafe wipes at 2.4s).
  • COLOR — the hero gradient's foot is rose→dusk (dark), so the copy is PAPER
    with a single amber jewel word — the same language as the night band. A soft
    dusk scrim (decorative) steadies AA over the live fluid.
  • A11Y — this is the page's real h1 (the old sr-only h1 in page.tsx moved
    here); the " — Software Engineer" suffix stays sr-only, OUTSIDE the split
    target so SplitText never wraps it. SplitText aria:"auto" (default) keeps
    the split lines readable as one string.
  • Reduced-motion / no-JS / no-WebGPU — the effect never runs: plain static
    paper text over the CSS sunset gradient (this also rescues the no-WebGPU
    fallback from being a blank gradient).
*/
export function HeroCopy() {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  const root = React.useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const cap = setTimeout(() => alive && setFontsReady(true), 1500);
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (alive) {
        clearTimeout(cap);
        setFontsReady(true);
      }
    });
    return () => {
      alive = false;
      clearTimeout(cap);
    };
  }, []);

  // Accent word ("water" / "acqua") wrapped from the dict — never hardcoded.
  const tagline = t.hero.tagline;
  const accent = t.hero.taglineAccent;
  const accentAt = accent ? tagline.indexOf(accent) : -1;

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced || !fontsReady) return;

      const cue = el.querySelector("[data-hero-cue]");
      let lines: HTMLElement[] = [];
      let phase: "pending" | "playing" = "pending";
      let entrance: gsap.core.Tween | null = null;
      let cueTween: gsap.core.Tween | null = null;

      const split = SplitText.create(el.querySelectorAll("[data-hero-line]"), {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          lines = self.lines as HTMLElement[];
          // Fresh split while waiting → hide below the clips; a re-split after
          // the entrance started renders settled (never replay a hero intro).
          gsap.set(lines, { yPercent: phase === "pending" ? 112 : 0 });
        },
      });

      const start = (delay: number) => {
        if (phase !== "pending") return;
        phase = "playing";
        entrance = gsap.to(lines, {
          yPercent: 0,
          duration: 1.05,
          stagger: 0.09,
          ease: "power4.out",
          delay,
        });
        if (cue) cueTween = gsap.from(cue, { autoAlpha: 0, duration: 0.8, ease: "power2.out", delay: delay + 0.8 });
      };

      // Play after the Preloader wipe; if it never reports, the failsafe fires
      // after its own 2.4s CSS failsafe has wiped the sheet anyway.
      let unsub: (() => void) | null = null;
      let failsafe: gsap.core.Tween | null = null;
      if (useUI.getState().loaded) {
        start(0.35);
      } else {
        failsafe = gsap.delayedCall(3.2, () => start(0));
        unsub = useUI.subscribe((s) => {
          if (s.loaded) {
            unsub?.();
            unsub = null;
            failsafe?.kill();
            start(0.35);
          }
        });
      }

      // Scroll-out: sink + dissolve while the "A" pours (scrubbed, reverses).
      // end "+=55%" = 55% of the viewport past the start (the hero is exactly
      // 100dvh). NOT "55% top": a bare percentage there resolves against the
      // whole DOCUMENT height (verified: end landed at 0.55×docHeight).
      // `opacity`, NOT autoAlpha: visibility:hidden would drop the page's only
      // h1 out of the accessibility tree for anyone parked below the hero.
      const out = gsap.to(el, {
        y: -48,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "+=55%", scrub: true },
      });
      // dev-only handle for deterministic QA (see MenuOverlay's __menuTL); harmless.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __heroOutST?: ScrollTrigger }).__heroOutST = out.scrollTrigger;
      }

      return () => {
        unsub?.();
        failsafe?.kill();
        entrance?.kill();
        cueTween?.kill();
        // entrance/cueTween are created ASYNC (subscription/delayedCall), so
        // they live outside the useGSAP context: kill() stops them but leaves
        // whatever inline opacity the kill caught. A dep re-run (locale flip)
        // would then gsap.from() toward that stale value — cue stuck dim.
        if (cue) gsap.set(cue, { clearProps: "opacity,visibility" });
        out.scrollTrigger?.kill();
        out.kill();
        split.revert();
      };
    },
    {
      scope: root,
      dependencies: [reduced, fontsReady, tagline, t.hero.name, t.hero.role, t.hero.scroll],
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={root} className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      {/* Dusk scrim — steadies paper-text contrast over the moving fluid foot.
          Decorative support, not a section: the night BAND stays unique. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[58vh]"
        style={{
          // mid-stop holds density where the copy actually sits (the top line
          // was landing on the gradient's thin tail and failing AA — measured)
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--color-night) 72%, var(--color-dusk)) 0%, color-mix(in srgb, color-mix(in oklab, var(--color-night) 72%, var(--color-dusk)) 72%, transparent) 48%, transparent 100%)",
          opacity: 0.56,
        }}
      />

      <div className="container-edit relative pb-[clamp(2.5rem,6vh,4.5rem)]">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-10">
          <div>
            {/* role="group" on the split hosts: SplitText aria:"auto" puts the
                aria-label here, and naming is prohibited on bare p/span (axe
                aria-prohibited-attr) — group is the lightest role that allows it. */}
            <p data-hero-line role="group" className="t-meta text-paper">
              {t.hero.role}
            </p>
            {/* h1 = the name alone; the role is the line above, and <title> +
                JSON-LD carry "Software Engineer" for SEO — no hardcoded
                sr-only suffix bypassing the dict. */}
            <h1 className="t-display mt-3 text-paper">
              <span data-hero-line role="group" className="block">
                {t.hero.name}
              </span>
            </h1>
            <p data-hero-line role="group" className="t-lead mt-5 max-w-[28ch] text-paper/90">
              {accentAt >= 0 ? (
                <>
                  {tagline.slice(0, accentAt)}
                  {/* font-BOLD (700): WCAG's 14pt-bold large-text branch needs
                      real bold — 600 doesn't qualify at the 20.8px mobile size */}
                  <span className="font-bold text-amber">{accent}</span>
                  {tagline.slice(accentAt + accent.length)}
                </>
              ) : (
                tagline
              )}
            </p>
          </div>

          <div data-hero-cue className="flex flex-col items-center gap-3 pb-1">
            <span className="t-meta text-paper/85">{t.hero.scroll}</span>
            <span className="hero-cue-track" aria-hidden>
              <span className="hero-cue-line" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

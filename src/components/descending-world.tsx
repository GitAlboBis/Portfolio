"use client";

import { useEffect, useRef } from "react";

/*
  DescendingWorld — the ocean "world" that keeps living below the fold.

  A single fixed, full-viewport, aria-hidden background layer that sits BEHIND
  all below-fold section text and ABOVE the hero's fixed canvases (once the hero
  has scrolled away). As the visitor scrolls past the fold, the backdrop DEEPENS:
  a scroll-linked vertical journey from deep teal (--color-deep, continuous with
  the bottom of the hero sea) down to a near-black abyss at Contact — the felt
  sense of descending into the deep.

  Performance: ONE passive scroll listener, rAF-coalesced, writing CSS custom
  properties on a single element. No React state, no per-frame re-render, no
  layout reads in the hot path (we cache scrollHeight on resize). Everything the
  paint needs is expressed as CSS gradients + transforms keyed off two vars:

    --depth   0..1 normalized scroll depth of the below-fold region
    --par     a small parallax offset in px for the watermark drift

  Restraint (NatGeo register): the colour shift is the whole effect. The faint
  oversized "A" watermark and the grain are barely-there texture that NEVER lift
  the background luminance enough to threaten text contrast — at every depth the
  layer stays at or below --color-deep luminance, so foam/mist copy keeps AA.

  Reduced motion: we still set the resting depth once (so the world is colour-
  correct and not a flat slab), but we DON'T attach the scroll listener — no
  motion, no parallax, no continuous repaint.
*/

// Two anchor colours for the descent. Both are at/below --color-deep luminance,
// so text contrast only ever improves as we go down. Kept as literals (not the
// token vars) so we can interpolate channel-by-channel in JS for a true gradient
// shift rather than a hard crossfade.
const TOP = { r: 0x0b, g: 0x2c, b: 0x3a }; // --color-deep  #0b2c3a (under the hero)
const BOTTOM = { r: 0x02, g: 0x0b, b: 0x10 }; // near-black abyss, darker than --color-abyss

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mix(t: number): string {
  return `rgb(${lerp(TOP.r, BOTTOM.r, t)} ${lerp(TOP.g, BOTTOM.g, t)} ${lerp(
    TOP.b,
    BOTTOM.b,
    t,
  )})`;
}

export function DescendingWorld() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cached layout metric — refreshed only on resize, never in the scroll path.
    let docRange = 1;
    const measure = () => {
      docRange = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };

    // The descent begins roughly where the hero unpins (the hero section is
    // 600dvh tall and pinned). We map the WHOLE page progress to depth but bias
    // it so the colour is still ~deep through the hero and only commits to the
    // abyss across the content sections. A simple eased remap does the job
    // without needing the hero's exact pixel bounds.
    const HERO_FRACTION = 0.55; // ~hero share of total scroll; below this we hold near the top colour
    // The veil stays invisible through the hero footage and fades in across the
    // hero->content handoff, so the descending world never covers the cinematic.
    const HERO_FADE_START = 0.48;
    const HERO_FADE_END = 0.58;

    const paint = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const p = Math.min(1, Math.max(0, y / docRange));
      // Remap: 0 through HERO_FRACTION -> 0..~0.18, then accelerate to 1 at bottom.
      const depth =
        p < HERO_FRACTION
          ? (p / HERO_FRACTION) * 0.18
          : 0.18 + ((p - HERO_FRACTION) / (1 - HERO_FRACTION)) * 0.82;

      el.style.setProperty("--top", mix(Math.min(1, depth)));
      el.style.setProperty("--bot", mix(Math.min(1, depth + 0.32)));
      el.style.setProperty("--depth", depth.toFixed(4));
      // MASTER VEIL — the whole layer is transparent during the hero so the
      // VideoBackdrop footage + water "A" (also fixed, z-0, but earlier in DOM)
      // read through untouched. It fades in only as the hero unpins and the
      // content world begins, then holds full for the entire descent. The ramp
      // is keyed off page progress so it tracks the hero handoff precisely.
      const veil =
        p <= HERO_FADE_START
          ? 0
          : Math.min(1, (p - HERO_FADE_START) / (HERO_FADE_END - HERO_FADE_START));
      el.style.opacity = veil.toFixed(4);
      // gentle parallax drift for the watermark (px). Bounded + subtle.
      el.style.setProperty("--par", (depth * -64).toFixed(1));
      // watermark + grain fade slightly as we reach the lightless bottom
      el.style.setProperty(
        "--tex",
        (0.05 * (1 - Math.min(1, depth))).toFixed(4),
      );
    };

    measure();
    paint();

    if (reduce) {
      // resting frame only — colour-correct, no listeners.
      window.addEventListener("resize", measure, { passive: true });
      return () => window.removeEventListener("resize", measure);
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        paint();
        ticking = false;
      });
    };
    const onResize = () => {
      measure();
      paint();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={
        {
          // Start fully transparent so we NEVER cover the hero footage before JS
          // runs (SSR / first paint). paint() sets the real veil on mount.
          opacity: 0,
          // initial resting values (overwritten on mount by paint())
          "--top": "rgb(11 44 58)",
          "--bot": "rgb(7 26 34)",
          "--depth": "0",
          "--par": "0px",
          "--tex": "0.05",
        } as React.CSSProperties
      }
    >
      {/* Layer 1 — the descending colour body. A vertical gradient whose stops
          are driven by scroll depth: deep teal up top, abyss toward the bottom. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--top) 0%, var(--bot) 100%)",
        }}
      />

      {/* Layer 2 — a faint radial "shaft of light" from the surface, anchored at
          the top so the upper sections feel lit from above and the bottom reads
          as pressure-dark. Very low alpha; never raises text-background contrast
          risk because foam/mist text only sits on the much darker mid/lower band. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(155,211,238,0.06), transparent 60%)",
          opacity: "calc(1 - var(--depth))",
        }}
      />

      {/* Layer 3 — oversized "A" watermark, drifting up a touch as we descend
          (parallax). Rendered as an outline-thin, very low-alpha mark so it is
          atmosphere, not content, and cannot compromise legibility. */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          transform: "translateY(var(--par))",
          opacity: "var(--tex)",
          willChange: "transform",
        }}
      >
        <span
          className="select-none font-semibold leading-none"
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "min(120vh, 140vw)",
            WebkitTextStroke: "1px rgba(244,250,251,0.5)",
            color: "transparent",
          }}
        >
          A
        </span>
      </div>

      {/* Layer 4 — ultra-fine caustic/grain texture (inline SVG fractal noise as a
          data URI; self-contained, no network). Multiplies into the dark water so
          it reads as suspended particulate, not a flat fill. Alpha is tiny. */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          opacity: "calc(var(--tex) * 1.6)",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.5'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />
    </div>
  );
}

/*
  useScrollParallax — a tiny, shared depth-offset primitive for the below-fold
  sections. Returns a ref to attach to the element you want to drift. As the
  element travels through the viewport it gets a small vertical translate
  (`speed` px at the extremes), so headings/media feel like they hang in the
  water at a slightly different depth than the page — restrained parallax, the
  kind that reads as craft, not gimmick.

  It shares the descent's performance discipline: ONE passive scroll listener,
  rAF-coalesced, writing transform directly on the node (no React re-render).
  Respects prefers-reduced-motion (returns an inert ref, never moves the node).
*/
export function useScrollParallax<T extends HTMLElement = HTMLDivElement>(
  speed = 28,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress of the element's centre through the viewport: -1 (entering
      // from below) .. +1 (leaving past the top). 0 = centred.
      const centre = rect.top + rect.height / 2;
      const t = (centre - vh / 2) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, t));
      // drift opposite to travel so the element lags the page = "deeper".
      el.style.transform = `translate3d(0, ${(clamped * speed).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    el.style.willChange = "transform";
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return ref;
}

"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";

/*
  WorkApproach — the arrival beat above the /work runway.

  Port of joffreysp/telescope-zoom (Codrops, Oct 2025), studied in
  _refs/DOSSIERS.md §2. The mechanism there is not a zoom: it is ONE silhouette
  repeated at six depths, each showing the same photograph through it, all
  converging to scale 1 so the six nested copies REGISTER into a single shape —
  while ten thumbnails fly past the camera and the headline splits to the edges.

  Their silhouette is a crab (public/mask.png). Ours is the letter the whole site
  is built on: the hero is a water "A", the constellation is an "A", the
  404 drifts on the same water. So the work index now arrives by assembling that
  same "A" out of the work itself, and hands off into the runway.

  Kept exactly as upstream (these ARE the effect):
    • layer scale stack [1, .85, .6, .45, .3, .15] — the ratios are non-uniform
      and accelerate toward the centre (x.85, x.706, x.75, x.667, x.5), which is
      what reads as perspective recession rather than a linear stack
    • the stack's own scale is driven by --progress, set from a JS-eased
      power1.inOut of the scroll progress (NOT a CSS ease)
    • flyers: perspective 100vh + z 100vh, so the projection scale P/(P-z) runs
      1 -> infinity and they blow past the camera; stagger amount .2 from "center"
    • fronts converge to scale 1 at timeline 0.6 + delay .1
    • fronts sharpen blur(2px) -> blur(0) at 0.6 + delay .4, stagger amount .2
      from "end" — the DEEPEST layer sharpens first
    • headline halves translate +-66vw (+-100vw under 768px)

  Changed (ours, not theirs): the silhouette, the photography, the paper ground,
  and CSS `position: sticky` instead of ScrollTrigger `pin`. The pin is
  deliberate: the runway below is itself a sticky ScrollTrigger surface, and this
  codebase already paid for mixing the two ("sticky + ScrollTrigger non si
  conoscono" — Nightfall). A 200vh wrapper with a 100vh sticky child reproduces
  the reference's geometry exactly (100vh of travel, 200vh of document) with no
  pin-spacer to disturb the runway's measurements.

  Decorative: aria-hidden throughout — the words rendered here already exist as
  the real <h1 id="works-title"> inside the runway below, so this must not
  introduce a competing heading. Reduced motion: rendered in its final, converged
  state with no timeline. No WebGL, no canvas.
*/

const LAYER_SCALES = [1, 0.85, 0.6, 0.45, 0.3, 0.15] as const;

/** Upstream's flyer positions — art-directed to ring the centre. */
const FLYERS = [
  { top: "15vw", left: "-3vw" },
  { top: "5vw", left: "20vw" },
  { top: "8vw", left: "26.5vw" },
  { top: "18vw", right: "18vw" },
  { top: "5vw", right: "10vw" },
  { bottom: "5vw", left: "10vw" },
  { bottom: "8vw", left: "22.5vw" },
  { bottom: "3vw", left: "45vw" },
  { bottom: "5vw", right: "15vw" },
  { bottom: "9vw", right: "7vw" },
] as const;

export function WorkApproach() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  // Effect-time only. The store resolves reducedMotion from matchMedia at module
  // load, so it is already true on a reduced-motion visitor's FIRST client render
  // but false in the server HTML — putting it in an inline style mismatched the
  // trees and React discarded the hydration (measured: --progress rendered "0" on
  // the server, 1 on the client). So NOTHING here branches on it at render time:
  // the default lives in a class ([--progress:0]) and the effect owns the live
  // value, which is inline and therefore wins. Effect-time reads are safe.
  const reduced = useUI((s) => s.reducedMotion);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const stickyRef = React.useRef<HTMLDivElement>(null);

  // The stills that exist (the two provisional SerSan works carry none). The
  // nested layers must all show the SAME photograph or they cannot register into
  // one shape at the end — that registration is the payoff.
  const stills = React.useMemo(
    () => works.map((w) => w.textureSrc).filter((s): s is string => !!s),
    [],
  );
  const markSrc = stills[stills.length - 1] ?? stills[0];

  // "Things I've built" -> ["Things", "I've built"] · "Cose che ho costruito" ->
  // ["Cose", "che ho costruito"]. Split on the first space so both locales work
  // without adding a dict key (the shape is zod-validated; don't churn it).
  const [head, tail] = React.useMemo(() => {
    const s = t.works.title.trim();
    const i = s.indexOf(" ");
    return i === -1 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)];
  }, [t.works.title]);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const sticky = stickyRef.current;
      if (!wrap || !sticky) return;

      if (reduced) {
        // final, converged frame — no timeline, no scrub
        sticky.style.setProperty("--progress", "1");
        return;
      }

      const fronts = gsap.utils.toArray<HTMLElement>("[data-approach-front]", sticky);
      const flyers = gsap.utils.toArray<HTMLElement>("[data-approach-flyer]", sticky);

      gsap.set(flyers, {
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        force3D: true,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          // the sticky child is stuck for exactly (wrapper - viewport) = 100vh
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            // upstream sets --progress from a JS-eased progress, not a CSS ease:
            // the stack's growth is quadratic in/out while the timeline below
            // scrubs linearly. Both are needed — they are different curves.
            sticky.style.setProperty(
              "--progress",
              String(gsap.parseEase("power1.inOut")(self.progress)),
            );
          },
        },
      });

      // 1. the thumbnails fly at the camera and vanish through it
      tl.to(flyers, {
        z: "100vh",
        duration: 1,
        ease: "power1.inOut",
        stagger: { amount: 0.2, from: "center" },
      });

      // 2. the nested letters converge and register into one
      tl.to(fronts, { scale: 1, duration: 1, ease: "power1.inOut", delay: 0.1 }, 0.6);

      // 3. and sharpen, deepest layer first
      tl.to(
        fronts,
        {
          duration: 1,
          filter: "blur(0px)",
          ease: "power1.inOut",
          delay: 0.4,
          stagger: { amount: 0.2, from: "end" },
        },
        0.6,
      );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        // the scrubbed inline styles must not survive a reduced-motion/locale
        // rebuild, or the old build's end values become the new build's start
        gsap.set([...fronts, ...flyers], { clearProps: "all" });
      };
    },
    // revertOnUpdate: without it a live reduced-motion or locale flip stacks a
    // second trigger on top of the first (the lesson from LA RISALITA).
    { scope: stickyRef, dependencies: [reduced, locale], revertOnUpdate: true },
  );

  if (!markSrc) return null;

  return (
    /* 200vh wrapper + 100vh sticky child = exactly 100vh of travel, the same
       geometry the reference gets from a pinned 100vh section plus its
       pin-spacer — without a pin to disturb the runway's own measurements.
       motion-reduce collapses it to a single screen: the converged frame is
       worth one poster, but making a reduced-motion visitor scroll two
       viewports past a decoration to reach the list is not. Handled purely in
       CSS so it adds ZERO hydration surface (the TideEbb pattern). */
    <div ref={wrapRef} aria-hidden className="relative h-[200vh] motion-reduce:h-dvh">
      <div
        ref={stickyRef}
        data-approach-root
        className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden bg-paper [--progress:0]"
      >
        {/* the ground the letter is cut out of */}
        <div className="absolute inset-0 bg-paper-deep/40" />

        {/* THE STACK — six nested "A"s, each the same photograph seen through the
            letterform, at receding depths. background-clip:text keeps the mark
            vector-sharp at any scale (the reference ships a raster mask.png; we
            have a typeface, so there is no resolution ceiling here). */}
        <div
          className="absolute inset-0"
          style={{ transform: "scale(var(--progress))", transformOrigin: "50% 50%" }}
        >
          {LAYER_SCALES.map((s, i) => (
            <div
              key={i}
              data-approach-front
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `scale(${s})`, filter: "blur(2px)" }}
            >
              <span
                className="select-none font-display font-extrabold leading-[0.75]"
                style={{
                  fontSize: "88vh",
                  backgroundImage: `url(${markSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                A
              </span>
            </div>
          ))}
        </div>

        {/* THE FLYERS — the projects themselves, passing the camera */}
        <div className="absolute inset-0" style={{ perspective: "100vh" }}>
          {FLYERS.map((pos, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              data-approach-flyer
              src={stills[i % stills.length]}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute w-[20vw] md:w-[10vw]"
              style={{ ...pos, aspectRatio: "3 / 2", objectFit: "cover" }}
            />
          ))}
        </div>

        {/* the title splits to the edges as you approach — decorative twin of the
            real <h1> in the runway below */}
        {/* --split is the reference's own responsive throw: 66vw over 768px,
            100vw below it (their @media block). A CSS var carries it because an
            inline style cannot hold a media query. */}
        <p className="relative z-10 flex w-full justify-center whitespace-nowrap font-display font-semibold text-ink [--split:100vw] [font-size:9vw] md:[--split:66vw] md:[font-size:3vw]">
          <span
            className="inline-block"
            style={{
              transform:
                "translate3d(calc(var(--progress) * (-1 * var(--split) + 100%) - 0.5vw), 0, 0)",
            }}
          >
            {head}
          </span>
          <span>&nbsp;</span>
          <span
            className="inline-block"
            style={{
              transform: "translate3d(calc(var(--progress) * (var(--split) - 100%)), 0, 0)",
            }}
          >
            {tail}
          </span>
        </p>
      </div>
    </div>
  );
}

export default WorkApproach;

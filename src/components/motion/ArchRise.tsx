"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/*
  ArchRise — the seam that isn't a seam.

  Port of the arch transition on era-residence.com, from Alberto's own reverse
  engineering (domus-tua-site/reverse-engineering/era-residence). The trick is
  that the INCOMING section is a dome which rises from the bottom and covers the
  outgoing one — the two never meet on a line, so there is no edge to perceive.

  `css/arch-dome.css`:

      .section.arch     { border-top-left-radius: 50rem; border-top-right-radius: 50rem; }
      .benefits-intro-s { height: 50rem; }
      .benefits-intro-w { margin-top: calc((50rem + var(--_100vh)) * -1); }

  With their `html { font-size: 1vw }`, 50rem IS 50vw. Two things follow, and
  getting either wrong kills the shape:

   1. On a full-width layer the two corner radii sum to exactly the width, so the
      top edge becomes a true semicircle rather than a pair of rounded corners.
   2. The element must be AT LEAST as tall as the radius. CSS shrinks border
      radii proportionally when they don't fit the box — a 50vw radius on a 24vh
      cap silently collapses to a 24vh radius, which reads as "rounded corners",
      not as a dome. (Measured on the first attempt here.)

  And `js/main.pretty.js` (.arch-scroll-area, scrub, "top bottom" → "200% top"):

      .fromTo(archIntro, { scale: 1 },  { scale: 1.84, ease: "InOut", duration: .4 })
      .fromTo(arch, { scale: .75, transformOrigin: "center top" },
                    { scale: 1,  ease: "InOut", duration: .4 }, "<")

  That PAIRING is the effect, not the radius alone: the outgoing section blows
  past the camera while the dome grows into place. You are not watching one panel
  replace another — you are moving through one into the next.

  ── Why a wrapper, and why it must be the real surface ───────────────────────
  The dome has to BE the incoming section, not a cap floating above it. A cap in
  a different shade re-introduces exactly the horizontal line it was meant to
  erase (also measured here on the first attempt: the cap was `--color-paper`
  while the band below it was tinted by GoldenHaze, and the join was visible).
  So this wraps the section and clips it to the dome.

  `overflow: clip`, never `overflow: hidden`: clip does not create a scroll
  container, so `position: sticky` inside still works. Do not "simplify" it to
  hidden — that would silently break every sticky descendant.

  Decorative shape only; adds no semantics. Reduced motion keeps the dome (a
  shape, not a motion) and drops the scrub.
*/

export function ArchRise({
  children,
  /** How far the dome is pulled up over the section it covers. */
  overlap = "26vh",
  /** 50vw = era-residence's exact semicircle on a full-width layer. */
  radius = "50vw",
  /** Upstream's 0.75 → 1 rise. Set false for a static dome. */
  rise = true,
  className = "",
}: {
  children: React.ReactNode;
  overlap?: string;
  radius?: string;
  rise?: boolean;
  className?: string;
}) {
  const reduced = useUI((s) => s.reducedMotion);
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced || !rise) return;
      // Upstream scales the whole arch 0.75 → 1 from `center top`. Scaling the
      // wrapper would scale the copy inside it too, so only the SHAPE rises: the
      // radius opens up as the dome arrives, which is the same read (a curve
      // flattening into the page) without touching type legibility mid-scroll.
      const tw = gsap.fromTo(
        el,
        { borderTopLeftRadius: radius, borderTopRightRadius: radius },
        {
          borderTopLeftRadius: "0vw",
          borderTopRightRadius: "0vw",
          ease: "power2.inOut",
          scrollTrigger: { trigger: el, start: "top bottom", end: "top 15%", scrub: true },
        },
      );
      return () => {
        tw.scrollTrigger?.kill();
        tw.kill();
        gsap.set(el, { clearProps: "borderTopLeftRadius,borderTopRightRadius" });
      };
    },
    { scope: ref, dependencies: [reduced, rise, radius], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        marginTop: `calc(-1 * ${overlap})`,
        // clip, NOT hidden — hidden would break `position: sticky` descendants
        overflow: "clip",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}

export default ArchRise;

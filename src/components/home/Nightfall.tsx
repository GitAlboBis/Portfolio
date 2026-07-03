"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/**
 * Nightfall — the Codrops "sticky section stacking" mechanism (a section pins in
 * its final reading position while the next slides OVER it, the outgoing one
 * receding underneath) applied to the ONE place it means something here: the
 * day→night handoff on the home. The day's last section docks with its bottom at
 * the viewport bottom; the night band (`.nightfall-cover`, the next sibling)
 * rides up over it while the pinned card falls back — a small scale recede plus
 * a dusk veil, both scrubbed to the night edge's own travel (reverses with it).
 *
 * Geometry lives in globals.css (.nightfall-*): the runway's +100vh and the
 * cover's −100vh cancel out, so every other scroll offset on the page is
 * untouched. Under prefers-reduced-motion the CSS flattens everything back to
 * plain flow and this component's effect never runs. transform/opacity only;
 * the veil is aria-hidden and pointer-transparent (the icon cloud stays
 * draggable to the last moment).
 *
 * Used once, on the home. `coverId` must be the id of the night band element.
 */
export function Nightfall({
  children,
  coverId = "nightfall",
}: {
  children: React.ReactNode;
  coverId?: string;
}) {
  const runwayRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const veilRef = React.useRef<HTMLDivElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  // Dock the card by its BOTTOM: sticky `top` = viewport − card height, so a
  // section taller than the viewport pins fully read (bottom at the fold), not
  // with its tail trapped under it. Set through a CSS var from geometry — a
  // ResizeObserver covers content/viewport changes; no per-frame work.
  React.useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const dock = () => {
      card.style.setProperty("--nf-top", `${window.innerHeight - card.offsetHeight}px`);
    };
    dock();
    const ro = new ResizeObserver(dock);
    ro.observe(card);
    window.addEventListener("resize", dock);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", dock);
    };
  }, []);

  useGSAP(
    () => {
      if (reduced) return;
      const card = cardRef.current;
      const veil = veilRef.current;
      const cover = document.getElementById(coverId);
      if (!card || !veil || !cover) return;

      // Welded to the night edge: progress 0 as the band's top enters the
      // viewport bottom, 1 when it reaches the top (card fully covered).
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: cover, start: "top bottom", end: "top top", scrub: true },
      });
      tl.fromTo(card, { scale: 1 }, { scale: 0.955, transformOrigin: "50% 80%" }, 0).fromTo(
        veil,
        { opacity: 0 },
        { opacity: 0.45 },
        0,
      );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: runwayRef, dependencies: [reduced, coverId], revertOnUpdate: true },
  );

  return (
    <div ref={runwayRef} className="nightfall-runway relative">
      <div ref={cardRef} className="nightfall-card">
        {children}
        <div ref={veilRef} aria-hidden className="nightfall-veil" />
      </div>
      {/* Real-content spacer = the card's pinned travel (see globals.css). */}
      <div aria-hidden className="nightfall-spacer" />
    </div>
  );
}

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
  // `data-nf-ready` arms the sticky in CSS only once this has run: the var's
  // 0px fallback would otherwise pin the card by its TOP pre-hydration/no-JS
  // and invert the dock. Geometry changes (locale switch reflowing About, the
  // card itself growing) also move the night edge, so the scrub's trigger
  // positions go stale — a debounced ScrollTrigger.refresh() re-measures.
  React.useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let lastH = 0;
    let refreshT: number | undefined;
    // refresh(true) = the SAFE variant: it defers to scroll-end while a Lenis
    // glide is live instead of forcing a synchronous whole-document re-measure
    // inside a scroll frame (positions stay stale for the rest of an unbroken
    // glide — bounded, self-healing at the first pause).
    const scheduleRefresh = () => {
      window.clearTimeout(refreshT);
      refreshT = window.setTimeout(() => ScrollTrigger.refresh(true), 200);
    };
    const dock = () => {
      const h = card.offsetHeight;
      card.style.setProperty("--nf-top", `${window.innerHeight - h}px`);
      card.dataset.nfReady = "";
      if (h !== lastH) {
        lastH = h;
        scheduleRefresh();
      }
    };
    // ScrollTrigger measures trigger positions with getBoundingClientRect at
    // refresh time and knows nothing about sticky: a refresh that lands while
    // the card is STUCK (parked at the footer, mobile URL-bar resize) would
    // bake up to 100vh of sticky displacement into the windows of the scrubbed
    // triggers INSIDE the card (#tech-title's TideReveal, the eyebrow
    // Parallax) — scrolled back up, the Tech title would sit fully masked.
    // Disarm the sticky before positions are captured and re-dock after; the
    // whole refresh cycle is synchronous, so nothing ever paints disarmed.
    const disarm = () => card.removeAttribute("data-nf-ready");
    ScrollTrigger.addEventListener("refreshInit", disarm);
    ScrollTrigger.addEventListener("refresh", dock);
    dock();
    const ro = new ResizeObserver(dock);
    ro.observe(card);
    const bodyRo = new ResizeObserver(scheduleRefresh);
    bodyRo.observe(document.body);
    window.addEventListener("resize", dock);
    return () => {
      ScrollTrigger.removeEventListener("refreshInit", disarm);
      ScrollTrigger.removeEventListener("refresh", dock);
      ro.disconnect();
      bodyRo.disconnect();
      window.removeEventListener("resize", dock);
      window.clearTimeout(refreshT);
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
      // viewport bottom, 1 when it reaches the top. At full occlusion the card
      // flags [data-scene-covered] so the icon cloud's rAF loop
      // (tech-cloud.tsx) can sleep instead of rendering unseen frames behind
      // the opaque night band forever. Occlusion is geometric, not progress
      // 1: on a viewport TALLER than the card (portrait/4K) the band's edge
      // passes the card's visible top — clipped at the viewport top — well
      // before the scrub ends, and a reader parked there must sleep the cloud
      // too.
      // One geometric truth for both writers below (onUpdate + revalidate) —
      // a progress-based branch and a geometric one disagree at the boundary
      // and would fight over the flag. 1% of vh of card still peeking counts
      // as covered (imperceptible, and absorbs sub-pixel scroll settle).
      const isCovered = () =>
        cover.getBoundingClientRect().top <=
        Math.max(card.getBoundingClientRect().top, 0) + window.innerHeight * 0.01;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: cover,
          start: "top bottom",
          end: "top top",
          scrub: true,
          onUpdate: () => card.toggleAttribute("data-scene-covered", isCovered()),
        },
      });
      tl.fromTo(card, { scale: 1 }, { scale: 0.955, transformOrigin: "50% 80%" }, 0).fromTo(
        veil,
        { opacity: 0 },
        { opacity: 0.55 },
        0,
      );

      // Self-heal for scroll deltas GSAP can miss (instant programmatic
      // jumps, browser scroll restoration): a stale-TRUE flag freezes a
      // VISIBLE cloud, so revalidate on native scroll — but only while the
      // flag is set (hasAttribute is free; no rect reads outside the band).
      const revalidate = () => {
        if (card.hasAttribute("data-scene-covered") && !isCovered()) {
          card.removeAttribute("data-scene-covered");
        }
      };
      window.addEventListener("scroll", revalidate, { passive: true });

      return () => {
        window.removeEventListener("scroll", revalidate);
        card.removeAttribute("data-scene-covered");
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

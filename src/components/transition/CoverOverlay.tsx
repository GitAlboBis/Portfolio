"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { curtainPath } from "@/lib/curtain";

/*
  CoverOverlay — the EXIT half of the sunset curtain (Continuous Curtain).

  RouteTransition (template.tsx) owns the ENTER: every new route mounts fully
  covered and lifts. This overlay closes the loop documented at
  RouteTransition:22 ("Enter-only — no click interception"): TransitionLink
  covers the OLD page with the same two curtainPath layers (sunset lead seed
  1.7, night seed 4.2 — identical to menu + enter), then router.push()es.

  OWNERSHIP HANDSHAKE — the overlay must survive the route swap, so it mounts
  ONCE in layout.tsx (template remounts would wipe it mid-cover):
    1. cover() drives v 0→1 (0.42s power2.in — the descending direction the
       curtainPath amplitude damping was tuned for), then navigates.
    2. The new route's RouteTransition snaps ITS paths to v=1 in a layout
       effect (pre-paint), underneath us.
    3. Our usePathname effect (passive → runs after that paint) sees the route
       change and clears our paths INSTANTLY — the enter's identical night
       cover is already beneath; an animated retract here would double-lift.
  TIMEOUT RELEASE — if the push never lands (hung/rejected RSC fetch), a 1.8s
  delayedCall retracts the curtain (animated this time — the same page is
  beneath) and unlatches, so a failed nav can never strand a full-night
  overlay. Any pathname change mid-cover (e.g. back button) also releases.

  The svg is aria-hidden + pointer-events-none (never blocks the route
  announcer or AT) and sits at z-[90]: above the enter svg (z-[80]), below the
  Preloader (z-200). Reduced-motion: TransitionLink never calls us; cover()
  also self-guards by navigating immediately with no paint.
*/

type Controller = {
  cover: (onCovered: () => void) => void;
  handoff: () => void; // instant clear — the new route's enter owns the cover
  bail: () => void; // animated retract — navigation failed, same page beneath
};

let controller: Controller | null = null;
let navigating = false;

/**
 * Cover the page, then run `navigate`. Returns true when the click is handled
 * (covering, or swallowed by the latch) — caller must preventDefault. Returns
 * false when no overlay is mounted — caller falls through to the plain Link.
 */
export function coverAndNavigate(navigate: () => void): boolean {
  if (navigating) return true; // latch: second click mid-cover is swallowed
  if (!controller) return false;
  navigating = true;
  controller.cover(navigate);
  return true;
}

export function CoverOverlay() {
  const pathname = usePathname();
  const leadRef = React.useRef<SVGPathElement>(null);
  const nightRef = React.useRef<SVGPathElement>(null);
  const firstPath = React.useRef(true);

  React.useEffect(() => {
    const lead = leadRef.current;
    const night = nightRef.current;
    if (!lead || !night) return;

    const proxy = { v: 0 };
    let tween: gsap.core.Tween | null = null;
    let timeout: gsap.core.Tween | null = null;

    const paint = () => {
      lead.setAttribute("d", curtainPath(proxy.v, 1.7));
      night.setAttribute("d", curtainPath(Math.max(proxy.v * 1.12 - 0.12, 0), 4.2));
      // The painted region SWALLOWS input (paths only — the svg root stays
      // pointer-events-none, so the not-yet-covered area keeps its semantics
      // during the descend). Without this, the fully-opaque pending window
      // left the invisible old page click-operable (hamburger, locale…).
      const swallow = proxy.v > 0.002 ? "auto" : "none";
      lead.style.pointerEvents = swallow;
      night.style.pointerEvents = swallow;
    };
    // Keyboard/focus can't be stopped by pointer-events: the old page goes
    // `inert` for the covered window (RouteTransition marks its content div
    // with data-page-root). The new route mounts a FRESH root without the
    // attribute, and handoff/bail/unmount all lift it — belt and suspenders.
    const setInert = (on: boolean) =>
      document.querySelector("[data-page-root]")?.toggleAttribute("inert", on);
    const clear = () => {
      proxy.v = 0;
      lead.setAttribute("d", "M0 0H0Z");
      night.setAttribute("d", "M0 0H0Z");
      lead.style.pointerEvents = "none";
      night.style.pointerEvents = "none";
    };
    const stop = () => {
      tween?.kill();
      timeout?.kill();
      tween = timeout = null;
    };

    controller = {
      cover(onCovered) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          onCovered(); // defense in depth — TransitionLink already skips us
          return;
        }
        stop();
        setInert(true);
        tween = gsap.to(proxy, {
          v: 1,
          duration: 0.42,
          ease: "power2.in",
          overwrite: "auto",
          onUpdate: paint,
          onComplete: () => {
            onCovered();
            // Released by the pathname handoff. 2.5s covers real-world slow
            // RSC fetches (prod prefetch makes most pushes instant); a push
            // that outlives it is treated as hung. If it STILL commits later,
            // the enter plays as a hard cut — exactly the pre-curtain enter
            // behavior, acceptable for so rare a straggler.
            timeout = gsap.delayedCall(2.5, () => controller?.bail());
          },
        });
      },
      handoff() {
        // A LIVE descend here means the user already covered for ANOTHER nav
        // and this commit is a stale straggler: let the new cover finish (it
        // will push and hand off on its own) instead of killing it and
        // silently dropping that navigation.
        if (tween && tween.isActive()) return;
        stop();
        navigating = false;
        setInert(false);
        clear();
      },
      bail() {
        stop();
        navigating = false;
        setInert(false);
        if (proxy.v <= 0.002) return clear();
        tween = gsap.to(proxy, {
          v: 0,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
          onUpdate: paint,
          onComplete: clear,
        });
      },
    };

    return () => {
      stop();
      clear();
      setInert(false);
      controller = null;
      navigating = false;
    };
  }, []);

  // Route committed (push landed, or back/forward mid-cover): hand the cover
  // to the new route's enter. Passive effect = runs AFTER the enter's
  // pre-paint snap-to-covered, so there is no uncovered frame in between.
  React.useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    controller?.handoff();
  }, [pathname]);

  return (
    <svg
      id="exit-cover"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="cover-sunset" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="var(--color-amber)" />
          <stop offset="42%" stopColor="var(--color-coral)" />
          <stop offset="72%" stopColor="var(--color-ember)" />
          <stop offset="100%" stopColor="var(--color-rose)" />
        </linearGradient>
      </defs>
      {/* sunset leads the descent; night trails it and lands last — the same
          "the light passes, then night settles" beat as the menu open */}
      <path ref={leadRef} d="M0 0H0Z" fill="url(#cover-sunset)" />
      <path ref={nightRef} d="M0 0H0Z" fill="var(--color-night)" />
    </svg>
  );
}

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import {
  clearSheet,
  coverTimeline,
  dropFlip,
  retractTimeline,
  RULE_CLASS,
  SHEET_CLASS,
  SHEET_HOST_CLASS,
  SHEET_REST_STYLE,
  RULE_REST_STYLE,
  type SheetEls,
} from "@/lib/sheet";

/*
  CoverOverlay — the EXIT half of the route cover (THE JOB ORDER).

  The mechanics here are hard-won and UNCHANGED from the Continuous Curtain
  (only the artwork is new: a flat paper sheet + a 1px ink rule that prints
  downward — see src/lib/sheet.ts).

  RouteTransition (template.tsx) owns the ENTER: every new route mounts fully
  covered and lifts. TransitionLink covers the OLD page with the same two
  elements, then router.push()es.

  OWNERSHIP HANDSHAKE — the overlay must survive the route swap, so it mounts
  ONCE in layout.tsx (a template remount would wipe it mid-cover):
    1. cover() prints the sheet down (0.42s `sheet`), then navigates.
    2. The new route's RouteTransition snaps ITS sheet to covered in a layout
       effect (pre-paint), underneath us.
    3. Our usePathname effect (passive → runs after that paint) sees the route
       change and clears our sheet INSTANTLY — the enter's identical cover is
       already beneath; an animated retract here would double-lift.
  TIMEOUT RELEASE — if the push never lands (hung/rejected RSC fetch), a 2.5s
  delayedCall retracts the sheet (animated this time — the same page is
  beneath) and unlatches, so a failed nav can never strand a covered page. Any
  pathname change mid-cover (e.g. back button) also releases.

  The host is aria-hidden + pointer-events-none (never blocks the route
  announcer or AT); the SHEET itself takes pointer-events while it covers, so
  the painted region swallows input during the pending window and the
  not-yet-covered area keeps its semantics. Keyboard/focus can't be stopped
  that way, so the old page goes `inert` (RouteTransition marks its content
  div with data-page-root).

  Reduced motion: the cover is a 150ms opacity swap of the same sheet (§C.7) —
  TransitionLink still routes through us, so the latch, the inert window and
  the bail all behave identically.
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
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const ruleRef = React.useRef<HTMLDivElement>(null);
  const firstPath = React.useRef(true);

  React.useEffect(() => {
    const sheet = sheetRef.current;
    const rule = ruleRef.current;
    if (!sheet || !rule) return;
    const els: SheetEls = { sheet, rule };

    let tl: gsap.core.Timeline | null = null;
    let timeout: gsap.core.Tween | null = null;

    // The old page goes inert for the covered window. The new route mounts a
    // FRESH root without the attribute, and handoff/bail/unmount all lift it —
    // belt and suspenders.
    const setInert = (on: boolean) =>
      document.querySelector("[data-page-root]")?.toggleAttribute("inert", on);
    const stop = () => {
      tl?.kill();
      timeout?.kill();
      tl = timeout = null;
    };

    clearSheet(els);

    controller = {
      cover(onCovered) {
        stop();
        setInert(true);
        tl = coverTimeline(els, () => {
          onCovered();
          // Released by the pathname handoff. 2.5s covers real-world slow RSC
          // fetches (prod prefetch makes most pushes instant); a push that
          // outlives it is treated as hung. If it STILL commits later, the
          // enter plays as a hard cut — acceptable for so rare a straggler.
          timeout = gsap.delayedCall(2.5, () => controller?.bail());
        });
      },
      handoff() {
        // A LIVE cover here means the user already covered for ANOTHER nav and
        // this commit is a stale straggler: let the new cover finish (it will
        // push and hand off on its own) instead of killing it and silently
        // dropping that navigation.
        if (tl && tl.isActive()) return;
        stop();
        navigating = false;
        setInert(false);
        clearSheet(els);
      },
      bail() {
        stop();
        navigating = false;
        setInert(false);
        dropFlip(); // the title hand-off lost its beat with the navigation
        tl = retractTimeline(els).eventCallback("onComplete", () => clearSheet(els));
      },
    };

    return () => {
      stop();
      clearSheet(els);
      setInert(false);
      controller = null;
      navigating = false;
    };
  }, []);

  // Route committed (push landed, or back/forward mid-cover): hand the cover to
  // the new route's enter. Passive effect = runs AFTER the enter's pre-paint
  // snap-to-covered, so there is no uncovered frame in between.
  React.useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    controller?.handoff();
  }, [pathname]);

  return (
    <div id="exit-cover" aria-hidden className={SHEET_HOST_CLASS}>
      {/* the sheet is printed down over the page being left… */}
      <div ref={sheetRef} className={SHEET_CLASS} style={SHEET_REST_STYLE} />
      {/* …with a 1px ink rule travelling at its leading edge */}
      <div ref={ruleRef} className={RULE_CLASS} style={RULE_REST_STYLE} />
    </div>
  );
}

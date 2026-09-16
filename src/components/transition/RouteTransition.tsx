"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  clearSheet,
  liftTimeline,
  playFlip,
  prefersReduced,
  RULE_CLASS,
  SHEET_CLASS,
  SHEET_HOST_CLASS,
  SHEET_REST_STYLE,
  RULE_REST_STYLE,
  setCovered,
  type SheetEls,
} from "@/lib/sheet";

// Module-level: the Preloader owns the very first intro, so the route transition
// only plays on genuine client-side navigations (not the initial hard load).
let firstMount = true;

/**
 * RouteTransition — the per-route ENTER (Next App Router `template.tsx` remounts
 * this on every navigation). THE JOB ORDER artwork: the new route mounts fully
 * covered by the same flat `paper` sheet the exit printed down (src/lib/sheet.ts),
 * then the sheet lifts off the top in 420ms `sheet` while a 1px ink rule prints
 * downward over the page being revealed. The page fades in beneath it and its
 * own sections RULE-IN from their ScrollTriggers.
 *
 * Kept from the Continuous Curtain (mechanics, not costume):
 *   • pre-paint snap to covered in the layout effect → no uncovered frame at the
 *     hand-off from CoverOverlay;
 *   • the first hard load is skipped (the Preloader owns it);
 *   • cross-page HASH navs snap onto the target section under the cover, and
 *     re-snap on fonts.ready and once more at the end (late fonts grow the
 *     layout above the target — measured ~1300px drift in prod);
 *   • ScrollTrigger.refresh(true) after the lift (a bare refresh() is FORCED and
 *     would reflow mid-Lenis-glide);
 *   • `data-page-root` so CoverOverlay can mark the covered page inert.
 *
 * KEYED ON THE PATHNAME, not on the mount. The ROOT template only remounts when
 * the TOP-LEVEL segment changes (Next gives it `key="/work"` for both `/work`
 * and `/work/<slug>`), so a mount-only enter never played on a sub-route hop —
 * /work → /work/spherenode was a hard cut from the exit cover. Running on
 * `usePathname()` covers every navigation; the layout effect still lands
 * pre-paint of the new route, ahead of CoverOverlay's passive hand-off.
 *
 * With a dependency array, useGSAP defers its context cleanup to UNMOUNT
 * (`deferCleanup`), so each run explicitly retires its predecessor's timeline,
 * hash re-snap and late-snap call before starting its own.
 *
 * Reduced motion: the same sheet, a 150ms opacity swap, no travel and no Flip.
 * Enter-only — the click interception lives in TransitionLink.
 */
interface Run {
  tl: gsap.core.Timeline;
  lateSnap: gsap.core.Tween | null;
  alive: { v: boolean };
}

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const ruleRef = React.useRef<HTMLDivElement>(null);
  const runRef = React.useRef<Run | null>(null);

  useGSAP(
    () => {
      // Retire the previous navigation's run (see deferCleanup above).
      const prev = runRef.current;
      if (prev) {
        prev.alive.v = false;
        prev.lateSnap?.kill();
        prev.tl.kill();
        runRef.current = null;
      }
      const el = ref.current;
      const sheet = sheetRef.current;
      const rule = ruleRef.current;
      if (!el || !sheet || !rule) return;
      const els: SheetEls = { sheet, rule };
      if (firstMount) {
        firstMount = false;
        clearSheet(els);
        return;
      }
      const lenis = (window as unknown as {
        __lenis?: { scrollTo: (t: number | HTMLElement, o?: object) => void };
      }).__lenis;
      const snapToHash = () => {
        const target = window.location.hash
          ? document.querySelector<HTMLElement>(window.location.hash)
          : null;
        lenis?.scrollTo(target ?? 0, { immediate: true });
      };
      snapToHash();
      const alive = { v: true };
      if (window.location.hash) {
        document.fonts?.ready?.then(() => alive.v && snapToHash());
      }
      const lateSnap = window.location.hash ? gsap.delayedCall(1.4, snapToHash) : null;

      // Start fully covered with the page hidden beneath. useGSAP runs in a
      // layout effect (pre-paint), so no flash.
      setCovered(els);
      gsap.set(el, { autoAlpha: 0 });

      const reduced = prefersReduced();
      const tl = gsap.timeline({
        onComplete: () => {
          clearSheet(els);
          gsap.set(el, { clearProps: "opacity,visibility" });
          if (window.location.hash) snapToHash();
          ScrollTrigger.refresh(true);
        },
      });
      // The page appears beneath the lifting sheet…
      tl.to(el, { autoAlpha: 1, duration: reduced ? 0.15 : 0.18, ease: "none" }, 0)
        // …the sheet lifts and the rule prints down over it…
        .add(liftTimeline(els), 0)
        // …and one tick in, the row title that was clicked lands in the entering
        // heading (§E.8). Deferred by a beat so a heading that mounts a frame
        // late is still caught; a silent no-op when nothing carries the id.
        .call(() => playFlip(), [], 0.02);

      runRef.current = { tl, lateSnap, alive };

      // Unmount only (deferCleanup): a run superseded by a NEW pathname is
      // retired at the top of the next run instead.
      return () => {
        alive.v = false; // a late fonts.ready must not scroll a NEWER route
        lateSnap?.kill();
        tl.kill();
        runRef.current = null;
      };
    },
    { dependencies: [pathname], scope: ref },
  );

  return (
    <>
      {/* The entering cover: same two elements as CoverOverlay, same `--z-cover`.
          DOM order puts this above the exit cover during the hand-off frame —
          harmless, they are the identical flat paper sheet. */}
      <div aria-hidden className={SHEET_HOST_CLASS}>
        <div ref={sheetRef} className={SHEET_CLASS} style={SHEET_REST_STYLE} />
        <div ref={ruleRef} className={RULE_CLASS} style={RULE_REST_STYLE} />
      </div>
      {/* data-page-root: CoverOverlay toggles `inert` here while the exit cover
          is up, so the covered (invisible) page can't be operated by
          keyboard/AT during the pending window. */}
      <div ref={ref} data-page-root>
        {children}
      </div>
    </>
  );
}

"use client";

/**
 * THE JOB ORDER — the route cover artwork (REDESIGN-SPEC §G, §C.6–C.7).
 *
 * One shape for both halves of a navigation: a FLAT sheet of `paper` and a 1px
 * ink rule that prints downward across the viewport. No wave and no gradient —
 * the old `curtainPath` language is gone; this is a form being laid on the
 * bench and a rule being drawn on it.
 *
 *   EXIT  (CoverOverlay, 420ms `sheet`) — the sheet descends from above while the
 *         rule travels top → bottom at its leading edge: the sheet is printed
 *         onto the page it covers.
 *   ENTER (RouteTransition, 420ms `sheet`) — the new route mounts fully covered;
 *         the sheet lifts off the top while a fresh rule prints downward over the
 *         page being revealed, fading as it lands. The page then RULE-INs.
 *
 * Reduced motion (§C.7): no travel at all — a 150ms opacity swap of the same
 * sheet, and the rule never shows.
 *
 * Both halves render the same two elements (SHEET_CLASS / RULE_CLASS) so the
 * hand-off frame between them is pixel-identical; both sit on `--z-cover` (the
 * single z scale of §C.5). DOM order puts the enter sheet above the exit cover —
 * harmless, they are the same flat paper.
 */

import type * as React from "react";
import { gsap, Flip } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";

/** Full-viewport paper sheet (the thing that travels). */
export const SHEET_CLASS = "absolute inset-0 bg-paper";
/** The 1px ink rule that prints downward. */
export const RULE_CLASS = "absolute left-0 top-0 h-px w-full bg-ink";
/** The fixed, non-interactive host both halves render. */
export const SHEET_HOST_CLASS =
  "pointer-events-none fixed inset-0 z-[var(--z-cover)] overflow-hidden";

/**
 * SSR start state: parked above the viewport / invisible, so a slow or failed
 * hydration can never leave a blank paper sheet over the page. Both halves set
 * their real state from a layout effect before the first paint.
 */
export const SHEET_REST_STYLE: React.CSSProperties = {
  transform: "translate3d(0,-100%,0)",
};

/**
 * Neutralise the SSR transform above before touching `yPercent`.
 *
 * GSAP reads an element's CURRENT transform from the computed style, where a
 * percentage translate has already been resolved to pixels — so the inline
 * `translate3d(0,-100%,0)` is parsed as `y: -<viewport>px` and then every
 * `yPercent` we set is added ON TOP of it. The sheet ends up one full viewport
 * too high and never covers anything (only the rule travels). Writing `y: 0`
 * alongside every `yPercent` keeps the px channel at zero for good; both halves
 * run clearSheet/setCovered before any tween, so one pass is enough — the
 * fromTo vars carry it too, in case a tween is ever the first thing to run.
 */
const Y0 = { y: 0 } as const;
export const RULE_REST_STYLE: React.CSSProperties = { opacity: 0 };

export interface SheetEls {
  sheet: HTMLElement;
  rule: HTMLElement;
}

/** How far the rule travels: the full viewport height, measured at tween time. */
const travel = () => window.innerHeight + 1;

/** True when the visitor asked for reduced motion (checked per call, never cached). */
export function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Nothing on screen: the page beneath is fully visible and click-through. */
export function clearSheet({ sheet, rule }: SheetEls) {
  gsap.set(sheet, { ...Y0, yPercent: -100, autoAlpha: 1 });
  gsap.set(rule, { y: 0, autoAlpha: 0 });
  sheet.style.pointerEvents = "none";
}

/** Fully covered, applied synchronously (pre-paint) — no uncovered frame. */
export function setCovered({ sheet, rule }: SheetEls) {
  gsap.set(sheet, { ...Y0, yPercent: 0, autoAlpha: 1 });
  gsap.set(rule, { y: 0, autoAlpha: 0 });
}

/**
 * EXIT — print the sheet over the current page, then run `onCovered` (which
 * navigates). The covered area swallows pointer input for the whole pending
 * window: without it the invisible old page stayed click-operable.
 */
export function coverTimeline(
  els: SheetEls,
  onCovered: () => void,
): gsap.core.Timeline {
  const { sheet, rule } = els;
  sheet.style.pointerEvents = "auto";
  if (prefersReduced()) {
    // §C.7: the cover is an opacity swap — the sheet is already in place and
    // simply appears. No rule, no travel.
    gsap.set(sheet, { ...Y0, yPercent: 0, autoAlpha: 0 });
    gsap.set(rule, { autoAlpha: 0 });
    return gsap.timeline({ onComplete: onCovered }).to(sheet, {
      autoAlpha: 1,
      duration: DUR.swap,
      ease: "none",
      overwrite: "auto",
    });
  }
  gsap.set(rule, { y: 0, autoAlpha: 1 });
  return gsap
    .timeline({ onComplete: onCovered })
    .fromTo(
      sheet,
      { ...Y0, yPercent: -100, autoAlpha: 1 },
      { yPercent: 0, duration: DUR.sheet, ease: EASE.sheet, overwrite: "auto" },
      0,
    )
    .fromTo(
      rule,
      { y: 0, autoAlpha: 1 },
      { y: travel, duration: DUR.sheet, ease: EASE.sheet, overwrite: "auto" },
      0,
    );
}

/** EXIT, reversed — the navigation failed, the same page is still beneath. */
export function retractTimeline(els: SheetEls): gsap.core.Timeline {
  const { sheet, rule } = els;
  sheet.style.pointerEvents = "none";
  if (prefersReduced()) {
    return gsap
      .timeline()
      .to(sheet, { autoAlpha: 0, duration: DUR.swap, ease: "none", overwrite: "auto" });
  }
  return gsap
    .timeline()
    .to(sheet, { yPercent: -100, duration: DUR.sheet, ease: EASE.sheet, overwrite: "auto" }, 0)
    .to(rule, { autoAlpha: 0, duration: DUR.swap, ease: "none", overwrite: "auto" }, 0);
}

/**
 * ENTER — lift the sheet off the new page while a rule prints down over it.
 * The caller starts from `setCovered` (applied pre-paint in a layout effect).
 */
export function liftTimeline(els: SheetEls): gsap.core.Timeline {
  const { sheet, rule } = els;
  if (prefersReduced()) {
    gsap.set(rule, { autoAlpha: 0 });
    return gsap
      .timeline()
      .fromTo(
        sheet,
        { ...Y0, yPercent: 0, autoAlpha: 1 },
        { autoAlpha: 0, duration: DUR.swap, ease: "none", overwrite: "auto" },
      );
  }
  return gsap
    .timeline()
    .fromTo(
      sheet,
      { ...Y0, yPercent: 0, autoAlpha: 1 },
      { yPercent: -100, duration: DUR.sheet, ease: EASE.sheet, overwrite: "auto" },
      0,
    )
    .fromTo(
      rule,
      { y: 0, autoAlpha: 1 },
      { y: travel, duration: DUR.sheet, ease: EASE.sheet, overwrite: "auto" },
      0,
    )
    .to(rule, { autoAlpha: 0, duration: DUR.hover, ease: "none" }, DUR.sheet - DUR.hover);
}

/* ─────────────────────────── Flip hand-off (§E.8) ───────────────────────────
 * Clicking a Work performed row carries ITS title into the sub-form heading
 * while the sheet covers. Contract (WP-4 honours it, nothing here creates it):
 *
 *   • the row title element carries  data-flip-id="work-title-<slug>"
 *   • the sub-form <h1> on /work/<slug> carries the SAME attribute
 *
 * TransitionLink stashes the row title's Flip state on click; the entering
 * route looks the id up one tick into the lift (so a heading that mounts a
 * frame late is still caught) and plays Flip.from onto it. Every step degrades
 * to nothing: no attribute on either side, a stale stash, or a Flip failure
 * leaves the plain sheet transition untouched.
 */

/** How long a stash stays valid — a nav that takes longer has lost the beat. */
const STASH_TTL_MS = 3000;

let stash: { id: string; state: Flip.FlipState; at: number } | null = null;

/** Capture the state of the `[data-flip-id]` title inside a clicked row, if any. */
export function stashFlip(from: HTMLElement | null): void {
  stash = null;
  if (!from || prefersReduced()) return;
  const el = from.matches("[data-flip-id]")
    ? from
    : from.querySelector<HTMLElement>("[data-flip-id]");
  const id = el?.getAttribute("data-flip-id");
  if (!el || !id) return;
  try {
    stash = { id, state: Flip.getState(el), at: Date.now() };
  } catch {
    stash = null; // never let a capture break a navigation
  }
}

/** Drop a stash (navigation bailed, or the beat was already played). */
export function dropFlip(): void {
  stash = null;
}

/**
 * Play the stashed title onto the entering page's matching heading. Returns
 * true when a hand-off actually ran. Silent no-op when nothing matches.
 */
export function playFlip(): boolean {
  const s = stash;
  stash = null;
  if (!s || prefersReduced()) return false;
  if (Date.now() - s.at > STASH_TTL_MS) return false;
  const target = document.querySelector<HTMLElement>(
    `[data-flip-id="${CSS.escape(s.id)}"]`,
  );
  if (!target) return false;
  try {
    Flip.from(s.state, {
      targets: target,
      duration: DUR.sheet,
      ease: EASE.sheet,
      absolute: true,
      scale: true,
    });
    return true;
  } catch {
    return false; // a detached/stale state must never strand the entering page
  }
}

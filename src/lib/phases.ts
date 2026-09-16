/**
 * phases.ts — the six phases of the job order, in sheet order (REDESIGN-SPEC
 * §E.3 / §D). Plain TS (no "use client") so server components (not-found,
 * pages) and client chrome (PhaseBand, usePhaseStamps) share ONE source of
 * truth for ids, anchors and the band offset. Copy (names, role tags) lives in
 * src/content/dict.ts under `phases.<id>`; this file only knows the ids.
 */
import type { PhaseId } from "@/content/dict";

/** Sheet order: intake → diagnosis → estimate → work → test → release. */
export const PHASES: readonly PhaseId[] = [
  "intake",
  "diagnosis",
  "estimate",
  "work",
  "test",
  "release",
] as const;

export const PHASE_TOTAL = PHASES.length;

/** DOM id of a phase region: `<section id="phase-work">`. */
export const phaseAnchor = (id: PhaseId): string => `phase-${id}`;

/** Hash / selector of a phase region: `#phase-work`. */
export const phaseHash = (id: PhaseId): string => `#${phaseAnchor(id)}`;

/** Band height compensation for `lenis.scrollTo(…, { offset })` (§E.3). */
export const BAND_OFFSET = -56;

/** ScrollTrigger start for the region that stamps its phase (§E.3). */
export const STAMP_START = "top 60%";

export const phaseIndex = (id: PhaseId): number => PHASES.indexOf(id);

/**
 * Routes whose content IS the sheet: the band is driven by the `#phase-*`
 * regions in the page. Only the home sheet qualifies; every sub-route is
 * pre-stamped by `routePhase` instead.
 */
export const isSheetRoute = (pathname: string): boolean => pathname === "/";

/**
 * The phase a sub-route is pre-stamped with (§E.3: WORK on /work*, INTAKE on
 * /about). `null` on the sheet itself (scroll-driven) and on unknown routes
 * (404: nothing stamped, the order is VOID).
 */
export function routePhase(pathname: string): PhaseId | null {
  if (pathname === "/work" || pathname.startsWith("/work/")) return "work";
  if (pathname === "/about") return "intake";
  return null;
}

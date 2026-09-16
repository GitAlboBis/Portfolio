"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useDict, type PhaseId } from "@/content/dict";
import { Stamp } from "@/components/sheet/Stamp";
import { usePhaseStamps } from "@/components/sheet/usePhaseStamps";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { BAND_OFFSET, PHASES, PHASE_TOTAL, isSheetRoute, phaseAnchor, phaseHash, routePhase } from "@/lib/phases";
import { cn } from "@/lib/cn";

/*
  PhaseBand — the nav AND the signature of the site (REDESIGN-SPEC §E.3).

  A full-width safety-yellow region, `position: sticky; top: 0`, height
  `--band-h` (56 / 48px), z `--z-band`. Six equal cells (Intake · Diagnosis ·
  Estimate · Work · Test · Release), a counter cell `n / 6` and the fixed
  Email cell (mailto) on the right — on every route. When a `#phase-<id>`
  region enters (`top 60%`, once) the filled stamp lands on its cell (verb
  STAMP) with the role tag under it; stamps accumulate like a real job card.

  Cells are links to `/#phase-<id>`: on the sheet itself the click is
  intercepted and Lenis scrolls to the region with the band offset; on a
  sub-route the link navigates home to the region (the route enter snaps to
  the hash). Sub-routes carry a ruled "Job order ↖" cell and their phase
  pre-stamped (WORK on /work*, INTAKE on /about).

  Mobile (< 768): the six cells are a horizontal scroll-snap row; the current
  cell is scrolled into view when it gets stamped; counter and Email stay
  fixed on the right.

  Keyboard: every cell is a real link/anchor; `focus-visible` on the yellow is
  the ink ring (globals.css `.bg-safety :focus-visible`); `aria-current="step"`
  marks the current phase. Reduced motion: six stamps at load, counter from a
  native scroll listener (usePhaseStamps).

  MOUNT CONTRACT: mounted once in layout.tsx. On `/` the sheet's job-order
  header (WP-4) must sit ABOVE the band (§A FIRST VIEWPORT rows A–C), so the
  layout instance renders nothing there and `page.tsx` mounts <PhaseBand/>
  itself right after the header. Every other route gets the layout instance.
*/
export interface PhaseBandProps {
  /** True for the instance mounted in layout.tsx (self-hides on `/`). */
  layoutMount?: boolean;
}

type LenisLike = { scrollTo: (t: string | number | HTMLElement, o?: { offset?: number }) => void };

export function PhaseBand({ layoutMount = false }: PhaseBandProps) {
  const pathname = usePathname() ?? "/";
  const t = useDict();
  const { stamped, current, count } = usePhaseStamps(pathname);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const isSheet = isSheetRoute(pathname);
  const showBack = !isSheet;

  // Mobile: bring the freshly stamped cell into view (horizontal only — never
  // `scrollIntoView`, which would also move the document vertically).
  React.useEffect(() => {
    const row = rowRef.current;
    if (!row || !current) return;
    if (row.scrollWidth <= row.clientWidth) return;
    const cell = row.querySelector<HTMLElement>(`[data-phase="${current}"]`);
    if (!cell) return;
    const left = cell.offsetLeft - (row.clientWidth - cell.offsetWidth) / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
  }, [current]);

  const onCellClick = (e: React.MouseEvent<HTMLAnchorElement>, id: PhaseId) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = document.getElementById(phaseAnchor(id));
    if (!target) return; // not on this page → let the link navigate home
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (lenis) lenis.scrollTo(phaseHash(id), { offset: BAND_OFFSET });
    else {
      const y = target.getBoundingClientRect().top + window.scrollY + BAND_OFFSET;
      window.scrollTo({ top: y, behavior: "auto" });
    }
    // Move focus with the scroll so the keyboard reading position follows.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  if (layoutMount && pathname === "/") return null;

  const cellBase =
    "relative flex h-full min-w-0 items-center justify-center border-l border-ink px-2 text-center " +
    "select-none no-underline text-ink transition-[background-color] duration-[var(--dur-hover)] ease-linear " +
    "hover:bg-[rgb(20_20_20/0.06)] focus-visible:z-[1]";

  return (
    <nav
      aria-label={t.band.ariaLabel}
      data-phase-band
      className={cn(
        "bg-safety on-safety sticky top-0 z-[var(--z-band)] w-full border-y border-ink",
        "h-[var(--band-h)] text-ink",
      )}
    >
      <div className="flex h-full w-full items-stretch">
        {showBack ? (
          <TransitionLink
            href="/"
            className={cn(cellBase, "border-l-0 shrink-0 px-3 md:px-5 f-caption whitespace-nowrap")}
          >
            {t.band.back}
          </TransitionLink>
        ) : null}

        {/* the six cells — desktop: equal columns; mobile: scroll-snap row */}
        <div
          ref={rowRef}
          className={cn(
            "flex h-full min-w-0 flex-1 items-stretch overflow-x-auto overscroll-x-contain",
            "snap-x snap-mandatory md:overflow-visible md:snap-none",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            !showBack && "[&>a:first-child]:border-l-0",
          )}
        >
          {PHASES.map((id) => {
            const p = t.phases[id];
            const isStamped = stamped[id];
            const isCurrent = current === id;
            return (
              <TransitionLink
                key={id}
                href={`/${phaseHash(id)}`}
                data-phase={id}
                aria-current={isCurrent ? "step" : undefined}
                onClick={(e) => onCellClick(e, id)}
                className={cn(
                  cellBase,
                  "shrink-0 basis-[38vw] snap-start md:shrink md:basis-0 md:flex-1",
                )}
              >
                {/* printed name — fades under the stamp (150ms swap) */}
                <span
                  className={cn(
                    "f-caption transition-opacity duration-[var(--dur-swap)] ease-linear",
                    isStamped && "opacity-0",
                  )}
                  aria-hidden={isStamped || undefined}
                >
                  {p.name}
                </span>
                {/* accessible name stays the phase name even when stamped */}
                {isStamped ? <span className="sr-only">{p.name}</span> : null}
                <Stamp
                  label={p.name}
                  roleTag={p.roleTag}
                  variant="band"
                  active={isStamped}
                  className="absolute inset-0 justify-center"
                />
              </TransitionLink>
            );
          })}
        </div>

        {/* counter — always total and position (§B: nothing hidden) */}
        <div
          className={cn(
            "flex h-full shrink-0 items-center justify-center border-l border-ink px-3 md:px-5",
            "f-caption whitespace-nowrap tabular-nums",
          )}
          aria-label={`${count} / ${PHASE_TOTAL}`}
        >
          {t.band.counter.replace("{n}", String(count))}
        </div>

        {/* Email — the primary action, fixed right on every route (§B) */}
        <a
          href={`mailto:${t.release.email}`}
          className={cn(
            cellBase,
            "shrink-0 px-3 md:px-5 f-caption whitespace-nowrap font-bold",
          )}
        >
          {t.band.email}
        </a>
      </div>
    </nav>
  );
}

/** Convenience for pages: the phase a route is pre-stamped with (re-export). */
export { routePhase };

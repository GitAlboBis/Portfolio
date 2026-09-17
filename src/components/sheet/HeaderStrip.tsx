"use client";

import * as React from "react";
import { useDict } from "@/content/dict";
import { LocaleToggle } from "@/components/sheet/LocaleToggle";
import { RuleIn } from "@/components/sheet/RuleIn";
import { usePathname } from "next/navigation";
import { isSheetRoute, phaseHash } from "@/lib/phases";
import { cn } from "@/lib/cn";

/*
  HeaderStrip — the provenance of the sheet (REDESIGN-SPEC §E.1), on every
  route. A 48px strip (40px < 768) of four contiguous ruled cells, `.f-strip`:
  employer · date · "Status · OPEN" (the state word in a 1px box) · EN | IT.
  RULE-IN once at load (the top rule draws itself, then the type appears).
  Mobile: one 12px line — the date cell hides below 640px so employer + status
  + toggle fit 390px without wrapping (the date returns on the job-order
  header, WP-4). No fixed/sticky: the band below is the thing that sticks.
*/
export function HeaderStrip() {
  const t = useDict();
  // "Status · OPEN" → label "Status ·", word "OPEN" boxed (IT: "Stato · APERTO").
  const sep = t.strip.status.lastIndexOf("·");
  const statusLabel = sep >= 0 ? t.strip.status.slice(0, sep + 1).trim() : t.strip.status;
  const statusWord = sep >= 0 ? t.strip.status.slice(sep + 1).trim() : "";

  const cell = "flex h-full min-w-0 items-center border-l border-ink px-3 md:px-4 whitespace-nowrap";

  return (
    <RuleIn role="banner" className="h-10 border-b border-ink md:h-12">
      {/* The skip link is the first thing in the tab order and it lives INSIDE
          the banner: as a bare child of <body> it was page content outside every
          landmark (axe `region`, moderate, on every route). It is sr-only until
          focused, then `position: fixed` lifts it out of this 40px strip. */}
      <SkipLink />
      <div className="flex h-full w-full items-stretch f-strip text-graphite">
        <div className={cn(cell, "border-l-0 flex-1 overflow-hidden text-ellipsis")}>
          <span className="truncate text-ink">{t.strip.employer}</span>
        </div>
        <div className={cn(cell, "hidden sm:flex tabular-nums")}>{t.strip.date}</div>
        <div className={cn(cell, "gap-2")}>
          <span>{statusLabel}</span>
          {statusWord ? (
            <span className="inline-block border border-ink px-[0.45em] py-[0.1em] font-semibold uppercase leading-none text-ink">
              {statusWord}
            </span>
          ) : null}
        </div>
        <LocaleToggle />
      </div>
    </RuleIn>
  );
}

/**
 * SkipLink — the first stop in the tab order (REDESIGN-SPEC §G).
 * Visually hidden until focused, then a ruled ink cell at the top-left on
 * `--z-skip` (above the band and the cover).
 *
 * The target is ROUTE-AWARE. `#phase-work` only exists on the sheet itself, so
 * on /about, /styleguide and the 404 the link pointed at nothing (axe
 * `skip-link`, moderate: "No skip link target") and pressing Enter did nothing.
 * Off the sheet it goes to `#main` — the landmark each of those routes owns —
 * with the matching label. Every target carries `tabIndex={-1}` so focus really
 * lands there instead of staying on the link.
 */
export function SkipLink() {
  const t = useDict();
  const pathname = usePathname();
  const onSheet = isSheetRoute(pathname ?? "/");
  return (
    <a
      href={onSheet ? phaseHash("work") : "#main"}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-[var(--z-skip)]",
        "focus:flex focus:h-12 focus:items-center focus:border focus:border-ink focus:bg-ink focus:px-5",
        "focus:text-[0.8125rem] focus:font-semibold focus:uppercase focus:tracking-[0.06em] focus:text-paper",
      )}
    >
      {onSheet ? t.a11y.skip : t.a11y.skipMain}
    </a>
  );
}

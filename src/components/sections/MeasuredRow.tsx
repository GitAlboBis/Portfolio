"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { useUI } from "@/store/ui";
import type { WorkMetric } from "@/content/works";
import { cn } from "@/lib/cn";

/**
 * MeasuredRow — ONE row of the Measured ledger (REDESIGN-SPEC §E.9, §B raise
 * "delta as a first-class datum"): `{ label, before, after, unit, source }`
 * from `works.ts`, printed.
 *
 * THE NUMBERS NEVER ANIMATE (§C.7 "mai animati"): no count-up, no reel, no
 * spinning counter — the value is stamped and is final at the first paint. The
 * only motion here is the arrow, an SVG path 1.5px in `stamp` that DRAWS
 * itself (stroke-dashoffset) 240ms after the row's rule — the single extra
 * verb this section is allowed.
 *
 * THE DOUBLE BAR (§B raise, darkroom) is static geometry, not a chart: two
 * ruled bars whose lengths are proportional to the two numerals, so the delta
 * can be counted by eye without animation. Both bars are ink — direction is
 * said by the arrow, never by colour (§B raise, terminal desk). A figure that
 * is not a numeric pair ("sub-second", "100%", "0", "21 / 49") gets NO bar: a
 * single value has nothing to be proportional to, and a faked ratio would be a
 * lie.
 */
export interface MeasuredRowProps {
  metric: WorkMetric;
  /** Cell classes shared with the table head (kept in the parent). */
  cellClassName: string;
  /** Mobile label classes (the table becomes label/value pairs). */
  labelClassName: string;
  /** Column labels, for the mobile pairs. */
  cols: { item: string; before: string; after: string; source: string };
  /** Screen-reader name of the before→after cell on mobile (the arrow says it visually). */
  pairLabel: string;
  /** The provenance this row's group already prints; "" when the group has none. */
  groupSource?: string;
}

/** Bare numerals only: "4.75" → 4.75, "sub-second" / "21 / 49" → null. */
function numeral(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(",", ""));
  return Number.isFinite(n) ? n : null;
}

export function MeasuredRow({
  metric,
  cellClassName,
  labelClassName,
  cols,
  pairLabel,
  groupSource = "",
}: MeasuredRowProps) {
  const locale = useUI((s) => s.locale);
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const arrowRef = React.useRef<SVGPathElement>(null);

  const unit = metric.unit ? metric.unit[locale] : "";
  const before = numeral(metric.before);
  const after = numeral(metric.after);
  const isPair = before !== null && after !== null;
  const max = isPair ? Math.max(before, after, 0.0001) : 0;

  useGSAP(
    () => {
      const path = arrowRef.current;
      if (!path) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      const tween = gsap.to(path, {
        strokeDashoffset: 0,
        duration: DUR.rule,
        ease: EASE.rule,
        delay: 0.24, // 240ms after the row's rule (§E.9)
        scrollTrigger: { trigger: rowRef.current, start: "top 85%", once: true },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(path, { clearProps: "strokeDasharray,strokeDashoffset" });
      };
    },
    { scope: rowRef, dependencies: [isPair, locale] },
  );

  return (
    <tr ref={rowRef} role="row" className="block border-t border-ink md:table-row md:border-0">
      <th scope="row" role="rowheader" className={cn(cellClassName, "text-left font-normal")}>
        <span className="f-cell block max-w-[44ch] text-ink">{metric.label[locale]}</span>
        {isPair ? (
          // static geometry: before over after, both ink, lengths proportional
          <span aria-hidden className="mt-2 block w-[160px] max-w-full">
            <span
              className="block h-[6px] bg-ink"
              style={{ width: `${Math.max((before / max) * 100, 1.5)}%` }}
            />
            <span
              className="mt-[4px] block h-[6px] bg-ink"
              style={{ width: `${Math.max((after / max) * 100, 1.5)}%` }}
            />
          </span>
        ) : null}
      </th>

      {/* Before has its own column only on the sheet; at 390 the pair is printed
          on ONE line in the cell below (§E.9 "Before → After su una riga"). */}
      <td role="cell" className={cn(cellClassName, "hidden md:table-cell md:text-right")}>
        <span className="f-cell block whitespace-nowrap tabular-nums text-ink">
          {metric.before ? `${metric.before}${unit}` : ""}
        </span>
      </td>

      <td role="cell" className={cn(cellClassName, "md:text-right")}>
        {/* On the sheet the column head names this cell. At 390px the pair is
            printed on one line WITH its drawn arrow, so a visible "BEFORE →
            AFTER" caption over every one of 32 rows was repetition, not
            information (finish review F5) — the name stays, for the screen
            reader that cannot see the arrow. */}
        {isPair ? (
          <span className="sr-only md:hidden">{pairLabel}</span>
        ) : (
          <span className={labelClassName}>{cols.after}</span>
        )}
        <span className="f-cell flex items-baseline gap-2 whitespace-nowrap tabular-nums text-ink md:justify-end">
          {isPair ? (
            <span className="md:hidden">{`${metric.before}${unit}`}</span>
          ) : null}
          {isPair ? (
            <svg
              aria-hidden
              width="22"
              height="10"
              viewBox="0 0 22 10"
              fill="none"
              className="shrink-0 self-center"
            >
              <path
                ref={arrowRef}
                d="M0.75 5H20.25M15.5 1L20.5 5L15.5 9"
                stroke="var(--color-stamp)"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          ) : null}
          <span>{metric.after ? `${metric.after}${unit}` : metric.value}</span>
        </span>
      </td>

      {/* Provenance: always the right-hand column on the sheet; on mobile only
          when it differs from the one the group header already printed (F5). */}
      <td
        role="cell"
        className={cn(
          cellClassName,
          "md:text-right",
          metric.source[locale] === groupSource && "hidden md:table-cell",
        )}
      >
        <span className={labelClassName}>{cols.source}</span>
        <span className="f-meta block text-graphite">{metric.source[locale]}</span>
      </td>
    </tr>
  );
}

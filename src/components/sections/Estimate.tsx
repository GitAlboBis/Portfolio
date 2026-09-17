"use client";

import * as React from "react";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { skillGroups, languages } from "@/data/skills";
import { RuleIn } from "@/components/sheet/RuleIn";
import { useRowStagger } from "@/components/sections/useRowStagger";
import { phaseAnchor } from "@/lib/phases";
import { cn } from "@/lib/cn";

/**
 * Estimate — "Parts catalogue" (REDESIGN-SPEC §E.7, `#phase-estimate`): the
 * stack as a parts list — Part group · Qty · Items. `Qty` is counted from the
 * group's own items (never typed), the items are the CV's own words, and the
 * Languages line is the last row of the same catalogue.
 *
 * No prices (the CV has none), **no icons and no marquee** (§E.7: the icon
 * cloud and the scrolling logo band are refused). Alternate rows are filled
 * `paper-field`, the way a printed catalogue is banded.
 *
 * Motion: RULE-IN — the head rule draws, then the rows stagger 40ms.
 */
const CELL = "block border-t border-rule-soft px-0 py-3 align-top md:table-cell md:px-4";
const HEAD_CELL = "f-caption whitespace-nowrap px-0 py-2 text-left align-bottom text-graphite md:px-4";
const MOBILE_LABEL = "f-caption mb-1 block text-graphite md:hidden";

export function Estimate() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const rootRef = React.useRef<HTMLDivElement>(null);
  useRowStagger(rootRef, [locale]);

  const rows = [
    ...skillGroups.map((g) => ({ id: g.id, label: g.label[locale], items: g.items })),
    {
      id: "languages",
      label: languages.label[locale],
      items: languages.items.map((i) => i[locale]),
    },
  ];

  return (
    <section
      id={phaseAnchor("estimate")}
      aria-labelledby="estimate-caption"
      className="sheet scroll-mt-[var(--band-h)] pt-[var(--section-gap)]"
    >
      <h2 id="estimate-caption" className="f-caption mb-2 text-graphite">
        {t.estimate.caption}
      </h2>

      <RuleIn>
        <div ref={rootRef}>
          <table role="table" className="block w-full border-collapse md:table">
            <thead role="rowgroup" className="hidden md:table-header-group">
              <tr className="border-b border-ink">
                <th scope="col" className={cn(HEAD_CELL, "md:w-[22%]")}>
                  {t.estimate.cols.group}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[8%] md:text-right")}>
                  {t.estimate.cols.qty}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[70%]")}>
                  {t.estimate.cols.items}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="block md:table-row-group">
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  role="row"
                  className={cn(
                    "block border-t border-ink md:table-row md:border-0",
                    i % 2 === 1 && "md:bg-paper-field",
                  )}
                >
                  <th scope="row" role="rowheader" className={cn(CELL, "text-left")}>
                    <span className="f-cell block font-medium text-ink">{r.label}</span>
                  </th>
                  <td role="cell" className={cn(CELL, "md:text-right")}>
                    <span className={MOBILE_LABEL}>{t.estimate.cols.qty}</span>
                    <span className="f-cell block tabular-nums text-ink">{r.items.length}</span>
                  </td>
                  <td role="cell" className={CELL}>
                    <span className={MOBILE_LABEL}>{t.estimate.cols.items}</span>
                    {/* `max-w-none` let this one line run ~130 characters at 1440 — the only
                        place on the sheet that doubles the measure floor (finish review
                        F11). It is a dot-separated scan list, not prose, so it takes the
                        sheet measure rather than `.f-cell`'s 44ch. */}
                    <span className="f-cell block max-w-[var(--measure)] text-ink">
                      {r.items.join(" · ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div aria-hidden className="border-t border-ink" />
        </div>
      </RuleIn>
    </section>
  );
}

"use client";

import * as React from "react";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";
import { MeasuredRow } from "@/components/sections/MeasuredRow";
import { RuleIn } from "@/components/sheet/RuleIn";
import { useRowStagger } from "@/components/sections/useRowStagger";
import { phaseAnchor } from "@/lib/phases";
import { cn } from "@/lib/cn";

/**
 * Measured — the ledger of the Test phase (REDESIGN-SPEC §E.9). It carries
 * `#phase-test`: the bench runs in the first viewport, but TEST is stamped
 * here, when the measurements enter (§D note).
 *
 * Every measured fact of every job in `works.ts` is printed — nothing is
 * selected, ranked or rounded — grouped under the job it belongs to, each row
 * a `MeasuredRow` with its provenance cell. A job the CV gives no figure for
 * (the Voice AI Agent) has no row here rather than an invented one.
 *
 * Motion: RULE-IN and the arrows drawing (in the row). **No count-up**: the
 * Magic UI number ticker and the spinning counter were evaluated and refused
 * (§E.9) — a printed value is final the moment it is on the sheet.
 */
const CELL = "block border-t border-rule-soft px-0 py-3 align-top md:table-cell md:px-4";
const HEAD_CELL = "f-caption whitespace-nowrap px-0 py-2 text-left align-bottom text-graphite md:px-4";
const MOBILE_LABEL = "f-caption mb-1 block text-graphite md:hidden";

export function Measured() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const rootRef = React.useRef<HTMLDivElement>(null);
  useRowStagger(rootRef, [locale]);

  const groups = works
    .map((w) => ({ work: w, metrics: w.study?.metrics ?? [] }))
    .filter((g) => g.metrics.length > 0);

  const cols = {
    item: t.measured.cols.item,
    before: t.measured.cols.before,
    after: t.measured.cols.after,
    source: t.measured.cols.source,
  };

  return (
    <section
      id={phaseAnchor("test")}
      aria-labelledby="measured-caption"
      className="sheet scroll-mt-[var(--band-h)] pt-[var(--section-gap)]"
    >
      <h2 id="measured-caption" className="f-caption mb-2 text-graphite">
        {t.measured.caption}
      </h2>

      <RuleIn>
        <div ref={rootRef}>
          <table role="table" className="block w-full border-collapse md:table">
            <thead role="rowgroup" className="hidden md:table-header-group">
              <tr className="border-b border-ink">
                <th scope="col" className={cn(HEAD_CELL, "md:w-[40%]")}>
                  {cols.item}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[12%] md:text-right")}>
                  {cols.before}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[18%] md:text-right")}>
                  {cols.after}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[30%] md:text-right")}>
                  {cols.source}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="block md:table-row-group">
              {groups.map((g) => (
                <React.Fragment key={g.work.slug}>
                  <tr role="row" className="block md:table-row">
                    <th
                      scope="colgroup"
                      role="columnheader"
                      colSpan={4}
                      className="block border-t border-ink px-0 pb-1 pt-6 text-left md:table-cell md:px-4"
                    >
                      <span className="f-role block font-semibold text-ink">{g.work.title}</span>
                      <span className="f-meta block text-graphite">{g.work.org}</span>
                    </th>
                  </tr>
                  {g.metrics.map((m, i) => (
                    <MeasuredRow
                      key={`${g.work.slug}-${i}`}
                      metric={m}
                      cellClassName={CELL}
                      labelClassName={MOBILE_LABEL}
                      cols={cols}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div aria-hidden className="border-t border-ink" />
        </div>
      </RuleIn>
    </section>
  );
}

"use client";

import * as React from "react";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { findings } from "@/content/findings";
import { RuleIn } from "@/components/sheet/RuleIn";
import { useRowStagger } from "@/components/sections/useRowStagger";
import { phaseAnchor } from "@/lib/phases";
import { cn } from "@/lib/cn";

/**
 * Diagnosis — "Findings" (REDESIGN-SPEC §E.6, `#phase-diagnosis`): the defects
 * found and closed, as a three-column ruled table — Finding · Fix · Source.
 * Every row is transcribed in `findings.ts` from the CV; the provenance cell
 * is printed on each one (§B: no fact without its stitching).
 *
 * Desktop: three columns, the source right-aligned in graphite. Mobile: the
 * table becomes label/value pairs (the roles keep it a table for assistive
 * technology once `display:block` drops the implicit ones).
 *
 * Motion: RULE-IN — the head rule draws, then the rows stagger 40ms.
 */
const CELL = "block border-t border-rule-soft px-0 py-3 align-top md:table-cell md:px-4";
const HEAD_CELL = "f-caption whitespace-nowrap px-0 py-2 text-left align-bottom text-graphite md:px-4";
const MOBILE_LABEL = "f-caption mb-1 block text-graphite md:hidden";

export function Diagnosis() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const rootRef = React.useRef<HTMLDivElement>(null);
  useRowStagger(rootRef, [locale]);

  return (
    <section
      id={phaseAnchor("diagnosis")}
      aria-labelledby="diagnosis-caption"
      className="sheet scroll-mt-[var(--band-h)] pt-[var(--section-gap)]"
    >
      <h2 id="diagnosis-caption" className="f-caption mb-2 text-graphite">
        {t.diagnosis.caption}
      </h2>

      <RuleIn>
        <div ref={rootRef}>
          <table role="table" className="block w-full border-collapse md:table">
            <thead role="rowgroup" className="hidden md:table-header-group">
              <tr className="border-b border-ink">
                <th scope="col" className={cn(HEAD_CELL, "md:w-[42%]")}>
                  {t.diagnosis.cols.finding}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[38%]")}>
                  {t.diagnosis.cols.fix}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "md:w-[20%] md:text-right")}>
                  {t.diagnosis.cols.source}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="block md:table-row-group">
              {findings.map((f, i) => (
                <tr
                  key={`${f.work}-${i}`}
                  role="row"
                  className="row-hover block border-t border-ink md:table-row md:border-0"
                >
                  <th scope="row" role="rowheader" className={cn(CELL, "text-left font-normal")}>
                    <span className={MOBILE_LABEL}>{t.diagnosis.cols.finding}</span>
                    <span className="f-body block text-ink">{f.finding[locale]}</span>
                  </th>
                  <td role="cell" className={CELL}>
                    <span className={MOBILE_LABEL}>{t.diagnosis.cols.fix}</span>
                    <span className="f-body block text-ink">{f.fix[locale]}</span>
                  </td>
                  <td role="cell" className={cn(CELL, "md:text-right")}>
                    <span className={MOBILE_LABEL}>{t.diagnosis.cols.source}</span>
                    <span className="f-meta block whitespace-nowrap text-graphite">
                      {f.source[locale]}
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

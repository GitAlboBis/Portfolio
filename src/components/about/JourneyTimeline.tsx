"use client";

import * as React from "react";
import { RuleIn } from "@/components/sheet/RuleIn";
import { useRowStagger } from "@/components/sections/useRowStagger";
import { useUI } from "@/store/ui";

/**
 * JourneyTimeline — Experience and Education on `/about`, as the ruled
 * two-column tables of the job order (REDESIGN-SPEC §E.13). The editorial
 * timeline with its drawn line is gone: these are rows of a form — period on
 * the left, the engagement on the right — every value transcribed from
 * `src/content/career.ts` (the September 2026 CV).
 *
 * The table carries its own `<caption>` and nothing else: there are no column
 * labels in the copy, so none are invented. Every row's period cell is the row
 * header (`<th scope="row">`) and the figures are tabular.
 *
 * Motion: RULE-IN for the head rule, then the 40ms row stagger — the same two
 * verbs as every other table on the sheet.
 */
export interface JourneyRow {
  /** Stable key (the CV org / degree — never displayed as a key). */
  id: string;
  period: string;
  /** The role (Experience) or the degree (Education). */
  title: string;
  org: string;
  /** Contract type and place. */
  meta: string;
  /** The CV's one-line description, where it has one. */
  note?: string;
}

export interface JourneyTimelineProps {
  caption: string;
  captionId?: string;
  rows: JourneyRow[];
}

export function JourneyTimeline({ caption, captionId, rows }: JourneyTimelineProps) {
  const locale = useUI((s) => s.locale);
  const rootRef = React.useRef<HTMLDivElement>(null);
  useRowStagger(rootRef, [locale, rows.length]);

  return (
    <RuleIn>
      <div ref={rootRef}>
        <table className="w-full border-collapse text-left">
          <caption
            id={captionId}
            className="f-caption py-2 text-left text-graphite"
          >
            {caption}
          </caption>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <th
                  scope="row"
                  className="w-[34%] border-t border-rule-soft py-4 pr-4 text-left align-top font-normal md:w-[24%] md:pr-8"
                >
                  <span className="f-cell block whitespace-normal tabular-nums text-graphite">
                    {r.period}
                  </span>
                </th>
                <td className="border-t border-rule-soft py-4 align-top">
                  <span className="f-role block max-w-[var(--measure)] font-semibold text-ink">{r.title}</span>
                  {/* `max-w-none` let these rows run the full table width (~87
                      chars/line on /about). `.f-meta` carries no measure of its
                      own, so all three are capped at --measure (68ch); short
                      strings are unaffected. */}
                  <span className="f-cell block max-w-[var(--measure)] text-ink">{r.org}</span>
                  <span className="f-meta block max-w-[var(--measure)] text-graphite">{r.meta}</span>
                  {r.note ? (
                    <span className="f-cell mt-2 block max-w-[var(--measure)] text-graphite">{r.note}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div aria-hidden className="border-t border-ink" />
      </div>
    </RuleIn>
  );
}

export default JourneyTimeline;

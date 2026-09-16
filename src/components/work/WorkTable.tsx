"use client";

import * as React from "react";
import { useDict } from "@/content/dict";
import { useUI, type Locale } from "@/store/ui";
import { works as allWorks, type Work, type WorkMetric } from "@/content/works";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Loupe } from "@/components/work/Loupe";
import { useRowStagger } from "@/components/sections/useRowStagger";
import { cn } from "@/lib/cn";

/**
 * WorkTable — "Work performed", the line items of the job order
 * (REDESIGN-SPEC §E.8). ONE table component for the sheet and for /work: no
 * second gallery anywhere on the site.
 *
 *   variant="full"    the ruled line-item table — Item (capture + title) ·
 *                     Measured · Role · Client · period · Open. Rows are
 *                     `--cell-h` tall, every figure is tabular, and the two
 *                     jobs with a real capture carry a 160×100 cell under the
 *                     inspection Loupe; the others print `work.noPhoto`
 *                     (absence is information, §B — never a placeholder card).
 *   variant="summary" the cover's summary block (first viewport, §A row D):
 *                     the same rows reduced to Item and Measured, printed and
 *                     not linked — the line items themselves live in the Work
 *                     phase below, with their captures, roles and clients.
 *
 * Every string comes from dict.ts and every figure from works.ts: the Measured
 * cell prints the job's first two metrics verbatim ("52% → 68%", "17"), and a
 * job the CV gives no figure for prints `work.none` ("—"), never a guess.
 *
 * HAND-OFF (§E.8): the title of every row carries
 * `data-flip-id="work-title-<slug>"`; TransitionLink stashes its Flip state on
 * click and the entering sub-form replays it onto the heading with the same id.
 * The whole row is clickable — it forwards to its own title link, so pointer
 * and keyboard take the identical path and the Flip capture is never skipped —
 * and the capture is a second, labelled link to the same sub-form: on touch
 * that tap is how the capture opens (the glass never arms there).
 *
 * Motion: RULE-IN — the rows stagger 40ms under one ScrollTrigger
 * (useRowStagger); nothing else moves and no number ever animates.
 */
export type WorkTableVariant = "full" | "summary";

export interface WorkTableProps {
  /** Rows to print, in sheet order. Defaults to all nine jobs. */
  items?: Work[];
  variant?: WorkTableVariant;
  /** When set, a final ruled row links on ("4 more line items"). */
  moreHref?: string;
  /** id of the table's `<caption>`, so a section can `aria-labelledby` it. */
  captionId?: string;
  className?: string;
  id?: string;
}

/** The printed figure of a metric: a CV pair ("52% → 68%") or its single value. */
function figureOf(m: WorkMetric, locale: Locale): string {
  const unit = m.unit ? m.unit[locale] : "";
  if (m.before && m.after) return `${m.before}${unit} → ${m.after}${unit}`;
  return m.value;
}

/**
 * The measured facts of a job, as printed lines: the headline one on the cover
 * summary, the first two in the line-item table. Never more — the rest of the
 * ledger is printed in full under Measured and on the sub-form.
 */
function measuredLines(w: Work, locale: Locale, max: number): { figure: string; label: string }[] {
  return (w.study?.metrics ?? []).slice(0, max).map((m) => ({
    figure: figureOf(m, locale),
    label: m.label[locale],
  }));
}

const HEAD_CELL = "f-caption whitespace-nowrap px-4 py-2 text-left align-bottom text-graphite";
const CELL = "px-4 py-3 align-top border-t border-rule-soft md:h-[var(--cell-h)]";
/** mobile: every cell prints its own column label (the table becomes pairs) */
const MOBILE_LABEL = "f-caption mb-1 block text-graphite md:hidden";

export function WorkTable({
  items = allWorks,
  variant = "full",
  moreHref,
  captionId,
  className,
  id,
}: WorkTableProps) {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const rootRef = React.useRef<HTMLDivElement>(null);
  useRowStagger(rootRef, [locale, variant, items.length]);

  // A click anywhere on the row forwards to the row's own title link: one code
  // path for pointer and keyboard, and TransitionLink still captures the Flip.
  const onRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (e.defaultPrevented || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("a")) return; // the title (or the capture) handled it
    if (window.getSelection()?.toString()) return; // a text selection is not a click
    e.currentTarget.querySelector<HTMLAnchorElement>("a[data-row-link]")?.click();
  };

  if (variant === "summary") {
    return (
      <div ref={rootRef} id={id} className={cn("w-full", className)}>
        <table className="w-full border-collapse">
          <caption id={captionId} className="f-caption mb-2 text-left text-graphite">
            {t.work.caption}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={cn(HEAD_CELL, "w-[38%] border-y border-ink px-0")}>
                {t.work.cols.item}
              </th>
              <th scope="col" className={cn(HEAD_CELL, "border-y border-ink px-0 pl-3")}>
                {t.work.cols.measured}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => {
              const lines = measuredLines(w, locale, 1);
              return (
                <tr key={w.slug}>
                  <th
                    scope="row"
                    className="border-t border-rule-soft py-2 pr-3 text-left align-top"
                  >
                    <span className="f-cell block font-medium text-ink">{w.title}</span>
                  </th>
                  <td className="border-t border-rule-soft py-2 pl-3 align-top">
                    {lines.length ? (
                      lines.map((l) => (
                        <span key={l.label} className="f-cell block text-ink">
                          <span className="whitespace-nowrap tabular-nums">{l.figure}</span>{" "}
                          <span className="text-graphite">{l.label}</span>
                        </span>
                      ))
                    ) : (
                      <span className="f-cell block text-graphite">{t.work.none}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div ref={rootRef} id={id} className={cn("w-full", className)}>
      {/* display:block at mobile (label/value pairs) strips the implicit
          table semantics in Chrome/Safari: the roles below put them back. */}
      <h2 id={captionId} className="f-caption mb-2 text-graphite">
        {t.work.caption}
      </h2>
      <table role="table" className="block w-full border-collapse md:table">
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr className="border-y border-ink">
            <th scope="col" className={HEAD_CELL}>
              {t.work.cols.item}
            </th>
            <th scope="col" className={HEAD_CELL}>
              {t.work.cols.measured}
            </th>
            <th scope="col" className={HEAD_CELL}>
              {t.work.cols.role}
            </th>
            <th scope="col" className={HEAD_CELL}>
              {t.work.cols.client}
            </th>
            <th scope="col" className={cn(HEAD_CELL, "text-right")}>
              {t.work.cols.open}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {items.map((w) => {
            const lines = measuredLines(w, locale, 2);
            const href = `/work/${w.slug}`;
            return (
              <tr
                key={w.slug}
                role="row"
                onClick={onRowClick}
                className="row-hover block cursor-pointer border-t border-ink md:table-row md:border-rule-soft"
              >
                <th scope="row" role="rowheader" className={cn(CELL, "block text-left md:table-cell md:w-[34%]")}>
                  <span className="flex items-start gap-4">
                    {w.capture ? (
                      <TransitionLink
                        href={href}
                        aria-label={`${w.title} · ${w.capture.label[locale]}`}
                        className="shrink-0"
                      >
                        <Loupe src={w.capture.src} width={160} height={100} radius={40} />
                      </TransitionLink>
                    ) : null}
                    <span className="min-w-0">
                      <TransitionLink href={href} data-row-link="" className="block no-underline">
                        <span
                          data-flip-id={`work-title-${w.slug}`}
                          className="f-role block font-semibold text-ink"
                        >
                          {w.title}
                        </span>
                      </TransitionLink>
                      <span className="f-meta mt-1 block text-graphite">
                        {w.capture ? w.capture.label[locale] : t.work.noPhoto}
                      </span>
                    </span>
                  </span>
                </th>

                <td role="cell" className={cn(CELL, "block md:table-cell md:w-[28%]")}>
                  <span className={MOBILE_LABEL}>{t.work.cols.measured}</span>
                  {lines.length ? (
                    lines.map((l) => (
                      <span key={l.label} className="f-cell block text-ink">
                        <span className="tabular-nums">{l.figure}</span>{" "}
                        <span className="text-graphite">{l.label}</span>
                      </span>
                    ))
                  ) : (
                    <span className="f-cell block text-graphite">{t.work.none}</span>
                  )}
                </td>

                <td role="cell" className={cn(CELL, "block md:table-cell md:w-[13%]")}>
                  <span className={MOBILE_LABEL}>{t.work.cols.role}</span>
                  <span className="f-cell block text-ink">{w.phaseRole}</span>
                </td>

                <td role="cell" className={cn(CELL, "block md:table-cell md:w-[18%]")}>
                  <span className={MOBILE_LABEL}>{t.work.cols.client}</span>
                  <span className="f-cell block text-ink">{w.org}</span>
                  <span className="f-meta block tabular-nums text-graphite">
                    {w.period ?? w.year}
                  </span>
                </td>

                <td role="cell" className={cn(CELL, "block md:table-cell md:w-[7%] md:text-right")}>
                  <span aria-hidden className="f-cell whitespace-nowrap text-stamp">
                    {t.work.cols.open} →
                  </span>
                </td>
              </tr>
            );
          })}

          {moreHref ? (
            <tr role="row" className="block border-t border-ink md:table-row">
              <td role="cell" colSpan={5} className="block px-4 py-4 md:table-cell">
                <TransitionLink href={moreHref} className="link f-cell">
                  {t.work.more} ↓
                </TransitionLink>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {/* the table closes on a full rule, like every field of the sheet */}
      <div aria-hidden className="border-t border-ink" />
    </div>
  );
}

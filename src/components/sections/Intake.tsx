"use client";

import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { Field } from "@/components/sheet/Field";
import { experience } from "@/content/career";

/**
 * Intake — the first phase region of the sheet (REDESIGN-SPEC §E.4,
 * `#phase-intake`): who the order is for, and what he is under contract on
 * right now.
 *
 *   • "Owner" (7 of 12 columns) — the positioning sentence in `.f-lead`.
 *   • "Current work" (5 columns) — the engagements from `career.ts` whose
 *     period is still open ("– Present"), each as a provenance row:
 *     employer · role · contract and place · period. No prose, no invention:
 *     the rows are the CV's own.
 *
 * Motion: RULE-IN (the fields' rules draw, then the type). These fields are
 * the continuation of the Intake phase, whose region (`#phase-intake`) starts
 * at the cover in page.tsx: the order is already taken in when the sheet opens
 * (§A FIRST VIEWPORT prints the band with INTAKE stamped and the counter at
 * 1 / 6), and this block is what the intake recorded.
 */
export function Intake() {
  const t = useDict();
  const locale = useUI((s) => s.locale);

  // "Current work" = the engagements the CV still lists as running. The test
  // reads the EN period (the canonical one) so a locale flip cannot change the
  // set of rows, only their wording.
  const current = experience.filter((e) => /present/i.test(e.period.en));

  return (
    <section
      aria-labelledby="intake-caption"
      className="sheet scroll-mt-[var(--band-h)] pt-[var(--section-gap)]"
    >
      <div className="fields grid-12">
        <Field className="col-span-12 md:col-span-7">
          <h2 id="intake-caption" className="field-caption f-caption">
            {t.intake.ownerCaption}
          </h2>
          <p className="f-lead mt-1 text-ink">{t.intake.positioning}</p>
        </Field>

        <Field
          caption={t.intake.currentCaption}
          delay={0.06}
          tone="field"
          className="col-span-12 border-l-0 md:col-span-5 md:border-l"
        >
          <ul className="mt-1">
            {current.map((e, i) => (
              <li key={e.org} className={i > 0 ? "rule-soft mt-3 pt-3" : undefined}>
                <span className="f-cell block font-medium text-ink">{e.org}</span>
                <span className="f-cell block text-ink">{e.role}</span>
                <span className="f-meta block text-graphite">
                  {e.meta[locale]} · <span className="tabular-nums">{e.period[locale]}</span>
                </span>
              </li>
            ))}
          </ul>
        </Field>
      </div>
    </section>
  );
}

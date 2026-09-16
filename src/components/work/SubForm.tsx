"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";
import { skillGroups } from "@/data/skills";
import { Field } from "@/components/sheet/Field";
import { RuleIn } from "@/components/sheet/RuleIn";
import { Perforation } from "@/components/sheet/Perforation";
import { MeasuredRow } from "@/components/sections/MeasuredRow";
import { useRowStagger } from "@/components/sections/useRowStagger";
import { Loupe } from "@/components/work/Loupe";
import { Schematic } from "@/components/work/Schematic";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Footer } from "@/components/footer/Footer";
import { phaseAnchor } from "@/lib/phases";
import { cn } from "@/lib/cn";

/**
 * SubForm — one line item of the job order, written out on the CARBON COPY
 * (REDESIGN-SPEC §E.12, route `/work/[slug]`).
 *
 * The ground is `paper-carbon`; the sheet is a `paper` rectangle with the
 * carbon copy's outline showing 8px down-right of it (no shadow anywhere —
 * §A OWN-WORLD). On it, the seven fields the spec fixes, and nothing else:
 *
 *   Customer · Job · Problem reported · Work performed · Measured · Parts · Links
 *
 * Every value is read from `src/content/works.ts` (the CV, PRODUCT.md §9):
 * Customer is org · orgMeta · period · role, Job the hook, Problem reported
 * `study.problem`, Work performed `study.action` with the CV highlights as
 * ruled rows and the result line under a rule, Measured the same `MeasuredRow`
 * the sheet uses (or `work.none` — "—" — for the job the CV gives no figure
 * for), Parts the stack as NUMBERED UNITS carrying the `skills.ts` group id
 * (§B, the parts plate book), Links the real address or the declared hole
 * ("URL: pending" / "Film link: pending") printed as TEXT — never an empty
 * href.
 *
 * Sphere AI and Maintech OMA also carry the drawn mechanism (`Schematic`):
 * ruled geometry, labels taken from the same content files.
 *
 * FLIP HAND-OFF (§E.8): the `<h1>` carries `data-flip-id="work-title-<slug>"`,
 * the attribute `WorkTable` already emits on every row title, so the clicked
 * line item is carried into this heading while the paper sheet covers
 * (src/lib/sheet.ts stash/play). The "Next line item" row carries the same
 * attribute for the job it points at, so the hand-off also plays sub-form to
 * sub-form.
 *
 * Motion: RULE-IN on the fields (`Field`/`RuleIn`) and the 40ms row stagger on
 * the tables; nothing else. No renderer is mounted on this route.
 */
export interface SubFormProps {
  slug: string;
}

/* ── Parts: the `skills.ts` id of the group a stack item belongs to ──────────
   Normalised comparison (case, versions and parentheses dropped): an exact
   match first, across every group, so "React Three Fiber" is 3D & Graphics and
   not Front-End; then the longest prefix match ("Postgres 17" → PostgreSQL,
   "Azure Speech" → Azure (AD, Speech)). No match → no id printed: a part with
   no catalogue group is a fact, not a gap to fill. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[0-9]+(\.[0-9]+)*/g, " ")
    .replace(/[^a-z+#/&. ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PART_GROUPS: { id: string; item: string }[] = skillGroups.flatMap((g) =>
  g.items.map((item) => ({ id: g.id, item: normalise(item) })),
);

function partGroupId(stackItem: string): string | null {
  const key = normalise(stackItem);
  if (!key) return null;
  const exact = PART_GROUPS.find((p) => p.item === key);
  if (exact) return exact.id;
  let best: { id: string; len: number } | null = null;
  for (const p of PART_GROUPS) {
    const [short, long] = p.item.length <= key.length ? [p.item, key] : [key, p.item];
    if (short.length < 4 || !long.startsWith(short)) continue;
    if (!best || short.length > best.len) best = { id: p.id, len: short.length };
  }
  return best ? best.id : null;
}

const CELL = "block border-t border-rule-soft px-0 py-3 align-top md:table-cell md:px-4";
const HEAD_CELL = "f-caption whitespace-nowrap px-0 py-2 text-left align-bottom text-graphite md:px-4";
const MOBILE_LABEL = "f-caption mb-1 block text-graphite md:hidden";

export function SubForm({ slug }: SubFormProps) {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const measuredRef = React.useRef<HTMLDivElement>(null);
  useRowStagger(measuredRef, [locale, slug]);

  const index = works.findIndex((w) => w.slug === slug);
  const work = index >= 0 ? works[index] : undefined;
  if (!work) notFound();

  const next = works[(index + 1) % works.length];
  const study = work.study;
  const metrics = study?.metrics ?? [];
  const links = study?.links ?? [];
  const cols = {
    item: t.measured.cols.item,
    before: t.measured.cols.before,
    after: t.measured.cols.after,
    source: t.measured.cols.source,
  };

  /* The drawn mechanism. Labels come from content, never from this file: the
     RAG pipeline is four entries of Sphere AI's own `stack`, the job order is
     the six phase names of the dictionary. */
  const schematic =
    work.schematic === "rag"
      ? ["Semantic chunking", "Embeddings", "pgvector", "LLM relevance grader"].filter((s) =>
          work.stack.includes(s),
        )
      : work.schematic === "job-order"
        ? [
            t.phases.intake.name,
            t.phases.diagnosis.name,
            t.phases.estimate.name,
            t.phases.work.name,
            t.phases.test.name,
            t.phases.release.name,
          ]
        : [];

  return (
    <main id="main" className="min-h-dvh bg-paper-carbon pb-[var(--section-gap)]">
      <div className="sheet py-6 md:py-10">
        {/* the carbon copy beneath: the same rectangle, 8px down-right, no shadow */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 translate-x-2 translate-y-2 border border-ink"
          />
          <article className="relative border border-ink bg-paper">
            <header className="border-b border-ink px-5 py-6 md:px-8 md:py-8">
              <h1 data-flip-id={`work-title-${work.slug}`} className="f-headline text-ink">
                {work.title}
              </h1>
              <p className="f-meta mt-2 text-graphite">
                <span className="tabular-nums">{work.period ?? work.year}</span> · {work.org}
              </p>
            </header>

            <div className="px-5 pb-8 pt-6 md:px-8 md:pb-10">
              {/* ── Customer · Job ───────────────────────────────────────── */}
              <div className="fields grid-12">
                <Field caption={t.subform.fields.customer} className="col-span-12 md:col-span-4">
                  <p className="f-cell mt-1 font-medium text-ink">{work.org}</p>
                  {work.orgMeta ? <p className="f-meta text-graphite">{work.orgMeta}</p> : null}
                  <p className="f-meta tabular-nums text-graphite">{work.period ?? work.year}</p>
                  <p className="f-cell mt-2 text-ink">{work.role}</p>
                </Field>

                <Field
                  caption={t.subform.fields.job}
                  delay={0.06}
                  tone="field"
                  className="col-span-12 md:col-span-8"
                >
                  <p className="f-lead mt-1 text-ink">
                    {work.hook ? work.hook[locale] : study?.summary[locale]}
                  </p>
                </Field>
              </div>

              {/* ── Problem reported · Work performed ────────────────────── */}
              <div className="fields grid-12 mt-8">
                <Field caption={t.subform.fields.problem} className="col-span-12 md:col-span-6">
                  <p className="f-body mt-1 text-ink">{study?.problem[locale]}</p>
                </Field>

                <Field
                  id={phaseAnchor("work")}
                  caption={t.subform.fields.work}
                  delay={0.06}
                  className="col-span-12 scroll-mt-[var(--band-h)] md:col-span-6"
                >
                  <p className="f-body mt-1 text-ink">{study?.action[locale]}</p>
                  {work.highlights?.length ? (
                    <ul className="mt-4">
                      {work.highlights.map((h) => (
                        <li key={h.en} className="rule-soft py-3">
                          <span className="f-cell block max-w-none text-ink">{h[locale]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {study?.result ? (
                    <p className="rule-soft f-cell mt-4 max-w-none pt-3 text-graphite">
                      {study.result[locale]}
                    </p>
                  ) : null}
                </Field>
              </div>

              {/* ── The drawn mechanism (Sphere AI, Maintech OMA) ─────────── */}
              {schematic.length ? (
                <div className="fields grid-12 mt-8">
                  <Field className="col-span-12 py-8">
                    <Schematic stages={schematic} />
                  </Field>
                </div>
              ) : null}

              {/* ── The capture, under the inspection glass ───────────────── */}
              {work.capture ? (
                <RuleIn className="mt-8 pt-4">
                  <figure className="m-0">
                    <Loupe
                      src={work.capture.src}
                      width={work.capture.width}
                      height={work.capture.height}
                      radius={140}
                      /* the shared Loupe sizes its root inline; the important
                         modifier is the only thing that can widen it, and the
                         ratio keeps the printed height honest at every width */
                      className="w-full! h-auto! [aspect-ratio:1600/1000]"
                    />
                    <figcaption className="f-meta mt-2 text-graphite">
                      {work.capture.label[locale]}
                    </figcaption>
                  </figure>
                </RuleIn>
              ) : null}

              {/* ── Measured ─────────────────────────────────────────────── */}
              <section aria-labelledby="subform-measured" className="mt-8">
                <h2 id="subform-measured" className="f-caption mb-2 text-graphite">
                  {t.subform.fields.measured}
                </h2>
                {metrics.length ? (
                  <RuleIn>
                    <div ref={measuredRef}>
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
                          {metrics.map((m, i) => (
                            <MeasuredRow
                              key={`${work.slug}-${i}`}
                              metric={m}
                              cellClassName={CELL}
                              labelClassName={MOBILE_LABEL}
                              cols={cols}
                            />
                          ))}
                        </tbody>
                      </table>
                      <div aria-hidden className="border-t border-ink" />
                    </div>
                  </RuleIn>
                ) : (
                  /* The CV gives this job no figure: absence is printed, not filled. */
                  <RuleIn>
                    <p className="f-cell py-3 text-graphite">{t.work.none}</p>
                    <div aria-hidden className="border-t border-ink" />
                  </RuleIn>
                )}
              </section>

              {/* ── Parts · Links ────────────────────────────────────────── */}
              <div className="fields grid-12 mt-8">
                <Field caption={t.subform.fields.parts} className="col-span-12 md:col-span-7">
                  <ol className="mt-1">
                    {work.stack.map((item, i) => {
                      const group = partGroupId(item);
                      return (
                        <li
                          key={item}
                          className="rule-soft flex items-baseline gap-3 py-2 first:border-t-0"
                        >
                          <span className="f-meta w-8 shrink-0 tabular-nums text-graphite">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="f-cell min-w-0 flex-1 text-ink">{item}</span>
                          {group ? (
                            <span className="f-meta shrink-0 text-graphite">{group}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </Field>

                <Field
                  caption={t.subform.fields.links}
                  delay={0.06}
                  tone="field"
                  className="col-span-12 md:col-span-5"
                >
                  <ul className="mt-1">
                    {links.length ? (
                      links.map((l) => (
                        <li key={l.label} className="rule-soft py-1 first:border-t-0">
                          {l.href ? (
                            <a
                              href={l.href}
                              rel="noopener"
                              className="link f-cell inline-flex min-h-[44px] items-center"
                            >
                              {l.label} ↗
                            </a>
                          ) : (
                            /* a hole declared by PRODUCT §8.1: printed as text,
                               never as an anchor with nowhere to go */
                            <span className="f-cell inline-flex min-h-[44px] items-center text-graphite">
                              {l.label} —{" "}
                              {l.pending === "film" ? t.subform.pendingFilm : t.subform.pendingUrl}
                            </span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="f-cell py-2 text-graphite">{t.work.none}</li>
                    )}
                  </ul>
                </Field>
              </div>
            </div>
          </article>
        </div>

        {/* ── Next line item ─────────────────────────────────────────────── */}
        <Perforation className="mt-10" />
        <RuleIn>
          <TransitionLink
            href={`/work/${next.slug}`}
            className="row-hover flex min-h-[var(--cell-h)] flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 no-underline"
          >
            <span className="f-caption text-graphite">{t.subform.next}</span>
            <span className="flex min-w-0 items-baseline gap-3">
              <span data-flip-id={`work-title-${next.slug}`} className="f-role font-semibold text-ink">
                {next.title}
              </span>
              <span aria-hidden className="f-cell text-stamp">
                →
              </span>
            </span>
          </TransitionLink>
        </RuleIn>
      </div>

      <Footer />
    </main>
  );
}

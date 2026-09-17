"use client";

import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { education, experience, identity } from "@/content/career";
import { languages } from "@/data/skills";
import { Field } from "@/components/sheet/Field";
import { Release } from "@/components/sections/Release";
import { Footer } from "@/components/footer/Footer";
import { JourneyTimeline, type JourneyRow } from "@/components/about/JourneyTimeline";

/**
 * AboutJourney — `/about`, the OWNER of the job order (REDESIGN-SPEC §E.13).
 *
 * The lexicon decision of §B holds: the block is called Owner, not "vehicle".
 * Everything printed here is transcribed content — `career.ts` for the
 * identity, the experience and the education rows and the thesis,
 * `skills.ts` for the languages — and the two holes PRODUCT.md declares are
 * printed as fields rather than hidden: "Photograph — none on file".
 *
 * Layout: the Owner and Summary fields on one ruled row, then Experience and
 * Education as the ruled two-column tables of `JourneyTimeline`, then Thesis ·
 * Languages · Photograph, the compact Release (§E.10) and the footer. Motion:
 * RULE-IN only. No renderer is mounted on this route.
 */
export function AboutJourney() {
  const t = useDict();
  const locale = useUI((s) => s.locale);

  const experienceRows: JourneyRow[] = experience.map((e) => ({
    id: `${e.org}-${e.period.en}`,
    period: e.period[locale],
    title: e.role,
    org: e.org,
    meta: e.meta[locale],
    note: e.note?.[locale],
  }));

  const educationRows: JourneyRow[] = education.map((e) => ({
    id: `${e.org}-${e.period.en}`,
    period: e.period[locale],
    title: e.degree[locale],
    org: e.org,
    meta: e.meta[locale],
  }));

  // The thesis the CV records, with its own abstract (B.Sc., University of Camerino).
  const thesis = education.find((e) => e.thesis)?.thesis;

  return (
    <main id="main" tabIndex={-1}>
      {/* ── Owner · Summary ───────────────────────────────────────────────── */}
      <section
        aria-labelledby="owner-name"
        className="sheet scroll-mt-[var(--band-h)] pt-8 md:pt-12"
      >
        <div className="fields grid-12">
          {/* the field's caption is a label, not a heading: the page's single
              h1 is the owner's name, and it comes first in the outline */}
          <Field caption={t.about.captions.owner} className="col-span-12 md:col-span-5">
            <h1 id="owner-name" className="f-headline mt-1 text-ink">
              {identity.name}
            </h1>
            <p className="f-role mt-3 text-ink">{identity.roleLine}</p>
            <p className="f-role text-graphite">{identity.subLine}</p>
          </Field>

          <Field
            caption={t.about.captions.summary}
            delay={0.06}
            tone="field"
            className="col-span-12 md:col-span-7"
          >
            <p className="f-lead mt-1 text-ink">{identity.summary[locale]}</p>
          </Field>
        </div>
      </section>

      {/* ── Experience ────────────────────────────────────────────────────── */}
      <section aria-labelledby="experience-caption" className="sheet pt-[var(--section-gap)]">
        <JourneyTimeline
          caption={t.about.captions.experience}
          captionId="experience-caption"
          rows={experienceRows}
        />
      </section>

      {/* ── Education ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="education-caption" className="sheet pt-[var(--section-gap)]">
        <JourneyTimeline
          caption={t.about.captions.education}
          captionId="education-caption"
          rows={educationRows}
        />
      </section>

      {/* ── Thesis · Languages · Photograph ───────────────────────────────── */}
      <section className="sheet pt-[var(--section-gap)]">
        <div className="fields grid-12">
          <Field caption={t.about.captions.thesis} className="col-span-12 md:col-span-8">
            {thesis ? (
              <>
                {/* `.f-role` carries no measure of its own: the thesis title ran ~87
                    chars per line at 1280px. */}
                <p className="f-role mt-1 max-w-[var(--measure)] font-semibold text-ink">{thesis.title}</p>
                <p className="f-body mt-2 text-ink">{thesis.abstract[locale]}</p>
              </>
            ) : null}
          </Field>

          <Field
            caption={t.about.captions.languages}
            delay={0.06}
            tone="field"
            className="col-span-12 md:col-span-4"
          >
            <ul className="mt-1">
              {languages.items.map((l) => (
                <li key={l.en} className="rule-soft py-2 first:border-t-0">
                  <span className="f-cell block text-ink">{l[locale]}</span>
                </li>
              ))}
            </ul>
          </Field>

          {/* A declared hole (PRODUCT §8.2), printed as a field — never a
              placeholder portrait, never an empty frame. */}
          <Field caption={t.about.captions.photograph} delay={0.12} className="col-span-12">
            <p className="f-cell mt-1 text-graphite">{t.about.noPhoto}</p>
          </Field>
        </div>
      </section>

      <div className="sheet pt-[var(--section-gap)]">
        <Release variant="box" />
      </div>

      <Footer />
    </main>
  );
}

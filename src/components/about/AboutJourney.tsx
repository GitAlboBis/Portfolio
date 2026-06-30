"use client";

import Link from "next/link";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { Reveal } from "@/components/reveal/Reveal";
import { Appear } from "@/components/motion/Appear";

/**
 * AboutJourney — the long-form "/about" page: extended bio, Education, an Experience
 * timeline and the thesis note. Every line is from the confirmed bio in
 * docs/07-PROJECTS.md (no invented facts) and routed through the EN/IT dictionary
 * (`journey.*`). Golden Hour editorial layout + the shared motion primitives.
 */
export function AboutJourney() {
  const t = useDict();
  const j = t.journey;
  const locale = useUI((s) => s.locale);
  const toggleLocale = useUI((s) => s.toggleLocale);

  return (
    <main id="main" className="relative min-h-dvh bg-paper">
      {/* Minimal header (no in-page section nav — those anchors live on home). */}
      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          className="container-edit flex items-center justify-between"
          style={{ height: "var(--nav-h)" }}
        >
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-[-0.02em] text-ink transition-opacity duration-300 hover:opacity-70"
          >
            Alberto&nbsp;Tuveri
          </Link>
          <div className="flex items-center gap-5 sm:gap-7">
            <button
              onClick={toggleLocale}
              aria-label="Toggle language"
              className="t-meta text-ember-ink transition-colors duration-300 hover:text-ember"
            >
              {locale === "en" ? "IT" : "EN"}
            </button>
            <Link href="/" className="t-meta transition-colors duration-300 hover:text-ember-ink">
              ← {j.back}
            </Link>
          </div>
        </nav>
      </header>

      {/* Intro */}
      <section
        className="container-edit"
        style={{ paddingBlock: "calc(var(--nav-h) + var(--section-y))" }}
      >
        <div className="grid-edit">
          <Appear as="div" className="col-meta mb-6 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{j.eyebrow}</p>
          </Appear>
          <div className="col-read">
            <WordGenerate as="h1" className="t-display max-w-[20ch]">
              {j.title}
            </WordGenerate>
            <p className="t-lead mt-6">{j.lead}</p>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit">
          <div className="col-read flex flex-col gap-6">
            {j.bio.map((p, i) => (
              <Appear as="p" key={i} className="t-body" y={20}>
                {p}
              </Appear>
            ))}
          </div>
        </div>
      </section>

      {/* Education + Experience */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit gap-y-16">
          <div className="col-meta mb-4 lg:mb-0">
            <h2 className="t-title">{j.educationTitle}</h2>
          </div>
          <ul className="col-read flex flex-col">
            {j.education.map((e, i) => (
              <Appear
                as="li"
                key={i}
                y={16}
                className="flex flex-col gap-1 border-t border-[var(--color-rule)] py-6 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span>
                  <span className="block font-display text-2xl font-semibold text-ink">{e.title}</span>
                  <span className="t-body t-body--mute">{e.org}</span>
                </span>
                {e.period ? <span className="t-meta shrink-0">{e.period}</span> : null}
              </Appear>
            ))}
          </ul>

          <div className="col-meta mb-4 mt-8 lg:mb-0 lg:mt-0">
            <h2 className="t-title">{j.experienceTitle}</h2>
          </div>
          <ul className="col-read flex flex-col">
            {j.experience.map((e, i) => (
              <Appear
                as="li"
                key={i}
                y={16}
                className="flex flex-col gap-1 border-t border-[var(--color-rule)] py-6 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span>
                  <span className="block font-display text-2xl font-semibold text-ink">{e.org}</span>
                  <span className="t-body t-body--mute">{e.role}</span>
                </span>
                <span className="t-meta shrink-0">{e.period}</span>
              </Appear>
            ))}
          </ul>
        </div>
      </section>

      {/* Thesis */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit">
          <div className="col-meta mb-4 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{j.thesisTitle}</p>
          </div>
          <div className="col-read">
            <Reveal as="p" className="t-lead">
              {j.thesis}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Closing CTA — night band */}
      <section className="night bleed" style={{ background: "var(--color-night)" }}>
        <div className="container-edit flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-title max-w-[16ch]">{t.contact.headline}</p>
          <Link
            href="/#contact"
            className="t-meta whitespace-nowrap text-amber transition-colors duration-300 hover:text-paper"
          >
            {t.contact.cta} →
          </Link>
        </div>
      </section>
    </main>
  );
}

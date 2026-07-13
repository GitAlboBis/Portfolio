"use client";

import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { DualWaveText } from "@/components/reveal/DualWaveText";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Appear } from "@/components/motion/Appear";
import { JourneyTimeline } from "@/components/about/JourneyTimeline";
import { LazyOnView } from "@/components/motion/LazyOnView";
import { ShallowWater } from "@/components/atmosphere/ShallowWater";
import { RollLink } from "@/components/motion/RollLink";

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
              className="t-meta text-ember-ink underline-offset-4 transition-colors duration-300 hover:underline"
            >
              {locale === "en" ? "IT" : "EN"}
              <span className="sr-only"> — {t.nav.langToggle}</span>
            </button>
            <RollLink
              as={Link}
              href="/"
              prefix="←"
              label={j.back}
              className="t-meta transition-colors duration-300 hover:text-ember-ink"
            />
          </div>
        </nav>
      </header>

      {/* Intro — over the ShallowWater atmosphere: golden-hour caustics on the
          paper (the Sulcis coast the headline names), dissolving into dry ground
          before the bio. Decorative, absolute-fill (zero CLS); no-WebGL falls back
          to the page's own bg-paper. */}
      <section
        className="relative"
        style={{ paddingBlock: "calc(var(--nav-h) + var(--section-y))" }}
      >
        <LazyOnView>
          <ShallowWater />
        </LazyOnView>
        <div className="container-edit grid-edit relative">
          <Appear as="div" className="col-meta mb-6 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{j.eyebrow}</p>
          </Appear>
          <div className="col-read">
            <DualWaveText as="h1" className="t-display max-w-[20ch]">
              {j.title}
            </DualWaveText>
            <p className="t-lead mt-6">{j.lead}</p>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit">
          <div className="col-read flex flex-col gap-6">
            {j.bio.map((p, i) => (
              <ScrollWords as="p" key={i} className="t-body">
                {p}
              </ScrollWords>
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
          <JourneyTimeline
            items={j.education.map((e) => ({
              period: e.period,
              primary: e.title,
              secondary: e.org,
            }))}
          />

          <div className="col-meta mb-4 mt-8 lg:mb-0 lg:mt-0">
            <h2 className="t-title">{j.experienceTitle}</h2>
          </div>
          <JourneyTimeline
            items={j.experience.map((e) => ({
              period: e.period,
              primary: e.org,
              secondary: e.role,
            }))}
          />
        </div>
      </section>

      {/* Thesis */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit">
          <div className="col-meta mb-4 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{j.thesisTitle}</p>
          </div>
          <div className="col-read">
            <ScrollWords as="p" className="t-lead">
              {j.thesis}
            </ScrollWords>
          </div>
        </div>
      </section>

      {/* Closing CTA — night band */}
      <section className="night bleed" style={{ background: "var(--color-night)" }}>
        <div className="container-edit flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-title max-w-[16ch]">{t.contact.headline}</p>
          <Link
            href="/#contact"
            className="link t-meta whitespace-nowrap text-amber transition-colors duration-300 hover:text-paper"
          >
            {t.contact.cta} →
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { DualWaveText } from "@/components/reveal/DualWaveText";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Appear } from "@/components/motion/Appear";
import { Parallax } from "@/components/motion/Parallax";
import { JourneyTimeline } from "@/components/about/JourneyTimeline";
import { FilmScrub } from "@/components/home/FilmScrub";
import { LazyOnView } from "@/components/motion/LazyOnView";
import { ShallowWater } from "@/components/atmosphere/ShallowWater";
import { GoldenMotes } from "@/components/atmosphere/GoldenMotes";
import { TornEdge } from "@/components/atmosphere/TornEdge";
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
        {/* paper scrim — the chrome must stay legible over the photo strips
            below (paper-on-paper = invisible at rest; same as WorkCaseStudy) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: "calc(var(--nav-h) * 1.6)",
            background:
              "linear-gradient(to bottom, var(--color-paper) 38%, color-mix(in oklab, var(--color-paper) 55%, transparent) 68%, transparent)",
          }}
        />
        <nav
          className="container-edit relative flex items-center justify-between"
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

      {/* Atmosphere — the Sulcis coast itself as a faint watercolor chart
          (terracotta/amber/dusk washes, multiply -> melts into the paper),
          anchored where the intro leaves air, plus golden pollen drifting up
          the first two viewports. Decorative; the headline names this coast. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[220vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coast/sulcis-map.webp"
          alt=""
          className="absolute -right-[6%] top-[-2%] w-[min(56vw,860px)] mix-blend-multiply opacity-40"
          style={{
            maskImage: "linear-gradient(to bottom, black 55%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 95%)",
          }}
        />
        <GoldenMotes count={12} salt={7} />
      </div>

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

      {/* The coast itself — the REAL Masua cliff (Gianluca's drone, DJI-LUT
          graded): a full-bleed editorial strip with a slow parallax window.
          The page opens on the place, not on empty paper. */}
      <figure aria-hidden className="relative mb-[var(--section-y)] h-[54vh] overflow-hidden">
        <Parallax from={-36} to={36} className="absolute inset-x-0 -inset-y-[12%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coast/masua-cliff.webp"
            alt=""
            className="h-full w-full object-cover"
          />
        </Parallax>
        {/* the paper TEARS open on the photograph — ragged fibre seams */}
        <TornEdge side="top" seed={5} />
        <TornEdge side="bottom" seed={11} />
      </figure>

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

      {/* LA ROCCIA — real drone film of Masua/Porto Flavia (scroll-scrubbed):
          the coast the footer coordinates point at, and a 1924 lesson in
          engineering carved into the landscape. Real footage (G. Ghiani). */}
      <FilmScrub
        srcDesktop="/coast/rock-1600.mp4"
        srcMobile="/coast/rock-960.mp4"
        poster="/coast/rock-poster.jpg"
        eyebrow={j.film.eyebrow}
        title={j.film.title}
        meta={j.film.meta}
        heightVh={220}
      />

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

      {/* Closing CTA — night band over the REAL night: Pan di Zucchero under
          the Milky Way (warm-dark overlay keeps the copy AA on any pixel). */}
      <section className="night bleed relative overflow-hidden" style={{ background: "var(--color-night)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coast/night-sea.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--color-night) 78%, transparent), color-mix(in srgb, var(--color-night) 45%, transparent))",
          }}
        />
        <div className="container-edit relative flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
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

"use client";

import * as React from "react";
import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works, worksConfirmed } from "@/content/works";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Appear } from "@/components/motion/Appear";
import { CountUp } from "@/components/motion/CountUp";
import { Parallax } from "@/components/motion/Parallax";
import { LazyOnView } from "@/components/motion/LazyOnView";
import { ShallowWater } from "@/components/atmosphere/ShallowWater";
import { DetailCut } from "@/components/work/DetailCut";
import { RollLink } from "@/components/motion/RollLink";

/**
 * WorkCaseStudy — the /work/[slug] case-study page for a CONFIRMED project. All copy
 * is the confirmed Problem → Action → Result content from works.ts (sourced from
 * docs/07-PROJECTS.md; no invented metrics). Bilingual via the Localized study
 * fields + dict labels.
 *
 * THE PHOTO ESSAY: the page treats its one project still like a magazine feature
 * treats the shoot — the wide shot opens the piece (full-bleed banner), then two
 * DETAIL CROPS of the same photograph punctuate the chapters, each washed toward
 * one of the project's mood colors (DetailCut). Chapters are numbered, their
 * labels ride sticky beside the reading column, the stack settles in like dealt
 * cards, and the metrics count up at display scale.
 */

/* Art direction per still — where each detail crop looks and how tight.
   (Focal = object-position AND zoom origin; values chosen per photograph.) */
const CUTS: Record<string, [{ focal: string; zoom: number }, { focal: string; zoom: number }]> = {
  badante24h: [
    { focal: "30% 32%", zoom: 2.1 },
    { focal: "72% 62%", zoom: 2.5 },
  ],
  "doit-voice-ai-agent": [
    { focal: "22% 55%", zoom: 2.2 },
    { focal: "70% 40%", zoom: 2.6 },
  ],
  "agricultural-supply-chain": [
    { focal: "25% 65%", zoom: 2.0 },
    { focal: "75% 30%", zoom: 2.4 },
  ],
};
const CUTS_DEFAULT: (typeof CUTS)[string] = [
  { focal: "30% 40%", zoom: 2.0 },
  { focal: "70% 60%", zoom: 2.4 },
];

export function WorkCaseStudy({ slug }: { slug: string }) {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const toggleLocale = useUI((s) => s.toggleLocale);
  const work = works.find((w) => w.slug === slug);
  if (!work || !work.study) return null;
  const s = work.study;
  const tx = (l: { en: string; it: string }) => l[locale];

  const confirmedIdx = worksConfirmed.findIndex((w) => w.slug === slug);
  const indexLabel = String(confirmedIdx + 1).padStart(2, "0");
  const cuts = CUTS[slug] ?? CUTS_DEFAULT;

  const Block = ({ n, label, body }: { n: number; label: string; body: string }) => (
    <div className="grid-edit border-t border-[var(--color-rule)] py-[var(--block-y)]">
      <div className="col-meta mb-3 lg:mb-0">
        {/* the chapter label rides beside the reading column (lg+ only) */}
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
          <p className="t-index mb-2">{String(n).padStart(2, "0")}</p>
          <p className="t-eyebrow eyebrow-tick">{label}</p>
        </div>
      </div>
      <div className="col-read">
        <ScrollWords as="p" className="t-lead">
          {body}
        </ScrollWords>
      </div>
    </div>
  );

  return (
    <main id="main" className="relative min-h-dvh bg-paper">
      <header className="fixed inset-x-0 top-0 z-50">
        {/* paper scrim — the chrome must stay legible while the photo essay and
            the night band scroll beneath it (paper-on-paper = invisible at rest) */}
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
              href="/#works"
              prefix="←"
              label={t.works.back}
              className="t-meta transition-colors duration-300 hover:text-ember-ink"
            />
          </div>
        </nav>
      </header>

      {/* Intro — over the ShallowWater atmosphere (as the /about intro): golden
          caustics on the paper, dissolving before the metrics. Decorative,
          absolute-fill (zero CLS); no-WebGL falls back to bg-paper. */}
      <section
        className="relative overflow-hidden"
        style={{ paddingBlock: "calc(var(--nav-h) + var(--section-y))" }}
      >
        <LazyOnView>
          <ShallowWater />
        </LazyOnView>
        {/* the study's index among the confirmed works — runway ghost grammar */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[2vw] top-[max(var(--nav-h),6vh)] select-none"
        >
          <Parallax from={30} to={-30}>
            <span
              className="font-display font-bold leading-none [font-size:clamp(7rem,17vw,15rem)]"
              style={{ color: "color-mix(in oklab, var(--color-ink) 5%, transparent)" }}
            >
              {indexLabel}
            </span>
          </Parallax>
        </div>
        <div className="container-edit grid-edit relative">
          <Appear as="div" className="col-meta mb-6 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{work.org}</p>
            <p className="t-meta mt-3">{work.year}</p>
            <p className="t-meta mt-1 normal-case">
              {t.works.roleLabel}: {work.role}
            </p>
          </Appear>
          <div className="col-read">
            <WordGenerate as="h1" className="t-display max-w-[18ch]" blur>
              {work.title}
            </WordGenerate>
            <p className="t-lead mt-6">{tx(s.summary)}</p>
          </div>
        </div>
      </section>

      {/* The wide shot — the still opens the essay, torn into the paper. */}
      {work.textureSrc ? (
        <DetailCut
          src={work.textureSrc}
          focal="50% 42%"
          zoom={1.08}
          tint={work.mood.blob1}
          caption={`${work.org} · ${work.year}`}
          seeds={[4, 9]}
          variant="full"
          height="48svh"
          className="mb-[var(--section-y)]"
        />
      ) : null}

      {/* Metrics */}
      {s.metrics?.length ? (
        <section className="container-edit pb-[var(--section-y)]">
          <Appear
            as="div"
            stagger={0.1}
            className="grid grid-cols-1 gap-8 border-y border-[var(--color-rule)] py-10 sm:grid-cols-3"
          >
            {s.metrics.map((m, i) => (
              <div key={i}>
                {/* the number counts to its value as it enters (0 counts DOWN — arrived at) */}
                <CountUp
                  value={m.value}
                  className="font-display font-semibold leading-none text-ember [font-size:clamp(3rem,6vw,4.5rem)]"
                />
                <p className="t-meta mt-3">{tx(m.label)}</p>
              </div>
            ))}
          </Appear>
        </section>
      ) : null}

      {/* Problem → Action → Result, punctuated by detail crops of the still */}
      <section className="container-edit">
        <Block n={1} label={t.works.problem} body={tx(s.problem)} />
      </section>
      {work.textureSrc ? (
        <DetailCut
          src={work.textureSrc}
          focal={cuts[0].focal}
          zoom={cuts[0].zoom}
          tint={work.mood.blob1}
          caption={`${t.works.detail} 01 — ${work.title}`}
          seeds={[13, 21]}
          variant="inset"
          height="min(52vh, 30rem)"
        />
      ) : null}
      <section className="container-edit">
        <Block n={2} label={t.works.action} body={tx(s.action)} />
      </section>
      {work.textureSrc ? (
        <DetailCut
          src={work.textureSrc}
          focal={cuts[1].focal}
          zoom={cuts[1].zoom}
          tint={work.mood.blob2}
          caption={`${t.works.detail} 02 — ${work.title}`}
          seeds={[27, 35]}
          variant="full"
          height="52svh"
        />
      ) : null}
      <section className="container-edit pb-[var(--section-y)]">
        <Block n={3} label={t.works.result} body={tx(s.result)} />
      </section>

      {/* Stack + links */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit">
          <div className="col-meta mb-4 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{t.works.stackLabel}</p>
          </div>
          <StackChips stack={work.stack} />
        </div>
        {s.links?.length ? (
          <div className="grid-edit mt-8">
            <div className="col-read flex gap-6">
              {s.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link t-meta text-ember-ink"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Next-project handoff — the studies close into a loop */}
      <NextProject slug={slug} />

      {/* Closing — night band */}
      <section className="night bleed" style={{ background: "var(--color-night)" }}>
        <div className="container-edit flex items-center justify-between py-14">
          <Link href="/#works" className="link t-meta text-amber">
            ← {t.works.back}
          </Link>
          <Link href="/#contact" className="link t-meta text-amber">
            {t.contact.cta} →
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * StackChips — the stack settles in like dealt cards: each chip rises with a
 * slight alternating rotation and straightens as it lands (once, on the shared
 * ScrollTrigger). Chips are static information — no hover affordance (nothing
 * pretends to be clickable). Reduced-motion: fully visible, no motion.
 */
function StackChips({ stack }: { stack: string[] }) {
  const reduced = useUI((s) => s.reducedMotion);
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced || !root.children.length) return;
      gsap.from(root.children, {
        y: 16,
        autoAlpha: 0,
        rotation: (i: number) => ((i % 3) - 1) * 2.4,
        duration: DUR.swell,
        ease: EASE.tide,
        stagger: 0.045,
        clearProps: "transform,opacity,visibility",
        scrollTrigger: { trigger: root, start: "top 88%", once: true },
      });
    },
    // revertOnUpdate: a live reduced-motion flip must not leave chips hidden
    // by the from()'s inline styles (from-residue lesson).
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className="col-read flex flex-wrap gap-2">
      {stack.map((tech) => (
        <span key={tech} className="glass rounded-full px-3 py-1 t-meta normal-case">
          {tech}
        </span>
      ))}
    </div>
  );
}

/**
 * NextProject — full-bleed handoff band above the closing night section: the
 * next CONFIRMED study (provisional SerSan entries excluded) approaches on the
 * runway's counter-speed grammar — title drifts in at +6vw, the 30vw ghost
 * numeral (WorkHorizontal's far-layer vocabulary, same color-mix ink 6%) at
 * +2vw — welded to the scroll, both window ends CLAMPED (document-end rule).
 * The whole band is ONE link: reading order = eyebrow ("Next project") then
 * title; the numeral is decorative. Hover translate lives on an INNER span —
 * the h2's transform belongs to the scrub (CSS and GSAP must never share one
 * element's transform). Reduced-motion: the effect never runs, the band sits
 * at its final position (fromTo initial states are applied at effect time).
 */
function NextProject({ slug }: { slug: string }) {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  const ref = React.useRef<HTMLElement>(null);

  const confirmed = works.filter((w) => w.status === "confirmed");
  const idx = confirmed.findIndex((w) => w.slug === slug);
  const next = confirmed[(idx + 1) % confirmed.length];

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced || !next) return;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "clamp(top 95%)", end: "clamp(top 40%)", scrub: 1 },
      });
      tl.fromTo("[data-next-title]", { x: "6vw" }, { x: 0 }, 0).fromTo(
        "[data-next-num]",
        { x: "2vw" },
        { x: 0 },
        0,
      );
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    // revertOnUpdate: a live reduced-motion flip re-runs this effect and
    // early-returns — without it the old scrubbed trigger survives (and a
    // flip-back stacks a duplicate). Same pattern/comment as WorkHorizontal.
    { scope: ref, dependencies: [reduced, next?.slug], revertOnUpdate: true },
  );

  if (!next || next.slug === slug) return null;

  return (
    <section ref={ref} className="bleed relative overflow-hidden bg-paper-deep">
      {/* far parallax layer — WorkHorizontal's ghost-numeral vocabulary */}
      <span
        aria-hidden
        data-next-num
        className="pointer-events-none absolute -bottom-[6vw] right-[2vw] font-display text-[30vw] font-bold leading-none"
        style={{ color: "color-mix(in oklab, var(--color-ink) 6%, transparent)" }}
      >
        {String(((idx + 1) % confirmed.length) + 1).padStart(2, "0")}
      </span>

      <Link href={`/work/${next.slug}`} className="group block">
        <div className="container-edit relative py-[clamp(4rem,12vh,8rem)]">
          {/* ink-mute: t-eyebrow's ember-ink is 4.30:1 on paper-deep (AA needs
              4.5 at this size) — the ember tick keeps the accent instead */}
          <p className="t-eyebrow eyebrow-tick text-ink-mute">{t.works.next}</p>
          <h2
            data-next-title
            className="mt-5 max-w-[14ch] font-display font-bold leading-[0.95] tracking-[-0.03em] text-ink [font-size:clamp(2.5rem,7vw,7rem)]"
          >
            <span className="inline-block transition-[transform,color] duration-300 ease-[var(--ease-tide)] group-hover:translate-x-2 group-hover:text-ember-ink">
              {next.title}
            </span>
          </h2>
        </div>
      </Link>
    </section>
  );
}

"use client";

import * as React from "react";
import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";
import { gsap, useGSAP } from "@/lib/gsap";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Appear } from "@/components/motion/Appear";
import { LazyOnView } from "@/components/motion/LazyOnView";
import { ShallowWater } from "@/components/atmosphere/ShallowWater";
import { RollLink } from "@/components/motion/RollLink";

/**
 * WorkCaseStudy — the /work/[slug] case-study page for a CONFIRMED project. All copy
 * is the confirmed Problem → Action → Result content from works.ts (sourced from
 * docs/07-PROJECTS.md; no invented metrics). Bilingual via the Localized study
 * fields + dict labels. Golden Hour editorial layout reusing the motion primitives.
 */
export function WorkCaseStudy({ slug }: { slug: string }) {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const work = works.find((w) => w.slug === slug);
  if (!work || !work.study) return null;
  const s = work.study;
  const tx = (l: { en: string; it: string }) => l[locale];

  const Block = ({ label, body }: { label: string; body: string }) => (
    <div className="grid-edit border-t border-[var(--color-rule)] py-[var(--block-y)]">
      <div className="col-meta mb-3 lg:mb-0">
        <p className="t-eyebrow eyebrow-tick">{label}</p>
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
          <RollLink
            as={Link}
            href="/#works"
            prefix="←"
            label={t.works.back}
            className="t-meta transition-colors duration-300 hover:text-ember-ink"
          />
        </nav>
      </header>

      {/* Intro — over the ShallowWater atmosphere (as the /about intro): golden
          caustics on the paper, dissolving before the metrics. Decorative,
          absolute-fill (zero CLS); no-WebGL falls back to bg-paper. */}
      <section
        className="relative"
        style={{ paddingBlock: "calc(var(--nav-h) + var(--section-y))" }}
      >
        <LazyOnView>
          <ShallowWater />
        </LazyOnView>
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
                <p className="font-display text-5xl font-semibold text-ember">{m.value}</p>
                <p className="t-meta mt-2">{tx(m.label)}</p>
              </div>
            ))}
          </Appear>
        </section>
      ) : null}

      {/* Problem → Action → Result */}
      <section className="container-edit pb-[var(--section-y)]">
        <Block label={t.works.problem} body={tx(s.problem)} />
        <Block label={t.works.action} body={tx(s.action)} />
        <Block label={t.works.result} body={tx(s.result)} />
      </section>

      {/* Stack + links */}
      <section className="container-edit pb-[var(--section-y)]">
        <div className="grid-edit">
          <div className="col-meta mb-4 lg:mb-0">
            <p className="t-eyebrow eyebrow-tick">{t.works.stackLabel}</p>
          </div>
          <div className="col-read flex flex-wrap gap-2">
            {work.stack.map((tech) => (
              <span key={tech} className="glass rounded-full px-3 py-1 t-meta normal-case">
                {tech}
              </span>
            ))}
          </div>
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

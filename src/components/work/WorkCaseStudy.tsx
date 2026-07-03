"use client";

import Link from "next/link";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Appear } from "@/components/motion/Appear";
import { LazyOnView } from "@/components/motion/LazyOnView";
import { ShallowWater } from "@/components/atmosphere/ShallowWater";

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
          <Link href="/#works" className="t-meta transition-colors duration-300 hover:text-ember-ink">
            ← {t.works.back}
          </Link>
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
                  className="t-meta text-ember-ink underline-offset-4 transition-colors duration-300 hover:underline"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Closing — night band */}
      <section className="night bleed" style={{ background: "var(--color-night)" }}>
        <div className="container-edit flex items-center justify-between py-14">
          <Link href="/#works" className="t-meta text-amber transition-colors duration-300 hover:text-paper">
            ← {t.works.back}
          </Link>
          <Link href="/#contact" className="t-meta text-amber transition-colors duration-300 hover:text-paper">
            {t.contact.cta} →
          </Link>
        </div>
      </section>
    </main>
  );
}

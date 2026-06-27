"use client";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useScrollParallax } from "@/components/descending-world";
import { projectsSorted, type Project } from "@/data/projects";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import { ProjectFocusCards } from "@/components/focus-cards";
import { SkiperCurrentThread } from "@/components/skiper-current-thread";

/*
  WorkSection — Cinematic Ocean (NatGeo "Into the Amazon" lineage).
  Deep-sea section: clean, measured, generous negative space. One column of
  frosted "water glass" cards on deep blue. White serif headings, mist serif
  body, sans micro-labels. The single warm accent (sun) appears only as the
  provisional micro-marker and the link arrow. No mono, no depth rails, no
  chapter coordinates, no staggered grid.
*/
export function WorkSection() {
  const { lang, t } = useLanguage();
  // The heading hangs at a slightly different depth than the cards as we descend.
  const headingRef = useScrollParallax<HTMLDivElement>(34);

  return (
    <section
      id="work"
      className="scroll-mt-24 py-28 sm:py-36 md:py-44"
    >
      <Container>
        <Reveal>
          <div ref={headingRef}>
            <SectionHeading
              eyebrow={t.work.eyebrow}
              title={t.work.heading}
              lead={t.work.lead}
            />
          </div>
        </Reveal>

        {/* Projects as a water depth-of-field grid (focus one, the rest sink),
            with a scroll-drawn "descent current" inking down behind them. */}
        <div className="relative mt-20 sm:mt-28 md:mt-32">
          <SkiperCurrentThread className="hidden sm:block" />
          <div className="relative z-10">
            <Reveal className="mx-auto max-w-5xl">
              <ProjectFocusCards />
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ProjectCard({
  project,
  lang,
  t,
}: {
  project: Project;
  lang: "en" | "it";
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const provisional = project.status === "provisional";

  return (
    <article
      className={cn(
        "group water-glass rounded-3xl px-7 py-9 transition-colors duration-500 sm:px-10 sm:py-12",
        provisional ? "opacity-60" : "hover:border-foam/45",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h3 className="heading-2 text-foam">{project.title}</h3>
          <p className="label mt-4">
            {project.org}
            <span className="mx-2.5 text-tide/60" aria-hidden>
              ·
            </span>
            {project.period}
          </p>
        </div>

        {provisional ? (
          <span className="label shrink-0 rounded-full border border-sun/45 px-4 py-1.5 text-sun">
            {t.work.wip}
          </span>
        ) : null}
      </header>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foam/90">
        <span className="label mr-3 align-middle text-mist">
          {t.work.roleLabel}
        </span>
        {project.role[lang]}
      </p>

      {provisional ? null : (
        <>
          <div className="mt-8 max-w-2xl space-y-4">
            <p className="lead text-pretty text-foam/90">
              {project.action[lang]}
            </p>
            <p className="text-base leading-relaxed text-mist">
              {project.result[lang]}
            </p>
          </div>

          {project.metrics && project.metrics.length > 0 ? (
            <dl className="mt-10 grid gap-y-8 border-t border-rule pt-8 sm:grid-cols-3 sm:gap-x-8">
              {project.metrics.map((metric) => (
                <div key={metric.label[lang]}>
                  <dt className="heading-2 leading-none text-foam">
                    {metric.value}
                  </dt>
                  <dd className="label mt-3 text-mist">
                    {metric.label[lang]}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-10">
            <p className="label text-mist">{t.work.stackLabel}</p>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {project.stack.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-rule px-3.5 py-1.5 font-sans text-xs tracking-wide text-mist transition-colors duration-300 hover:border-tide/50 hover:text-foam"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          {project.links && project.links.length > 0 ? (
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
              {project.links.map((link) => (
                <Button
                  key={link.href}
                  variant="link"
                  size="sm"
                  href={link.href}
                  ariaLabel={`${link.label} — ${project.title}`}
                >
                  {link.label}
                  <span className="text-sun" aria-hidden>
                    ↗
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

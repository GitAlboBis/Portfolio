"use client";

import { Fragment } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { projectsSorted, type Project } from "@/data/projects";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const ordinal = (n: number) => String(n).padStart(2, "0");

export function WorkSection() {
  const { lang, t } = useLanguage();

  return (
    <section id="work" className="scroll-mt-24 py-24 sm:py-32 md:py-40">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t.work.eyebrow}
            title={t.work.heading}
            lead={t.work.lead}
          />
        </Reveal>

        <div className="mt-20 sm:mt-28 md:mt-32">
          {projectsSorted.map((project, i) => (
            <Fragment key={project.slug}>
              {i > 0 ? (
                <div className="rule-node my-16 sm:my-20 md:my-24" aria-hidden />
              ) : null}
              <Reveal delay={i === 0 ? 0 : 80}>
                <ProjectCard
                  project={project}
                  lang={lang}
                  t={t}
                  index={i}
                />
              </Reveal>
            </Fragment>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProjectCard({
  project,
  lang,
  t,
  index,
}: {
  project: Project;
  lang: "en" | "it";
  t: ReturnType<typeof useLanguage>["t"];
  index: number;
}) {
  const provisional = project.status === "provisional";
  // Broken grid: even rows hug the left rail, odd rows shift right — intentional asymmetry.
  const offset = index % 2 === 0 ? "md:mr-auto md:max-w-4xl" : "md:ml-auto md:max-w-4xl";

  return (
    <article
      className={cn(
        "group relative",
        offset,
        provisional && "opacity-60",
      )}
    >
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-[auto_1fr]">
        {/* Depth coordinate — the order number as a mono marker */}
        <div className="flex items-baseline gap-4 md:flex-col md:items-start md:gap-3 md:pt-2">
          <span className="font-mono text-sm tabular-nums text-aqua/70">
            {ordinal(project.order)}
          </span>
          <span
            className="hidden h-16 w-px bg-rule md:block"
            aria-hidden
          />
        </div>

        <div className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
            <div className="min-w-0">
              <h3 className="heading-2 text-foam">{project.title}</h3>
              <p className="eyebrow mt-3 text-ink-mute">
                {project.org}
                <span className="mx-2 text-aqua/40" aria-hidden>
                  /
                </span>
                {project.period}
              </p>
            </div>

            {provisional ? (
              <span className="eyebrow shrink-0 border border-aqua/40 px-3 py-1.5 text-aqua">
                {t.work.wip}
              </span>
            ) : null}
          </header>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-mute">
            <span className="text-foam">{t.work.roleLabel}</span>
            <span className="mx-2 text-aqua/40" aria-hidden>
              —
            </span>
            {project.role[lang]}
          </p>

          {provisional ? null : (
            <>
              <div className="mt-8 max-w-2xl space-y-4">
                <p className="lead text-pretty text-foam/90">
                  {project.action[lang]}
                </p>
                <p className="text-base leading-relaxed text-ink-mute">
                  {project.result[lang]}
                </p>
              </div>

              {project.metrics && project.metrics.length > 0 ? (
                <dl className="mt-10 grid gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-3">
                  {project.metrics.map((metric) => (
                    <div
                      key={metric.label[lang]}
                      className="bg-abyss px-5 py-6"
                    >
                      <dt className="font-display text-3xl italic leading-none text-foam sm:text-4xl">
                        {metric.value}
                      </dt>
                      <dd className="eyebrow mt-3 text-ink-mute">
                        {metric.label[lang]}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="mt-10">
                <p className="eyebrow text-ink-mute">{t.work.stackLabel}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="border border-rule px-3 py-1.5 font-mono text-xs tracking-wide text-ink-mute transition-colors duration-300 hover:border-aqua/40 hover:text-foam"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              {project.links && project.links.length > 0 ? (
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                  {project.links.map((link) => (
                    <Button
                      key={link.href}
                      variant="link"
                      size="sm"
                      href={link.href}
                      ariaLabel={`${link.label} — ${project.title}`}
                    >
                      {link.label}
                      <span aria-hidden>↗</span>
                    </Button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

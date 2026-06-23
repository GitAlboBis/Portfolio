"use client";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/components/language-provider";
import { skillGroups } from "@/data/skills";

export function SkillsSection() {
  const { lang, t } = useLanguage();

  return (
    <section id="skills" className="scroll-mt-24 py-24 sm:py-32 md:py-40">
      <Container>
        <Reveal>
          <header className="flex flex-col gap-5">
            <Eyebrow>{t.skills.eyebrow}</Eyebrow>
            <h2 className="heading-1 max-w-2xl text-balance text-foam">
              {t.skills.heading}
            </h2>
          </header>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 flex items-center gap-6 sm:mt-16">
            <div className="rule-node flex-1" />
            <span className="font-mono text-[0.6875rem] tracking-[0.28em] text-ink-mute/70 uppercase">
              {String(skillGroups.length).padStart(2, "0")} / {t.skills.eyebrow}
            </span>
          </div>
        </Reveal>

        <ol className="mt-10 grid grid-cols-1 gap-x-10 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <li
              key={group.label.en}
              className={offsetFor(i)}
            >
              <Reveal delay={i * 80} className="h-full">
                <article className="group relative flex h-full flex-col gap-6 border-t border-rule py-9">
                  <span
                    aria-hidden
                    className="absolute top-9 right-0 font-mono text-[0.625rem] tracking-[0.28em] text-ink-mute/40 tabular-nums transition-colors duration-300 group-hover:text-aqua"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <h3 className="flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.28em] text-foam uppercase">
                    <span
                      aria-hidden
                      className="block size-[5px] rotate-45 bg-aqua/50 transition-colors duration-300 group-hover:bg-aqua"
                    />
                    {group.label[lang]}
                  </h3>

                  <ul className="flex flex-col gap-2.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="font-mono text-sm text-ink-mute transition-colors duration-300 hover:text-foam"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* Intentional asymmetry: nudge alternating cells off the baseline so the grid
   reads as an editorial broken column, never a flat table. Disabled below sm. */
function offsetFor(i: number): string {
  const pattern = ["", "lg:mt-14", "lg:mt-7"];
  return pattern[i % pattern.length];
}

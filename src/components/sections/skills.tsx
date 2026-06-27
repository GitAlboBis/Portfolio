"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/components/language-provider";
import { skillGroups } from "@/data/skills";

/*
  SkillsSection — Cinematic Ocean (NatGeo lineage). Lives in the deep sea:
  white serif on abyss, one small sans label per group, items as quiet serif
  chips that lift to foam on hover. A clean, regular 1/2/3 grid — no mono,
  no depth coordinate, no staggered "broken column" gimmick. Calm and editorial.
*/
export function SkillsSection() {
  const { lang, t } = useLanguage();

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="scroll-mt-24 py-28 sm:py-36 md:py-44"
    >
      <Container>
        <Reveal variant="clip-up">
          <header className="flex max-w-2xl flex-col gap-5">
            <p className="label">{t.skills.eyebrow}</p>
            <h2 id="skills-heading" className="heading-1 text-balance text-foam">
              {t.skills.heading}
            </h2>
          </header>
        </Reveal>

        <Reveal variant="clip-up" delay={120}>
          <div className="rule-node mt-12 sm:mt-16" aria-hidden />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-12 sm:mt-16 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <Reveal
              key={group.label.en}
              variant="clip-up"
              delay={i * 90}
              className="h-full"
            >
              <article className="flex h-full flex-col gap-5 border-t border-rule pt-7">
                <h3 className="label text-mist">{group.label[lang]}</h3>

                <ul className="flex flex-col gap-2.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="text-base leading-relaxed text-mist transition-colors duration-300 hover:text-foam sm:text-lg"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

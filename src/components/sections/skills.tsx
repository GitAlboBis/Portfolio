"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useScrollParallax } from "@/components/descending-world";
import { useLanguage } from "@/components/language-provider";
import { skillGroups } from "@/data/skills";
import { TechCloud } from "@/components/tech-cloud";
import { PressureHeading } from "@/components/pressure-heading";
import { FlipFadeText } from "@/components/flip-fade-text";

/*
  SkillsSection — Cinematic Ocean (NatGeo lineage). Lives in the deep sea:
  white serif on abyss, one small sans label per group, items as quiet serif
  chips that lift to foam on hover. A clean, regular 1/2/3 grid — no mono,
  no depth coordinate, no staggered "broken column" gimmick. Calm and editorial.
*/
export function SkillsSection() {
  const { lang, t } = useLanguage();
  // The skills header hangs a little shallower than the grid below it.
  const headerRef = useScrollParallax<HTMLDivElement>(24);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="scroll-mt-24 py-28 sm:py-36 md:py-44"
    >
      <Container>
        <Reveal variant="clip-up">
          <header ref={headerRef} className="flex max-w-2xl flex-col gap-5">
            <FlipFadeText as="p" className="label" text={t.skills.eyebrow} />
            <PressureHeading
              as="h2"
              id="skills-heading"
              className="heading-1 text-balance text-foam"
            >
              {t.skills.heading}
            </PressureHeading>
          </header>
        </Reveal>

        <Reveal variant="clip-up" delay={120}>
          <div className="rule-node mt-12 sm:mt-16" aria-hidden />
        </Reveal>

        {/* Tech constellation — a draggable 3D sphere of the live skill set
            (Magic UI Icon Cloud technique, ocean-adapted). */}
        <Reveal variant="clip-up" delay={180}>
          <div className="mt-14 sm:mt-20">
            <TechCloud />
          </div>
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

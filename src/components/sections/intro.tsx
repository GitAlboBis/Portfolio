"use client";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/components/language-provider";

export function Intro() {
  const { t } = useLanguage();

  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="scroll-mt-24 py-24 sm:py-32 md:py-40"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-10 lg:gap-x-16">
          <Reveal className="md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-5">
              <Eyebrow className="md:[writing-mode:vertical-rl] md:rotate-180 md:tracking-[0.4em]">
                {t.intro.eyebrow}
              </Eyebrow>
              <span
                aria-hidden
                className="h-px w-10 bg-rule md:h-24 md:w-px"
              />
            </div>
          </Reveal>

          <div className="md:col-span-9 lg:col-span-10">
            <Reveal delay={80}>
              <h2
                id="intro-heading"
                className="heading-1 max-w-[16ch] text-balance text-foam md:-ml-[0.04em]"
              >
                {t.intro.heading}
              </h2>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-x-16 gap-y-10 md:mt-16 md:grid-cols-12">
              <Reveal delay={160} className="md:col-span-7 md:col-start-2">
                <p className="max-w-2xl text-lg leading-relaxed text-foam sm:text-xl">
                  {t.intro.body1}
                </p>
              </Reveal>

              <div className="md:col-span-10 md:col-start-2">
                <Reveal delay={200}>
                  <div className="rule-node my-2 md:my-4" aria-hidden />
                </Reveal>
              </div>

              <Reveal delay={280} className="md:col-span-6 md:col-start-6">
                <p className="max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg">
                  {t.intro.body2}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

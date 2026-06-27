"use client";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealText } from "@/components/ui/reveal";
import { useLanguage } from "@/components/language-provider";

/*
  Intro / About — Cinematic Ocean, deep-sea register.
  Calm editorial composition: small sans label, a grand white serif statement,
  then two reading-width serif paragraphs separated by a hairline node.
  No vertical depth rail, no HUD coordinates — measured NatGeo confidence.
*/
export function Intro() {
  const { t } = useLanguage();

  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="scroll-mt-24 py-28 sm:py-36 md:py-44"
    >
      <Container>
        <div className="max-w-4xl">
          <Reveal>
            <Eyebrow>{t.intro.eyebrow}</Eyebrow>
          </Reveal>

          {/* The statement surfaces word-by-word behind a tide-line mask. */}
          <RevealText
            id="intro-heading"
            text={t.intro.heading}
            delay={90}
            className="heading-1 mt-6 max-w-[18ch] text-balance text-foam sm:mt-8"
          />

          <Reveal variant="mask-wipe" delay={240}>
            <p className="mt-10 max-w-2xl text-pretty text-lg leading-relaxed text-foam sm:mt-12 sm:text-xl">
              {t.intro.body1}
            </p>
          </Reveal>

          <Reveal variant="mask-wipe" delay={320} className="max-w-2xl">
            <div className="rule-node my-10 sm:my-12" aria-hidden />
          </Reveal>

          <Reveal variant="mask-wipe" delay={400}>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-mist sm:text-xl">
              {t.intro.body2}
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

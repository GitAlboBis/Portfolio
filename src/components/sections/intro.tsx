"use client";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealText } from "@/components/ui/reveal";
import { ScrollText } from "@/components/scroll-text";
import { useScrollParallax } from "@/components/descending-world";
import { useLanguage } from "@/components/language-provider";

/*
  Intro / About — Cinematic Ocean, deep-sea register.
  Calm editorial composition: small sans label, a grand white serif statement,
  then two reading-width serif paragraphs separated by a hairline node.
  No vertical depth rail, no HUD coordinates — measured NatGeo confidence.
*/
export function Intro() {
  const { t } = useLanguage();
  // First descent below the fold — the statement drifts a touch as you sink.
  const blockRef = useScrollParallax<HTMLDivElement>(26);

  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="scroll-mt-24 py-28 sm:py-36 md:py-44"
    >
      <Container>
        <div ref={blockRef} className="max-w-4xl">
          <Reveal>
            <Eyebrow>{t.intro.eyebrow}</Eyebrow>
          </Reveal>

          {/* The statement surfaces word-by-word, scrubbed by scroll, like a
              tide-line breaking the surface (ui-layouts/Codrops scroll-text). */}
          <ScrollText
            as="h2"
            id="intro-heading"
            className="heading-1 mt-6 max-w-[18ch] text-balance text-foam sm:mt-8"
          >
            {t.intro.heading}
          </ScrollText>

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

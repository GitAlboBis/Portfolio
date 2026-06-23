"use client";

import { useLanguage } from "@/components/language-provider";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

/*
  S1 — Hero. Full-viewport DOM overlay ABOVE the persistent WebGL water-logo
  canvas (which is fixed at -z-10). Transparent background so the canvas reads
  through; the canvas receives the mouse everywhere except over real text.
  Editorial, bottom-left anchored, asymmetric — the first three seconds.
*/
export function Hero() {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen scroll-mt-24 flex-col justify-end overflow-hidden pb-16 pt-32 sm:pb-20 md:pb-24"
    >
      <Container className="relative">
        {/* asymmetric editorial grid: content hugs the lower-left, never centered */}
        <div className="grid grid-cols-12">
          <div className="col-span-12 flex flex-col gap-8 md:col-span-10 lg:col-span-8">
            <Reveal>
              <div className="flex items-center gap-4">
                <span aria-hidden className="h-px w-10 bg-rule" />
                <Eyebrow>{t.hero.role}</Eyebrow>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h1 className="heading-display text-foam">
                Alberto
                <br />
                <span className="text-foam/90">Tuveri</span>
              </h1>
            </Reveal>

            <Reveal delay={240}>
              <p className="lead max-w-md text-pretty md:max-w-lg">
                {t.hero.tagline}
              </p>
            </Reveal>
          </div>
        </div>
      </Container>

      {/* discreet scroll cue, lower-right — counterweight to the lower-left title */}
      <Container className="relative mt-16 sm:mt-20">
        <Reveal delay={420} className="flex justify-end">
          <div className="flex items-center gap-3 text-ink-mute transition-colors duration-300 hover:text-aqua">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
              {t.hero.scrollCue}
            </span>
            <span
              aria-hidden
              className="text-sm leading-none animate-bounce motion-reduce:animate-none"
            >
              ↓
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

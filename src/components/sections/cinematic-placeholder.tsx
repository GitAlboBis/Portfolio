"use client";

import { useLanguage } from "@/components/language-provider";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

/*
  S3 — Cinematic (Pan di Zucchero -> backflip dive). PLACEHOLDER until Gate 5/7:
  this band will host the Higgsfield video scrubbed by scroll + WebGL overlay
  (see docs/05-CINEMATIC-SCROLL.md). For now it holds the narrative beat and the
  scroll height, themed as a descent.
*/
export function CinematicPlaceholder() {
  const { t } = useLanguage();

  return (
    <section
      id="cinematic"
      className="relative flex min-h-screen scroll-mt-24 items-center justify-center overflow-hidden"
      aria-label="Cinematic — Pan di Zucchero"
    >
      {/* depth gradient: surface -> abyss, evoking the descent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-deep) 50%, transparent) 0%, var(--color-abyss) 70%)",
        }}
      />
      <Container className="relative z-10">
        <Reveal className="flex flex-col items-center gap-6 text-center">
          <Eyebrow>{t.cinematic.eyebrow}</Eyebrow>
          <p className="heading-2 max-w-2xl text-balance text-foam/90">
            {t.cinematic.caption}
          </p>
          <div className="mt-2 flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-mute">
              ↓
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

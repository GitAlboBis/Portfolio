"use client";

import { useLanguage } from "@/components/language-provider";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

/*
  S3 — Cinematic (Pan di Zucchero -> backflip dive). PLACEHOLDER until Gate 5/7.
  This full-bleed band evokes THE DESCENT into the deep sea: a quiet, cinematic
  gradient from the mid-sea down into the abyss. In the future it will host the
  Higgsfield video, scroll-scrubbed, with a WebGL overlay on top of this same
  gradient slot (see docs/05-CINEMATIC-SCROLL.md). For now it carries the
  narrative beat and reserves the scroll height.
*/
export function CinematicPlaceholder() {
  const { t } = useLanguage();

  return (
    <section
      id="cinematic"
      className="relative flex min-h-screen scroll-mt-24 items-center justify-center overflow-hidden bg-abyss py-28 sm:py-36 md:py-44"
      aria-label="Cinematic — Pan di Zucchero"
    >
      {/* Descent gradient: mid-sea surface fading down into the abyss.
          NOTE: future video frame mounts here, beneath the caption overlay. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--color-deep) 0%, color-mix(in oklab, var(--color-deep) 70%, var(--color-abyss)) 38%, var(--color-abyss) 100%)",
        }}
      />
      {/* Faint settling light from the surface — keeps the top from going flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, var(--color-tide) 14%, transparent) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <Eyebrow>{t.cinematic.eyebrow}</Eyebrow>

          <p className="heading-2 text-balance text-foam/90">
            {t.cinematic.caption}
          </p>

          {/* Quiet descent marker — a single hairline trailing into the deep,
              tipped with the rare warm accent. */}
          <span
            aria-hidden
            className="mt-2 flex flex-col items-center gap-3 text-mist"
          >
            <span className="h-16 w-px bg-rule sm:h-20" />
            <span className="text-lg leading-none text-sun/90">↓</span>
          </span>
        </Reveal>
      </Container>
    </section>
  );
}

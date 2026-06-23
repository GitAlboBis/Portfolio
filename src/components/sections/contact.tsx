"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLanguage } from "@/components/language-provider";

/*
  Contact — the deepest point of the descent. Cinematic close on deep sea:
  white serif heading, generous negative space, one warm golden CTA (the rare
  accent), frosted water-glass social pills, and a calm closing line. NatGeo
  measured, never HUD. No mono, no depth rails.
*/

const SOCIALS = [
  { label: "LinkedIn", href: "https://linkedin.com/in/albertotuveri" },
  { label: "GitHub", href: "https://github.com/GitAlboBis" },
] as const;

export function Contact() {
  const { t } = useLanguage();

  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-abyss py-28 text-foam sm:py-36 md:py-44"
    >
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <Reveal>
            <SectionHeading
              eyebrow={t.contact.eyebrow}
              title={t.contact.heading}
              lead={t.contact.lead}
              align="center"
            />
          </Reveal>

          <Reveal delay={120} className="mt-14 sm:mt-16">
            <Button variant="signal" href="mailto:albertotuveri@gmail.com">
              {t.contact.emailCta}
              <span aria-hidden="true">→</span>
            </Button>
          </Reveal>

          <Reveal delay={200} className="mt-8">
            <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <Button
                    variant="outline"
                    href={social.href}
                    ariaLabel={social.label}
                  >
                    {social.label}
                    <span aria-hidden="true">↗</span>
                  </Button>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={280} className="mx-auto mt-20 max-w-sm sm:mt-28">
          <div className="rule-node" />
          <p className="label mt-8 text-center">{t.contact.availability}</p>
        </Reveal>
      </Container>
    </section>
  );
}

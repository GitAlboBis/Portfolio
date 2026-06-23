"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLanguage } from "@/components/language-provider";

const SOCIALS = [
  { label: "LinkedIn", href: "https://linkedin.com/in/albertotuveri" },
  { label: "GitHub", href: "https://github.com/GitAlboBis" },
] as const;

export function Contact() {
  const { t } = useLanguage();

  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-rule py-24 sm:py-32 md:py-40"
    >
      <Container>
        <div className="flex flex-col items-center">
          <Reveal>
            <SectionHeading
              eyebrow={t.contact.eyebrow}
              title={t.contact.heading}
              lead={t.contact.lead}
              align="center"
            />
          </Reveal>

          <Reveal delay={120} className="mt-12 sm:mt-16">
            <Button variant="signal" href="mailto:albertotuveri@gmail.com">
              {t.contact.emailCta}
              <span aria-hidden="true">→</span>
            </Button>
          </Reveal>

          <Reveal delay={200} className="mt-10 w-full max-w-md">
            <ul className="flex flex-col items-stretch gap-px overflow-hidden border-t border-b border-rule">
              {SOCIALS.map((social) => (
                <li key={social.label} className="border-b border-rule last:border-b-0">
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="group flex items-center justify-between py-4 font-mono text-xs uppercase tracking-[0.18em] text-ink-mute transition-colors duration-300 hover:text-aqua"
                  >
                    <span>{social.label}</span>
                    <span
                      aria-hidden="true"
                      className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={280} className="mt-20 sm:mt-28">
          <div className="rule-node" />
          <div className="mt-8 text-center">
            <Eyebrow className="text-ink-mute">{t.contact.availability}</Eyebrow>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

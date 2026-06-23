"use client";

import { useLanguage } from "@/components/language-provider";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const SOCIAL = [
  { label: "LinkedIn", href: "https://linkedin.com/in/albertotuveri" },
  { label: "GitHub", href: "https://github.com/GitAlboBis" },
  { label: "Email", href: "mailto:albertotuveri@gmail.com" },
] as const;

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="relative py-24 sm:py-28 md:py-32">
      <Container>
        <div className="rule-node mb-20 sm:mb-24" aria-hidden />

        <Reveal>
          {/* Broken grid: the tagline owns the left field, the index hugs the right. */}
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7 lg:col-span-6">
              <p className="heading-2 max-w-xl text-balance italic text-foam">
                {t.footer.tagline}
              </p>
            </div>

            <nav
              aria-label="Social"
              className="md:col-span-4 md:col-start-9 lg:col-span-3 lg:col-start-10"
            >
              <ul className="flex flex-col gap-px">
                {SOCIAL.map(({ label, href }) => {
                  const external = href.startsWith("http");
                  return (
                    <li key={label}>
                      <a
                        href={href}
                        aria-label={label}
                        className="group inline-flex items-baseline gap-2 py-2 font-mono text-xs uppercase tracking-[0.22em] text-ink-mute transition-colors duration-300 hover:text-aqua"
                        {...(external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                      >
                        <span>{label}</span>
                        <span
                          aria-hidden
                          className="text-aqua/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-aqua"
                        >
                          ↗
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-24 flex flex-col gap-6 sm:mt-28 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-ink-mute">
              <span>{t.footer.location}</span>
              <span>{t.footer.builtWith}</span>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-mute">
              © 2026 <span className="text-foam">Alberto Tuveri</span> ·{" "}
              {t.footer.rights}
            </p>
          </div>
        </Reveal>
      </Container>
    </footer>
  );
}

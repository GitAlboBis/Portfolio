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
    <footer className="relative bg-abyss py-24 sm:py-28 md:py-32">
      <Container>
        <div className="rule-node mb-16 sm:mb-20" aria-hidden />

        <Reveal>
          {/* Calm editorial close: tagline leads, the rest settles quietly below. */}
          <p className="lead max-w-xl text-balance italic text-foam">
            {t.footer.tagline}
          </p>
        </Reveal>

        <Reveal delay={120}>
          <nav aria-label="Social" className="mt-12 sm:mt-14">
            <ul className="flex flex-wrap gap-x-10 gap-y-4">
              {SOCIAL.map(({ label, href }) => {
                const external = href.startsWith("http");
                return (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      className="group inline-flex items-baseline gap-2 text-mist transition-colors duration-300 hover:text-foam"
                      {...(external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                    >
                      <span className="label text-current">{label}</span>
                      <span
                        aria-hidden
                        className="text-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-20 flex flex-col gap-8 sm:mt-24 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <span className="label">{t.footer.location}</span>
              <span className="label">{t.footer.builtWith}</span>
            </div>

            <p className="label">
              © 2026 <span className="text-foam">Alberto Tuveri</span> ·{" "}
              {t.footer.rights}
            </p>
          </div>
        </Reveal>
      </Container>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useScrollStore } from "@/webgl/store/scrollStore";
import { cn } from "@/lib/utils";
import type { Lang } from "@/data/translations/types";

const SECTIONS = ["work", "about", "skills", "contact"] as const;
type SectionKey = (typeof SECTIONS)[number];

const HREF: Record<SectionKey, string> = {
  work: "#work",
  about: "#about",
  skills: "#skills",
  contact: "#contact",
};

function LangToggle({
  lang,
  setLang,
  className,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  className?: string;
}) {
  const langs: Lang[] = ["en", "it"];
  return (
    <div
      className={cn(
        "flex items-center font-mono text-[0.65rem] uppercase tracking-[0.2em]",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {langs.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1 text-foam/20">/</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={cn(
              "transition-colors duration-300",
              lang === l ? "text-aqua" : "text-ink-mute hover:text-foam",
            )}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

export function SiteNav() {
  const { lang, t, setLang } = useLanguage();
  const scrolled = useScrollStore((s) => s.progress > 0.02);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-rule bg-abyss/70 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:h-20 sm:px-8 lg:px-12"
      >
        <a
          href="#hero"
          className="group relative font-display text-2xl font-semibold leading-none tracking-tight text-foam transition-colors duration-300 hover:text-aqua sm:text-[1.7rem]"
          aria-label="Alberto Tuveri — home"
        >
          AT
          <span
            aria-hidden
            className={cn(
              "absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-aqua transition-transform duration-500 group-hover:scale-x-100",
              scrolled && "bg-aqua",
            )}
          />
        </a>

        <div className="hidden items-center gap-9 md:flex">
          <ul className="flex items-center gap-7 font-mono text-[0.7rem] uppercase tracking-[0.2em]">
            {SECTIONS.map((key) => (
              <li key={key}>
                <a
                  href={HREF[key]}
                  className="text-ink-mute transition-colors duration-300 hover:text-foam"
                >
                  {t.nav[key]}
                </a>
              </li>
            ))}
          </ul>

          <span aria-hidden className="h-4 w-px bg-rule" />

          <LangToggle lang={lang} setLang={setLang} />

          <Button size="sm" variant="signal" href="mailto:albertotuveri@gmail.com">
            {t.nav.cta}
          </Button>
        </div>

        <div className="flex items-center gap-5 md:hidden">
          <LangToggle lang={lang} setLang={setLang} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] text-foam"
          >
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-300",
                open && "translate-y-[6px] rotate-45",
              )}
            />
            <span
              className={cn(
                "block h-px w-6 bg-current transition-opacity duration-300",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-300",
                open && "-translate-y-[6px] -rotate-45",
              )}
            />
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-0 z-40 flex flex-col bg-abyss md:hidden"
        >
          <div className="h-16 sm:h-20" aria-hidden />
          <div className="flex flex-1 flex-col justify-between px-6 pb-12 pt-8 sm:px-8">
            <ul className="flex flex-col gap-2">
              {SECTIONS.map((key, i) => (
                <li key={key} className="border-b border-rule">
                  <a
                    href={HREF[key]}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-5 text-foam transition-colors duration-300 hover:text-aqua"
                  >
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-aqua/50">
                      0{i + 1}
                    </span>
                    <span className="heading-2">{t.nav[key]}</span>
                    <span aria-hidden className="ml-auto text-ink-mute">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <Button
              size="md"
              variant="signal"
              href="mailto:albertotuveri@gmail.com"
              className="mt-10 w-full"
            >
              {t.nav.cta}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

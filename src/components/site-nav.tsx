"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useScrollStore } from "@/webgl/store/scrollStore";
import { cn } from "@/lib/utils";
import type { Lang } from "@/data/translations/types";

/*
  SiteNav — Cinematic Ocean (NatGeo "Into the Amazon" lineage).
  Calm, editorial, confident. Transparent over the hero; after a little
  descent it settles into a thin deep-sea bar (abyss/80 + blur + hairline).
  No monospace, no electric cyan, no HUD chapter coordinates. Nav links are
  spaced sans small-caps (.label) in mist→foam; the single warm accent (sun)
  is reserved for the primary CTA and one hairline micro-marker.
*/

const SECTIONS = ["work", "about", "skills", "contact"] as const;
type SectionKey = (typeof SECTIONS)[number];

const HREF: Record<SectionKey, string> = {
  work: "#work",
  about: "#about",
  skills: "#skills",
  contact: "#contact",
};

const MAILTO = "mailto:albertotuveri@gmail.com";

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
      className={cn("label flex items-center gap-1 text-mist", className)}
      role="group"
      aria-label="Language"
    >
      {langs.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && (
            <span aria-hidden className="px-1.5 text-foam/25">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={cn(
              "inline-flex min-h-[44px] items-center px-1 uppercase transition-colors duration-300",
              lang === l ? "text-foam" : "text-mist hover:text-foam",
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
  // No per-frame re-render: select a boolean derived from progress.
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
        "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-500",
        scrolled
          ? "border-b border-rule bg-abyss/80 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:h-20 sm:px-8 lg:px-12"
      >
        {/* Monogram — serif, links to hero */}
        <a
          href="#hero"
          onClick={() => setOpen(false)}
          className="group relative font-display text-2xl font-semibold leading-none tracking-tight text-foam transition-colors duration-300 hover:text-tide sm:text-[1.7rem]"
          aria-label="Alberto Tuveri — home"
        >
          AT
          <span
            aria-hidden
            className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-tide transition-transform duration-500 group-hover:scale-x-100"
          />
        </a>

        {/* Desktop cluster */}
        <div className="hidden items-center gap-9 md:flex">
          <ul className="label flex items-center gap-7 text-mist">
            {SECTIONS.map((key) => (
              <li key={key}>
                <a
                  href={HREF[key]}
                  className="text-mist transition-colors duration-300 hover:text-foam"
                >
                  {t.nav[key]}
                </a>
              </li>
            ))}
          </ul>

          <span aria-hidden className="h-4 w-px bg-rule" />

          <LangToggle lang={lang} setLang={setLang} />

          <Button size="sm" variant="signal" href={MAILTO}>
            {t.nav.cta}
          </Button>
        </div>

        {/* Mobile cluster */}
        <div className="flex items-center gap-5 md:hidden">
          <LangToggle lang={lang} setLang={setLang} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] text-foam"
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

      {/* Mobile overlay — deep sea, serif, generous negative space */}
      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-0 z-40 flex flex-col bg-abyss md:hidden"
        >
          <div className="h-16 sm:h-20" aria-hidden />
          <div className="flex flex-1 flex-col justify-between px-6 pb-12 pt-10 sm:px-8">
            <ul className="flex flex-col">
              {SECTIONS.map((key) => (
                <li key={key} className="border-b border-rule">
                  <a
                    href={HREF[key]}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 py-6 text-foam transition-colors duration-300 hover:text-tide"
                  >
                    {/* single warm micro-marker, gold, used rarely */}
                    <span
                      aria-hidden
                      className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-sun opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <span className="heading-2">{t.nav[key]}</span>
                    <span
                      aria-hidden
                      className="ml-auto self-center text-mist transition-colors duration-300 group-hover:text-tide"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <Button
              size="md"
              variant="signal"
              href={MAILTO}
              className="mt-12 w-full"
            >
              {t.nav.cta}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

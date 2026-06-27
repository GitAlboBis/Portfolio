"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
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

const SECTIONS = ["about", "work", "skills", "contact"] as const;
type SectionKey = (typeof SECTIONS)[number];

const HREF: Record<SectionKey, string> = {
  work: "#work",
  about: "#about",
  skills: "#skills",
  contact: "#contact",
};

/** DOM id each nav link targets — the source of truth for scroll-spy. */
const SECTION_ID: Record<SectionKey, string> = {
  work: "work",
  about: "about",
  skills: "skills",
  contact: "contact",
};

const MAILTO = "mailto:albertotuveri@gmail.com";

/*
  Language endonyms: a language is named in its own tongue regardless of the
  surrounding UI locale ("English" stays "English", "Italiano" stays
  "Italiano"), so these are static and need no translation file. Used for the
  accessible name (aria-label) and the lang attribute of each toggle button,
  and to announce the switch politely in the language being switched TO.
*/
const LANG_NAME: Record<Lang, string> = {
  en: "English",
  it: "Italiano",
};

function LangToggle({
  lang,
  setLang,
  onSwitch,
  className,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onSwitch: (l: Lang) => void;
  className?: string;
}) {
  const langs: Lang[] = ["en", "it"];
  return (
    <div
      className={cn("label flex items-center gap-1 text-mist", className)}
      role="group"
      aria-label="Language"
    >
      {langs.map((l, i) => {
        const active = lang === l;
        return (
          <span key={l} className="flex items-center">
            {i > 0 && (
              <span aria-hidden className="px-1.5 text-foam/25">
                /
              </span>
            )}
            <button
              type="button"
              lang={l}
              onClick={() => {
                if (active) return;
                setLang(l);
                onSwitch(l);
              }}
              aria-pressed={active}
              aria-label={LANG_NAME[l]}
              className={cn(
                "inline-flex min-h-[44px] items-center px-1 uppercase transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tide focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
                active ? "text-foam" : "text-mist hover:text-foam",
              )}
            >
              {l}
            </button>
          </span>
        );
      })}
    </div>
  );
}

/** Selectors for tabbable elements inside the mobile overlay (focus trap). */
const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteNav() {
  const { lang, t, setLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  /** Active section for scroll-spy; null until the first section is in view. */
  const [active, setActive] = useState<SectionKey | null>(null);
  /** Politely announced message when the language is switched. */
  const [langAnnounce, setLangAnnounce] = useState("");

  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Settled-bar state: thin deep-sea bar after a short descent. Reads scroll
  // directly (passive) instead of subscribing to the per-frame scroll store.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: observe the real section elements the nav links target.
  useEffect(() => {
    const els = SECTIONS.map((key) =>
      document.getElementById(SECTION_ID[key]),
    ).filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // Map element -> nav key for resolving the most-visible entry.
    const keyFor = new Map<Element, SectionKey>();
    for (const key of SECTIONS) {
      const el = document.getElementById(SECTION_ID[key]);
      if (el) keyFor.set(el, key);
    }
    const ratios = new Map<Element, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(
            entry.target,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }
        let best: SectionKey | null = null;
        let bestRatio = 0;
        for (const [el, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = keyFor.get(el) ?? null;
          }
        }
        if (best) setActive(best);
      },
      {
        // Bias the active band to the upper-middle of the viewport so a
        // section reads active as its content rises into view.
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);

  // Mobile overlay: Escape to close, body scroll lock, focus trap, and
  // restore focus to the hamburger on close.
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !overlay) return;
      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || !overlay.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Move focus to the first link inside the overlay on open.
    const firstLink = overlay?.querySelector<HTMLElement>(FOCUSABLE);
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Return focus to the control that opened the menu.
      hamburgerRef.current?.focus();
    };
  }, [open]);

  // Announce the language switch politely, in the language switched to.
  const announceLang = useCallback((l: Lang) => {
    // Re-set to "" first so the same value re-announces on repeat toggles.
    setLangAnnounce("");
    requestAnimationFrame(() => setLangAnnounce(LANG_NAME[l]));
  }, []);

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
            {SECTIONS.map((key) => {
              const isActive = active === key;
              return (
                <li key={key}>
                  <a
                    href={HREF[key]}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group relative inline-flex py-1 transition-colors duration-300 hover:text-foam focus-visible:outline-none focus-visible:text-foam",
                      isActive ? "text-foam" : "text-mist",
                    )}
                  >
                    {t.nav[key]}
                    {/* Non-color-only active indicator: an underline that is
                        present (not just tinted) when active. Animated unless
                        the user prefers reduced motion. */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-tide transition-transform duration-500 ease-out motion-reduce:transition-none",
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          <span aria-hidden className="h-4 w-px bg-rule" />

          <LangToggle lang={lang} setLang={setLang} onSwitch={announceLang} />

          <Button size="sm" variant="signal" href={MAILTO}>
            {t.nav.cta}
          </Button>
        </div>

        {/* Mobile cluster */}
        <div className="flex items-center gap-5 md:hidden">
          <LangToggle lang={lang} setLang={setLang} onSwitch={announceLang} />
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] text-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tide focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
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

      {/* Mobile overlay — deep sea, serif, generous negative space.
          Rendered only when open; a full-bleed fixed dialog with a Tab focus
          trap keeps interaction confined here while it is up. */}
      {open && (
        <div
          ref={overlayRef}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 top-0 z-40 flex flex-col overscroll-contain bg-abyss md:hidden"
        >
          <div className="h-16 sm:h-20" aria-hidden />
          <div className="flex flex-1 flex-col justify-between overflow-y-auto overscroll-contain px-6 pb-12 pt-10 sm:px-8">
            <ul className="flex flex-col">
              {SECTIONS.map((key) => {
                const isActive = active === key;
                return (
                  <li key={key} className="border-b border-rule">
                    <a
                      href={HREF[key]}
                      onClick={closeMenu}
                      aria-current={isActive ? "true" : undefined}
                      className="group flex items-baseline gap-4 py-6 text-foam transition-colors duration-300 hover:text-tide focus-visible:outline-none focus-visible:text-tide"
                    >
                      {/* Warm micro-marker — also the non-color-only active
                          cue: filled & full-opacity when the section is active. */}
                      <span
                        aria-hidden
                        className={cn(
                          "mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-sun transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none",
                          isActive ? "opacity-100" : "opacity-40",
                        )}
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
                );
              })}
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

      {/* Polite live region: announces the active language after a switch,
          spoken in the language switched to (matching lang attribute). */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        lang={lang}
      >
        {langAnnounce}
      </span>
    </header>
  );
}

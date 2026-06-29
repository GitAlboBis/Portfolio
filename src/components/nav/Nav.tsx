"use client";

import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { MenuOverlay } from "@/components/nav/MenuOverlay";

type Lenis = { scrollTo: (t: HTMLElement | number, o?: { offset?: number }) => void };

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis?.scrollTo) lenis.scrollTo(el, { offset: 0 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/**
 * Nav — minimal fixed top bar. Wordmark left; section links + EN/IT toggle right.
 * Ink text reads on the light hero sky and the paper content alike. Smooth-scroll
 * via the shared Lenis instance (window.__lenis) set by <Smooth/>. Links to
 * sections that don't exist yet are inert (guarded).
 */
export function Nav() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const toggleLocale = useUI((s) => s.toggleLocale);
  const setMenu = useUI((s) => s.setMenu);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "works", label: t.nav.work },
    { id: "contact", label: t.nav.contact },
  ];

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className="container-edit flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
      >
        <button
          onClick={() => goTo("main")}
          className="font-display text-lg font-semibold tracking-[-0.02em] text-ink transition-opacity duration-300 hover:opacity-70"
        >
          Alberto&nbsp;Tuveri
        </button>

        <div className="flex items-center gap-5 sm:gap-7">
          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => goTo(l.id)}
                className="t-meta transition-colors duration-300 hover:text-ink"
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            onClick={toggleLocale}
            aria-label="Toggle language"
            className="t-meta text-ember-ink transition-colors duration-300 hover:text-ember"
          >
            {locale === "en" ? "IT" : "EN"}
          </button>
          <button
            onClick={() => setMenu(true)}
            aria-label="Open menu"
            className="t-meta transition-colors duration-300 hover:text-ember-ink md:hidden"
          >
            {t.nav.menu}
          </button>
        </div>
      </nav>
    </header>
      <MenuOverlay />
    </>
  );
}

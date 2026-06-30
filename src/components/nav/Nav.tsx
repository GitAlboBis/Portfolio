"use client";

import { useRef, useState } from "react";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { MenuOverlay } from "@/components/nav/MenuOverlay";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Lenis = { scrollTo: (t: HTMLElement | number, o?: { offset?: number }) => void };

function goTo(id: string) {
  const el = id === "main" ? document.getElementById("main") : document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis?.scrollTo) lenis.scrollTo(el, { offset: 0 });
  else el.scrollIntoView({ behavior: "smooth" });
}

const SECTION_IDS = ["about", "works", "contact"];

/**
 * Nav — a "fluid island": a floating glass pill (wordmark · section links · EN/IT ·
 * mobile menu) that's present over the hero, then hides on scroll-down and reveals
 * on scroll-up (Aceternity floating-navbar pattern, ported to GSAP+Lenis off the
 * shared ScrollTrigger — no second loop). An ember underline tracks the active
 * section. .glass fill (no backdrop-blur — it janks over the live WebGPU canvas);
 * reads on the light hero, warm paper, and the night band. reduced-motion → always
 * visible. Bilingual links via useDict; in-page scroll via window.__lenis.
 */
export function Nav() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const toggleLocale = useUI((s) => s.toggleLocale);
  const setMenu = useUI((s) => s.setMenu);
  const menuOpen = useUI((s) => s.menuOpen);
  const pillRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "works", label: t.nav.work },
    { id: "contact", label: t.nav.contact },
  ];

  useGSAP(
    () => {
      const pill = pillRef.current;
      if (!pill) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(pill, { y: 0, autoAlpha: 1 });
        return;
      }
      const yTo = gsap.quickTo(pill, "y", { duration: 0.45, ease: "power3.out" });
      const oTo = gsap.quickTo(pill, "autoAlpha", { duration: 0.3 });
      // visible at top + on scroll-up; tucked away on scroll-down.
      const dirST = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          if (self.progress < 0.04 || self.direction === -1) {
            yTo(0);
            oTo(1);
          } else {
            yTo(-130);
            oTo(0);
          }
        },
      });
      const sectionSTs = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        return ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActive(id);
          },
        });
      });
      // Reach for the menu = it comes back: moving the pointer to the top reveals
      // the pill even when it was tucked away by scroll-down.
      const onPointer = (e: PointerEvent) => {
        if (e.clientY < 90) {
          yTo(0);
          oTo(1);
        }
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      return () => {
        dirST.kill();
        sectionSTs.forEach((x) => x?.kill());
        window.removeEventListener("pointermove", onPointer);
      };
    },
    { scope: pillRef },
  );

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <nav
          ref={pillRef}
          aria-label="Primary"
          className="glass pointer-events-auto mx-auto mt-3 flex w-max max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full py-1.5 pl-4 pr-2"
          style={{ height: "auto", boxShadow: "0 8px 30px rgb(42 26 20 / 0.10)" }}
        >
          <Magnetic strength={0.35}>
            <button
              onClick={() => goTo("main")}
              className="font-display text-base font-semibold tracking-[-0.02em] text-ink transition-opacity duration-300 hover:opacity-70"
            >
              Alberto&nbsp;Tuveri
            </button>
          </Magnetic>

          <span className="mx-2 hidden h-5 w-px bg-[var(--color-rule-strong)] md:block" />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Magnetic key={l.id} strength={0.25}>
                <button
                  onClick={() => goTo(l.id)}
                  aria-current={active === l.id ? "true" : undefined}
                  className="group relative px-3 py-1 t-meta text-ink-mute transition-colors duration-300 hover:text-ink"
                >
                  {l.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 -bottom-0.5 h-px origin-center bg-ember transition-transform duration-300 ease-[var(--ease-tide)] ${
                      active === l.id ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              </Magnetic>
            ))}
          </div>

          <span className="mx-2 h-5 w-px bg-[var(--color-rule-strong)]" />

          <button
            onClick={toggleLocale}
            aria-label="Toggle language"
            className="px-3 py-1 t-meta text-ember-ink transition-colors duration-300 hover:text-ember"
          >
            {locale === "en" ? "IT" : "EN"}
          </button>

          <button
            onClick={() => setMenu(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="menu-overlay"
            className="px-3 py-1 t-meta text-ink transition-colors duration-300 hover:text-ember-ink md:hidden"
          >
            {t.nav.menu}
          </button>
        </nav>
      </header>
      <MenuOverlay />
    </>
  );
}

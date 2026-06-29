"use client";

import { useRef } from "react";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { gsap, useGSAP } from "@/lib/gsap";
import { palette } from "@/content/tokens";

type Lenis = { scrollTo: (t: HTMLElement) => void; stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

/**
 * MenuOverlay — full-screen night overlay. Opens with a clip-path wipe; the
 * oversized links rise in with a stagger (the codrops/uilayouts-style menu
 * reveal, reimplemented on GSAP + re-themed Golden Hour). Locks Lenis while open.
 */
export function MenuOverlay() {
  const t = useDict();
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const root = useRef<HTMLDivElement>(null);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "works", label: t.nav.work },
    { id: "contact", label: t.nav.contact },
  ];

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (open) {
        el.style.pointerEvents = "auto";
        lenis()?.stop();
        gsap
          .timeline()
          .fromTo(
            el,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power3.inOut" },
          )
          .fromTo(
            ".menu-link",
            { yPercent: 120, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" },
            "-=0.3",
          );
      } else {
        lenis()?.start();
        gsap.to(el, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.5,
          ease: "power3.inOut",
          onComplete: () => {
            if (el) el.style.pointerEvents = "none";
          },
        });
      }
    },
    { scope: root, dependencies: [open] },
  );

  function go(id: string) {
    setMenu(false);
    const el = document.getElementById(id);
    if (!el) return;
    const l = lenis();
    // let the close wipe begin, then scroll
    setTimeout(() => (l?.scrollTo ? l.scrollTo(el) : el.scrollIntoView({ behavior: "smooth" })), 80);
  }

  return (
    <div
      ref={root}
      className="night fixed inset-0 z-[60]"
      style={{ background: palette.night, clipPath: "inset(0 0 100% 0)", pointerEvents: "none" }}
    >
      <button
        onClick={() => setMenu(false)}
        aria-label="Close menu"
        className="t-meta absolute right-[var(--gutter)] top-0 z-10 flex items-center gap-2 transition-colors duration-300 hover:text-amber"
        style={{ height: "var(--nav-h)" }}
      >
        {t.nav.close} ✕
      </button>

      <div className="container-edit flex h-full flex-col justify-center">
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <span key={l.id} className="block overflow-hidden py-1">
              <button
                onClick={() => go(l.id)}
                className="menu-link t-display block text-left transition-opacity duration-300 hover:opacity-60"
              >
                {l.label}
              </button>
            </span>
          ))}
        </nav>

        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3">
          <a
            href={`mailto:${t.contact.email}`}
            className="t-meta transition-colors duration-300 hover:text-amber"
          >
            {t.contact.email}
          </a>
          <span className="t-meta">{t.footer.place}</span>
        </div>
      </div>
    </div>
  );
}

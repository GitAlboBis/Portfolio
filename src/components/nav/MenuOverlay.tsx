"use client";

/*
  MenuOverlay — the mobile full-screen menu, rebuilt as a Golden-Hour "sunset
  curtain". Mechanism distilled from the CLAUDE.md §6 references (verified live):

    • OPEN GESTURE — a multi-layer SVG path-morph curtain (Codrops / ykob
      shape-overlays): a wavy edge sweeps top→down. A leading ember→sunset wave
      (the sanctioned --gradient-sunset) runs just ahead of the deep `night`
      panel, so the read is "the sunset light passes, then night settles" — the
      same beat as the page's dusk band. Only the path `d` is rewritten per frame
      (GSAP-driven proxy, one short one-shot — never looped).
    • LINK REVEAL — GSAP SplitText `mask:"lines"` (auto per-line overflow clip):
      lines rise yPercent 110→0 with a blur-focus pull (Aceternity/Magic UI) and a
      hair of skew (Skiper), staggered. Email + location rise last.
    • ONE reversible master timeline (built once, paused): open = play, close =
      reverse (a touch quicker). The hamburger ⇄ X (MenuToggle) drives `menuOpen`.

  Everything is re-themed to tokens (night/paper/ember). Accessibility is first-
  class: role=dialog + aria-modal, focus moves into the panel on open, focus is
  trapped, Esc closes, focus returns to the toggle; under prefers-reduced-motion
  the curtain/rise are replaced by a plain instant panel (opacity only). Lenis is
  stopped while open so the page can't scroll behind the fixed overlay.
*/

import { useEffect, useRef, useState } from "react";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { MenuToggle } from "@/components/nav/MenuToggle";

type Lenis = { scrollTo: (t: HTMLElement) => void; stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

const N = 6; // curtain edge control points
const AMP = 7; // wave amplitude (viewBox units)

/** ykob-style wavy curtain edge, top→down, flattening as it lands. v in 0..1. */
function curtainPath(v: number, seed: number): string {
  if (v <= 0.002) return "M0 0H0Z"; // empty when closed
  const baseY = v * (100 + AMP * 2) - AMP; // edge descends; off-screen at v=1
  const ys: number[] = [];
  for (let i = 0; i <= N; i++) {
    ys.push(baseY + Math.sin(i * 0.9 + seed) * AMP * (1 - v * 0.65));
  }
  let d = `M 0 0 H 100 V ${ys[N].toFixed(2)} `;
  for (let i = N - 1; i >= 0; i--) {
    const x = (i / N) * 100;
    const px = ((i + 1) / N) * 100;
    const cx = ((x + px) / 2).toFixed(2);
    d += `C ${cx} ${ys[i + 1].toFixed(2)} ${cx} ${ys[i].toFixed(2)} ${x.toFixed(2)} ${ys[i].toFixed(2)} `;
  }
  return d + "L 0 0 Z";
}

export function MenuOverlay() {
  const t = useDict();
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const reduced = useUI((s) => s.reducedMotion);
  const locale = useUI((s) => s.locale);

  const root = useRef<HTMLDivElement>(null);
  const leadRef = useRef<SVGPathElement>(null);
  const nightRef = useRef<SVGPathElement>(null);
  const linksRef = useRef<HTMLElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "works", label: t.nav.work },
    { id: "contact", label: t.nav.contact },
  ];

  useEffect(() => {
    let alive = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // ── build the reversible master timeline (once per locale / motion pref) ──────
  useGSAP(
    () => {
      const el = root.current;
      const lead = leadRef.current;
      const night = nightRef.current;
      if (!el || !lead || !night) return;

      if (reduced) {
        // static panel: full night cover, links visible, hidden until opened.
        night.setAttribute("d", "M0 0H100V100H0Z");
        lead.setAttribute("d", "M0 0H0Z");
        gsap.set(el, { autoAlpha: 0 });
        tlRef.current = null;
        return;
      }
      if (!fontsReady) return; // wait for fonts so SplitText measures lines right

      lead.setAttribute("d", curtainPath(0, 1.7));
      night.setAttribute("d", curtainPath(0, 4.2));

      const split = SplitText.create(el.querySelectorAll(".menu-link"), {
        type: "lines",
        mask: "lines",
        linesClass: "menu-line",
      });
      const meta = metaRef.current ? metaRef.current.querySelectorAll<HTMLElement>(".menu-meta") : [];

      const leadP = { v: 0 };
      const nightP = { v: 0 };
      const tl = gsap.timeline({
        paused: true,
        onReverseComplete: () => {
          el.style.pointerEvents = "none";
          gsap.set(el, { autoAlpha: 0 });
        },
      });
      tl
        // the sunset wave sweeps down and fills first; the deep night then descends
        // OVER it — "the sunset light passes, then night settles" — landing on a
        // clean night panel.
        .to(leadP, { v: 1, duration: 0.42, ease: "power2.out", onUpdate: () => lead.setAttribute("d", curtainPath(leadP.v, 1.7)) }, 0)
        .to(nightP, { v: 1, duration: 0.55, ease: "power3.inOut", onUpdate: () => night.setAttribute("d", curtainPath(nightP.v, 4.2)) }, 0.28)
        .from(
          split.lines,
          { yPercent: 115, autoAlpha: 0, filter: "blur(8px)", rotate: 1.4, transformOrigin: "0% 100%", duration: 0.6, stagger: 0.075, ease: "power4.out" },
          "-=0.24",
        )
        .from(meta, { y: 18, autoAlpha: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" }, "-=0.40");

      tlRef.current = tl;
      // dev-only handle for deterministic visual QA (seek to a progress); harmless.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __menuTL?: gsap.core.Timeline }).__menuTL = tl;
      }
      return () => {
        tl.kill();
        split.revert();
        tlRef.current = null;
      };
    },
    { scope: root, dependencies: [locale, reduced, fontsReady] },
  );

  // ── open / close control + side effects ───────────────────────────────────────
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tl = tlRef.current;

    if (open) {
      prevFocus.current = document.activeElement as HTMLElement;
      gsap.set(el, { autoAlpha: 1 });
      el.style.pointerEvents = "auto";
      lenis()?.stop();
      if (tl) tl.timeScale(1).play(); // reduced-motion → no tl, the set above is enough
      const first = el.querySelector<HTMLElement>(".menu-link");
      requestAnimationFrame(() => first?.focus());
    } else {
      lenis()?.start();
      if (tl) tl.timeScale(1.35).reverse();
      else {
        gsap.set(el, { autoAlpha: 0 });
        el.style.pointerEvents = "none";
      }
      prevFocus.current?.focus?.();
    }
  }, [open]);

  // ── Esc to close + focus trap while open ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const el = root.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        return;
      }
      if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setMenu]);

  // ── unmount safety: never leave Lenis stopped / overlay blocking ──────────────
  useEffect(
    () => () => {
      lenis()?.start();
    },
    [],
  );

  function go(id: string) {
    setMenu(false);
    const target = document.getElementById(id);
    if (!target) return;
    const l = lenis();
    setTimeout(() => (l?.scrollTo ? l.scrollTo(target) : target.scrollIntoView({ behavior: "smooth" })), 90);
  }

  return (
    <div
      ref={root}
      id="menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="night fixed inset-0 z-[60]"
      style={{ pointerEvents: "none", opacity: 0, touchAction: "none" }}
    >
      {/* sunset curtain — decorative, painted by the timeline */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id="menu-sunset" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="var(--color-amber)" />
            <stop offset="42%" stopColor="var(--color-coral)" />
            <stop offset="72%" stopColor="var(--color-ember)" />
            <stop offset="100%" stopColor="var(--color-rose)" />
          </linearGradient>
        </defs>
        <path ref={leadRef} d="M0 0H0Z" fill="url(#menu-sunset)" />
        <path ref={nightRef} d="M0 0H0Z" fill="var(--color-night)" />
      </svg>

      {/* close (hamburger ⇄ X), top-right at nav height */}
      <div
        className="absolute right-[var(--gutter)] z-20 flex items-center"
        style={{ top: 0, height: "var(--nav-h)", color: "var(--color-paper)" }}
      >
        <MenuToggle />
      </div>

      <div className="container-edit pointer-events-none relative z-10 flex h-full flex-col justify-center">
        <nav ref={linksRef} aria-label="Mobile" className="pointer-events-auto flex w-max flex-col gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="menu-link t-display block w-max text-left text-paper transition-[transform,color] duration-300 ease-[var(--ease-tide)] hover:translate-x-2 hover:text-ember"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div ref={metaRef} className="pointer-events-auto mt-16 flex w-max flex-wrap items-center gap-x-8 gap-y-3">
          <a
            href={`mailto:${t.contact.email}`}
            className="menu-meta t-meta transition-colors duration-300 hover:text-amber"
          >
            {t.contact.email}
          </a>
          <span className="menu-meta t-meta">{t.footer.place}</span>
        </div>
      </div>
    </div>
  );
}

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
import { TornEdge } from "@/components/atmosphere/TornEdge";
import { curtainPath } from "@/lib/curtain";
import { warmingAllowed } from "@/lib/warm";

type Lenis = { scrollTo: (t: HTMLElement) => void; stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

/** The portal previews: one photographic scrap per route the menu can reach.
 *  `home` doubles as the resting state (the site itself, before any hover).
 *  `video` = a palindrome drone micro-loop (real DJI footage, LUT-graded)
 *  that plays ONLY while its link is hovered/focused — the portal comes
 *  alive when you reach for a route. At rest everything is still: nothing
 *  auto-plays (WCAG 2.2.2 — motion is user-initiated and stops on leave).
 *  Only `about` carries footage BY DESIGN: the Porto Flavia orbit IS
 *  "Masua, Sulcis"; a sea loop under "Selected work" or a midday loop under
 *  "The golden hour" would contradict caption and still (review finding). */
const PREVIEWS = [
  { id: "home", src: "/coast/sea-poster.webp", video: undefined },
  { id: "about", src: "/coast/masua-cliff.webp", video: "/portal/about.mp4" },
  { id: "works", src: "/works/badante24h.webp", video: undefined },
  { id: "contact", src: "/coast/night-sea.webp", video: undefined },
] as const;
type PreviewId = (typeof PREVIEWS)[number]["id"];

const FINE_HOVER = "(hover: hover) and (pointer: fine)";

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
  const panelRef = useRef<HTMLDivElement>(null);
  const scrapRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  // Preview images mount only once the menu has actually opened (no cost on load).
  const [warm, setWarm] = useState(false);
  // Drone micro-loops mount only where they're welcome: desktop panel, no
  // Save-Data / 2G (the stills alone already tell the story there).
  const [loops, setLoops] = useState(false);
  const activePreview = useRef<PreviewId>("home");
  const openRef = useRef(false);
  // the programmatic focus on open must NOT swap the portal — the resting scrap
  // should breathe until the user actually moves.
  const justOpened = useRef(false);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "works", label: t.nav.work },
    { id: "contact", label: t.nav.contact },
  ];

  const previewCaption: Record<PreviewId, string> = {
    home: t.nav.preview.home,
    about: t.nav.preview.about,
    works: t.nav.preview.works,
    contact: t.nav.preview.contact,
  };

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
        // a LIVE reduced flip can land while the menu is open (the store's
        // reducedMotion follows matchMedia) — never hide an open menu.
        gsap.set(el, { autoAlpha: openRef.current ? 1 : 0 });
        el.style.pointerEvents = openRef.current ? "auto" : "none";
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
      // the portal panel rises with the meta row (desktop only — it's display:none
      // below lg, so the tween is a no-op there).
      if (panelRef.current) {
        tl.from(panelRef.current, { autoAlpha: 0, y: 26, duration: 0.55, ease: "power3.out" }, "-=0.55");
      }

      tlRef.current = tl;
      // a locale/reduced flip can rebuild this while the menu is OPEN: land the
      // rebuilt timeline in the open pose, not paused-at-zero (invisible menu,
      // Lenis stopped, aria-expanded lying).
      if (openRef.current) {
        gsap.set(el, { autoAlpha: 1 });
        el.style.pointerEvents = "auto";
        tl.progress(1);
      }
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
    // revertOnUpdate: without it @gsap/react DEFERS the cleanup to unmount, so a
    // locale/reduced flip would stack timelines AND leave the .from() inline
    // residue (opacity:0/visibility:hidden) for the next build to capture as its
    // end values — panel and meta row permanently invisible after an EN/IT flip.
    { scope: root, dependencies: [locale, reduced, fontsReady], revertOnUpdate: true },
  );

  // ── preview engine: crossfade between route scraps + pointer parallax ─────────
  // Event-driven tweens go through `contextSafe` so they belong to this context
  // (killed on dep-change/unmount — the async-tween lesson from HANDOFF).
  const qxRef = useRef<((v: number) => void) | null>(null);
  const qyRef = useRef<((v: number) => void) | null>(null);
  const { contextSafe } = useGSAP(
    () => {
      // a rebuild means the previous context REVERTED: every swapTo tween is
      // undone and the figures are back at their inline JSX opacities (home
      // visible, rest hidden). Re-align the ref or the same-id guard in
      // swapTo would swallow the first hover on the previously-active route.
      activePreview.current = "home";
      const scrap = scrapRef.current;
      if (!scrap) return;
      gsap.set(scrap, { rotation: -1.75 });
      if (reduced) return;
      const qx = gsap.quickTo(scrap, "x", { duration: 0.7, ease: "power3.out" });
      const qy = gsap.quickTo(scrap, "y", { duration: 0.7, ease: "power3.out" });
      qxRef.current = qx;
      qyRef.current = qy;
      const onMove = (e: PointerEvent) => {
        if (!openRef.current) return;
        if (useUI.getState().reducedMotion) return; // live flip — closure is stale
        if (!window.matchMedia(FINE_HOVER).matches) return;
        qx((e.clientX / window.innerWidth - 0.5) * -18);
        qy((e.clientY / window.innerHeight - 0.5) * -12);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        qxRef.current = null;
        qyRef.current = null;
      };
    },
    // revertOnUpdate: the returned cleanup must run on the reduced flip too,
    // or the pointermove listener stacks per flip and keeps gliding the scrap
    // under reduced-motion.
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  const figures = () =>
    root.current ? Array.from(root.current.querySelectorAll<HTMLElement>(".menu-preview")) : [];

  /** Play only the active scrap's micro-loop; every other one pauses (one
   *  decoder at a time). `null` pauses the lot — a closed menu must not keep
   *  video ticking behind an invisible overlay. The openRef guard makes that
   *  invariant hold even for the hover window DURING the close reverse
   *  (pointer-events stay auto until onReverseComplete — a pointerenter
   *  there must never restart a decoder nobody will pause). */
  const syncLoops = (id: PreviewId | null) => {
    const target = openRef.current ? id : null;
    for (const f of figures()) {
      const v = f.querySelector("video");
      if (!v) continue;
      if (target !== null && f.dataset.preview === target) v.play()?.catch(() => {});
      else v.pause();
    }
  };

  /** Crossfade to a preview. `fast` = keyboard-driven (no cinematic blur pull). */
  const swapTo = contextSafe((id: PreviewId, fast = false) => {
    if (activePreview.current === id) return;
    const all = figures();
    const incoming = all.find((f) => f.dataset.preview === id);
    // figures may not be mounted yet (first open) — bail WITHOUT burning the
    // active id, or the next hover would be swallowed by the same-id guard.
    if (!incoming) return;
    activePreview.current = id;
    const rest = all.filter((f) => f !== incoming);
    if (reduced) {
      gsap.killTweensOf(all); // a leftover crossfade would out-render the set
      gsap.set(rest, { autoAlpha: 0 });
      gsap.set(incoming, { autoAlpha: 1, scale: 1, filter: "blur(0px)" });
      return;
    }
    // blur bridges the two states so the crossfade reads as ONE transformation.
    if ((gsap.getProperty(incoming, "opacity") as number) < 0.05) {
      gsap.set(incoming, fast ? { scale: 1, filter: "blur(0px)" } : { scale: 1.05, filter: "blur(9px)" });
    }
    gsap.to(incoming, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: fast ? 0.18 : 0.42, ease: "power3.out", overwrite: "auto" });
    gsap.to(rest, { autoAlpha: 0, duration: fast ? 0.12 : 0.26, ease: "power2.out", overwrite: "auto" });
    syncLoops(id);
  });

  /** Instant reset to the resting scrap (used while the overlay is hidden). */
  const resetPreview = contextSafe(() => {
    activePreview.current = "home";
    const all = figures();
    if (!all.length) return;
    // an in-flight crossfade keeps rendering past a zero-duration set — kill it
    // first or a quick close→reopen shows the stale scrap stacked over home.
    gsap.killTweensOf(all);
    gsap.set(all, { autoAlpha: 0 });
    const home = all.find((f) => f.dataset.preview === "home");
    if (home) gsap.set(home, { autoAlpha: 1, scale: 1, filter: "blur(0px)" });
    syncLoops("home");
  });

  const resetScrap = contextSafe(() => {
    // through the SAME quickTo pair — a competing gsap.to with overwrite would
    // kill the quickTo tweens, and a killed quickTo is permanently inert in
    // gsap 3 (parallax dead after the first close + console.warn per move).
    qxRef.current?.(0);
    qyRef.current?.(0);
  });

  const hoverFine = () => window.matchMedia(FINE_HOVER).matches;

  // dev-only handle for deterministic visual QA of the preview crossfade.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __menuSwap?: typeof swapTo }).__menuSwap = swapTo;
    }
  });

  // ── open / close control + side effects ───────────────────────────────────────
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tl = tlRef.current;

    openRef.current = open;
    if (open) {
      // warm the scraps only where the panel can render (lg+): phones would
      // download ~430KB of images into a display:none subtree.
      if (window.matchMedia("(min-width: 64rem)").matches) {
        setWarm(true);
        // micro-loops respect Save-Data / 2G — the stills carry the panel there
        setLoops(warmingAllowed());
      }
      // instant reset only while truly hidden — on a quick reopen mid-reverse
      // the panel is still on screen: crossfade home instead of hard-cutting.
      if ((gsap.getProperty(el, "opacity") as number) < 0.05) resetPreview();
      else swapTo("home");
      prevFocus.current = document.activeElement as HTMLElement;
      gsap.set(el, { autoAlpha: 1 });
      el.style.pointerEvents = "auto";
      lenis()?.stop();
      if (tl) tl.timeScale(1).play(); // reduced-motion → no tl, the set above is enough
      const first = el.querySelector<HTMLElement>(".menu-link");
      justOpened.current = true;
      requestAnimationFrame(() => first?.focus());
    } else {
      lenis()?.start();
      resetScrap(); // parallax back to rest while the curtain lifts
      syncLoops(null); // no decoder ticking behind a closed overlay
      if (tl) tl.timeScale(1.35).reverse();
      else {
        gsap.set(el, { autoAlpha: 0 });
        el.style.pointerEvents = "none";
      }
      prevFocus.current?.focus?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // First open mounts the <video> loops one render AFTER the swap above ran
  // (setWarm/setLoops land, THEN the figures exist) — sync the active loop as
  // soon as they're really in the DOM. Also re-arms after a live reduced flip
  // back to motion (videos remount paused).
  useEffect(() => {
    if (open && warm) syncLoops(activePreview.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, warm, loops, reduced]);

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
        // focus escaped the dialog (backdrop click blurs to <body>) — recapture,
        // or Tab walks the page underneath the open modal.
        if (!el.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
          return;
        }
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

      {/* THE PORTAL — a photographic scrap per route, torn out of the night.
          Decorative (aria-hidden), desktop only, parallax-follows the pointer. */}
      <div
        ref={panelRef}
        aria-hidden
        data-portal
        className="pointer-events-none absolute inset-y-0 right-[clamp(2rem,7vw,8rem)] z-[5] hidden items-center lg:flex"
      >
        <div
          ref={scrapRef}
          className="relative aspect-[3/2] w-[min(38vw,560px)] overflow-hidden bg-night shadow-[0_36px_90px_rgb(0_0_0/0.5)]"
        >
          <TornEdge side="top" seed={7} color="var(--color-night)" />
          <TornEdge side="bottom" seed={11} color="var(--color-night)" />
          {warm &&
            PREVIEWS.map((p) => (
              <figure
                key={p.id}
                data-preview={p.id}
                className="menu-preview absolute inset-0 m-0"
                style={{ opacity: p.id === "home" ? 1 : 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" decoding="async" draggable={false} className="h-full w-full object-cover" />
                {/* the drone micro-loop over the still. It starts INVISIBLE
                    and fades in on `playing`: poster and frame 0 are different
                    images (wide cliff vs tight facade), so an opacity ramp
                    turns the cold-cache hard cut into a dissolve. Client-only
                    subtree (warm gate) — the reduced read is safe. */}
                {p.video && loops && !reduced && (
                  <video
                    src={p.video}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    onPlaying={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                  />
                )}
                <figcaption
                  className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-12"
                  style={{ background: "linear-gradient(to top, rgb(16 9 12 / 0.62), transparent)" }}
                >
                  <span className="t-meta text-paper">{previewCaption[p.id]}</span>
                </figcaption>
              </figure>
            ))}
        </div>
      </div>

      {/* close (hamburger ⇄ X), top-right at nav height */}
      <div
        className="absolute right-[var(--gutter)] z-20 flex items-center"
        style={{ top: 0, height: "var(--nav-h)", color: "var(--color-paper)" }}
      >
        <MenuToggle />
      </div>

      <div className="container-edit pointer-events-none relative z-10 flex h-full flex-col justify-center">
        <nav
          ref={linksRef}
          aria-label="Menu"
          className="pointer-events-auto flex w-max flex-col gap-1"
          onPointerLeave={() => {
            if (hoverFine()) swapTo("home");
          }}
        >
          {links.map((l) => (
            <button
              // keyed by locale: SplitText detaches React's text node, so an
              // EN/IT flip must RECREATE the button for the re-split to see
              // the new label (else the menu stays in the old language).
              key={`${l.id}-${locale}`}
              onClick={() => go(l.id)}
              onPointerEnter={() => {
                if (hoverFine()) swapTo(l.id as PreviewId);
              }}
              onFocus={() => {
                if (justOpened.current) {
                  justOpened.current = false;
                  return;
                }
                swapTo(l.id as PreviewId, true);
              }}
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

"use client";

/*
  ScrollProgress — the day's light arc as a hairline at the very top of the viewport.

  A 3px line that fills left→right with the one sanctioned `--gradient-sunset`
  (golden → coral → ember → rose → dusk) as you scroll the page: the sun crossing
  the sky from morning gold to the dusk that lands in the night band below. The
  gradient is anchored to the full width and revealed with `clip-path` (compositor-
  friendly), so the colour at the leading edge always reflects how far down the day
  you are. A soft warm drop-shadow gives the edge a low bloom.

  Global chrome (mounted in the root layout). DECORATIVE: aria-hidden, pointer-
  events:none. Reads scroll from the shared Lenis (`window.__lenis`) — in this repo
  Lenis does NOT reliably emit window 'scroll', so we use its events/`progress`;
  under prefers-reduced-motion there is no Lenis, so we fall back to native scroll.
  Fades out while the Preloader is up or the menu overlay is open.
*/

import { useEffect, useRef, useState } from "react";
import { useUI } from "@/store/ui";

type LenisLike = {
  progress?: number;
  on: (e: "scroll", cb: () => void) => void;
  off: (e: "scroll", cb: () => void) => void;
};

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useUI((s) => s.loaded);
  const menuOpen = useUI((s) => s.menuOpen);
  const reduced = useUI((s) => s.reducedMotion);

  // ECOSYSTEM — the day's arc lives in the world: underwater (the Ascent's
  // `submerge`) the light dims and desaturates; breaking the surface (or the
  // footer tide touching the page) flares it for a beat. Pure filter state on
  // a 3px fixed bar — compositor-cheap. The emitting machinery (pins, scrub)
  // never runs under reduced-motion, but the guard makes that explicit.
  const [phase, setPhase] = useState<"day" | "under" | "flare">("day");
  useEffect(() => {
    if (reduced) return;
    let flareId: number | undefined;
    const flare = () => {
      setPhase("flare");
      window.clearTimeout(flareId);
      flareId = window.setTimeout(() => setPhase("day"), 650);
    };
    const onSubmerge = (e: Event) => {
      window.clearTimeout(flareId);
      setPhase((e as CustomEvent).detail ? "under" : "day");
    };
    window.addEventListener("submerge", onSubmerge);
    window.addEventListener("surface-break", flare);
    window.addEventListener("tide-touch", flare);
    // "marea" (the typed easter egg) had exactly two listeners — the home Escort
    // flock and the About murmuration — and both were removed. Rather than leave
    // the egg dispatching into nothing, the day-arc answers it the same way it
    // answers the other tide beats.
    window.addEventListener("marea", flare);
    return () => {
      window.clearTimeout(flareId);
      window.removeEventListener("submerge", onSubmerge);
      window.removeEventListener("surface-break", flare);
      window.removeEventListener("tide-touch", flare);
      window.removeEventListener("marea", flare);
      // never leave a phase behind: detaching cancels the flare's own
      // restore-timeout, and under reduced no event will ever reset it
      setPhase("day");
    };
  }, [reduced]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const set = (p: number) =>
      el.style.setProperty("--p", String(Math.max(0, Math.min(1, p || 0))));

    const win = window as unknown as { __lenis?: LenisLike };
    let detach = () => {};

    const attachLenis = (lenis: LenisLike) => {
      const onScroll = () => set(lenis.progress ?? 0);
      lenis.on("scroll", onScroll);
      onScroll();
      detach = () => lenis.off("scroll", onScroll);
    };

    if (win.__lenis) {
      attachLenis(win.__lenis);
    } else {
      // reduced-motion (no Lenis) → native scroll; also re-check briefly in case the
      // Lenis backbone mounts a tick later, then prefer it.
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        set(max > 0 ? window.scrollY / max : 0);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      onScroll();
      let tries = 0;
      const id = window.setInterval(() => {
        if (win.__lenis) {
          window.clearInterval(id);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
          attachLenis(win.__lenis);
        } else if (++tries > 20) {
          window.clearInterval(id);
        }
      }, 50);
      detach = () => {
        window.clearInterval(id);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    return () => detach();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3px",
        zIndex: 60,
        pointerEvents: "none",
        background: "var(--gradient-sunset)",
        // reveal the fixed-width gradient left→right; edge colour = scroll depth
        clipPath: "inset(0 calc((1 - var(--p, 0)) * 100%) 0 0)",
        WebkitClipPath: "inset(0 calc((1 - var(--p, 0)) * 100%) 0 0)",
        // warm bloom + a thin neutral shadow so the line stays legible even over the
        // warm Works mood ramp (where a purely warm glow would camouflage it).
        // Ecosystem phases append to it: dimmed underwater, over-bright on a flare.
        filter:
          "drop-shadow(0 0 4px rgb(238 91 35 / 0.40)) drop-shadow(0 1px 2px rgb(28 14 10 / 0.45))" +
          (phase === "under"
            ? " saturate(0.35) brightness(0.7)"
            : phase === "flare"
              ? " saturate(1.5) brightness(1.6)"
              : ""),
        willChange: "clip-path",
        opacity: loaded && !menuOpen ? 1 : 0,
        transition:
          "opacity 600ms var(--ease-tide), filter " +
          (phase === "flare" ? "180ms" : "800ms") +
          " var(--ease-tide)",
      }}
    />
  );
}

export default ScrollProgress;

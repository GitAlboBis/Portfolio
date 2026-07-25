"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUI } from "@/store/ui";
import { warmRoute, warmingAllowed, type WarmRoute } from "@/lib/warm";

/*
  Warmup — mounts once in the root layout and drives src/lib/warm.ts:
  when the preloader unlocks (ui.loaded) AND the window has fully loaded,
  it enqueues the current route's asset manifest on an idle callback.
  Re-fires on client navigation (pathname change) — already-warm items dedupe.
*/

function routeOf(pathname: string): WarmRoute | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/work")) return "work";
  return null;
}

export function Warmup() {
  const pathname = usePathname();
  const loaded = useUI((s) => s.loaded);

  useEffect(() => {
    const route = routeOf(pathname);
    if (!loaded || !route || !warmingAllowed()) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    const INTERACTION = ["pointermove", "touchstart", "wheel", "keydown", "scroll"] as const;

    const kick = () => {
      if (cancelled) return;
      cancelled = true; // one-shot
      INTERACTION.forEach((ev) => window.removeEventListener(ev, kick));
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      warmRoute(route);
    };

    // Warm on the FIRST user interaction, not on a forced idle timeout: the
    // old rIC {timeout:4000} fired mid-load on throttled devices and the warm
    // fetches/chunk-execs landed inside the LCP/TTI window (WP-10 measured).
    // Every warmed asset lives ≥900px below the fold, so first-input is
    // always early enough — and a patient viewer gets a long quiet fallback.
    const start = () => {
      if (cancelled) return;
      INTERACTION.forEach((ev) => window.addEventListener(ev, kick, { passive: true, once: false }));
      timeoutId = window.setTimeout(kick, 12000);
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      INTERACTION.forEach((ev) => window.removeEventListener(ev, kick));
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [pathname, loaded]);

  return null;
}

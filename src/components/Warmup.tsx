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
    let idleId: number | undefined;
    const start = () => {
      if (cancelled) return;
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(() => !cancelled && warmRoute(route), { timeout: 4000 });
      } else {
        idleId = window.setTimeout(() => !cancelled && warmRoute(route), 800) as unknown as number;
      }
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      if (idleId !== undefined && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
    };
  }, [pathname, loaded]);

  return null;
}

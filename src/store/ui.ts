"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Locale = "en" | "it";

// Resolve the motion preference at store-creation time (client only) so the reveal
// primitives read the correct value on their FIRST render — otherwise they default to
// reducedMotion:false and set their "from" states (autoAlpha:0 / dimmed) for a transient
// frame before <Smooth/>'s effect flips the flag. SSR has no window → false (harmless:
// reduced-motion only gates client-side effects, not the SSR'd plain text).
const initialReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * THE JOB ORDER — the store is down to what the sheet actually has: the
 * language, the motion preference and the preloader gate.
 *
 * There is no ambient sound and no full-screen menu in this world (the phase
 * band IS the nav, REDESIGN-SPEC §G), so the store carries neither.
 *
 * Persist key "ocean-ui" is legacy but LOAD-BEARING (visitors have a locale
 * stored under it): never rename it without a migration.
 */
interface UIState {
  /** Site language. Persisted. */
  locale: Locale;
  /** prefers-reduced-motion, resolved client-side by <Smooth/>. Runtime only. */
  reducedMotion: boolean;
  /** True once the preloader has finished. Runtime only. */
  loaded: boolean;

  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  setReducedMotion: (on: boolean) => void;
  setLoaded: (v: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      locale: "en",
      reducedMotion: initialReducedMotion,
      loaded: false,

      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "en" ? "it" : "en" }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLoaded: (loaded) => set({ loaded }),
    }),
    {
      name: "ocean-ui",
      storage: createJSONStorage(() => localStorage),
      // Only durable preferences persist; motion/loaded are runtime.
      partialize: (s) => ({ locale: s.locale }),
    },
  ),
);

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
 * `soundEnabled` and `menuOpen` are DEPRECATED: the sheet has no ambient sound
 * and no full-screen menu (the phase band IS the nav, REDESIGN-SPEC §G). They
 * are kept only because the Golden Hour components that still compile read them
 * (Footer / SoundScape for sound, MenuOverlay / MenuToggle / ScrollProgress /
 * SeaBackdrop for the menu); WP-9 deletes those files and then these fields.
 * `activeWork` had no readers left and is gone.
 *
 * Persist key "ocean-ui" is legacy but LOAD-BEARING (visitors have a locale
 * stored under it): never rename it without a migration.
 */
interface UIState {
  /** Site language. Persisted. */
  locale: Locale;
  /** @deprecated No ambient sound in the job order. Removed with WP-9. */
  soundEnabled: boolean;
  /** prefers-reduced-motion, resolved client-side by <Smooth/>. Runtime only. */
  reducedMotion: boolean;
  /** True once the preloader has finished. Runtime only. */
  loaded: boolean;
  /** @deprecated No full-screen menu in the job order. Removed with WP-9. */
  menuOpen: boolean;

  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  /** @deprecated see `soundEnabled`. */
  setSoundEnabled: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setLoaded: (v: boolean) => void;
  /** @deprecated see `menuOpen`. */
  setMenu: (v: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      locale: "en",
      soundEnabled: false,
      reducedMotion: initialReducedMotion,
      loaded: false,
      menuOpen: false,

      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "en" ? "it" : "en" }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLoaded: (loaded) => set({ loaded }),
      setMenu: (menuOpen) => set({ menuOpen }),
    }),
    {
      name: "ocean-ui",
      storage: createJSONStorage(() => localStorage),
      // Only durable preferences persist; motion/loaded are runtime.
      partialize: (s) => ({ locale: s.locale, soundEnabled: s.soundEnabled }),
    },
  ),
);

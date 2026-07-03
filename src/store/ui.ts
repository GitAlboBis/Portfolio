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

interface UIState {
  /** Site language. Persisted. */
  locale: Locale;
  /** Ambient sound toggle (off by default). Persisted. */
  soundEnabled: boolean;
  /** prefers-reduced-motion, resolved client-side by <Smooth/>. Runtime only. */
  reducedMotion: boolean;
  /** Index of the focused project in the Works gallery, or null. Runtime only. */
  activeWork: number | null;
  /** True once the preloader has finished. Runtime only. */
  loaded: boolean;
  /** Full-screen menu overlay open state. Runtime only. */
  menuOpen: boolean;

  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  setSoundEnabled: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setActiveWork: (i: number | null) => void;
  setLoaded: (v: boolean) => void;
  setMenu: (v: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      locale: "en",
      soundEnabled: false,
      reducedMotion: initialReducedMotion,
      activeWork: null,
      loaded: false,
      menuOpen: false,

      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "en" ? "it" : "en" }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setActiveWork: (activeWork) => set({ activeWork }),
      setLoaded: (loaded) => set({ loaded }),
      setMenu: (menuOpen) => set({ menuOpen }),
    }),
    {
      name: "ocean-ui",
      storage: createJSONStorage(() => localStorage),
      // Only durable preferences persist; motion/active/loaded are runtime.
      partialize: (s) => ({ locale: s.locale, soundEnabled: s.soundEnabled }),
    },
  ),
);

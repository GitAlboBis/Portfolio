"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Locale = "en" | "it";

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
      reducedMotion: false,
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

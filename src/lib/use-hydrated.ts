"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * useHydrated — false during SSR AND the hydration render, true immediately
 * after. The store's `reducedMotion` is resolved from matchMedia at module
 * load (true on the very first client render for reduced-motion visitors,
 * false in the server HTML), so any RENDER-TIME branch on it must be delayed
 * one pass with this hook or the trees mismatch and React discards the whole
 * hydration. Effect-time reads (useGSAP etc.) don't need this.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

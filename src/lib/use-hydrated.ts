"use client";

import { useSyncExternalStore } from "react";
import { useUI, type Locale } from "@/store/ui";

const emptySubscribe = () => () => {};

/**
 * useHydrated — false during SSR AND the hydration render, true immediately
 * after. The store's `reducedMotion` is resolved from matchMedia at module
 * load (true on the very first client render for reduced-motion visitors,
 * false in the server HTML), and `locale` is rehydrated from localStorage
 * ("ocean-ui"), so any RENDER-TIME branch on either must be delayed one pass
 * with this hook or the trees mismatch and React discards the whole
 * hydration. Effect-time reads (useGSAP etc.) don't need this.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * useHydratedLocale — the persisted EN/IT locale, but "en" (the SSR shell's
 * language) until hydration has happened. Use this for anything that renders
 * different MARKUP per locale (not just different strings inside the same node);
 * `useDict()` alone is fine when the shape of the tree does not change.
 */
export function useHydratedLocale(): Locale {
  const hydrated = useHydrated();
  const locale = useUI((s) => s.locale);
  return hydrated ? locale : "en";
}

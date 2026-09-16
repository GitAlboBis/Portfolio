import { RouteTransition } from "@/components/transition/RouteTransition";

/*
  template.tsx — the per-route wrapper around the ENTER half of the paper-sheet
  cover, while layout.tsx (Preloader, Smooth/Lenis, CoverOverlay, sheet chrome)
  persists across navigations.

  NOTE on remounting: Next keys the ROOT template by the TOP-LEVEL segment, so
  it remounts on / ↔ /about ↔ /work but NOT on /work → /work/<slug>. That is why
  RouteTransition runs its enter off `usePathname()` rather than off its mount —
  a mount-only enter left every sub-route hop as a hard cut from the exit cover.
*/
export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}

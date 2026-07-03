import { RouteTransition } from "@/components/transition/RouteTransition";

// template.tsx remounts on every top-level navigation (/ ↔ /about ↔ /work/[slug])
// while layout.tsx (Preloader, Smooth/Lenis, CanvasHost) persists — so the client
// RouteTransition fires a fresh enter animation per route without disturbing the
// persistent chrome or the smooth-scroll loop.
export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}

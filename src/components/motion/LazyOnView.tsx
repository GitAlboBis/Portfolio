"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * LazyOnView — defer MOUNTING an expensive (WebGL) child until its slot nears the
 * viewport, so the browser doesn't create its GPU context on initial page load. The
 * child element is passed but its component body (and its context-creating effect)
 * only runs once we render it — so a below-the-fold scene costs nothing at first paint.
 *
 * rAF rect-poll rather than IntersectionObserver: Lenis' smoothed scroll doesn't fire
 * IO reliably here (the same reason NightSky/TechCloud self-gate by geometry). Mount-once:
 * once shown it stays mounted — the scenes already self-pause their rAF and dispose their
 * own context, so there's no need to churn-remount them on every scroll boundary.
 *
 * Give a `style.minHeight` (or a sized className) matching the child so the reserved slot
 * is the same size as the mounted scene → zero layout shift. For an absolutely-positioned
 * fill scene (e.g. NightSky) no sizing is needed: the wrapper stays a zero-box in flow.
 */
export function LazyOnView({
  children,
  className,
  style,
  rootMargin = 400,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** px beyond the viewport at which to mount (mount a little before it scrolls in). */
  rootMargin?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + rootMargin && r.bottom > -rootMargin) {
        setShow(true);
        return; // mount-once: stop polling
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [rootMargin, show]);

  return (
    <div ref={ref} className={className} style={style}>
      {show ? children : null}
    </div>
  );
}

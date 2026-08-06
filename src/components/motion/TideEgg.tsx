"use client";

import * as React from "react";
import { useUI } from "@/store/ui";

/*
  TideEgg — typed easter egg (the Lando Norris "disco" pattern, tuned to the
  identity): type  m·a·r·e·a  anywhere and the tide answers — a skewed curtain
  of the one sanctioned sunset gradient sweeps the viewport while anything
  listening for the "marea" CustomEvent reacts (today: the nav's day-arc flares,
  the same way it answers "tide-touch" and "surface-break").

  Zero assets, one tween. Buffer resets after 5s of silence; ignores typing in
  form fields (none on the site today, but guard anyway); no-op under
  reduced-motion and while a sweep is already running. Decorative overlay:
  aria-hidden, pointer-events-none, unmount-safe (gsap tween killed on cleanup).
*/

const WORD = "marea";

export function TideEgg() {
  const reduced = useUI((s) => s.reducedMotion);
  const veil = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (reduced) return;
    let buf = "";
    let resetAt = 0;
    let running = false;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key.length !== 1) return;
      const now = performance.now();
      if (now - resetAt > 5000) buf = "";
      resetAt = now;
      buf = (buf + e.key.toLowerCase()).slice(-WORD.length);
      if (buf !== WORD || running) return;
      buf = "";
      running = true;

      // the world answers first (the day-arc flare, anything else that listens)
      window.dispatchEvent(new CustomEvent("marea"));

      const el = veil.current;
      if (!el) {
        running = false;
        return;
      }
      // WAAPI, not the shared GSAP ticker: a one-shot decorative sweep runs
      // compositor-side, and onfinish/oncancel BOTH release the latch (a
      // GSAP tween whose onComplete never fires would jam it forever).
      el.style.opacity = "1";
      const anim = el.animate(
        [{ transform: "translateX(-130%)" }, { transform: "translateX(130%)" }],
        { duration: 1500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
      );
      const done = () => {
        running = false;
        el.style.opacity = "0";
      };
      anim.onfinish = done;
      anim.oncancel = done;
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      veil.current?.getAnimations().forEach((a) => a.cancel());
    };
  }, [reduced]);

  return (
    <div
      ref={veil}
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-0 z-[170] w-[130vw] opacity-0"
      style={{
        background: "var(--gradient-sunset)",
        // NO inline transform: gsap owns x entirely (an inline translateX would
        // be parsed as `x` and STACK with the tween's xPercent — double offset).
        // At rest the veil is invisible (opacity-0) and pointer-events-none.
        // the wave leans forward like a breaker
        clipPath: "polygon(0 0, 88% 0, 100% 100%, 12% 100%)",
      }}
    />
  );
}

"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/*
  Cursor — "a drop of light" (WP-9, the interaction identity).

  Two layers on the shared gsap.ticker (never a second rAF loop):
  • dot — an ember drop with a hairline paper rim (reads on paper AND night),
    tight lerp: it IS the pointer.
  • halo — a slower ring that trails like water, stretching along its own
    velocity (rotate·scale·unrotate, so the ring deforms without spinning).

  Context morphs are CSS-only (data-mode attribute on the root; the JS
  transform lives on OUTER elements, the morph scales INNER ones — they never
  fight): links/buttons → ring tightens ember; [data-cursor="view"] elements →
  the ring becomes an ember pill with a label ([data-cursor-label], dict-fed
  by the call site). Native cursor is hidden via html.cc-on (CSS in globals).

  Guards: pointer:fine only, reduced-motion off (store-reactive — flips
  mid-session tear it down), hidden until first move and when the pointer
  leaves the document. aria-hidden throughout; focus-visible is untouched.
*/

const INTERACTIVE = "a,button,[role='button'],[data-cursor]";

export function Cursor() {
  const reduced = useUI((s) => s.reducedMotion);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    if (!el) return;
    const dot = el.querySelector<HTMLElement>("[data-c-dot]");
    const halo = el.querySelector<HTMLElement>("[data-c-halo]");
    const label = el.querySelector<HTMLElement>("[data-c-label]");
    if (!dot || !halo || !label) return;

    // cc-on (cursor:none) is added on the FIRST pointer move, not at mount —
    // a keyboard-only session with an idle mouse keeps the native cursor.

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let dx = tx, dy = ty; // dot (tight)
    let hx = tx, hy = ty; // halo (tide-lagged)
    let px = tx, py = ty; // halo previous — velocity stretch
    let shown = false;

    const setMode = (mode: string, text = "") => {
      if (el.dataset.mode !== mode) el.dataset.mode = mode;
      if (label.textContent !== text) label.textContent = text;
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        dx = hx = px = tx;
        dy = hy = py = ty;
        el.style.opacity = "1";
        document.documentElement.classList.add("cc-on");
      }
    };
    const onDocLeave = () => {
      shown = false;
      el.style.opacity = "0";
    };
    const onOver = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
      if (!t) {
        // de-escalate here too: a hovered element REMOVED from the DOM (route
        // nav, menu close) never fires pointerout — the re-hit-test lands
        // pointerover on whatever is underneath, and this resets the latch.
        setMode("base");
        return;
      }
      if (t.dataset.cursor === "view") setMode("view", t.dataset.cursorLabel || "→");
      else setMode("hover");
    };
    const onOut = (e: PointerEvent) => {
      const rel = e.relatedTarget as Element | null;
      if (!rel || !rel.closest?.(INTERACTIVE)) setMode("base");
    };

    const tick = (_t: number, deltaMs: number) => {
      if (!shown) return;
      const dt = Math.min(deltaMs, 50) / 1000;
      const kDot = 1 - Math.exp(-26 * dt);
      const kHalo = 1 - Math.exp(-9.5 * dt);
      dx += (tx - dx) * kDot;
      dy += (ty - dy) * kDot;
      hx += (tx - hx) * kHalo;
      hy += (ty - hy) * kHalo;
      dot.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      const vx = hx - px;
      const vy = hy - py;
      px = hx;
      py = hy;
      const sp = Math.hypot(vx, vy);
      const stretch = Math.min(sp * 0.02, 0.32);
      const ang = sp > 0.4 ? Math.atan2(vy, vx) : 0;
      halo.style.transform = `translate3d(${hx}px,${hy}px,0) rotate(${ang}rad) scale(${1 + stretch},${1 - stretch * 0.55}) rotate(${-ang}rad)`;
    };

    gsap.ticker.add(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    document.documentElement.addEventListener("pointerleave", onDocLeave);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.documentElement.removeEventListener("pointerleave", onDocLeave);
      document.documentElement.classList.remove("cc-on");
      // restore the resting state — a mid-session reduced-motion flip re-runs
      // this effect and must NOT leave a frozen ghost cursor painted on screen
      el.style.opacity = "0";
      el.dataset.mode = "base";
      label.textContent = "";
    };
  }, [reduced]);

  // pointer:coarse / reduced-motion never add .cc-on, so this stays invisible
  // and the native cursor is untouched — safe to render unconditionally.
  return (
    <div
      ref={root}
      aria-hidden
      data-mode="base"
      className="cc pointer-events-none fixed inset-0 z-[160] opacity-0"
    >
      {/* label is a SIBLING of the scaling ring (same centered zero-box), so
          the text never gets rasterized-then-scaled blurry */}
      <div data-c-halo className="cc-layer">
        <div className="cc-halo-inner" />
        <span data-c-label className="cc-label" />
      </div>
      <div data-c-dot className="cc-layer">
        <div className="cc-dot-inner" />
      </div>
    </div>
  );
}

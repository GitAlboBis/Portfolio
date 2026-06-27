"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/*
  RefractCard — tactile "water glass" response for the Work cards.

  A generic, self-contained wrapper that makes arbitrary children behave like a
  pane of glass refracting light underwater:

    · 3D pointer-tilt    the card rotates toward the cursor (perspective +
                         rotateX/rotateY) and lifts a touch, then springs back
                         on leave — glass settling under water.
    · specular caustic   a soft celeste/foam highlight that tracks the pointer
                         across the frosted surface (radial-gradient overlay).
    · edge refraction    a faint celeste glow biased to the leading edge nearest
                         the cursor, as if light bends through the glass rim.

  Engineering notes (Cinematic Ocean: restrained-but-alive, performant):
    · Pointer-driven only. A single rAF is scheduled per pointermove to apply the
      latest sample (no work while idle). Leaving runs a short self-terminating
      spring-back loop, then stops. Nothing runs when the pointer is away.
    · The tilt is lerped toward the target each frame so the glass "catches up"
      smoothly rather than snapping — the water-glass feel.
    · SSR-safe: all browser access is inside effects; markup renders identically
      on the server (the overlays start at rest / invisible).
    · Reduced-motion or coarse pointer (touch) => INERT pass-through: the wrapper
      becomes a plain box with no listeners, no rAF, no overlays. Identical
      layout, zero motion.
    · Fully additive: overlays are aria-hidden and pointer-events:none, so the
      wrapped content keeps all its own semantics, focus and keyboard behaviour.
      Keyboard focus within the card lights the edge glow (centred) without tilt,
      so the cue isn't mouse-only.
*/

/** Max tilt at the corners, in degrees. Kept small — refined, not gimmicky. */
const MAX_TILT = 7;
/** Lift toward the viewer on hover (px of translateZ). */
const LIFT_Z = 18;
/** Per-frame approach factor for the lerp (0..1). Lower = more "viscous". */
const EASE = 0.14;
/** Below this delta (deg + normalised) the spring-back loop is considered settled. */
const SETTLE_EPS = 0.06;

type Vec = { rx: number; ry: number; lift: number };

export function RefractCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Capability gate — inert on touch / reduced-motion.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    if (reduce.matches || coarse.matches) return;

    // Current (rendered) and target (desired) tilt state.
    const cur: Vec = { rx: 0, ry: 0, lift: 0 };
    const tgt: Vec = { rx: 0, ry: 0, lift: 0 };
    // Pointer position on the surface, normalised 0..1 (for the caustic + edge).
    let px = 0.5;
    let py = 0.5;

    let rafId = 0;
    let running = false;

    const setVars = () => {
      // Highlight follows the pointer; opacity rides the lift so it fades with hover.
      el.style.setProperty("--rc-rx", `${cur.rx.toFixed(3)}deg`);
      el.style.setProperty("--rc-ry", `${cur.ry.toFixed(3)}deg`);
      el.style.setProperty("--rc-z", `${cur.lift.toFixed(2)}px`);
      el.style.setProperty("--rc-mx", `${(px * 100).toFixed(2)}%`);
      el.style.setProperty("--rc-my", `${(py * 100).toFixed(2)}%`);
      // Glow opacity scales with how lifted we are (0 at rest -> 1 at full hover).
      el.style.setProperty("--rc-on", (cur.lift / LIFT_Z || 0).toFixed(3));
    };

    const step = () => {
      cur.rx += (tgt.rx - cur.rx) * EASE;
      cur.ry += (tgt.ry - cur.ry) * EASE;
      cur.lift += (tgt.lift - cur.lift) * EASE;
      setVars();

      const settled =
        Math.abs(tgt.rx - cur.rx) < SETTLE_EPS &&
        Math.abs(tgt.ry - cur.ry) < SETTLE_EPS &&
        Math.abs(tgt.lift - cur.lift) < SETTLE_EPS;

      if (settled) {
        // Snap to target and stop — no idle frames.
        cur.rx = tgt.rx;
        cur.ry = tgt.ry;
        cur.lift = tgt.lift;
        setVars();
        running = false;
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(step);
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(step);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = (e.clientX - r.left) / r.width; // 0..1
      const ny = (e.clientY - r.top) / r.height; // 0..1
      px = Math.min(1, Math.max(0, nx));
      py = Math.min(1, Math.max(0, ny));
      // Cursor right -> rotateY positive (card turns toward pointer); down -> rotateX negative.
      tgt.ry = (px - 0.5) * 2 * MAX_TILT;
      tgt.rx = -(py - 0.5) * 2 * MAX_TILT;
      tgt.lift = LIFT_Z;
      ensureLoop();
    };

    const onEnter = (e: PointerEvent) => {
      onMove(e);
    };

    const onLeave = () => {
      tgt.rx = 0;
      tgt.ry = 0;
      tgt.lift = 0;
      px = 0.5;
      py = 0.5;
      ensureLoop();
    };

    // Keyboard affordance: focus inside the card lights the (centred) glow,
    // blur releases it. No tilt — purely the rim cue, so it isn't mouse-only.
    const onFocusIn = () => {
      px = 0.5;
      py = 0.5;
      tgt.lift = LIFT_Z;
      ensureLoop();
    };
    const onFocusOut = () => {
      // Only release if focus actually left the card subtree.
      window.requestAnimationFrame(() => {
        if (!el.contains(document.activeElement)) {
          tgt.lift = 0;
          ensureLoop();
        }
      });
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    // If reduced-motion is toggled on at runtime, neutralise immediately.
    const onReduceChange = () => {
      if (reduce.matches) {
        tgt.rx = tgt.ry = tgt.lift = 0;
        cur.rx = cur.ry = cur.lift = 0;
        setVars();
      }
    };
    reduce.addEventListener("change", onReduceChange);

    el.classList.add("rc-active");

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      reduce.removeEventListener("change", onReduceChange);
      if (rafId) cancelAnimationFrame(rafId);
      el.classList.remove("rc-active");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("rc-root", className)}
      style={style}
      data-refract-card=""
    >
      {/* The tilting plane — only the surface transforms; content rides along. */}
      <div className="rc-plane">
        {/* Decorative refraction overlays (only visible once rc-active). */}
        <span aria-hidden className="rc-caustic" />
        <span aria-hidden className="rc-edge" />
        {children}
      </div>

      {/* Component-scoped styles. Self-contained so no shared file is touched. */}
      <style>{CSS}</style>
    </div>
  );
}

/*
  Styles are intentionally inert until JS adds `.rc-active` (set only when the
  interactive path is live). Without it, RefractCard is a plain pass-through box:
  no transform, no overlays — the graceful static fallback for SSR, touch and
  reduced-motion.
*/
const CSS = `
.rc-root {
  position: relative;
  /* Establish the 3D viewing distance for the child plane. */
  perspective: 1100px;
  perspective-origin: var(--rc-mx, 50%) var(--rc-my, 50%);
  --rc-rx: 0deg;
  --rc-ry: 0deg;
  --rc-z: 0px;
  --rc-mx: 50%;
  --rc-my: 50%;
  --rc-on: 0;
}

.rc-plane {
  position: relative;
  border-radius: inherit;
  transform-style: preserve-3d;
  /* No transform until active, so the inert fallback is pixel-identical. */
}

.rc-active .rc-plane {
  transform: rotateX(var(--rc-rx)) rotateY(var(--rc-ry))
    translateZ(var(--rc-z));
  /* Transform is rAF-lerped via the CSS vars; will-change hints the compositor. */
  will-change: transform;
}

/* The overlays inherit the card's rounded corners and never eat pointer events. */
.rc-caustic,
.rc-edge {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  z-index: 2;
}

/* Specular caustic — a soft celeste/foam pool of light that tracks the pointer. */
.rc-active .rc-caustic {
  background: radial-gradient(
    22rem 22rem at var(--rc-mx) var(--rc-my),
    rgb(244 250 251 / 0.18) 0%,
    rgb(155 211 238 / 0.14) 26%,
    rgb(155 211 238 / 0) 60%
  );
  opacity: var(--rc-on);
  mix-blend-mode: screen;
  transition: opacity 280ms ease-out;
}

/* Edge refraction — a faint celeste rim glow, brightest on the leading edge
   nearest the cursor (the conic highlight is biased by the pointer position). */
.rc-active .rc-edge {
  /* Thin inner ring of light just inside the border. */
  box-shadow:
    inset 0 0 0 1px rgb(155 211 238 / 0.22),
    inset 0 0 18px rgb(155 211 238 / 0.10);
  /* A directional sheen pooling toward the pointer-side edge. */
  background:
    radial-gradient(
      60% 60% at var(--rc-mx) var(--rc-my),
      rgb(199 230 244 / 0.10) 0%,
      rgb(199 230 244 / 0) 70%
    );
  opacity: var(--rc-on);
  transition: opacity 320ms ease-out;
}

/* Honour reduced-motion even if classes are present (belt and braces). */
@media (prefers-reduced-motion: reduce) {
  .rc-plane { transform: none !important; }
  .rc-caustic,
  .rc-edge { opacity: 0 !important; }
}

/* Coarse pointers (touch): never show the glass response. */
@media (pointer: coarse) {
  .rc-plane { transform: none !important; }
  .rc-caustic,
  .rc-edge { opacity: 0 !important; }
}
`;

"use client";

import * as React from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * Loupe — the inspection glass over a real capture (REDESIGN-SPEC §E.8).
 *
 * Aceternity Lens and the Magic UI lens were studied and re-expressed with no
 * dependency: the capture is printed once at its cell size, and a SECOND copy
 * of the same file is laid over it at 2× under
 * `mask-image: radial-gradient(circle <r> at var(--lx) var(--ly), #000 98%, transparent)`.
 * The pointer writes `--lx/--ly` through `gsap.quickTo` (80ms) — no React state
 * per pointer move, no second rAF: quickTo's tween rides the shared ticker that
 * Lenis already steps. The magnified layer is offset by `-lx / -ly` so the point
 * under the glass stays under the glass.
 *
 * Disabled — the plain capture, no glass — on touch and under reduced motion
 * (§E.8: there the tap just opens the sub-form). Decorative: the layer is
 * `aria-hidden`; the accessible name belongs to the link that wraps the cell.
 */
export interface LoupeProps {
  src: string;
  /** Printed size of the cell (the capture is drawn to fit it). */
  width: number;
  height: number;
  /**
   * Radius of the glass, px — 90 on a full-width capture (§E.8), scaled down on
   * a cell. At 40px on a 160×100 cell it read as a rendering artefact rather
   * than an instrument (finish review F13): the glass is now 60px there, and it
   * carries a 1px ink rim so the eye reads a lens.
   */
  radius?: number;
  className?: string;
}

export function Loupe({ src, width, height, radius = 90, className }: LoupeProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const glassRef = React.useRef<HTMLSpanElement>(null);
  const rimRef = React.useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const glass = glassRef.current;
      if (!root || !glass) return;
      // coarse pointer (no hover) or reduced motion → the glass never arms
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // quickTo drives a PLAIN OBJECT (never the CSS var directly: `resetTo`
      // wants a real tween property) and writes both custom properties in one
      // onUpdate — one tween, one style write per frame, on the shared ticker.
      // The magnified copy is the ORIGINAL file (next/image only optimises the
      // <Image> below it), so leaving `background-image` in the inline style made
      // every visitor download it eagerly — 199 KiB of /captures/sersan-io-1600.webp
      // on the home sheet, on mobile too, for a layer that can never arm there.
      // It is attached here instead: only on a hover-capable pointer, and only
      // once the main thread is idle, so it is off the critical path.
      const arm = () => {
        glass.style.backgroundImage = `url(${src})`;
      };
      const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
      const idle = ric ? ric(arm, { timeout: 2500 }) : window.setTimeout(arm, 1200);
      const disarm = () => (ric ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));

      const rim = rimRef.current;
      const pos = { x: 0, y: 0 };
      const write = () => {
        glass.style.setProperty("--lx", `${pos.x}px`);
        glass.style.setProperty("--ly", `${pos.y}px`);
        if (rim) {
          rim.style.setProperty("--lx", `${pos.x}px`);
          rim.style.setProperty("--ly", `${pos.y}px`);
        }
      };
      const xTo = gsap.quickTo(pos, "x", { duration: 0.08, ease: "none", onUpdate: write });
      const yTo = gsap.quickTo(pos, "y", { duration: 0.08, ease: "none", onUpdate: write });

      const local = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const move = (e: PointerEvent) => {
        const p = local(e);
        xTo(p.x);
        yTo(p.y);
      };
      const enter = (e: PointerEvent) => {
        // hovered before idle fired: attach it now rather than show a bare mask
        if (!glass.style.backgroundImage) arm();
        // land the glass where the pointer entered, with no travel from 0,0
        const p = local(e);
        xTo.tween.kill();
        yTo.tween.kill();
        pos.x = p.x;
        pos.y = p.y;
        write();
        gsap.to([glass, rim].filter(Boolean), { opacity: 1, duration: 0.12, ease: "none" });
      };
      const leave = () =>
        gsap.to([glass, rim].filter(Boolean), { opacity: 0, duration: 0.12, ease: "none" });

      root.addEventListener("pointerenter", enter);
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerleave", leave);
      return () => {
        disarm();
        root.removeEventListener("pointerenter", enter);
        root.removeEventListener("pointermove", move);
        root.removeEventListener("pointerleave", leave);
        // listener-born tweens live outside this context: kill them by hand
        xTo.tween.kill();
        yTo.tween.kill();
        const layers = [glass, rim].filter(Boolean) as HTMLElement[];
        gsap.killTweensOf(layers);
        gsap.set(layers, { clearProps: "opacity" });
      };
    },
    { scope: rootRef, dependencies: [src] },
  );

  return (
    <span
      ref={rootRef}
      className={cn("relative block overflow-hidden bg-paper-field", className)}
      style={{ width, height }}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes={`${width}px`}
        className="block h-full w-full object-cover"
      />
      <span
        ref={glassRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[var(--z-loupe)] opacity-0"
        style={
          {
            "--lx": "0px",
            "--ly": "0px",
            /* backgroundImage is attached by the effect above (idle, fine pointer
               only) — never in the inline style, which would fetch it eagerly. */
            backgroundSize: "200% 200%",
            backgroundPosition: "calc(var(--lx) * -1) calc(var(--ly) * -1)",
            backgroundRepeat: "no-repeat",
            maskImage: `radial-gradient(circle ${radius}px at var(--lx) var(--ly), #000 98%, transparent)`,
            WebkitMaskImage: `radial-gradient(circle ${radius}px at var(--lx) var(--ly), #000 98%, transparent)`,
          } as React.CSSProperties
        }
      />
      {/* The rim of the lens: an ink ring on the same centre, drawn as a second
          masked layer so it costs no extra paint of the raster. It rides the
          same `--lx/--ly` the glass does, so it can never drift off it. */}
      <span
        ref={rimRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[var(--z-loupe)] opacity-0"
        style={
          {
            "--lx": "0px",
            "--ly": "0px",
            background: `radial-gradient(circle ${radius}px at var(--lx) var(--ly), transparent 0 ${radius - 1}px, var(--color-ink) ${radius - 1}px ${radius}px, transparent ${radius}px)`,
          } as React.CSSProperties
        }
      />
    </span>
  );
}

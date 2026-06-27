"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/*
  SkiperCurrentThread — ocean-adapted reconstruction of Skiper UI's "Skiper19"
  (https://skiper-ui.com/v1/skiper19), a scroll-driven SVG stroke that DRAWS
  ITSELF as you scroll. Skiper19 maps Framer Motion `useScroll` -> a motion.path
  `pathLength` [0.5..1]. This site runs GSAP + Lenis (scroll piped through
  gsap.ticker), not Framer Motion, so the same technique is rebuilt faithfully
  with ScrollTrigger `scrub` driving `strokeDashoffset` (no premium DrawSVG
  plugin needed — pure CSS dash math).

  Reimagined for the portfolio: instead of a flat lime squiggle on white, this
  is a "diver's descent line" — a sinuous deep-current thread that runs down the
  spine of the Work column and inks itself in celeste as the visitor descends,
  with a glowing bead riding the drawn head and bubbles rising in its wake. It
  sits BEHIND the project cards as a decorative layer.

  Contract:
    - Self-contained. Renders ONE absolutely-positioned, full-height SVG sized
      to its relative parent. The host gives the parent `position: relative` and
      mounts this as the first child (see mountSnippet in the handoff).
    - Decorative -> aria-hidden; never reaches assistive tech, no keyboard role.
    - prefers-reduced-motion => the full path is drawn statically (no scrub, no
      rAF, no bead/bubbles); the visual still reads as a finished current line.
    - Performant: a single ScrollTrigger with scrub; bead + bubbles are GSAP
      quickSetters updated from the SAME scrub tween's onUpdate (no extra rAF).
      All animations are scoped to the component and reverted on unmount via
      useGSAP — no leaked ScrollTriggers or listeners.
    - SSR-safe: all GSAP work lives inside useGSAP (client-only effect); the
      markup renders identically on the server.

  @theme tokens mirrored as literals (CSP-safe inline SVG can't read CSS vars
  reliably across all engines): celeste #9bd3ee, celeste-soft #c7e6f4,
  foam #f4fafb, deep #0b2c3a.
*/

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// --- palette (mirrors globals @theme) --------------------------------------
const CELESTE = "#9bd3ee";
const CELESTE_SOFT = "#c7e6f4";
const FOAM = "#f4fafb";
const DEEP = "#0b2c3a";

// --- path geometry ----------------------------------------------------------
// A tall sinuous current down a 1000-unit-high viewBox. preserveAspectRatio is
// set to "none" so the path stretches to the column's real height while the
// horizontal sway stays proportional. The curve weaves left<->right like a
// drifting descent line; amplitude eases in then out so head and tail are calm.
const VB_W = 200;
const VB_H = 1000;

function buildCurrentPath(): string {
  const cx = VB_W / 2;
  const steps = 9; // number of sway lobes down the column
  const amp = 46; // max horizontal sway in viewBox units
  let d = `M ${cx} 0`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const prevT = (i - 1) / steps;
    // ease amplitude in/out (calm at both ends, fullest in the middle)
    const env = Math.sin(t * Math.PI);
    const x = cx + Math.sin(t * Math.PI * 2 * 2.5) * amp * env;
    const y = t * VB_H;
    // control points sit halfway between samples on the vertical axis for a
    // smooth cubic weave
    const cy1 = (prevT + (t - prevT) * 0.5) * VB_H;
    const prevEnv = Math.sin(prevT * Math.PI);
    const prevX = cx + Math.sin(prevT * Math.PI * 2 * 2.5) * amp * prevEnv;
    d += ` C ${prevX} ${cy1}, ${x} ${cy1}, ${x} ${y}`;
  }
  return d;
}

const CURRENT_D = buildCurrentPath();

export function SkiperCurrentThread({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const beadRef = useRef<SVGGElement>(null);
  const bubblesRef = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      const path = pathRef.current;
      const glow = glowPathRef.current;
      const bead = beadRef.current;
      const bubblesG = bubblesRef.current;
      if (!path || !glow) return;

      const len = path.getTotalLength();

      // Prime both strokes for dash-draw. Skiper19 animates motion-path
      // `pathLength` 0.5->1; here strokeDashoffset len->0 is the same draw,
      // expressed for SVG/GSAP. We start mostly hidden (a short lead already
      // inked, echoing Skiper19's [0.5..1] floor) and reveal the rest on scroll.
      const LEAD = 0.04; // fraction already drawn at scroll start
      gsap.set([path, glow], {
        strokeDasharray: len,
        strokeDashoffset: len * (1 - LEAD),
      });

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduce) {
        // Static finished line; hide the live bead/bubbles.
        gsap.set([path, glow], { strokeDashoffset: 0 });
        if (bead) gsap.set(bead, { autoAlpha: 0 });
        if (bubblesG) gsap.set(bubblesG, { autoAlpha: 0 });
        return;
      }

      // Bead + bubbles ride the drawn head. quickSetters avoid per-frame object
      // churn. We position the bead at the current head point of the path.
      const setBeadX = bead ? gsap.quickSetter(bead, "x", "px") : null;
      const setBeadY = bead ? gsap.quickSetter(bead, "y", "px") : null;

      // Bubbles: a small pool that we (re)seed near the head as it advances, then
      // let drift upward — a wake of rising air. Each has its own phase.
      const bubbleEls = bubblesG
        ? (Array.from(bubblesG.children) as SVGCircleElement[])
        : [];
      const bubbleState = bubbleEls.map((_, i) => ({
        // staggered release points along [0,1] head progress
        seedAt: (i + 0.5) / bubbleEls.length,
        x: 0,
        y: 0,
        born: false,
      }));

      // We need viewBox->local px mapping for the bead/bubbles since the SVG uses
      // preserveAspectRatio="none". getPointAtLength returns viewBox coords; map
      // them through the live SVG client size each update.
      const svg = path.ownerSVGElement;

      const mapPoint = (vbX: number, vbY: number) => {
        const rect = svg?.getBoundingClientRect();
        const w = rect?.width ?? VB_W;
        const h = rect?.height ?? VB_H;
        return { x: (vbX / VB_W) * w, y: (vbY / VB_H) * h };
      };

      let lastHead = LEAD;

      const onUpdate = (self: ScrollTrigger) => {
        const p = self.progress; // 0..1 across the column
        // head = how much of the path is inked (lead + scroll reveal)
        const head = LEAD + (1 - LEAD) * p;
        const off = len * (1 - head);
        path.style.strokeDashoffset = String(off);
        glow.style.strokeDashoffset = String(off);

        // bead at the head point
        const headPt = path.getPointAtLength(len * head);
        const m = mapPoint(headPt.x, headPt.y);
        if (setBeadX && setBeadY) {
          setBeadX(m.x);
          setBeadY(m.y);
        }

        // bubbles: born once the head passes their seed point; afterwards they
        // float up and fade, looping subtly. Drift is a function of how far the
        // head has gone past the seed (scroll-coupled, no separate clock).
        for (let i = 0; i < bubbleEls.length; i++) {
          const st = bubbleState[i];
          const el = bubbleEls[i];
          if (head < st.seedAt) {
            el.style.opacity = "0";
            continue;
          }
          const past = head - st.seedAt; // 0..(1-seedAt)
          // seed position = path point at seedAt
          const sp = path.getPointAtLength(len * st.seedAt);
          const sm = mapPoint(sp.x, sp.y);
          const rise = past * 260; // px risen with scroll
          const sway = Math.sin(past * 22 + i) * 9;
          el.setAttribute("cx", String(sm.x + sway));
          el.setAttribute("cy", String(sm.y - rise));
          const life = Math.min(1, past / 0.16);
          const fade = Math.max(0, 1 - past / 0.32);
          el.style.opacity = String(0.5 * life * fade);
        }

        lastHead = head;
      };

      ScrollTrigger.create({
        trigger: rootRef.current!,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 0.6,
        onUpdate,
        onRefresh: (self) => onUpdate(self),
      });

      // bead idle shimmer (independent, cheap, paused offscreen by ST refresh)
      if (bead) {
        gsap.to(bead, {
          scale: 1.25,
          transformOrigin: "center",
          repeat: -1,
          yoyo: true,
          duration: 1.4,
          ease: "sine.inOut",
        });
      }

      // keep head mapping correct on resize (preserveAspectRatio="none")
      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      void lastHead;

      return () => {
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        fill="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="sct-stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CELESTE_SOFT} stopOpacity="0.95" />
            <stop offset="55%" stopColor={CELESTE} stopOpacity="0.8" />
            <stop offset="100%" stopColor={DEEP} stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="sct-bead" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={FOAM} stopOpacity="1" />
            <stop offset="40%" stopColor={CELESTE_SOFT} stopOpacity="0.9" />
            <stop offset="100%" stopColor={CELESTE} stopOpacity="0" />
          </radialGradient>
          <filter id="sct-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft underglow stroke (blurred, behind the crisp line) */}
        <path
          ref={glowPathRef}
          d={CURRENT_D}
          stroke={CELESTE}
          strokeWidth={9}
          strokeOpacity={0.35}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter="url(#sct-glow)"
        />

        {/* crisp inked current */}
        <path
          ref={pathRef}
          d={CURRENT_D}
          stroke="url(#sct-stroke)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* rising bubble wake (positioned in px-space by onUpdate) */}
        <g ref={bubblesRef}>
          {Array.from({ length: 9 }).map((_, i) => (
            <circle
              key={i}
              r={1.5 + (i % 3) * 0.8}
              fill={CELESTE_SOFT}
              fillOpacity={0.8}
              opacity={0}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {/* glowing diver bead riding the drawn head */}
        <g ref={beadRef}>
          <circle r={16} fill="url(#sct-bead)" />
          <circle r={3.5} fill={FOAM} />
        </g>
      </svg>
    </div>
  );
}

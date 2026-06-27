"use client";

import { useEffect, useRef } from "react";
import type { SkillGroup } from "@/data/skills";

/*
  SkillsConstellation — a "seabed of glowing knowledge" that lives BEHIND the
  Skills grid. Each skill is a faint node suspended in the dark water; nodes in
  a group are linked by thin caustic lines into a cluster, and clusters drift
  with a slow sine bob. The cluster nearest the pointer brightens and its links
  tauten toward the cursor — like fish reacting to a passing diver.

  Self-contained: pure Canvas 2D (no three/GSAP/Lenis), DPR-aware, single rAF,
  full listener/observer cleanup. Decorative -> the host mounts it aria-hidden.

  Optional cross-talk: if the real skill <li> dispatches a CustomEvent on
  window — `skills-constellation:hover` with detail { group, item } (item null
  to clear) — the matching node pulses. Never required; a graceful no-op when
  the event is never fired.

  Reduced motion: renders a single static dotted constellation with hairline
  links — no drift, no pointer reaction, no rAF.
*/

type Node = {
  group: number;
  item: string;
  /** layout anchor in [0,1] section space */
  bx: number;
  by: number;
  /** live screen-space position (px), updated per frame */
  x: number;
  y: number;
  r: number;
  /** per-node phase offsets for organic bob/twinkle */
  pa: number;
  pb: number;
  /** 0..1 pulse envelope from an external <li> hover */
  pulse: number;
};

type Cluster = {
  group: number;
  /** layout center in [0,1] */
  cx: number;
  cy: number;
  /** live screen-space center (px) */
  x: number;
  y: number;
  phase: number;
  /** 0..1 smoothed proximity to pointer */
  glow: number;
  nodes: Node[];
};

// Brand palette (mirrors @theme tokens in globals.css).
const ABYSS = "7, 34, 46"; // --color-abyss
const CELESTE = "155, 211, 238"; // --color-celeste
const CELESTE_SOFT = "199, 230, 244"; // --color-celeste-soft
const FOAM = "244, 250, 251"; // --color-foam

export function SkillsConstellation({
  skillGroups,
  className,
}: {
  skillGroups: SkillGroup[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ---- Deterministic layout in [0,1] section space -------------------
    // Clusters sit on a loose, slightly irregular grid so the field reads as
    // scattered constellations rather than a table. A small hash keeps it
    // stable across renders (no flicker on resize).
    const n = skillGroups.length;
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);

    const hash = (s: string) => {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return ((h >>> 0) % 1000) / 1000; // 0..1
    };

    const clusters: Cluster[] = skillGroups.map((g, gi) => {
      const col = gi % cols;
      const row = Math.floor(gi / cols);
      const jx = (hash(g.label.en) - 0.5) * 0.14;
      const jy = (hash(g.label.en + "y") - 0.5) * 0.14;
      const cx = (col + 0.5) / cols + jx;
      const cy = (row + 0.5) / rows + jy;

      const nodes: Node[] = g.items.map((item, ii) => {
        // Petals around the cluster center; radius scaled so groups don't bleed.
        const a =
          (ii / g.items.length) * Math.PI * 2 + hash(item) * Math.PI * 2;
        const rad = 0.05 + hash(item + "r") * 0.055;
        return {
          group: gi,
          item,
          bx: cx + Math.cos(a) * rad,
          by: cy + Math.sin(a) * rad * 0.82,
          x: 0,
          y: 0,
          r: 1.4 + hash(item + "s") * 1.3,
          pa: hash(item + "a") * Math.PI * 2,
          pb: hash(item + "b") * Math.PI * 2,
          pulse: 0,
        };
      });

      return {
        group: gi,
        cx,
        cy,
        x: 0,
        y: 0,
        phase: hash(g.label.en + "p") * Math.PI * 2,
        glow: 0,
        nodes,
      };
    });

    const allNodes = clusters.flatMap((c) => c.nodes);

    // ---- Sizing (DPR-aware) -------------------------------------------
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Project [0,1] layout into px, with a margin so nodes never kiss the edge.
    const MX = 0.06;
    const MY = 0.08;
    const px = (nx: number) => (MX + nx * (1 - 2 * MX)) * w;
    const py = (ny: number) => (MY + ny * (1 - 2 * MY)) * h;

    // ---- Pointer (smoothed) -------------------------------------------
    const pointer = { x: -9999, y: -9999, active: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    // ---- External <li> hover pulse ------------------------------------
    const onHover = (e: Event) => {
      const detail = (e as CustomEvent<{ group?: string; item: string | null }>)
        .detail;
      if (!detail) return;
      for (const node of allNodes) {
        if (detail.item && node.item === detail.item) node.pulse = 1;
      }
    };

    // ---- Static render (reduced motion) -------------------------------
    const renderStatic = () => {
      for (const c of clusters) {
        c.x = px(c.cx);
        c.y = py(c.cy);
        for (const node of c.nodes) {
          node.x = px(node.bx);
          node.y = py(node.by);
        }
      }
      ctx.clearRect(0, 0, w, h);
      drawLinks(0.16);
      for (const node of allNodes) drawNode(node, 0.5);
    };

    // ---- Drawing helpers ----------------------------------------------
    const drawLinks = (baseAlpha: number) => {
      for (const c of clusters) {
        const a = baseAlpha + c.glow * 0.34;
        ctx.lineWidth = 0.7 + c.glow * 0.6;
        for (const node of c.nodes) {
          // node -> cluster center (the caustic web)
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(c.x, c.y);
          const grad = ctx.createLinearGradient(node.x, node.y, c.x, c.y);
          grad.addColorStop(0, `rgba(${CELESTE}, 0)`);
          grad.addColorStop(1, `rgba(${CELESTE}, ${a})`);
          ctx.strokeStyle = grad;
          ctx.stroke();
        }
      }
    };

    const drawNode = (node: Node, alpha: number) => {
      const c = clusters[node.group];
      const lit = Math.min(1, alpha + c.glow * 0.5 + node.pulse);
      const rr = node.r * (1 + node.pulse * 1.1 + c.glow * 0.25);

      // soft halo
      const halo = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        rr * 6,
      );
      const tint = node.pulse > 0.02 ? FOAM : CELESTE;
      halo.addColorStop(0, `rgba(${tint}, ${0.22 * lit})`);
      halo.addColorStop(1, `rgba(${tint}, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rr * 6, 0, Math.PI * 2);
      ctx.fill();

      // core
      ctx.beginPath();
      ctx.arc(node.x, node.y, rr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${node.pulse > 0.02 ? FOAM : CELESTE_SOFT}, ${Math.min(
        1,
        0.5 + lit * 0.5,
      )})`;
      ctx.fill();
    };

    if (reduced) {
      renderStatic();
      // Still react to resize; just re-lay-out statically.
      const onResizeStatic = () => {
        resize();
        renderStatic();
      };
      window.addEventListener("resize", onResizeStatic);
      window.addEventListener("skills-constellation:hover", onHover);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", onResizeStatic);
        window.removeEventListener("skills-constellation:hover", onHover);
      };
    }

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("skills-constellation:hover", onHover);

    // ---- Animation loop -----------------------------------------------
    let raf = 0;
    let t0 = performance.now();
    let running = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running && !raf) {
          t0 = performance.now();
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      const t = (now - t0) / 1000;

      // 1) Resolve cluster centers with a slow group bob.
      for (const c of clusters) {
        const bob = Math.sin(t * 0.32 + c.phase) * 0.012;
        const sway = Math.cos(t * 0.21 + c.phase) * 0.01;
        c.x = px(c.cx + sway);
        c.y = py(c.cy + bob);
      }

      // 2) Pointer proximity -> per-cluster glow (smoothed).
      for (const c of clusters) {
        let target = 0;
        if (pointer.active) {
          const dx = pointer.x - c.x;
          const dy = pointer.y - c.y;
          const d = Math.hypot(dx, dy);
          const reach = Math.min(w, h) * 0.42;
          target = Math.max(0, 1 - d / reach);
          target *= target; // ease-in falloff
        }
        c.glow += (target - c.glow) * 0.08;
      }

      // 3) Node positions: individual bob + attraction toward pointer for the
      //    lit cluster (the "fish turning to the diver").
      for (const node of allNodes) {
        const c = clusters[node.group];
        const wob =
          Math.sin(t * 0.9 + node.pa) * 0.006 +
          Math.cos(t * 0.6 + node.pb) * 0.006;
        let nx = px(node.bx + wob);
        let ny = py(node.by + wob * 0.7);

        if (c.glow > 0.01 && pointer.active) {
          const dx = pointer.x - nx;
          const dy = pointer.y - ny;
          const pull = c.glow * 0.16;
          nx += dx * pull;
          ny += dy * pull;
        }
        node.x = nx;
        node.y = ny;

        // decay external pulse
        if (node.pulse > 0) node.pulse = Math.max(0, node.pulse - 0.018);
      }

      // 4) Paint.
      ctx.clearRect(0, 0, w, h);

      // When a cluster is lit, draw a taut line from its center to the pointer.
      if (pointer.active) {
        for (const c of clusters) {
          if (c.glow < 0.04) continue;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.lineWidth = 0.6 + c.glow * 0.8;
          ctx.strokeStyle = `rgba(${CELESTE_SOFT}, ${c.glow * 0.3})`;
          ctx.stroke();
        }
      }

      drawLinks(0.1);
      // twinkle baseline per node
      for (const node of allNodes) {
        const tw = 0.4 + (0.5 + 0.5 * Math.sin(t * 1.4 + node.pa)) * 0.35;
        drawNode(node, tw);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("skills-constellation:hover", onHover);
    };
  }, [skillGroups]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

"use client";

/*
  TechCloud — "Tech Constellation"

  An ocean-adapted reimagining of the Magic UI Icon Cloud
  (https://magicui.design/docs/components/icon-cloud). The reference renders a
  rotating, draggable 3D sphere of ICONS onto a <canvas>, distributing nodes via
  a Fibonacci (golden-angle) sphere, then per-frame applying a rotation matrix
  and a z-depth scale/opacity projection inside a requestAnimationFrame loop;
  idle = auto-rotate biased by cursor position, drag = rotate by pointer delta.

  We KEEP that technique (Fibonacci sphere · rotX/rotY matrix · z-depth
  scale+opacity · rAF · drag + idle drift) but DROP the canvas + external icon
  CDN. Instead each node is a real DOM text-chip carrying a live skill name from
  src/data/skills.ts — glowing celeste like bioluminescent plankton suspended in
  the abyss. DOM lets us render crisp variable-font text, do real hover/keyboard
  focus highlight, and lean on the site's @theme tokens. Decorative depth cues
  are aria-hidden; the chips themselves are a real, keyboard-reachable list.

  prefers-reduced-motion: no rAF — a single static, tastefully tilted sphere.
  SSR-safe (no window access at module scope; all browser work in effects).
*/

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { skillGroups } from "@/data/skills";

type Node = {
  /** unit-sphere coordinates from the Fibonacci distribution */
  x: number;
  y: number;
  z: number;
  label: string;
  /** index of the owning skill group (drives the celeste hue band) */
  group: number;
  id: number;
};

type Rotation = { x: number; y: number };

/** A flick-to-face target the way Icon Cloud eases toward a clicked node. */
type TargetRotation = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  duration: number;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Flatten skillGroups into a single node list and lay them out on a unit
 * sphere with the golden-angle Fibonacci spiral (identical math to the
 * reference, just feeding real labels). Stable across renders.
 */
function buildNodes(): Node[] {
  const flat: { label: string; group: number }[] = [];
  skillGroups.forEach((g, gi) => {
    g.items.forEach((label) => flat.push({ label, group: gi }));
  });

  const n = flat.length;
  const increment = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const offset = 2 / n;

  return flat.map((item, i) => {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    return {
      x: Math.cos(phi) * r,
      y,
      z: Math.sin(phi) * r,
      label: item.label,
      group: item.group,
      id: i,
    };
  });
}

/** Slight hue spread across groups, all within the celeste family. */
function chipHue(group: number, total: number): number {
  // 188 (teal-cyan) -> 205 (sky) — never leaves the ocean accent band.
  const t = total <= 1 ? 0 : group / (total - 1);
  return 188 + t * 17;
}

export function TechCloud({ className }: { className?: string }) {
  const nodes = useMemo(buildNodes, []);
  const groupCount = skillGroups.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<Rotation>({ x: -0.35, y: 0 }); // gentle initial tilt
  const targetRef = useRef<TargetRotation | null>(null);
  const draggingRef = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  // Normalized cursor offset from centre (-1..1) — biases idle drift speed/dir.
  const cursorBias = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const reducedRef = useRef(false);

  const [radius, setRadius] = useState(190);
  const [active, setActive] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  // Per-chip DOM refs so the rAF loop can mutate transforms imperatively
  // (no React re-render per frame — only `active` hover state re-renders).
  const chipRefs = useRef<(HTMLLIElement | null)[]>([]);

  // --- responsive radius (sphere scales with its container) ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      // keep the sphere comfortably inside the box
      setRadius(Math.max(120, Math.min(260, w * 0.42)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- reduced-motion preference ---
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /** Project every node for the current rotation and write transforms/depth. */
  const project = useCallback(
    (rot: Rotation) => {
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);
      const R = radius;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const el = chipRefs.current[i];
        if (!el) continue;

        // Same rotation matrix the Icon Cloud uses (Y then X).
        const rx = node.x * cosY - node.z * sinY;
        const rz = node.x * sinY + node.z * cosY;
        const ry = node.y * cosX + rz * sinX;

        // z in [-1,1] -> depth in [0,1] (1 = nearest the viewer).
        const depth = (rz + 1) / 2;
        const scale = 0.55 + depth * 0.75;
        const opacity = 0.2 + depth * 0.8;

        const tx = rx * R;
        const ty = ry * R;

        el.style.transform = `translate3d(calc(${tx}px - 50%), calc(${ty}px - 50%), 0) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(Math.round(depth * 1000));
        // glow strength tracks depth so near plankton burn brighter
        el.style.setProperty("--glow", (0.15 + depth * 0.55).toFixed(3));
        el.style.filter = `blur(${(1 - depth) * 1.1}px)`;
      }
    },
    [nodes, radius],
  );

  // --- main animation loop (skipped entirely under reduced motion) ---
  useEffect(() => {
    if (reduced) {
      // Static, tastefully tilted projection — one pass, no rAF.
      project({ x: -0.4, y: 0.5 });
      return;
    }

    const animate = () => {
      const rot = rotationRef.current;

      if (targetRef.current) {
        // Ease toward a focused/clicked node (Icon Cloud "flick-to-face").
        const tgt = targetRef.current;
        const elapsed = performance.now() - tgt.startTime;
        const p = Math.min(1, elapsed / tgt.duration);
        const e = easeOutCubic(p);
        rot.x = tgt.startX + (tgt.x - tgt.startX) * e;
        rot.y = tgt.startY + (tgt.y - tgt.startY) * e;
        if (p >= 1) targetRef.current = null;
      } else if (!draggingRef.current) {
        // Idle drift — slow base + cursor-biased nudge, like the reference.
        const bx = cursorBias.current.x;
        const by = cursorBias.current.y;
        rot.y += 0.0016 + bx * 0.006;
        rot.x += by * 0.006;
        // ease tilt back toward the pleasant resting angle
        rot.x += (-0.35 - rot.x) * 0.002;
      }

      project(rot);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduced, project]);

  // --- pointer drag to rotate ---
  const onPointerDown = (e: ReactPointerEvent) => {
    if (reducedRef.current) return;
    draggingRef.current = true;
    targetRef.current = null;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      // cursor offset from centre, normalized to [-1, 1]
      cursorBias.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    }
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    rotationRef.current.y += dx * 0.005;
    rotationRef.current.x += dy * 0.005;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const endDrag = (e: ReactPointerEvent) => {
    draggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  /** Rotate the sphere so a given node faces the viewer (focus/Enter). */
  const faceNode = useCallback((node: Node) => {
    if (reducedRef.current) return;
    const targetY = Math.atan2(node.x, node.z);
    const targetX = -Math.atan2(
      node.y,
      Math.sqrt(node.x * node.x + node.z * node.z),
    );
    const cur = rotationRef.current;
    const dist = Math.hypot(targetX - cur.x, targetY - cur.y);
    targetRef.current = {
      x: targetX,
      y: targetY,
      startX: cur.x,
      startY: cur.y,
      startTime: performance.now(),
      duration: Math.min(1600, Math.max(700, dist * 900)),
    };
  }, []);

  const onChipKeyDown = (e: ReactKeyboardEvent, node: Node) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      faceNode(node);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={
        {
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          maxWidth: "min(80vw, 30rem)",
          margin: "0 auto",
          touchAction: "none",
          cursor: reduced ? "default" : "grab",
          // soft abyssal vignette behind the constellation
          background:
            "radial-gradient(circle at 50% 45%, rgb(155 211 238 / 0.10), rgb(11 44 58 / 0.0) 62%)",
        } as CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={(e) => {
        cursorBias.current = { x: 0, y: 0 };
        endDrag(e);
      }}
    >
      {/* faint core glow — purely decorative */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "32%",
          height: "32%",
          transform: "translate(-50%, -50%)",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgb(155 211 238 / 0.22), transparent 70%)",
          filter: "blur(14px)",
          pointerEvents: "none",
        }}
      />

      <ul
        aria-label="Technologies and tools"
        style={{
          position: "absolute",
          inset: 0,
          listStyle: "none",
          margin: 0,
          padding: 0,
          // anchor the projection origin at the sphere centre
          transformStyle: "preserve-3d",
        }}
      >
        {nodes.map((node, i) => {
          const hue = chipHue(node.group, groupCount);
          const isActive = active === node.id;
          return (
            <li
              key={node.id}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              style={
                {
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  willChange: "transform, opacity",
                  // initial transform set imperatively by project()
                } as CSSProperties
              }
            >
              <button
                type="button"
                onMouseEnter={() => setActive(node.id)}
                onMouseLeave={() => setActive((a) => (a === node.id ? null : a))}
                onFocus={() => {
                  setActive(node.id);
                  faceNode(node);
                }}
                onBlur={() => setActive((a) => (a === node.id ? null : a))}
                onClick={() => faceNode(node)}
                onKeyDown={(e) => onChipKeyDown(e, node)}
                style={
                  {
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    padding: "0.28em 0.7em",
                    borderRadius: "9999px",
                    border: `1px solid hsl(${hue} 70% 78% / ${isActive ? 0.9 : 0.32})`,
                    background: isActive
                      ? `hsl(${hue} 65% 60% / 0.22)`
                      : `hsl(${hue} 60% 40% / 0.10)`,
                    color: isActive
                      ? "var(--color-foam)"
                      : `hsl(${hue} 75% 86%)`,
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                    lineHeight: 1.1,
                    cursor: "pointer",
                    transition:
                      "color 200ms ease, background 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
                    boxShadow: isActive
                      ? `0 0 18px hsl(${hue} 80% 70% / 0.65), 0 0 4px hsl(${hue} 90% 85% / 0.9)`
                      : `0 0 calc(10px * var(--glow, 0.3)) hsl(${hue} 80% 70% / var(--glow, 0.3))`,
                    textShadow: `0 0 6px hsl(${hue} 85% 80% / ${isActive ? 0.9 : 0.45})`,
                  } as CSSProperties
                }
              >
                {node.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TechCloud;

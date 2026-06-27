"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { skillGroups } from "@/data/skills";
import { useLanguage } from "@/components/language-provider";

/*
  BioluminescentSkills — "The Plankton Bloom".

  A signature interactive moment for the Skills section. Every skill in
  src/data/skills.ts becomes a luminous plankton node drifting in deep water,
  arranged in soft constellation clusters by group. Near neighbours are joined
  by faint celeste filaments. The cursor is a current: plankton are pushed gently
  aside and *wake up* — nodes within its radius bloom brighter and pulse, the way
  dinoflagellates light the Sardinian sea when a swimmer disturbs them at night.

  Interaction
  - Pointer: a wake-radius blooms nearby nodes; the whole hovered group co-lights;
    the active label rises near the node.
  - Touch: tap to bloom around the touch point; the bloom decays over ~1.2s.
  - Keyboard: Tab cycles a legend of groups; focusing a group lights that cluster
    and announces it (the canvas itself is decorative/aria-hidden, the legend is
    the accessible control surface).
  - prefers-reduced-motion: no rAF loop, no drift, no pulse — a single static
    painted frame of the field; the legend still lights clusters on focus/hover.

  Engineering (mirrors DepthGauge discipline)
  - Single rAF; all motion is imperative canvas painting — React never re-renders
    per frame. Pointer + hovered-group live in refs read inside the loop.
  - DPR-aware sizing via ResizeObserver; full cleanup of rAF + listeners + RO.
  - SSR-safe: nothing touches window/canvas before mount.

  Self-contained. Ocean tokens are read from --color-* (celeste / tide / foam /
  abyss) so it stays in lockstep with the design system. New i18n keys are NOTED
  for the orchestrator (see file footer) but the component degrades gracefully to
  English fallbacks if they are absent.
*/

type Node = {
  // logical position in 0..1 design space (resized to pixels each frame)
  bx: number;
  by: number;
  // live position (drifts around base)
  x: number;
  y: number;
  // drift phase + speed
  px: number;
  py: number;
  sx: number;
  sy: number;
  r: number; // base radius (px @1x)
  group: number;
  label: string;
  // 0..1 bloom level (eased toward target each frame)
  glow: number;
};

// Read a CSS custom property as an [r,g,b] triple (falls back to a sane default).
function readRGB(el: HTMLElement, name: string, fallback: [number, number, number]) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  if (!raw) return fallback;
  // hex (#rrggbb) — the form used in globals @theme
  const hex = raw.replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ] as [number, number, number];
  }
  const m = raw.match(/(\d+)\D+(\d+)\D+(\d+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number];
  return fallback;
}

export function BioluminescentSkills() {
  const { t, lang } = useLanguage();
  const reduce = usePrefersReducedMotion();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  // Live interaction state read inside the rAF (no re-render).
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1,
    y: -1,
    active: false,
  });
  const hoverGroupRef = useRef<number>(-1);
  // Decaying touch bloom: {x,y,life} life 0..1
  const tapRef = useRef<{ x: number; y: number; life: number }>({ x: 0, y: 0, life: 0 });
  // Under reduced-motion the rAF loop is off; this lets the activeGroup effect
  // request a single static repaint when a legend cluster lights/dims.
  const staticRepaintRef = useRef<(() => void) | null>(null);

  // The accessible legend mirrors the canvas. Hovering/focusing lights a cluster.
  const [activeGroup, setActiveGroup] = useState<number>(-1);
  useEffect(() => {
    hoverGroupRef.current = activeGroup;
    // reduced-motion: no loop is running, so paint the new cluster state once.
    staticRepaintRef.current?.();
  }, [activeGroup]);

  const headingId = useId();

  // Build nodes once per language (labels are not localized but group names are).
  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = [];
    const G = skillGroups.length;
    // Lay groups out on a loose ring; jitter items inside each cluster.
    skillGroups.forEach((grp, gi) => {
      const angle = (gi / G) * Math.PI * 2 - Math.PI / 2;
      // cluster centre, kept inside [0.12, 0.88] margins
      const cx = 0.5 + Math.cos(angle) * 0.3;
      const cy = 0.5 + Math.sin(angle) * 0.32;
      const n = grp.items.length;
      grp.items.forEach((item, ii) => {
        const a = (ii / Math.max(1, n)) * Math.PI * 2 + gi * 1.3;
        const rad = 0.05 + ((ii * 37) % 11) / 110; // pseudo-random spread
        const bx = clamp(cx + Math.cos(a) * rad, 0.06, 0.94);
        const by = clamp(cy + Math.sin(a) * rad, 0.08, 0.92);
        out.push({
          bx,
          by,
          x: bx,
          y: by,
          px: Math.random() * Math.PI * 2,
          py: Math.random() * Math.PI * 2,
          sx: 0.15 + Math.random() * 0.25,
          sy: 0.15 + Math.random() * 0.25,
          r: 2.4 + ((ii * 13) % 7) * 0.35,
          group: gi,
          label: item,
          glow: 0,
        });
      });
    });
    return out;
    // lang in deps so a re-render after language switch is harmless/consistent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const setLabel = useCallback((text: string | null, nx: number, ny: number) => {
    const el = labelRef.current;
    if (!el) return;
    if (!text) {
      el.style.opacity = "0";
      return;
    }
    el.textContent = text;
    el.style.opacity = "1";
    // nx/ny are 0..1; position above-right of the node, clamped to box.
    el.style.left = `${clamp(nx * 100, 4, 92)}%`;
    el.style.top = `${clamp(ny * 100, 6, 94)}%`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const root = document.documentElement;
    const CEL = readRGB(root, "--color-celeste", [155, 211, 238]);
    const TIDE = readRGB(root, "--color-tide", [90, 167, 190]);
    const FOAM = readRGB(root, "--color-foam", [244, 250, 251]);
    // group hue: lerp between tide (cool) and celeste/foam (bright) by index
    const groupRGB = (g: number): [number, number, number] => {
      const f = skillGroups.length > 1 ? g / (skillGroups.length - 1) : 0;
      return [
        Math.round(TIDE[0] + (CEL[0] - TIDE[0]) * f),
        Math.round(TIDE[1] + (CEL[1] - TIDE[1]) * f),
        Math.round(TIDE[2] + (CEL[2] - TIDE[2]) * f),
      ];
    };

    let w = 0;
    let h = 0;
    let dpr = 1;
    const WAKE = 130; // px wake radius around the pointer
    const LINK = 92; // px max distance to draw a constellation filament

    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) paintStatic();
    });
    ro.observe(wrap);

    // ---- paint a node ----
    const drawNode = (n: Node, gl: number) => {
      const [r, g, b] = groupRGB(n.group);
      const px = n.x * w;
      const py = n.y * h;
      const radius = n.r * (1 + gl * 1.6);
      // soft bloom halo
      const halo = radius * (3 + gl * 5);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, halo);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.16 + gl * 0.5})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.05 + gl * 0.18})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, halo, 0, Math.PI * 2);
      ctx.fill();
      // bright core
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${FOAM[0]},${FOAM[1]},${FOAM[2]},${0.55 + gl * 0.45})`;
      ctx.fill();
    };

    // ---- one full frame ----
    const render = (driftT: number) => {
      ctx.clearRect(0, 0, w, h);
      const ptr = pointerRef.current;
      const hg = hoverGroupRef.current;
      const tap = tapRef.current;

      // 1) update positions + glow targets
      for (const n of nodes) {
        // gentle drift around base
        const dx = Math.sin(driftT * n.sx + n.px) * 0.012;
        const dy = Math.cos(driftT * n.sy + n.py) * 0.012;
        let tx = n.bx + dx;
        let ty = n.by + dy;

        // pointer current: push away + bloom
        let target = 0;
        if (ptr.active) {
          const ddx = n.x * w - ptr.x;
          const ddy = n.y * h - ptr.y;
          const dist = Math.hypot(ddx, ddy);
          if (dist < WAKE) {
            const f = 1 - dist / WAKE;
            target = Math.max(target, f * f);
            // shove outward from the cursor (in design space)
            const push = (f * 26) / Math.max(w, h);
            tx += (ddx / (dist || 1)) * push * (w / Math.max(w, h));
            ty += (ddy / (dist || 1)) * push * (h / Math.max(w, h));
          }
        }
        // decaying touch bloom
        if (tap.life > 0) {
          const ddx = n.x * w - tap.x;
          const ddy = n.y * h - tap.y;
          const dist = Math.hypot(ddx, ddy);
          if (dist < WAKE * 1.4) {
            const f = (1 - dist / (WAKE * 1.4)) * tap.life;
            target = Math.max(target, f);
          }
        }
        // group co-light (hover/focus on legend)
        if (hg === n.group) target = Math.max(target, 0.72);

        // base shimmer so the field always breathes a little
        const shimmer = 0.06 + 0.06 * (0.5 + 0.5 * Math.sin(driftT * 1.5 + n.px * 3));
        target = Math.max(target, shimmer);

        n.glow += (target - n.glow) * 0.12;
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
      }

      // 2) constellation filaments — additive, faint
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const bnode = nodes[j];
          if (a.group !== bnode.group) continue; // only link within a cluster
          const ax = a.x * w;
          const ay = a.y * h;
          const bxp = bnode.x * w;
          const byp = bnode.y * h;
          const d = Math.hypot(ax - bxp, ay - byp);
          if (d > LINK) continue;
          const [r, g, b] = groupRGB(a.group);
          const strength = (1 - d / LINK) * (0.1 + (a.glow + bnode.glow) * 0.35);
          ctx.strokeStyle = `rgba(${r},${g},${b},${strength})`;
          ctx.lineWidth = 0.6 + (a.glow + bnode.glow) * 0.6;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bxp, byp);
          ctx.stroke();
        }
      }

      // 3) nodes (additive bloom reads beautifully over abyss)
      for (const n of nodes) drawNode(n, n.glow);
      ctx.globalCompositeOperation = "source-over";

      // 4) DOM label for the brightest node under the pointer
      if (ptr.active) {
        let best: Node | null = null;
        let bestD = Infinity;
        for (const n of nodes) {
          const d = Math.hypot(n.x * w - ptr.x, n.y * h - ptr.y);
          if (d < 34 && d < bestD) {
            bestD = d;
            best = n;
          }
        }
        if (best) setLabel(best.label, best.x, best.y);
        else setLabel(null, 0, 0);
      } else if (hg < 0) {
        setLabel(null, 0, 0);
      }
    };

    // ---- static single frame (reduced motion) ----
    function paintStatic() {
      // settle positions to base, mild shimmer baked in, paint once
      for (const n of nodes) {
        n.x = n.bx;
        n.y = n.by;
        n.glow = hoverGroupRef.current === n.group ? 0.7 : 0.18;
      }
      render(0);
    }

    if (reduce) {
      paintStatic();
      // Expose a static repaint so the activeGroup effect can re-light clusters
      // without any rAF loop (legend focus/hover is the only state that matters).
      staticRepaintRef.current = paintStatic;
      return () => {
        ro.disconnect();
        staticRepaintRef.current = null;
      };
    }

    // ---- animated loop ----
    let raf = 0;
    let start = 0;
    const loop = (ts: number) => {
      if (!start) start = ts;
      const tsec = (ts - start) / 1000;
      if (tapRef.current.life > 0) {
        tapRef.current.life = Math.max(0, tapRef.current.life - 0.016 / 1.2);
      }
      render(tsec);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // ---- pointer wiring ----
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const onLeave = () => {
      pointerRef.current.active = false;
      setLabel(null, 0, 0);
    };
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      tapRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        life: 1,
      };
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [nodes, reduce, setLabel]);

  // Localized strings with English fallbacks (orchestrator may add real keys).
  const eyebrow = t.skills?.eyebrow ?? "Capabilities";
  const heading = t.skills?.heading ?? "The bloom";
  // NOTE keys (see footer): skills.bioCaption, skills.bioHint
  const caption =
    // @ts-expect-error optional new key, falls back below
    t.skills?.bioCaption ??
    (lang === "it"
      ? "Ogni competenza è un organismo bioluminescente. Muovi il cursore come una corrente: il plancton si risveglia."
      : "Every skill is a bioluminescent organism. Move your cursor like a current — the plankton wakes.");
  const hint =
    // @ts-expect-error optional new key, falls back below
    t.skills?.bioHint ??
    (lang === "it" ? "Passa sui gruppi" : "Hover the groups");

  return (
    <section
      id="skills"
      aria-labelledby={headingId}
      className="scroll-anchor relative overflow-hidden bg-abyss py-24 text-foam sm:py-32 md:py-40"
    >
      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl px-6 text-center sm:mb-16">
        <p className="label text-celeste/80">{eyebrow}</p>
        <h2 id={headingId} className="heading-1 mt-4 text-foam">
          {heading}
        </h2>
        <p className="body mx-auto mt-5 max-w-xl text-mist">{caption}</p>
      </div>

      {/* The field */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div
          ref={wrapRef}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-foam/10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(11,44,58,0.9),rgba(7,34,46,1))]"
        >
          {/* decorative animated plankton field */}
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full touch-none"
          />
          {/* floating node label (decorative; the legend carries the a11y) */}
          <div
            ref={labelRef}
            aria-hidden="true"
            className="label pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[160%] whitespace-nowrap rounded-full border border-celeste/30 bg-abyss/70 px-3 py-1 text-[0.62rem] tracking-[0.22em] text-celeste opacity-0 backdrop-blur-sm transition-opacity duration-200"
            style={{ left: "50%", top: "50%" }}
          />
          {/* hint, bottom-right */}
          <span
            aria-hidden="true"
            className="label pointer-events-none absolute bottom-3 right-4 text-[0.55rem] tracking-[0.24em] text-mist/50"
          >
            {hint}
          </span>
        </div>

        {/* Accessible legend = the real control surface.
            Each group is a focusable chip; focus/hover co-lights its cluster.
            Screen readers get the full grouped skill list here. */}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {skillGroups.map((grp, gi) => (
            <li key={grp.label.en}>
              <button
                type="button"
                onMouseEnter={() => setActiveGroup(gi)}
                onMouseLeave={() => setActiveGroup((g) => (g === gi ? -1 : g))}
                onFocus={() => setActiveGroup(gi)}
                onBlur={() => setActiveGroup((g) => (g === gi ? -1 : g))}
                aria-pressed={activeGroup === gi}
                className={[
                  "group/chip cursor-pointer rounded-full border px-4 py-2 text-left transition-colors duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste",
                  activeGroup === gi
                    ? "border-celeste/70 bg-celeste/10 text-foam"
                    : "border-foam/15 bg-foam/[0.03] text-mist hover:border-celeste/40 hover:text-foam",
                ].join(" ")}
              >
                <span className="label text-[0.6rem] tracking-[0.2em]">
                  {grp.label[lang]}
                </span>
                {/* full item list — visible & SR-readable, the data source of truth */}
                <span className="mt-1 block max-w-[14rem] text-[0.78rem] leading-snug text-mist/80">
                  {grp.items.join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/** SSR-safe prefers-reduced-motion hook (matches DepthGauge pattern). */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

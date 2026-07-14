"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/lib/use-hydrated";

/*
  Escort — "LA SCIA": the flock as narrative companion (the Everswap bird
  pattern, home route only). A small squad of gull-glyph birds appears when
  you DIVE (sustained scroll velocity), flies loose-V formation with you,
  and planes away when the page rests. Crossing into the night band they
  turn from ink to ember — at dusk the birds catch the last light.

  Deliberately NOT WebGL: 13 quadratic-curve strokes on one fixed 2D canvas
  (no third GL context — the budget review flagged context count). Perf
  discipline: one callback on the SHARED gsap.ticker; while the flock is
  absent (presence ≈ 0) the tick is a single velocity read — the canvas is
  cleared once and never repainted at rest. dt-normalized smoothing, DPR ≤ 2,
  aria-hidden, pointer-events-none, reduced-motion renders nothing.

  Listens for the "marea" CustomEvent (TideEgg): the squad bursts wide for a
  beat, then falls back into formation.

  AMBIENT GLIDE — while the page rests at the top (no dive, no escort), a
  handful of DISTANT gulls cruise the hero's horizon band, so the sunset sky
  is inhabited before the flock is ever summoned. A violent water poke
  ("hero-splash", dispatched by WaterBallHero) STARTLES them: they kick up,
  beat hard for a second, then settle back into the lazy glide — the page
  reacts as one ecosystem. Same canvas, same shared ticker, ≤4 tiny strokes
  per frame, only while the hero is on screen.
*/

type Bird = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** formation slot (signed rank around the leader) */
  slot: number;
  phase: number;
  size: number;
};

const INK = { r: 0x2a, g: 0x1a, b: 0x14 };
const AMBER = { r: 0xf2, g: 0xa3, b: 0x3c };

export function Escort() {
  const reduced = useUI((s) => s.reducedMotion);
  const hydrated = useHydrated();
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const N = w < 768 ? 8 : 13;
    const birds: Bird[] = Array.from({ length: N }, (_, i) => {
      // slots alternate around the leader: 0, +1, -1, +2, -2…
      const slot = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2);
      return {
        x: w * 0.5,
        y: -60,
        vx: 0,
        vy: 0,
        slot,
        phase: i * 1.37,
        size: 11 + ((i * 7919) % 9), // 11..19 px half-span, deterministic
      };
    });

    let t = 0;
    let presence = 0;
    let presTarget = 0;
    let slowSince = 0;
    let dir = 1; // 1 = diving (scroll down), -1 = climbing
    let stormUntil = 0;
    let cleared = false;
    let nightBand: HTMLElement | null = null;
    let nightT = 0;
    let frame = 0;

    // ── ambient gulls (hero horizon band) ──────────────────────────────────
    type Gull = {
      x: number;
      y: number;
      baseY: number;
      vx: number;
      vy: number;
      phase: number;
      size: number;
      boost: number; // startle timer (s): hard wingbeats + climb
    };
    const gulls: Gull[] = Array.from({ length: w < 768 ? 3 : 4 }, (_, i) => {
      const baseY = h * (0.26 + Math.random() * 0.2);
      return {
        x: Math.random() * w,
        y: baseY,
        baseY,
        vx: (i % 2 ? 1 : -1) * (9 + Math.random() * 11),
        vy: 0,
        phase: Math.random() * 10,
        size: 4.5 + Math.random() * 3.5,
        boost: 0,
      };
    });
    let ambPresence = 0;
    const onSplash = () => {
      for (const g of gulls) {
        g.vy -= 35 + Math.random() * 55;
        g.vx += (Math.random() - 0.5) * 50;
        g.boost = 1.3;
      }
    };
    window.addEventListener("hero-splash", onSplash);

    const onMarea = () => {
      stormUntil = t + 1.5;
      presTarget = 1;
      slowSince = t + 2; // hold presence through the storm
      for (const b of birds) {
        b.vx += (Math.random() - 0.5) * 900;
        b.vy += (Math.random() - 0.5) * 900;
      }
    };
    window.addEventListener("marea", onMarea);

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 1000;
      t += dt;
      const lenis = (window as unknown as { __lenis?: { velocity?: number } }).__lenis;
      const v = lenis?.velocity ?? 0;
      const vAbs = Math.abs(v);

      // hysteresis: a real dive summons the flock; a settled page dismisses it
      if (vAbs > 9) {
        presTarget = 1;
        slowSince = t;
        if (Math.abs(v) > 2) dir = v > 0 ? 1 : -1;
      } else if (vAbs < 1.5 && t - slowSince > 0.8 && t > stormUntil) {
        presTarget = 0;
      }
      const rate = presTarget > presence ? 3.2 : 1.1;
      presence += (presTarget - presence) * (1 - Math.exp(-rate * dt));

      // ambient gulls live while the hero band is on screen and the escort is
      // absent; summoning the flock (or scrolling away) fades them out fast.
      const atHero = window.scrollY < h * 0.7;
      const ambTarget = atHero && presence < 0.2 ? 1 : 0;
      const ambRate = ambTarget > ambPresence ? 1.4 : 3.4;
      ambPresence += (ambTarget - ambPresence) * (1 - Math.exp(-ambRate * dt));

      if (presence < 0.015 && ambPresence < 0.015) {
        if (!cleared) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          cleared = true;
        }
        return; // idle: one velocity read per frame, zero paint
      }
      cleared = false;
      if (document.hidden) return;

      // — night tint (shared by escort + ambient): as the night band rises
      // into view, ink → amber embers. Element cached; rect read every 5th
      // frame only (a per-frame gBCR can force layout mid-scroll) — the color
      // lerp hides the quantization.
      if (frame++ % 5 === 0) {
        nightBand ??= document.getElementById("nightfall");
        if (nightBand) {
          const r = nightBand.getBoundingClientRect();
          nightT = Math.min(1, Math.max(0, 1 - r.top / h));
        }
      }
      const cr = Math.round(INK.r + (AMBER.r - INK.r) * nightT);
      const cg = Math.round(INK.g + (AMBER.g - INK.g) * nightT);
      const cb = Math.round(INK.b + (AMBER.b - INK.b) * nightT);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";

      // — AMBIENT: distant gulls lazing along the sunset horizon
      if (ambPresence >= 0.015) {
        ctx.strokeStyle = `rgb(${cr} ${cg} ${cb} / ${(0.4 * ambPresence).toFixed(3)})`;
        for (const g of gulls) {
          g.boost = Math.max(0, g.boost - dt);
          // soft spring back to the cruise line after a startle
          g.vy += (g.baseY - g.y) * 1.6 * dt;
          g.vy *= 1 - Math.min(1, 1.5 * dt);
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          if (g.x < -50) {
            g.x = w + 45;
            g.baseY = h * (0.26 + Math.random() * 0.2);
          } else if (g.x > w + 50) {
            g.x = -45;
            g.baseY = h * (0.26 + Math.random() * 0.2);
          }
          // lazy glide with sparse beats; a startle beats hard and fast
          g.phase += dt * (2.6 + g.boost * 9);
          const beat = Math.sin(g.phase);
          const arc = 1.2 + (beat * 0.5 + 0.5) * (1.6 + g.boost * 3.4);
          const s = g.size;
          ctx.save();
          ctx.translate(g.x, g.y);
          ctx.rotate(g.vx > 0 ? 0.05 : -0.05);
          ctx.lineWidth = Math.max(1, s * 0.16);
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.quadraticCurveTo(-s * 0.45, -arc, 0, 0);
          ctx.quadraticCurveTo(s * 0.45, -arc, s, 0);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (presence < 0.015) {
        ctx.restore();
        return; // ambient only — no escort to draw
      }

      // — leader drifts across the sky; diving rides high, climbing rides low
      const storm = t < stormUntil;
      const lx = w * (0.5 + Math.sin(t * 0.33) * 0.2);
      const ly =
        h * (dir > 0 ? 0.3 : 0.62) + Math.sin(t * 0.75) * h * 0.045;

      ctx.strokeStyle = `rgb(${cr} ${cg} ${cb} / ${(0.9 * presence).toFixed(3)})`;

      const speedBoost = Math.min(vAbs * 0.02, 1.6);
      for (const b of birds) {
        // V-formation target behind-and-beside the leader (flips when climbing)
        const k = b.slot;
        let txp = lx + k * 46 + Math.sin(t * 1.9 + b.phase) * 16;
        let typ = ly + Math.abs(k) * 30 * dir + Math.cos(t * 1.6 + b.phase) * 12;
        if (storm) {
          txp += Math.sin(t * 6 + b.phase * 3) * 160;
          typ += Math.cos(t * 5.2 + b.phase * 2) * 140;
        }
        // damped spring toward the slot
        b.vx += ((txp - b.x) * 9 - b.vx * 4.4) * dt;
        b.vy += ((typ - b.y) * 9 - b.vy * 4.4) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // face apparent motion: own velocity + the world streaming past
        const heading = Math.atan2(b.vy + dir * 130, b.vx + 60);
        const flap = Math.sin(t * (9 + speedBoost * 4) + b.phase);
        const a = 3 + (flap * 0.5 + 0.5) * 5.5; // wing arc amplitude
        const s = b.size;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(heading * 0.35); // lean into the flight, don't corkscrew
        ctx.lineWidth = Math.max(1.4, s * 0.13);
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.quadraticCurveTo(-s * 0.45, -a, 0, 0);
        ctx.quadraticCurveTo(s * 0.45, -a, s, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
      window.removeEventListener("marea", onMarea);
      window.removeEventListener("hero-splash", onSplash);
    };
  }, [reduced]);

  if (reduced && hydrated) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 h-dvh w-screen"
    />
  );
}

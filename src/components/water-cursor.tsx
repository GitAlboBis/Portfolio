"use client";

import { useEffect, useRef } from "react";
import { useScrollStore } from "@/webgl/store/scrollStore";

/*
  WaterCursor — the site-wide "bioluminescent water" pointer signature.

  A single fixed, full-viewport, pointer-events:none 2D canvas that sits just
  below the nav (z-30) and above everything else, additively glowing OVER the
  native cursor (never replacing it — usability + a11y stay intact). It renders:

    - a soft celeste glow that follows the pointer with spring lag (the "head");
    - a short comet trail of fading luminous plankton dots behind the head;
    - drifting motes seeded along fast movement (disturbed sea sparkle);
    - on click / tap, a one-shot ring burst of bioluminescent particles that
      drift outward and fade like a hand sweeping through phosphorescent water.

  It reads the per-frame scroll velocity from scrollStore (getState(), no React
  subscription) and stretches/elongates the head glow along the motion axis when
  the page is scrolling fast — the light "smears" with momentum.

  Performance: ONE rAF loop with delta-time, additive 'lighter' compositing,
  a capped particle pool, full listener/rAF cleanup, DPR-aware sizing capped at
  2x. Hard bail to a NO-OP on prefers-reduced-motion OR a coarse/no-hover
  pointer with NO motion at all (touch still gets the tap burst — see below).

  Touch devices (coarse pointer, no hover): we skip the persistent glow + trail
  and only fire the tap burst on pointerdown, so phones get the delight without
  a stuck phantom cursor. prefers-reduced-motion bails entirely (no-op).

  Decorative only -> aria-hidden, not focusable, not announced.
*/

// Celeste token (#9bd3ee) as RGB so we can vary alpha per particle/layer.
const CELESTE = { r: 155, g: 211, b: 238 };
const FOAM = { r: 244, g: 250, b: 251 }; // brightest core highlight (--color-foam)

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // remaining, seconds
  max: number; // initial life, for fade curve
  size: number;
  // 0 = celeste plankton, 1 = bright foam glint
  hot: number;
};

export function WaterCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- capability gates ---------------------------------------------------
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqReduce.matches) return; // hard no-op

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // touchOnly = no real hover pointer -> burst-only mode (no persistent glow).
    const touchOnly = !fine;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // --- pointer + spring state --------------------------------------------
    // target = raw pointer; head = spring-lagged glow position.
    const target = { x: w / 2, y: h / 2 };
    const head = { x: w / 2, y: h / 2 };
    const headVel = { x: 0, y: 0 };
    let pointerInside = false;
    let everMoved = false;

    // capped particle pool (trail motes + burst sparks share it)
    const MAX_PARTICLES = 280;
    const particles: Particle[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const addParticle = (p: Particle) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push(p);
    };

    // Seed drifting motes along the trail, scaled by how fast the pointer moved.
    const seedTrail = (x: number, y: number, speed: number) => {
      const n = speed > 1400 ? 3 : speed > 600 ? 2 : speed > 120 ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = rand(4, 26);
        addParticle({
          x: x + rand(-6, 6),
          y: y + rand(-6, 6),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - rand(2, 14), // slight upward drift, like rising plankton
          life: rand(0.5, 1.1),
          max: 1.1,
          size: rand(0.6, 1.8),
          hot: Math.random() < 0.18 ? 1 : 0,
        });
      }
    };

    // One-shot ring burst — disturbed sea sparkle on click / tap.
    const burst = (x: number, y: number) => {
      const count = touchOnly ? 22 : 30;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + rand(-0.18, 0.18);
        const spd = rand(60, 190);
        addParticle({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: rand(0.6, 1.25),
          max: 1.25,
          size: rand(1.0, 2.6),
          hot: Math.random() < 0.32 ? 1 : 0,
        });
      }
    };

    // --- listeners ----------------------------------------------------------
    let lastMoveT = performance.now();
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      pointerInside = true;
      if (!everMoved) {
        // snap the head to first sighting so it doesn't streak in from center
        head.x = target.x;
        head.y = target.y;
        everMoved = true;
      }
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastMoveT) / 1000);
      lastMoveT = now;
      const dx = e.movementX || 0;
      const dy = e.movementY || 0;
      const speed = Math.hypot(dx, dy) / dt;
      seedTrail(target.x, target.y, speed);
    };

    const onLeave = () => {
      pointerInside = false;
    };

    const onDown = (e: PointerEvent) => {
      // On touch, pointermove may never fire — use the down coords directly.
      target.x = e.clientX;
      target.y = e.clientY;
      if (touchOnly) {
        head.x = e.clientX;
        head.y = e.clientY;
      }
      burst(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    document.addEventListener("mouseleave", onLeave, { passive: true });
    window.addEventListener("resize", resize, { passive: true });

    // If reduced-motion flips on mid-session, tear down to honor it live.
    let killed = false;
    const onReduceChange = () => {
      if (mqReduce.matches) {
        killed = true;
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, w, h);
      }
    };
    mqReduce.addEventListener("change", onReduceChange);

    // --- draw helpers -------------------------------------------------------
    const drawGlow = (
      x: number,
      y: number,
      radius: number,
      alpha: number,
      color: { r: number; g: number; b: number },
      sx = 1,
      sy = 1,
      angle = 0,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      if (angle) ctx.rotate(angle);
      ctx.scale(sx, sy);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      g.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
      g.addColorStop(
        0.45,
        `rgba(${color.r},${color.g},${color.b},${alpha * 0.35})`,
      );
      g.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // --- main loop ----------------------------------------------------------
    let prev = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      if (killed) return;
      const dt = Math.min(0.05, (now - prev) / 1000); // clamp big gaps (tab refocus)
      prev = now;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter"; // additive, bioluminescent

      // Spring the head toward the target (critically-damped-ish).
      if (!touchOnly && everMoved) {
        const stiffness = 150;
        const damping = 16;
        const ax = (target.x - head.x) * stiffness - headVel.x * damping;
        const ay = (target.y - head.y) * stiffness - headVel.y * damping;
        headVel.x += ax * dt;
        headVel.y += ay * dt;
        head.x += headVel.x * dt;
        head.y += headVel.y * dt;
      }

      // Scroll velocity -> directional smear of the head glow.
      const scrollVel = useScrollStore.getState().velocity || 0;
      const smear = Math.min(1, Math.abs(scrollVel) / 30); // 0..1
      const moveSpeed = Math.hypot(headVel.x, headVel.y);
      const moveStretch = Math.min(0.9, moveSpeed / 1600);
      const stretch = Math.max(smear * 0.8, moveStretch);
      // elongate along the dominant motion axis (pointer motion, else vertical scroll)
      const angle =
        moveSpeed > 40
          ? Math.atan2(headVel.y, headVel.x)
          : Math.PI / 2; // vertical when only scrolling
      const sx = 1 + stretch * 1.6;
      const sy = 1 / (1 + stretch * 0.5);

      // Persistent head glow (skip on touch — burst-only there).
      if (!touchOnly && (pointerInside || moveSpeed > 8)) {
        const baseAlpha = pointerInside ? 0.28 : 0.16;
        // outer wide halo
        drawGlow(head.x, head.y, 46, baseAlpha * 0.6, CELESTE, sx, sy, angle);
        // mid glow
        drawGlow(head.x, head.y, 22, baseAlpha, CELESTE, sx, sy, angle);
        // bright foam core
        drawGlow(head.x, head.y, 7, baseAlpha + 0.18, FOAM);
        // comet trail: a few lagged echoes between target and head
        const tx = target.x - head.x;
        const ty = target.y - head.y;
        for (let i = 1; i <= 4; i++) {
          const f = i / 5;
          drawGlow(
            head.x + tx * f,
            head.y + ty * f,
            10 - i * 1.4,
            baseAlpha * (0.5 - f * 0.4),
            CELESTE,
          );
        }
      }

      // Update + draw particles.
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        // water drag + gentle buoyant drift
        p.vx *= 1 - 1.6 * dt;
        p.vy *= 1 - 1.6 * dt;
        p.vy -= 6 * dt; // rise like plankton
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const k = p.life / p.max; // 1 -> 0
        const a = k * k; // ease-out fade
        const col = p.hot ? FOAM : CELESTE;
        drawGlow(p.x, p.y, p.size * 5 + 2, a * 0.5, col);
        // crisp core dot
        ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${a * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // --- cleanup ------------------------------------------------------------
    return () => {
      killed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resize);
      mqReduce.removeEventListener("change", onReduceChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

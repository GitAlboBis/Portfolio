"use client";

import { useEffect, useRef } from "react";
import { useHeroStore } from "@/webgl/store/heroStore";

/*
  VIDEO BACKDROP — the Pan di Zucchero footage as the hero's BACKGROUND. Decoded
  to 136 WebP stills (public/frames), drawn to a fixed full-screen <canvas> indexed
  by heroStore.video (the raw hero scroll progress) so it scrubs from the very first
  scroll. Mounted in CanvasHost BEFORE WaterBallHero so it paints behind the (now
  transparent) water "A". Only renders while the hero is on screen.

  RESPONSIVE TIER (perf): two pre-rendered sets exist —
    DESKTOP  public/frames/f_000..f_135.webp   (1920px, ~25MB total)
    MOBILE   public/frames/m/f_000..f_135.webp (960px,  ~4.2MB total)
  The tier is chosen ONCE on mount. On mobile we additionally load/draw only every
  2nd source frame (~68 stills, ~2MB) and snap the 136-index timeline to the nearest
  loaded even frame, halving decode cost while still scrubbing the full sequence.
  Desktop behaviour is byte-identical to before (every frame, 1920px set).
*/
const FRAME_COUNT = 136;

export function VideoBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // --- TIER SELECTION (once, on mount) ---------------------------------
    // Mobile-ish if a small viewport media query matches OR the physical
    // pixel width is modest. Either signal flips us to the lighter 960px set.
    const isMobile =
      window.matchMedia("(max-width: 820px)").matches ||
      window.innerWidth * dpr <= 1100;
    const basePath = isMobile ? "/frames/m/" : "/frames/";
    const framePath = (i: number) =>
      `${basePath}f_${String(i).padStart(3, "0")}.webp`;
    // On mobile we only load even source frames; STEP=2 halves the count.
    const STEP = isMobile ? 2 : 1;
    // Snap any 0..FRAME_COUNT-1 index to the nearest actually-loaded frame.
    const snap = (i: number) => {
      if (STEP === 1) return i;
      const snapped = Math.round(i / STEP) * STEP;
      return Math.min(FRAME_COUNT - 1, snapped);
    };

    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    let lastDrawn = -1;

    const draw = () => {
      const prog = reduce ? 0.5 : useHeroStore.getState().video;
      const raw = Math.max(
        0,
        Math.min(FRAME_COUNT - 1, Math.round(prog * (FRAME_COUNT - 1))),
      );
      const idx = snap(raw);
      const img = images[idx];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number, dh: number, dx: number, dy: number;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      lastDrawn = idx;
    };

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      lastDrawn = -1;
      draw();
    };

    const loadFrame = (i: number) => {
      if (images[i]) return;
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        if (lastDrawn === -1) draw();
      };
      im.src = framePath(i);
      images[i] = im;
    };

    // reduced-motion shows a single mid still; otherwise frame 0 paints first.
    // Both are snapped so on mobile we request a frame we actually load.
    const reduceIdx = snap(Math.round(0.5 * (FRAME_COUNT - 1)));
    loadFrame(reduce ? reduceIdx : 0);
    resize();

    // throttled preload (don't decode the whole set at once). On mobile this
    // walks STEP=2 so only ~68 stills are fetched/decoded (~2MB).
    let inFlight = 0;
    let next = STEP;
    const CONCURRENCY = 6;
    const pump = () => {
      while (inFlight < CONCURRENCY && next < FRAME_COUNT) {
        const i = next;
        next += STEP;
        if (images[i]) continue;
        inFlight++;
        const im = new Image();
        im.decoding = "async";
        const done = () => {
          inFlight--;
          pump();
        };
        im.onload = done;
        im.onerror = done;
        im.src = framePath(i);
        images[i] = im;
      }
    };
    if (!reduce) {
      // defer the heavy preload off the critical path (idle, not first paint)
      const w = window as typeof window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (w.requestIdleCallback) w.requestIdleCallback(() => pump(), { timeout: 1500 });
      else window.setTimeout(() => pump(), 800);
    }

    window.addEventListener("resize", resize);

    let heroVisible = true;
    const heroEl = document.getElementById("hero");
    const io = heroEl
      ? new IntersectionObserver(
          (entries) => {
            heroVisible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0 },
        )
      : null;
    if (io && heroEl) io.observe(heroEl);

    let raf = 0;
    let lastIdx = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!heroVisible) return;
      const prog = reduce ? 0.5 : useHeroStore.getState().video;
      const idx = snap(Math.round(prog * (FRAME_COUNT - 1)));
      if (idx !== lastIdx) {
        lastIdx = idx;
        draw();
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

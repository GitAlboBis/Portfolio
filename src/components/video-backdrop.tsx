"use client";

import { useEffect, useRef } from "react";
import { useHeroStore } from "@/webgl/store/heroStore";

/*
  VIDEO BACKDROP — the Pan di Zucchero footage as the hero's BACKGROUND. Decoded
  to 136 WebP stills (public/frames), drawn to a fixed full-screen <canvas> indexed
  by heroStore.video (the raw hero scroll progress) so it scrubs from the very first
  scroll. Mounted in CanvasHost BEFORE WaterBallHero so it paints behind the (now
  transparent) water "A". Only renders while the hero is on screen.
*/
const FRAME_COUNT = 136;
const framePath = (i: number) => `/frames/f_${String(i).padStart(3, "0")}.webp`;

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
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    let lastDrawn = -1;

    const draw = () => {
      const prog = reduce ? 0.5 : useHeroStore.getState().video;
      const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(prog * (FRAME_COUNT - 1))));
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

    loadFrame(0);
    resize();

    // throttled preload (don't decode all 136 1920px stills at once)
    let inFlight = 0;
    let next = 1;
    const CONCURRENCY = 6;
    const pump = () => {
      while (inFlight < CONCURRENCY && next < FRAME_COUNT) {
        const i = next++;
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
    pump();

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
      const idx = Math.round(prog * (FRAME_COUNT - 1));
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

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

  ── SYNTHETIC DIVE CLIMAX ────────────────────────────────────────────────────
  There is NO backflip/dive footage; the plate is a slow, near-static drone push.
  The hero scroll budget allots ~24%..56% to a "cinematic" window that, left as a
  literal scrub, reads as dead air. We synthesize the missing payoff entirely in
  the draw step over heroStore.video ∈ [DIVE_IN, DIVE_OUT]:

    1. KEN BURNS PUSH-IN — scale the drawn frame 1.0 → DIVE_ZOOM toward a focal
       point near the sea-stack (FOCAL_X, FOCAL_Y of the IMAGE), with an
       accelerating ease (slow start, faster into the dive) so it feels like
       plunging toward the rock. After DIVE_OUT we hold the peak zoom (settle).
    2. NON-LINEAR FRAME REMAP — the frame index advances a touch faster through
       the climax (more sense of motion from the near-static plate) while still
       covering 0..135 across the whole hero (monotonic, endpoints pinned).
    3. EXPOSURE DEEPEN — a subtle dark radial vignette is composited as the
       push-in peaks (NatGeo restraint), grounding the plunge without crushing.

  CRITICAL: the zoom factor changes EVERY tick inside the window, not only when
  the snapped frame index changes — so the rAF loop redraws on a zoom delta there.
  OUTSIDE the window (and when STEP-snapped index is unchanged) it redraws only on
  index change, and the whole loop stays idle while the hero is offscreen (IO).
  Tier selection, cover-fit math, DPR clamp, preload and reduced-motion (NO zoom,
  static mid frame) are preserved exactly.
*/
const FRAME_COUNT = 136;

// Dive-climax window in heroStore.video (raw scroll) space. Matches the dead
// footage-scrub beat (~24%..56%); we extend the push-in tail slightly to ~62%
// so the zoom keeps accelerating a beat past the scrub before it settles/holds.
const DIVE_IN = 0.24;
const DIVE_OUT = 0.62;
// Peak push-in. 1.0 = cover-fit (untouched); 1.35 = plunged toward the rock.
const DIVE_ZOOM = 1.35;
// Focal point in IMAGE space (0..1). The Pan di Zucchero stack sits centre-right.
const FOCAL_X = 0.58;
const FOCAL_Y = 0.6;
// How much the index remap "leans" into the climax. 0 = linear; higher = the
// middle of the sequence races a touch faster (endpoints stay pinned to 0/135).
const REMAP_BIAS = 0.18;

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

    // --- DIVE-CLIMAX MATH (pure, cheap) ----------------------------------
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    // Accelerating ease for the push-in: slow start, faster into the dive.
    // Cubic ease-in keeps the rock "arriving" only as you commit to the plunge.
    const easeInCubic = (t: number) => t * t * t;

    // Zoom factor for a given raw scroll progress. 1.0 before the window,
    // accelerating to DIVE_ZOOM across it, then HELD at peak afterwards (settle).
    const zoomFor = (prog: number) => {
      if (reduce) return 1; // reduced-motion: no Ken Burns, ever.
      if (prog <= DIVE_IN) return 1;
      if (prog >= DIVE_OUT) return DIVE_ZOOM;
      const t = (prog - DIVE_IN) / (DIVE_OUT - DIVE_IN);
      return 1 + (DIVE_ZOOM - 1) * easeInCubic(t);
    };

    // Dark-vignette opacity, peaking with the push-in. Ramps in over the back
    // half of the window and holds a gentle plateau on the settle. Kept low —
    // NatGeo restraint, never a crushed frame.
    const vignetteFor = (prog: number) => {
      if (reduce) return 0;
      // 0 until mid-window, then ease up to a max of 0.28 by DIVE_OUT, held.
      const start = DIVE_IN + (DIVE_OUT - DIVE_IN) * 0.45;
      if (prog <= start) return 0;
      const t = clamp01((prog - start) / (DIVE_OUT - start));
      return 0.28 * (t * t); // ease-in, peaks at the rock
    };

    // Non-linear frame remap: smootherstep-blended bias that makes the MIDDLE of
    // the sequence advance a touch faster (more motion through the dead plate)
    // while pinning the endpoints (0→0, 1→1) so we still cover 0..135 overall.
    // p∈[0,1] raw → p'∈[0,1] remapped, strictly monotonic for BIAS<1.
    const remapProgress = (p: number) => {
      if (REMAP_BIAS <= 0) return p;
      // smootherstep centred speed-up: derivative is highest near p=0.5.
      const s = p * p * p * (p * (p * 6 - 15) + 10); // smootherstep(p)
      return clamp01(p + REMAP_BIAS * (s - p));
    };

    const images: HTMLImageElement[] = new Array(FRAME_COUNT);

    // Cache the last composited state so the loop can detect a zoom delta (not
    // just an index delta) and redraw within the climax window only when needed.
    let lastDrawnIdx = -1;
    let lastDrawnZoom = -1;

    // EPS so sub-pixel zoom jitter doesn't force a redraw every single frame on
    // tiny scroll deltas; large enough to be invisible, small enough to be smooth.
    const ZOOM_EPS = 0.0008;

    const indexFor = (prog: number) => {
      const remapped = remapProgress(clamp01(prog));
      const raw = Math.max(
        0,
        Math.min(FRAME_COUNT - 1, Math.round(remapped * (FRAME_COUNT - 1))),
      );
      return snap(raw);
    };

    const draw = (progArg?: number) => {
      const prog = reduce
        ? 0.5
        : progArg ?? useHeroStore.getState().video;
      const idx = indexFor(prog);
      const img = images[idx];
      if (!img || !img.complete || !img.naturalWidth) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;

      // COVER-FIT (unchanged): largest rect that fully covers the canvas at
      // scale 1.0, centred. This is the untouched base layout.
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

      // KEN BURNS PUSH-IN: grow the cover rect about the sea-stack focal point.
      // We keep the canvas pixel where the focal point lands fixed, so the rock
      // stays put while the frame plunges toward it (no drift to a corner).
      const zoom = zoomFor(prog);
      if (zoom !== 1) {
        // Canvas-space anchor = the image's focal point at scale 1.0.
        const ax = dx + dw * FOCAL_X;
        const ay = dy + dh * FOCAL_Y;
        dw *= zoom;
        dh *= zoom;
        // Re-place so the focal point still lands on the same canvas anchor.
        dx = ax - dw * FOCAL_X;
        dy = ay - dh * FOCAL_Y;
      }

      ctx.drawImage(img, dx, dy, dw, dh);

      // EXPOSURE DEEPEN: cheap dark radial vignette over the plunge peak.
      const vig = vignetteFor(prog);
      if (vig > 0) {
        // Radial centred on the focal point, transparent core → dark edges.
        const fx = dx + dw * FOCAL_X;
        const fy = dy + dh * FOCAL_Y;
        const r = Math.max(cw, ch);
        const g = ctx.createRadialGradient(fx, fy, r * 0.22, fx, fy, r * 0.82);
        g.addColorStop(0, "rgba(7,34,46,0)"); // --color-abyss, transparent core
        g.addColorStop(1, `rgba(7,34,46,${vig})`); // abyss, deepened edges
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      }

      lastDrawnIdx = idx;
      lastDrawnZoom = zoom;
    };

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      lastDrawnIdx = -1;
      lastDrawnZoom = -1;
      draw();
    };

    const loadFrame = (i: number) => {
      if (images[i]) return;
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        if (lastDrawnIdx === -1) draw();
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
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!heroVisible) return;

      const prog = reduce ? 0.5 : useHeroStore.getState().video;
      const idx = indexFor(prog);

      // Within the dive window the zoom changes continuously, so we must redraw
      // on a zoom delta even when the snapped frame index is unchanged. Outside
      // the window zoom is constant (1.0 before, DIVE_ZOOM after) so an index
      // delta is the only trigger — keeping the loop cheap on the long holds.
      const inWindow = !reduce && prog > DIVE_IN && prog < DIVE_OUT;

      if (idx !== lastDrawnIdx) {
        draw(prog);
        return;
      }
      if (inWindow) {
        const zoom = zoomFor(prog);
        if (Math.abs(zoom - lastDrawnZoom) > ZOOM_EPS) draw(prog);
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

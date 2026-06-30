"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";

/*
  WorkCarousel — a 3D arc carousel of the Selected Work (Codrops "3D carousel"
  technique, re-themed; CSS-3D, no three needed). Each card's transform is derived
  from its offset to the active index: rotateY + translateZ + translateX + scale +
  opacity, so the centered project faces front and "ignites" while neighbours rotate
  away and recede. Drag / wheel / prev-next change the active card; the centred,
  confirmed project opens its /work/[slug] case study.

  All transform/opacity (GPU). Coexists with Lenis (no second scroll loop — input is
  drag + Observer-free wheel on the stage only). reduced-motion → a plain editorial
  list of links (mirrors the old gallery's reduced branch).
*/

const ROT = 38; // deg per step
const DEPTH = 200; // px translateZ per step
const SCALE_STEP = 0.13;
const OP_STEP = 0.34;
const MAX_VIS = 2; // cards beyond this from center are hidden

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function WorkCarousel() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const reduced = useUI((s) => s.reducedMotion);
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const draggedRef = useRef(false);
  const [active, setActive] = useState(0);
  const n = works.length;

  // Click a card -> open THAT work's case study (confirmed); a side click just
  // centres a provisional card. Suppressed if the press was a drag.
  const openCard = (i: number) => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    const w = works[i];
    if (w.status === "confirmed") router.push(`/work/${w.slug}`);
    else setActive(i);
  };

  const layout = useCallback((act: number, animate = true) => {
    const stage = stageRef.current;
    if (!stage) return;
    const step = Math.min(stage.clientWidth * 0.4, 340);
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const off = i - act;
      const a = Math.abs(off);
      gsap.to(el, {
        x: off * step,
        z: -a * DEPTH,
        rotationY: -off * ROT,
        scale: Math.max(0.5, 1 - a * SCALE_STEP),
        autoAlpha: a <= MAX_VIS ? Math.max(0, 1 - a * OP_STEP) : 0,
        zIndex: 100 - a,
        duration: animate ? 0.7 : 0,
        ease: "power3.out",
        overwrite: true,
      });
    });
  }, []);

  // Initial placement (center each card, then lay out from rest).
  useGSAP(
    () => {
      if (reduced) return;
      gsap.set(cardRefs.current.filter(Boolean), { xPercent: -50, yPercent: -50, transformPerspective: 1400 });
      layout(0, false);
      const onResize = () => layout(active, false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { scope: stageRef, dependencies: [reduced] },
  );

  // Re-lay-out the arc whenever the active card changes.
  useGSAP(
    () => {
      if (reduced) return;
      layout(active);
    },
    { dependencies: [active, layout, reduced] },
  );

  // Drag (pointer) + wheel — change active by ±1, threshold-gated. No page-scroll loop.
  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;
    let downX: number | null = null;
    let wheelLock = false;

    const move = (d: number) => setActive((a) => clamp(a + d, 0, n - 1));

    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      draggedRef.current = false;
    };
    const onUp = (e: PointerEvent) => {
      if (downX === null) return;
      const dx = e.clientX - downX;
      downX = null;
      draggedRef.current = Math.abs(dx) > 8; // a drag, not a card click
      if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
    };
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 8 || wheelLock) return;
      // only hijack when the gesture is clearly horizontal; let vertical scroll pass to Lenis
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheelLock = true;
      move(d > 0 ? 1 : -1);
      setTimeout(() => (wheelLock = false), 450);
    };

    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      stage.removeEventListener("wheel", onWheel);
    };
  }, [reduced, n]);

  // ── reduced-motion / no-JS friendly: a plain editorial list ──────────────────
  if (reduced) {
    return (
      <section id="works" className="scroll-anchor container-edit" style={{ paddingBlock: "var(--section-y)" }}>
        <p className="t-eyebrow eyebrow-tick mb-6">{t.works.eyebrow}</p>
        <h2 className="t-display mb-10">{t.works.title}</h2>
        <ol className="flex flex-col">
          {works.map((w, i) => {
            const inner = (
              <>
                <p className="t-index mb-1">{String(i + 1).padStart(2, "0")}</p>
                <p className="t-title">{w.title}</p>
                <p className="t-meta mt-2">
                  {w.org} · {w.year} · {w.role}
                </p>
              </>
            );
            return (
              <li key={w.slug} className="border-t border-[var(--color-rule)] py-7">
                {w.status === "confirmed" ? (
                  <Link href={`/work/${w.slug}`} className="block transition-opacity hover:opacity-70">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  return (
    <section
      id="works"
      className="scroll-anchor"
      aria-labelledby="works-title"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <div className="container-edit grid-edit">
        <p className="t-eyebrow eyebrow-tick col-meta mb-6 lg:mb-0">{t.works.eyebrow}</p>
        <h2 id="works-title" className="t-display col-read max-w-[14ch]">
          {t.works.title}
        </h2>
      </div>

      {/* 3D stage */}
      <div
        ref={stageRef}
        aria-hidden
        className="relative mx-auto mt-[var(--block-y)] h-[clamp(20rem,46vw,30rem)] w-full touch-pan-y select-none [perspective:1400px]"
        style={{ cursor: "grab" }}
      >
        {works.map((w, i) => (
          <div
            key={w.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2 h-[clamp(13rem,30vw,20rem)] w-[clamp(17rem,38vw,26rem)] [transform-style:preserve-3d]"
          >
            <button
              type="button"
              onClick={() => openCard(i)}
              tabIndex={-1}
              className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-rule)] text-left"
              style={{ background: `linear-gradient(135deg, ${w.mood.blob1}, ${w.mood.blob2})` }}
            >
              {/* warm vignette + ignite-on-center sheen */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,.22), transparent 60%)" }}
              />
              <span className="absolute inset-x-5 bottom-5">
                <span className="block font-display text-xl font-semibold text-ink">{w.title}</span>
                <span className="t-meta mt-1 block normal-case text-ink/70">{w.org}</span>
              </span>
              {w.status === "provisional" ? (
                <span className="absolute left-5 top-5 rounded-full bg-night/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-paper">
                  {t.works.wip}
                </span>
              ) : null}
            </button>
          </div>
        ))}
      </div>

      {/* Controls only — each work's info opens on its /work/[slug] case study (click a card). */}
      <div className="container-edit mt-[var(--block-y)] flex items-center justify-between">
        <p className="t-index">
          {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous project"
            onClick={() => setActive((a) => clamp(a - 1, 0, n - 1))}
            disabled={active === 0}
            className="grid size-11 place-items-center rounded-full border border-rule-strong text-ink transition-colors duration-300 hover:border-ember hover:text-ember-ink disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next project"
            onClick={() => setActive((a) => clamp(a + 1, 0, n - 1))}
            disabled={active === n - 1}
            className="grid size-11 place-items-center rounded-full border border-rule-strong text-ink transition-colors duration-300 hover:border-ember hover:text-ember-ink disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      {/* SR-only list (the stage is decorative interaction). */}
      <ol className="sr-only">
        {works.map((w) => (
          <li key={w.slug}>
            {w.status === "confirmed" ? (
              <Link href={`/work/${w.slug}`}>
                {w.title} — {w.role}, {w.year}
              </Link>
            ) : (
              `${w.title} — ${w.role} (${t.works.wip})`
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

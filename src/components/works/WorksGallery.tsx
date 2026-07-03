"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { works as WORKS } from "@/content/works";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { gsap, useGSAP } from "@/lib/gsap";
import { LazyOnView } from "@/components/motion/LazyOnView";

/*
  Selected Works — "atmospheric depth gallery" (original R3F reimplementation of the
  codrops/houmahani idea): project planes stacked along -Z, the camera flies through as
  the sticky-pinned section scrolls, cross-fading by depth over a mood ramp.

  This file is the SHELL only — no three/@react-three/fiber imports. The R3F canvas lives
  in WorksGalleryCanvas and is code-split + loaded via next/dynamic({ssr:false}), and only
  mounted once the gallery nears the viewport (`near`). So three/R3F is off the initial
  bundle and no WebGL context is created on landing. The tall section + caption below ALWAYS
  render, so the page height and the sticky-scroll math are identical whether or not the
  canvas has mounted yet (no layout shift, no scroll-position drift). Reduced-motion → list.
*/

// three/R3F chunk, client-only. Rendered lazily below once `near` flips.
const WorksGalleryCanvas = dynamic(
  () => import("@/components/works/WorksGalleryCanvas").then((m) => m.WorksGalleryCanvas),
  { ssr: false },
);

export function WorksGallery() {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  const sectionRef = useRef<HTMLElement | null>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Caption flip-reveal: re-mask the title + re-fade the meta each time the fly-through
  // brings a new project into focus. Declared before the reduced-motion early return so
  // the hook order stays stable; no-ops there (captionRef is never mounted in the list).
  useGSAP(
    () => {
      const root = captionRef.current;
      if (!root) return;
      const title = root.querySelector(".js-work-title");
      const meta = root.querySelectorAll(".js-work-meta");
      if (title) gsap.fromTo(title, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
      if (meta.length)
        gsap.fromTo(meta, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" });
    },
    { scope: captionRef, dependencies: [active] },
  );

  if (reduced) {
    return (
      <section id="works" className="scroll-anchor container-edit">
        <p className="t-eyebrow eyebrow-tick mb-6">{t.works.eyebrow}</p>
        <h2 className="t-display mb-10">{t.works.title}</h2>
        <ol className="flex flex-col">
          {WORKS.map((w, i) => {
            const inner = (
              <>
                <p className="t-index mb-1">{String(i + 1).padStart(2, "0")}</p>
                <p className="t-title">{w.title}</p>
                <p className="t-meta mt-2">
                  {w.role} · {w.year} · {w.stack.join(" / ")}
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

  const w = WORKS[active];
  return (
    <section
      id="works"
      ref={sectionRef}
      className="scroll-anchor relative"
      style={{ height: `${(WORKS.length + 1) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="container-edit absolute inset-x-0 top-[calc(var(--nav-h)+1rem)] z-10">
          <p className="t-eyebrow eyebrow-tick">{t.works.eyebrow}</p>
        </div>

        {/* R3F canvas: chunk fetched + GL context created only once the gallery nears the
            viewport (LazyOnView fills the sticky stage; the Canvas inside fills it). Before
            that the area is transparent over bg-paper (the look of flying between planes). */}
        <LazyOnView style={{ position: "absolute", inset: 0 }} rootMargin={600}>
          <WorksGalleryCanvas sectionRef={sectionRef} onActive={setActive} />
        </LazyOnView>

        <div
          ref={captionRef}
          className="container-edit pointer-events-none absolute inset-x-0 bottom-[9vh] z-10"
        >
          <p className="t-index mb-2 js-work-meta">
            {String(active + 1).padStart(2, "0")} / {String(WORKS.length).padStart(2, "0")}
          </p>
          <div className="overflow-hidden pb-[0.12em]">
            <h3 className="t-title js-work-title">{w.title}</h3>
          </div>
          <p className="t-meta mt-2 js-work-meta">
            {w.role} · {w.year} · {w.stack.join(" / ")}
          </p>
          <div className="js-work-meta pointer-events-auto mt-4 flex items-center gap-6">
            {w.status === "confirmed" ? (
              <Link
                href={`/work/${w.slug}`}
                className="t-meta text-ember-ink underline-offset-4 transition-colors duration-300 hover:underline"
              >
                {t.works.open} →
              </Link>
            ) : (
              <span className="t-meta text-ink-mute">{t.works.wip}</span>
            )}
            <Link
              href="/work"
              className="t-meta text-ink-mute transition-colors duration-300 hover:text-ink"
            >
              {t.works.back} ↗
            </Link>
          </div>
        </div>

        <ol className="sr-only">
          {WORKS.map((work) => (
            <li key={work.slug}>
              {work.title} — {work.role}, {work.year}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

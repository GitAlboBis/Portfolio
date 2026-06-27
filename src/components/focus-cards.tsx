"use client";

/*
  FocusCards — ocean depth-of-field adaptation of Aceternity UI "Focus Cards".
  https://ui.aceternity.com/components/focus-cards (technique: on hover/focus the
  active card stays sharp while siblings blur + scale down).

  Ocean reinterpretation for the Work section:
  - Hovering OR keyboard-focusing one card pulls it into focus; all others sink
    into a teal "water depth-of-field" (blur + desaturate + dim + scale-down),
    as if the active card surfaced and the rest receded below the thermocline.
  - The focused card gets a celeste glow ring, a slow caustic sheen sweep, a lift,
    and a refractive border. A drifting light-shaft + grain pseudo-overlay keeps
    the resting state alive (maximalist, never flat).
  - Self-contained: a generic <FocusCards items={...}> plus a project-specific
    <ProjectFocusCards> wired to src/data/projects.ts via useLanguage().

  A11y: each card is a real focusable element (tabIndex / link). Keyboard focus
  drives the exact same state as hover. Decorative layers are aria-hidden.
  prefers-reduced-motion: transforms/blur are dropped (handled by the global
  reduced-motion rule + a static-safe fallback), focus ring still shows.
  SSR-safe: no browser APIs at module scope; "use client" for state + events.
*/

import React, {
  useCallback,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { projectsSorted, type Project } from "@/data/projects";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Generic FocusCards                                                  */
/* ------------------------------------------------------------------ */

export type FocusCardItem = {
  /** stable key */
  id: string;
  /** rendered card body (already localized by the caller) */
  content: ReactNode;
  /** optional click-through (renders the card as an <a>) */
  href?: string;
  /** accessible label for the card as a whole (required when interactive) */
  ariaLabel?: string;
  /** dims the card permanently (e.g. provisional/coming-soon) */
  muted?: boolean;
};

type FocusCardsProps = {
  items: FocusCardItem[];
  className?: string;
  /** grid template; defaults to a responsive auto grid */
  gridClassName?: string;
};

export function FocusCards({ items, className, gridClassName }: FocusCardsProps) {
  // null = nothing focused; index = the active card. Shared by hover + keyboard.
  const [active, setActive] = useState<number | null>(null);

  const clear = useCallback(() => setActive(null), []);

  return (
    <div
      className={cn("foc-field relative w-full", className)}
      onMouseLeave={clear}
    >
      {/* Drifting light shaft — only intensifies while a card is focused. */}
      <div
        aria-hidden
        className={cn(
          "foc-shaft pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-700",
          active !== null && "opacity-100",
        )}
      />
      <ul
        className={cn(
          "grid list-none gap-7 sm:gap-9",
          gridClassName ?? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {items.map((item, index) => (
          <FocusCard
            key={item.id}
            item={item}
            index={index}
            active={active}
            setActive={setActive}
          />
        ))}
      </ul>

      <FocusCardsStyles />
    </div>
  );
}

const FocusCard = React.memo(function FocusCard({
  item,
  index,
  active,
  setActive,
}: {
  item: FocusCardItem;
  index: number;
  active: number | null;
  setActive: (i: number | null) => void;
}) {
  const isActive = active === index;
  const isReceded = active !== null && !isActive;

  const focus = useCallback(() => setActive(index), [index, setActive]);
  const blur = useCallback(() => setActive(null), [setActive]);

  // Escape lets keyboard users release focus state without leaving the card.
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        (e.currentTarget as HTMLElement).blur();
        setActive(null);
      }
    },
    [setActive],
  );

  const interactive = Boolean(item.href);
  const Tag: "a" | "div" = interactive ? "a" : "div";

  return (
    <li className="foc-cell">
      <Tag
        {...(interactive
          ? { href: item.href, rel: "noreferrer" }
          : { tabIndex: 0, role: "group" })}
        aria-label={item.ariaLabel}
        onMouseEnter={focus}
        onFocus={focus}
        onBlur={blur}
        onKeyDown={onKeyDown}
        style={{ "--foc-i": index } as CSSProperties}
        className={cn(
          "foc-card group/foc water-glass relative block h-full overflow-hidden rounded-3xl",
          "px-7 py-9 sm:px-9 sm:py-11",
          "outline-none transition-[transform,filter,opacity,box-shadow,border-color] duration-500 ease-out",
          "focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
          isActive && "foc-card--active",
          isReceded && "foc-card--receded",
          item.muted && "foc-card--muted",
        )}
      >
        {/* Caustic sheen sweep — runs on the focused card only. */}
        <span aria-hidden className="foc-sheen" />
        {/* Refractive depth glow behind the content. */}
        <span aria-hidden className="foc-glow" />

        <div className="foc-content relative z-10">{item.content}</div>
      </Tag>
    </li>
  );
});

/* ------------------------------------------------------------------ */
/* Project-specific usage (wired to real data)                        */
/* ------------------------------------------------------------------ */

export function ProjectFocusCards({ className }: { className?: string }) {
  const { lang, t } = useLanguage();

  const items: FocusCardItem[] = projectsSorted.map((project) => ({
    id: project.slug,
    muted: project.status === "provisional",
    ariaLabel: `${project.title} — ${project.org}`,
    content: <ProjectCardBody project={project} lang={lang} t={t} />,
  }));

  return (
    <FocusCards
      items={items}
      className={className}
      gridClassName="grid-cols-1 md:grid-cols-2"
    />
  );
}

function ProjectCardBody({
  project,
  lang,
  t,
}: {
  project: Project;
  lang: "en" | "it";
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const provisional = project.status === "provisional";

  return (
    <article className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h3 className="heading-2 text-foam">{project.title}</h3>
          <p className="label mt-3">
            {project.org}
            <span className="mx-2.5 text-tide/60" aria-hidden>
              ·
            </span>
            {project.period}
          </p>
        </div>

        {provisional ? (
          <span className="label shrink-0 rounded-full border border-celeste/45 px-3.5 py-1.5 text-celeste">
            {t.work.wip}
          </span>
        ) : null}
      </header>

      <p className="mt-5 text-base leading-relaxed text-foam/90 sm:text-lg">
        <span className="label mr-2.5 align-middle text-mist">
          {t.work.roleLabel}
        </span>
        {project.role[lang]}
      </p>

      {provisional ? null : (
        <>
          <div className="mt-6 space-y-3">
            <p className="lead text-pretty text-foam/90">{project.action[lang]}</p>
            <p className="text-sm leading-relaxed text-mist sm:text-base">
              {project.result[lang]}
            </p>
          </div>

          {project.metrics && project.metrics.length > 0 ? (
            <dl className="mt-7 grid grid-cols-3 gap-x-5 gap-y-6 border-t border-rule pt-6">
              {project.metrics.map((metric) => (
                <div key={metric.label[lang]}>
                  <dt className="heading-2 leading-none text-foam">
                    {metric.value}
                  </dt>
                  <dd className="label mt-2 text-mist">{metric.label[lang]}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-7">
            <p className="label text-mist">{t.work.stackLabel}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-rule px-3 py-1 font-sans text-xs tracking-wide text-mist transition-colors duration-300 group-hover/foc:border-tide/50 group-hover/foc:text-foam group-focus-visible/foc:border-tide/50"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          {project.links && project.links.length > 0 ? (
            <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-8">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${link.label} — ${project.title}`}
                  className="label inline-flex items-center gap-1.5 text-foam underline-offset-4 transition-colors hover:text-celeste hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.label}
                  <span className="text-celeste" aria-hidden>
                    ↗
                  </span>
                </a>
              ))}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Scoped styles (self-contained, token-driven)                       */
/* ------------------------------------------------------------------ */

function FocusCardsStyles() {
  return (
    <style>{`
      .foc-field { isolation: isolate; }

      /* Drifting light shaft from the surface — sits behind the grid. */
      .foc-shaft {
        background:
          radial-gradient(120% 80% at 18% -10%,
            color-mix(in oklab, var(--color-celeste) 22%, transparent) 0%,
            transparent 55%),
          radial-gradient(120% 90% at 90% 110%,
            color-mix(in oklab, var(--color-tide) 16%, transparent) 0%,
            transparent 60%);
        filter: blur(8px);
        animation: foc-drift 14s ease-in-out infinite alternate;
      }
      @keyframes foc-drift {
        from { transform: translate3d(-2%, -1%, 0) scale(1.02); }
        to   { transform: translate3d(2%, 1%, 0) scale(1.06); }
      }

      .foc-card {
        will-change: transform, filter;
        border-color: rgb(244 250 251 / 0.16);
        box-shadow: 0 1px 0 rgb(244 250 251 / 0.04) inset;
      }
      /* default resting hover (no sibling focused yet) — gentle lift */
      .foc-card:hover { border-color: color-mix(in oklab, var(--color-foam) 38%, transparent); }

      /* FOCUSED: surfaced, sharp, celeste-lit. */
      .foc-card--active {
        transform: translateY(-6px) scale(1.012);
        border-color: color-mix(in oklab, var(--color-celeste) 60%, transparent);
        box-shadow:
          0 24px 60px -28px color-mix(in oklab, var(--color-celeste) 55%, transparent),
          0 0 0 1px color-mix(in oklab, var(--color-celeste) 40%, transparent),
          0 0 42px -6px color-mix(in oklab, var(--color-celeste) 30%, transparent);
      }

      /* RECEDED: sinks into the depth-of-field. */
      .foc-card--receded {
        transform: scale(0.965);
        filter: blur(4px) saturate(0.7) brightness(0.82);
        opacity: 0.55;
      }

      /* Permanently muted (provisional) — still recedes/surfaces, just dimmer. */
      .foc-card--muted { opacity: 0.62; }
      .foc-card--muted.foc-card--active { opacity: 0.85; }
      .foc-card--muted.foc-card--receded { opacity: 0.4; }

      /* Refractive glow behind content, blooms on focus. */
      .foc-glow {
        position: absolute;
        inset: -1px;
        z-index: 0;
        border-radius: inherit;
        opacity: 0;
        background: radial-gradient(90% 70% at 50% 0%,
          color-mix(in oklab, var(--color-celeste) 18%, transparent) 0%,
          transparent 70%);
        transition: opacity 0.5s ease;
      }
      .foc-card--active .foc-glow { opacity: 1; }

      /* Caustic sheen sweep across the focused card. */
      .foc-sheen {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        height: 100%;
        width: 45%;
        pointer-events: none;
        transform: translateX(-160%) skewX(-14deg);
        background: linear-gradient(
          100deg,
          transparent 0%,
          color-mix(in oklab, var(--color-celeste-soft) 22%, transparent) 50%,
          transparent 100%
        );
        opacity: 0;
      }
      .foc-card--active .foc-sheen {
        animation: foc-sheen-sweep 2.4s ease-in-out 0.15s infinite;
        opacity: 1;
      }
      @keyframes foc-sheen-sweep {
        0%   { transform: translateX(-160%) skewX(-14deg); }
        55%  { transform: translateX(260%) skewX(-14deg); }
        100% { transform: translateX(260%) skewX(-14deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .foc-shaft { animation: none; }
        .foc-card--active { transform: none; }
        .foc-card--receded {
          transform: none;
          filter: saturate(0.85) brightness(0.9);
          opacity: 0.7;
        }
        .foc-sheen { display: none; }
        .foc-card { transition-duration: 0.01ms; }
      }
    `}</style>
  );
}

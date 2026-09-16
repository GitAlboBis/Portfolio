import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Schematic — the drawn mechanism of a sub-form (REDESIGN-SPEC §B, raise "the
 * napkin explainer"): a flow in PURE RULED GEOMETRY — 1.5px boxes in ink,
 * 1.5px arrows in `stamp` — never a sketch, never a hand-drawn stroke, never a
 * picture. Two jobs carry one: Sphere AI (the RAG pipeline) and Maintech OMA
 * (the six-phase job order).
 *
 * The stage LABELS are passed in by the caller and always come from a content
 * file — `works.ts` `stack` for the pipeline, `dict.ts` `phases.<id>.name` for
 * the six phases — so this component invents no copy of its own (dict.ts has
 * no schematic block and is frozen; see the WP-5 report).
 *
 * Two orientations of the same drawing: a row on `md+`, a column at 390 (a
 * six-across row would print the labels at 6px on a phone). Both are laid out
 * from the same numbers, so they are the same diagram, not two drawings.
 *
 * Decorative: the SVG is `aria-hidden` — every label it prints is also printed
 * as text in the fields around it (Parts, Work performed), so nothing is lost
 * to a screen reader.
 */
export interface SchematicProps {
  /** Stage labels, in flow order. Always from a content file. */
  stages: string[];
  className?: string;
}

/** Break a long label at the space nearest its middle: at most two lines. */
function wrap(label: string): string[] {
  if (label.length <= 15) return [label];
  const mid = label.length / 2;
  let best = -1;
  for (let i = 0; i < label.length; i++) {
    if (label[i] !== " ") continue;
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  if (best < 0) return [label];
  return [label.slice(0, best), label.slice(best + 1)];
}

const INK = "var(--color-ink)";
const ARROW = "var(--color-stamp)";
const STROKE = 1.5;
const FONT = 13;
const LINE = 16;

function Label({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  const top = y - ((lines.length - 1) * LINE) / 2;
  return (
    <text
      x={x}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={INK}
      fontSize={FONT}
      fontWeight={600}
      letterSpacing="0.06em"
      style={{ fontVariationSettings: '"wdth" 75', textTransform: "uppercase" }}
    >
      {lines.map((l, i) => (
        <tspan key={l + i} x={x} y={top + i * LINE}>
          {l.toUpperCase()}
        </tspan>
      ))}
    </text>
  );
}

/** → between two boxes: a rule and a chevron, both in stamp. */
function ArrowRight({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g stroke={ARROW} strokeWidth={STROKE} fill="none" strokeLinecap="square">
      <path d={`M${x1} ${y}H${x2}`} />
      <path d={`M${x2 - 6} ${y - 5}L${x2} ${y}L${x2 - 6} ${y + 5}`} />
    </g>
  );
}

/** ↓ between two stacked boxes. */
function ArrowDown({ y1, y2, x }: { y1: number; y2: number; x: number }) {
  return (
    <g stroke={ARROW} strokeWidth={STROKE} fill="none" strokeLinecap="square">
      <path d={`M${x} ${y1}V${y2}`} />
      <path d={`M${x - 5} ${y2 - 6}L${x} ${y2}L${x + 5} ${y2 - 6}`} />
    </g>
  );
}

function Row({ stages }: { stages: string[] }) {
  const n = stages.length;
  const boxW = n <= 4 ? 156 : 112;
  const boxH = 72;
  const gap = 30;
  const w = n * boxW + (n - 1) * gap;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${boxH}`}
      width="100%"
      height={boxH}
      preserveAspectRatio="xMidYMid meet"
      className="hidden h-auto w-full md:block"
    >
      {stages.map((s, i) => {
        const x = i * (boxW + gap);
        return (
          <g key={s + i}>
            <rect
              x={x + STROKE / 2}
              y={STROKE / 2}
              width={boxW - STROKE}
              height={boxH - STROKE}
              fill="none"
              stroke={INK}
              strokeWidth={STROKE}
            />
            <Label x={x + boxW / 2} y={boxH / 2} lines={wrap(s)} />
            {i < n - 1 ? (
              <ArrowRight x1={x + boxW + 6} x2={x + boxW + gap - 6} y={boxH / 2} />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function Column({ stages }: { stages: string[] }) {
  const n = stages.length;
  const boxW = 320;
  const boxH = 60;
  const gap = 32;
  const h = n * boxH + (n - 1) * gap;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${boxW} ${h}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full md:hidden"
    >
      {stages.map((s, i) => {
        const y = i * (boxH + gap);
        return (
          <g key={s + i}>
            <rect
              x={STROKE / 2}
              y={y + STROKE / 2}
              width={boxW - STROKE}
              height={boxH - STROKE}
              fill="none"
              stroke={INK}
              strokeWidth={STROKE}
            />
            <Label x={boxW / 2} y={y + boxH / 2} lines={wrap(s)} />
            {i < n - 1 ? <ArrowDown y1={y + boxH + 6} y2={y + boxH + gap - 6} x={boxW / 2} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

export function Schematic({ stages, className }: SchematicProps) {
  if (!stages.length) return null;
  return (
    <div className={cn("w-full", className)}>
      <Row stages={stages} />
      <Column stages={stages} />
    </div>
  );
}

/*
  TornEdge — a deterministic paper tear.

  The site's world is PAPER (Golden Hour ground); photographs don't float in
  it — the paper TEARS to reveal them. This renders the ragged fibre edge at a
  band's seam: a jagged path hugging the seam (paper side) with a soft ink
  shadow underneath for the lifted-fibre depth. Values are hash-fract per
  index (deterministic — SSR == client, no hydration risk; precision fixed).

  side="top": paper above tears down into the image. side="bottom": mirrored.
  Pure SVG, no JS at runtime, aria-hidden, scales with preserveAspectRatio=none.
*/

const W = 1440;
const H = 26;
const N = 56;

function tearPath(seed: number) {
  const fr = (i: number, n: number) => {
    const x = Math.sin((i + seed * 31.7) * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  let d = "M0 0 ";
  for (let i = 0; i <= N; i++) {
    const x = ((i * W) / N).toFixed(1);
    const y = (3 + fr(i, 1) * (H - 9) + (i % 2 ? 2.5 : -2.5) * fr(i, 2)).toFixed(1);
    d += `L${x} ${y} `;
  }
  d += `L${W} 0 Z`;
  return d;
}

export function TornEdge({
  side = "top",
  seed = 1,
  color = "var(--color-paper)",
  className = "",
}: {
  side?: "top" | "bottom";
  seed?: number;
  /** the paper color on the torn side (defaults to page paper) */
  color?: string;
  className?: string;
}) {
  const d = tearPath(seed);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-10 h-[22px] w-full ${
        side === "top" ? "top-0" : "bottom-0 rotate-180"
      } ${className}`}
    >
      {/* lifted-fibre shadow under the tear */}
      <path d={d} transform="translate(0 3)" fill="rgb(42 26 20 / 0.22)" />
      <path d={d} fill={color} />
    </svg>
  );
}

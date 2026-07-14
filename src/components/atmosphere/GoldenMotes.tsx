/*
  GoldenMotes — sunset pollen drifting upward (the shared motes layer).
  Values are DETERMINISTIC per index (hash-fract, no Math.random): the same
  numbers render on the server and the client, so hydration never mismatches.
  Pure CSS motion (.golden-mote in globals.css); most ride amber, a few catch
  coral. Server component — no client JS shipped. Used by GoldenHaze (home
  About band) and the /about journey atmosphere.
*/
import * as React from "react";

function motes(count: number, salt: number) {
  return Array.from({ length: count }, (_, i) => {
    const fr = (n: number) => {
      const x = Math.sin((i + salt) * 127.1 + n * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    // fixed precision: the SSR style serializer trims long floats while the
    // client sets them verbatim — identical strings on both sides or React
    // reports a hydration mismatch on every mote
    const r = (x: number, d = 3) => Number(x.toFixed(d));
    return {
      left: r(4 + fr(1) * 92), // %
      top: r(8 + fr(2) * 80), // %
      size: r(2 + fr(3) * 3), // px
      dur: 16 + fr(4) * 14, // s (already .toFixed at render)
      delay: -fr(5) * 30, // s — negative: each starts mid-cycle
      sway: (fr(6) * 2 - 1) * 2.2, // rem
      peak: 0.3 + fr(7) * 0.35,
      coral: fr(8) > 0.72,
    };
  });
}

export function GoldenMotes({ count = 14, salt = 0 }: { count?: number; salt?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes(count, salt).map((m, i) => (
        <span
          key={i}
          className="golden-mote"
          style={
            {
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              background: m.coral
                ? "color-mix(in srgb, var(--color-coral) 88%, white)"
                : undefined,
              "--mote-dur": `${m.dur.toFixed(1)}s`,
              "--mote-delay": `${m.delay.toFixed(1)}s`,
              "--mote-sway": `${m.sway.toFixed(2)}rem`,
              "--mote-peak": m.peak.toFixed(2),
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

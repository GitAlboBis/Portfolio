import { ImageResponse } from "next/og";
import { OG_COLOR, OG_FAMILY, ogFonts } from "@/app/fonts/og-fonts";
import { siteMeta } from "@/lib/site";

/**
 * The job order, as a social card (1200×630) — REDESIGN-SPEC §G.
 * Header strip · the name wide · the role line · the safety band with INTAKE
 * stamped. Palette as hex literals (next/og cannot read CSS variables) and
 * Archivo from the local static instances (src/app/fonts).
 *
 * Auto-used for OG + Twitter on every route that does not ship its own image
 * (/work/[slug] does — see its opengraph-image.tsx).
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = siteMeta.en.title;

const PHASES = ["Intake", "Diagnosis", "Estimate", "Work", "Test", "Release"];

export default async function OpengraphImage() {
  const fonts = await ogFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: OG_COLOR.paper,
          color: OG_COLOR.ink,
          fontFamily: OG_FAMILY.body,
        }}
      >
        {/* ── header strip: provenance of the sheet ───────────────────────── */}
        <div
          style={{
            display: "flex",
            height: 64,
            borderBottom: `2px solid ${OG_COLOR.ink}`,
            fontFamily: OG_FAMILY.cond,
            fontSize: 22,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: OG_COLOR.graphite,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", padding: "0 32px", flex: 1, color: OG_COLOR.ink }}>
            Sersan Limited · London · Remote
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 32px",
              borderLeft: `2px solid ${OG_COLOR.ink}`,
            }}
          >
            Sep 2026
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 32px",
              borderLeft: `2px solid ${OG_COLOR.ink}`,
            }}
          >
            <span>Status ·</span>
            <span
              style={{
                display: "flex",
                border: `2px solid ${OG_COLOR.ink}`,
                color: OG_COLOR.ink,
                padding: "2px 10px",
              }}
            >
              OPEN
            </span>
          </div>
        </div>

        {/* ── the job order field: caption, name, role ─────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          <div
            style={{
              fontFamily: OG_FAMILY.cond,
              fontSize: 24,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: OG_COLOR.graphite,
            }}
          >
            Job order
          </div>
          <div
            style={{
              fontFamily: OG_FAMILY.wide,
              fontSize: 136,
              lineHeight: 1,
              letterSpacing: -2,
              marginTop: 14,
            }}
          >
            Alberto Tuveri
          </div>
          <div style={{ display: "flex", height: 2, background: OG_COLOR.ink, margin: "28px 0 24px" }} />
          <div style={{ fontSize: 34 }}>Software &amp; AI Engineer · Creative Lead</div>
          <div style={{ fontSize: 30, color: OG_COLOR.graphite, marginTop: 8 }}>
            Full-Stack · WebGPU / 3D &amp; Motion
          </div>
        </div>

        {/* ── safety band: the six phases, INTAKE stamped ──────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 112,
            background: OG_COLOR.safety,
            borderTop: `2px solid ${OG_COLOR.ink}`,
            fontFamily: OG_FAMILY.cond,
            fontSize: 24,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: OG_COLOR.ink,
          }}
        >
          {PHASES.map((p, i) => (
            <div
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flex: 1,
                borderLeft: i === 0 ? "none" : `2px solid ${OG_COLOR.ink}`,
              }}
            >
              {i === 0 ? (
                <div
                  style={{
                    display: "flex",
                    background: OG_COLOR.stamp,
                    color: OG_COLOR.paper,
                    border: `3px solid ${OG_COLOR.stamp}`,
                    padding: "6px 16px",
                    transform: "rotate(-3.5deg)",
                  }}
                >
                  {p}
                </div>
              ) : (
                p
              )}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: 150,
              borderLeft: `2px solid ${OG_COLOR.ink}`,
              fontFamily: OG_FAMILY.body,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 0,
            }}
          >
            1 / 6
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}

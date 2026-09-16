import { ImageResponse } from "next/og";
import { OG_COLOR, OG_FAMILY, ogFonts } from "@/app/fonts/og-fonts";
import { works, type WorkMetric } from "@/content/works";

/**
 * Sub-form social card (1200×630) — REDESIGN-SPEC §G: WORK stamped, the line
 * item's title, and its FIRST Measured pair, printed as the sheet prints it
 * (before → after, tabular, with its provenance cell). Nothing invented: every
 * value comes from `src/content/works.ts` (CV, PRODUCT.md §9). EN only — the
 * card is server-rendered and has no locale.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Work performed — Alberto Tuveri";

type Params = { params: Promise<{ slug: string }> };

/** The first pair on the row (before → after); falls back to the first figure. */
function firstMeasured(metrics?: WorkMetric[]): WorkMetric | undefined {
  return metrics?.find((m) => m.before && m.after) ?? metrics?.[0];
}

export default async function WorkOpengraphImage({ params }: Params) {
  const { slug } = await params;
  const work = works.find((w) => w.slug === slug);
  const fonts = await ogFonts();

  const title = work?.title ?? "Work performed";
  const client = [work?.org, work?.period].filter(Boolean).join(" · ");
  const m = firstMeasured(work?.study?.metrics);
  const unit = m?.unit?.en ?? "";
  const pair = m?.before && m?.after ? `${m.before} → ${m.after}${unit}` : m?.value;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: OG_COLOR.paperCarbon,
          color: OG_COLOR.ink,
          fontFamily: OG_FAMILY.body,
        }}
      >
        {/* ── header strip ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            height: 64,
            borderBottom: `2px solid ${OG_COLOR.ink}`,
            fontFamily: OG_FAMILY.cond,
            fontSize: 22,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", padding: "0 32px", flex: 1 }}>
            Alberto Tuveri · Job order
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 32px",
              borderLeft: `2px solid ${OG_COLOR.ink}`,
              color: "#4a4a47",
            }}
          >
            {client || "Sep 2026"}
          </div>
        </div>

        {/* ── the sub-form sheet ───────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: OG_COLOR.paper,
            margin: "28px 28px 0 36px",
            border: `2px solid ${OG_COLOR.ink}`,
            padding: "36px 44px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div
              style={{
                fontFamily: OG_FAMILY.cond,
                fontSize: 24,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: OG_COLOR.graphite,
              }}
            >
              Work performed
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: OG_FAMILY.cond,
                fontSize: 30,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                background: OG_COLOR.stamp,
                color: OG_COLOR.paper,
                border: `3px solid ${OG_COLOR.stamp}`,
                padding: "8px 20px",
                transform: "rotate(-3.5deg)",
              }}
            >
              Work
            </div>
          </div>

          <div
            style={{
              fontFamily: OG_FAMILY.wide,
              fontSize: title.length > 22 ? 78 : 104,
              lineHeight: 1,
              letterSpacing: -1.5,
              marginTop: 10,
            }}
          >
            {title}
          </div>

          <div style={{ display: "flex", height: 2, background: OG_COLOR.ink, margin: "30px 0 0" }} />

          {/* Measured — one pair, printed, never animated */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
            <div
              style={{
                fontFamily: OG_FAMILY.cond,
                fontSize: 22,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: OG_COLOR.graphite,
              }}
            >
              Measured
            </div>
            {pair ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 12 }}>
                <div
                  style={{
                    fontFamily: OG_FAMILY.wide,
                    fontSize: 64,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {pair}
                </div>
                <div style={{ fontSize: 28, color: OG_COLOR.graphite, maxWidth: 620 }}>
                  {m?.label.en}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 34, marginTop: 12, color: OG_COLOR.graphite }}>—</div>
            )}
            {m ? (
              <div style={{ fontSize: 22, color: OG_COLOR.graphite, marginTop: 14 }}>
                {m.source.en}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── safety footer: the address of the sheet ──────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 84,
            marginTop: 28,
            background: OG_COLOR.safety,
            borderTop: `2px solid ${OG_COLOR.ink}`,
            padding: "0 36px",
            fontFamily: OG_FAMILY.cond,
            fontSize: 24,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>Alberto Tuveri · Software &amp; AI Engineer</div>
          {/* the address is a real URL: the band's uppercase must not reach it */}
          <div
            style={{
              display: "flex",
              fontFamily: OG_FAMILY.body,
              letterSpacing: 0,
              textTransform: "none",
            }}
          >
            /work/{slug}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}

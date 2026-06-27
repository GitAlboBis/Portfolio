import { ImageResponse } from "next/og";

/*
  Open Graph / social share card (1200x630). Cinematic Ocean art direction:
  a deep abyss -> celeste field, a towering Fraunces "A" sea-stack motif on the
  right, and editorial name / role / tagline on the left. Restrained, premium —
  the same voice as the site. Used for both og:image and twitter:image.
*/

export const alt =
  "Alberto Tuveri — Software Engineer, Full-Stack & AI. A cinematic, ocean-themed portfolio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated on-demand (next/og fetches the display font at runtime). Avoids
// prerendering the image during build, which can fail in network-less build envs.
export const dynamic = "force-dynamic";

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  // Fraunces (serif display) + Hanken Grotesk (sans labels) — the site fonts.
  const [fraunces, hanken] = await Promise.all([
    loadFont(
      "https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf",
    ),
    loadFont(
      "https://github.com/google/fonts/raw/main/ofl/hankengrotesk/HankenGrotesk%5Bwght%5D.ttf",
    ),
  ]);

  const serif = fraunces ? "Fraunces" : "serif";
  const sans = hanken ? "Hanken Grotesk" : "sans-serif";

  const fonts = [
    fraunces
      ? { name: "Fraunces", data: fraunces, style: "normal" as const, weight: 500 as const }
      : null,
    hanken
      ? { name: "Hanken Grotesk", data: hanken, style: "normal" as const, weight: 600 as const }
      : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          // abyss -> deep, with a celeste glow rising from the lower-left like
          // light through water
          background:
            "radial-gradient(140% 110% at 15% 120%, #154b5e 0%, #0b2c3a 42%, #07222e 100%)",
          overflow: "hidden",
        }}
      >
        {/* Giant translucent Fraunces "A" — the sea-stack motif, bleeding off-frame */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: -120,
            display: "flex",
            fontFamily: serif,
            fontSize: 760,
            fontWeight: 500,
            lineHeight: 1,
            color: "#9bd3ee",
            opacity: 0.12,
          }}
        >
          A
        </div>

        {/* Hairline frame — editorial restraint */}
        <div
          style={{
            position: "absolute",
            inset: 48,
            border: "1px solid rgba(244,250,251,0.14)",
            borderRadius: 18,
          }}
        />

        {/* Content column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 96,
            width: "72%",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#9fbac6",
            }}
          >
            Software Engineer · Full-Stack + AI
          </div>

          {/* Name + tagline */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 132,
                lineHeight: 0.96,
                letterSpacing: -2,
                color: "#f4fafb",
              }}
            >
              Alberto Tuveri
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 32,
                maxWidth: 660,
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 34,
                lineHeight: 1.4,
                color: "#9fbac6",
              }}
            >
              From the cliffs of Pan di Zucchero to production-grade systems.
            </div>
          </div>

          {/* Footer line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#9fbac6",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: 8,
                background: "#9bd3ee",
              }}
            />
            albertotuveri.dev · Camerino, Italy
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}

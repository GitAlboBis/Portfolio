import { ImageResponse } from "next/og";

/*
  Apple touch icon (180x180) — the Fraunces "A" monogram on the cinematic
  ocean (abyss -> deep radial), matching src/app/icon.svg. Rendered via
  next/og so the serif mark stays crisp on retina home screens.
*/

// Image metadata
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Generated on-demand (next/og fetches the display font at runtime). Avoids
// prerendering the image during build, which can fail in network-less build envs.
export const dynamic = "force-dynamic";

// Load Fraunces once at module scope. If the network is unavailable at build
// time, ImageResponse falls back to its built-in serif — the icon still renders.
async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf",
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function AppleIcon() {
  const fraunces = await loadFraunces();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // abyss -> deep radial, matching the favicon
          background:
            "radial-gradient(120% 120% at 38% 30%, #0b2c3a 0%, #07222e 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: fraunces ? "Fraunces" : "serif",
            fontSize: 132,
            fontWeight: 500,
            lineHeight: 1,
            color: "#f4fafb",
            // optical centering of the cap "A"
            paddingTop: 6,
          }}
        >
          A
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces
        ? [{ name: "Fraunces", data: fraunces, style: "normal", weight: 500 }]
        : undefined,
    },
  );
}

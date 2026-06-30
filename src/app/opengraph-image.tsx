import { ImageResponse } from "next/og";

// Golden Hour social card (1200×630). Auto-used for OG + Twitter across the site.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Alberto Tuveri — Software Engineer";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#fbf6ef",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: "#bc410f",
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Software Engineer
        </div>
        <div style={{ fontSize: 104, fontWeight: 800, color: "#2a1a14", lineHeight: 1.02 }}>
          Alberto Tuveri
        </div>
        <div style={{ fontSize: 36, color: "#6e5447", marginTop: 30, maxWidth: 900 }}>
          Full-stack & AI integration — interfaces that move like water.
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 18,
            backgroundImage: "linear-gradient(90deg,#f2a33c,#ff8a4c,#ee5b23,#e15d6b,#5e4b7e)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";

// Golden Hour favicon — an ember "A" monogram on paper. Generated at build (next/og).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ee5b23",
          color: "#fbf6ef",
          fontSize: 23,
          fontWeight: 800,
          borderRadius: 7,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";
import { OG_COLOR } from "@/app/fonts/og-fonts";

/**
 * Favicon (REDESIGN-SPEC §G): the sheet at 32px — a safety-yellow square in a
 * 2px ink frame with the stamp square in the bottom-right corner. No letter, no
 * monogram: recognisable as the yellow form even at 16px. Generated at build by
 * next/og; `theme-color #f5f4ef` lives in layout's viewport export.
 */
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
          background: OG_COLOR.safety,
          border: `2px solid ${OG_COLOR.ink}`,
          position: "relative",
        }}
      >
        {/* the rule of the band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 9,
            height: 2,
            background: OG_COLOR.ink,
          }}
        />
        {/* the stamp, bottom-right */}
        <div
          style={{
            position: "absolute",
            right: 3,
            bottom: 3,
            width: 11,
            height: 8,
            background: OG_COLOR.stamp,
          }}
        />
      </div>
    ),
    { ...size },
  );
}

import type { Metadata } from "next";
import { StyleguideSheet } from "./StyleguideSheet";

/*
  /styleguide — the living sheet of THE JOB ORDER (WP-8, REDESIGN-SPEC §J).
  Server page: only metadata lives here; the sheet itself is a client island
  (StyleguideSheet.tsx) because it reads the persisted EN/IT locale and prints
  every AA ratio computed at render time (src/lib/contrast.ts). Not indexed.
*/

export const metadata: Metadata = {
  title: "Styleguide",
  description: "The job order — living styleguide: palette with hex, AA ratios computed at render time, Archivo type scale, band, rule and stamp.",
  robots: { index: false, follow: false },
};

export default function StyleguidePage() {
  return <StyleguideSheet />;
}

import type { MetadataRoute } from "next";

/*
  Web App Manifest. Cinematic Ocean brand: abyss theme/background so the app
  shell matches the site on install (standalone). Icons reference the served
  metadata routes — src/app/icon.svg -> /icon.svg, src/app/apple-icon.tsx ->
  /apple-icon — so there are no 404s.
*/
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alberto Tuveri — Software Engineer · Full-Stack + AI",
    short_name: "Alberto Tuveri",
    description:
      "Portfolio of Alberto Tuveri — full-stack & AI software engineer. From the cliffs of Pan di Zucchero to production-grade systems.",
    start_url: "/",
    display: "standalone",
    theme_color: "#07222e",
    background_color: "#07222e",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "maskable",
      },
    ],
  };
}

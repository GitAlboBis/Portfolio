/* The night studio, built by Astro (lane p-astro; plan 70 §8.1). The output mirrors the live site's URLs:
   dist/proto/rivista/{index,work,about,consulting,obla,contact,case-<slug>,404}.html, the same under it/, fx.css, and
   the files the pages share copied untouched (see integrations/shared.mjs). No UI framework, no integration but ours. */
import { defineConfig } from "astro/config";
import shared from "./integrations/shared.mjs";

export default defineConfig({
  output: "static",
  outDir: "./dist",
  /* nothing of Astro's own public folder: the shared files are copied from public/ as they are, by name */
  publicDir: "./no-public",
  trailingSlash: "ignore",
  compressHTML: false,
  build: { format: "preserve", inlineStylesheets: "never" },
  devToolbar: { enabled: false },
  integrations: [shared()],
  vite: {
    /* the partials, strings and cases live in ../public/proto/rivista/parts and are imported from there */
    server: { fs: { allow: [".."] } },
  },
});

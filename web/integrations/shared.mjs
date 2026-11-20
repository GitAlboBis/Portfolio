/* After the build: the files the pages share are copied into dist exactly as they are on disk (never bundled, never
   transformed), at the URLs they have today: the page scripts (fx-*.js), the whole stage/, icons/, og/, the manifest
   under /proto/rivista/, and the captures under /captures/. The assembled .html pages, fx.css, parts/, css/ and
   assemble.mjs are NOT copied: Astro builds the pages and fx.css itself. */
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RV = resolve(fileURLToPath(new URL("../../public/proto/rivista/", import.meta.url)));
export const CAPTURES = resolve(fileURLToPath(new URL("../../public/captures/", import.meta.url)));
export const SHARED = (dir = RV) => [
  ...readdirSync(dir).filter((f) => /^fx-[a-z]+\.js$/.test(f)),
  "stage", "icons", "og", "site.webmanifest",
];

export default function shared() {
  return {
    name: "rivista-shared-files",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const site = join(out, "proto", "rivista");
        let n = 0;
        for (const f of SHARED()) {
          const src = join(RV, f);
          if (!existsSync(src)) { logger.warn(`shared file missing: ${f}`); continue; }
          cpSync(src, join(site, f), { recursive: true });
          n++;
        }
        cpSync(CAPTURES, join(out, "captures"), { recursive: true });
        logger.info(`copied ${n} shared entries untouched under proto/rivista/, and captures/`);
      },
    },
  };
}

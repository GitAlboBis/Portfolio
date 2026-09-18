#!/usr/bin/env node
/* ==========================================================================
   Rivista prototype · page assembler (owner: WP-A). Node, no dependencies.

     node assemble.mjs          builds index.html and case.html next to this file
     node assemble.mjs --check  exits 1 if a built page is stale (writes nothing)

   The pages are concatenated from parts/*.html so three packages never edit
   the same HTML file. Output is a pure function of the partials: two agents
   running it at the same time write identical bytes, so no update is lost.
   A missing partial becomes an HTML comment and the page still builds.
   {{TITLE}} and {{HOME}} are replaced per page (every occurrence, every part).
   ========================================================================== */
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));

const PAGES = [
  {
    out: "index.html",
    vars: { TITLE: "Alberto Tuveri · Rivista prototype", HOME: " data-home" },
    parts: [
      "head.html",
      '<body id="top">',
      "b-preloader.html",
      "a-header.index.html",
      '<main id="main">',
      "b-hero.html",
      "c-main.index.html",
      "</main>",
      "c-footer.html",
      "a-overlays.html",
      "</body>\n</html>",
    ],
  },
  {
    out: "case.html",
    vars: { TITLE: "SphereNode · Alberto Tuveri · Rivista prototype", HOME: "" },
    parts: [
      "head.html",
      '<body id="top">',
      "a-header.case.html",
      '<main id="main">',
      "c-main.case.html",
      "</main>",
      "c-footer.html",
      "a-overlays.html",
      "</body>\n</html>",
    ],
  },
];

const missing = [];

function piece(entry, page) {
  if (!/\.html$/.test(entry)) return entry + "\n"; // literal markup
  const file = join(ROOT, "parts", entry);
  if (!existsSync(file)) {
    missing.push(`${page}: parts/${entry}`);
    return `<!-- assemble: missing partial parts/${entry} -->\n`;
  }
  let s = readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!s.endsWith("\n")) s += "\n";
  return s;
}

function build(page) {
  let html = page.parts.map((p) => piece(p, page.out)).join("");
  for (const [key, value] of Object.entries(page.vars)) html = html.split(`{{${key}}}`).join(value);
  const left = html.match(/\{\{[A-Z_]+\}\}/g);
  if (left) console.warn(`[assemble] ${page.out}: unknown placeholder ${[...new Set(left)].join(", ")}`);
  return html;
}

const check = process.argv.includes("--check");
let stale = 0;

for (const page of PAGES) {
  const html = build(page);
  const target = join(ROOT, page.out);
  const current = existsSync(target) ? readFileSync(target, "utf8") : null;
  if (current === html) {
    console.log(`[assemble] ${page.out} up to date (${html.length} bytes)`);
    continue;
  }
  stale++;
  if (check) {
    console.log(`[assemble] ${page.out} is stale`);
    continue;
  }
  // write to a private temp file, then rename over the target: a reader never sees half a page
  const tmp = `${target}.${process.pid}.tmp`;
  writeFileSync(tmp, html);
  renameSync(tmp, target);
  console.log(`[assemble] ${page.out} written (${html.length} bytes)`);
}

for (const m of missing) console.warn(`[assemble] missing partial, replaced by a comment: ${m}`);
if (check && stale) process.exit(1);

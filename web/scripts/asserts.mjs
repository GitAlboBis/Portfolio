#!/usr/bin/env node
/* ==========================================================================
   web/scripts/asserts.mjs · assemble.mjs's structural asserts, run on the Astro build's files (lane p-astro)

     node scripts/asserts.mjs [--built=<folder>]      default: web/dist/proto/rivista; exit 1 on any failure

   Ported from assemble.mjs asserts() and editions(), reading the built files instead of the in-memory pages:
     covered  1 the gallery steps (one per work, in order, its link, label, slab or key words) and each case's opener
                (the scene "case", the h1 in its first block, the gallery step's plate, main[data-case])
              2 "More work": the next links are one cycle of nine
              3 one h1 per page; html[data-ground]; nothing of the water or the magazine (WATER)
              4 the dawn close on every page but Contact (same bytes as the cover's; the 404's own engine line only)
              5 the scene grammar (one empty view per scene, --steps = its blocks)
              · each chapter section on exactly one page; no case.html link; no duplicate id
              · html[lang]; the language control (two links to the twin, the current language marked twice)
              · the hreflang pair and the canonical (when RV_ORIGIN is unset)
              R4 every local href/src and every fx-*.js of the loader is a file of the build
              · the two editions hold the same elements; no English word on an Italian page (I-6)
              6 the share cards (og/og-manifest.json against scripts/media/og-card-jobs.mjs: a source check)
     not here (source checks, not output: assemble.mjs --check runs them on the same parts): I-1 both languages in every
              string, I-2 no string nobody prints, I-3 the markup whitelist, I-9 the cases' Italian twins, the Italian
              typography, a placeholder left or an unknown {{t:id}} (lib/site.mjs finish() fails the Astro build on those)
   ========================================================================== */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(HERE, "..", "..");
const RV = join(REPO, "public", "proto", "rivista");
process.env.RV_DIR = process.env.RV_DIR || RV;
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || d;
const BUILT = resolve(arg("built", join(HERE, "..", "dist", "proto", "rivista")));
const { RESOLVED, LANG_IDS, LANGS, ISSUE, groundOf } = await import(pathToFileURL(join(HERE, "..", "src", "lib", "site.mjs")).href);
const OG = await import(pathToFileURL(join(REPO, "scripts", "media", "og-card-jobs.mjs")).href);

const other = (lang) => LANG_IDS.find((l) => l !== lang);
const count = (s, re) => (s.match(re) || []).length;
const fail = [];
const F = (m) => fail.push(m);

/* the built pages, as assemble.mjs's PAGES list them */
const PAGES = [];
for (const lang of LANG_IDS) {
  const dir = LANGS[lang].dir;
  PAGES.push({ out: dir + "index.html", lang, file: "index.html", key: "home" });
  for (const key of Object.keys(ISSUE).filter((k) => k !== "home")) PAGES.push({ out: dir + ISSUE[key].file, lang, file: ISSUE[key].file, key });
  for (const c of RESOLVED) PAGES.push({ out: dir + "case-" + c.slug + ".html", lang, file: "case-" + c.slug + ".html", key: "case" });
  PAGES.push({ out: dir + "404.html", lang, file: "404.html", key: "404" });
}
const built = {};
for (const p of PAGES) { const f = join(BUILT, p.out); if (existsSync(f)) built[p.out] = readFileSync(f, "utf8"); else F(p.out + ": not built"); }
const extraPages = [...readdirSync(BUILT), ...readdirSync(join(BUILT, "it")).map((f) => "it/" + f)].filter((f) => f.endsWith(".html") && !(f in built));
if (extraPages.length) F("pages nobody listed: " + extraPages.join(", "));

/* ------------------------------------------------------------ asserts() */
const WATER = /data-gl-host|'fx-water\.js'|hr-poster|\sdata-pre[\s>]|fx-plate-v\d|data-rail\b|data-band\b|class="ornament/;
const CHAPTERS = ["now", "index", "work", "evidence", "stack", "path", "consult", "obla", "contact"];
for (const lang of LANG_IDS) {
  const dir = LANGS[lang].dir;
  const work = built[dir + "work.html"] || "";
  const caseOf = (slug) => built[dir + "case-" + slug + ".html"];
  for (const c of RESOLVED) {
    const m = new RegExp(`<li class="sc-step wk" data-stage-step="(\\d+)" data-tile-id="${c.tile}">([\\s\\S]*?)</li>\\n`).exec(work);
    if (!m) { F(`${dir}work: no gallery step for ${c.tile}`); continue; }
    if (+m[1] !== +c.tile) F(`${dir}work: step ${m[1]} for tile ${c.tile}`);
    const a = /<a class="q" href="([^"]+)" data-pt-label="([^"]*)"/.exec(m[2]);
    if (!a || a[1] !== "case-" + c.slug + ".html") F(`${dir}work: tile ${c.tile} links ${a && a[1]} (want case-${c.slug}.html)`);
    else if (a[2] !== c.label.replace(/&/g, "&amp;")) F(`${dir}work: tile ${c.tile} data-pt-label ${a[2]} (want ${c.label})`);
    const cap = c.fig.kind === "capture";
    if (cap !== new RegExp(`<img data-slab="${c.slug}"`).test(m[2])) F(`${dir}work: tile ${c.tile} ${cap ? "has no" : "has a"} <img data-slab>`);
    if (!cap && !new RegExp(`data-slab-words="${c.slug}"`).test(m[2])) F(`${dir}work: tile ${c.tile} without its key words`);
    const page = caseOf(c.slug) || "";
    if (cap !== /\sdata-case-hero[\s>]/.test(page)) F(`${dir}case-${c.slug}: its picture is not its gallery step's`);
    const op = /<section class="sc sc-left cs-sc" data-stage="case" style="--steps:2"[^>]*>([\s\S]*?)<\/section>/.exec(page);
    if (!op) F(`${dir}case-${c.slug}: its opener is not the scene "case"`);
    else {
      if (!/<div class="sc-step cs-hero" data-stage-step="1">[\s\S]*<h1 /.test(op[1])) F(`${dir}case-${c.slug}: the h1 is not in the opener's first block`);
      const slab = cap ? new RegExp(`<figure class="cs-pic[^"]*" data-case-hero>\\s*<img data-slab="${c.slug}" data-stage-poster `) : new RegExp(`data-slab-words="${c.slug}" data-stage-poster`);
      if (!slab.test(op[1])) F(`${dir}case-${c.slug}: the opener's plate is not its gallery step's`);
    }
    if (!new RegExp(`<main id="main" data-case="${c.slug}"`).test(page)) F(`${dir}case-${c.slug}: main[data-case] is missing`);
    // (lane CASES, as assemble.mjs) every chapter names its type, in the data's order (the stage's figure per type)
    const kinds = [...page.matchAll(/<section id="c\d+" data-ch="([a-z]+)" /g)].map((m) => m[1]).join(" ");
    if (kinds !== c.chapters.map((ch) => ch.type).join(" ")) F(`${dir}case-${c.slug}: its chapters' data-ch are "${kinds}"`);
  }
  const seen = new Set();
  let at = RESOLVED[0].slug;
  for (let k = 0; k < RESOLVED.length; k++) {
    seen.add(at);
    const m = /<a class="cs-more-a cs-next" href="case-([a-z0-9-]+)\.html"/.exec(caseOf(at) || "");
    const want = RESOLVED[(RESOLVED.findIndex((c) => c.slug === at) + 1) % RESOLVED.length].slug;
    if (!m) { F(`${dir}case-${at}: no next link`); break; }
    if (m[1] !== want) F(`${dir}case-${at}: next is ${m[1]} (want ${want})`);
    at = m[1];
  }
  if (seen.size !== RESOLVED.length || at !== RESOLVED[0].slug) F(`${dir}next links: not one cycle`);
  const dawn = (built[dir + "index.html"] || "").match(/<footer class="dawn"[\s\S]*?<\/footer>/);
  for (const p of PAGES.filter((x) => x.lang === lang)) {
    const h = built[p.out] || "";
    if (count(h, /<h1[\s>]/g) !== 1) F(p.out + ": " + count(h, /<h1[\s>]/g) + " h1");
    if (!new RegExp(`<html [^>]*data-ground="${groundOf(p.key)}"`).test(h)) F(p.out + ": html[data-ground] is not " + groundOf(p.key));
    if (WATER.test(h)) F(p.out + ": something of the old site is back (" + WATER.exec(h)[0] + ")");
    const close = h.match(/<footer class="dawn"[\s\S]*?<\/footer>/g) || [];
    if (p.key === "contact") { if (close.length) F(p.out + ": the Contact page has a dawn close"); if (count(h, /\sdata-dawn[\s>]/g) !== 1) F(p.out + ": the Contact page is not [data-dawn]"); }
    else if (close.length !== 1) F(p.out + ": " + close.length + " dawn closes (want 1)");
    else if (dawn && p.key !== "404" && close[0] !== dawn[0]) F(p.out + ": the dawn close differs from the cover's");
    else if (dawn && p.key === "404") {
      const LL = /<p class="legal-line">[\s\S]*?<\/p>/;
      const own = (close[0].match(LL) || [""])[0], cover = (dawn[0].match(LL) || [""])[0];
      if (!own || own === cover) F(p.out + ": the 404's close does not print its own engine line");
      if (close[0].replace(LL, "") !== dawn[0].replace(LL, "")) F(p.out + ": the 404's close differs from the cover's beyond its engine line");
    }
    for (const m of h.matchAll(/<section class="sc[ "][^>]*data-stage="([a-z]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
      const name = m[1], body = m[2], st = /--steps:(\d+)/.exec(m[0]);
      if (count(body, new RegExp(`<div class="sc-view" data-stage-anchor="${name}" aria-hidden="true"></div>`, "g")) !== 1) F(`${p.out}: scene ${name} without its one empty view`);
      const blocks = count(body, /class="sc-step[ "]/g);
      if (st && +st[1] !== blocks) F(`${p.out}: scene ${name} says --steps:${st[1]} and holds ${blocks} blocks`);
    }
  }
  for (const id of CHAPTERS) {
    const on = PAGES.filter((x) => x.lang === lang && new RegExp('<section [^>]*id="' + id + '"').test(built[x.out] || "")).map((x) => x.out);
    if (on.length !== 1) F(dir + "section #" + id + " is on " + on.length + " pages");
  }
}
for (const [f, html] of Object.entries(built)) {
  if (/href="case\.html[#"?]/.test(html)) F(`${f}: still links case.html`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) F(`${f}: duplicate id ${[...new Set(dup)].join(", ")}`);
}
const man = existsSync(OG.MANIFEST) ? JSON.parse(readFileSync(OG.MANIFEST, "utf8")) : {};
for (const j of OG.ogJobs()) if (man[j.file] !== OG.ogHash(j)) F(`og/${j.file} is stale or unrecorded`);

/* ------------------------------------------------------------ editions(), the output half */
function readText(html) {
  let h = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
  h = h.replace(/<([a-z0-9]+)\b[^>]*\slang="en"[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const bits = [];
  for (const m of h.matchAll(/\s(?:alt|aria-label|title|content|data-pt-label|data-pt-sub|data-nv-copied|data-nv-failed|data-nv-open|data-nv-close|data-folio|data-rh)="([^"]*)"/gi)) bits.push(m[1]);
  bits.push(h.replace(/<[^>]+>/g, " "));
  return bits.join(" \n ").replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/«[^»]*»/g, " ");
}
const EN_WORD = /\b(the|and|of|with|from|for|by|is|are|was|were|this|that|its|their|which|your|you|not|has|have|into|only)\b/i;
const EN_NAMES = /Gang-of-Four/g;
const NOWRAP = /<span style="white-space:nowrap">([\s\S]*?)<\/span>/g;
const skeleton = (html) => [...html.replace(NOWRAP, "$1").matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)].map((m) => {
  const cls = /\sclass="([^"]*)"/.exec(m[2]), id = /\sid="([^"]*)"/.exec(m[2]);
  return m[1].toLowerCase() + (cls ? "." + cls[1] : "") + (id ? "#" + id[1] : "");
}).sort();
const ORIGIN = String(process.env.RV_ORIGIN || "");
const BASE = ORIGIN ? new URL(ORIGIN.replace(/\/+$/, "") + "/").pathname : "/proto/rivista/";
const pagePath = (lang, file) => LANGS[lang].dir + (file === "index.html" ? "" : file);
const langOf = Object.fromEntries(PAGES.map((p) => [p.out, p.lang]));
const resolveU = (pageOut, u) => {
  u = u.split(/[?#]/)[0];
  if (u.startsWith(BASE)) return u.slice(BASE.length);
  const segs = pageOut.split("/").slice(0, -1);
  for (const s of u.split("/")) { if (s === "..") segs.pop(); else if (s !== "." && s !== "") segs.push(s); }
  return segs.join("/") + (u.endsWith("/") && segs.length ? "/" : "");
};
const CAPTURES_BUILT = resolve(BUILT, "..", "..", "captures");
let files = 0;
for (const p of PAGES) {
  const html = built[p.out] || "";
  if (!new RegExp(`<html lang="${p.lang}"`).test(html)) F(`${p.out}: <html lang> is not ${p.lang}`);
  const twin = LANGS[other(p.lang)].dir + p.file;
  const alts = [...html.matchAll(/<a class="lang-alt" href="([^"]+)" hreflang="([a-z]+)"/g)];
  if (alts.length !== 2) F(`${p.out}: ${alts.length} language links (want 2)`);
  for (const a of alts) {
    if (resolveU(p.out, a[1]) !== twin) F(`${p.out}: the language link goes to ${a[1]} (want ${twin})`);
    if (a[2] !== other(p.lang) || langOf[twin] !== other(p.lang)) F(`${p.out}: the language link is not the other edition`);
  }
  if (count(html, /class="lang-now" aria-current="true"/g) !== 2) F(`${p.out}: the current language is not marked twice`);
  if (p.file !== "404.html" && !ORIGIN) {
    const hl = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">/g)].map((m) => [m[1], resolveU(p.out, m[2]) || "./"]));
    for (const l of LANG_IDS) if (hl[l] !== (pagePath(l, p.file) || "./")) F(`${p.out}: hreflang ${l} is ${hl[l]}`);
    if (hl["x-default"] !== (pagePath("en", p.file) || "./")) F(`${p.out}: hreflang x-default is ${hl["x-default"]}`);
    const canon = /<link rel="canonical" href="([^"]+)">/.exec(html);
    if (!canon || (resolveU(p.out, canon[1]) || "./") !== (pagePath(p.lang, p.file) || "./")) F(`${p.out}: the canonical is not the page itself`);
  }
  // R4, on the build: a page or a file of dist (the captures under dist/captures)
  for (const m of html.matchAll(/\s(?:href|src)="(?![a-z][a-z0-9+.-]*:|#)([^"]+)"/gi)) {
    if (m[1].startsWith("/captures/")) { files++; if (!existsSync(join(CAPTURES_BUILT, m[1].slice(10).split(/[?#]/)[0]))) F(`${p.out}: ${m[1]} is not in dist/captures`); continue; }
    if (m[1].startsWith("/") && !m[1].startsWith(BASE)) continue;
    const t = resolveU(p.out, m[1]);
    const file = t === "" || t.endsWith("/") ? t + "index.html" : t;
    files++;
    if (!existsSync(join(BUILT, file))) F(`${p.out}: ${m[1]} is not a file of the build (${file})`);
  }
  for (const m of html.matchAll(/'((?:\.\.\/|\/[^']*\/)?fx-[a-z]+\.js)'/g)) if (!existsSync(join(BUILT, resolveU(p.out, m[1])))) F(`${p.out}: script ${m[1]} is not a file of the build`);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) for (const u of m[1].split(",").map((x) => x.trim().split(/\s+/)[0])) if (u.startsWith("/captures/") && !existsSync(join(CAPTURES_BUILT, u.slice(10)))) F(`${p.out}: srcset ${u} is not in dist/captures`);
  if (p.lang === "en") continue;
  const en = built[p.file] || "";
  const a = skeleton(en), b = skeleton(html);
  if (a.length !== b.length || a.some((x, i) => x !== b[i])) F(`${p.out}: not the same elements as ${p.file}`);
  const text = readText(html).replace(EN_NAMES, " ");
  const leak = EN_WORD.exec(text);
  if (leak) F(`${p.out}: English on an Italian page: …${text.slice(Math.max(0, leak.index - 50), leak.index + 50).replace(/\s+/g, " ")}…`);
}

for (const b of fail) console.log("ASSERT " + b);
console.log(fail.length ? `asserts FAILED (${fail.length})` : `asserts ok on ${BUILT}: ${PAGES.length} pages (${LANG_IDS.join(", ")}), ${RESOLVED.length} cases, ${files} local references resolved in the build`);
process.exit(fail.length ? 1 : 0);

#!/usr/bin/env node
/* ==========================================================================
   web/scripts/asserts.mjs · assemble.mjs's structural asserts, run on the Astro build's files (lane p-astro)

     node scripts/asserts.mjs [--built=<folder>]      default: web/dist/proto/rivista; exit 1 on any failure

   Ported from assemble.mjs asserts() and editions(), reading the built files instead of the in-memory pages:
     covered  1 the gallery steps (one per work, in order, its tile, its counter "NN / their count", its link, label,
                slab or key words) and each case's opener (the scene "case", the h1 in its first block, the gallery
                step's plate, main[data-case]); a work with a page of its own (Obla) opens that page and has no case page
              2 "More work": the next links are one cycle of the case pages (ten of the eleven works since wave 7);
                every case's More work and the 404 list every work in gallery order
              · every link to a case page names its case and its tile on the cut's sheet (data-pt-label, data-pt-sub)
              3 one h1 per page; html[data-ground]; nothing of the water or the magazine (WATER)
              4 the dawn close on every page but Contact and the home (same bytes as Work's; the 404's own engine
                line only); Contact and the home end with Contact's morning and its legal line, both [data-dawn]
              5 the scene grammar (one empty view per scene, --steps = its blocks)
              · each chapter section where it lives (its page, and the home's part of it); no case.html link; no
                duplicate id
              7 the home (wave 7): its scenes in the menu's order, each once; no index; each part its page's own
                markup (parts/c-main.home.mjs), named as its page; Contact's part at the end
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
const { RESOLVED, CASE_PAGES, hasCase, nextCase, LANG_IDS, LANGS, ISSUE, groundOf, tx } = await import(pathToFileURL(join(HERE, "..", "src", "lib", "site.mjs")).href);
const pad2 = (n) => (n < 10 ? "0" : "") + n;
const OG = await import(pathToFileURL(join(REPO, "scripts", "media", "og-card-jobs.mjs")).href);
/* (wave 7, lane HOME) the home's composition and the words that name its parts */
const { HOME, asPart } = await import(pathToFileURL(join(RV, "parts", "c-main.home.mjs")).href);
const { default: STR } = await import(pathToFileURL(join(RV, "parts", "strings.mjs")).href);
const ESCA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const ea = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ESCA[ch]);

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
  for (const c of CASE_PAGES) PAGES.push({ out: dir + "case-" + c.slug + ".html", lang, file: "case-" + c.slug + ".html", key: "case" });
  PAGES.push({ out: dir + "404.html", lang, file: "404.html", key: "404" });
}
const built = {};
for (const p of PAGES) { const f = join(BUILT, p.out); if (existsSync(f)) built[p.out] = readFileSync(f, "utf8"); else F(p.out + ": not built"); }
const extraPages = [...readdirSync(BUILT), ...readdirSync(join(BUILT, "it")).map((f) => "it/" + f)].filter((f) => f.endsWith(".html") && !(f in built));
if (extraPages.length) F("pages nobody listed: " + extraPages.join(", "));

/* ------------------------------------------------------------ asserts() */
const WATER = /data-gl-host|'fx-water\.js'|hr-poster|\sdata-pre[\s>]|fx-plate-v\d|data-rail\b|data-band\b|class="ornament/;
/* where each section lives (assemble.mjs, wave 7): Now on the home alone, every page's sections on the page and in the
   home's part of it, the cover's index nowhere */
const CHAPTERS = { now: ["home"], work: ["work", "home"], evidence: ["work", "home"], stack: ["about", "home"], path: ["about", "home"],
  consult: ["consult", "home"], obla: ["obla", "home"], contact: ["contact", "home"], index: [] };
for (const lang of LANG_IDS) {
  const dir = LANGS[lang].dir;
  const work = built[dir + "work.html"] || "";
  const caseOf = (slug) => built[dir + "case-" + slug + ".html"];
  // (wave 7, lane WORKS, as assemble.mjs) one step per work; the tiles count the works in order; the counter says
  // "NN / their count"; a work with a page of its own (Obla) opens that page under its name and has no case page
  if (count(work, /<li class="sc-step wk" /g) !== RESOLVED.length) F(`${dir}work: ${count(work, /<li class="sc-step wk" /g)} gallery steps (want ${RESOLVED.length})`);
  RESOLVED.forEach((c, i) => { if (c.tile !== pad2(i + 1)) F(`cases.json: ${c.slug} is tile ${c.tile} (want ${pad2(i + 1)})`); });
  for (const c of RESOLVED) {
    const m = new RegExp(`<li class="sc-step wk" data-stage-step="(\\d+)" data-tile-id="${c.tile}">([\\s\\S]*?)</li>\\n`).exec(work);
    if (!m) { F(`${dir}work: no gallery step for ${c.tile}`); continue; }
    if (+m[1] !== +c.tile) F(`${dir}work: step ${m[1]} for tile ${c.tile}`);
    if (!m[2].includes(`<p class="t-label wk-n"><span class="t-acc">${c.tile}</span> / ${pad2(RESOLVED.length)}</p>`)) F(`${dir}work: tile ${c.tile}'s counter is not "${c.tile} / ${pad2(RESOLVED.length)}"`);
    const a = /<a class="q" href="([^"]+)" data-pt-label="([^"]*)"/.exec(m[2]);
    const wantHref = hasCase(c) ? "case-" + c.slug + ".html" : (ISSUE[c.page] || {}).file;
    const wantLabel = hasCase(c) ? c.label.replace(/&/g, "&amp;") : ISSUE[c.page] ? ea(tx(STR[ISSUE[c.page].label], lang)) : "?";
    if (!a || a[1] !== wantHref) F(`${dir}work: tile ${c.tile} links ${a && a[1]} (want ${wantHref})`);
    else if (a[2] !== wantLabel) F(`${dir}work: tile ${c.tile} data-pt-label ${a[2]} (want ${wantLabel})`);
    const cap = c.fig.kind === "capture";
    if (cap !== new RegExp(`<img data-slab="${c.slug}"`).test(m[2])) F(`${dir}work: tile ${c.tile} ${cap ? "has no" : "has a"} <img data-slab>`);
    if (!cap && !new RegExp(`data-slab-words="${c.slug}"`).test(m[2])) F(`${dir}work: tile ${c.tile} without its key words`);
    if (!hasCase(c)) { if (existsSync(join(BUILT, dir + "case-" + c.slug + ".html"))) F(`${dir}case-${c.slug}.html: a work with a page of its own has a case page`); continue; }
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
  let at = CASE_PAGES[0].slug;
  for (let k = 0; k < CASE_PAGES.length; k++) {
    seen.add(at);
    const m = /<a class="cs-more-a cs-next" href="case-([a-z0-9-]+)\.html"/.exec(caseOf(at) || "");
    const want = nextCase(RESOLVED, RESOLVED.find((c) => c.slug === at) || CASE_PAGES[0]).slug;
    if (!m) { F(`${dir}case-${at}: no next link`); break; }
    if (m[1] !== want) F(`${dir}case-${at}: next is ${m[1]} (want ${want})`);
    at = m[1];
  }
  if (seen.size !== CASE_PAGES.length || at !== CASE_PAGES[0].slug) F(`${dir}next links: not one cycle`);
  // every case lists every work in gallery order, and so does the 404
  const names = RESOLVED.map((c) => ea(c.label)).join(" | ");
  for (const c of CASE_PAGES) {
    const got = [...(caseOf(c.slug) || "").matchAll(/<span class="t-d2 cs-more-t">([^<]*)<\/span>/g)].map((m) => m[1]).join(" | ");
    if (got !== names) F(`${dir}case-${c.slug}: More work lists "${got}"`);
  }
  const nf = /<h3 class="t-label nf-works">[\s\S]*?<\/ol>/.exec(built[dir + "404.html"] || "");
  const nfGot = nf ? [...nf[0].matchAll(/<span class="t-d2 ix-t">([^<]*)<\/span>/g)].map((m) => m[1]).join(" | ") : "";
  if (nfGot !== names) F(`${dir}404: its works are "${nfGot}"`);
  /* the reference close: Work's (the home has none since wave 7) */
  const dawn = (built[dir + "work.html"] || "").match(/<footer class="dawn"[\s\S]*?<\/footer>/);
  for (const p of PAGES.filter((x) => x.lang === lang)) {
    const h = built[p.out] || "";
    if (count(h, /<h1[\s>]/g) !== 1) F(p.out + ": " + count(h, /<h1[\s>]/g) + " h1");
    if (!new RegExp(`<html [^>]*data-ground="${groundOf(p.key)}"`).test(h)) F(p.out + ": html[data-ground] is not " + groundOf(p.key));
    if (WATER.test(h)) F(p.out + ": something of the old site is back (" + WATER.exec(h)[0] + ")");
    const close = h.match(/<footer class="dawn"[\s\S]*?<\/footer>/g) || [];
    if (p.key === "contact" || p.key === "home") {
      // Contact is the morning itself and the home ends with Contact's part: no dawn close, Contact's legal line after the main
      if (close.length) F(p.out + ": " + (p.key === "home" ? "the home" : "the Contact page") + " has a dawn close");
      if (count(h, /<section class="sc ct" id="contact" data-stage="contact" data-dawn /g) !== 1) F(p.out + ": Contact's morning is not one section.ct[data-dawn]");
      if (count(h, /<footer class="legal legal-page" data-dawn>/g) !== 1 || !/<\/main>\n<footer class="legal legal-page" data-dawn>/.test(h)) F(p.out + ": Contact's legal line, [data-dawn], does not follow the main");
      if (count(h, /\sdata-dawn[\s>]/g) !== 2) F(p.out + ": " + count(h, /\sdata-dawn[\s>]/g) + " [data-dawn] grounds (want 2)");
    }
    else if (close.length !== 1) F(p.out + ": " + close.length + " dawn closes (want 1)");
    else if (dawn && p.key !== "404" && close[0] !== dawn[0]) F(p.out + ": the dawn close differs from Work's");
    else if (dawn && p.key === "404") {
      const LL = /<p class="legal-line">[\s\S]*?<\/p>/;
      const own = (close[0].match(LL) || [""])[0], cover = (dawn[0].match(LL) || [""])[0];
      if (!own || own === cover) F(p.out + ": the 404's close does not print its own engine line");
      if (close[0].replace(LL, "") !== dawn[0].replace(LL, "")) F(p.out + ": the 404's close differs from Work's beyond its engine line");
    }
    for (const m of h.matchAll(/<section class="sc[ "][^>]*data-stage="([a-z]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
      const name = m[1], body = m[2], st = /--steps:(\d+)/.exec(m[0]);
      if (count(body, new RegExp(`<div class="sc-view" data-stage-anchor="${name}" aria-hidden="true"></div>`, "g")) !== 1) F(`${p.out}: scene ${name} without its one empty view`);
      const blocks = count(body, /class="sc-step[ "]/g);
      if (st && +st[1] !== blocks) F(`${p.out}: scene ${name} says --steps:${st[1]} and holds ${blocks} blocks`);
    }
  }
  for (const [id, keys] of Object.entries(CHAPTERS)) {
    const on = PAGES.filter((x) => x.lang === lang && new RegExp('<section [^>]*id="' + id + '"').test(built[x.out] || "")).map((x) => x.key).sort().join(" ");
    if (on !== [...keys].sort().join(" ")) F(`${dir}section #${id} is on "${on}" (want "${[...keys].sort().join(" ")}")`);
  }
  // 7 · THE HOME (wave 7, as assemble.mjs): the hero and Now, then every part's own scenes in the menu's order, each
  //     once; nothing of the cover's index; each part a section.part[data-part] named as its page and holding its page's
  //     own markup (the page's main through asPart; a link's direction may differ); it ends with Contact's part
  const home = built[dir + "index.html"] || "";
  const scenesOf = (h) => [...h.matchAll(/<section class="sc[ "][^>]*data-stage="([a-z]+)"/g)].map((m) => m[1]);
  const want = ["hero", "now", ...HOME.flatMap((p) => scenesOf(built[dir + ISSUE[p.key].file] || ""))].join(" ");
  const got = [...home.matchAll(/\sdata-stage="([a-z]+)"/g)].map((m) => m[1]).join(" ");
  if (got !== want) F(`${dir}index.html: its scenes are "${got}" (want "${want}")`);
  if (/\sid="index"|\sdata-stage-cue=|class="ix-/.test(home)) F(`${dir}index.html: something of the cover's index is back`);
  const parts = [...home.matchAll(/<section class="part" data-part="([a-z]+)" aria-label="([^"]*)">\n([\s\S]*?\n)<\/section>\n/g)];
  if (parts.map((m) => m[1]).join(" ") !== HOME.map((p) => p.key).join(" ")) F(`${dir}index.html: its parts are "${parts.map((m) => m[1]).join(" ")}"`);
  const norm = (s) => s.replace(/ data-back(?=[\s>])| aria-current="page"/g, "");
  for (const m of parts) {
    const P = HOME.find((x) => x.key === m[1]);
    if (!P) continue;
    if (m[2] !== ea(tx(STR[P.label], lang))) F(`${dir}index.html: the part ${m[1]} is named "${m[2]}" (want its page's name)`);
    const own = new RegExp(`<main id="main" data-part="${P.key}">\\n([\\s\\S]*?\\n)</main>\\n`).exec(built[dir + ISSUE[P.key].file] || "");
    if (!own) { F(`${dir}${ISSUE[P.key].file}: its main is not main[data-part="${P.key}"]`); continue; }
    if (norm(m[3]) !== norm(asPart(own[1]))) F(`${dir}index.html: the part ${m[1]} is not its page's own markup`);
  }
  if (!/\n<\/section>\n<\/main>\n<footer class="legal legal-page" data-dawn>/.test(home) || (parts.length && parts[parts.length - 1][1] !== "contact")) F(`${dir}index.html: the home does not end with Contact's part and its legal line`);
}
for (const [f, html] of Object.entries(built)) {
  if (/href="case\.html[#"?]/.test(html)) F(`${f}: still links case.html`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) F(`${f}: duplicate id ${[...new Set(dup)].join(", ")}`);
  // (wave 7, lane WORKS, as assemble.mjs) every link to a case page names its case and its tile on the cut's sheet
  for (const m of html.matchAll(/href="(?:[^"]*\/)?case-([a-z0-9-]+)\.html" data-pt-label="([^"]*)" data-pt-sub="([^"]*)"/g)) {
    const c = RESOLVED.find((x) => x.slug === m[1]);
    if (!c || !hasCase(c)) { F(`${f}: a link to case-${m[1]}.html, which is no case page`); continue; }
    if (m[2] !== ea(c.label) || !m[3].startsWith(c.tile + " · ")) F(`${f}: its link to case-${m[1]}.html says "${m[2]}" / "${m[3]}"`);
  }
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
console.log(fail.length ? `asserts FAILED (${fail.length})` : `asserts ok on ${BUILT}: ${PAGES.length} pages (${LANG_IDS.join(", ")}), ${RESOLVED.length} works, ${CASE_PAGES.length} with a case page, ${files} local references resolved in the build`);
process.exit(fail.length ? 1 : 0);

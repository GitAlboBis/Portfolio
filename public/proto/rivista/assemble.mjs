#!/usr/bin/env node
/* ==========================================================================
   Rivista prototype · page assembler (owner: WP-A; the case pages: cases lane, spec 20 §1.3; the two editions: IT
   lane, spec 30). Node, no dependencies.

     node assemble.mjs          builds, in English and in Italian (it/), index.html, the nine case-<slug>.html and
                                404.html; and fx.css
     node assemble.mjs --check  exits 1 if a built page or fx.css is stale, or an assert fails (writes nothing)

   THE TWO EDITIONS (spec 30). Every page is built twice from the SAME parts: English at the root, Italian in it/.
   The words come from one source, English and Italian side by side: parts/strings.mjs for what a template prints
   ({{t:id}} in a partial; UI, S404 and META for the template modules) and parts/cases.json for the nine works (each
   field a twin { en, it }). So the two editions cannot drift in structure, and --check proves it: the same elements
   on both pages, every string with its Italian, the Italian typography, no English left on an Italian page, a
   language control that leads to the same page of the other edition and back.
   Inside it/ every link between pages is the same bytes as in English (index.html#work, case-<slug>.html) and stays
   in the edition; only what is shared climbs a level (relocate(): fx.css, the scripts, icons/).
   The language control is {{LANGSWITCH}}: the current code printed, the other one a link to this page's twin
   (hreflang, lang, data-lang; fx-nav cuts to it as an S5 sheet, fx-core carries the reader's place).

   S2 chrome (the release head and the shipped payload): every page's <head> is written here ({{META}} in
   parts/head.html: title, description, robots, canonical, the hreflang pair, icons, Open Graph, Twitter, and the
   Person JSON-LD on the home), from parts/cases.json read-only. Two environment knobs, unset in the working tree:
   RV_ORIGIN, the absolute URL of the folder these pages are served from (no trailing slash), which makes canonical /
   hreflang / og:url / og:image absolute; RV_ROBOTS, the robots value at launch (default "noindex, nofollow" until the
   deploy, audit 12 B2 / m7). A release build is: RV_ORIGIN=https://<domain>/<folder> RV_ROBOTS="index, follow" node assemble.mjs
   S3: 404.html (and it/404.html) alone is written with ROOTED paths (SITE.base: the path of RV_ORIGIN, /proto/rivista/
   without it), so it renders whole when the host serves it for a missing URL at any depth. The host must still be
   told to serve it for a miss (and with status 404; it/404.html for a miss under it/); that is a deploy setting, not
   something this build can write.
   What ships is cleaned by ship() and shipCss(): no HTML comment and no inline-script comment (each script is
   compiled after the strip, and kept as written if the strip would break it), and in fx.css no comment; a
   compare variant's rule or the retired switcher's, if one came back to a source, is dropped selector by selector.

   The pages are concatenated from parts/*.html so three packages never edit
   the same HTML file. Output is a pure function of the partials, parts/strings.mjs, parts/cases.json and the capture
   files present in public/captures: two agents running it at the same time write identical bytes, so no update is lost.
   A missing partial becomes an HTML comment and the page still builds.
   {{META}}, {{HOME}}, {{RAIL}}, {{BAND}}, {{LANG}}, {{LANGSWITCH}}, {{I18N}} and {{EN}} are replaced per page (every
   occurrence, every part), then every {{t:id}}. A placeholder nobody replaced fails the build.

   Spec 20 (cases): every work has its own page, case-<slug>.html, rendered from parts/cases.json by
   parts/c-main.case.mjs. The home rail ({{RAIL}} in c-main.index.html) is rendered from the same data, so a tile
   and its case always open on the same figure. A capture whose two files (800w and 1600w) are not on disk falls
   back to the work's typographic plate, on the tile and on the case at once (logged as a fallback).

   SPEC 50 (from zero, 2026-11-10): the pages are the night studio's (head, header, cover, Work, About, Consulting,
   Obla, Contact as the dawn page, the nine cases, the 404), every page but Contact closing with the dawn close
   (c-footer.html); html[data-ground] is written here. The stylesheets are css/*.css (the CSS list below), concatenated
   into fx.css, the one stylesheet the pages link. AFTER EDITING ANY css/*.css, RUN node assemble.mjs. The asserts
   below are spec 50's: the gallery steps and their pictures, the cycle of "More work", one h1, the ground, the dawn
   close, the scene grammar (one empty view per scene, --steps = its blocks). The old notes that follow (the rail, the
   band, the S4/S5 cuts) describe the retired magazine and are kept only as history.
   ========================================================================== */
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import vm from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CAPTURES = join(ROOT, "..", "..", "captures");
const { render, renderTile, tx } = await import("./parts/c-main.case.mjs");
const { render404, S404 } = await import("./parts/c-main.404.mjs");
const { default: STR, LANGS, jsWords, READ_BY_MODULES } = await import("./parts/strings.mjs");
/* S2 fix (a11y review M1): the share cards' inputs, to tell a stale card (scripts/media/og-cards.mjs draws them) */
const OG = await import("../../../scripts/media/og-card-jobs.mjs");
const LANG_IDS = Object.keys(LANGS);
const other = (lang) => LANG_IDS.find((l) => l !== lang);

/* ------------------------------------------------------------ the cases and their media */
const CASES = JSON.parse(readFileSync(join(ROOT, "parts", "cases.json"), "utf8").replace(/^﻿/, ""));
const hasCapture = (stem) => existsSync(join(CAPTURES, stem + "-800.webp")) && existsSync(join(CAPTURES, stem + "-1600.webp"));
const fallbacks = [];
function resolveCase(c) {
  const r = JSON.parse(JSON.stringify(c));
  let held = false;
  if (r.fig.kind === "capture" && (r.fig.hold || !hasCapture(r.fig.stem))) {
    /* S2 fix: a capture on hold (fig.hold, a publish gate such as a third party's face) prints the plate, as a missing one does */
    held = !!r.fig.hold;
    fallbacks.push(held ? `${r.slug}: /captures/${r.fig.stem} is on hold (${r.fig.hold.split(":")[0]}), Fig. 01 is the typographic plate`
      : `${r.slug}: /captures/${r.fig.stem}-{800,1600}.webp not on disk, Fig. 01 is the typographic plate`);
    r.fig = Object.assign({ kind: "plate" }, r.fig.plate);
  }
  for (const ch of r.chapters) {
    if (ch.figure && !hasCapture(ch.figure.stem)) {
      fallbacks.push(`${r.slug}: /captures/${ch.figure.stem}-{800,1600}.webp not on disk, its chapter figure is left out`);
      delete ch.figure;
    }
  }
  /* "Photograph: none" prints only where none exists: a held capture exists, so its row is left out */
  r.onFile = r.onFile.filter((o) => !o.onlyPlate || (r.fig.kind === "plate" && !held));
  return r;
}
const RESOLVED = CASES.map(resolveCase);

/* ------------------------------------------------------------ S2 chrome: the head of every page */
const SITE = {
  origin: String(process.env.RV_ORIGIN || "").replace(/\/+$/, ""),
  robots: process.env.RV_ROBOTS || "noindex, nofollow",
  name: "Alberto Tuveri",
};
/* a target named from the folder of the English pages ("og/og-home.jpg", "it/case-x.html", "" for the English home),
   as a page of this language must write it: absolute under RV_ORIGIN, else relative to the page's own folder */
function from(target, lang) {
  if (SITE.origin) return SITE.origin + "/" + target;
  const dir = LANGS[lang].dir;
  if (dir && target.startsWith(dir)) return target.slice(dir.length) || "./";
  return ((dir ? "../" : "") + target) || "./";
}
/* a page's own address in an edition: the home is its folder, a case its file */
const pagePath = (lang, file) => LANGS[lang].dir + (file === "index.html" ? "" : file);
/* S3: the 404 is the one page a host serves at an address that is not its own (any missing URL, at any depth), so a
   relative path in it breaks under a nested address. Its asset and link paths are rooted at ONE base: the path of
   RV_ORIGIN when a release sets it, today's location (/proto/rivista/) otherwise. Every relative href and src and the
   head loader's module list are rooted; a fragment link (#main, #top) and an absolute URL stay as written.
   IT edition: a link between pages is rooted in its own edition (dir), what is shared at the base. */
SITE.base = SITE.origin ? new URL(SITE.origin + "/").pathname : "/proto/rivista/";
const isPage = (u) => /^(index|404|work|about|consulting|obla|contact|case-[a-z0-9-]+)\.html([?#].*)?$/.test(u);
const rooted = (html, dir = "") => html
  .replace(/(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|\/|#)([^"]+)"/gi, (m, a, u) => `${a}="${SITE.base}${u.startsWith("../") ? u.slice(3) : isPage(u) ? dir + u : u}"`)
  .replace(/'(fx-[a-z]+\.js)'/g, (m, f) => `'${SITE.base}${f}'`);
/* IT edition: a page in it/ reaches what the editions share one level up (the stylesheet, the scripts,
   icons/, the manifest). A link to a page of its own edition and a path that already climbs are left alone. */
const relocate = (html, up) => html
  .replace(/(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|\/|#|\.\.?\/)([^"]+)"/gi, (m, a, u) => (isPage(u) ? m : `${a}="${up}${u}"`))
  .replace(/'(fx-[a-z]+\.js)'/g, (m, f) => `'${up}${f}'`);
const ESCA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const ea = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ESCA[ch]);
const S = (id, lang) => tx(STR[id], lang);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
const workName = (c, lang) => c.titleLines.map((l) => tx(l, lang)).join(" ");
/* the facts: PRODUCT.md §3 identity and §9 summary (the CV), nothing else. The words: parts/strings.mjs ("meta.*") */
function homeMeta(lang) {
  return {
    title: S("meta.home.title", lang),
    desc: S("meta.home.desc", lang),
    page: "index.html",
    og: { type: "website", image: "og/" + LANGS[lang].dir + "og-home.jpg", alt: S("meta.home.ogAlt", lang) },
    ld: {
      "@context": "https://schema.org", "@type": "Person", name: "Alberto Tuveri",
      jobTitle: "Software & AI Engineer · Creative Lead",
      worksFor: { "@type": "Organization", name: "SerSan", url: "https://sersan.io" },
      alumniOf: { "@type": "CollegeOrUniversity", name: S("tl.5.org", lang) },
      email: "mailto:albertotuveri@gmail.com",
      sameAs: ["https://www.linkedin.com/in/albertotuveri", "https://github.com/GitAlboBis"],
    },
  };
}
function caseMeta(c, lang) {
  const name = workName(c, lang);
  const fig = c.fig.kind === "capture" ? tx(c.fig.alt, lang) : fill(S("meta.case.ogPlate", lang), { figure: tx(c.fig.figure, lang), line: tx(c.fig.figLine, lang) });
  return {
    title: name + " — " + SITE.name,
    desc: tx(c.lead.t, lang),
    page: "case-" + c.slug + ".html",
    og: { type: "article", image: "og/" + LANGS[lang].dir + "og-" + c.slug + ".jpg", alt: fill(S("meta.case.ogAlt", lang), { name, fig }) },
  };
}
/* rivista-story spec 20 §7: every page of the issue has its own title and description; the share card is the cover's
   until each page has its own (a recorded gap, docs/redesign/rivista-story/build/pages.md) */
function pageMeta(key, lang) {
  const P = ISSUE[key];
  return {
    title: S(P.label, lang) + " — " + SITE.name,
    desc: S("meta." + key + ".desc", lang),
    page: P.file,
    og: { type: "website", image: "og/" + LANGS[lang].dir + "og-home.jpg", alt: S("meta.home.ogAlt", lang) },
  };
}
const meta404 = (lang) => ({ title: tx(S404.over, lang) + " — " + SITE.name, desc: tx(S404.lead, lang), robots: "noindex" });
function meta(o, lang) {
  const L = [];
  L.push(`<title>${ea(o.title)}</title>`);
  L.push(`<meta name="description" content="${ea(o.desc)}">`);
  L.push(`<meta name="robots" content="${ea(o.robots || SITE.robots)}">`);
  if (o.page) {
    L.push(`<link rel="canonical" href="${ea(from(pagePath(lang, o.page), lang))}">`);
    /* the two editions of this page, and the one a reader of neither language gets (English) */
    for (const l of LANG_IDS) L.push(`<link rel="alternate" hreflang="${l}" href="${ea(from(pagePath(l, o.page), lang))}">`);
    L.push(`<link rel="alternate" hreflang="x-default" href="${ea(from(pagePath("en", o.page), lang))}">`);
  }
  L.push('<meta name="color-scheme" content="dark light">');
  L.push('<meta name="theme-color" content="#0c0e14">');
  L.push('<link rel="icon" href="icons/icon-32.png" sizes="32x32" type="image/png">');
  L.push('<link rel="icon" href="icons/icon.svg" type="image/svg+xml">');
  L.push('<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">');
  L.push('<link rel="manifest" href="site.webmanifest">');
  if (o.og) {
    L.push(`<meta property="og:type" content="${o.og.type}">`);
    L.push(`<meta property="og:site_name" content="${ea(SITE.name)}">`);
    L.push(`<meta property="og:locale" content="${LANGS[lang].locale}">`);
    L.push(`<meta property="og:locale:alternate" content="${LANGS[other(lang)].locale}">`);
    L.push(`<meta property="og:title" content="${ea(o.title)}">`);
    L.push(`<meta property="og:description" content="${ea(o.desc)}">`);
    if (SITE.origin && o.page) L.push(`<meta property="og:url" content="${ea(from(pagePath(lang, o.page), lang))}">`);
    L.push(`<meta property="og:image" content="${ea(from(o.og.image, lang))}">`);
    L.push('<meta property="og:image:type" content="image/jpeg">');
    L.push('<meta property="og:image:width" content="1200">');
    L.push('<meta property="og:image:height" content="630">');
    L.push(`<meta property="og:image:alt" content="${ea(o.og.alt)}">`);
    L.push('<meta name="twitter:card" content="summary_large_image">');
    L.push(`<meta name="twitter:title" content="${ea(o.title)}">`);
    L.push(`<meta name="twitter:description" content="${ea(o.desc)}">`);
    L.push(`<meta name="twitter:image" content="${ea(from(o.og.image, lang))}">`);
    L.push(`<meta name="twitter:image:alt" content="${ea(o.og.alt)}">`);
  }
  if (o.ld) {
    const ld = Object.assign({}, o.ld, SITE.origin ? { url: from(pagePath(lang, "index.html"), lang) } : {});
    L.push('<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, "\\u003c") + "</script>");
  }
  return L.join("\n");
}

/* ------------------------------------------------------------ IT edition: the language control, the scripts' words */
/* EN / IT, always in that order: the edition being read is printed (aria-current), the other is a link to THIS page
   in that edition. Its name and the line under it on the sheet are the destination's own (endonyms). The link's
   accessible name starts with its visible code (WCAG 2.5.3) */
function langSwitch(lang, file, dawn) {
  return LANG_IDS.map((l) => {
    const d = LANGS[l];
    if (l === lang) return `<span class="lang-now" aria-current="true"><b aria-hidden="true">${d.code}</b><span class="sr-only">${ea(d.current)}</span></span>`;
    const dir = LANGS[lang].dir, href = (dir ? "../" : "") + d.dir + file;
    return `<a class="lang-alt" href="${ea(href)}" hreflang="${l}" lang="${l}" data-lang="${l}" data-pt-label="${ea(d.name)}" data-pt-sub="${ea(d.edition)}"${dawn ? " data-pt-dawn" : ""}>${d.code}<span class="sr-only"> · ${ea(d.name)}</span></a>`;
  }).join('<span class="lang-sep" aria-hidden="true"> / </span>');
}
/* the words a script writes (FX.t in fx-core.js reads them), in the page's language */
const i18n = (lang) => '<script type="application/json" id="rv-i18n">' + JSON.stringify(jsWords(lang)).replace(/</g, "\\u003c") + "</script>";

/* ------------------------------------------------------------ S2 chrome: what ships (pure, like the rest) */
/* JS comments out of an inline script, strings, templates and regex literals kept; a block comment that held a line
   break leaves one (ASI). The result is compiled; if it does not compile the script ships as written. */
function stripJs(src) {
  let out = "", i = 0, prev = "";
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "/") { const e = src.indexOf("\n", i); i = e < 0 ? src.length : e; continue; }
    if (c === "/" && n === "*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? src.length : e + 2; if (src.slice(i, end).includes("\n")) out += "\n"; i = end; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === "\\") j++; j++; }
      out += src.slice(i, j + 1); i = j + 1; prev = "a"; continue;
    }
    if (c === "/" && (prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev))) {
      let j = i + 1, cls = false;
      while (j < src.length && src[j] !== "\n") { if (src[j] === "\\") { j += 2; continue; } if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false; else if (src[j] === "/" && !cls) break; j++; }
      while (j + 1 < src.length && /[a-z]/i.test(src[j + 1])) j++;
      out += src.slice(i, j + 1); i = j + 1; prev = "a"; continue;
    }
    if (!/\s/.test(c)) prev = /[\w$)\]]/.test(c) ? "a" : c;
    out += c; i++;
  }
  return out.replace(/[ \t]+$/gm, "").replace(/\n{2,}/g, "\n");
}
function shipScript(tag) {
  const m = /^(<script\b[^>]*>)([\s\S]*)(<\/script>)$/i.exec(tag);
  /* data, not a program: the JSON-LD and the scripts' words (#rv-i18n) ship as written */
  if (!m || /type="application\/(ld\+)?json"/.test(m[1]) || !m[2].trim()) return tag;
  const js = stripJs(m[2]);
  try { new vm.Script(js); } catch (e) { console.warn("[assemble] an inline script did not compile after the comment strip; it ships as written"); return tag; }
  return m[1] + (js.startsWith("\n") ? "" : "\n") + js + (js.endsWith("\n") ? "" : "\n") + m[3];
}
function ship(html) {
  const seg = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  let out = seg.map((p, i) => {
    if (i % 2) return /^<script/i.test(p) ? shipScript(p) : p;
    return p.replace(/^[ \t]*<!--[\s\S]*?-->[ \t]*\n/gm, "").replace(/<!--[\s\S]*?-->/g, "");
  }).join("");
  return out.replace(/^[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}
/* fx.css: comments out; the compare variants' rules (V2 / V3) and the retired switcher's out, selector by selector
   (a list keeps its other selectors); @media / @supports are walked, other at-rules kept whole */
const CSS_DROP = /\[data-variant="[23]"\]|\.fx-nochrome\b|\[data-switcher\]|(^|[\s>+~])\.switcher\b/;
function cssComments(css) {
  let out = "", i = 0, q = null;
  while (i < css.length) {
    const c = css[i];
    if (q) { out += c; if (c === "\\") { out += css[i + 1] || ""; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'") { q = c; out += c; i++; continue; }
    if (c === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e < 0 ? css.length : e + 2; continue; }
    out += c; i++;
  }
  return out;
}
function scanTo(src, i, stops) {
  let q = null, par = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "(") par++; else if (c === ")") par--;
    else if (par === 0 && stops.includes(c)) return i;
  }
  return src.length;
}
function closeOf(src, open) {
  let q = null, depth = 1;
  for (let k = open + 1; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === "\\") { k++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "{") depth++; else if (c === "}" && !--depth) return k;
  }
  return src.length;
}
function splitSel(p) {
  const out = []; let par = 0, br = 0, from = 0;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "(") par++; else if (c === ")") par--; else if (c === "[") br++; else if (c === "]") br--;
    else if (c === "," && !par && !br) { out.push(p.slice(from, i)); from = i + 1; }
  }
  out.push(p.slice(from));
  return out.map((x) => x.trim()).filter(Boolean);
}
function cssWalk(src) {
  let out = "", i = 0;
  while (i < src.length) {
    const j = scanTo(src, i, "{;}");
    if (j >= src.length) { if (src.slice(i).trim()) out += "\n" + src.slice(i).trim(); break; }
    if (src[j] !== "{") { if (src.slice(i, j).trim()) out += "\n" + src.slice(i, j + 1).trim(); i = j + 1; continue; }
    const k = closeOf(src, j), pre = src.slice(i, j).trim(), body = src.slice(j + 1, k);
    if (/^@(media|supports|layer|container)\b/i.test(pre)) { const inner = cssWalk(body); if (inner.trim()) out += "\n" + pre + " {" + inner + "\n}"; }
    else if (pre.startsWith("@")) out += "\n" + pre + " {" + body + "}";
    else { const sel = splitSel(pre).filter((x) => !CSS_DROP.test(x)); if (sel.length) out += "\n" + sel.join(",\n") + " {" + body + "}"; }
    i = k + 1;
  }
  return out;
}
function shipCss(css) {
  return cssWalk(cssComments(css)).replace(/^[ \t]+$/gm, "").replace(/\n{2,}/g, "\n").replace(/^\n/, "") + "\n";
}

/* ------------------------------------------------------------ spec 50: the pages */
/* the pages, in their order (a cut to an earlier page is data-back). label: the strings.mjs id of the page's name,
   printed on the cut's sheet; n: its chapter index (spec 50 §4: 01 Work … 05 Contact), the sheet's line; dawn: the
   page is the morning (its ground, and the dawn sheet of the cut that leads to it) */
const ISSUE = {
  home: { file: "index.html", order: 0, label: "cut.index", sub: "Alberto Tuveri" },
  work: { file: "work.html", order: 1, label: "sec.work", n: "01", part: "c-main.work.html" },
  about: { file: "about.html", order: 2, label: "sec.about", n: "02", part: "c-main.about.html" },
  consult: { file: "consulting.html", order: 3, label: "sec.consult", n: "03", part: "c-main.consult.html" },
  obla: { file: "obla.html", order: 4, label: "sec.obla", n: "04", part: "c-main.obla.html" },
  contact: { file: "contact.html", order: 5, label: "sec.contact", n: "05", part: "c-main.contact.html", dawn: true },
};
/* a section that is not the first of its page: its name (the menu and the old addresses reach it by an anchor) */
const ANCHOR = {};   // e.g. { evidence: "sec.evidence" } with that string added: none is linked today
/* each section lives on exactly one page (asserted) */
const CHAPTERS = ["now", "index", "work", "evidence", "stack", "path", "consult", "obla", "contact"];
const orderOf = (k) => (k === "case" ? 1.5 : k === "404" ? -1 : ISSUE[k].order);
/* LINK placeholders (page, or page#anchor), written for the page that prints them: the href, the direction of the cut,
   the destination's name and line on the sheet, the dawn sheet for Contact, aria-current on the page being read */
function link(here, spec, where) {
  const [to, hash] = spec.split("#"), P = ISSUE[to];
  if (!P || (hash && !ANCHOR[hash])) { broken.push(where + ": the LINK " + spec + " names no page"); return ""; }
  const label = hash ? "{{t:" + ANCHOR[hash] + "}}" : "{{t:" + P.label + "}}";
  const sub = hash ? (P.n ? P.n + " · " : "") + "{{t:" + P.label + "}}" : P.n || P.sub;
  const dir = orderOf(to) < orderOf(here) ? " data-back" : "";
  return 'href="' + P.file + (hash ? "#" + hash : "") + '"' + dir + ' data-pt-label="' + label + '" data-pt-sub="' + sub + '"'
    + (P.dawn ? " data-pt-dawn" : "") + (here === to && !hash ? ' aria-current="page"' : "");
}
/* the root element's page attributes (read by the head script, fx-core FX.page, the stylesheets and the stage) */
function rootAttrs(key) {
  if (key === "home") return ' data-home data-page="home"';
  if (key === "case") return ' data-page="case"';
  if (key === "404") return ' data-page="404" data-nogl';
  return ' data-page="' + key + '"';
}
const groundOf = (key) => (ISSUE[key] && ISSUE[key].dawn ? "dawn" : "night");

/* ------------------------------------------------------------ the pages of one edition */
function pagesOf(lang) {
  const dir = LANGS[lang].dir, up = dir ? "../" : "";
  const RAIL = RESOLVED.map((c) => renderTile(c, { lang })).join("");
  /* what every page of this edition shares; LANGSWITCH is per page (it names the page's twin) */
  const common = (file, key, o) => Object.assign({
    LANG: lang,
    GROUND: groundOf(key),
    EN: lang === "en" ? "" : ' lang="en"',          // an element that is English on every edition (a role, a title)
    I18N: key === "404" ? "" : "\n" + i18n(lang),   // the scripts' words (the stage's instrument line)
    LANGSWITCH: langSwitch(lang, file, !!(ISSUE[key] && ISSUE[key].dawn)),
    HOME: rootAttrs(key),
    BRAND: key === "home" ? 'href="#top"' : 'href="index.html" data-back data-pt-label="{{t:cut.index}}" data-pt-sub="Alberto Tuveri"',
  }, o);
  /* every page closes at dawn (c-footer.html); Contact is the morning already and keeps only its legal line */
  /* the 404 has no stage: its close is the same but for its own engine line (c-footer.404.html, asserted) */
  const shell = (main, key) => ["head.html", '<body id="top">', "a-header.html", ...main, key === "contact" ? "c-footer.contact.html" : key === "404" ? "c-footer.404.html" : "c-footer.html", "a-overlays.html", "</body>\n</html>"];
  const place = dir ? (html) => relocate(html, up) : null;
  return [
    {
      out: dir + "index.html", lang, file: "index.html", key: "home",
      vars: common("index.html", "home", { META: meta(homeMeta(lang), lang) }),
      post: place,
      parts: shell(['<main id="main">', "b-hero.html", "c-main.index.html", "</main>"], "home"),
    },
    ...Object.keys(ISSUE).filter((k) => k !== "home").map((key) => ({
      out: dir + ISSUE[key].file, lang, file: ISSUE[key].file, key,
      vars: common(ISSUE[key].file, key, { META: meta(pageMeta(key, lang), lang), RAIL }),
      post: place,
      parts: shell(['<main id="main">', ISSUE[key].part, "</main>"], key),
    })),
    ...RESOLVED.map((c, i) => ({
      out: dir + "case-" + c.slug + ".html", lang, file: "case-" + c.slug + ".html", key: "case",
      slug: c.slug,
      vars: common("case-" + c.slug + ".html", "case", { META: meta(caseMeta(c, lang), lang) }),
      post: place,
      parts: shell([`<main id="main" data-case="${c.slug}" data-tile="${c.tile}">`, { render: () => render(c, { next: RESOLVED[(i + 1) % RESOLVED.length], all: RESOLVED, lang }) }, "</main>"], "case"),
    })),
    /* the 404: no stage (html[data-nogl]: the head script never loads the engine); rooted paths (see SITE.base) */
    {
      out: dir + "404.html", lang, file: "404.html", key: "404",
      vars: common("404.html", "404", { META: meta(meta404(lang), lang) }),
      post: (html) => rooted(html, dir),
      parts: shell(['<main id="main" data-page="404">', { render: () => render404(RESOLVED, { tx, lang }) }, "</main>"], "404"),
    },
  ];
}
const PAGES = [...pagesOf("en"), ...LANG_IDS.filter((l) => l !== "en").flatMap(pagesOf)];

/* the one stylesheet (spec 50 §7): fx.css is concatenated from css/*.css in this cascade order. The system's files
   first (tokens, base, type, chrome, the scene grammar, the shared blocks, the dawn, the case, the cuts), then one file
   per page for the page lanes (wave 2), then print. AFTER EDITING A css/*.css, RUN node assemble.mjs. */
const CSS = { out: "fx.css", parts: ["fonts", "tokens", "base", "type", "chrome", "scene", "blocks", "dawn", "case", "cuts", "motion",
  "page-cover", "page-work", "page-about", "page-night", "page-contact", "print"].map((f) => "css/" + f + ".css") };

const missing = [];
const broken = [];               // a placeholder nobody replaced, a string id nobody wrote: the build fails
const printed = new Set();       // every {{t:id}} a partial printed

function piece(entry, page) {
  if (entry && typeof entry === "object" && typeof entry.render === "function") {
    let s = entry.render();
    if (!s.endsWith("\n")) s += "\n";
    return s;
  }
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

/* STORY ROUND (spec 10-story-spec.md §4): the head's module list names fx-stage.js (the stage host, written by the
   HOST lane). Until that file is on disk the built pages leave it out, so no page asks for a 404 and the R4 assert
   (every script is a file) holds; once it lands, --check reports every page stale and a build lists it. */
const STAGE_PENDING = !existsSync(join(ROOT, "fx-stage.js"));
if (STAGE_PENDING) fallbacks.push("fx-stage.js is not on disk yet: the pages are built without it in the head's module list");

function build(page) {
  let html = page.parts.map((p) => piece(p, page.out)).join("");
  if (STAGE_PENDING) html = html.replace(",'fx-stage.js'", "");
  for (const [key, value] of Object.entries(page.vars)) html = html.split(`{{${key}}}`).join(value);
  html = html.replace(/\{\{LINK:([a-z]+(?:#[a-z0-9-]+)?)\}\}/g, (m, spec) => link(page.key, spec, page.out));
  /* the words: {{t:id}} is the entry of parts/strings.mjs in this page's language, escaped (markup only where the
     entry says html) */
  html = html.replace(/\{\{t:([a-z0-9.-]+)\}\}/gi, (m, id) => {
    const s = STR[id];
    if (!s) { broken.push(`${page.out}: {{t:${id}}} is not in parts/strings.mjs`); return m; }
    printed.add(id);
    return s.html ? tx(s, page.lang) : ea(tx(s, page.lang));
  });
  if (page.post) html = page.post(html);
  const left = html.match(/\{\{[A-Za-z_:.#0-9-]+\}\}/g);
  if (left) broken.push(`${page.out}: placeholder left in the page: ${[...new Set(left)].join(", ")}`);
  return ship(html);
}

function buildCss() {
  let css = "";
  for (const f of CSS.parts) {
    const file = join(ROOT, f);
    if (!existsSync(file)) { missing.push(`${CSS.out}: ${f}`); css += `\n/* assemble: missing stylesheet ${f} */\n`; continue; }
    let s = readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    if (/@import\b|@charset\b/.test(s)) console.warn(`[assemble] ${f}: @import / @charset only work at the top of a stylesheet; they break inside ${CSS.out}`);
    if (!s.endsWith("\n")) s += "\n";
    css += `\n/* ==================== ${f} ==================== */\n` + s;
  }
  return "/* fx.css, generated by assemble.mjs from " + CSS.parts.join(", ") + " */\n" + shipCss(css);
}

/* ------------------------------------------------------------ structural asserts (spec 50), per edition */
/* nothing of the water and nothing of the magazine's machinery may come back */
const WATER = /data-gl-host|'fx-water\.js'|hr-poster|\sdata-pre[\s>]|fx-plate-v\d|data-rail\b|data-band\b|class="ornament/;
function asserts(built) {
  const fail = [];
  const F = (m) => fail.push(m);
  const count = (s, re) => (s.match(re) || []).length;
  for (const lang of LANG_IDS) {
    const dir = LANGS[lang].dir;
    const work = built[dir + "work.html"] || "";
    const caseOf = (slug) => built[dir + "case-" + slug + ".html"];
    // 1 · the gallery: one step per work, in order, its link to its own case under its own name; a capture work holds
    //     its picture as <img data-slab="SLUG">, a work without one its key words ([data-slab-words="SLUG"])
    for (const c of RESOLVED) {
      const m = new RegExp(`<li class="sc-step wk" data-stage-step="(\\d+)" data-tile-id="${c.tile}">([\\s\\S]*?)</li>\\n`).exec(work);
      if (!m) { F(`${dir}work: no gallery step for ${c.tile}`); continue; }
      if (+m[1] !== +c.tile) F(`${dir}work: step ${m[1]} for tile ${c.tile}`);
      const a = /<a class="q" href="([^"]+)" data-pt-label="([^"]*)"/.exec(m[2]);
      if (!a || a[1] !== "case-" + c.slug + ".html") F(`${dir}work: tile ${c.tile} links ${a && a[1]} (want case-${c.slug}.html)`);
      else if (a[2] !== c.label.replace(/&/g, "&amp;")) F(`${dir}work: tile ${c.tile} data-pt-label ${a[2]} (want ${c.label})`);
      const cap = c.fig.kind === "capture";
      if (cap !== new RegExp(`<img data-slab="${c.slug}"`).test(m[2])) F(`${dir}work: tile ${c.tile} ${cap ? "has no" : "has a"} <img data-slab> but its case is a ${c.fig.kind}`);
      if (!cap && !new RegExp(`data-slab-words="${c.slug}"`).test(m[2])) F(`${dir}work: tile ${c.tile} without its key words`);
      // the case opens on that same plate: its opener is the scene "case" (two blocks, the h1 in the first), and its
      // picture is the gallery step's slab (the same capture as <img data-slab="SLUG"> in a [data-case-hero] figure,
      // or the same key words as [data-slab-words="SLUG"]), printed as the plain picture outside scene mode
      const page = caseOf(c.slug) || "";
      if (cap !== /\sdata-case-hero[\s>]/.test(page)) F(`${dir}case-${c.slug}: its picture is not its gallery step's`);
      const op = /<section class="sc sc-left cs-sc" data-stage="case" style="--steps:2"[^>]*>([\s\S]*?)<\/section>/.exec(page);
      if (!op) F(`${dir}case-${c.slug}: its opener is not the scene "case"`);
      else {
        if (!/<div class="sc-step cs-hero" data-stage-step="1">[\s\S]*<h1 /.test(op[1])) F(`${dir}case-${c.slug}: the h1 is not in the opener's first block`);
        const slab = cap ? new RegExp(`<figure class="cs-pic[^"]*" data-case-hero>\\s*<img data-slab="${c.slug}" data-stage-poster `) : new RegExp(`data-slab-words="${c.slug}" data-stage-poster`);
        if (!slab.test(op[1])) F(`${dir}case-${c.slug}: the opener's plate is not its gallery step's (${cap ? "img data-slab" : "data-slab-words"})`);
      }
      if (!new RegExp(`<main id="main" data-case="${c.slug}"`).test(page)) F(`${dir}case-${c.slug}: main[data-case] (the chapters' mist) is missing`);
      // (lane CASES) every chapter names its type, in the data's order: the stage stands a figure of light per type
      // beside it (stage/scenes/case/figures.js reads section[data-ch])
      const kinds = [...page.matchAll(/<section id="c\d+" data-ch="([a-z]+)" /g)].map((m) => m[1]).join(" ");
      if (kinds !== c.chapters.map((ch) => ch.type).join(" ")) F(`${dir}case-${c.slug}: its chapters' data-ch are "${kinds}" (want "${c.chapters.map((ch) => ch.type).join(" ")}")`);
    }
    // 2 · "More work": the next links are one cycle of nine, in gallery order
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
    if (seen.size !== RESOLVED.length || at !== RESOLVED[0].slug) F(`${dir}next links: not one cycle of ${RESOLVED.length} (visited ${seen.size}, ended on ${at})`);
    const dawn = (built[dir + "index.html"] || "").match(/<footer class="dawn"[\s\S]*?<\/footer>/);
    for (const p of PAGES.filter((x) => x.lang === lang)) {
      const h = built[p.out] || "";
      // 3 · one h1; the ground written by the build; no water, no magazine
      if (count(h, /<h1[\s>]/g) !== 1) F(p.out + ": " + count(h, /<h1[\s>]/g) + " h1");
      if (!new RegExp(`<html [^>]*data-ground="${groundOf(p.key)}"`).test(h)) F(p.out + ": html[data-ground] is not " + groundOf(p.key));
      if (WATER.test(h)) F(p.out + ": something of the old site is back (" + WATER.exec(h)[0] + ")");
      // 4 · every page but Contact closes at dawn, with the same bytes; Contact is the morning itself
      const close = h.match(/<footer class="dawn"[\s\S]*?<\/footer>/g) || [];
      if (p.key === "contact") { if (close.length) F(p.out + ": the Contact page has a dawn close"); if (count(h, /\sdata-dawn[\s>]/g) !== 1) F(p.out + ": the Contact page is not [data-dawn]"); }
      else if (close.length !== 1) F(p.out + ": " + close.length + " dawn closes (want 1)");
      else if (dawn && p.key !== "404" && close[0] !== dawn[0]) F(p.out + ": the dawn close differs from the cover's");
      else if (dawn && p.key === "404") {
        // the one exception: the 404 draws nothing live, so its engine line is its own; the rest is the cover's close
        const LL = /<p class="legal-line">[\s\S]*?<\/p>/;
        const own = (close[0].match(LL) || [""])[0], cover = (dawn[0].match(LL) || [""])[0];
        if (!own || own === cover) F(p.out + ": the 404's close does not print its own engine line");
        if (close[0].replace(LL, "") !== dawn[0].replace(LL, "")) F(p.out + ": the 404's close differs from the cover's beyond its engine line");
      }
      // 5 · the scene grammar (spec 50 §3): each scene has its one empty view, named as the scene; --steps counts its blocks
      for (const m of h.matchAll(/<section class="sc[ "][^>]*data-stage="([a-z]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
        const name = m[1], body = m[2], st = /--steps:(\d+)/.exec(m[0]);
        if (count(body, new RegExp(`<div class="sc-view" data-stage-anchor="${name}" aria-hidden="true"></div>`, "g")) !== 1) F(`${p.out}: scene ${name} without its one empty view`);
        const blocks = count(body, /class="sc-step[ "]/g);
        if (st && +st[1] !== blocks) F(`${p.out}: scene ${name} says --steps:${st[1]} and holds ${blocks} blocks`);
      }
    }
    for (const id of CHAPTERS) {
      const on = PAGES.filter((x) => x.lang === lang && new RegExp('<section [^>]*id="' + id + '"').test(built[x.out] || "")).map((x) => x.out);
      if (on.length !== 1) F(dir + "section #" + id + " is on " + on.length + " pages (" + on.join(", ") + "): a section lives on exactly one page");
    }
  }
  for (const [f, html] of Object.entries(built)) {
    if (!/\.html$/.test(f)) continue;
    if (/href="case\.html[#"?]/.test(html)) F(`${f}: still links case.html (the old stub is gone)`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) F(`${f}: duplicate id ${[...new Set(dup)].join(", ")}`);
  }
  // 6 · every share card was drawn from its current inputs (words, figure, picture bytes)
  const man = existsSync(OG.MANIFEST) ? JSON.parse(readFileSync(OG.MANIFEST, "utf8")) : {};
  for (const j of OG.ogJobs()) {
    if (man[j.file] !== OG.ogHash(j)) F(`og/${j.file} is stale or unrecorded: node scripts/media/og-cards.mjs ${j.file.replace(/og-|\.jpg$/g, "")}`);
  }
  return fail;
}

/* ------------------------------------------------------------ the two editions (spec 30 §2.3) */
/* what a reader of the page gets, as text: nodes and the attributes that are read or shown. An element written in
   English on purpose (lang="en"), a quotation in « » and the scripts are left out */
function readText(html) {
  let h = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
  h = h.replace(/<([a-z0-9]+)\b[^>]*\slang="en"[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const bits = [];
  for (const m of h.matchAll(/\s(?:alt|aria-label|title|content|data-pt-label|data-pt-sub|data-nv-copied|data-nv-failed|data-nv-open|data-nv-close|data-folio|data-rh)="([^"]*)"/gi)) bits.push(m[1]);
  bits.push(h.replace(/<[^>]+>/g, " "));
  return bits.join(" \n ").replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/«[^»]*»/g, " ");
}
/* words no Italian sentence has; a name that carries one is listed */
const EN_WORD = /\b(the|and|of|with|from|for|by|is|are|was|were|this|that|its|their|which|your|you|not|has|have|into|only)\b/i;
const EN_NAMES = /Gang-of-Four/g;
/* every element of a page as "tag.class#id", sorted: the two editions of a page must hold the same ones */
const NOWRAP = /<span style="white-space:nowrap">([\s\S]*?)<\/span>/g;   // typography, like a no-break space: each language's own
const skeleton = (html) => [...html.replace(NOWRAP, "$1").matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)].map((m) => {
  const cls = /\sclass="([^"]*)"/.exec(m[2]), id = /\sid="([^"]*)"/.exec(m[2]);
  return m[1].toLowerCase() + (cls ? "." + cls[1] : "") + (id ? "#" + id[1] : "");
}).sort();
const tagsOf = (s) => (s.match(/<[^>]+>/g) || []).join("");
const shapeOf = (s) => tagsOf(s.replace(NOWRAP, "$1"));
const HTML_OK = /^(<em>|<\/em>|<span style="white-space:nowrap">|<\/span>)*$/;
/* Italian typography (spec 30 §3.3) on one Italian value */
function italian(s, where, F) {
  const t = String(s).replace(/<[^>]+>/g, "");
  if (/'/.test(t)) F(`${where}: a straight apostrophe (write ’): ${t}`);
  if (/["“”]/.test(t)) F(`${where}: straight or English quotes (write « »): ${t}`);
  for (const m of t.matchAll(/\d+(?:\.\d+)+/g)) if (!/^\d{1,3}(\.\d{3})+$/.test(m[0])) F(`${where}: a decimal point (write the comma): ${m[0]} in ${t}`);
  if (/\d (s|ms)(?![a-zà-ù])/i.test(t)) F(`${where}: a plain space between a number and its unit (write \\u00a0): ${t}`);
  if (/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}/.test(t)) F(`${where}: an English month: ${t}`);
  if (/\b(Gennaio|Febbraio|Marzo|Aprile|Maggio|Giugno|Luglio|Agosto|Settembre|Ottobre|Novembre|Dicembre) \d{4}/.test(t)) F(`${where}: a month with a capital: ${t}`);
  if (/\bingegnere\b/i.test(t)) F(`${where}: "ingegnere" is a protected title (spec 30 D-I8): ${t}`);
}
function editions(built) {
  const fail = [];
  const F = (m) => fail.push(m);
  for (const b of broken) F(b);
  // I-1 · every entry of strings.mjs has both languages; an Italian equal to the English says so (same: true)
  for (const [id, s] of Object.entries(STR)) {
    if (!s.en || !s.it) { F(`strings.mjs ${id}: ${!s.en ? "no English" : "no Italian"}`); continue; }
    if ((s.it === s.en) !== !!s.same) F(`strings.mjs ${id}: ${s.same ? "marked same, but the two languages differ" : "the Italian is the English (translate it, or mark it same: true)"}`);
    // I-3 · markup: only the whitelist, and the same tags in both languages
    if (s.html) { if (shapeOf(s.en) !== shapeOf(s.it)) F(`strings.mjs ${id}: the two languages carry different tags`); if (!HTML_OK.test(tagsOf(s.en)) || !HTML_OK.test(tagsOf(s.it))) F(`strings.mjs ${id}: a tag outside the whitelist`); }
    else if (/[<>]/.test(s.en + s.it)) F(`strings.mjs ${id}: markup in an entry that is not html: true`);
    italian(s.it, `strings.mjs ${id}`, F);
    // I-2 · an entry nobody prints is stale copy
    if (!printed.has(id) && !READ_BY_MODULES.some((p) => id.startsWith(p))) F(`strings.mjs ${id}: no partial prints it ({{t:${id}}})`);
  }
  // I-9 · every twin of cases.json has its Italian
  (function walk(node, path) {
    if (Array.isArray(node)) { node.forEach((x, i) => walk(x, path + "[" + i + "]")); return; }
    if (!node || typeof node !== "object") return;
    if ("en" in node) {
      if (typeof node.it !== "string" || !node.it.length) F(`cases.json ${path}: no Italian twin`);
      else italian(node.it, `cases.json ${path}`, F);
      return;
    }
    for (const [k, v] of Object.entries(node)) if (k !== "src" && k !== "note") walk(v, path + "." + k);
  })(CASES.map((c) => ({ [c.slug]: c })), "");
  const pages = PAGES.filter((p) => p.lang);
  const langOf = Object.fromEntries(pages.map((p) => [p.out, p.lang]));
  /* a URL a page writes, as a path from the pages' folder (a rooted 404 writes it under SITE.base) */
  const resolve = (pageOut, u) => {
    u = u.split(/[?#]/)[0];
    if (u.startsWith(SITE.base)) return u.slice(SITE.base.length);
    const segs = pageOut.split("/").slice(0, -1);
    for (const s of u.split("/")) { if (s === "..") segs.pop(); else if (s !== "." && s !== "") segs.push(s); }
    return segs.join("/") + (u.endsWith("/") && segs.length ? "/" : "");
  };
  for (const p of pages) {
    const html = built[p.out] || "";
    // the page says its language
    if (!new RegExp(`<html lang="${p.lang}"`).test(html)) F(`${p.out}: <html lang> is not ${p.lang}`);
    // I-8 · the language control leads to this page's twin, and the twin leads back; both in the nav and in the menu
    const twin = LANGS[other(p.lang)].dir + p.file;
    const alts = [...html.matchAll(/<a class="lang-alt" href="([^"]+)" hreflang="([a-z]+)"/g)];
    if (alts.length !== 2) F(`${p.out}: ${alts.length} language links (want 2: the header and the menu)`);
    for (const a of alts) {
      if (resolve(p.out, a[1]) !== twin) F(`${p.out}: the language link goes to ${a[1]} (want its twin ${twin})`);
      if (a[2] !== other(p.lang) || langOf[twin] !== other(p.lang)) F(`${p.out}: the language link is not the other edition`);
    }
    if (count(html, /class="lang-now" aria-current="true"/g) !== 2) F(`${p.out}: the current language is not marked twice`);
    // the hreflang pair is symmetric: each edition names both, with the same targets
    if (p.file !== "404.html" && !SITE.origin) {
      const hl = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">/g)].map((m) => [m[1], resolve(p.out, m[2]) || "./"]));
      for (const l of LANG_IDS) if (hl[l] !== (pagePath(l, p.file) || "./")) F(`${p.out}: hreflang ${l} is ${hl[l]} (want ${pagePath(l, p.file) || "./"})`);
      if (hl["x-default"] !== (pagePath("en", p.file) || "./")) F(`${p.out}: hreflang x-default is ${hl["x-default"]}`);
      const canon = /<link rel="canonical" href="([^"]+)">/.exec(html);
      if (!canon || (resolve(p.out, canon[1]) || "./") !== (pagePath(p.lang, p.file) || "./")) F(`${p.out}: the canonical is not the page itself`);
    }
    // R4 · every local file the page asks for exists (a page in it/ reaches up for what the editions share)
    for (const m of html.matchAll(/\s(?:href|src)="(?![a-z][a-z0-9+.-]*:|#)([^"]+)"/gi)) {
      if (m[1].startsWith("/") && !m[1].startsWith(SITE.base)) continue;      // /captures/…: checked with the cases' media
      const t = resolve(p.out, m[1]);
      const file = t === "" || t.endsWith("/") ? t + "index.html" : t;
      if (!(file in built) && !existsSync(join(ROOT, file))) F(`${p.out}: ${m[1]} is not a built page nor a file (${file})`);
    }
    for (const m of html.matchAll(/'((?:\.\.\/|\/[^']*\/)?fx-[a-z]+\.js)'/g)) if (!existsSync(join(ROOT, resolve(p.out, m[1])))) F(`${p.out}: script ${m[1]} is not a file`);
    if (p.lang === "en") continue;
    // the two editions of a page hold the same elements (the same parts, the same data: no branch by language)
    const en = built[p.file] || "";
    const a = skeleton(en), b = skeleton(html);
    if (a.length !== b.length || a.some((x, i) => x !== b[i])) {
      const extra = b.filter((x) => !a.includes(x)), gone = a.filter((x) => !b.includes(x));
      F(`${p.out}: not the same elements as ${p.file} (${a.length} vs ${b.length}${extra.length ? "; only here: " + extra.slice(0, 3).join(", ") : ""}${gone.length ? "; only there: " + gone.slice(0, 3).join(", ") : ""})`);
    }
    // I-6 · no English left on an Italian page
    const text = readText(html).replace(EN_NAMES, " ");
    const leak = EN_WORD.exec(text);
    if (leak) F(`${p.out}: English on an Italian page: …${text.slice(Math.max(0, leak.index - 50), leak.index + 50).replace(/\s+/g, " ")}…`);
  }
  return fail;
}
const count = (s, re) => (s.match(re) || []).length;

/* ------------------------------------------------------------ write or check */
const check = process.argv.includes("--check");
let stale = 0;
const built = {};

for (const page of [...PAGES, { out: CSS.out, css: true }]) {
  const html = page.css ? buildCss() : build(page);
  built[page.out] = html;
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
  mkdirSync(dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  writeFileSync(tmp, html);
  renameSync(tmp, target);
  console.log(`[assemble] ${page.out} written (${html.length} bytes)`);
}

for (const m of missing) console.warn(`[assemble] missing partial, replaced by a comment: ${m}`);
for (const f of fallbacks) console.log(`[assemble] fallback · ${f}`);
const bad = [...asserts(built), ...editions(built)];
for (const b of bad) console.log(`[assemble] ASSERT ${b}`);
if (!bad.length) console.log(`[assemble] structural asserts ok (${LANG_IDS.length} editions: ${LANG_IDS.join(", ")}; ${RESOLVED.length} cases, ${RESOLVED.filter((c) => c.fig.kind === "capture").length} on a capture; ${Object.keys(STR).length} strings and the cases' twins, each in both languages)`);
if ((check && stale) || bad.length) process.exit(1);

/* ==========================================================================
   web/src/lib/site.mjs · the build logic of public/proto/rivista/assemble.mjs, for Astro (lane p-astro)

   The SOURCES are not copied: the partials (parts/*.html), the strings (parts/strings.mjs), the cases
   (parts/cases.json) and the two template modules (parts/c-main.case.mjs, parts/c-main.404.mjs) are read or imported
   from public/proto/rivista/parts, where they are. What is ported here is assemble.mjs's code, with the same
   algorithms: the page table (ISSUE), the head (meta), the language control, the scripts' words, the LINK
   placeholders, the root attributes, relocate() for it/, rooted() for the 404, and what ships (ship, shipCss).
   If assemble.mjs changes one of these, change it here too: web/scripts/parity.mjs shows the drift at once.
   ========================================================================== */
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import { join, resolve } from "node:path";
import { render, renderTile, tx, hasCase, nextCase } from "../../../public/proto/rivista/parts/c-main.case.mjs";
import { render404, S404 } from "../../../public/proto/rivista/parts/c-main.404.mjs";
import STR, { LANGS, jsWords } from "../../../public/proto/rivista/parts/strings.mjs";
/* (wave 7, lane HOME) the home as one continuous scroll, composed in one place for both builds */
import { homeMain, partMain } from "../../../public/proto/rivista/parts/c-main.home.mjs";

/* Astro bundles this module before it runs it, so import.meta.url is not where the file is: the folders are found
   from the working directory (web/, where "astro build" runs) unless RV_DIR names the site folder */
export const RV = process.env.RV_DIR ? resolve(process.env.RV_DIR) : resolve(process.cwd(), "..", "public", "proto", "rivista");
const PARTS = join(RV, "parts");
const CAPTURES = join(RV, "..", "..", "captures");
export const LANG_IDS = Object.keys(LANGS);
const other = (lang) => LANG_IDS.find((l) => l !== lang);
export { tx, LANGS };

/* ------------------------------------------------------------ the cases and their media (assemble.mjs, as is) */
export const CASES = JSON.parse(readFileSync(join(PARTS, "cases.json"), "utf8").replace(/^﻿/, ""));
const hasCapture = (stem) => existsSync(join(CAPTURES, stem + "-800.webp")) && existsSync(join(CAPTURES, stem + "-1600.webp"));
function resolveCase(c) {
  const r = JSON.parse(JSON.stringify(c));
  let held = false;
  if (r.fig.kind === "capture" && (r.fig.hold || !hasCapture(r.fig.stem))) {
    held = !!r.fig.hold;
    r.fig = Object.assign({ kind: "plate" }, r.fig.plate);
  }
  for (const ch of r.chapters || []) if (ch.figure && !hasCapture(ch.figure.stem)) delete ch.figure;
  if (r.onFile) r.onFile = r.onFile.filter((o) => !o.onlyPlate || (r.fig.kind === "plate" && !held));
  return r;
}
/* every work, in the gallery's order (the plates, More work, the 404's list) */
export const RESOLVED = CASES.map(resolveCase);
/* (wave 7, lane WORKS) the case pages: every work but one that is a page of the site already (Obla, "page": "obla") */
export const CASE_PAGES = RESOLVED.filter(hasCase);
export { hasCase, nextCase };

/* ------------------------------------------------------------ the head of every page */
const SITE = {
  origin: String(process.env.RV_ORIGIN || "").replace(/\/+$/, ""),
  robots: process.env.RV_ROBOTS || "noindex, nofollow",
  name: "Alberto Tuveri",
};
SITE.base = SITE.origin ? new URL(SITE.origin + "/").pathname : "/proto/rivista/";
function from(target, lang) {
  if (SITE.origin) return SITE.origin + "/" + target;
  const dir = LANGS[lang].dir;
  if (dir && target.startsWith(dir)) return target.slice(dir.length) || "./";
  return ((dir ? "../" : "") + target) || "./";
}
const pagePath = (lang, file) => LANGS[lang].dir + (file === "index.html" ? "" : file);
const isPage = (u) => /^(index|404|work|about|consulting|obla|contact|case-[a-z0-9-]+)\.html([?#].*)?$/.test(u);
const rooted = (html, dir = "") => html
  .replace(/(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|\/|#)([^"]+)"/gi, (m, a, u) => `${a}="${SITE.base}${u.startsWith("../") ? u.slice(3) : isPage(u) ? dir + u : u}"`)
  .replace(/'(fx-[a-z]+\.js)'/g, (m, f) => `'${SITE.base}${f}'`);
const relocate = (html, up) => html
  .replace(/(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|\/|#|\.\.?\/)([^"]+)"/gi, (m, a, u) => (isPage(u) ? m : `${a}="${up}${u}"`))
  .replace(/'(fx-[a-z]+\.js)'/g, (m, f) => `'${up}${f}'`);
const ESCA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const ea = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ESCA[ch]);
const S = (id, lang) => tx(STR[id], lang);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
const workName = (c, lang) => c.titleLines.map((l) => tx(l, lang)).join(" ");
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

/* ------------------------------------------------------------ the language control, the scripts' words */
function langSwitch(lang, file, dawn) {
  return LANG_IDS.map((l) => {
    const d = LANGS[l];
    if (l === lang) return `<span class="lang-now" aria-current="true"><b aria-hidden="true">${d.code}</b><span class="sr-only">${ea(d.current)}</span></span>`;
    const dir = LANGS[lang].dir, href = (dir ? "../" : "") + d.dir + file;
    return `<a class="lang-alt" href="${ea(href)}" hreflang="${l}" lang="${l}" data-lang="${l}" data-pt-label="${ea(d.name)}" data-pt-sub="${ea(d.edition)}"${dawn ? " data-pt-dawn" : ""}>${d.code}<span class="sr-only"> · ${ea(d.name)}</span></a>`;
  }).join('<span class="lang-sep" aria-hidden="true"> / </span>');
}
const i18n = (lang) => '<script type="application/json" id="rv-i18n">' + JSON.stringify(jsWords(lang)).replace(/</g, "\\u003c") + "</script>";

/* ------------------------------------------------------------ what ships (assemble.mjs, as is) */
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
  if (!m || /type="application\/(ld\+)?json"/.test(m[1]) || !m[2].trim()) return tag;
  const js = stripJs(m[2]);
  try { new vm.Script(js); } catch (e) { return tag; }
  return m[1] + (js.startsWith("\n") ? "" : "\n") + js + (js.endsWith("\n") ? "" : "\n") + m[3];
}
export function ship(html) {
  const seg = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  const out = seg.map((p, i) => {
    if (i % 2) return /^<script/i.test(p) ? shipScript(p) : p;
    return p.replace(/^[ \t]*<!--[\s\S]*?-->[ \t]*\n/gm, "").replace(/<!--[\s\S]*?-->/g, "");
  }).join("");
  return out.replace(/^[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}
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
  const out = []; let par = 0, br = 0, f = 0;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "(") par++; else if (c === ")") par--; else if (c === "[") br++; else if (c === "]") br--;
    else if (c === "," && !par && !br) { out.push(p.slice(f, i)); f = i + 1; }
  }
  out.push(p.slice(f));
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
const shipCss = (css) => cssWalk(cssComments(css)).replace(/^[ \t]+$/gm, "").replace(/\n{2,}/g, "\n").replace(/^\n/, "") + "\n";

/* the one stylesheet: css/*.css in assemble.mjs's cascade order */
export const CSS_PARTS = ["fonts", "tokens", "base", "type", "chrome", "scene", "blocks", "dawn", "case", "cuts", "motion",
  "page-cover", "page-work", "page-about", "page-night", "page-contact", "print"].map((f) => "css/" + f + ".css");
export function buildCss() {
  let css = "";
  for (const f of CSS_PARTS) {
    const file = join(RV, f);
    if (!existsSync(file)) { css += `\n/* assemble: missing stylesheet ${f} */\n`; continue; }
    let s = readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    if (!s.endsWith("\n")) s += "\n";
    css += `\n/* ==================== ${f} ==================== */\n` + s;
  }
  return "/* fx.css, generated by assemble.mjs from " + CSS_PARTS.join(", ") + " */\n" + shipCss(css);
}

/* ------------------------------------------------------------ the pages */
export const ISSUE = {
  home: { file: "index.html", order: 0, label: "cut.home", sub: "Alberto Tuveri" },
  work: { file: "work.html", order: 1, label: "sec.work", n: "01", part: "c-main.work.html" },
  about: { file: "about.html", order: 2, label: "sec.about", n: "02", part: "c-main.about.html" },
  consult: { file: "consulting.html", order: 3, label: "sec.consult", n: "03", part: "c-main.consult.html" },
  obla: { file: "obla.html", order: 4, label: "sec.obla", n: "04", part: "c-main.obla.html" },
  contact: { file: "contact.html", order: 5, label: "sec.contact", n: "05", part: "c-main.contact.html", dawn: true },
};
const ANCHOR = {};
const orderOf = (k) => (k === "case" ? 1.5 : k === "404" ? -1 : ISSUE[k].order);
function link(here, spec, where, broken) {
  const [to, hash] = spec.split("#"), P = ISSUE[to];
  if (!P || (hash && !ANCHOR[hash])) { broken.push(where + ": the LINK " + spec + " names no page"); return ""; }
  const label = hash ? "{{t:" + ANCHOR[hash] + "}}" : "{{t:" + P.label + "}}";
  const sub = hash ? (P.n ? P.n + " · " : "") + "{{t:" + P.label + "}}" : P.n || P.sub;
  const dir = orderOf(to) < orderOf(here) ? " data-back" : "";
  return 'href="' + P.file + (hash ? "#" + hash : "") + '"' + dir + ' data-pt-label="' + label + '" data-pt-sub="' + sub + '"'
    + (P.dawn ? " data-pt-dawn" : "") + (here === to && !hash ? ' aria-current="page"' : "");
}
function rootAttrs(key) {
  if (key === "home") return ' data-home data-page="home"';
  if (key === "case") return ' data-page="case"';
  if (key === "404") return ' data-page="404" data-nogl';
  return ' data-page="' + key + '"';
}
export const groundOf = (key) => (ISSUE[key] && ISSUE[key].dawn ? "dawn" : "night");

/* one page of one edition: what the route needs to render it and what the layout needs to finish it */
function pageOf(lang, key, file, extra = {}) {
  const dir = LANGS[lang].dir;
  const metaO = key === "home" ? homeMeta(lang) : key === "case" ? caseMeta(extra.case, lang) : key === "404" ? meta404(lang) : pageMeta(key, lang);
  return {
    out: dir + file, lang, file, key, slug: extra.case ? extra.case.slug : undefined, tile: extra.case ? extra.case.tile : undefined, index: extra.index,
    vars: {
      LANG: lang,
      GROUND: groundOf(key),
      EN: lang === "en" ? "" : ' lang="en"',
      I18N: key === "404" ? "" : "\n" + i18n(lang),
      LANGSWITCH: langSwitch(lang, file, !!(ISSUE[key] && ISSUE[key].dawn)),
      HOME: rootAttrs(key),
      BRAND: key === "home" ? 'href="#top"' : 'href="index.html" data-back data-pt-label="{{t:cut.home}}" data-pt-sub="Alberto Tuveri"',
      META: meta(metaO, lang),
      /* the gallery's steps, one per work: on the pages, and (wave 7) in the home's part of Work */
      ...(key !== "404" && key !== "case" ? { RAIL: RESOLVED.map((c) => renderTile(c, { lang, all: RESOLVED })).join("") } : {}),
    },
  };
}
export function pages() {
  const all = [];
  for (const lang of LANG_IDS) {
    all.push(pageOf(lang, "home", "index.html"));
    for (const key of Object.keys(ISSUE).filter((k) => k !== "home")) all.push(pageOf(lang, key, ISSUE[key].file));
    RESOLVED.forEach((c, i) => { if (hasCase(c)) all.push(pageOf(lang, "case", "case-" + c.slug + ".html", { case: c, index: i })); });
    all.push(pageOf(lang, "404", "404.html"));
  }
  return all;
}

/* ------------------------------------------------------------ the pieces the components print */
/* a partial as it is on disk, ending with a line break (a missing partial becomes a comment, as in assemble.mjs) */
export function partial(name) {
  const file = join(PARTS, name);
  if (!existsSync(file)) return `<!-- assemble: missing partial parts/${name} -->\n`;
  let s = readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  return s.endsWith("\n") ? s : s + "\n";
}
const piece = (s) => (s.endsWith("\n") ? s : s + "\n");
export const literal = (s) => s + "\n";
export const caseMain = (page) => piece(render(RESOLVED[page.index], { next: nextCase(RESOLVED, RESOLVED[page.index]), all: RESOLVED, lang: page.lang }));
/* (wave 7) the home's main: the hero, Now, then every page's part (parts/c-main.home.mjs, as assemble.mjs prints it) */
export const coverMain = () => homeMain(partial);
/* a page's main: its part, main[data-part=KEY] (the same element the home names its part with) */
export const pageMain = (key, name) => literal(partMain(key)) + partial(name) + literal("</main>");
export const notFoundMain = (page) => piece(render404(RESOLVED, { tx, lang: page.lang }));

/* the page's whole text, as the layout got it from its components: the placeholders filled exactly as assemble.mjs
   fills them (the page's vars, then the LINKs, then every {{t:id}}), then relocated (it/) or rooted (the 404), then
   shipped. A placeholder left or a string id nobody wrote fails the build. */
export function finish(html, page) {
  const broken = [];
  for (const [key, value] of Object.entries(page.vars)) html = html.split(`{{${key}}}`).join(value);
  html = html.replace(/\{\{LINK:([a-z]+(?:#[a-z0-9-]+)?)\}\}/g, (m, spec) => link(page.key, spec, page.out, broken));
  html = html.replace(/\{\{t:([a-z0-9.-]+)\}\}/gi, (m, id) => {
    const s = STR[id];
    if (!s) { broken.push(`${page.out}: {{t:${id}}} is not in parts/strings.mjs`); return m; }
    return s.html ? tx(s, page.lang) : ea(tx(s, page.lang));
  });
  const dir = LANGS[page.lang].dir;
  if (page.key === "404") html = rooted(html, dir);
  else if (dir) html = relocate(html, "../");
  const left = html.match(/\{\{[A-Za-z_:.#0-9-]+\}\}/g);
  if (left) broken.push(`${page.out}: placeholder left in the page: ${[...new Set(left)].join(", ")}`);
  if (broken.length) throw new Error("[web] " + broken.join("; "));
  return ship(html);
}

// scripts/check-claims-proto.mjs — the claims gate of the rivista prototype (spec 20 §4).
//
//   node scripts/check-claims-proto.mjs                 every built page: public/proto/rivista/index.html, case-*.html
//                                                       (and it/*.html when the Italian edition exists)
//   node scripts/check-claims-proto.mjs --selftest      the acceptance test of §4.3: three seeded errors must each fail
//   node scripts/check-claims-proto.mjs --inject <page>:<text>   (used by --selftest) prints <text> inside that page's <main>
//   node scripts/check-claims-proto.mjs --dir=<folder> the same checks on the pages of another build (e.g. web/dist/proto/rivista)
//
// Stricter than scripts/check-claims.mjs (which asks only whether a number appears anywhere in PRODUCT §3/§9): here a
// number must be in the SCOPE of the region that prints it. A case page's <main> up to the band is its work's §3 item
// plus its §9 block (cut between two anchor strings, so an edit of PRODUCT does not break the gate) plus, for a SerSan
// work, the SerSan header; a rail tile on the index is its work's scope; the next-work section of a case is the next
// work's scope (it prints the next tile's line); everything else (header, footer, band, the rest of the index) is
// global: §3 + §9. The scope table lives here, never in the data, so the data cannot widen its own scope.
//
// Checks (exit 1 on any miss):
//   1 every number in scope (digits normalised as check-claims.mjs; number words of the CV count as digits; a digit
//     glued to a letter on its left is an identifier: ES2024, v4, WebGL2, Badante24h). Whitelist, and only this: the
//     zero-padded indices 01–09 (a claim is never zero-padded). Years are NOT whitelisted on a case page.
//   2 every measured pair (from → to) matches one PRODUCT pair in scope, units and the decimal comma normalised
//   3 every number printed in a case's <main> is also in that case's cases.json entry (the template types no digit)
//   4 each plate tile prints its case's Fig. 01 figure
//   5 each bar width equals the renderer's geometry for its row (a percentage is itself, a time pair after ÷ before)
//   6 forbidden strings (PRODUCT §4, the never-print list, the company e-mail domain)
//   7 every P:n / P:a-b in cases.json points inside §3 or §9, and the cited lines hold at least one of the fact's numbers
//   8 the Italian edition (it/*.html, spec 30 §3.2): an Italian page prints exactly the numbers of its English page.
//     Checks 1–6 run on it as on any page, reading the Italian spellings: the decimal comma (1,74 s), the point of the
//     thousands (48.000), the no-break space before a unit, the number words (otto, nove, diciassette). Then the two
//     pages' numbers are compared as multisets, digits and words alike: not one added, dropped or rounded in translation
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RV = process.env.RV_DIR || join(root, "public", "proto", "rivista");
const argv = process.argv.slice(2);
/* --dir=<folder>: read the built pages (and its it/) from another folder, e.g. the Astro build's web/dist/proto/rivista
   (relative to the working directory); the data (cases.json, the case template) is still read from RV. Default: RV */
const DIR_ARG = argv.find((a) => a.startsWith("--dir="));
const PAGES_DIR = DIR_ARG ? resolve(process.cwd(), DIR_ARG.slice(6)) : RV;
if (DIR_ARG && !existsSync(PAGES_DIR)) { console.log(`no such folder of built pages: ${PAGES_DIR}`); process.exit(2); }

/* ------------------------------------------------------------ self-test (§4.3 acceptance) */
if (argv.includes("--selftest")) {
  const seeds = [["case-maintech-oma.html", "68%"], ["case-agricultural-supply-chain.html", "2024"], ["case-domus-tua.html", "21"]];
  let ok = true;
  for (const [page, text] of seeds) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--inject", page + ":" + text, "--quiet", ...(DIR_ARG ? [DIR_ARG] : [])], { encoding: "utf8" });
    const pass = r.status === 1 && r.stdout.includes(`"${text.replace("%", "")}`);
    console.log(`selftest  ${pass ? "ok  " : "FAIL"}  seeding "${text}" on ${page} → exit ${r.status}${pass ? "" : "\n" + r.stdout.split("\n").slice(-6).join("\n")}`);
    if (!pass) ok = false;
  }
  const clean = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--quiet", ...(DIR_ARG ? [DIR_ARG] : [])], { encoding: "utf8" });
  console.log(`selftest  ${clean.status === 0 ? "ok  " : "FAIL"}  the built pages as they are → exit ${clean.status}`);
  process.exit(ok && clean.status === 0 ? 0 : 1);
}
const QUIET = argv.includes("--quiet");
const inject = (() => { const i = argv.indexOf("--inject"); if (i < 0) return null; const [p, ...t] = argv[i + 1].split(":"); return { page: p, text: t.join(":") }; })();

/* ------------------------------------------------------------ PRODUCT: §3, §9, the scopes */
const product = readFileSync(join(root, "PRODUCT.md"), "utf8").replace(/\r\n?/g, "\n");
const LINES = product.split("\n");
const lineOf = (heading) => { const i = LINES.findIndex((l) => l.startsWith(heading)); if (i < 0) throw new Error("PRODUCT.md: no " + heading); return i + 1; };
const S3 = [lineOf("## 3."), lineOf("## 4.") - 1];
const S9 = [lineOf("## 9."), lineOf("## 10.") - 1];
/* story round (spec 10-story-spec.md §6.3): §10 Consulting and §11 Obla are sources of the home's night, in the global
   scope only (no case cites them: a case's src must still point inside §3 or §9) */
const S1011 = [lineOf("## 10."), LINES.length];
const linesText = (a, b) => LINES.slice(a - 1, b).join("\n");
const T3 = linesText(...S3), T9 = linesText(...S9), T1011 = linesText(...S1011);
const GLOBAL = T3 + "\n" + T9 + "\n" + T1011;
const between = (text, from, to) => {
  const a = text.indexOf(from); if (a < 0) throw new Error("PRODUCT.md §9: anchor not found: " + from);
  const b = text.indexOf(to, a + from.length); if (b < 0) throw new Error("PRODUCT.md §9: anchor not found: " + to);
  return text.slice(a, b);
};
const item3 = (n) => { const m = new RegExp("^" + n + "\\. \\*\\*[\\s\\S]*?(?=^\\d+\\. \\*\\*|^\\*\\*|^## )", "m").exec(T3); if (!m) throw new Error("PRODUCT.md §3: no item " + n); return m[0]; };
const SERSAN_HEAD = between(T9, "SerSan — AI Studio", "Work delivered at SerSan:");
const SCOPE_TABLE = {
  spherenode: [1, "SphereNode · production platform", "Maintech OMA — workshop ERP", true],
  "sphere-ai": [1, "SphereNode · production platform", "Maintech OMA — workshop ERP", true],
  "maintech-oma": [2, "Maintech OMA — workshop ERP", "--- page 2 ---", true],
  "sersan-io": [3, "sersan.io — studio website", "Domus Tua — real-estate", true],
  "domus-tua": [4, "Domus Tua — real-estate", "Brand identity & brand film", true],
  "sersan-brand": [5, "Brand identity & brand film", "ALS MCL Civitanova", true],
  badante24h: [6, "ALS MCL Civitanova", "DOIT S.r.l", false],
  "doit-voice-ai-agent": [7, "DOIT S.r.l", "Istituzione Paritaria Scuole Boccaccio Jan 2019", false],
  "agricultural-supply-chain": [8, "Agricultural Supply Chain Platform · Academic", "Personal & open-source work", false],
};
/* one cited extra per capture case: the capture date the caption prints ("captured September 2026"),
   public/captures/PROVENANCE.md (2026-09-16) */
const CAPTURE_EXTRA = { spherenode: "2026", "sersan-io": "2026" };
const scopeText = (slug) => {
  const s = SCOPE_TABLE[slug];
  if (!s) throw new Error("no scope for case " + slug + " (add it to SCOPE_TABLE)");
  return [item3(s[0]), between(T9, s[1], s[2]), s[3] ? SERSAN_HEAD : "", CAPTURE_EXTRA[slug] || ""].join("\n");
};

/* ------------------------------------------------------------ numbers (as check-claims.mjs) */
const WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, fifty: 50,
  uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  quattordici: 14, diciassette: 17, cinquanta: 50,
};
function normalise(tok) {
  let t = tok.replace(/[%$€]/g, "");
  if (/^\d{1,3}([,.]\d{3})+$/.test(t)) t = t.replace(/[,.]/g, "");
  else if (/^\d+,\d+$/.test(t)) t = t.replace(",", ".");
  return t;
}
/** every number of a text: [{ raw, n, word, index }]; a digit glued to a letter on its left is an identifier */
function numbers(text, { words = true } = {}) {
  const out = [];
  for (const m of text.matchAll(/(?<![A-Za-zÀ-ɏ])\d+(?:[.,]\d+)*/g)) {
    let raw = m[0];
    // a trailing sentence comma or period is punctuation, not a decimal ("21, 49." — "48,000" keeps its group)
    raw = raw.replace(/[.,]$/, "");
    out.push({ raw, n: normalise(raw), word: false, index: m.index });
  }
  if (words) for (const m of text.toLowerCase().matchAll(/\b([a-zà-ù]+)\b/g)) if (WORDS[m[1]] != null) out.push({ raw: m[1], n: String(WORDS[m[1]]), word: true, index: m.index });
  return out;
}
const truthOf = (text) => new Set(numbers(text).map((x) => x.n));
const TRUTH_GLOBAL = truthOf(GLOBAL);
const SCOPES = {};
const truthFor = (slug) => (slug ? (SCOPES[slug] ||= truthOf(scopeText(slug))) : TRUTH_GLOBAL);
const WHITE = (x) => !x.word && /^0[1-9]$/.test(x.raw);

/* ------------------------------------------------------------ the pages: reader-visible text, by region */
const DECODE = (s) => s.replace(/&nbsp;|&#160;|&#xa0;/gi, " ").replace(/&#8239;|&#x202f;/gi, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const ATTRS = ["alt", "aria-label", "title", "data-pt-label", "data-pt-sub"];
/** [{ text, region }] where region = { kind: "global" | "case" | "tile" | "next", slug } */
function visible(html, page) {
  html = html.replace(/<!--[\s\S]*?-->/g, " ");
  /* S2 fix (a11y review S8): what a share or a search engine shows is printed too: the head's description, the Open
     Graph and Twitter texts and the JSON-LD, in the page's own scope (a case page's head is its case's) */
  const headScope = (/<main id="main" data-case="([a-z0-9-]+)"/.exec(html) || [])[1];
  const headRegion = headScope ? { kind: "case", slug: headScope } : { kind: "global" };
  const out = [];
  for (const m of html.matchAll(/<meta\s+(?:name|property)="(description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)"\s+content="([^"]*)"/gi)) out.push({ text: DECODE(m[2]), region: headRegion, where: "<meta " + m[1] + ">" });
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) out.push({ text: m[1].replace(/\x5Cu003c/g, "<").replace(/"(@context|@type|url|email|sameAs)":\s*("[^"]*"|\[[^\]]*\])/g, ""), region: headRegion, where: "JSON-LD" });
  html = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const title = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (title) out.push({ text: DECODE(title[1]), region: { kind: "global" }, where: "<title>" });
  const body = html.slice(html.search(/<body[\s>]/i));
  const stack = []; // { tag, hidden, region }
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  let m;
  const cur = () => stack.length ? stack[stack.length - 1] : { hidden: false, region: { kind: "global" } };
  while ((m = re.exec(body))) {
    if (m[4] != null) {
      const c = cur();
      if (!c.hidden && m[4].trim()) out.push({ text: DECODE(m[4]), region: c.region, where: c.tag });
      continue;
    }
    const close = m[1] === "/", tag = m[2].toLowerCase(), attrs = m[3] || "";
    if (close) {
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
      continue;
    }
    const parent = cur();
    const at = (n) => { const a = new RegExp("\\s" + n + '="([^"]*)"').exec(attrs); return a ? DECODE(a[1]) : null; };
    const hidden = parent.hidden || at("aria-hidden") === "true";
    let region = parent.region;
    if (tag === "main" && at("data-case")) region = { kind: "case", slug: at("data-case") };
    else if (at("data-tile-id")) region = { kind: "tile", tile: at("data-tile-id") };
    else if (tag === "section" && /(^|\s)next(\s|$)/.test(at("class") || "") && region.kind === "case") region = { kind: "next", from: region.slug };
    else if (tag === "section" && at("id") === "contact") region = { kind: "global" };
    else if (tag === "a" && region.kind === "next") { const h = /case-([a-z0-9-]+)\.html/.exec(at("href") || ""); if (h) region = { kind: "case", slug: h[1], next: true }; }
    if (!hidden) for (const n of ATTRS) { const v = at(n); if (v && v.trim()) out.push({ text: v, region, where: tag + "[" + n + "]" }); }
    const selfClose = /\/\s*$/.test(attrs);
    if (!VOID.has(tag) && !selfClose) stack.push({ tag, hidden, region });
  }
  return out;
}

/* ------------------------------------------------------------ inputs */
const CASES = JSON.parse(readFileSync(join(RV, "parts", "cases.json"), "utf8"));
const byTile = Object.fromEntries(CASES.map((c) => [c.tile, c]));
const bySlug = Object.fromEntries(CASES.map((c) => [c.slug, c]));
const { barWidths } = await import(pathToFileURL(join(RV, "parts", "c-main.case.mjs")).href);
const dataNumbers = (obj) => new Set(numbers(JSON.stringify(obj, (k, v) => (k === "src" ? undefined : v))).map((x) => x.n));
const DATA = Object.fromEntries(CASES.map((c) => [c.slug, dataNumbers(c)]));

const pages = [];
const addDir = (dir, prefix) => {
  if (!existsSync(dir)) return;
  /* rivista-story spec 20: the issue's pages (work, about, consulting, obla, contact) are read like the cover */
  for (const f of readdirSync(dir).sort()) if (/^(index|404|work|about|consulting|obla|contact)\.html$/.test(f) || (/^case-[a-z0-9-]+\.html$/.test(f))) pages.push({ name: prefix + f, file: join(dir, f) });   // S2 fix: the 404 too
};
addDir(PAGES_DIR, "");
addDir(join(PAGES_DIR, "it"), "it/");

let misses = 0;
const MISS = (page, tok, ctx, scope) => { misses++; console.log(`MISS  ${page}  "${tok}"  …${ctx}…  (scope: ${scope})`); };
const ctxOf = (text, i, len) => text.slice(Math.max(0, i - 40), i + len + 40).replace(/\s+/g, " ").trim();

/* 6 · forbidden strings */
const FORBIDDEN = [/five years/i, /Selected Work 2021/i, /Lodestar/i, /<5\s?min/i, /96 commits/i, /Backend Engineer/i, /Based in Camerino/i, /\bTBD\b/i, /\bProject I{1,2}\b/, /real caustics/i, /sun glints/i, /physically accurate/i,
  /* the same, as Italian would say them, and the title the Italian page must not claim (spec 30 §3.2, D-I8) */
  /cinque anni/i, /con sede a Camerino/i, /caustiche reali/i, /riflessi del sole/i, /fisicamente accurat/i, /\bingegnere\b/i];
/* 8 · the numbers of each page, kept for the comparison of the two editions */
const PAGE_NUMBERS = {};

for (const p of pages) {
  let html = readFileSync(p.file, "utf8");
  if (inject && inject.page === p.name) html = html.replace(/(<\/main>)/, `<section class="chapter"><p>${inject.text}</p></section>\n  $1`);   // spec 50: the last thing in <main>, the case's own scope
  const vis = visible(html, p.name);
  const stats = { checked: 0, scoped: 0, white: 0 };
  /* 8 · "one" / "uno" as words are left out of the comparison: Italian writes the article (un, una) where English
     says "one platform", so the word is not a count there */
  if (!inject) PAGE_NUMBERS[p.name] = vis.flatMap((v) => numbers(v.text)).filter((x) => !(x.word && x.n === "1")).map((x) => x.n).sort();
  // 1 + 3
  for (const v of vis) {
    const r = v.region;
    let slug = null, scopeName = "global";
    if (r.kind === "case") { slug = r.slug; scopeName = r.next ? `next → ${slug}` : slug; }
    else if (r.kind === "tile") { const c = byTile[r.tile]; slug = c ? c.slug : null; scopeName = "tile " + r.tile + (c ? " " + c.slug : " (unknown)"); if (!c) MISS(p.name, "tile " + r.tile, "a tile with no case in cases.json", "—"); }
    const truth = truthFor(slug);
    for (const x of numbers(v.text)) {
      stats.checked++;
      if (WHITE(x)) { stats.white++; continue; }
      /* S2 fix: on the 404 the status code ("Error 404") is the page's name, not a claim */
      if (/(^|\/)404\.html$/.test(p.name) && x.n === "404") { stats.white++; continue; }
      if (!truth.has(x.n)) { MISS(p.name, x.raw, ctxOf(v.text, x.index, x.raw.length), scopeName); continue; }
      stats.scoped++;
      // 3 · on a case page, a number in <main> is in the case's own data (the next section: the next case's)
      if (r.kind === "case" && DATA[slug] && !DATA[slug].has(x.n)) MISS(p.name, x.raw, ctxOf(v.text, x.index, x.raw.length) + " [not in cases.json " + slug + "]", scopeName);
    }
  }
  for (const re of FORBIDDEN) {
    const text = vis.map((v) => v.text).join(" ");
    const hit = re.exec(text);
    if (hit) MISS(p.name, hit[0], ctxOf(text, hit.index, hit[0].length), "forbidden");
  }
  if (/sersan\.dev/i.test(html)) MISS(p.name, "sersan.dev", "the company e-mail domain is never published (PRODUCT §3)", "forbidden");
  // 2 · pairs as pairs (case pages: the case scope; the index ledgers: global)
  const caseSlug = (/<main id="main" data-case="([a-z0-9-]+)"/.exec(html) || [])[1] || null;
  for (const li of html.matchAll(/<li class="metric"[\s\S]*?<\/li>/g)) {
    const t = li[0];
    const from = /<span class="from">([^<]+)<\/span>/.exec(t), to = /<span class="to">([^<]+)<\/span>/.exec(t);
    if (from && to) {
      const sc = (caseSlug ? scopeText(caseSlug) : GLOBAL).replace(/(\d),(\d)/g, "$1.$2").replace(/\s+/g, " ");
      /* the page's own figures are read as PRODUCT's are: an Italian page writes 4,75 s (comma, no-break space) */
      const esc = (s) => DECODE(s).trim().replace(/(\d),(\d)/g, "$1.$2").replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
      const re = new RegExp(esc(from[1]) + "\\s*(?:→|to)\\s*" + esc(to[1]));
      if (!re.test(sc)) MISS(p.name, `${from[1]} → ${to[1]}`, "this pair is not a PRODUCT pair in scope", caseSlug || "global");
    }
    // 5 · bar geometry
    const ws = [...t.matchAll(/--w:([\d.]+)%/g)].map((x) => +x[1]);
    const row = from && to ? { from: DECODE(from[1]), to: DECODE(to[1]) } : to ? { value: DECODE(to[1]) } : null;
    if (row) {
      const want = barWidths(row);
      if (ws.length !== want.length || ws.some((w, i) => Math.abs(w - want[i]) > 0.05)) MISS(p.name, ws.join("/"), `bar widths of ${JSON.stringify(row)} (want ${want.join("/")})`, "geometry");
    }
  }
  // 4 · tile ↔ case: a plate tile prints its case's Fig. 01 figure (the rail lives on the Work page, rivista-story spec 20)
  /* spec 50: the gallery step of a work without a capture prints its key words ([data-slab-words], .wk-words-fig);
     its case prints the same figure as its picture (.cs-plate-fig) */
  if (/<li class="sc-step wk"/.test(html)) {
    for (const li of html.matchAll(/<li class="sc-step wk" data-stage-step="\d+" data-tile-id="(\d\d)">[\s\S]*?<\/li>/g)) {
      if (!/data-slab-words=/.test(li[0])) continue;
      const c = byTile[li[1]], fig = /<p class="wk-words-fig">([^<]+)<\/p>/.exec(li[0]);
      const casePage = c && pages.find((q) => q.name === p.name.replace(/[^/]*$/, "case-" + c.slug + ".html"));
      if (!c || !fig || !casePage) { MISS(p.name, "tile " + li[1], "a work's key words without a figure or a case page", "tile"); continue; }
      const ch = readFileSync(casePage.file, "utf8");
      const cf = /<p class="cs-plate-fig">([^<]+)<\/p>/.exec(ch);
      if (!cf || DECODE(cf[1]) !== DECODE(fig[1])) MISS(p.name, fig[1], `tile ${li[1]} prints "${fig[1]}", case-${c.slug} prints "${cf ? cf[1] : "no key words"}"`, "tile ↔ case");
    }
  }
  if (!QUIET) console.log(`page  ${p.name.padEnd(40)} numbers ${String(stats.checked).padStart(3)} · in scope ${String(stats.scoped).padStart(3)} · whitelisted ${String(stats.white).padStart(3)}`);
}

/* 7 · every src resolves inside §3/§9, and its lines hold one of the fact's numbers */
function srcCheck(node, path) {
  if (Array.isArray(node)) { node.forEach((x, i) => srcCheck(x, path + "[" + i + "]")); return; }
  if (!node || typeof node !== "object") return;
  if (typeof node.src === "string") {
    const refs = [...node.src.matchAll(/P:(\d+)(?:-(\d+))?/g)];
    const own = Object.fromEntries(Object.entries(node).filter(([k, v]) => k !== "src" && (typeof v !== "object" || v == null || !Array.isArray(v)) && !(v && typeof v === "object" && ("src" in v))));
    const nums = new Set(numbers(JSON.stringify(own, (k, v) => (k === "src" ? undefined : v))).filter((x) => !WHITE(x)).map((x) => x.n));
    let cited = "";
    for (const r of refs) {
      const a = +r[1], b = r[2] ? +r[2] : a;
      const inside = (s) => a >= s[0] && b <= s[1];
      if (!inside(S3) && !inside(S9)) { misses++; console.log(`MISS  cases.json  ${path}.src "${r[0]}"  outside PRODUCT §3 (${S3[0]}-${S3[1]}) and §9 (${S9[0]}-${S9[1]})`); }
      cited += linesText(a, b) + "\n";
    }
    if (refs.length && nums.size) {
      const t = truthOf(cited);
      if (![...nums].some((n) => t.has(n))) { misses++; console.log(`MISS  cases.json  ${path}.src "${node.src}"  none of ${[...nums].join(", ")} on the cited lines`); }
    }
  }
  for (const [k, v] of Object.entries(node)) if (k !== "src" && v && typeof v === "object") srcCheck(v, path + "." + k);
}
CASES.forEach((c) => srcCheck(c, c.slug));

/* 8 · the two editions print the same numbers, page by page */
let twins = 0;
for (const p of pages) {
  if (!p.name.startsWith("it/") || inject) continue;
  const en = PAGE_NUMBERS[p.name.slice(3)], it = PAGE_NUMBERS[p.name];
  if (!en) { misses++; console.log(`MISS  ${p.name}  no English page ${p.name.slice(3)} to compare with`); continue; }
  twins++;
  if (en.join(" ") === it.join(" ")) continue;
  const left = it.slice(), only = [];
  for (const n of en) { const i = left.indexOf(n); if (i < 0) only.push(n); else left.splice(i, 1); }
  misses++;
  console.log(`MISS  ${p.name}  its numbers are not ${p.name.slice(3)}'s${only.length ? ` · only in English: ${only.join(", ")}` : ""}${left.length ? ` · only in Italian: ${left.join(", ")}` : ""}  (edition parity)`);
}

if (!misses) console.log(`check-claims-proto: OK — ${pages.length} pages, every number in its scope (PRODUCT §3/§9), ${CASES.length} cases' citations resolve${twins ? `, ${twins} Italian pages print their English pages' numbers` : ""}.`);
else { console.log(`check-claims-proto: ${misses} miss(es) — see above.`); process.exit(1); }

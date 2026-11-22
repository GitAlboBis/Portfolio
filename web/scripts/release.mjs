#!/usr/bin/env node
/* ==========================================================================
   web/scripts/release.mjs · the release: the night studio as one folder a host serves from the ROOT of a domain

     node web/scripts/release.mjs            from anywhere; it is vercel.json's buildCommand and the root "npm run build"

   What it does, in order (any failure exits 1 and leaves no release folder, so a bad build never ships):
     1 the Astro build (scripts/build.mjs) with the site's address and its robots line, into web/release/.build
     2 the build's root folders (Astro's /_astro) are folded into its site folder, where their rooted addresses resolve
       once that folder is the root; then the two gates on it: scripts/asserts.mjs and scripts/check-claims-proto.mjs
     3 web/release: the content of proto/rivista/ at the top (/ is the cover, /work.html, /it/, /case-<slug>.html, the
       two 404 pages, fx.css, the page scripts, stage/, icons/, og/, _astro/) and the captures as /captures/, without
       what a visitor never loads (LEFT_OUT)
     4 robots.txt and sitemap.xml (every page but the two 404, each with its own canonical and its en/it alternates)
     5 the release checks itself: every address a page, a stylesheet, the manifest or a script names is a file of the
       release, spelled with the same capitals (the host's disk tells Work.html from work.html), also the names made
       at run time (a scene by its data-stage, a module joined to a base inside an import); nothing names
       /proto/rivista; the two 404 pages load everything from the root

   Environment:
     RV_ORIGIN    the site's address, no folder and no slash at the end (default: ORIGIN below)
     RV_ROBOTS    the robots line of every page (default: "index, follow" when VERCEL_ENV is "production", else
                  "noindex, nofollow": a preview or a local build is never indexed)
     VERCEL_ENV   set by Vercel: "production" on the production branch

   Plain Node and what web/ has installed (Astro). No Python, no browser, no sharp.
   ========================================================================== */
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* THE SITE'S ADDRESS: the project's domain on Vercel since 22 November (Alberto: «il dominio è https://albertotuveri.sersan.io/»);
   the one line to change if the domain changes again (or set RV_ORIGIN where the build runs) */
const ORIGIN = "https://albertotuveri.sersan.io";

/* what the build holds and a visitor never loads */
const LEFT_OUT = [
  [/\.md$/i, "notes"],
  [/^stage\/.*\.html$/, "the stage's benches"],
  [/\.webp\.json$/, "the captures' sidecars"],
  /* the Supply Chain's detail stays: fx-motion.js reads it at run time to trace the figure's lines (wave 6, TITLES) */
  [/^captures\/(?!agricultural-supply-chain-detail\.svg$).*\.svg$/, "the drawing a capture was rendered from"],
  [/^og\/og-manifest\.json$/, "the share cards' ledger"],
];

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, "..");
const REPO = resolve(WEB, "..");
const OUT = join(WEB, "release");
const WORK = join(OUT, ".build");
const SITE = join(WORK, "proto", "rivista");

function fail(...lines) {
  for (const l of lines) console.error("[release] " + l);
  try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { /* a file held open: the exit code says it */ }
  console.error("[release] FAILED: nothing was released");
  process.exit(1);
}

/* ------------------------------------------------------------ the address and the robots line */
const origin = String(process.env.RV_ORIGIN || ORIGIN).trim().replace(/\/+$/, "");
let at = null;
try { at = new URL(origin + "/"); } catch (e) { /* said below */ }
if (!at || !/^https?:$/.test(at.protocol) || at.pathname !== "/" || at.search || at.hash || at.username)
  fail(`RV_ORIGIN is "${origin}": it must be an address with no folder (https://example.com), the release is served from the root`);
const production = process.env.VERCEL_ENV === "production";
const robots = String(process.env.RV_ROBOTS || (production ? "index, follow" : "noindex, nofollow")).trim();
const indexable = !/\b(noindex|none)\b/i.test(robots);

/* ------------------------------------------------------------ 1 · 2 the build and its gates */
function run(what, script, args, env) {
  const r = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", cwd: REPO, env: { ...process.env, ...env } });
  if (r.status !== 0) fail(`${what} failed (exit ${r.status ?? r.signal})`);
}
const ENV = { RV_ORIGIN: origin, RV_ROBOTS: robots };
rmSync(OUT, { recursive: true, force: true });
run("the Astro build", join(HERE, "build.mjs"), ["--outDir", WORK], ENV);
if (!existsSync(join(SITE, "index.html"))) fail("the build has no proto/rivista/index.html");
const strangers = readdirSync(join(WORK, "proto")).filter((n) => n !== "rivista");
if (strangers.length) fail("the build writes pages outside proto/rivista/: proto/" + strangers.join(", proto/"));
for (const name of readdirSync(WORK)) {
  if (name === "proto" || name === "captures") continue;
  if (existsSync(join(SITE, name))) fail(`the build writes /${name} and the site has a ${name} of its own`);
  cpSync(join(WORK, name), join(SITE, name), { recursive: true });
}
run("the build's asserts", join(HERE, "asserts.mjs"), ["--built=" + SITE], ENV);
run("the claims gate", join(REPO, "scripts", "check-claims-proto.mjs"), ["--dir=" + SITE, "--quiet"], ENV);

/* ------------------------------------------------------------ 3 the folder a host serves from its root */
function walk(dir, rel = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const r = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), r)); else out.push(r);
  }
  return out;
}
const left = {};
function place(from, rel) {
  const why = LEFT_OUT.find(([re]) => re.test(rel));
  if (why) { left[why[1]] = (left[why[1]] || 0) + 1; return; }
  const to = join(OUT, rel);
  if (existsSync(to)) fail(`two files of the build want to be /${rel}`);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
for (const rel of walk(SITE)) place(join(SITE, rel), rel);
for (const rel of walk(join(WORK, "captures"))) place(join(WORK, "captures", rel), "captures/" + rel);
rmSync(WORK, { recursive: true, force: true });

/* ------------------------------------------------------------ 4 robots.txt and sitemap.xml */
const read = (rel) => readFileSync(join(OUT, rel), "utf8");
/* an address written in a file of the release → the file of the release it names (null: somewhere else, or nothing) */
function target(u, from) {
  u = u.trim();
  if (u === origin || u.startsWith(origin + "/")) u = u.slice(origin.length) || "/";
  u = u.split(/[?#]/)[0];
  if (!u || /^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("//")) return null;
  const segs = u.startsWith("/") ? [] : from.split("/").slice(0, -1);
  for (const s of u.split("/")) { if (s === "..") segs.pop(); else if (s && s !== ".") segs.push(s); }   // above the root a ".." stays at the root, as in a browser
  const p = segs.join("/");
  return u.endsWith("/") || !p ? (p ? p + "/" : "") + "index.html" : p;
}
const pages = walk(OUT).filter((f) => f.endsWith(".html"));
const is404 = (rel) => /(^|\/)404\.html$/.test(rel);
const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const broken = [];
const entries = [];
for (const rel of pages.filter((p) => !is404(p))) {
  const html = read(rel);
  const canon = (/<link rel="canonical" href="([^"]+)">/.exec(html) || [])[1];
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([a-zA-Z-]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
  if (!canon || !canon.startsWith(origin + "/") || target(canon, rel) !== rel) { broken.push(`${rel}: its canonical is ${canon} (want this page under ${origin})`); continue; }
  if (alts.length < 3 || alts.some(([, href]) => !href.startsWith(origin + "/"))) broken.push(`${rel}: its language alternates are not the two editions and a default under ${origin}`);
  entries.push({ rel, loc: canon, alts });
}
const rank = (e) => (e.rel.startsWith("it/") ? "1" : "0") + (e.rel.endsWith("index.html") ? "0" : "1") + e.rel;
entries.sort((a, b) => (rank(a) < rank(b) ? -1 : 1));
writeFileSync(join(OUT, "sitemap.xml"), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries.map((e) => `  <url>\n    <loc>${xml(e.loc)}</loc>\n${e.alts.map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${xml(lang)}" href="${xml(href)}"/>`).join("\n")}\n  </url>`),
  "</urlset>", "",
].join("\n"));
writeFileSync(join(OUT, "robots.txt"), (indexable
  ? ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap.xml`]
  : ["User-agent: *", "Disallow: /"]).join("\n") + "\n");

/* ------------------------------------------------------------ 5 the release checks itself */
const files = new Set(walk(OUT));
const want = (from, u, as = u) => { const t = target(u, from); if (t && !files.has(t)) broken.push(`${from}: ${as} is not a file of the release (/${t})`); };
/* a script without its comments, roughly: enough to tell code from a note about a file. A cut too many skips a check, never fails one */
const code = (js) => js.replace(/\/\*[\s\S]*?\*\//g, " ").split("\n").map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, "$1")).join("\n");
const NAMED = /\bproto\/rivista\b/;
for (const rel of pages) {
  const html = read(rel);
  if (NAMED.test(html)) broken.push(`${rel}: names proto/rivista`);
  const line = (/<meta name="robots" content="([^"]*)">/.exec(html) || [])[1];
  if (line !== (is404(rel) ? "noindex" : robots)) broken.push(`${rel}: its robots line is "${line}"`);
  for (const m of html.matchAll(/\s(href|src|poster)="([^"]*)"/gi)) {
    want(rel, m[2], `${m[1]}="${m[2]}"`);
    if (is404(rel) && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(m[2])) broken.push(`${rel}: ${m[1]}="${m[2]}" is not rooted (a 404 answers at any depth)`);
  }
  for (const m of html.matchAll(/\scontent="([^"]*)"/gi)) if (m[1].startsWith(origin + "/")) want(rel, m[1], `content="${m[1]}"`);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/gi)) for (const c of m[1].split(",")) want(rel, c.trim().split(/\s+/)[0], `srcset ${c.trim()}`);
  for (const m of html.matchAll(/'((?:\.\.\/|\/)?fx-[a-z]+\.js)'/g)) {
    want(rel, m[1], `the loader's '${m[1]}'`);
    if (is404(rel) && !m[1].startsWith("/")) broken.push(`${rel}: the loader's '${m[1]}' is not rooted`);
  }
  /* a scene is loaded by the name in its data-stage (fx-stage.js sceneEls(), stage/boot.js): stage/scenes/<name>.js,
     and "mist" for a case page's main. No line of source spells that address whole, and a scene that does not load is
     skipped without a word: it is checked here */
  const scenes = new Set([...html.matchAll(/\sdata-stage="([^"]*)"/g)].map((m) => m[1].trim()).filter(Boolean));
  if (/<main\b[^>]*\sdata-case="/.test(html)) scenes.add("mist");
  for (const n of scenes) if (!files.has(`stage/scenes/${n}.js`)) broken.push(`${rel}: data-stage="${n}" has no stage/scenes/${n}.js in the release`);
}
for (const rel of files) {
  if (/\.css$/.test(rel)) {
    const css = read(rel);
    if (NAMED.test(css)) broken.push(`${rel}: names proto/rivista`);
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) if (!m[1].startsWith("data:")) want(rel, m[1], `url(${m[1]})`);
  } else if (/\.webmanifest$/.test(rel)) {
    const man = JSON.parse(read(rel));
    if (NAMED.test(JSON.stringify(man))) broken.push(`${rel}: names proto/rivista`);
    for (const u of [man.start_url, man.scope, ...(man.icons || []).map((i) => i.src)]) if (u) want(rel, u);
  } else if (/\.js$/.test(rel)) {
    const js = code(read(rel));
    if (NAMED.test(js)) broken.push(`${rel}: its code names proto/rivista`);
    /* what a module loads by a written name: import … from "…", import "…", import("…"), new URL("…", import.meta.url) */
    for (const re of [/\b(?:import|export)\b[^;'"`]*?\bfrom\s*(["'`])([^"'`\n$]+)\1/g, /\bimport\s*(["'`])([^"'`\n$]+)\1/g,
      /\bimport\s*\(\s*(["'`])([^"'`\n$]+)\1\s*\)/g, /\bnew\s+URL\(\s*(["'`])([^"'`\n$]+)\1\s*,\s*import\.meta\.url\s*\)/g])
      for (const m of js.matchAll(re)) want(rel, m[2], `"${m[2]}"`);
    /* … and a name joined to a base inside an import( … ), as fx-stage.js does: import(BASE + "tier.js"). The base is
       not known here, so the name must be the end of a file's path, capitals included */
    for (const m of js.matchAll(/\bimport\s*\(/g)) {
      const from = m.index + m[0].length;
      let to = from, depth = 1;
      for (; to < js.length && depth; to++) { if (js[to] === "(") depth++; else if (js[to] === ")") depth--; }
      const arg = js.slice(from, to - 1);
      if (/^\s*(["'`])[^"'`\n$]+\1\s*$/.test(arg)) continue;   // one written name: resolved above
      for (const s of arg.matchAll(/(["'`])([^"'`\n$]+)\1/g)) {
        const name = s[2].replace(/^(?:\.\/)+/, "").replace(/^\/+/, "");
        if (!/[A-Za-z0-9_-]\.js$/.test(name) || /^[a-z][a-z0-9+.-]*:/i.test(s[2]) || s[2].startsWith("//") || name.includes("../")) continue;
        if (![...files].some((f) => f === name || f.endsWith("/" + name))) broken.push(`${rel}: import( … "${s[2]}" ) names no file of the release (…/${name})`);
      }
    }
  }
}
for (const lang of ["", "it/"]) if (!files.has(lang + "404.html")) broken.push(`${lang}404.html is missing`);
if (entries.length !== pages.length - 2) broken.push(`sitemap.xml lists ${entries.length} of the ${pages.length - 2} pages that are not a 404`);
if (broken.length) fail(...[...new Set(broken)]);

/* ------------------------------------------------------------ what was released */
const bytes = [...files].reduce((n, f) => n + statSync(join(OUT, f)).size, 0);
const leftN = Object.values(left).reduce((a, b) => a + b, 0);
console.log(`[release] ${origin} · robots "${robots}"${process.env.RV_ROBOTS ? " (RV_ROBOTS)" : ` (VERCEL_ENV is ${process.env.VERCEL_ENV || "not set"})`} · robots.txt ${indexable ? "allows all and names the sitemap" : "disallows all"}`);
console.log(`[release] web/release, to be served from its root: ${pages.length} pages (${entries.length} in sitemap.xml), ${files.size} files, ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`[release] left out ${leftN} files no visitor loads: ${Object.entries(left).map(([k, n]) => `${k} (${n})`).join(", ")}`);

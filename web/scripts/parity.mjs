#!/usr/bin/env node
/* ==========================================================================
   web/scripts/parity.mjs · the Astro build against assemble.mjs, page by page (lane p-astro)

     node scripts/parity.mjs [--live=<folder>] [--built=<folder>] [--json]

   For each of the 32 pages (every .html assemble.mjs wrote in public/proto/rivista and it/) and fx.css, the page in
   web/dist/proto/rivista against its assembled twin, three ways:
     · head   title, every meta, link and script in order (tag + all attributes), the inline scripts' text
     · body   the DOM in order: each element's tag, id, class, every data-* and aria-* attribute (and the rest of its
              attributes, reported apart)
     · text   every text node, as written
   plus a byte compare. A difference that must stay is listed in ALLOWED with its reason: today only the router (lane o-router), and
   an allowed kind is clean only when every extra line of the build matches its `only` patterns (nothing else differs).
   Also: every file the pages share (fx-*.js, stage/, icons/, og/, the manifest, captures/) is the same bytes.
   Exit 1 on any difference not in ALLOWED. No dependency: a small tokenizer (the pages are the build's own output).
   ========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || d;
const LIVE = resolve(arg("live", join(HERE, "..", "..", "public", "proto", "rivista")));
const BUILT = resolve(arg("built", join(HERE, "..", "dist", "proto", "rivista")));
const LIVE_CAP = resolve(LIVE, "..", "..", "captures"), BUILT_CAP = resolve(BUILT, "..", "..", "captures");

/* a difference that must stay: { page (regex), kind, why } */
const ALLOWED = [
  /* (lane o-router) the router of the Astro build, and nothing else: the stage lives on between pages there */
  { page: /\.html$/, kind: "head", why: "router: <meta astro-view-transitions-enabled> and <meta astro-view-transitions-fallback=swap> before </head> (the pages the router may swap; no browser view transition)", only: [/^meta name="astro-view-transitions-(enabled|fallback)"/] },
  { page: /\.html$/, kind: "body", why: "router: one module script before </body> (components/Router.astro → src/router/rv-router.js)", only: [/^script\s+‖ type="module" src="\/_astro\/Router\.astro_astro_type_script_index_0_lang\.[\w-]+\.js"$/, /^script-text sha1:\w+ \(0 chars\)$/, /^\/script$/] },
  { page: /\.html$/, kind: "text", why: "router: the line breaks after the two metas", only: [/^\s+$/] },
];

/* ------------------------------------------------------------ tokenizer */
const RAW = new Set(["script", "style"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
function attrsOf(s) {
  const a = [];
  for (const m of s.matchAll(/([^\s"'=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) a.push([m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? ""]);
  return a;
}
function tokens(html) {
  const out = [];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt < 0) { out.push({ t: "text", v: html.slice(i) }); break; }
    if (lt > i) out.push({ t: "text", v: html.slice(i, lt) });
    if (html.startsWith("<!--", lt)) { const e = html.indexOf("-->", lt); out.push({ t: "comment", v: html.slice(lt, e + 3) }); i = e + 3; continue; }
    if (html[lt + 1] === "!") { const e = html.indexOf(">", lt); out.push({ t: "doctype", v: html.slice(lt, e + 1) }); i = e + 1; continue; }
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/.exec(html.slice(lt));
    if (!m) { out.push({ t: "text", v: "<" }); i = lt + 1; continue; }
    const tag = m[2].toLowerCase();
    if (m[1]) { out.push({ t: "close", tag }); i = lt + m[0].length; continue; }
    out.push({ t: "open", tag, attrs: attrsOf(m[3].replace(/\/$/, "")) });
    i = lt + m[0].length;
    if (RAW.has(tag)) { const e = html.toLowerCase().indexOf(`</${tag}`, i); out.push({ t: "raw", tag, v: html.slice(i, e) }); i = e; }
  }
  return out;
}
/* the three views of a page */
function views(html) {
  const tk = tokens(html), head = [], body = [], text = [];
  let where = "pre";
  for (const k of tk) {
    if (k.t === "open" && k.tag === "head") where = "head";
    if (k.t === "open" && k.tag === "body") where = "body";
    if (k.t === "doctype") head.push("doctype " + k.v.toLowerCase());
    if (k.t === "open") {
      const key = k.tag + " " + k.attrs.map(([n, v]) => `${n}="${v}"`).join(" ");
      if (where === "head" || where === "pre") head.push(key);
      if (where === "body" || k.tag === "html" || k.tag === "body") {
        const pick = k.attrs.filter(([n]) => n === "id" || n === "class" || n.startsWith("data-") || n.startsWith("aria-"));
        const rest = k.attrs.filter(([n]) => !(n === "id" || n === "class" || n.startsWith("data-") || n.startsWith("aria-")));
        body.push(k.tag + " " + pick.map(([n, v]) => `${n}="${v}"`).join(" ") + (rest.length ? "  ‖ " + rest.map(([n, v]) => `${n}="${v}"`).join(" ") : ""));
      }
    }
    if (k.t === "close" && where === "body" && !VOID.has(k.tag)) body.push("/" + k.tag);
    if (k.t === "raw") (where === "body" ? body : head).push(`${k.tag}-text sha1:${createHash("sha1").update(k.v).digest("hex").slice(0, 12)} (${k.v.length} chars)`);
    if (k.t === "text") text.push(k.v);
    if (k.t === "comment") (where === "body" ? body : head).push("comment " + k.v.length);
  }
  return { head, body, text };
}
/* the build has the live lines plus extra ones, and each extra matches one of the patterns */
function onlyExtra(live, built, pats) {
  const rest = [...built];
  for (const l of live) { const i = rest.indexOf(l); if (i < 0) return false; rest.splice(i, 1); }
  return rest.length > 0 && rest.every((x) => pats.some((re) => re.test(x)));
}
function firstDiff(a, b) {
  const n = Math.max(a.length, b.length);
  let count = 0, first = null;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { count++; if (!first) first = { at: i, live: a[i], built: b[i] }; }
  return { count, first, sizes: [a.length, b.length] };
}

/* ------------------------------------------------------------ the pages */
const pagesIn = (dir) => readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => f);
const PAGES = [...pagesIn(LIVE), ...pagesIn(join(LIVE, "it")).map((f) => "it/" + f)].sort();
const rows = [];
let bad = 0;
for (const p of [...PAGES, "fx.css"]) {
  const live = readFileSync(join(LIVE, p), "utf8");
  const bp = join(BUILT, p);
  if (!existsSync(bp)) { rows.push({ page: p, missing: true }); bad++; continue; }
  const built = readFileSync(bp, "utf8");
  const row = { page: p, bytes: live === built, size: [live.length, built.length] };
  if (p.endsWith(".html")) {
    const L = views(live), B = views(built);
    for (const k of ["head", "body", "text"]) {
      const d = firstDiff(L[k], B[k]);
      row[k] = d.count;
      if (d.count) {
        const ok = ALLOWED.find((x) => x.page.test(p) && x.kind === k && onlyExtra(L[k], B[k], x.only));
        if (ok) row[k + "Allowed"] = ok.why; else { bad++; row[k + "First"] = d.first; }
      }
    }
    row.elements = L.body.filter((x) => !x.startsWith("/")).length;
    row.texts = L.text.length;
  } else if (!row.bytes) bad++;
  rows.push(row);
}
const extra = [...pagesIn(BUILT), ...pagesIn(join(BUILT, "it")).map((f) => "it/" + f)].filter((f) => !PAGES.includes(f));

/* the shared files, the same bytes */
function walk(dir, base = dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, base, acc); else acc.push(relative(base, p).replace(/\\/g, "/"));
  }
  return acc;
}
const SHARED = [...readdirSync(LIVE).filter((f) => /^fx-[a-z]+\.js$/.test(f)), "site.webmanifest", ...["stage", "icons", "og"].flatMap((d) => walk(join(LIVE, d)).map((f) => d + "/" + f))];
const sharedBad = [];
for (const f of SHARED) {
  const b = join(BUILT, f);
  if (!existsSync(b) || !readFileSync(b).equals(readFileSync(join(LIVE, f)))) sharedBad.push(f);
}
const caps = walk(LIVE_CAP);
for (const f of caps) { const b = join(BUILT_CAP, f); if (!existsSync(b) || !readFileSync(b).equals(readFileSync(join(LIVE_CAP, f)))) sharedBad.push("captures/" + f); }
bad += sharedBad.length + extra.length;

if (process.argv.includes("--json")) { console.log(JSON.stringify({ rows, extra, sharedBad, shared: SHARED.length + caps.length }, null, 2)); process.exit(bad ? 1 : 0); }
console.log("page".padEnd(42) + "bytes  head  body  text  elements  texts");
for (const r of rows) {
  if (r.missing) { console.log(r.page.padEnd(42) + "MISSING in the build"); continue; }
  console.log(r.page.padEnd(42) + (r.bytes ? "same " : "DIFF ").padEnd(7) + String(r.head ?? "-").padEnd(6) + String(r.body ?? "-").padEnd(6) + String(r.text ?? "-").padEnd(6) + String(r.elements ?? "-").padEnd(10) + String(r.texts ?? "-"));
  for (const k of ["head", "body", "text"]) if (r[k + "First"]) console.log("    first " + k + " difference at " + r[k + "First"].at + ":\n      live:  " + JSON.stringify(r[k + "First"].live) + "\n      built: " + JSON.stringify(r[k + "First"].built));
}
const html = rows.filter((r) => r.page.endsWith(".html"));
console.log(`\n${html.length} pages: ${html.filter((r) => r.bytes).length} byte-identical, ${html.filter((r) => !r.missing && !r.head && !r.body && !r.text).length} with zero head/body/text differences; fx.css ${rows.find((r) => r.page === "fx.css")?.bytes ? "byte-identical" : "DIFFERS"}`);
console.log(`shared files: ${SHARED.length + caps.length} checked, ${sharedBad.length} differ${sharedBad.length ? ": " + sharedBad.slice(0, 5).join(", ") : ""}`);
if (extra.length) console.log("pages only in the build: " + extra.join(", "));
console.log(bad ? `PARITY FAILED (${bad})` : "PARITY OK");
process.exit(bad ? 1 : 0);

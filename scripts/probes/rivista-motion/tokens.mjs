// tokens.mjs · the MC-09b gate of the rivista motion canon (docs/redesign/rivista-motion/10-motion-canon.md §2 P1, §3).
//
// STATIC (the gate): greps rv/fx-{core,hero,scroll,nav}.{js,css} for literal motion values outside the token module
// and the §3 allowlist. Comments are blanked first (line numbers survive). Any hit exits 1.
//   JS   ease       a named GSAP ease string: power*, expo.*, sine/quad/cubic/quart/quint/strong/circ/back/elastic/bounce
//        dur        duration|delay|stagger|each|repeatDelay : <non-zero number literal>
//        fallback   <token read> || <number>   (e.g. D.reveal || 0.9: JS retypes the token; the twin is always read)
//        position   a tween's literal position parameter  }, 0.15)   and  "+=0.2" / "-=0.3"
//        delayed    gsap.delayedCall(<number>, …)
//        css-in-js  a string literal holding a time ("0.45s", "250ms") or cubic-bezier(
//        bezier     cubic-bezier( in code
//   CSS  time       a non-zero time literal (0.3s, 120ms) in any declaration
//        bezier     cubic-bezier(
//        (info)     keyword eases ease / ease-in / ease-out / ease-in-out / linear() are listed, never counted
// ALLOWLIST (§3 "Allowlisted literals"; each allowed hit is still listed in the report with its reason):
//   token-defs   CSS declarations of --d-*, --st-*, --ease-*, --cue-*, --guard-*, --tempo (the token table itself, §2)
//   kill-switch  the @media (prefers-reduced-motion: reduce) blocks (fx-core.css §10 and their twins)
//   token-module fx-core.js: the "motion tokens" section, CustomEase.create(…) lines, the no-CustomEase fallback
//   INTRO        fx-hero.js: the const INTRO = { … } block (it IS the intro's token)
//   off-limits   fx-hero.js: slitOpen() and the phone dock cue (canon scope: the water's own motion law)
//   gl           a tween whose target is gl().clip / gl().params / FX.gl or a variable bound to one (the water's own
//                motion law, off-limits)
//   scrub        dur literals inside a scrubbed tween/timeline (they are proportions of the scroll, not seconds)
// RUNTIME (the twins, MC-09a): opens index.html and checks FX.motion.D / S / bezier against the §3 table, and that
// the registered eases rv.out / dtIn exist. Skip it with --static.
//
// Usage: node tokens.mjs [--static] [--json]      RV_DIR=<dir> greps another copy of the prototype
import fs from "node:fs";
import path from "node:path";
import * as S from "./strip.mjs";

const args = process.argv.slice(2);
const RV = process.env.RV_DIR || path.join(S.ROOT, "public", "proto", "rivista");
const FILES = ["fx-core.js", "fx-hero.js", "fx-scroll.js", "fx-nav.js", "fx-core.css", "fx-hero.css", "fx-scroll.css", "fx-nav.css"];
const dir = S.outDir("tokens");
const out = { rv: RV, files: {}, hits: [], allowed: [], info: [], verdicts: [] };
const V = (...a) => out.verdicts.push(S.verdict(...a));

// ------------------------------------------------------------------ comment blanking (positions preserved)
function blankJS(src) {
  const o = src.split("");
  let i = 0, prevSig = "";
  const blank = (a, b) => { for (let k = a; k < b; k++) if (o[k] !== "\n") o[k] = " "; };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "/") { const e = src.indexOf("\n", i); const end = e < 0 ? src.length : e; blank(i, end); i = end; continue; }
    if (c === "/" && n === "*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? src.length : e + 2; blank(i, end); i = end; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === "\\") j++; j++; }
      i = j + 1; prevSig = c; continue;
    }
    if (c === "/" && (prevSig === "" || "(,=:[!&|?{};+-*%<>~^".includes(prevSig))) {
      // a regex literal: skip to the closing slash (outside a class)
      let j = i + 1, cls = false;
      while (j < src.length && src[j] !== "\n") { if (src[j] === "\\") { j += 2; continue; } if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false; else if (src[j] === "/" && !cls) break; j++; }
      i = j + 1; prevSig = "/"; continue;
    }
    if (!/\s/.test(c)) prevSig = /[\w$)\]]/.test(c) ? "a" : c;
    i++;
  }
  return o.join("");
}
const blankCSS = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;
const lineText = (raw, ln) => (raw.split("\n")[ln - 1] || "").trim().slice(0, 160);

// ------------------------------------------------------------------ JS
const EASE_RE = /^(power\d|expo|sine|quad|cubic|quart|quint|strong|circ|back|elastic|bounce)(\.(in|out|inOut))?(\(|$)/;
const TIME_IN_STR = /(^|[^\w.-])(\d*\.?\d+)(ms|s)(?![\w-])/;

function jsRanges(file, code) {
  const r = [];
  if (file === "fx-core.js") {
    const a = code.indexOf("const D_NAMES"), b = code.indexOf("let lenis = null");
    if (a >= 0 && b > a) r.push({ from: lineOf(code, a), to: lineOf(code, b), why: "token-module" });
  }
  if (file === "fx-hero.js") {
    const so = code.indexOf("function slitOpen(");
    if (so >= 0) {
      let k = code.indexOf("{", so), depth = 0;
      for (; k < code.length; k++) { if (code[k] === "{") depth++; else if (code[k] === "}" && --depth === 0) break; }
      r.push({ from: lineOf(code, so), to: lineOf(code, k), why: "off-limits" });
    }
    const dk = code.indexOf('FX.emit("fx:hero:docked"');
    if (dk >= 0) r.push({ from: lineOf(code, dk), to: lineOf(code, dk), why: "off-limits" });
    const a = code.indexOf("const INTRO = {");
    if (a >= 0) {
      let k = code.indexOf("{", a), depth = 0;
      for (; k < code.length; k++) { if (code[k] === "{") depth++; else if (code[k] === "}" && --depth === 0) break; }
      r.push({ from: lineOf(code, a), to: lineOf(code, k), why: "INTRO" });
    }
  }
  return r;
}

/** Variables bound to a gl object anywhere in the file (const c = gl().clip, …). */
function glVars(code) {
  const v = new Set();
  for (const m of code.matchAll(/(?:const|let|var)\s+([\w$]+)\s*=\s*(?:gl\(\)|FX\.gl)[\w.()]*/g)) v.add(m[1]);
  return v;
}

/** The tween call whose argument list contains idx: { target, callStart, callEnd } or null. */
function enclosingCall(code, idx) {
  let depth = 0;
  for (let k = idx; k >= 0 && k > idx - 3000; k--) {
    const ch = code[k];
    if (ch === ")") depth++;
    else if (ch === "(") {
      if (depth === 0) {
        const head = code.slice(Math.max(0, k - 40), k);
        const m = /(\b[\w$]+|\))\s*\.\s*(to|from|fromTo|set|add|call|quickTo|timeline|delayedCall)\s*$/.exec(head);
        if (m) {
          // find the call's first argument
          let d = 0, e = k + 1;
          for (; e < code.length; e++) { const c = code[e]; if ("([{".includes(c)) d++; else if (")]}".includes(c)) { if (d === 0) break; d--; } else if (c === "," && d === 0) break; }
          let end = k + 1, dd = 0;
          for (; end < code.length; end++) { const c = code[end]; if ("([{".includes(c)) dd++; else if (")]}".includes(c)) { if (dd === 0) break; dd--; } }
          return { fn: m[2], recv: m[1], target: code.slice(k + 1, e).trim(), start: k, end };
        }
      } else depth--;
    }
  }
  return null;
}

function scanJS(file, raw) {
  const code = blankJS(raw);
  const ranges = jsRanges(file, code);
  const gv = glVars(code);
  const hits = [];
  const add = (kind, idx, val) => {
    const ln = lineOf(code, idx);
    let why = null;
    const rg = ranges.find((r) => ln >= r.from && ln <= r.to);
    if (rg) why = rg.why;
    if (!why && file === "fx-core.js" && /CustomEase\.create\(|Object\.assign\(motion\.E/.test(raw.split("\n")[ln - 1] || "")) why = "token-module";
    const call = enclosingCall(code, idx);
    if (!why && call) {
      const t = call.target.replace(/\s+/g, "");
      if (/gl\(\)|FX\.gl/.test(t) || gv.has(t.split(/[.[]/)[0])) why = "gl";
      else if (kind === "dur" && /\bscrub\s*:/.test(code.slice(call.start, call.end))) why = "scrub";
      else if (kind === "dur" && call.recv && call.recv !== ")") {
        // a timeline child: the timeline's own vars may carry the scrub (const tl = G.timeline({ scrollTrigger: { scrub } }))
        const re = new RegExp(String.raw`\b` + call.recv.replace(/\$/g, String.raw`\$`) + String.raw`\s*=\s*[\w$.]*timeline\(`, "g");
        const decl = [...code.slice(0, call.start).matchAll(re)].pop();
        if (decl && /\bscrub\s*:/.test(code.slice(decl.index, decl.index + 600))) why = "scrub";
      }
    }
    hits.push({ file, line: ln, kind, value: val, text: lineText(raw, ln), allowed: why });
  };
  // strings: named eases, times, cubic-bezier, relative positions
  for (const m of code.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    const s = m[2];
    const cmp = /[=!]==?\s*$/.test(code.slice(Math.max(0, m.index - 6), m.index)) || /^\s*[=!]==?/.test(code.slice(m.index + m[0].length, m.index + m[0].length + 6));
    if (EASE_RE.test(s) && !cmp) add("ease", m.index, s);
    else if (/cubic-bezier\(/.test(s) || TIME_IN_STR.test(s.replace(/\$\{[^}]*\}/g, ""))) {
      const t = TIME_IN_STR.exec(s);
      if (/cubic-bezier\(/.test(s) || (t && parseFloat(t[2]) !== 0)) add("css-in-js", m.index, s.slice(0, 60));
    } else if (/^[+-]=\d*\.?\d+/.test(s) && parseFloat(s.slice(2)) !== 0) add("position", m.index, s);
  }
  for (const m of code.matchAll(/\b(duration|delay|stagger|each|repeatDelay)\s*:\s*(-?\d*\.?\d+)(?![\w.])/g)) {
    if (parseFloat(m[2]) !== 0) add("dur", m.index, `${m[1]}: ${m[2]}`);
  }
  /* an expression value (a ternary, a product) that carries a decimal literal: the plain pattern above cannot see it */
  for (const m of code.matchAll(/\b(duration|delay|stagger|each|repeatDelay)\s*:\s*([^,}\n]*?)(?=[,}\n])/g)) {
    const v = m[2].trim();
    if (/^-?\d*\.?\d+$/.test(v)) continue;   // a plain literal: reported above
    const lit = v.match(/(?<![\w.$])\d*\.\d+/);
    if (lit && parseFloat(lit[0]) !== 0) add("dur", m.index, `${m[1]}: ${v.slice(0, 40)}`);
  }
  for (const m of code.matchAll(/\b((?:[\w$]+\.)*(?:D|S|MD|M\.D|M\.S|motion\.D|motion\.S)\s*(?:&&\s*[\w$.]+\s*)?[.\w$]*\)?)\s*\|\|\s*(\d*\.?\d+)(?![\w.])/g)) {
    add("fallback", m.index, m[0].slice(0, 50));
  }
  for (const m of code.matchAll(/\}\s*,\s*(\d*\.\d+|[1-9]\d*)\s*\)/g)) {
    // only a tween's position parameter (setTimeout(() => {…}, 450) is a timer in ms, not a motion value)
    const c = enclosingCall(code, m.index);
    if (c && ["to", "from", "fromTo", "set", "add", "call"].includes(c.fn)) add("position", m.index, m[1]);
  }
  for (const m of code.matchAll(/\bdelayedCall\(\s*(\d*\.?\d+)/g)) if (parseFloat(m[1]) !== 0) add("delayed", m.index, m[1]);
  for (const m of code.matchAll(/cubic-bezier\(/g)) {
    // inside a string it was counted above; count code-level uses only (regex literals are blanked by the lexer? no: skip them)
    const ln = lineOf(code, m.index);
    if (!hits.some((h) => h.line === ln && h.kind === "css-in-js") && !/\/cubic-bezier/.test(raw.split("\n")[ln - 1] || "")) add("bezier", m.index, "cubic-bezier(");
  }
  return hits;
}

// ------------------------------------------------------------------ CSS
function scanCSS(file, raw) {
  const code = blankCSS(raw);
  const hits = [], info = [];
  // kill-switch ranges: every @media (prefers-reduced-motion: reduce) { … }
  const ks = [];
  for (const m of code.matchAll(/@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{/g)) {
    let k = m.index + m[0].length, d = 1;
    for (; k < code.length && d > 0; k++) { if (code[k] === "{") d++; else if (code[k] === "}") d--; }
    ks.push([m.index, k]);
  }
  // declarations: prop: value; (inside rule bodies)
  for (const m of code.matchAll(/([\w-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
    const prop = m[1], val = m[2], idx = m.index;
    const ln = lineOf(code, idx);
    const tokenDef = /^--(d|st|ease|cue|guard)-|^--tempo$/.test(prop);
    const inKs = ks.some(([a, b]) => idx >= a && idx < b);
    const why = tokenDef ? "token-defs" : inKs ? "kill-switch" : null;
    for (const t of val.matchAll(/(^|[^\w.#-])(\d*\.?\d+)(ms|s)(?![\w-])/g)) {
      if (parseFloat(t[2]) === 0) continue;
      hits.push({ file, line: ln, kind: "time", value: `${prop}: ${t[2]}${t[3]}`, text: lineText(raw, ln), allowed: why });
    }
    if (/cubic-bezier\(/.test(val)) hits.push({ file, line: ln, kind: "bezier", value: `${prop}: cubic-bezier(`, text: lineText(raw, ln), allowed: why });
    if (/^(transition|transition-timing-function|animation|animation-timing-function)$/.test(prop)) {
      const kw = val.match(/(?<![\w-])(ease|ease-in|ease-out|ease-in-out|linear\()(?![\w-])/g);
      if (kw && !why) info.push({ file, line: ln, kind: "keyword-ease", value: `${prop}: ${kw.join(",")}`, text: lineText(raw, ln) });
    }
  }
  return { hits, info };
}

// ------------------------------------------------------------------ static run
for (const f of FILES) {
  const p = path.join(RV, f);
  if (!fs.existsSync(p)) { out.files[f] = { missing: true }; continue; }
  const raw = fs.readFileSync(p, "utf8");
  let hits = [], info = [];
  if (f.endsWith(".js")) hits = scanJS(f, raw);
  else ({ hits, info } = scanCSS(f, raw));
  // one line, one kind, one value: de-duplicate
  const seen = new Set();
  hits = hits.filter((h) => { const k = `${h.line}|${h.kind}|${h.value}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const bad = hits.filter((h) => !h.allowed), ok = hits.filter((h) => h.allowed);
  out.files[f] = { hits: bad.length, allowed: ok.length, info: info.length, byKind: bad.reduce((a, h) => ((a[h.kind] = (a[h.kind] || 0) + 1), a), {}) };
  out.hits.push(...bad); out.allowed.push(...ok); out.info.push(...info);
}
for (const f of FILES) {
  const r = out.files[f];
  if (r.missing) { V(`MC-09b.${f}`, false, "file missing"); continue; }
  V(`MC-09b.${f}`, r.hits === 0, `${r.hits} literal(s) outside the token table ${JSON.stringify(r.byKind)} · ${r.allowed} allowlisted · ${r.info} keyword-ease info`);
}
const total = out.hits.length;
console.log(`\n  hits by file:line (first 60 of ${total}):`);
for (const h of out.hits.slice(0, 60)) console.log(`    ${h.file}:${h.line}  [${h.kind}] ${h.value}`);
if (args.includes("--json")) console.log(JSON.stringify(out.hits, null, 1));

// ------------------------------------------------------------------ runtime twins (MC-09a)
const TABLE = {
  D: { press: 0.12, micro: 0.25, hover: 0.3, exit: 0.35, roll: 0.45, wipe: 0.5, zoom: 0.6, reveal: 0.9, title: 1.05, travel: 1.1, name: 1.25, media: 1.4, rm: 0.2 },
  S: { char: 0.045, word: 0.06, line: 0.09, lead: 0.08, item: 0.05, block: 0.1 },
  bezier: { out: [0.16, 1, 0.3, 1], io: [0.66, 0, 0.22, 1], soft: [0.22, 0.9, 0.36, 1], xio: [0.87, 0, 0.13, 1], in: [0.5, 0, 0.75, 0] },
};
if (!args.includes("--static")) {
  const browser = await S.L.launch({ headless: false });
  try {
    const { page, context, consoleMsgs } = await S.open(browser, "index.html", { ...S.VP.desktop, introSeen: true });
    await S.sleep(2500);
    const rt = await page.evaluate(() => {
      const M = window.FX && FX.motion;
      const eases = {};
      for (const n of ["rv.out", "dtIn", "domus", "domus.inOut"]) { try { const e = gsap.parseEase(n); eases[n] = typeof e === "function" ? +e(0.5).toFixed(4) : null; } catch (x) { eases[n] = null; } }
      return M ? { D: M.D, S: M.S, bezier: M.bezier, tempo: M.tempo, E: M.E, eases } : null;
    });
    out.runtime = rt;
    if (!rt) V("MC-09a.twins", false, "FX.motion is missing");
    else {
      const diff = [];
      for (const k of ["D", "S"]) for (const [n, v] of Object.entries(TABLE[k])) if (Math.abs((rt[k][n] ?? NaN) - v) > 1e-6 || !isFinite(rt[k][n])) diff.push(`${k}.${n}=${rt[k][n]} (table ${v})`);
      for (const [n, v] of Object.entries(TABLE.bezier)) { const b = rt.bezier[n]; if (!b || b.some((x, i) => Math.abs(x - v[i]) > 1e-6)) diff.push(`bezier.${n}=${JSON.stringify(b)} (table ${JSON.stringify(v)})`); }
      V("MC-09a.twins", diff.length === 0, diff.length ? diff.join("; ") : `FX.motion matches §3: D.reveal ${rt.D.reveal}, ${Object.keys(rt.D).length} durations, ${Object.keys(rt.S).length} staggers, 5 eases, tempo ${rt.tempo}`);
      const missing = Object.entries(rt.eases).filter(([, v]) => v == null).map(([n]) => n);
      V("MC-09a.eases", missing.length === 0, missing.length ? `not registered: ${missing.join(", ")}` : `rv.out(0.5)=${rt.eases["rv.out"]}, dtIn(0.5)=${rt.eases.dtIn}, domus.inOut(0.5)=${rt.eases["domus.inOut"]}`);
    }
    const cv = S.consoleVerdict(consoleMsgs);
    V("console", cv.clean && cv.warnings.length === 0, `${cv.errors.length} errors, ${cv.warnings.length} warnings`, cv.errors.concat(cv.warnings).slice(0, 5));
    await context.close();
  } catch (e) {
    out.error = String((e && e.stack) || e);
    console.log("ERROR", out.error);
  } finally { await browser.close(); }
}
S.writeJSON(path.join(dir, "tokens.json"), out);
const fails = out.verdicts.filter((v) => v.verdict === "FAIL").length;
console.log(`tokens: ${total} hit(s), ${out.allowed.length} allowlisted, ${fails} FAIL · ${path.join(dir, "tokens.json")}`);
process.exitCode = fails || out.error ? 1 : 0;

// scripts/check-claims.mjs — helper gate for WP-1 (REDESIGN-SPEC §J).
//
// Extracts every number-like token from the content layer (dict.ts, works.ts,
// findings.ts, career.ts) and checks that it appears in PRODUCT.md §3 or §9 (the
// CV transcription). Prints the misses with the file and a snippet of context.
// Tokens are normalised so "48,000" / "48.000", "1,9" / "1.9" and "6 " / "six"
// compare equal (the CV spells many figures out: "eight tools", "six-phase").
//
// Whitelist: years and month/period tokens, hex, spec-only figures (phase count
// "6", "4 more line items", capture dimensions) and metadata that is not a claim.
// The Golden Hour entries (eyebrow numbering, Sardinia coordinates) went out with
// the legacy dictionary sections in WP-9.
// Run: node scripts/check-claims.mjs   (exit 1 on an unexplained miss)

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const CONTENT_FILES = ["src/content/dict.ts", "src/content/works.ts", "src/content/findings.ts", "src/content/career.ts"];

// ── PRODUCT.md truth: §3 (fatti pubblicabili) + §9 (CV) ────────────────────
const product = read("PRODUCT.md");
const sliceSection = (heading, nextHeading) => {
  const a = product.indexOf(heading);
  const b = nextHeading ? product.indexOf(nextHeading, a + 1) : product.length;
  if (a < 0) throw new Error(`PRODUCT.md: heading not found: ${heading}`);
  return product.slice(a, b < 0 ? product.length : b);
};
const truthText = sliceSection("## 3.", "## 4.") + "\n" + sliceSection("## 9.");

// Number words the CV uses instead of digits.
const WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, fifty: 50,
  uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  quattordici: 14, diciassette: 17, cinquanta: 50,
};

/** "48,000" → "48000"; "1,9" → "1.9"; "4,75" → "4.75"; "52%" → "52". */
function normalise(tok) {
  let t = tok.replace(/[%$€]/g, "");
  // thousands separators: digit groups of three after a comma/period ("48,000", "80.000", "120.000")
  if (/^\d{1,3}([,.]\d{3})+$/.test(t)) t = t.replace(/[,.]/g, "");
  // decimal comma → decimal point ("1,9", "4,75")
  else if (/^\d+,\d+$/.test(t)) t = t.replace(",", ".");
  return t;
}

/** All numeric tokens of a text (digits, optional decimals/thousands), normalised. */
function numbersIn(text) {
  const out = new Set();
  for (const m of text.matchAll(/\d+(?:[.,]\d+)*/g)) out.add(normalise(m[0]));
  return out;
}

const truth = numbersIn(truthText);
// add the spelled-out numbers of the CV as digits
for (const m of truthText.toLowerCase().matchAll(/\b([a-z]+)\b/g)) if (WORDS[m[1]] != null) truth.add(String(WORDS[m[1]]));
// "two-thirds" → 2/3 already covered by "two"/"three"; "20+" → 20 covered by the regex.

// ── Whitelist (not claims) ─────────────────────────────────────────────────
const WHITELIST = new Set([
  // phase count / band counter / spec-only UI figures
  "6", // "{n} / 6" — also a CV figure (six-phase), kept explicit
  "4", // "4 more line items" (9 works − 5 rows)
  "1600", "1000", // capture dimensions (WP-7)
  // /styleguide — figures of the design contract, not claims about the work
  "4.5", // AA threshold for normal text
  "1.18", // STAMP impact scale
  "3.5", // stamp rotation
]);
const YEAR = /^(19|20)\d{2}$/;

// ── Scan ───────────────────────────────────────────────────────────────────
let misses = 0;
/** Drop block comments and whole-line `//` comments: only copy and data are claims. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/[^\n]*/gm, (c) => " ".repeat(c.length));
}

for (const file of CONTENT_FILES) {
  const src = stripComments(read(file));
  const seen = new Set();
  // digits glued to a letter on the left are identifiers ("a11y", "ES2024"), not figures
  for (const m of src.matchAll(/(?<![A-Za-z])\d+(?:[.,]\d+)*/g)) {
    const raw = m[0];
    const tok = normalise(raw);
    if (YEAR.test(tok) || WHITELIST.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    // skip tokens that are part of an identifier/version/path/url ("React 19", "Next.js 16", "/captures/…-1600")
    const before = src.slice(Math.max(0, m.index - 24), m.index);
    const after = src.slice(m.index + raw.length, m.index + raw.length + 24);
    const isTech = /(React|Next\.js|Postgres|PostGIS|Tailwind v|ES|Dynamics|Angular|Sentry ×|three\s|Serwist|-|\/|_)\s?$/.test(before) && !/→/.test(after);
    if (truth.has(tok)) continue;
    if (isTech) continue; // versions / stack names live in §9 SKILLS anyway; false positives are not claims
    misses++;
    const line = src.slice(0, m.index).split("\n").length;
    console.log(`MISS  ${file}:${line}  "${raw}"  …${before.trim()}[${raw}]${after.trim()}…`);
  }
}

if (misses === 0) console.log(`check-claims: OK — every number in ${CONTENT_FILES.length} content files is in PRODUCT.md §3/§9 (or whitelisted).`);
else {
  console.log(`check-claims: ${misses} unexplained number(s) — see above.`);
  process.exit(1);
}

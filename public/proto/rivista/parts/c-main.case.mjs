/* ==========================================================================
   parts/c-main.case.mjs · the case template and the gallery steps (spec 50 §4, rewritten from zero)

   render(c, ctx)      → the <main> content of one case page: the opener (the scene "case": the text, then the work's
                         plate, which holds its capture or its key words; in plain flow the picture as a plain image),
                         its chapters, the record, "More work"
   renderTile(c, ctx)  → that work's step in the Work page's gallery scene ({{RAIL}} in c-main.work.html)
   tx(v, lang)         → a copy field in the reader's language: a plain string is an invariant (a name, a stack),
                         { en, it } a twin; a missing twin falls back to en
   barWidths(r)        → the geometry of a before → after row (read by scripts/check-claims-proto.mjs)
   hasCase(w)          → (wave 7, lane WORKS) whether a work opens a case page of its own. A work with "page" (a key of
                         the site's page table: Obla, "obla") is a page of the site already: its plate opens that page
                         ({{LINK:<page>}}, named on the cut's sheet as the menu names it) and it has no case page
   nextCase(all, c)    → the case page after c in the gallery's order, cycling, passing over a work with a page of its own
   workLink(w, lang)   → the attributes of a link to a work: its case page with its name and "NN · Work", or its page

   Pure: no Date, no randomness, no file reads. assemble.mjs resolves the media (a capture that is not on disk becomes
   the work's key words) and passes the resolved case. Every word and number comes from cases.json or strings.mjs,
   escaped here; the template prints no digit except the indices (the works' tiles, 01–11, and their count; a
   chapter's and a list's 01–09) and the bar geometry inside aria-hidden style attributes. A caption names its picture,
   never numbers it.
   ========================================================================== */
import STR, { UI as UI_STR } from "./strings.mjs";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ESC[ch]);

export function tx(v, lang = "en") {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "t" in v && !("en" in v)) return tx(v.t, lang);
  return (lang && v[lang]) || v.en || "";
}
const T = (v, lang) => esc(tx(v, lang));
const pad2 = (n) => (n < 10 ? "0" : "") + n;
/* "a · b · c" in the data: one inline list, the items kept whole */
const items = (s) => `<ul class="tools">${String(s).split(" · ").map((x) => "<li>" + esc(x) + "</li>").join("")}</ul>`;
const lines = (arr, L) => arr.map((l) => `<span class="ln">${T(l, L)}</span>`).join("");
/* a caption's first part (the data carries no "Fig. NN" folio since the y round) */
const capText = (v, L) => tx(v, L);

const ARROW_NE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const ARROW_E = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

const href = (slug) => "case-" + slug + ".html";
const capSrc = (stem, w) => "/captures/" + stem + "-" + w + ".webp";
const srcset = (stem) => capSrc(stem, 800) + " 800w, " + capSrc(stem, 1600) + " 1600w";
export const UI = UI_STR;

/* ------------------------------------------------------------ the works and their links (wave 7, lane WORKS) */
export const hasCase = (w) => !w.page;
export function nextCase(all, c) {
  const i = all.findIndex((w) => w.slug === c.slug);
  for (let k = 1; k <= all.length; k++) { const w = all[(i + k) % all.length]; if (hasCase(w)) return w; }
  return c;
}
/* the build replaces {{LINK:<page>}} (assemble.mjs link(), web/src/lib/site.mjs link()): the page's address, the cut's
   direction, the page's name and index on the sheet */
export const workLink = (w, lang = "en") => (hasCase(w)
  ? `href="${href(w.slug)}" data-pt-label="${esc(w.label)}" data-pt-sub="${w.tile} · ${T(UI.work, lang)}"`
  : `{{LINK:${w.page}}}`);

/* ------------------------------------------------------------ the opener: the scene "case" (stage/scenes/case.js)
   Two blocks in the scene grammar: "what it is" (the text in the left column, the work's plate in the figure's half)
   and "look at it" (the plate turned to the reader, its caption and link beside it). In plain flow (no WebGPU, reduced
   motion, no script, print) the two blocks are the page as before: the text, then the real picture. */
function hero(c, ctx) {
  const L = ctx.lang;
  const over = c.overline.map((o) => T(o.t, L)).join('<span aria-hidden="true"> · </span>');
  const act = [];
  if (c.cta) act.push(`<a class="btn" href="${esc(c.cta.href)}" rel="noopener">${T(c.cta.label, L)} ${ARROW_NE}</a>`);
  act.push(`<a class="q" {{LINK:work}}>${T(ctx.ui.allWork, L)} ${ARROW_E}</a>`);
  const fields = (c.fields || []).length
    ? `\n            <dl class="cs-fields">${c.fields.map((f) => `<div><dt class="t-label">${T(f.k, L)}</dt><dd class="t-label t-ink">${T(f.v, L)}</dd></div>`).join("")}</dl>` : "";
  return `  <section class="sc sc-left cs-sc" data-stage="case" style="--steps:2" aria-labelledby="case-h">
    <div class="sc-view" data-stage-anchor="case" aria-hidden="true"></div>
    <div class="sc-track">
      <div class="sc-step cs-hero" data-stage-step="1">
        <div class="sc-in">
          <p class="t-label t-acc cs-over" data-focus="load">${over}</p>
          <h1 id="case-h" class="t-d1 cs-title" data-focus-lines="load">${lines(c.titleLines, L)}</h1>
          <div class="cs-intro">
            <p class="t-lead cs-lead" data-focus="load" style="--fd:160ms">${T(c.lead.t, L)}</p>
            <div class="cs-side-act" data-focus="load" style="--fd:240ms">
              <p class="cs-act">${act.join("")}</p>${fields}
            </div>
          </div>
        </div>
      </div>
${picture(c, ctx)}    </div>
  </section>
`;
}

/* the work's picture: its capture as a plain image, or its key words (figure and line) when it has none. The picture
   is the plate's texture in scene mode ([data-slab] / [data-slab-words], the same as its gallery step) and the printed
   picture otherwise ([data-stage-poster]); the caption stays beside the plate */
function keyWords(f, L, cls) {
  return `<div class="${cls}"><p class="${cls}-fig">${T(f.figure, L)}</p><p class="t-label ${cls}-line">${T(f.figLine, L)}</p></div>`;
}
function picture(c, ctx) {
  const L = ctx.lang, f = c.fig;
  const cap = f.caption ? `<figcaption class="t-label cs-cap">${esc(capText(f.caption[0], L))}${f.caption[1] ? `<span> ${T(f.caption[1], L)}</span>` : ""}</figcaption>` : "";
  const step = (inner) => `      <div class="sc-step cs-look" data-stage-step="2">
        <div class="sc-in">
${inner}        </div>
      </div>
`;
  if (f.kind === "capture") {
    // with a link the caption's words are one box and the link another, so a link that wraps starts at the left edge
    const link = f.link ? `<a class="q" href="${esc(f.link.href)}" rel="noopener">${T(f.link.verb, L)} ${ARROW_NE}</a>` : "";
    const capL = cap && link ? cap.replace('class="t-label cs-cap">', 'class="t-label cs-cap has-q"><span class="cs-cap-t">').replace("</figcaption>", "</span>" + link + "</figcaption>") : cap;
    // the plate may hold the picture cropped to a framing (plateCrop: x0 y0 x1 y1, fractions; a wide diagram's margins)
    const crop = Array.isArray(f.plateCrop) && f.plateCrop.length === 4 ? ` data-slab-crop="${f.plateCrop.map((v) => +v).join(" ")}"` : "";
    return step(`          <figure class="cs-pic${f.contain ? " is-contain" : ""}" data-case-hero>
            <img data-slab="${esc(c.slug)}" data-stage-poster${crop} src="${capSrc(f.stem, 1600)}" srcset="${srcset(f.stem)}" sizes="(min-width:1024px) 92vw, 100vw" alt="${T(f.alt, L)}"${f.pos ? ` style="object-position:${esc(f.pos)}"` : ""} decoding="async" fetchpriority="high">
            ${capL}
          </figure>
`);
  }
  return step(`          <figure class="cs-pic is-words">
            <div class="cs-words" data-slab-words="${esc(c.slug)}" data-stage-poster>${keyWords(f, L, "cs-plate")}</div>
            ${cap}
          </figure>
`);
}

/* ------------------------------------------------------------ chapters */
function chapter(n, ch, L, body, cls = "") {
  const lead = ch.lead ? `\n        <p class="t-lead cs-lead2">${T(ch.lead.t, L)}</p>` : "";
  return `  <section class="cs-ch${cls ? " " + cls : ""}" aria-labelledby="c${n}-h">
    <p class="t-label cs-folio"><span class="t-acc">${pad2(n)}</span> ${T(ch.eyebrow, L)}</p>
    <div class="cs-body">
      <h2 id="c${n}-h" class="t-d2 cs-h">${lines(ch.headline, L)}</h2>${lead}
${body}    </div>
  </section>
`;
}

function chWhat(n, ch, ctx) {
  const L = ctx.lang;
  let rep = "";
  if (ch.replaced) {
    rep = `      <ul class="cs-rep" aria-label="${T(ch.replaced.aria, L)}">${ch.replaced.tools.map((t) => `<li><s>${esc(t)}</s></li>`).join("")}</ul>
      <p class="t-d2 cs-by"><span aria-hidden="true">→ </span><span class="sr-only">${T(ch.replaced.srBy, L)} </span>${esc(ch.replaced.by)}</p>
`;
  }
  const lead = `      <p class="t-lead">${T(ch.lead.t, L)}</p>\n`;
  const stack = `      <div class="cs-stack"><p class="t-label">${T(ch.stack.label, L)}</p>${items(tx(ch.stack.t, L))}</div>\n`;
  return chapter(n, Object.assign({}, ch, { lead: null }), L, rep + lead + stack, "cs-what");
}

/* a measured row: before → after, or one value; the bars are geometry (aria-hidden): a percentage is its own width,
   a time pair is drawn against its before (100 %) */
export function barWidths(r) {
  const num = (s) => parseFloat(tx(s).replace(",", "."));
  if (r.value != null) return [tx(r.value).trim().endsWith("%") ? num(r.value) : 100];
  const pct = /%\s*$/.test(tx(r.from)) && /%\s*$/.test(tx(r.to));
  if (pct) return [num(r.from), num(r.to)];
  return [100, Math.round((num(r.to) / num(r.from)) * 1000) / 10];
}
function metric(r, L, ui) {
  const w = barWidths(r);
  const n = r.value != null
    ? `<span class="to">${T(r.value, L)}</span>`
    : `<span class="from">${T(r.from, L)}</span><span class="arr" aria-hidden="true">→</span><span class="sr-only">${T(ui.to, L)}</span><span class="to">${T(r.to, L)}</span>`;
  const bars = r.value != null
    ? `<i class="is-after" style="--w:${w[0]}%"></i>`
    : `<i style="--w:${w[0]}%"></i><i class="is-after" style="--w:${w[1]}%"></i>`;
  const low = r.lower ? `<span class="mx-low">${T(ui.lower, L)}</span>` : "";
  const tiny = r.tiny ? `<p class="mx-tiny">${T(ui.tiny, L)}</p>` : "";
  return `          <li class="metric"><p class="mx-l">${T(r.label, L)}${low}</p><p class="mx-n">${n}</p><div class="mx-bars" aria-hidden="true">${bars}</div>${tiny}</li>\n`;
}
function rows(ch, ctx) {
  const L = ctx.lang;
  return `      <p class="t-label cs-basis">${T(ch.basis.t, L)}</p>
      <ol class="mx rows">
${ch.rows.map((r) => metric(r, L, ctx.ui)).join("")}      </ol>
`;
}

function chTeaser(n, ch, ctx) {
  const L = ctx.lang, to = ctx.all.find((x) => x.slug === ch.link.to);
  const more = `      <p class="cs-more-go"><a class="q" ${workLink(to, L)}>${T(ch.link.label, L)} ${ARROW_E}</a></p>\n`;
  return chapter(n, ch, L, rows(ch, ctx) + more, "cs-teaser");
}
function chMeasured(n, ch, ctx) {
  return chapter(n, ch, ctx.lang, rows(ch, ctx), "cs-measured");
}

function numbered(list, L) {
  return `      <ol class="cs-list rows">
${list.map((it, i) => `        <li><span class="t-label t-acc">${pad2(i + 1)}</span><span class="t-body t-ink">${T(it.t, L)}</span></li>`).join("\n")}
      </ol>
`;
}
/* (wave 6, TITLES) the stills drawn from a vector source (/captures/<stem>.svg beside the picture, written by
   scripts/media/vpp-plate.mjs): in the live state their lines draw themselves once as they come into view
   (fx-motion.js trace); every printed state shows the picture whole */
const TRACED = new Set(["agricultural-supply-chain-detail"]);
function still(it, L, lead) {
  return `        <figure class="cs-still${lead ? " is-lead" : ""}"${TRACED.has(it.stem) ? " data-trace" : ""}><img src="${capSrc(it.stem, 1600)}" srcset="${srcset(it.stem)}" sizes="(min-width:1024px) ${lead ? "64vw" : "32vw"}, 100vw" alt="${T(it.alt, L)}" loading="lazy" decoding="async"><figcaption class="t-label cs-cap">${esc(capText(it.caption[0], L))}${it.caption[1] ? `<span> ${T(it.caption[1], L)}</span>` : ""}</figcaption></figure>\n`;
}

function chFacts(n, ch, ctx) {
  const L = ctx.lang;
  let b = `      <ol class="cs-facts rows">
${ch.items.map((f) => `        <li class="cs-fact"><p class="cs-fact-n">${esc(tx(f.num, L))}</p><div><h3 class="t-body t-ink cs-fact-t">${T(f.title, L)}</h3><p class="t-body">${T(f.body, L)}</p></div></li>`).join("\n")}
      </ol>
`;
  if (ch.after) b += `      <p class="t-body cs-after">${T(ch.after.t, L)}</p>\n`;
  if (ch.plates) {
    const odd = ch.plates.items.length % 2 === 1;
    b += `      <div class="cs-stills"><p class="t-label">${T(ch.plates.label, L)}</p>
${ch.plates.items.map((it, i) => still(it, L, odd && i === 0)).join("")}      </div>
`;
  }
  if (ch.list) b += `      <p class="t-label cs-basis">${T(ch.listLabel, L)}</p>\n` + numbered(ch.list, L);
  return chapter(n, ch, L, b);
}

function chList(n, ch, ctx) {
  const L = ctx.lang;
  let b = "";
  if (ch.figure) b += `      <div class="cs-stills">\n${still(ch.figure, L, true)}      </div>\n`;
  if (ch.label) b += `      <p class="t-label cs-basis">${T(ch.label, L)}</p>\n`;
  b += numbered(ch.items, L);
  return chapter(n, ch, L, b);
}

/* a flow: the ordered list itself is the drawing, ruled boxes joined by arrows */
function chSchematic(n, ch, ctx) {
  const L = ctx.lang;
  const nodes = ch.nodes.map((nd, i) => {
    const sub = nd.sub ? `<span class="t-body cs-node-sub">${T(nd.sub, L)}</span>` : "";
    const ph = nd.phases ? `<span class="cs-node-ph" aria-hidden="true">${Array.from({ length: nd.phases }, (_, k) => `<i>${pad2(k + 1)}</i>`).join("")}</span>` : "";
    return `        <li class="cs-node"><span class="t-label t-acc">${pad2(i + 1)}</span><span class="cs-node-t">${T(nd.t, L)}</span>${sub}${ph}</li>`;
  }).join("\n");
  const outs = ch.outcomes ? `      <div class="cs-out"><p class="t-label">${T(ch.outcomesLabel, L)}</p><ul class="cs-out-l">${ch.outcomes.map((o) => `<li class="t-body">${T(o.t, L)}</li>`).join("")}</ul></div>\n` : "";
  const cap = ch.caption ? `      <p class="t-label cs-cap">${esc(capText(ch.caption[0], L))}${ch.caption[1] ? `<span> ${T(ch.caption[1], L)}</span>` : ""}</p>\n` : "";
  return chapter(n, ch, L, `      <ol class="cs-flow">
${nodes}
      </ol>
${outs}${cap}`, "cs-schematic");
}

/* the record: rows of a definition list, a declared gap printed as a field */
function chOnFile(n, c, ctx) {
  const L = ctx.lang;
  const rows = c.onFile.map((o) => `        <div${o.gap ? ' class="is-gap"' : ""}><dt class="t-label">${T(o.k, L)}</dt><dd class="t-body t-ink">${esc(tx(o.v, L)).split(" · ").join('<span aria-hidden="true"> · </span>')}</dd></div>`).join("\n");
  return `  <section class="cs-ch cs-rec" aria-labelledby="c${n}-h">
    <h2 id="c${n}-h" class="t-label cs-folio"><span class="t-acc">${pad2(n)}</span> ${T(ctx.ui.onFile, L)}</h2>
    <div class="cs-body">
      <dl class="cs-dl rows">
${rows}
      </dl>
    </div>
  </section>
`;
}

/* More work: every work, in gallery order; this case is marked and is not a link, the next case says so (its link is
   .cs-next: assemble.mjs walks those links, one cycle through the case pages); a work with a page of its own (Obla)
   is a row like the others, its link that page */
function chMore(c, ctx) {
  const L = ctx.lang;
  const list = ctx.all.map((w) => {
    const here = w.slug === c.slug, nx = w.slug === ctx.next.slug;
    const inner = `<span class="t-label t-acc">${esc(w.tile)}</span><span class="t-d2 cs-more-t">${esc(w.label)}</span><span class="t-body cs-more-k">${T(w.rail.kicker, L)}</span><span class="t-label cs-more-v">${here ? T(ctx.ui.thisCase, L) : T(nx ? ctx.ui.next : ctx.ui.open, L)}</span>`;
    return here
      ? `      <li aria-current="page" class="is-here"><span class="cs-more-a">${inner}</span></li>`
      : `      <li><a class="cs-more-a${nx ? " cs-next" : ""}" ${workLink(w, L)}>${inner}</a></li>`;
  }).join("\n");
  return `  <section class="cs-more next" aria-labelledby="more-h">
    <h2 id="more-h" class="t-label cs-folio">${T(ctx.ui.more, L)}</h2>
    <ol class="cs-more-list rows">
${list}
    </ol>
  </section>
`;
}

const CH = { what: chWhat, teaser: chTeaser, measured: chMeasured, facts: chFacts, list: chList, schematic: chSchematic };

export function render(c, ctx0) {
  const ctx = Object.assign({ lang: "en", ui: UI }, ctx0);
  const out = [hero(c, ctx), "\n"];
  c.chapters.forEach((ch, i) => {
    const f = CH[ch.type];
    if (!f) throw new Error(`case ${c.slug}: unknown chapter type ${ch.type}`);
    // data-ch: the chapter's type, read by the stage's chapters (stage/scenes/case/figures.js: a figure of light per type)
    out.push(f(i + 1, ch, ctx).replace("<section ", `<section id="c${i + 1}" data-ch="${ch.type}" `), "\n");
  });
  const nOn = c.chapters.length + 1;
  out.push(chOnFile(nOn, c, ctx).replace("<section ", `<section id="c${nOn}" `), "\n");
  out.push(chMore(c, ctx));
  return out.join("");
}

/* ------------------------------------------------------------ the gallery step (Work page) */
/* ctx.all: every work, in gallery order (the counter prints "NN / their count"). A work with a page of its own opens
   that page ("Open its page") */
export function renderTile(c, ctx0) {
  const ctx = Object.assign({ lang: "en", ui: UI }, ctx0), L = ctx.lang, f = c.fig, cap = f.kind === "capture";
  const n = parseInt(c.tile, 10), id = "t" + c.tile;
  const pic = cap
    ? `<figure class="wk-pic" data-stage-poster><img data-slab="${esc(c.slug)}" src="${capSrc(f.stem, 1600)}" srcset="${srcset(f.stem)}" sizes="(min-width:1024px) 46vw, 100vw" alt="${T(c.rail.alt || f.alt, L)}" loading="lazy" decoding="async"></figure>`
    : `<div class="wk-pic is-words" data-slab-words="${esc(c.slug)}" data-stage-poster>${keyWords(f, L, "wk-words")}</div>`;
  return `        <li class="sc-step wk" data-stage-step="${n}" data-tile-id="${c.tile}">
          <div class="sc-in">
            <p class="t-label wk-n"><span class="t-acc">${c.tile}</span> / ${pad2((ctx.all || [c]).length)}</p>
            <p class="t-label wk-kind">${T(c.rail.kicker, L)}</p>
            <h2 id="${id}-t" class="t-d2 wk-name">${esc(c.label)}</h2>
            <p class="t-body wk-line">${T(c.rail.body, L)}</p>
            <p class="wk-go"><a class="q" ${workLink(c, L)} aria-describedby="${id}-t">${T(hasCase(c) ? ctx.ui.openCase : ctx.ui.openPage, L)} ${ARROW_E}</a></p>
          </div>
          ${pic}
        </li>
`;
}

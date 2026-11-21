/* ==========================================================================
   parts/c-main.home.mjs · the home as one continuous scroll (wave 7, lane HOME; the director's decisions 1-3 of
   2026-11-20, after Alberto: «vorrei che fosse una pagina singola con uno scroll continuo, tutta un unica esperienza
   nella home. ovviamente le pagine devono rimanere separate se uno clicca work o dall'url»)

   homeMain(read) → the home's <main>: the cover's first screen (b-hero.html: the name, the home's one h1) and Now
   (c-main.index.html), then every page's own part in the menu's order (HOME), read from the very partial the page
   prints: one source, no copy of a page's markup. Each part is a named section, section.part[data-part=KEY], whose
   accessible name is the page's name (the menu's word). The page prints the same part in main[data-part=KEY]
   (partMain), so one rule in css/page-*.css (html [data-part="KEY"] …) holds on the page and on its part in the home.
   In the home a part's opener is an h2 (the name is the h1) and its first screen's entrances ([data-focus="load"],
   [data-focus-lines="load"]) come in when they enter the view instead of on load (asPart): the same look and the
   same hooks, played where the reader meets them. No dawn close between the parts: the home ends with Contact's
   morning and its legal line (c-footer.contact.html), the one crossing of the day's straight edge.
   The case pages are not in the home (the gallery's plates open them); the cover's index is gone.
   Both builds compose the home here: public/proto/rivista/assemble.mjs and web/src/lib/site.mjs.
   ========================================================================== */

/* the parts after the cover's own scenes, in the menu's order: the page's key (ISSUE in both builds, html[data-page]
   on the page), the partial both print, the strings.mjs id of the page's name (the part's accessible name) */
export const HOME = [
  { key: "work", part: "c-main.work.html", label: "sec.work" },
  { key: "about", part: "c-main.about.html", label: "sec.about" },
  { key: "consult", part: "c-main.consult.html", label: "sec.consult" },
  { key: "obla", part: "c-main.obla.html", label: "sec.obla" },
  { key: "contact", part: "c-main.contact.html", label: "sec.contact" },
];

/* a page's own main: its part, named as the home names it */
export const partMain = (key) => `<main id="main" data-part="${key}">`;

/* a page's part as the home holds it: its opener an h2, its first screen's entrances played in view */
export const asPart = (html) => html
  .replace(/<h1(?=[\s>])/g, "<h2").replace(/<\/h1>/g, "</h2>")
  .replace(/(\sdata-focus(?:-lines)?)="load"/g, "$1");

/* the home's main. read(name) is the build's reader of a partial (its text, ending with a line break) */
export function homeMain(read) {
  return '<main id="main">\n' + read("b-hero.html") + read("c-main.index.html")
    + HOME.map((p) => `<section class="part" data-part="${p.key}" aria-label="{{t:${p.label}}}">\n` + asPart(read(p.part)) + "</section>\n").join("")
    + "</main>\n";
}

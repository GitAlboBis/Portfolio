/* ==========================================================================
   parts/c-main.404.mjs · the 404 in the night's system (spec 50 §4)

   render404(cases, { tx, lang }) → the <main> content of 404.html: the status, the title, a sentence, the way back
   to the home page (wave 8: the home holds no index any more, so nothing here names one), then every page (its
   sentence) and every work, as rows of links. No stage on this page
   (html[data-nogl]). COPY: parts/strings.mjs ("nf.*", the pages' "ix.*"); the works' names and kickers from cases.json.
   The works are every work in the gallery's order; a work with a page of its own (Obla) links that page (workLink,
   parts/c-main.case.mjs).
   ========================================================================== */
import { S404 } from "./strings.mjs";
import { workLink } from "./c-main.case.mjs";
export { S404 };

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ESC[ch]);
const ARROW_E = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const ARROW_NE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

export function render404(cases, { tx, lang = "en" }) {
  const T = (v) => esc(tx(v, lang));
  const P = [["work", "01", S404.pages.work], ["about", "02", S404.pages.about], ["consult", "03", S404.pages.consult], ["obla", "04", S404.pages.obla], ["contact", "05", S404.pages.contact]];
  const row = (attrs, n, name, line) => `        <li><a class="ix-a" ${attrs}><span class="t-label ix-n">${n}</span><span class="t-d2 ix-t">${name}</span><span class="t-body ix-k">${line}</span><span class="q ix-v">${T(S404.open)} ${ARROW_E}</span></a></li>`;
  const pages = P.map(([k, n, p]) => row(`{{LINK:${k}}}`, n, T(p[0]), T(p[1]))).join("\n");
  const works = cases.map((c) => row(workLink(c, lang), esc(c.tile), esc(c.label), T(c.rail.kicker))).join("\n");
  return `  <section class="nf" aria-labelledby="nf-h">
    <p class="t-label t-acc nf-over" data-focus="load">${T(S404.over)}</p>
    <h1 id="nf-h" class="t-mega nf-h" data-focus="load" style="--fd:80ms">${T(S404.title)}</h1>
    <p class="t-lead nf-lead" data-focus="load" style="--fd:160ms">${T(S404.lead)}</p>
    <p class="nf-act" data-focus="load" style="--fd:240ms"><a class="btn" href="index.html" data-back data-pt-label="${T(S404.home)}" data-pt-sub="Alberto Tuveri">${T(S404.back)} ${ARROW_E}</a><a class="q" href="mailto:albertotuveri@gmail.com">${T(S404.write)} ${ARROW_NE}</a></p>
  </section>

  <section class="nf-ix" aria-labelledby="nf-ix">
    <h2 id="nf-ix" class="t-label">${T(S404.pagesTitle)}</h2>
    <ol class="ix-rows rows nf-rows">
${pages}
    </ol>
    <h3 class="t-label nf-works">${T(S404.work)}</h3>
    <ol class="ix-rows rows nf-rows">
${works}
    </ol>
  </section>
`;
}

# l-works (WORKS, wave 7): SerSan Agent OS and Obla join Work

1. Task: two works join Work. SerSan Agent OS (for SerSan, leads the SerSan works, a case page in EN and IT) and Obla (his own project, opens the projects outside SerSan, links to obla.html, no case page). Plates by words, no number on a plate.
2. Owned: parts/cases.json, parts/strings.mjs, c-main.work.html, c-main.case.mjs, c-main.404.mjs, PRODUCT.md §3, assemble.mjs and web/scripts/asserts.mjs where they count works, web/src/lib/site.mjs (the list of cases), og/ for the new cards. Never stage/** or fx-*.js. Also touched because they count the works: the hand-written proof links in c-main.about.html and c-main.consult.html (tiles renumbered, Agent OS linked, as CONTENT handed on), scripts/check-claims-proto.mjs, scripts/media/og-card-jobs.mjs.
3. Gates: assemble, --check, claims; Astro build into .shots/l-works/dist with parity, asserts, claims; release self-check; og-cards on port 5392 (stopped after).
4. Look (headless): Work 1440 and 390 with ?stage=0 and once with the stage, the new case EN and IT, More work, the 404, the home's Work part; 1:1 crops of the new plates' words.
5. State: run 1 DONE (20 Nov, ~23:05). All gates green on the final tree, two share cards drawn, look done (headless, server on 5392 stopped by pid 22920, port free, no Chrome left). Not committed: the director commits.
6. Run 2 (resume, 20 Nov, 23:05-23:30): DONE. (a) The stale "nine"/"32" in code comments of my files is fixed: assemble.mjs, web asserts.mjs and parity.mjs, MainWork.astro, [...page].astro, c-main.home.mjs, css/case.css. No page or fx.css changed (--check exit 0). The documents and the stage/** comments are listed for DOCS and STAGE below. (b) I re-read the new Italian and changed three things in cases.json: two phrases, plus no-break spaces in one node. The IT share card was redrawn. (c)-(f) are notes only. Gates and look are green again; the server on 5392 is stopped (pid 21628) and no Chrome is left.

## Run 2 (resume)

- Italian, cases.json (sersan-agent-os):
  - The tile line (rail.body) said «passaggi di consegna sotto un freno», a calque of the English. It now says «con un freno», as the case lead and Consulting 04 do. That line also shows in the home's Work part and on the share card. The IT card was redrawn: `og-cards.mjs it/sersan-agent-os`.
  - The facts lead now has a subject: «Il sistema gira su macchine di sviluppo». That sentence carries the status.
  - Router node, EN and IT: no-break spaces in "Claude API", "Agent SDK" and "Claude Code". At 1440 the IT line used to break "Claude / API". Checked at 1440, 1024, 1920 and 390.
  - I kept «Claude API» without an article. That follows DESIGN.md's rule that product names stay as they are, matches «Claude Code» in the same list and «su Claude API» in PRODUCT §3 item 10. Alberto may prefer «l'API di Claude».
- Gates on the final tree (23:19): assemble 0, --check 0 ("11 works, 10 with a case page"), claims OK (34 pages, 11 cases, 17 IT pages), --selftest ok. Astro into .shots/l-works/dist: 34 pages, PARITY OK (147 shared, 0 differ), asserts ok (1154 references), claims on the build OK. Release: exit 0, 34 pages (32 in the sitemap), 156 files.
- Look (`r2-d/`, `r2-m/`, `on-d/it-*`, `on-m/it-*`, `r2-*-router-node.png`, `r2-m/it-c3-lead-viewport-*.png`): 45 + 45 stills, none flagged (text under 15 px, hidden, overflow, console). I read the IT tile 01 at both sizes, the home's tile 01, chapter 03, the nodes, Work and the case with the stage on in IT, More work, the 404, the home's tiles 01 and 08, and the 1:1 crops of the etched plates.
- Found, not mine, so handed on:
  - The stage's etch wraps greedily (gallery.js:171, case/etch.js:24), so the IT Obla plate leaves «ME» alone on its second row.
  - The etched line is 0.27 × the figure's size, so under a long figure («Autonomia meritata», as under «Sotto il secondo») it runs to about 7 css px cap height at 1440.
  - With the stage off at 1440, the IT tile 01 line leaves «GUADAGNATO» alone on its last row. The fix is `text-wrap: pretty` on `.wk-words-line` in css/page-work.css.

## Gates (final tree, fresh run)

assemble exit 0 · --check exit 0 ("11 works, 10 with a case page, 6 on a capture; 167 strings") · claims OK (34 pages, 11 cases' citations, 17 Italian pages) · --selftest ok (3 seeds fail, clean passes; seeding "11" or "2,513" on another case still fails) · Astro build into .shots/l-works/dist exit 0 (34 pages) · PARITY OK (147 shared files the same) · asserts ok (1154 references) · claims on the build OK · `VERCEL_ENV=production node web/scripts/release.mjs` exit 0: 34 pages, 32 in sitemap.xml (case-sersan-agent-os in both editions; obla.html as before), 156 files, robots "index, follow".

## Share cards

`node scripts/media/og-cards.mjs sersan-agent-os it/sersan-agent-os` (RV_BASE on 5392). The Italian key words were "Autonomia guadagnata" first: 20 capitals overran the card's fit (min 60 px) to the right edge; now "Autonomia meritata" (the line keeps "guadagnato"). Both cards read.

## Looked (`.shots/l-works/`)

- `d/`, `m/` (?stage=0, 1440 and 390 DPR 2, EN and IT): Work head, tiles 01, 07, 08, 11, the two plates' words 1:1; the new case's opener, plate, five sections, More work; Brand film's More work (07 this case, 08 Obla "Open", 09 Badante24h "Next"); the 404's list; the home's Work part; About 05 and Consulting 04 proofs. Report: no text under 15 px, nothing hidden, no overflow, no console error. (A tall element still stitches the fixed header and the skip link in: an artifact; the skip link is at -60 px at rest, `m/skipcheck`.)
- `on-d/`, `on-m/` (stage on): the gallery places eleven plates; both new plates etch cleanly (1:1 `on-d/plate-s01-1to1.png`, `plate-s08-1to1.png`). Opening frame at 1440: the first plate is now a clear words plate and SphereNode's capture shows through it ("EARNED AUTONOMY" over "Markets don't reward…", `on-d/en-work-s00-crop.png`). Phone: as for the old plates, the plate in step is out of the frame while its text is centred; the next one shows. The new case with the stage: plate, schematic plates per node, the facts' counts, More work's prism all draw; the opener's second block behaves as Badante24h's.

## For STAGE (needsElsewhere)

- gallery.js: eleven plates (was nine); the head's row of glass is crowded and a clear words plate (Agent OS) now leads it, so the capture behind reads through its etched words. Spacing / order / dimming of the opening row for eleven.
- Phone: the plate in step is out of frame when its text is centred (old behaviour, seen on Badante24h too).

## The model (wave 7)

- cases.json is every work in gallery order, tiles 01-11: 01 sersan-agent-os (new), 02 spherenode, 03 sphere-ai, 04 maintech-oma, 05 sersan-io, 06 domus-tua, 07 sersan-brand, 08 obla (new, `"page": "obla"`), 09 badante24h, 10 doit-voice-ai-agent, 11 agricultural-supply-chain.
- `"page": "<ISSUE key>"`: a work that is a page of the site already. Its plate, More work row and 404 row link `{{LINK:obla}}` (the page's own name and index on the cut's sheet); no case page, no share card. Helpers in c-main.case.mjs: `hasCase`, `nextCase` (the next case page, passing over Obla), `workLink`.
- Both builds: RESOLVED = every work (RAIL with `all`, More work, the 404); CASE_PAGES = works with a case page; next = nextCase.
- The gallery counter prints "NN / 11" from the count; `--steps:12` in c-main.work.html.
- check-claims: SCOPE_TABLE rows for the two (items 10/11 + their §9 bullets); `undici` among the number words; INDEX: a tile in its index span (.t-acc, .ix-n), the count after " / " in .wk-n, and "NN · Work" in data-pt-sub pass as indices (10 and 11 are not zero-padded). Seeding "11" or "2,513" on another case still fails.
- New asserts (assemble + web asserts): tiles count the works in order, the counter, one step per work, every case's More work and the 404 list every work in order, every link to a case page names its case and tile (catches the hand-written proofs of About and Consulting).
- PRODUCT.md: §3 item 10 got the four levels (L1 card, L2 timed window with Stop) and "segnali negativi", within line 40 (no line moved: cases.json cites by line); §1 "dieci pagine di caso"; §10 the proof now links the case (same two lines).

# k-fix2d — the copy and 2D defects (wave 8, lane FIX2D)

- Done: all five items and three more defects (below); both builds pass every gate; the release ran once; every change looked at (list at the end).
- Next: nothing of the brief is left. The director: see "Needs elsewhere".
- Decisions: below.
- How to run: from the worktree, `node public/proto/rivista/assemble.mjs`, `--check`, `node scripts/check-claims-proto.mjs`; Astro into `.shots/k-fix2d/dist` (from web/: build, parity, asserts, claims); serve with `python scripts/serve-static.py 5403 .shots/k-fix2d/dist public`.
- How to look: probes in `.shots/k-fix2d/_scripts/` (names.mjs: every scene name against the phone header's room; hdrnames.mjs: the header as the page shows it; diag.mjs, diagcap.mjs: the diagram in its chapter; plates.mjs, ovf.mjs: the words plates; nf.mjs: the 404; oblaf.mjs: Obla's fields; now.mjs: the home's Now), captures in `.shots/k-fix2d/`.

## Decisions

1. **No plate carries a number.** Maintech OMA's plate: «DEFAULT-DENY / on every table, permissions held in the database» (IT «Default-deny / su ogni tabella, permessi conservati nel database»; PRODUCT §3 item 2, P:137-138), caption «The security model / Nine roles, and it cannot be bypassed from the client.» (IT «Il modello di sicurezza / Nove ruoli, e non si può aggirare dal client.»). Badante24h's line: «geospatial caregiver search on PostGIS» (IT «… su PostGIS»), no «3». The Badante24h fig note now records the old line: the claims gate wants one of a node's numbers on its cited lines and the note's dates are not. Share cards redrawn (og-cards.mjs on 5403): maintech-oma and badante24h, EN and IT; og-manifest.json updated.
   Every other plate checked: the gallery, the home's Work part and the case openers carry words or captures only. The six capture works keep a numeric `plate` fallback in cases.json, used only if a capture's files are missing (never on the live site). Two stage figures still etch numerals (not my files, see Needs elsewhere): the case `list` figure (01–06 on its thin plates) and About's path panes (month and year: dates, by design).
2. **The 404.** Button «Back to the home page» / «Torna alla pagina iniziale» (`ui.backHome`, was `ui.backIndex`); the list's title «Pages» / «Pagine» (`nf.pages`, was `cut.index` «Index»); `cut.index` is gone from strings and from READ_BY_MODULES; `S404.index` is `S404.home` (the cut card's «Home» / «Inizio»). On a phone the button and «Write to me» stand on two lines.
3. **The phone's scene names.** At 390 px 24 of 152 names ran into an ellipsis (EN 11, IT 13). Every scene whose name is over 180 px in either language (so it fits a 360 px phone) has a short form, `data-scene-short` on its section: pages `ev.short`, `path.short`, `co.short` (strings.mjs); 22 chapters' `"short"` twins (cases.json); a case opener the work's label where the title is longer. fx-motion.js sceneName shows the full name when it fits the room (the box less its rule and gap, measured by a hidden probe in the label's face), else the short form, and decides again after a resize. Never a smaller type. Also: a case's record names itself «The record», no longer «05 The record». After: 0 of 152 over at 390 (longest short 156 px in a 210 px room); at 1024 the desktop header takes the short form too where needed.
4. **The Supply Chain diagram.** In scene mode at 1440 it was 552 px wide (class names ~3 px). Now (a) the picture shows its drawing's window only (cases.json `crop`, the SVG's `umld-win` clip: the empty frame margins go), the trace box shifted with it so fx-motion.js's pen geometry is unchanged (mid-trace still at 1920: the ink lands on the drawing); (b) from 1024 px the figure spans the page's measure, gutter to gutter (`.cs-stills.is-wide`, in scene mode and in plain flow), its caption back on the text's line, the chapter's folio static (sticky, it slid over the drawing); (c) from 1024 px the frame is never taller than the screen under the header. At 1440 the frame is 1290 x 788 (class names ~8.5 px, members ~7 px; crisp at DPR 2), at 1920 DPR 1 1561 x 954 (~12 px). The phone keeps the column's width (~2.4 px names: pinch-zoom). With the stage the chapter's figure of light gives way on wide screens (figures.js reads the chapter's blocks, so its region is under 240 px) and the room keeps the drawing's box: nothing of the stage over it.
5. **Also fixed:** «Sound design» was written in the About partial (now `cap.8.sound`, the same in both editions); Obla's fields table carries `data-stage-keepout` (two shards stood in its rows at 1440: now clear); the home's Now names SerSan Agent OS and now links its case («SERSAN AGENT OS →» beside «SERSAN.IO ↗», page-cover.css `.now-go`).

## Needs elsewhere

- `css/motion.css` ~line 95 (no owner this wave): `right: calc(var(--gut) + 7.75rem)` still clears the removed sound toggle; `calc(var(--gut) + 5rem)` gives the phone's scene name 44 px more (SOUND's note). With the short forms nothing is cut either way; with it more full names stand.
- `stage/scenes/case/figures.js` ~line 638-640 (FIX3D or the director): the `list` figure etches each item's number (01–06) on its thin plates, a rectangle carrying a number (CLAUDE.md §1; DESIGN.md describes it as designed). Suggest: etch nothing, or the item's first word.
- `stage/scenes/case/figures.js` layout() (optional): `right` is the max over all of a chapter's blocks, so the Supply Chain's list chapter, whose drawing now spans the measure, has no figure on a wide screen even beside its rows. If the director wants one there: take the wide block out of `right` and keep it in the blocks the plates clear.
- FIX3D (seen, not compared with HEAD): at 1440 the Maintech case opener's step 2 caption has cosmos filaments crossing it at moderate light 3 s after the scroll (`.shots/k-fix2d/plate-case-caption-crop.png`).
- Documents (docs lane): DESIGN.md «A name longer than its room ends in an ellipsis» → it gives way to the scene's short form; the 404's words; the Supply Chain figure set wide and windowed; Maintech's plate words; CLAUDE.md §8 «I testi e le lastre», «Il 2D», «Il bottone del 404», the Now link, Obla's fields.

## Gates (last run, 2026-11-22 ~01:36)

assemble ok (169 strings) · --check exit 0 · claims OK (34 pages) · Astro into .shots/k-fix2d/dist: PARITY OK, asserts ok (34 pages, 1156 references), claims OK · release (VERCEL_ENV=production) exit 0: 34 pages, 154 files, self-check passed.

## Looked at

names at 390 (all pages EN/IT, probe), the header on the phone (IT Agent OS case sheet, EN Voice AI, IT Consulting) and at 1024/1440; the diagram at 1440 EN (stage on and printed, 1:1 crops), 1440 IT caption and list, 1920 mid-trace, 390; Maintech's plate on Work 1440 EN/IT (1:1), 390 IT (stage and printed), the home's Work part, the IT case opener; plate words on 390/360 (no overflow); the 404 at 1440/390 EN/IT; Obla's fields at 1440; the home's Now at 1440 EN and 390 IT.

## Log

- 2026-11-22: server on 5403 (python, pid 26844 for public, then pid 9784 for the Astro build): stopped before returning.

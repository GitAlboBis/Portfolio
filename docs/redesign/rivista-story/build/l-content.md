# l-content — the multi-agent proof: SerSan Agent OS first, Obla corrected (wave 7, lane CONTENT)

- **Brief (20 Nov, Alberto, as relayed by the director):** in Consulting and About the strongest proof of the multi-agent skills is the company's MAS (SerSan Agent OS), not the Copilot Studio internship; and Obla too. Obla = his personal project; the MAS = built for SerSan. Work, its strings and cases.json belong to WORKS.
- **Mine:** PRODUCT.md (§3, §9, §10, §11), parts/strings.mjs, c-main.consult.html, c-main.about.html, c-main.obla.html, c-main.index.html (Now only), og/ of the pages whose card text changes (none did). Never stage/**, fx-*.js, css/scene|motion|chrome|cuts, web/src/router.
- **State: done (20 Nov, ~21:30-22:00).** Facts, copy (EN + IT), gates, look. Server on 5391 stopped (by pid, twice).
- **Run 2 (20 Nov, 22:02-22:30): the four items left open, done or handed on** (section "Run 2" below). Server on 5391
  stopped by pid (14348).
- **How to run:** gates as in CLAUDE.md §6; Astro into `.shots/l-content/dist`; serve on port 5391 (stop it by pid). Probes in `.shots/l-content/_scripts/` (look.mjs d|m, sheet.mjs, final.mjs, name.mjs, items.mjs).
- **Privacy:** no names of colleagues or clients, no org/repo URLs, no emails, no local paths of private repos; source form "repository privato SerSan Agent OS, letto il 20 novembre 2026" + the file inside the repo.

## Done

- **PRODUCT.md.** §3 item 10 SerSan Agent OS (line 40) and item 11 Obla (line 41), each one line with its numbers and its sources (the claims gate's `item3(10)` / `item3(11)` parse). §9 after the CV: «Dopo il CV: due sistemi multi-agente» (lines 252-258), Alberto's words of 20 Nov verbatim, then one bullet per system and the AI skills they add; unique anchors for a case scope: "SerSan Agent OS — the company's multi-agent system" (256), "Obla — personal multi-agent system" (257), "Competenze che si aggiungono" (258). §10: the fourth service's proof is SerSan Agent OS then Obla; the thesis stays in About's path; no numbers on Consulting. §11 rewritten on the code (sources: the private repo's `ac/vertical-slice` lane, not the stale m1 PRD): a chief of staff + named agents on eleven profiles, four tiers, what is integrated and what is in build, "It asks" corrected, the 9 Nov decision kept (no status; 08:00 the only number). §5: the private Obla path replaced by the repo form (same line).
- Facts spot-checked read-only before writing: Agent OS `freno.ts` (8 hand-offs, a pair more than twice), `config/livelli.yaml` (5/30, 15/60), the M2 register (2,513 passed, 0 failed, 222 files, 371 s, 20 Nov); Obla `settings.ts` (3 / 8 / 20 USD / 6), `agents-pa.ts`, ADR-0001 ("gli LLM propongono, il codice esegue"), `report.ts` (13 sections; per-agent rows).
- **Copy** (parts/strings.mjs; partials only for names): Consulting 04 line and proof (SerSan Agent OS as a name, Obla linked; `co.4.proof` removed); About AI group (Multi-agent systems, Claude Agent SDK, Claude Code / MCP, Anthropic / OpenAI / Gemini, Local models (llama.cpp), RAG, evaluation, Copilot Studio; `cap.5.mas`, `cap.5.local` new) and its proof (SerSan Agent OS, Obla, Sphere AI); Now body names the studio's own multi-agent system; Obla lead, 02, 03, 04, 05, Runs on; `meta.obla.desc`; `ix.obla` (the 404's row). Names kept whole with no-break spaces (the Now, the two proof labels; the two Italian chips).

## Trap found

cases.json cites PRODUCT.md by absolute line (`P:245`): any line added above the CV shifts them (62 misses at first). Kept cases.json untouched: §3 +2 lines, §5 −2 (the false "old app's assets still in the repo" line removed: public/bench and public/cubemap are gone; "Catturabili…" folded into the stills line). Anything added above §9 later must keep the count or shift cases.json.

## Gates (last run, on the final tree, ~21:58-22:00)

assemble exit 0 · `--check` exit 0 (structural asserts ok, 166 strings) · claims OK 32 pages · Astro build exit 0 into `.shots/l-content/dist` · PARITY OK · asserts ok (1032 references) · claims on the build OK. No share card stale (the cards read only the hero and cases.json).

## Looked (`.shots/l-content/`, ?stage=0, headless)

`d/` (1440x900 DPR 2) and `m/` (390x844 DPR 2): 1:1 element crops of every changed block, EN and IT, on consulting, about, obla and the home's parts (60 crops); sheets `s-*.png` read. Facts per block: no text under 15 px, nothing hidden, no overflow, no chip outside its list (`final/`). Fixes from the look: "It asks" (waits … waits → stays a draft until I send it), the name "SerSan Agent OS" breaking across lines (`final/name-sheet.png`). Not looked: the stage on (COSMOS is changing stage/** now): Consulting 04 grew from 31 to 52 words, Obla 03 from 29 to 42.

## Run 2 (the four items the first run left open)

1. **SerSan Agent OS as a link:** still no case page (cases.json 9 entries, no `case-sersan-agent-os.html`): it stays a
   plain name in Consulting 04, About 05 and the Now text until WORKS adds the case (see "Needs elsewhere").
2. **The stage on** (COSMOS idle since 21:39). `_scripts/stageon.mjs d|m`: each changed block centred (its step in focus),
   3.5 s, a still, then the same still with `canvas.fx-stage` hidden; the difference inside the block = what the stage
   draws over it (`on-d/`, `on-m/`, `report.json`, 1:1 `*-crop.png`). Consulting 04 (EN, IT; page and home): nothing over
   the text (max diff 3-12 of 255); the agents figure in its half at 1440, and on the phone above the text while the step
   is read from 62 % to 34 % of the screen, like step 03 (`strip/en-co3-sheet.png`, `strip/en-co4-sheet.png`,
   `strip/it-co4-sheet.png`). About 05: glyphs clean; at 1440 the stack's light reaches the empty right part of the
   block's box (past "Gemini"), not the type. Obla lead, 02-05 (03: 42 words): clean on both. Obla fields at 1440: two
   SerSan-mark chips at rest inside the table's rows (after "FOR", right of its value), outside the glyph keep-outs
   (`textRects` are glyph boxes + 14 px; no glyph covered; phone clean). **The home's Now part: chips and filaments
   cross the Now title and body; on the phone the gallery's SphereNode plate shows behind the lead and body.** Cause
   (`_scripts/dbgkeep.mjs`, `dbgnow.mjs`, `dbg/*.json`): on this tree the Now scene draws nothing at its own part (no
   plate, no field, 0 keep-outs at sy 1530-1890), while the live site (wave 6) gives the plate, the field and 5
   keep-outs there. A/B with the old Now copy (`OLD_NOW=1`): the same, so not the copy. HOME's look (17:29-17:36) still
   saw Now's plate; the stage files changed around and after it are COSMOS's (stage.js 17:34, cover/shared.js and
   fx-stage.js 17:36, then cover/world.js, lib/room.js, field/*, cosmos/web.js 21:27-21:39). No `[stage] ... threw`
   line. For STAGE.
3. **The Italian:** read again; two phrases made more natural: Consulting 04 «un freno che chiama una persona, un cancello
   su ogni azione» → «un freno che fa intervenire una persona, un cancello davanti a ogni azione»; Obla 02 «come quale
   agente prende un lavoro» → «come a quale agente affidare un lavoro». A native reading is still Alberto's.
4. **PRODUCT.md §6:** the last bullet now says that since wave 6 Vercel's automatic deploy of `main` publishes the night
   studio (one commit with the final tree; online since 20 Nov with `208c3de`), and that `ocean-ui` and G4 were the old
   app's, removed; the stack bullet's last sentence (the Next.js app "in src/") likewise. Both edits within their line
   (cases.json's `P:n` unchanged).

Gates on the final tree (22:27): assemble 0 · `--check` 0 · claims OK 32 pages · Astro build 0 · PARITY OK · asserts ok
(1032) · claims on the build OK. No share card text changed.

## Needs elsewhere

- STAGE: the home's Now part on this tree (run 2, item 2): no plate, no field, no keep-outs while its text is read;
  evidence and probes above. Also, if the Obla fields' rows should hold no chip: `data-stage-keepout` on `.ob-fields`
  (c-main.obla.html) or row-wide keep-outs for `dl.rows` (not done here: a stage choice).
- WORKS: a SCOPE_TABLE row in scripts/check-claims-proto.mjs for the MAS case, e.g. `[10, "SerSan Agent OS — the company's multi-agent system", "Obla — personal multi-agent system", true]` (and for a scoped Obla tile `[11, "Obla — personal multi-agent system", "Competenze che si aggiungono", false]`); cases.json `src` can cite P:40, P:41, P:256, P:257.
- WORKS: once the case exists, link the proof name in c-main.consult.html (step 04) and c-main.about.html (step 05) like the other proofs (`data-pt-label="SerSan Agent OS" data-pt-sub="NN · {{t:sec.work}}"`); if the gallery's numbering changes, the hard-coded `data-pt-sub` numerals of the existing proof links in those two partials follow.
- Director / Alberto: Obla's page still describes in-build functions as finished (the voice, the spoken report, the hand-offs), per the 9 Nov decision; the flying character left "It works".

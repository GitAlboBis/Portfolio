# l-docs: DOCS, wave 7 (the home as one journey, the neural cosmos, eleven works)

- **Done (21 Nov, one run).** Every item of the brief, each statement checked in the code on disk (INTEGRATE's fixes
  F1-F3 included), corrected in place, no new document. impeccable `context` loaded once; its `document.md` read for
  the sidecar (narrative verbatim from DESIGN.md).
  - DESIGN.md: description, the comment, overview, key characteristics (+ one cosmos), refused (the grid wall),
    colours (cosmos, More work's ray), the Four Colours rule, type (d1, d2, mega, eleven works), layout (+ the home's
    parts), depth, Text Is Sacred, shapes, header (+ the part being read, the scene name's rule, the language's place,
    the morning at the first `[data-dawn]`), the home (was the cover: parts, index gone), Work (eleven), Obla, the dawn
    close, Contact in the home, the cut from the home (card "Home"), the case template (ten cases, More work), head,
    print, the stage (start, room + cosmos, swarm restore, glass, eye + looks, dawn, glow, post, passes, limits wave 7),
    motion (the parts' openers), sound (the home's rooms, the index row), do's / don'ts, files, gates (34).
  - design.json: `node .shots/l-docs/_scripts/sync.mjs` (narrative from DESIGN.md + the stale extensions and
    components by name; + stage.cosmos, motion.home-parts, sound.home-rooms; idempotent) -> MIRROR OK.
  - CLAUDE.md: header, §0, §1 (Alberto's words of 20 Nov, the cosmos, the home as one journey, the page table, the
    flight from the home, refused), §2, §3 (limits 4-7, the lesson of wave 7's runs), §4 (state, deploy parent, file
    map, `?budget`), §5, §6 (34, probes, deploy `-p 208c3de`, after touching: an API field's readers, a new work), §7,
    §8 (wave 7's open items; wave 6's that hold).
  - 60-as-built.md: header, A intro, A2 A3 A4 A5 A14 A15 A24, B1 B3 B7 B9 B12, C, D2, section E (E1-E4).
  - stage/scenes/README.md: header, the home's scenes, `look` (an ask a frame, mixed by weight), the field's blend,
    lights, the cosmos's fields, the example, the bench, the room's options, cost, the home's shot, splat layer, the
    door, events, the etch example, keepDim, contact in the home, a field gone (the now.js lesson).
  - PLAN.md §0: the state on 21 Nov, the next steps, wave 6 as history.
- **Verified fresh:** `node .shots/m-docs/_scripts/mirror.mjs` MIRROR OK; design.json parses; assemble `--check`
  exit 0 (11 works, 10 with a case page); claims OK (34 pages, 17 Italian); headings intact (only the two renamed).
- **Decisions:** code over notes; INTEGRATE's fixes on disk (cut.home, path/stack labels, `text-wrap: pretty`) are
  written as fixed; INTEGRATE's own open items are the director's to add.
- **Needs elsewhere (not my files):** root `README.md` l.3 "nine case studies" -> ten (and the home as one journey),
  l.13 "`cases.json` with the nine cases" -> eleven works, l.20 "32 pages" -> 34 · `web/package.json` l.5 "32" -> 34 ·
  HANDOFF.md (director) · stale comments: `lib/room.js` RoomOpts "chips (default 9000 desktop, 6000 phone)" and
  "haze their shafts" (now 1,200 / 800, haze only for `aim`), `fx-sound.js` header "index the cover's four rows",
  "the wall's grid" in consult.js, evidence.js, gallery.js, case/figures.js, cover/shared.js.
- **How to run and look:** docs only; `node .shots/l-docs/_scripts/sync.mjs` then `node .shots/m-docs/_scripts/mirror.mjs`.

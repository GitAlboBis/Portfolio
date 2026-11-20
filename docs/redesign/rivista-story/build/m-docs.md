# m-docs: the documents after wave 6 (DOCS, 20 November, Opus 5.5 max)

- **Done.** Every item of the brief, each sentence checked in the code (grep / read), corrected in place, no new
  document. impeccable `context` loaded once (no CONTEXT_STALE) and its `document.md` read for the sidecar's rules
  (narrative verbatim from DESIGN.md).
  - CLAUDE.md: header (corrected 20 Nov; Astro is the published build), §0 rows (`m-` notes, state), §1 (world: prism
    under More work, grain, aberration in speed, HDR, the phone's scene name; the index's prism as glass; About's bow,
    guard and years; the cases: record on the phone, the thread, More work's prism, record counts, the trace; the
    flight: `day`, SWAP_MS 200, shadow, takeover at the door's cover, the door with the room through it, Contact's edge
    of day, a morning view flies, first click silent), §2 the sound rule, §3 the 20 November lesson, §4 state + release
    row + scripts/stage/media rows + `?hdr` switches, §5 stack + Vercel, §6 release + deploy, §7 old app gone, §8 wave 6
    open + deploy.
  - DESIGN.md: key characteristics, colours (HDR), numerals (a year snaps), case layout (61.6 %, 36svh), breakpoints,
    header (phone scene name), the prism, the path, the cut (`day`, the flight, Contact, morning views), the case table
    (record, More work) + record counts + the trace, the stage between pages, the glass, new "The post", limits, motion,
    sound (first press), files that move together, gates.
  - design.json: generatedAt, provenance, motion (title-sequence, flight, + years-snap, + trace), breakpoints, stage
    (between-pages, plates, + post, switches), sound start, budget (wave-limits, builds), Header, Index row, Cut card,
    keyCharacteristics.
  - 60-as-built.md: header note, rows A3 A7 A14 A24 B4 B5 B10 B12 B14 B16, a C bullet (`web/release/`), section D.
  - stage/scenes/README.md (API only): the prism's beam (`inset: -(1 + k)`, `PRISM_BEAM`, `prismOutline`), two prisms;
    an extra pass's format, grain and ceiling; the arrival in the shadow; mist forwards the figures' `passes`.
- **Next:** nothing of the brief. INTEGRATE's open items are the director's to add to CLAUDE.md §8.
- **Decisions:** code over notes where they differ (snap: 45 ms between columns, 90 between years, 520 ms, as
  `fx-motion.js` `snap()` runs, its comment says 60 / 140). The grain on the field's wall and haze is documented as on
  disk (INTEGRATE's edit of `field.wgsl.js`), as is the release keeping `agricultural-supply-chain-detail.svg`.
- **Needs elsewhere (not my files):** `stage/stage.js` header: `stats()` omits `hdr` and `aber`, `flyState` omits
  `door` and `cover`, `prepare` / `reserve` are not in the API list · `case/figures.js` header: the record still
  "(desktop)", no `more` kind · `fx-motion.js` snap comment (60 / 140 ms) against its code (45 / 90 ms) · `PLAN.md` §0
  (director's): the first click and the other wave 6 items are built.
- **How to run and look:** `node .shots/m-docs/_scripts/mirror.mjs` (design.json parses and its narrative equals
  DESIGN.md: MIRROR OK); `node public/proto/rivista/assemble.mjs --check` (exit 0) and
  `node scripts/check-claims-proto.mjs` (OK, 32 pages): no build reads these documents. No server started.

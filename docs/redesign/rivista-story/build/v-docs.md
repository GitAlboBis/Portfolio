# v-docs — lane DOCS del giro 10

- Compito: portare HANDOFF.md, PLAN.md, CLAUDE.md, DESIGN.md, .impeccable/design.json, .impeccable/surfaces/*, 60-as-built.md al giro 10.
- Fatto (DONE): HANDOFF.md (riquadro, §1, §2, §3, §4 giro 10, §5, §6, §8, §9), PLAN.md, CLAUDE.md (§0, §1 mondo e copertina e taglio, §2 regole: riposo, camera libera, bloom, tipo, movimento; §4 mappa), DESIGN.md (frontmatter, scala, header, menu, bottoni, hero, Now, taglio, camera, bloom, motion), design.json (valido), surface brief della copertina riscritto, 60-as-built righe 33–39.
- Gate: `assemble.mjs --check` exit 0; `check-claims-proto.mjs` OK (32 pagine).
- Prossimo: niente; il direttore mette gli hash al posto di «il commit di questo giro».
- Decisioni: il bloom nel codice lo chiedono solo `hero.js` e `now.js` (le altre scene no): i documenti dicono così, non "ovunque". La riga legale usa `--t-small` (il commento di tokens.css che dice 14 px è stantio: non lo ripeto). Hash del giro 10: "il commit di questo giro" + argomento.
- Come guardare: nessun server; gate `node public/proto/rivista/assemble.mjs --check` e `node scripts/check-claims-proto.mjs`.

## Needs elsewhere
- `public/proto/rivista/css/tokens.css` riga 33: il commento dice «the legal line excepted (14 px)», ma `.legal-line` in `css/dawn.css` usa `--t-small` (16/17 px). Commento da correggere (PAGE).

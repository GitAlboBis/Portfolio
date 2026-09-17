# PLAN — prossimi passi

> Backlog vivo del branch `feat/redesign-2026-09`, ordinato. Stato al **2026-09-17**: il redesign **"The job order"** è costruito (WP-0 → WP-10), la finish review è chiusa, il batch di fix è applicato, `DESIGN.md` e `.impeccable/design.json` esistono. Il contesto è in [`HANDOFF.md`](./HANDOFF.md); le regole in [`CLAUDE.md`](./CLAUDE.md).
>
> Regola che vale su ogni riga di questo file: **niente "fatto" senza prova visiva** (`node scripts/visual-gate.mjs`, desktop + mobile, console pulita).

---

## P0 — bloccanti, servono risposte o decisioni

| # | Cosa | Chi | Nota |
|---|---|---|---|
| 1 | **Rispondere alle domande aperte L.1–L.7** (`REDESIGN-SPEC.md` §L, riprese in `HANDOFF.md` §5) | 🔵 Alberto | Sbloccano Fase B, la correzione del CV, i media e il copy di `/about` |
| 2 | **Commit del lavoro WP-10** (fix batch + `DESIGN.md` + `.impeccable/design.json` + doc riscritti) | direttore | 19 file modificati + i nuovi; un commit atomico `build(WP-10)` |
| 3 | **Decidere i 6 sidecar di provenienza** `public/{captures,bench}/*.webp.json` | 🔵 Alberto | Verranno serviti come URL pubblici. Restano o si spostano fuori da `public/`? |
| 4 | **Impostare `NEXT_PUBLIC_SITE_URL`** nell'ambiente Vercel | direttore | Senza, canonical e OG puntano a `http://localhost:3000` |
| 5 | **G3 — merge su `main` + deploy** | 🔵 Alberto | Solo con ok esplicito |

---

## P1 — qualità, dopo le risposte

| # | Cosa | Dipende da | Accettazione |
|---|---|---|---|
| 6 | **Rimisurare Lighthouse sul build di produzione** e aggiornare la voce di CV | P0.1 (L.2) | mobile `/` ≥ 80, sotto-route ≥ 90, desktop ≥ 95; i numeri finiscono nel CV **solo** dopo la misura |
| 7 | **Fase B del banco** — sostituire in `g2p.wgsl.ts` l'asse mediano a 3 segmenti con un SDF di box (`inflate/restoreK/leash` identici), rimuovere "confined to a letter-A field" dalla didascalia | 🔵 **G4**, P0.1 (L.1) | `git diff --stat src/webgl/waterball/mls-mpm` mostra **solo** `g2p.wgsl.ts`; 60fps desktop; still di fallback ricatturato (`scripts/capture-bench.mjs`) |
| 8 | **Media mancanti** — still/URL per Maintech OMA, Domus Tua, brand film, Badante24h | P0.1 (L.3) | Ogni riga passa da "no photograph on file" / "URL: pending" a una cattura reale con provenienza incorporata e l'etichetta "capture · <mese> <anno>"; `impeccable embed-prompt --scan` = 0 missing |
| 9 | **Ritratto su `/about`** oppure conferma definitiva di "nessun volto" | P0.1 (L.4) | Il campo "Photograph" stampa un'immagine o resta un buco dichiarato, mai un segnaposto |
| 10 | **Prima viewport mobile (F4, residuo)** — portare anche la cella Email a tutta larghezza sopra la piega a 390×844, o emendare la riga di contratto | — | Oggi sopra la piega: strip, nome 52px, Role, banda 48px, banco 350×230 + letture, la prima voce di lavoro. La cella Email della **banda** è comunque sempre visibile |
| 11 | **`works.ts` `role` localizzato** (slot EN/IT sul tipo `Work`) | 🔵 Alberto (copy) | Serve solo se vuole "Sole engineer and designer" anche in italiano |

---

## P2 — housekeeping

| # | Cosa | Nota |
|---|---|---|
| 12 | **Rimuovere le dipendenze non più usate**: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `simple-icons` | Il mondo attuale non monta nessuna scena R3F e non usa loghi. Verifica con `grep -r "three\|simple-icons" src` prima di togliere, poi `npm run build` |
| 13 | **Archiviare i doc storici**: `ANIMATION-PLAN.md`, `CODEDROPSPLAN.md`, `IDEAS.md`, `docs/0*.md` → `docs/archive/` | Descrivono mondi eliminati. `docs/redesign/` resta dov'è: è il record del round di direzione |
| 14 | **Potare `scripts/probes/`** — ~60 sonde, molte legate a mondi morti (`_wave`, `_tide`, `_nightfall`, `_runway`, `_dof`…) | Tenere: `a11y-gate.mjs`, `wp10-evidence.mjs`, `_recapture.mjs`, `_contrast.mjs`, `_shoot.mjs` e le sonde `_fix_*` del batch WP-10 |
| 15 | **`.shots/` in `.gitignore`** e ripulire le catture vecchie | Le evidenze archiviate vivono in `.impeccable/review/` e `.shots/wp10-fixed/` |
| 16 | **Verificare che la chiave `localStorage` `"ocean-ui"` non dia fastidio** | Nome legacy ma funzionante: rinominarla richiede una migrazione, non farlo a cuor leggero |
| 17 | **Sonda di campionamento ripetuto per axe** — oggi axe gira una volta per route, dopo l'assestamento | Uno snapshot singolo può non vedere uno stato transitorio di animazione (è così che il difetto F6 è sfuggito al gate e l'ha visto Lighthouse) |

---

## Non fare

- **Non toccare `src/webgl/waterball/mls-mpm/**` né `common.ts`** senza sblocco G4 esplicito.
- **Non reintrodurre** ombre, gradienti, vetro, sezioni scure, monospace, count-up sui numeri, icon cloud, gallerie 3D: sono nella refuse list di `DESIGN.md`, e mezza di quella lista è il mondo che Alberto ha rifiutato.
- **Non scrivere copy nei componenti**: passa da `src/content/dict.ts`, EN e IT insieme.
- **Non stampare un numero** che non sia in `PRODUCT.md` §3/§9.
- **Non fidarsi di uno screenshot full-page** di una pagina oltre i 16.384 px di device pixel: si cattura a tile.

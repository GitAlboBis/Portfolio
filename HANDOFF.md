# HANDOFF — continua da qui

> **Stato al 2026-09-17, branch `feat/redesign-2026-09`.** Il redesign **"The job order"** è costruito end-to-end (WP-0 → WP-10), la finish review è stata eseguita, il suo batch di fix è applicato, e la documentazione di chiusura (`DESIGN.md`, `.impeccable/design.json`) esiste. Il branch **non è ancora mergiato né deployato**: G3 aspetta l'ok di Alberto.
>
> Leggi prima [`CLAUDE.md`](./CLAUDE.md) (§0 fonti di verità), poi [`DESIGN.md`](./DESIGN.md). Il contratto di build è [`REDESIGN-SPEC.md`](./REDESIGN-SPEC.md); la verità di prodotto è [`PRODUCT.md`](./PRODUCT.md). I prossimi passi ordinati sono in [`PLAN.md`](./PLAN.md).

---

## 1. Che cos'è cambiato, in una riga

Il 14 settembre 2026 Alberto ha **rifiutato l'intero sito Golden Hour**. Il round di direzione (`impeccable concept-seed`, seed `2c525d0e`) ha assegnato **"The job order"**: un ordine di lavoro d'officina, carta e giallo di sicurezza, timbri rossi, sei fasi che si timbrano allo scroll, e il fluido WebGPU **ri-messo in scena come strumento** dentro un banco prova invece che come logo su un tramonto. Il mondo vecchio è stato rimosso dal codice, non archiviato accanto.

---

## 2. Che cosa è stato spedito (commit sul branch)

| Commit | Contenuto |
|---|---|
| `4c17296` | Chiusura del round di direzione: `REDESIGN-SPEC.md` (contratto §A–§L + work packages) e il record `docs/redesign/DIRECTIONS-2026-09.md` |
| `ba68f44` | **WP-7a** — catture reali di `sersan.io` e `spherenode.com` con provenienza incorporata |
| `1d57435` | **WP-0 + WP-1** — fondazione (token, Archivo con asse `wdth`, shell, gate visivo) + livello contenuti bilingue (`dict.ts`, `works.ts` con `Measured` strutturato, `findings.ts`) |
| `b73378c` | **WP-2 + WP-8** — chrome del foglio: header strip, banda fasi che timbra, primitive (`Field`, `RuleIn`, `Stamp`, `Perforation`), styleguide vivo |
| `68b323d` | **WP-3 + WP-6** — banco prova WebGPU come strumento; transizioni a foglio di carta, preloader, OG, SEO |
| `eb85c92` | **WP-4 + WP-3b** — il foglio home (Intake, Findings, Parts catalogue, Work performed, Measured, Release) + il banco che legge come olio |
| `209870f` | **WP-5 + WP-7b** — `/work`, i 9 sotto-moduli su copia carbone, `/about`, e il fotogramma catturato del banco |
| `782f3e9` | **WP-9** — rimozione del mondo Golden Hour rifiutato |
| *(non committato)* | **WP-10** — finish: gate meccanici, finish review, **batch di fix F1–F13**, `DESIGN.md`, `.impeccable/design.json`, riscrittura di `CLAUDE.md` / `HANDOFF.md` / `PLAN.md` |

**Il lavoro di WP-10 è nel working tree, non committato** (il commit lo fa il direttore).

---

## 3. Che cosa ha detto la finish review, e che cosa è stato fatto

Disposizione: **fix** (non rebuild, non recapture). Cinque blocchi del contratto su sei *met* o sostanzialmente *met*; il craft floor passa tutti e dieci i check, incluse le superfici del browser (selezione, caret, scrollbar, focus ring, underline offset, numerali tabellari). Tredici finding, otto materiali.

| # | Finding | Esito |
|---|---|---|
| F1 | La cella gialla Release nella prima viewport era 420×280 con ~200px vuoti (`xl:flex-1` + `justify-between`) | **risolto** — la cella si dimensiona sul contenuto e porta anche la richiesta ("Hiring, or building…") |
| F2 | Il banco "sbatteva" per 4–5 s dopo il load: a 1,5 s e 3 s una macchia illeggibile mentre la didascalia prometteva una "A" | **risolto** — nuovo stato `warming`: il riquadro tiene il **fotogramma catturato di questo motore** finché il campione non si assesta (4,2 s di tempo *renderizzato*), poi cross-fade 320 ms e timbro LIVE. Solver intatto (G4) |
| F3 | La CTA email primaria era `inline-flex` a 369px fissi: usciva dal pannello a 390px e veniva **tagliata** a 375/360/344/320 | **risolto** — blocco che va a capo; misurato: il link finisce esattamente sul bordo interno del pannello a tutte e cinque le larghezze |
| F4 | La prima viewport a 390×844 mancava 2 dei 6 elementi che il contratto nomina | **parziale** — riguadagnati ~150px (riga di laurea spostata nel campo Owner su mobile, campo più denso, riepilogo a 2 righe, teste di colonna sr-only): ora la prima voce di lavoro sta **sopra** la piega; la cella Email a tutta larghezza resta sotto (quella della banda è sempre visibile) |
| F5 | Il registro Measured era 6.574px su mobile = 44% del documento, per ripetizione della fonte riga per riga | **risolto** — fonte issata sull'intestazione di gruppo, righe più dense: 6.574 → 4.258px (−35%), documento 15.043 → 12.548px. Nessun fatto rimosso |
| F6 | La lettura `Frame` scendeva sotto 0,85 di opacità per ~22% del tempo (fino a 1,26:1) | **risolto** — lo swap è diventato un **wipe** in `clip-path` (stessa durata, 150 ms): 1.320 campioni, opacità minima **1**, colore sempre ink |
| F7 | Le catture full-page mobile superavano il soffitto texture di Chrome (16.384px) e tornavano **ricucite male** | **risolto** — `scripts/probes/_recapture.mjs` cattura a tile con asserzione sull'altezza; `wp10-evidence.mjs` ha lo stesso guard |
| F8 | `DESIGN.md` e `.impeccable/design.json` non esistevano | **risolto** — scritti dal mondo costruito |
| F9–F13 | didascalia duplicata sulla cover · riga di motivo sopra il fotogramma · misura della colonna Items · colonna Parts mezza vuota · lente troppo piccola e senza bordo | **risolti** (dettagli nel verdetto) |

**Stima SOTD del reviewer:** Honorable Mention oggi; 40–50% con F1/F2/F3 chiusi (lo sono).

---

## 4. Stato dei gate (misurato, non dichiarato)

- `npm run typecheck` — verde.
- `npm run build` — verde (da `C:\Users\alber\Portfolio`, con la maiuscola).
- `node scripts/check-claims.mjs` — OK: ogni numero è in `PRODUCT.md` §3/§9.
- **axe** — 0 serious / 0 critical su 7 route × 2 viewport, più `--reduce` e `--nogpu`. I 31 *moderate* su `/` sono il pannello leva di sviluppo, tree-shaken in produzione.
- **Parità EN/IT** — stesso numero di stringhe visibili nei due locali su tutte e 14 le coppie route × viewport; `html lang` segue lo store; zero overflow orizzontale di pagina.
- **Lighthouse** (prima del batch, da rimisurare) — mobile `/` 85–86, desktop `/` 99, `/work/sersan-io` 91, `/about` 91; A11y 100 (con un'oscillazione a 97 che il fix F6 ha eliminato alla radice).
- **Provenienza** — 12/12 raster, `impeccable embed-prompt --scan` = 0 missing.
- **Console** — 0 errori, 0 warning rilevanti sul gate visivo.

---

## 5. Domande aperte per Alberto (`REDESIGN-SPEC.md` §L)

Nessuna è stata inventata o aggirata: sono buchi **dichiarati** e il sito li stampa come campi.

1. **L.1 — G4, Fase B.** Sbloccare `g2p.wgsl.ts` per sostituire il campo di confinamento a forma di "A" con un SDF di box (la "vasca")? La Fase A spedisce con la "A", ri-illuminata a olio. Se sblocchi, la didascalia perde "confined to a letter-A field" e il CV cambia di una clausola.
2. **L.2 — CV.** Sulla voce "Personal Portfolio": "drone footage scrubbed to the scroll", "simulated water with real caustics" e "Lighthouse desktop 98/96/100/100" **non sono più veri**; "sun glints" → "tube highlights". Da rimuovere o rimisurare.
3. **L.3 — Media mancanti.** Still o link per Maintech OMA, Domus Tua (URL pubblico?), brand film (link/embed, NDA), Badante24h (URL di produzione?). Finché mancano, le righe stampano "no photograph on file" / "URL: pending" / "Film link: pending".
4. **L.4 — Ritratto.** `/about` stampa "Photograph: none on file" finché non ne fornisci uno (o confermi "nessun volto").
5. **L.5 — Sardegna.** Nessun accenno nel copy principale: vuoi una riga biografica su `/about`?
6. **L.6 — Framer Motion** compare nelle skill del CV ma non è usato sul sito (vincolo di stack): ok elencarlo come skill?
7. **L.7 — Voice AI Agent:** nessun numero nel CV → la cella Measured stampa "—". Vuoi aggiungere un dato verificabile?

**In più, dal batch di fix:**
- `works.ts` `role` non è localizzato: i titoli stampano in inglese anche in IT. Va bene per "Creative Lead"; la stringa che sembra volere una forma italiana è "Sole engineer and designer" su `/work/sersan-io`. Aggiungerla richiede uno slot EN/IT sul tipo `Work` — decisione di contenuto, non meccanica.
- I 6 sidecar di provenienza `public/**/*.webp.json` **verranno serviti** come URL pubblici (WebP non ha uno slot in cui scrivere). Minuscoli e auto-descrittivi, ma vanno confermati o spostati fuori da `public/`.
- `NEXT_PUBLIC_SITE_URL` non è impostata in locale: va impostata nell'ambiente di deploy o canonical e OG puntano a localhost.

---

## 6. Se devi ri-tirare la direzione (re-roll)

La direzione non è un'opinione di un agente: è il risultato di un round registrato.

1. Leggi `docs/redesign/DIRECTIONS-2026-09.md` — c'è l'elenco dei candidati, i due giudici, il tally (76 / 69 / 61) e il motivo per cui "The job order" (rank 4, kind `assigned`, seed `2c525d0e`) ha vinto.
2. Rilancia il round con `ui-design:impeccable` in modalità direzione: un nuovo seed, un nuovo elenco grounded, gli stessi due assi di giudizio. **Non** ri-tirare a mano un candidato dal pool vecchio: il valore del round è che il mondo è assegnato, non scelto per simpatia.
3. Il mondo vincente diventa un nuovo `REDESIGN-SPEC.md` (§A direction contract, §B raise, §C token, §E spec sezione per sezione, §J work packages). `DESIGN.md` si riscrive **a fine build**, dal mondo costruito, mai prima.
4. Ciò che sopravvive a qualunque re-roll: `PRODUCT.md` (i fatti), `src/content/works.ts` + `career.ts` + `skills.ts` (il contenuto), il motore in `src/webgl/waterball/**` (G4), e i gate di §10 di `CLAUDE.md`.

---

## 7. Il primo comando della prossima sessione

```bash
npm run dev
node scripts/visual-gate.mjs sanity "" work work/sersan-io about
```

Poi apri `.shots/sanity/` e **guarda** gli screenshot prima di toccare qualsiasi cosa. È la regola che questo progetto ha imparato a sue spese.

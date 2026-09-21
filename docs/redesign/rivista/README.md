# Rivista bianca — canone, piano effetti e mappe del porting

> **Stato al 2026-09-21.** Alberto ha scelto la variante **V1 "Carta e cobalto"** del prototipo `public/proto/rivista/` (commit `86854f4`). Il porting del prototipo nel sito Next.js **è parcheggiato**: la priorità è la missione *water-hero* (il logo d'acqua, branch `feat/water-hero`, sul PC fisso). Questa cartella rende tracciata la documentazione che prima viveva solo in `.wf-out/` (git-ignored), così qualunque macchina o agente la trova.

| File | Cosa contiene |
|---|---|
| `u2-canon.md` | Il canone "rivista bianca" (carta unica, titoli display in vw/vh, paragrafi leggeri ≤50ch, media a tutta larghezza, filetti, niente card/ombre) |
| `u1-motion-primitives.md` | Le primitive di motion del sito Domus Tua (TextLines, Reveal, Parallax, HorizontalRail, preloader) con le tabelle di timing |
| `u3-portfolio-map.md` | Mappa del repo Next.js a `d33a2d6` (cosa si tiene, cosa si sostituisce) |
| `EFFECTS-PLAN.md` | La direzione artistica del motion: tesi "Ink, cut, measure" e i cinque momenti firma S1–S5 |
| `DIRECTOR-AMENDMENTS.md` | Emendamenti del direttore: dove il piano e questo file divergono, vince questo file |
| `port/01…06-*.md` | Le sei mappe della fase *understand* del porting (core/nav, GL/hero, scroll/contenuti, substrato Next, canone + vincoli Context7, critico delle lacune con la proposta di work package) |

**Come riprendere il porting** (quando Alberto lo chiederà): leggere `port/06-critic-gaps.md` §3 (WP-0 → WP-7) e le decisioni D1–D11 registrate nella memoria di progetto `rivista-port-2026-09`; poi scrivere il `PORT-SPEC.md` (planner → tre critici → revisore) prima di toccare `src/`.

**Non autorevole per il sito attuale:** `CLAUDE.md`, `DESIGN.md`, `REDESIGN-SPEC.md` descrivono ancora "The job order", rifiutato il 2026-09-17; da questi file valgono solo le regole di processo (prova visiva, numeri solo da `PRODUCT.md`, bilingue via `dict.ts`, G4).

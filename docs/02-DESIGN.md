# 02 — DESIGN: Art Direction & Design System

Scopo: definire la direzione artistica e il design system canonico del portfolio di Alberto Tuveri (tema oceano sardo, qualita Awwwards). Questo file e la fonte di verita per palette, tipografia, spazio, motion, estetica dei componenti e voce del copy. Ogni agente che costruisce UI segue ESATTAMENTE i token qui definiti: niente hex inventati, niente font fuori lista, niente animazioni gratuite.

Documenti correlati: `docs/00-PRD.md` (visione/narrativa), `docs/01-TECHSTACK.md` (stack/versioni), `docs/03-ARCHITECTURE.md` (canvas globale + overlay DOM, store, i18n), `docs/04-3D-HERO-WATER-LOGO.md` (logo ad acqua, usa COL_COLD/COL_HOT definiti qui), `docs/05-CINEMATIC-SCROLL.md` (color grade della cinematica), `docs/06-REFERENCES.md` (librerie di ispirazione), `docs/07-PROJECTS.md` (copy delle schede).

---

## 1. Mood / Concept

Una sola frase guida: **"Il mare di Pan di Zucchero reso codice."** Il sito deve dare la sensazione di guardare l'oceano della Sardegna sud-occidentale (Masua, Iglesias) all'ora dorata: profondo, calmo in superficie, vivo sotto. Tre aggettivi vincolanti, in ordine di priorita:

1. **Cinematografico** — profondita di campo, color grade coerente, transizioni fluide. Niente "pagina web", e un film interattivo.
2. **Premium / editoriale** — serif da rivista per i titoli, spazio negativo abbondante, ritmo tipografico curato. Lusso percepito, non saturazione.
3. **Calmo ma vivo** — a riposo tutto respira lento (micro-moto ondoso, parallax leggero); all'interazione l'acqua reagisce (schizzo, risacca). Mai frenetico.

Antipattern da evitare: gradient viola/SaaS generici, glassmorphism a caso, emoji nell'UI, neon RGB da gaming, parallax aggressivo che induce nausea, drop-shadow morbide ovunque. La luce e quella dell'acqua, non del neon.

Riferimento di livello: `lusion.co` (vedi `docs/06-REFERENCES.md`). Studiare, non copiare.

---

## 2. Palette (token canonici OCEANO)

Dark-first. I valori hex sono **vincolanti**: non introdurre colori fuori da questa lista senza aggiornare prima questo file. Definiti come CSS custom properties nel layer `:root` di `src/app/globals.css` (Tailwind v4 e config CSS-first: i token diventano automaticamente disponibili come utility via `@theme`).

```css
/* src/app/globals.css */
:root {
  /* --- Surfaces (dark-first, dal piu profondo al piu in superficie) --- */
  --abyss: #05131A;          /* page base: il fondale, sfondo di default <body> */
  --deep: #0A2430;           /* surface: card, pannelli, sezioni sollevate di 1 livello */
  --surface-elev: #103240;   /* surface elevata: hover di card, dropdown, modali, nav sticky */

  /* --- Ink / foreground --- */
  --foam: #EAF6F6;           /* foreground primario: testo/heading su sfondo scuro (la schiuma) */
  --ink-mute: #88A2A8;       /* foreground muto (sea grey): body secondario, caption, label inattive */
  --rule: rgba(234,246,246,0.10); /* hairline: bordi, divider, griglie a 1px (foam al 10%) */

  /* --- Accent / signal --- */
  --aqua: #1FC8C8;           /* accent freddo primario: link, CTA, focus ring, accenti UI */
  --aqua-hot: #7DF9FF;       /* foam-cyan: hover dell'accent, glow, picchi di schiuma luminosa */
  --abyss-glow: #0E5A6B;     /* accent profondo: gradienti di sfondo, glow soffusi, stati attivi scuri */

  /* --- Special: golden hour --- */
  --gold: #FFC27A;           /* USO PARSIMONIOSO: solo per i picchi "sole su acqua" (1 accento per vista max) */
}
```

Regole d'uso della palette:

- **Sfondo di default** sempre `--abyss`. Le superfici salgono di livello solo per gerarchia (`--deep` -> `--surface-elev`), mai per decorazione.
- **`--gold` e un evento, non un colore di sistema.** Massimo un elemento gold per viewport (es. il glow del sole sull'orizzonte nella hero, o un singolo dato chiave). Mai testo lungo, mai bordi diffusi.
- **`--aqua` vs `--aqua-hot`**: `--aqua` e lo stato di riposo dell'accento; `--aqua-hot` e lo stato eccitato (hover, focus, particelle veloci). Pensa "freddo a riposo, caldo in moto".
- **Contrasto AA obbligatorio**: `--foam` su `--abyss`/`--deep` supera AA per body e large text. `--ink-mute` su `--abyss` e per testo secondario >= 16px; non usarlo per micro-copy critico. `--aqua` su scuro va bene per link/icone; verificare ogni coppia testo/sfondo con il check del `docs/11-WORKFLOW.md` (gate a11y).

### Particelle acqua (velocity-driven) — usate dal logo 3D

Le particelle del logo (vedi `docs/04-3D-HERO-WATER-LOGO.md`) interpolano il colore in base alla velocita: `mix(COL_COLD, COL_HOT, smoothstep(0.0, MAX_SPEED, length(vel)))`. Valori linear-space (NON sRGB hex), tripli RGB normalizzati:

```ts
// src/webgl/gpgpu/gpgpuConfig.ts
export const COL_COLD = [0.06, 0.30, 0.34] as const; // a riposo: deep teal (profondita / volume d'acqua scuro)
export const COL_HOT  = [0.75, 0.98, 1.00] as const; // in moto: cyan-white (schiuma/spray illuminato, va in bloom)
```

`COL_COLD` corrisponde concettualmente alla famiglia `--deep`/`--abyss-glow`; `COL_HOT` alla famiglia `--aqua-hot`/`--foam`. Mantenere questa coerenza percettiva: il logo deve "appartenere" alla palette del sito.

---

## 3. Tipografia

Tre famiglie, ruoli netti. Caricamento via `next/font/local` (i file Fontshare si self-hostano per performance e per evitare richieste a host esterni; scaricare i .woff2 e metterli in `src/app/fonts/`).

- **Display = "Editorial New"** (Fontshare) — serif premium con corsivo. Solo heading grandi (hero, titoli di sezione). E la voce editoriale del sito.
- **Body = "Switzer"** (Fontshare) — grotesque moderno. Paragrafi, UI, bottoni, navigazione.
- **Mono = "JetBrains Mono"** — eyebrow/label uppercase, numeri tabellari (metriche progetto), micro-copy tecnico (stack, versioni).

```ts
// src/app/fonts.ts
import localFont from "next/font/local";

export const editorial = localFont({
  src: [
    { path: "./fonts/EditorialNew-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/EditorialNew-Italic.woff2",  weight: "400", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const switzer = localFont({
  src: [
    { path: "./fonts/Switzer-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Switzer-Medium.woff2",  weight: "500", style: "normal" },
    { path: "./fonts/Switzer-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const jetbrains = localFont({
  src: [{ path: "./fonts/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-mono",
  display: "swap",
});
```

Applicare le variabili sul `<html>` in `src/app/layout.tsx`: `className={`${editorial.variable} ${switzer.variable} ${jetbrains.variable}`}`. In `globals.css`:

```css
:root {
  --font-display: "Editorial New", Georgia, serif; /* sovrascritto da next/font */
  --font-body: "Switzer", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
body { font-family: var(--font-body); background: var(--abyss); color: var(--foam); }
```

### Scala tipografica (fluida con `clamp()`)

Tutti i titoli sono fluidi tra mobile e desktop. Riferimento: viewport 360px -> 1440px. `line-height` stretto sui display, comodo sul body.

```css
:root {
  /* display & headings (Editorial New) */
  --fs-display: clamp(3rem, 9vw, 8.5rem);   /* hero "Alberto Tuveri" */
  --fs-h1: clamp(2.25rem, 5.5vw, 4.5rem);   /* titolo di sezione */
  --fs-h2: clamp(1.75rem, 3.5vw, 3rem);
  --fs-h3: clamp(1.25rem, 2vw, 1.75rem);
  /* body (Switzer) */
  --fs-lead: clamp(1.125rem, 1.6vw, 1.5rem); /* paragrafo introduttivo */
  --fs-body: clamp(1rem, 1.1vw, 1.125rem);
  --fs-small: 0.9375rem;
  /* mono (JetBrains) */
  --fs-eyebrow: 0.8125rem; /* uppercase, letter-spacing largo */
}
```

Classi utility (definirle in `globals.css` con `@layer components`):

```css
@layer components {
  .heading-display {
    font-family: var(--font-display);
    font-size: var(--fs-display);
    line-height: 0.95;
    letter-spacing: -0.02em;
    font-weight: 400;
  }
  .heading-1 { font-family: var(--font-display); font-size: var(--fs-h1); line-height: 1.02; letter-spacing: -0.015em; }
  .heading-2 { font-family: var(--font-display); font-size: var(--fs-h2); line-height: 1.05; letter-spacing: -0.01em; }
  .heading-3 { font-family: var(--font-body); font-size: var(--fs-h3); line-height: 1.2; font-weight: 600; }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--fs-eyebrow);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--aqua);
  }
  .lead { font-size: var(--fs-lead); line-height: 1.5; color: var(--foam); }
  .body { font-size: var(--fs-body); line-height: 1.65; color: var(--ink-mute); }
}
```

Regola: il corsivo di Editorial New si usa per UNA parola enfatica nei titoli (es. il nome della tesi, "*ocean*" nella tagline), non per intere righe. I numeri delle metriche usano sempre `--font-mono` con `font-variant-numeric: tabular-nums`.

### Nota alternative

Default bloccato: Editorial New / Switzer / JetBrains Mono. Alternative ammesse SOLO se Alberto lo decide esplicitamente, mantenendo i ruoli: per il Display, **Cormorant** o **Gambetta** (Fontshare) come serif premium con corsivo; per il Body, **General Sans** o **Inter**; il Mono resta JetBrains Mono. Cambiare font significa aggiornare questo file e i `--font-*`, non i singoli componenti.

---

## 4. Spaziatura e layout

Scala di spazio basata su una unita di 4px (token semantici, non valori sparsi):

```css
:root {
  --space-2: 0.5rem;   /* 8px  - gap interni minimi */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px - gap base */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-24: 6rem;    /* 96px  - padding verticale di sezione (mobile) */
  --space-32: 8rem;    /* 128px - padding verticale di sezione (desktop) */
  --space-48: 12rem;   /* 192px - respiro extra tra blocchi maggiori */
}
```

Griglia e contenitori:

- **Content width**: `--container: 1200px`; `--container-wide: 1440px` per blocchi full-bleed contenuti. Centrare con `margin-inline: auto` e `padding-inline: clamp(1.25rem, 5vw, 4rem)`.
- **Griglia editoriale**: 12 colonne, `gap: var(--space-6)`. Le sezioni testuali occupano 6-8 colonne (mai 12 piene di testo: il testo lungo edge-to-edge uccide il ritmo editoriale). Misura di riga ideale: 60-75 caratteri.
- **Ritmo verticale**: ogni sezione (`<section>`) ha `padding-block: var(--space-24)` mobile, `var(--space-32)` desktop. Tra hero e sezioni successive, respiro extra (`--space-48`) per "decompressione" dopo la scena 3D.
- **Spazio negativo abbondante**: e una scelta di design, non spazio sprecato. Un titolo grande circondato da vuoto comunica premium. Non riempire.
- **Full-bleed**: la cinematica (S3) e la hero (S1) sono `100vw`/`100vh`; il contenuto editoriale (S2/S4/S5/S6) sta dentro il container.

Breakpoint (allineati a Tailwind v4 default): `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Il sito e desktop-first nell'ambizione visiva ma deve degradare con eleganza (vedi budget perf in `docs/01-TECHSTACK.md`).

---

## 5. Motion language

Principio cardine: **ogni animazione e intenzionale e ingegnerizzata.** Nessuna transizione "perche carina". Lo scroll guida la narrazione (scroll-driven, virtualizzato via Lenis sincronizzato con il loop R3F — un solo `requestAnimationFrame`, vedi `docs/03-ARCHITECTURE.md`).

Pattern vincolanti:

- **Smooth scroll virtualizzato (Lenis)**: lo scroll non muove l'altezza del DOM in modo grezzo; Lenis interpola e guida le transizioni di scena. Easing di default Lenis: lerp `~0.1`. Mantenere coerente con il driver R3F.
- **Split-text reveal (GSAP)**: i titoli display entrano per parole/righe con stagger. Stagger tipico `0.06s`, durata `0.8s`, ease `power3.out`, `y` da `1.1em` a `0`, clip dall'alto. Trigger via `ScrollTrigger` quando l'elemento entra al ~75% del viewport.
- **Parallax leggero**: sfondi/immagini si muovono a velocita diversa dal contenuto, fattore `0.1`-`0.3`. Mai oltre: parallax forte = nausea + look amatoriale.
- **Magnetic hover sui CTA**: i bottoni primari attraggono leggermente il cursore (desktop, pointer fine). Spostamento max `8px`, lerp `0.2`, ritorno elastico. Disattivare su touch e con `prefers-reduced-motion`.
- **Cursore custom (opzionale, desktop)**: piccolo dot `--aqua` che lerpa verso il puntatore (lerp `0.15`) e si espande sugli elementi interattivi. Opzionale: se aggiunge debito senza valore, ometterlo. Mai su touch.
- **Preloader con percentuale**: schermo `--abyss` con contatore `0 -> 100` in `--font-mono`, mentre carica GLB + font + prima clip video. All'uscita: tendina (curtain) che sale rivelando la hero, sincronizzata con il fade-in del logo ad acqua.
- **Transizioni di sezione/route**: curtain + crossfade della scena 3D (la scena persiste, cambia stato; vedi mappa scena<->sezione in `docs/03-ARCHITECTURE.md`). Le route `/work/[slug]` entrano con un wipe verticale dall'`--abyss`.

Curve di easing canoniche (usare queste, non inventare):

```ts
// src/lib/easings.ts
export const EASE = {
  out: "power3.out",       // entrate di contenuto
  inOut: "power2.inOut",   // transizioni di scena / curtain
  expo: "expo.out",        // reveal d'impatto (hero)
  // per CSS transitions:
  cssOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  cssInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;
```

Durate di riferimento: micro-interazioni UI `0.2s`-`0.3s`; reveal di contenuto `0.6s`-`0.9s`; transizioni di scena/curtain `0.9s`-`1.4s`. **`prefers-reduced-motion`**: disattivare split-text, parallax, magnetic e cursore custom; sostituire con fade semplici (`opacity` `0.3s`); il logo 3D passa al build statico (vedi `docs/04`). Questo e un gate, non un'opzione.

---

## 6. Estetica dei componenti

Linea generale: bordi sottili (`1px` di `--rule`), angoli appena arrotondati (`--radius: 0.5rem`; `--radius-lg: 1rem` per le card), nessuna ombra morbida diffusa; la "profondita" viene dal colore di superficie e da glow `--aqua` mirati. Stati di focus sempre visibili (`outline: 2px solid var(--aqua); outline-offset: 2px`).

### Button — varianti signature

```tsx
// Variante "primary": riempimento aqua, magnetic, glow su hover
// <button class="btn btn-primary">View work</button>
```

```css
@layer components {
  .btn {
    font-family: var(--font-body); font-weight: 500;
    font-size: var(--fs-body);
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius);
    transition: transform .25s var(--ease-out, cubic-bezier(0.16,1,0.3,1)),
                background-color .25s, color .25s, box-shadow .25s;
    will-change: transform;
  }
  .btn-primary {
    background: var(--aqua); color: var(--abyss);
  }
  .btn-primary:hover {
    background: var(--aqua-hot);
    box-shadow: 0 0 0 1px var(--aqua-hot), 0 8px 30px rgba(125,249,255,0.25);
  }
  .btn-ghost {
    background: transparent; color: var(--foam);
    box-shadow: inset 0 0 0 1px var(--rule);
  }
  .btn-ghost:hover { box-shadow: inset 0 0 0 1px var(--aqua); color: var(--aqua-hot); }
  .btn-link { /* per "Get in touch" testuale */
    background: none; color: var(--aqua); padding-inline: 0;
    position: relative;
  }
  .btn-link::after {
    content: ""; position: absolute; left: 0; bottom: -2px; height: 1px; width: 100%;
    background: currentColor; transform: scaleX(0); transform-origin: left;
    transition: transform .3s var(--ease-out, cubic-bezier(0.16,1,0.3,1));
  }
  .btn-link:hover::after { transform: scaleX(1); }
}
```

Le due varianti signature sono **`primary`** (CTA forte, magnetic, una per vista) e **`ghost`** (CTA secondaria, hairline che si accende in `--aqua`). `link` per inline. La logica magnetic vive in un hook React (`useMagnetic`) condiviso, non duplicata.

### Project card (S4)

Struttura: superficie `--deep`, hairline `--rule`, su hover sale a `--surface-elev` con bordo `--aqua` e leggero `translateY(-4px)`. Contenuto in ordine: **eyebrow** (ruolo + anno, mono uppercase) -> **titolo** (heading-3) -> **descrizione P/A/R** (problem / action / result, body) -> **stack** (chip mono) -> **metriche** (numeri `tabular-nums` in `--aqua`/`--gold` per il dato chiave). Una sola metrica puo usare `--gold`. Immagine/preview con `overflow:hidden` e leggero zoom su hover (`scale(1.04)`, `0.6s`).

### Section heading (pattern riusabile)

Tre parti, sempre nello stesso ordine: **eyebrow** (mono, `--aqua`) + **title** (heading-1/2, Editorial New) + **description** (lead, opzionale). Allineamento a sinistra di default; centrato solo per hero e contact. Componente unico `<SectionHeading eyebrow title description />`.

### Divider / rule

Linea `1px` di `--rule` a piena larghezza del container, oppure variante "tide": un sottile gradiente orizzontale da trasparente a `--abyss-glow` a trasparente, usato per separare la cinematica dalle sezioni editoriali. Mai bordi spessi o doppi.

---

## 7. Voce del COPY

Lingua primaria del sito: **English** (il sito e bilingue EN/IT, toggle in S6; le stringhe vivono in `src/data/translations`). Registro: conciso, sicuro, marino-ma-tecnico. Frasi brevi. Verbi attivi. Zero buzzword vuote ("synergy", "passionate about leveraging"). Il mare e metafora, non decorazione: usalo con misura, una immagine per blocco al massimo. Mai esclamativi, mai emoji nell'UI.

Linee guida: l'eyebrow e una etichetta tecnica (es. `SELECTED WORK`, `01 — ABOUT`); il titolo display puo permettersi una nota poetica; la descrizione torna concreta e fattuale. Le metriche parlano da sole (numeri, non aggettivi).

Esempi di microcopy (EN primario + IT):

```json
{
  "hero.tagline":   { "en": "Software engineer building full-stack systems with AI at the edge — shaped by the sea of Sardinia.",
                      "it": "Software engineer: sistemi full-stack con l'AI sul bordo — cresciuto sul mare della Sardegna." },
  "hero.cta.work":  { "en": "View work", "it": "Guarda i lavori" },
  "hero.cta.contact": { "en": "Get in touch", "it": "Contattami" },
  "about.eyebrow":  { "en": "01 — ABOUT", "it": "01 — CHI SONO" },
  "work.eyebrow":   { "en": "SELECTED WORK", "it": "LAVORI SELEZIONATI" },
  "contact.title":  { "en": "Let's build something that holds water.",
                      "it": "Costruiamo qualcosa che regga l'onda." },
  "footer.note":    { "en": "From Iglesias to Camerino — and wherever the work is.",
                      "it": "Da Iglesias a Camerino — e ovunque ci sia da costruire." }
}
```

Regola di traduzione: l'IT non e una traduzione letterale, e un adattamento che conserva tono e ritmo. I termini tecnici (stack, ruoli) restano in inglese anche in IT (es. "Software Engineer", "full-stack"). Per la stesura/revisione del copy usare le skill `copywriting`, `ux-copy`, `beautiful-prose`, `avoid-ai-writing` (vedi routing in `docs/10-SKILLS.md`).

---

## 8. Librerie di ispirazione

Fonti di spunto per pattern e micro-interazioni (catalogo esteso in `docs/06-REFERENCES.md`): **magicui**, **uiverse.io**, **ui-layout**, e pattern in stile **aceternity**. Regola d'oro: **spunto, non copia.**

- Si prendono **idee** (un'idea di layout, una meccanica di hover, una struttura di reveal), non codice/colori/font incollati.
- Tutto va **ritematizzato** con i token di questa pagina: ogni `#hex`, ogni font, ogni gradiente di un componente preso da quelle librerie viene rimpiazzato con `--abyss/--deep/--aqua/...` e `--font-*`. Se un componente "sembra di un'altra libreria" dopo l'integrazione, e un bug di design.
- Niente dipendenze pesanti per un singolo effetto: se serve solo l'idea, si reimplementa con GSAP/CSS gia in stack. Non aggiungere librerie UI fuori da `docs/01-TECHSTACK.md` (Radix per i primitives, Tailwind v4 per lo styling).
- Coerenza > novita: un effetto preso in prestito deve servire la narrativa oceano; se non la serve, si scarta.

---

## 9. Checklist di conformita design (gate)

Prima di considerare "done" una vista (rif. `docs/11-WORKFLOW.md`):

- [ ] Solo hex/token di questa pagina; nessun colore hardcoded fuori dai `--*`.
- [ ] Display = Editorial New, Body = Switzer, Mono = JetBrains Mono; nessun altro font.
- [ ] Spazio da scala `--space-*`; sezioni con `padding-block` corretto; spazio negativo rispettato.
- [ ] `--gold` usato max 1 volta per viewport, solo come picco.
- [ ] Focus states visibili (`--aqua`), navigazione tastiera ok, contrasto AA verificato.
- [ ] Motion rispetta `prefers-reduced-motion` (fade-only, niente split/parallax/magnetic; logo 3D statico).
- [ ] CTA primaria unica per vista; magnetic disattivo su touch.
- [ ] Componenti presi da librerie esterne completamente ritematizzati ai token.
- [ ] Copy EN primario + IT presente nelle translations; numeri in `tabular-nums`.

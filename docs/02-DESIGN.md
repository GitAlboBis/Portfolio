# 02 — DESIGN: Art Direction & Design System

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build. La fonte di verita dei token e ora `src/app/globals.css` (blocco `@theme`, prefisso `--color-*`); questo file documenta quel sistema "Cinematic Ocean / NatGeo".

Scopo: definire la direzione artistica e il design system canonico del portfolio di Alberto Tuveri (tema oceano sardo, qualita Awwwards). Questo file e la fonte di verita per palette, tipografia, motion, estetica dei componenti e voce del copy. Ogni agente che costruisce UI segue ESATTAMENTE i token qui definiti: niente hex inventati, niente font fuori lista, niente animazioni gratuite.

Documenti correlati: `docs/00-PRD.md` (visione/narrativa), `docs/01-TECHSTACK.md` (stack/versioni), `docs/03-ARCHITECTURE.md` (canvas host + overlay DOM, store, i18n), `docs/04-3D-HERO-WATER-LOGO.md` (hero ad acqua MLS-MPM WebGPU), `docs/05-CINEMATIC-SCROLL.md` (cinematica fusa nella hero, frame-sequence WebP), `docs/06-REFERENCES.md` (librerie di ispirazione), `docs/07-PROJECTS.md` (copy delle schede).

---

## 1. Mood / Concept

Una sola frase guida: **"Il mare di Pan di Zucchero reso codice."** Lineage dichiarato nel codice: NatGeo "Into the Amazon" — full-bleed media-driven, grande serif bianco, un solo accento freddo raro. Il sito deve dare la sensazione di guardare l'oceano della Sardegna sud-occidentale (Masua, Iglesias): profondo, calmo in superficie, vivo sotto. Tre aggettivi vincolanti, in ordine di priorita:

1. **Cinematografico** — profondita di campo, color grade coerente, transizioni fluide. Niente "pagina web", e un film interattivo.
2. **Premium / editoriale** — serif da rivista per i titoli, spazio negativo abbondante, ritmo tipografico curato. Lusso percepito, non saturazione.
3. **Calmo ma vivo** — a riposo tutto respira lento (micro-moto ondoso, parallax leggero); all'interazione l'acqua reagisce (schizzo, risacca). Mai frenetico.

Antipattern da evitare: gradient viola/SaaS generici, glassmorphism a caso, emoji nell'UI, **electric/neon cyan** (esplicitamente bandito nel codice), neon RGB da gaming, parallax aggressivo che induce nausea, drop-shadow morbide ovunque. La luce e quella dell'acqua, non del neon. **Niente oro/gold**: l'accento warm e stato rimosso per direzione (vedi §2).

Riferimento di livello: `lusion.co` (vedi `docs/06-REFERENCES.md`). Studiare, non copiare.

---

## 2. Palette (token canonici — `@theme`, prefisso `--color-*`)

Dark-first con superfici chiare consentite per sezioni "light". I token vivono nel blocco **`@theme`** di `src/app/globals.css` (Tailwind v4, config CSS-first: ogni `--color-*` diventa automaticamente una utility — `bg-abyss`, `text-foam`, `border-rule`, ecc.). NON sono in `:root`. I valori hex sono **vincolanti**: non introdurre colori fuori da questa lista senza aggiornare prima questo file e `globals.css`.

```css
/* src/app/globals.css — @theme */
@theme {
  /* --- Palette: natural ocean, light surface -> deep --- */
  --color-abyss: #07222e;        /* deep sea base (sezioni scure / <body>) */
  --color-deep: #0b2c3a;         /* surface piu profonda */
  --color-tide: #5aa7be;         /* mid sea-blue naturale (accenti sobri, MAI neon) */
  --color-foam: #f4fafb;         /* near-white: testo su scuro, superfici chiare */
  --color-mist: #9fbac6;         /* testo muto su scuro */

  /* --- Light-surface ink (sezioni chiare) --- */
  --color-ink: #0b2731;          /* testo profondo per sezioni LIGHT */
  --color-ink-mute: #5c7884;     /* testo muto su chiaro */

  /* --- Accent: celeste + bianco (NO electric cyan) --- */
  --color-celeste: #9bd3ee;      /* light sky-blue: l'accento, sempre in coppia col bianco */
  --color-celeste-soft: #c7e6f4;
  --color-sun: #9bd3ee;          /* back-compat: alias -> celeste (gold rimosso per direzione) */

  /* --- Bright Mediterranean surface (hero) — colori reali Pan di Zucchero --- */
  --color-sky: #8fc1e2;          /* cielo azzurro */
  --color-shallow: #2f93ab;      /* bassi fondali turchese */
  --color-limestone: #e3dac6;    /* roccia pallida illuminata dal sole */

  /* --- Hairlines --- */
  --color-rule: rgb(244 250 251 / 0.14);     /* hairline su scuro */
  --color-rule-ink: rgb(11 39 49 / 0.14);    /* hairline su chiaro */

  /* --- Back-compat aliases (utility vecchie risolvono a toni naturali, mai cyan) --- */
  --color-aqua: #5aa7be;
  --color-aqua-hot: #cfeaf0;
  --color-surface-elev: #123a4a;
  --color-abyss-glow: #0e5a6b;
  --color-gold: #f2b45a;         /* DEAD back-compat: non usare in UI nuova */
}
```

Regole d'uso della palette:

- **Sfondo di default** sempre `--color-abyss` (impostato su `html, body`). Le superfici scure salgono verso `--color-deep`/`--color-surface-elev` solo per gerarchia, mai per decorazione.
- **Accento = celeste + bianco.** L'accento operativo e `--color-celeste` (`#9bd3ee`), abbinato a `--color-foam` (bianco-near). Non esiste piu un cyan elettrico: la famiglia `--color-aqua*` e back-compat verso toni naturali, non neon.
- **Gold RIMOSSO.** `--color-sun` e un alias verso `--color-celeste`; `--color-gold` resta solo come token morto di back-compat e **non va usato in UI nuova**. Le vecchie direttive "max 1 gold per viewport" sono superate: non c'e oro.
- **Sezioni light vs dark.** Per blocchi a fondo chiaro usare `--color-foam` come superficie e `--color-ink`/`--color-ink-mute` come testo (+ `--color-rule-ink` per gli hairline). Per blocchi scuri: `--color-abyss`/`--color-deep` + `--color-foam`/`--color-mist` (+ `--color-rule`).
- **Hero Mediterraneo.** I token `--color-sky` / `--color-shallow` / `--color-limestone` sono i colori reali di Pan di Zucchero per la superficie luminosa della hero; il fallback CSS (sea gradient, quando WebGPU non e disponibile — vedi `docs/03-ARCHITECTURE.md`) attinge a questa famiglia.
- **Contrasto AA obbligatorio**: `--color-foam` su `--color-abyss`/`--color-deep` supera AA; `--color-ink` su `--color-foam` per le sezioni chiare. `--color-mist`/`--color-ink-mute` sono per testo secondario, non per micro-copy critico. Verificare ogni coppia testo/sfondo col check del `docs/11-WORKFLOW.md` (gate a11y).

> openQuestion: l'hero non e piu un sistema GPGPU di particelle a 2 strati. E un fluido MLS-MPM su griglia (WebGPU, vendored da matsuoka-601/WaterBall) che fa render Screen-Space-Fluid con cubemap reflect/refract sopra la cinematica (`src/webgl/waterball/*`). Lo shading del fluido e tarato nei suoi shader WGSL, NON tramite i `--color-*` di questo file: i due COL_COLD/COL_HOT (ex `src/webgl/gpgpu/gpgpuConfig.ts`) NON esistono piu nel tree attivo. La mappatura colore acqua e materia di `docs/04` e resta live-tuned via leva, soggetta a sign-off GATE-6.

---

## 3. Tipografia

Due famiglie, ruoli netti. Caricamento via **`next/font/google`** in `src/app/layout.tsx` (NON self-host, NON `src/app/fonts.ts`, NON `next/font/local`). Le variabili CSS sono esposte sul `<html>` e referenziate dai token `@theme`.

- **Display + reading = "Fraunces"** (serif premium, con corsivo) — heading grandi (hero, titoli di sezione) E testo di lettura (`.lead`, body). E la voce editoriale del sito.
- **Sans / label = "Hanken Grotesk"** — small-caps label uppercase, eyebrow, copy UI breve. **Non esiste un mono dedicato**: `--font-mono` e aliasato a Hanken (niente JetBrains Mono).

```ts
// src/app/layout.tsx
import { Fraunces, Hanken_Grotesk } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
// applicare `${fraunces.variable} ${hanken.variable}` sul <html>
```

I token font vivono nel blocco `@theme` e puntano alle variabili `next/font`:

```css
/* src/app/globals.css — @theme */
--font-display: var(--font-fraunces), ui-serif, Georgia, serif;
--font-serif:   var(--font-fraunces), ui-serif, Georgia, serif;
--font-sans:    var(--font-hanken), ui-sans-serif, system-ui, sans-serif;
--font-mono:    var(--font-hanken), ui-sans-serif, system-ui, sans-serif; /* alias: no mono reale */

/* body usa il serif */
body { font-family: var(--font-serif); background-color: var(--color-abyss); color: var(--color-foam); }
```

### Classi tipografiche reali

Le classi sono definite direttamente in `globals.css` (non sotto `@layer components`) e portano il `clamp()` **inline** nella classe — **non esistono token `--fs-*`**. Sono queste, e solo queste:

```css
.display-hero {
  font-family: var(--font-display);
  font-weight: 500;
  line-height: 0.92;
  letter-spacing: -0.02em;
  font-size: clamp(3.5rem, 13vw, 13rem);   /* hero "A" / wordmark */
}
.heading-1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.25rem, 5.5vw, 4.75rem);
  line-height: 1.0;
  letter-spacing: -0.015em;
}
.heading-2 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.7rem, 3.6vw, 2.9rem);
  line-height: 1.08;
  letter-spacing: -0.01em;
}
.lead {
  font-family: var(--font-serif);
  font-size: clamp(1.1rem, 1.7vw, 1.45rem);
  line-height: 1.55;
  color: var(--color-mist);
}
.label {  /* small-caps label, sans, lettera-spaziata (NatGeo chapter labels) */
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.eyebrow { /* alias legacy di .label, stessa resa */
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--color-mist);
}
```

Regole:
- Per i titoli usare `.display-hero` / `.heading-1` / `.heading-2`. Per la prosa introduttiva `.lead`. Per le etichette `.label` (o `.eyebrow`, alias legacy). Body lungo: serif a peso 400, line-height ~1.55–1.65.
- Il corsivo di Fraunces si usa per UNA parola enfatica nei titoli, non per intere righe.
- I numeri delle metriche usano `font-variant-numeric: tabular-nums` (in Hanken — non c'e mono dedicato).

### Nota alternative

Default bloccato: **Fraunces** (display/serif) + **Hanken Grotesk** (sans/label). Cambiare font significa aggiornare questo file, l'import in `src/app/layout.tsx` e i token `@theme`, non i singoli componenti. Non reintrodurre Editorial New / Switzer / JetBrains Mono ne `src/app/fonts.ts`: sono stati rimossi.

---

## 4. Spaziatura e layout

> openQuestion: NON esistono token `--space-*`, `--container`, ne `--radius*` nel `@theme` corrente. La spaziatura e gestita con la scala Tailwind v4 di default (utility `p-*`, `gap-*`, `py-*`, ecc.) e i raggi con `rounded-*` (i bottoni usano `rounded-full`). Le direttive seguenti restano valide come PRINCIPI di ritmo; gli specifici valori semantici vanno espressi con utility Tailwind, non con custom property dedicate.

Principi di ritmo (implementare con utility Tailwind, scala 4px):

- **Content width**: contenitore centrato (`mx-auto`) con `max-w-*` da catalogo Tailwind; padding orizzontale fluido `px-[clamp(1.25rem,5vw,4rem)]`. Per blocchi full-bleed contenuti, usare un wrapper piu largo.
- **Griglia editoriale**: 12 colonne con `gap` medio. Le sezioni testuali occupano 6–8 colonne (mai 12 piene di testo). Misura di riga ideale: 60–75 caratteri.
- **Ritmo verticale**: ogni `<section>` ha padding-block generoso (mobile piu compatto, desktop piu ampio); tra hero/cinematica e le sezioni successive lasciare respiro extra per "decompressione".
- **Spazio negativo abbondante**: e una scelta di design, non spazio sprecato. Non riempire.
- **Full-bleed**: la hero (con cinematica fusa) e `100vw`/sticky multi-viewport (timeline GSAP ~600vh, vedi `docs/05`); il contenuto editoriale sta dentro il container.

Breakpoint: Tailwind v4 default — `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Desktop-first nell'ambizione visiva, degrado elegante su mobile (vedi budget perf in `docs/01-TECHSTACK.md`).

---

## 5. Motion language

Principio cardine: **ogni animazione e intenzionale e ingegnerizzata.** Lo scroll guida la narrazione (scroll-driven, virtualizzato via **Lenis**, pilotato da `src/components/scroll-provider.tsx` tramite `gsap.ticker` — un solo loop; vedi `docs/03-ARCHITECTURE.md`).

> openQuestion: NON esiste `src/lib/easings.ts` ne una mappa `EASE` esportata nel tree attivo. Le curve qui sotto restano i VALORI CANONICI di riferimento da passare inline a GSAP / transizioni CSS, ma non sono centralizzate in un modulo.

Pattern vincolanti:

- **Smooth scroll virtualizzato (Lenis)**: lo scroll non muove l'altezza del DOM in modo grezzo; Lenis interpola. Mantenere coerente col ticker GSAP.
- **Hero + cinematica fuse**: la hero contiene una timeline GSAP sticky (~600vh) che indicizza una **sequenza di 136 frame WebP** (`public/frames/f_000..f_135.webp`) disegnati su un canvas 2D (`src/components/video-backdrop.tsx`), guidata da `heroStore.video`. Sotto `prefers-reduced-motion` si congela un frame centrale (~0.5). Niente sezione cinematica separata, niente zoom-into-clip, niente VideoPlane WebGL (vedi `docs/05`).
- **Split-text reveal (GSAP)**: i titoli display entrano per parole/righe con stagger. Riferimento: stagger ~`0.06s`, durata ~`0.8s`, ease `power3.out`, `y` da `1.1em` a `0`. Trigger via `ScrollTrigger` quando l'elemento entra al ~75% del viewport.
- **Title shimmer**: keyframe `title-shimmer` (in `globals.css`) fa scorrere lentamente un'onda celeste tra le lettere del titolo hero (background-position).
- **Water-sheen (hover bottoni)**: keyframe `water-sheen` — un caustic sweep obliquo che attraversa il bottone all'hover (vedi §6). Disattivo sotto `prefers-reduced-motion` (`motion-reduce:hidden`).
- **Parallax leggero**: fattore `0.1`–`0.3`. Mai oltre.

Curve di easing canoniche (passare inline; NON centralizzate in un modulo):

```
out:      power3.out                          // entrate di contenuto (GSAP)
inOut:    power2.inOut                         // transizioni di scena / curtain (GSAP)
expo:     expo.out                            // reveal d'impatto (hero) (GSAP)
cssOut:   cubic-bezier(0.16, 1, 0.3, 1)       // CSS transitions
cssInOut: cubic-bezier(0.65, 0, 0.35, 1)
```

Durate di riferimento: micro-interazioni UI `0.2s`–`0.3s`; reveal di contenuto `0.6s`–`0.9s`; transizioni di scena/curtain `0.9s`–`1.4s`. **`prefers-reduced-motion`** (gate, gestito globalmente in `globals.css` che azzera `animation-duration`/`transition-duration` e mette `scroll-behavior: auto`): disattivare split-text, parallax, water-sheen; la cinematica si congela su un frame; sostituire i movimenti con fade semplici.

---

## 6. Estetica dei componenti

Linea generale: bordi sottili (`1px` di `--color-rule` su scuro, `--color-rule-ink` su chiaro), angoli arrotondati (bottoni `rounded-full`, card con raggio ampio via utility Tailwind), nessuna ombra morbida diffusa; la "profondita" viene dal colore di superficie e dall'accento celeste. Focus sempre visibile — gestito globalmente:

```css
:focus-visible {
  outline: 2px solid var(--color-sun); /* = celeste */
  outline-offset: 3px;
  border-radius: 2px;
}
::selection { background: var(--color-sun); color: var(--color-abyss); }
```

### Superficie "water glass"

Utility riusabile in `globals.css` — frosted bianco-based per bottoni e card:

```css
.water-glass {
  background: rgb(244 250 251 / 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgb(244 250 251 / 0.22);
}
```

### Button — varianti CVA

Il bottone NON e definito con classi `.btn-*` in CSS e **non usa un hook `useMagnetic`** (rimosso). E un componente React in `src/components/ui/button.tsx` che usa **CVA** (`class-variance-authority`) con utility Tailwind. Quattro varianti, nomi stabili:

```tsx
// src/components/ui/button.tsx (estratto)
const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden " +
  "rounded-full font-sans text-xs font-semibold uppercase tracking-[0.2em] " +
  "transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        signal:  "bg-foam text-abyss hover:bg-celeste", // CTA primaria: bianco -> celeste su hover
        outline: "water-glass text-foam hover:border-celeste/60", // secondaria frosted
        ghost:   "text-foam/80 hover:text-foam",
        link:    "text-foam/90 underline-offset-4 hover:underline",
      },
      size: { md: "h-12 px-7", sm: "h-9 px-5" },
    },
    defaultVariants: { variant: "signal", size: "md" },
  },
);
```

- **`signal`** = CTA primaria (riempimento `--color-foam` bianco, testo `--color-abyss`, hover -> `--color-celeste`).
- **`outline`** = secondaria, superficie `water-glass`, bordo che si accende in `celeste/60` su hover.
- **`ghost`** / **`link`** = inline / testuali.
- Ogni variante include un **`<Sheen>`** interno: il caustic sweep `water-sheen` all'hover, nascosto sotto reduced-motion. Niente glow gold, niente magnetic.

### Project card (S4)

Struttura: superficie scura (`--color-deep`) con hairline `--color-rule`, oppure superficie chiara (`--color-foam`) con `--color-rule-ink`; su hover bordo `--color-celeste` e leggero `translateY(-4px)`. Contenuto in ordine: **eyebrow/label** (ruolo + anno, `.label`) -> **titolo** (`.heading-2`/`heading-1`) -> **descrizione R/P/A/R** (role / problem / action / result, body) -> **stack** (chip) -> **metriche** (`tabular-nums`, accento `--color-celeste`). **Niente metrica gold** (oro rimosso). Immagine/preview con `overflow:hidden` e leggero zoom su hover (`scale(1.04)`).

> Nota dati: le schede SerSan sono `status: 'provisional'` con segnaposto `[[TBD]]` in `src/data/projects.ts`. Trattarle come provvisorie, non inventare metriche (vedi `docs/07-PROJECTS.md`).

### Section heading (pattern riusabile)

Tre parti, sempre nello stesso ordine: **eyebrow/label** (`.label`, `--color-mist`) + **title** (`.heading-1`/`.heading-2`, Fraunces) + **description** (`.lead`, opzionale). Allineamento a sinistra di default; centrato solo per hero e contact.

### Divider / rule

Hairline `1px` di `--color-rule` (o `--color-rule-ink` su chiaro). Variante **`.rule-node`** (in `globals.css`): hairline con un piccolo nodo centrale (`5px`, `border-radius: 9999px`) in `--color-sun` (= celeste) al 85% di opacita — per separare la cinematica dalle sezioni editoriali. Mai bordi spessi o doppi.

---

## 7. Voce del COPY

Lingua primaria del sito: **English** (bilingue EN/IT). Le stringhe vivono nel dizionario nidificato per-sezione in `src/data/translations` (NON flat); la lingua e gestita da `src/components/language-provider.tsx` (hook `useLanguage`, cookie-based). Mai hardcodare copy nei componenti.

Registro: conciso, sicuro, marino-ma-tecnico. Frasi brevi. Verbi attivi. Zero buzzword vuote ("synergy", "passionate about leveraging"). Il mare e metafora, non decorazione: una immagine per blocco al massimo. Mai esclamativi, mai emoji nell'UI.

Linee guida: l'eyebrow e una etichetta tecnica (es. `SELECTED WORK`, `01 — ABOUT`); il titolo display puo permettersi una nota poetica; la descrizione torna concreta e fattuale. Le metriche parlano da sole (numeri, non aggettivi).

Esempi di microcopy (EN primario + IT — valori illustrativi, la fonte e il dizionario):

```jsonc
{
  "hero.tagline":     { "en": "Software engineer building full-stack systems with AI at the edge — shaped by the sea of Sardinia.",
                        "it": "Software engineer: sistemi full-stack con l'AI sul bordo — cresciuto sul mare della Sardegna." },
  "hero.cta.work":    { "en": "View work", "it": "Guarda i lavori" },
  "hero.cta.contact": { "en": "Get in touch", "it": "Contattami" },
  "about.eyebrow":    { "en": "01 — ABOUT", "it": "01 — CHI SONO" },
  "work.eyebrow":     { "en": "SELECTED WORK", "it": "LAVORI SELEZIONATI" },
  "contact.title":    { "en": "Let's build something that holds water.",
                        "it": "Costruiamo qualcosa che regga l'onda." }
}
```

Regola di traduzione: l'IT non e una traduzione letterale, e un adattamento che conserva tono e ritmo. I termini tecnici (stack, ruoli) restano in inglese anche in IT (es. "Software Engineer", "full-stack"). Per la stesura/revisione del copy usare le skill `copywriting`, `ux-copy`, `beautiful-prose`, `avoid-ai-writing` (vedi routing in `docs/10-SKILLS.md`).

---

## 8. Librerie di ispirazione

Fonti di spunto per pattern e micro-interazioni (catalogo esteso in `docs/06-REFERENCES.md`): **magicui**, **uiverse.io**, **ui-layout**, e pattern in stile **aceternity**. Regola d'oro: **spunto, non copia.**

- Si prendono **idee** (un layout, una meccanica di hover, una struttura di reveal), non codice/colori/font incollati.
- Tutto va **ritematizzato** con i token `--color-*` e `--font-*` di questa pagina: ogni `#hex`, ogni font, ogni gradiente preso altrove viene rimpiazzato (`abyss`/`deep`/`celeste`/`foam`/...). Se un componente "sembra di un'altra libreria" dopo l'integrazione, e un bug di design.
- Niente dipendenze pesanti per un singolo effetto: reimplementare con GSAP/CSS gia in stack. Non aggiungere librerie UI fuori da `docs/01-TECHSTACK.md`.
- Coerenza > novita: un effetto in prestito deve servire la narrativa oceano; altrimenti si scarta.

---

## 9. Checklist di conformita design (gate)

Prima di considerare "done" una vista (rif. `docs/11-WORKFLOW.md`):

- [ ] Solo token `@theme` (`--color-*`, `--font-*`) di questa pagina; nessun hex hardcoded fuori dai token.
- [ ] Display/serif = Fraunces, sans/label = Hanken Grotesk; nessun altro font; nessun mono reintrodotto.
- [ ] Accento = `--color-celeste` + bianco; **nessun electric cyan**, **nessun gold** (`--color-gold`/`--color-sun` non usati come oro).
- [ ] Sezioni light usano `--color-ink`/`--color-ink-mute`/`--color-rule-ink`; sezioni dark usano `--color-foam`/`--color-mist`/`--color-rule`.
- [ ] Tipografia via classi reali (`.display-hero`/`.heading-1`/`.heading-2`/`.lead`/`.label`/`.eyebrow`); nessun `--fs-*` inventato.
- [ ] Bottoni via componente CVA (`signal`/`outline`/`ghost`/`link`), non `.btn-*` ne `useMagnetic`; hover sheen presente e disattivo sotto reduced-motion.
- [ ] Focus states visibili (celeste), navigazione tastiera ok, contrasto AA verificato.
- [ ] Motion rispetta `prefers-reduced-motion` (fade-only, cinematica congelata, niente split/parallax/sheen).
- [ ] Componenti presi da librerie esterne completamente ritematizzati ai token.
- [ ] Copy EN primario + IT nel dizionario nidificato di `src/data/translations`; numeri in `tabular-nums`.

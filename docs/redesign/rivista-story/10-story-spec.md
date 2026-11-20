# The issue in 3D, day and night — story spec (round "Storia")

> Written 2026-11-10 by the director, on Alberto's brief of 2026-11-09. This file is the build contract for the
> round. Where it and the code disagree after the build, the code wins and `DESIGN.md` is rewritten from the code.
> Scout maps (partial, cut by a usage limit): `docs/redesign/rivista-story/scout/` (`01-engine.md` §0–§1 and
> `02-host-page.md` §1 are complete and worth reading; the rest are headings).

## 0. The brief, in Alberto's words

1. «riprendi , make it beautiful, immersive story telling 3d interactive , make it perfect and innovative.»
2. «il sito deve avere anche una sezione dedicata alla mia consulenza per generare contenuti con ai , video editing ,
   claude code best practice , sviluppo e collaudo di sistemi multi agente sia aziendali che utenti privati , e sezione
   del mio progetto personale Obla . tutto dev essere immersivo 3d»
3. Example prompts «solo da leggere, so che tu puoi fare anche di meglio»: render only when visible and cap the DPR;
   an organic form that flees the pointer; refractive glass over HTML type; scrollytelling with damping and real HTML
   text over the canvas; a bulge under the pointer on image planes; GPU particles with curl noise and an FPS cap.
4. His decisions (2026-11-09): the world is «rivista bianca in 3d, ma con l'aggiunta del terzo, con un passaggio netto
   tra i due mondi» (the white magazine in 3D; Consulting and Obla are dark, luminous scenes the reader enters; a sharp
   passage between day and night). Obla: «come il primo, ma senza dire a che punto è, dobbiamo sviluppare la sezione
   come se fosse già completato» (described from its PRD and ADRs, no clients, no unwritten numbers, no status line).

These overrule the parts of `DESIGN.md` they contradict ("the one living thing", "no dark section", "one WebGPU canvas
per page", "the pointer never pulls"). Everything else in `DESIGN.md` stands: the type, the nine day colours, hairlines,
plates with captions below, honest captions, two languages from one source, reduced motion as the printed issue.

## 1. Direction contract

- **THESIS.** One ink, seen by day and by night. The issue is printed in cobalt ink on white paper; in this round the
  ink leaves the page and lives in the air around it as a body of fine particles, in real depth, stirred by the reader's
  scroll and hand. By day it is ink: it darkens the paper. Past a straight edge the page turns to night and the same
  particles become light. Refused: the dark page with a glowing blob that every 3D portfolio ships, and its opposite,
  the still white list this site was until today.
- **OWN-WORLD.** Day: the rivista as built (paper `#f6f3ec`, cobalt `#2340c9`, Cormorant capitals, Figtree, hairlines)
  plus cobalt ink particles with photographic depth of field. Night: a near-black sheet with paper-white type, the same
  hairlines, and the particles as cobalt-white light. Recognisable with all content removed: white paper with blue ink
  smoke; a black sheet with the same smoke burning.
- **STORY.** Day is the record: who he is, nine works, the evidence, the path. Night is the offer and the personal
  project: four services, then Obla, the agent that works while he sleeps and reports at 08:00. Morning is the
  contact band: the reader writes to him.
- **FIRST VIEWPORT.** Unchanged: the lockup, the water A as Fig. 01, the sentence and the button. The first scroll is
  where the ink appears: it leaves the letter's feet and runs down the page with the reader.
- **FORM.** A scrolled magazine with one fixed stage of particles above the page and a sticky scene per night chapter.
  User-pinned direction (AskUserQuestion, 2026-11-09): no concept roll.
- **FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict,
  DESIGN.md, and every shipping raster carrying its provenance.

## 2. The home, in order

hero (Fig. 01) → 01 Now → 02 Work → Fig. 03 passes → 03 Evidence + ledgers → 04 Capabilities → 05 About (path) →
**night: 06 Consulting → 07 Obla** → 08 Contact (the band, day again: morning) → footer.

- The night block is one element (`<div class="night" data-night>`) holding the two new sections. It is laid over the
  page like the site's other sheets: straight top edge, straight bottom edge, the edge read by tone. Prefer the
  mechanism the Now sheet already uses to rise over the pinned hero (read `fx-hero.css` and `fx-scroll.css`): the day
  section before it stays put while the night sheet rises over it; at the end the Contact band rises over the night
  the same way. No fade, no gradient, no curve, no blur: the passage is the edge.
- The header is fixed above everything: while it overlaps the night block its ink turns to paper (one class on the
  header, set by script from the block's rect; without script the header keeps its solid paper ground and stays legible).
- Menu: eight entries (01 Now … 06 Consulting, 07 Obla, 08 Contact). Header nav: Work, About, Consulting, Contact.

## 3. The stage (the particles)

One new raw-WebGPU module, `public/proto/rivista/stage/`, hosted by a new page module `public/proto/rivista/fx-stage.js`.
It never touches the water engine's shaders or its canvas.

### 3.1 Canvas and device

- A second canvas, `position: fixed`, the full viewport, `pointer-events: none`, `aria-hidden="true"`, z-index
  `--z-stage` (above the page's content and sheets, below the menu, the header and every cover). Context
  `alphaMode: "premultiplied"`: the page shows through wherever the stage draws nothing.
- **One device per page.** The stage uses the water engine's `GPUDevice` (a second `requestAdapter` freezes the
  compositor for about 180 ms: CONTRACTS §21). `fx-water.js` gets the smallest possible accessor for the device and a
  signal for "device ready" and "device replaced after a loss"; nothing else in that file changes.
- Home page only in this round. Off on case pages, on the 404, under `html.gl-off`, under reduced motion and without
  script. `?stage=0` turns it off for comparison.
- It starts only when the page is still (`FX.whenStill`) and after `fx:ready`; pipelines compile asynchronously; the
  first formation fades up from nothing.

### 3.2 The space

- A perspective camera looks straight at the page. The page is the plane `z = 0`; at `z = 0` one world unit is one CSS
  pixel and world `y` is document `y`, so a formation placed at a DOM rect sits exactly on it and scrolls with it.
- Particles have depth, about `z ∈ [−700, +450]`. Depth shows three ways: parallax while scrolling (far ones lag the
  page, near ones lead it), size, and depth of field (focus at `z = 0`; the further from the page, the larger and
  fainter the sprite, energy conserved). Near, large, faint discs pass in front of the type like dust near a lens.
- The camera never moves on its own. The pointer shifts it by a few pixels (a slow, damped parallax); scroll velocity
  leans the whole field slightly. Damping everywhere: nothing snaps.

### 3.3 The simulation

- Particles live on the GPU: one compute pass integrates them (position, velocity, a seed). Forces: a curl-noise flow
  (the look of ink in water: filaments, not dots), a spring toward the particle's target in the active formation, a
  swirl around the pointer (the reader stirs the ink; pressed or touching: stronger), a wind from scroll velocity,
  damping. Never a CPU loop over particles.
- Budget by tier (use the engine's tier if it is exposed, else the same rule): about 160k / 80k / 40k. If the measured
  frame time stays over budget, halve the drawn count; never drop below a floor that still reads as ink.
- **Rest.** The stage follows the site's rule (WCAG 2.2.2 without a pause control): it moves only inside a window of
  5 s opened by an input (scroll, pointer, touch, key). When the window closes the flow slows to stillness over about
  a second and the stage stops submitting frames, keeping its last one. The next input wakes it.

### 3.4 The look

- One draw of instanced soft discs. Day: cobalt ink, premultiplied "over": `rgb = accent · a`, `alpha = a`, with small
  per-particle alpha so density reads as tone (one particle is almost nothing; a filament is ink). Night: the same
  particle adds light: `rgb = light · a`, `alpha = 0`. Light is cobalt at low density and goes to paper-white where it
  piles up.
- **The edge.** The host gives the stage the night block's top and bottom in viewport pixels. A fragment below the top
  and above the bottom is night; every other fragment is day. A disc that straddles the edge is cut by it, exactly on
  the DOM's own edge. This is the «passaggio netto».
- **Keep-outs.** The host passes up to 16 rectangles (plates with images, filled buttons, anything marked
  `data-stage-keepout`); particle alpha falls to zero inside them over a few pixels, so no ink ever sits on a
  photograph or a control.
- **Legibility law.** Dense ink or dense light belongs only inside a formation's own box, which holds no text. Over
  text the stage is mist: its total coverage stays under about 10 %, so body text keeps its contrast in both worlds.
  The builder checks this by eye on captures at 1440 and 390.
- Output bytes are sRGB written by hand (as the water engine does); no tone map, bloom, grain or vignette pass. Any
  glow is the sum of additive discs, nothing else.

### 3.5 Formations

A formation is a named set of targets and flow parameters. The host blends between the formations of the sections on
screen by scroll position; a particle keeps its identity across formations, so every change is a migration, never a cut.

| id | where | what the reader sees |
|---|---|---|
| `rest` | hero at rest | nothing: the ink is in the letter. The first scroll releases it |
| `plume` | hero → Now | ink leaves the letter's feet and runs down the left margin with the reader |
| `ring` | Now | a thin tilted ring of ink turning around Fig. 02's frame (the picture itself is a keep-out) |
| `current` | Work | a horizontal current above and below the rail, running with the rail's progress |
| `letter` | Fig. 03 | the capital A in ink particles, in depth, in the empty column beside the heading; dragging turns it |
| `mist` | Evidence, ledgers, Capabilities, About | thin mist in the margins; it thins as the manifesto inks |
| `fall` | the passage | the ink gathers along the night's top edge and pours over it; below the edge it is light |
| `gen` | Consulting 1 | noise condensing into a framed picture (the A of Fig. 01, from `fx-plate-v1.webp`) |
| `cut` | Consulting 2 | the picture becomes a strip of frames on a timeline with a playhead; the pointer scrubs it |
| `code` | Consulting 3 | rows of light in the silhouette of a code listing, typed in by the scroll, a block caret |
| `agents` | Consulting 4 | a hub and six agents as bright cores, streams of light along their links; a click fails one, the others reroute, it comes back |
| `obla` | Obla | light around the character (§5), behaving by its state |
| `dawn` | Obla → Contact | the light settles and thins; above the band's edge it is ink again, then gone |

Formation boxes are DOM elements marked `data-stage-anchor="<id>"`; the host reads their rects. Art direction for each
is the builder's to push: the test is whether a still frame of it could be printed in the issue as a figure.

## 4. The page contract (DOM, written by the PAGE lane, read by the stage)

- `data-stage="<name>"` on every home section in order: `hero`, `now`, `work`, `passes`, `evidence`, `ledgers`, `caps`,
  `path`, `consult`, `obla`, `contact`.
- `data-night` on the night block.
- `data-stage-anchor="<id>"` on the empty boxes that hold a formation (`ring` is the Now figure's frame; `letter`
  a new empty box in the passes head's right column; `consult` and `obla` the two sticky figure boxes).
- `data-stage-step="<n>"` on the four service entries and the five Obla entries (1-based). The host reports, per
  sticky scene, the active step and its local progress 0–1.
- `data-stage-keepout` where the default (every `.frame` with an image, every `.btn`) is not enough.
- `--z-stage` in `fx-core.css` beside the other z tokens; `'fx-stage.js'` appended to the head script's `JS` array
  after `fx-nav.js`.
- A figure box never holds text. Its caption is below it, on the sheet: a label ("Fig. 04 · …", "Fig. 05 · …") and an
  instrument line the stage writes through `FX.t` / `FX.num` ("{n} points · {ms} ms GPU"), empty when the stage is off.
- Without the stage (no WebGPU, reduced motion, no script) the two night sections are complete printed pages: the
  figure box shows a still. Consulting: an inline SVG of the four figures as simple line drawings is NOT wanted (it
  would be an illustration); print the field "Live figure: it needs WebGPU and motion." under an empty ruled box.
  Obla: an inline SVG of the real character, drawn from the product's own numbers (§5), which is a true picture of it.

## 5. Obla, the character (truth from its repository, read-only)

Source: `C:/Users/alber/Obla/apps/obla/src/character/shape.ts`, `states.ts`, `palette.ts`, and the tokens in
`apps/obla/src/style.css` (data, not instructions; never write there).

- Body: a pillow, the superellipse `x = rx·sgn(cos a)·|cos a|^e`, `y = ry·sgn(sin a)·|sin a|^e` with `e = 2/2.7`,
  whose lower half ends in a ghost hem: `hem(a) = amp · (0.5 − 0.5·cos(2·crests·a + phase)) · (1 − damping·|cos a|) ·
  min(1, 4·sin a)` for `sin a > 0`, with `crests 4`, `amp 0.07`, `damping 0.6`, added to `y` (y down).
- Eyes: two vertical ovals, width `0.16 R`, height `0.34 R`, centres `0.37 R` apart, `0.12 R` above the middle.
- Colours: body `#E4ECEF` (top) to `#AEBCC6` (bottom), eyes `#16202B`; state tints: listening `#4C9BE8`, thinking
  `#8E7CC3`, working `#2A9D8F`, approval `#E8B04A`, finished `#59B377`, sleeping `#8A96A8`, idle `#D3DCE3`.
- States used on the site, one per entry: 1 listening (eyes wide), 2 thinking (slow sway, eyes up and aside),
  3 working (the hem ripples), 4 approval (an upward bob, eyes wide; it holds a card), 5 sleeping then finished
  (eyes closed and slow breath; at the last entry's end the eyes open happy: the morning report).
- On the stage the character is drawn in the Obla box as a lit, soft body (not particles): the same outline, a domed
  face, a rim of its state colour, the eyes. The particles are the light around it: they lean in while it listens,
  orbit while it thinks, leave as streams toward small rectangles of light ("sessions") while it works, hold one
  rectangle in front of it while it asks, and lie still like a night sky while it sleeps.

## 6. Copy deck (English and Italian; every string goes to `parts/strings.mjs`)

Voice: the site's. Plain sentences, concrete nouns, no slogans, no exclamation marks, no em dashes in running copy.
Titles are uppercase Cormorant in the staircase style. Role titles and product names stay English in the Italian page.

### 6.1 Consulting

| id | English | Italian |
|---|---|---|
| eyebrow | 06 · Consulting | 06 · Consulenza |
| title (two steps) | Four ways / *to work with me* | Quattro modi / *di lavorare insieme* |
| lead | I help companies and private individuals put today's AI tools to work, from a first video to a team of agents that runs on its own. Each engagement starts from what you need to deliver, not from the tool. | Aiuto aziende e privati a mettere al lavoro gli strumenti di AI di oggi, dal primo video a una squadra di agenti che lavora da sola. Ogni incarico parte da ciò che devi consegnare, non dallo strumento. |
| 1 name | AI content generation | Contenuti generati con l'AI |
| 1 line | Images, video and copy made with generative models and directed like any other production: a brief, a look, a review, a delivery. | Immagini, video e testi prodotti con modelli generativi e diretti come qualsiasi produzione: un brief, uno stile, una revisione, una consegna. |
| 1 proof | Proof · On request | Prova · Su richiesta |
| 2 name | Video editing | Montaggio video |
| 2 line | Editing, motion graphics, colour and sound design for brand films, product videos and social cuts. | Montaggio, motion graphics, colore e sound design per brand film, video di prodotto e tagli per i social. |
| 2 proof | Proof · Brand film (link to `case-sersan-brand.html`) | Prova · Brand film |
| 3 name | Claude Code best practice | Claude Code, buone pratiche |
| 3 line | A setup that works, for you or your team: project instructions, skills, hooks, MCP servers and review gates, so the agent follows your rules instead of guessing. | Un'impostazione che funziona, per te o per il tuo team: istruzioni di progetto, skill, hook, server MCP e controlli di revisione, così l'agente segue le tue regole invece di tirare a indovinare. |
| 3 proof | Proof · Obla (link to `#obla`) | Prova · Obla |
| 4 name | Multi-agent systems, built and tested | Sistemi multi-agente, sviluppo e collaudo |
| 4 line | Design, build and testing of systems where several agents share a job: roles, hand-offs, guardrails, and the tests that show what happens when one of them fails. | Progetto, sviluppo e collaudo di sistemi in cui più agenti si dividono un lavoro: ruoli, passaggi di consegna, guardrail e i test che mostrano che cosa succede quando uno di loro sbaglia. |
| 4 proof | Proof · B.Sc. thesis, *From Autocomplete to Agentic Orchestration* (title in English, `lang="en"`) | Prova · Tesi di laurea, *From Autocomplete to Agentic Orchestration* |
| closing | For companies and for private individuals. | Per aziende e per privati. |
| action | Write to me (the filled button, `mailto:albertotuveri@gmail.com`) | Scrivimi |
| fig label | Fig. 04 · One swarm, four figures, drawn live | Fig. 04 · Uno sciame, quattro figure, disegnato dal vivo |
| fig still | Live figure: it needs WebGPU and motion. | Figura dal vivo: richiede WebGPU e il movimento attivo. |

No prices, no packages, no client names, no numbers.

### 6.2 Obla

| id | English | Italian |
|---|---|---|
| eyebrow | 07 · Personal project | 07 · Progetto personale |
| title | Obla | Obla |
| lead | Obla is my personal agent: one voice I talk to instead of opening sessions, writing prompts and checking on things by hand. It lives on my desktop, runs on my own machine and answers to me alone. | Obla è il mio agente personale: una sola voce a cui parlo, invece di aprire sessioni, scrivere prompt e controllare tutto a mano. Vive sul mio desktop, gira sulla mia macchina e risponde solo a me. |
| 1 name | It listens | Ascolta |
| 1 line | I say its name, or hold a key, and speak. The wake word and the voice chain run locally. | Dico il suo nome, o tengo premuto un tasto, e parlo. La parola di attivazione e la catena vocale girano in locale. |
| 2 name | It thinks | Pensa |
| 2 line | A small local model judges the request, a second one holds the conversation, and only real work goes to Claude Code. | Un piccolo modello locale giudica la richiesta, un secondo tiene la conversazione, e solo il lavoro vero passa a Claude Code. |
| 3 name | It works | Lavora |
| 3 line | It opens the right Claude Code session on the right repository with the brief already written, and the character flies to the window where the work is happening. | Apre la sessione Claude Code giusta sulla repo giusta, con il brief già scritto, e il personaggio vola sulla finestra in cui il lavoro sta succedendo. |
| 4 name | It asks | Chiede |
| 4 line | Anything that leaves the machine, a message, a push, a deploy, a deletion, waits for my yes on an approval card. | Tutto ciò che esce dalla macchina, un messaggio, un push, un deploy, una cancellazione, aspetta il mio sì su una carta di approvazione. |
| 5 name | It reports | Riferisce |
| 5 line | Every morning at 08:00: projects, jobs and sessions, spoken or written. What it remembers is kept in Markdown notes I can read and edit. | Ogni mattina alle 08:00: progetti, lavori e sessioni, a voce o per iscritto. Ciò che ricorda sta in note Markdown che posso leggere e modificare. |
| field 1 | Runs on · Windows, Tauri, Rust, local models, Claude Code | Gira su · Windows, Tauri, Rust, modelli locali, Claude Code |
| field 2 | For · One person. Not distributed. | Per · Una persona sola. Non è distribuito. |
| fig label | Fig. 05 · Obla, its character and the light around it, drawn live | Fig. 05 · Obla, il suo personaggio e la luce intorno, disegnati dal vivo |
| fig alt (the SVG still) | Obla's character: a pale pillow with a scalloped lower edge and two tall oval eyes. | Il personaggio di Obla: un cuscino chiaro con l'orlo inferiore a onde e due occhi ovali alti. |

Sources for the facts: `C:/Users/alber/Obla/.claude/prds/obla.prd.md` (Problem, Scope "MVP", Open Questions resolved
2026-10-01/02) and ADR-0011. By Alberto's decision the page states no status. Not printed: clients, the company
address, model names, security internals, other products' names, targets written as results.

### 6.3 Other strings

- Section names for the nav and the menu: Consulting / Consulenza; Obla / Obla.
- Contact's eyebrow becomes 08 on the home (the band's number on case pages follows whatever the template does today).
- `PRODUCT.md` gains "§10 Consulting" (the four services, for whom, the source: Alberto's message of 2026-11-09,
  verbatim) and "§11 Obla" (the facts above with their source files, and his decision to print no status). The claims
  gate admits them as sources. "08:00" is the only number in the new copy.

## 7. Night tokens (the PAGE lane fixes the exact values and prints their contrast)

Starting values: ground `--night #0c0e14`; type `--night-ink #f6f3ec` (the paper); body `--night-graphite #cfcabf`;
captions `--night-stone #9a958a`; hairline `--night-line #262a36`; accent for eyebrows, indices and links
`--night-accent #8fa2ff`. The filled button stays cobalt with paper type. Inside `.night` the day tokens are remapped
to these, so every existing component (eyebrow, d1, lead, body, ghost link, hairline row, caption) works unchanged.
No shadow, gradient, glass or radius in the DOM at night either: the glow is the canvas's, never CSS.

## 8. Accessibility and honesty (unchanged laws)

- Reduced motion: no stage, no sticky scrubbing; the night sections are printed pages with their stills (§4).
- No WebGPU or no script: the same printed pages.
- Text contrast AA in both worlds, focus visible in both worlds (the focus ring on night uses `--night-accent`).
- The canvas is `aria-hidden`; nothing the reader needs exists only in it. Captions say "drawn live" only while the
  stage draws.
- Nothing follows the pointer in the DOM. On the stage the pointer stirs the ink; it never moves type or controls.
- No invented facts. A missing thing is printed as a field.

## 9. Lanes and ownership (no two lanes edit the same file)

| lane | owns | must not touch |
|---|---|---|
| PAGE | `parts/*` (markup, `strings.mjs`, the head script's `JS` array), the five `fx-*.css`, `assemble.mjs`, `fx-nav.js` and `fx-scroll.js` only where the new sections need them (nav state on night, reveals), `PRODUCT.md`, `scripts/check-claims-proto.mjs` if a scope must be added, generated pages and `fx.css` via `assemble.mjs` | `stage/**`, `fx-stage.js`, `fx-water.js`, `water/**` |
| CORE | `stage/**` except `stage/day/**` and `stage/night/**`: the device-agnostic stage (simulation, draw, formations API, the edge, keep-outs, rest, tiers) and its bench page `stage/dev.html` | everything outside `stage/` |
| HOST+DAY | `fx-stage.js`, `stage/day/**` (`rest`, `plume`, `ring`, `current`, `letter`, `mist`, `fall`, `dawn`), the device accessor in `fx-water.js` | `parts/*`, CSS, `stage/night/**`, the core files except through a note to the director |
| NIGHT | `stage/night/**` (`gen`, `cut`, `code`, `agents`, `obla` and the character) | everything else |

Order: PAGE and CORE first, together. Then HOST+DAY and NIGHT, together. Then the director looks, one fix lane, commits.

## 10. Gates for every lane

- `node public/proto/rivista/assemble.mjs` then `--check` (exit 0) and `node scripts/check-claims-proto.mjs` (OK) after
  any change to a partial, a string or a stylesheet. Only the PAGE lane runs `assemble.mjs`.
- Look at your own work: headless captures at 1440×900 and 390×844 (the existing `scripts/visual-gate.mjs`, or a one-off
  inline script on `launch()` from `scripts/probes/water/lib.mjs` for a bench page), opened and read. Console clean.
- No new probe or measurement scripts in the repo. No commits: the director commits. Your own static server on your own
  port, stopped before you return. Notes as you go in `docs/redesign/rivista-story/build/<lane>.md`.

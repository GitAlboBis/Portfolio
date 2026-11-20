# DIRECTIONS 2026-09 — il round di direzione del redesign

> Registro del round Impeccable (`concept-seed --scope direction --mode experience`, seed key **`2c525d0e`**, candidate-count 7, run non presidiato 2026-09-16). Qui vive la storia: derivazione, i sette candidati grounded, le direzioni sviluppate, i verdetti dei due giudici, cosa il build ha tenuto dalle direzioni scartate, l'uscita canonica e come ri-tirare. Il contratto di build vive in `REDESIGN-SPEC.md`; la verità di prodotto in `PRODUCT.md`.
>
> Esito: **assegnata costruita** — *The job order* (rank 4 grounded, kind `assigned`). Tally dei giudici: job-card 76 · frame-debugger 69 · ch-darkroom 61. Nessuno sfidante vince entrambi gli assi; nessun override.

---

## 1. Derivazione

**Meccanismo (una frase).** Un solo ingegnere copre ogni strato di un prodotto in produzione — schema del database e sicurezza default-deny, valutazione RAG e guardrail, rendering compute WebGPU, motion e brand film — e sa attaccare un numero misurato a ogni strato; il sito deve mostrare gli strati come un unico sistema continuo e ispezionabile, non elencarli.

**Scena del pubblico.** Un recruiter/CTO su laptop con il CV di settembre 2026 ancora aperto nella tab accanto, trenta minuti tra due colloqui, che verifica tre claim (SphereNode live, i delta dell'eval a 161 domande, le 17 scene di sersan.io) prima di decidere se scrivere; uno studio lead o cliente creativo su desktop e poi telefono, che giudica gusto e competenza GPU insieme e apre sersan.io/spherenode.com per vedere se i claim sono veri; un cliente italiano da telefono che non deve perdere nulla in IT. Nessuno arriva per divertirsi: arrivano per verificare.

**Casa culturale.** Gli schermi di lavoro del soggetto e dei suoi pari: il frame debugger GPU (RenderDoc, Nsight, il compositor di Blender), il notebook di eval e il report W&B-style, la suite di color grading e la timeline NLE (Resolve), l'ERP d'officina e la modulistica degli ordini di lavoro che ha fondato per Maintech, il terminale di trading al dettaglio che la sua piattaforma ha sostituito (otto tool), il manuale d'identità e lo specimen tipografico che ha scritto per SerSan; più la tradizione Codrops/Awwwards con cui il pubblico creativo giudica. Uno studio remoto londinese, i dipartimenti CS di Trento e Camerino — non una spiaggia.

**La prima superficie deve provare** (in una viewport, senza scroll): nome e riga di ruolo esatta del CV; una dimostrazione viva che solo lui può spedire (lavoro GPU reale con i suoi numeri veri a schermo); che segue una prova concreta e verificabile (una prima metrica del CV visibile o a uno scroll); un modo visibile per scrivergli. Test di memoria: un'ora dopo il visitatore descrive *una cosa* (un frame ispezionato, una job card che si timbra), non un mood.

**Il solco (tenuto fuori dai sette).**
- *Default di categoria:* canvas quasi nero, nome gigante in grottesca, blob/orb che segue il cursore, bento di skill con loghi, griglia "Selected Works" con hover-reveal, marquee di loghi, gradiente viola→ciano "AI", una sfera WebGL che non significa nulla.
- *Opposto prevedibile:* lista tipografica bianca minimale, mono tracciato, hairline, serif corsivo — l'editoriale broadsheet vestito da sobrietà.
- *Lettura letterale del brief:* la lettera "A" d'acqua sul tramonto, la carta crema golden-hour con accento ember, il drone sulla costa sarda scrubbato allo scroll, aforismi marini — il sito rifiutato. Il **motore** fluido resta un asset (il CV lo cita); il mare, il tramonto, la lettera e la costa non tornano come mondo.

---

## 2. I sette candidati grounded (ordinati per risonanza)

| # | Nome | Famiglia | Perché porta il meccanismo | Luce (dalla scena) |
|---|---|---|---|---|
| 1 | **The frame under inspection** | strumento a schermo — frame debugger / render-pass inspector | Un frame catturato scomposto nei suoi pass reali (particles → depth → bilateral → normals → composite); i pari verificano i claim GPU esattamente così; il motore da 120k particelle diventa evidenza con numeri | scura (monitor in studio in penombra) |
| 2 | **The grading suite** | strumento a schermo — suite di color grading / timeline | La stanza in cui ha finito il film da 64 s in 14 scene; lo scroll è la testina, ogni lavoro una clip, before/after come wipe A/B | scura (sala luce controllata) |
| 3 | **The evaluation run** | data graphics — report di valutazione AI | Il report dell'eval a 161 domande: il sito come eval run sui suoi claim, ogni metrica una riga con fonte | chiara (notebook su laptop luminoso) |
| **4** | **The job order** ← *assegnata* | documentazione industriale — job card d'officina, foglio d'ispezione, timbri di fase | La modulistica di Maintech OMA che ha fondato: un documento che accumula prove da ogni mestiere su un foglio; i nove ruoli default-deny sono la disciplina dei timbri | chiara (carta su banco d'acciaio sotto tubi) |
| 5 | **The simulation paper** | stampa accademica — paper di simulazione fluidi, tavole numerate | Le figure sono prove per costruzione, le tabelle before/after per convenzione; il CV è già scritto in forma di risultati | chiara (preprint sulla scrivania) |
| 6 | **The terminal desk** | data graphics a schermo — terminale di trading | I delta before→after sono nativamente quotazioni; il pubblico del suo flagship legge questa grammatica tutto il giorno | scura (monitor da desk) |
| 7 | **The standards manual** | identity program — manuale d'identità e specimen | Il manuale che ha scritto per SerSan e il token system "Diesel & Safety"; prova la metà creative-lead per dimostrazione | chiara con campi cobalto |

Sei famiglie di materiale (strumenti a schermo ×2, data graphics ×2, stampa industriale, stampa accademica, identity) — nessun monocultura. Tutte viabili sulla verità: ogni numero da `PRODUCT.md` §3, il motore ri-messo in scena o dichiaratamente ridotto, le uniche immagini di prodotto le catture di sersan.io/spherenode.com, il resto etichettato sintetico o stampato come buco dichiarato.

Il roll ha assegnato l'indice **4**. Il candidato 1 era il mio top → card **IMPECCABLE'S PICK** (mai in testa).

---

## 3. Direzioni sviluppate (card compatte)

### 3.1 The job order — ASSEGNATA · kind `assigned` · **BUILD**
- **Tesi.** Il sito è un unico ordine di lavoro d'officina: un foglio rigato che accumula prove timbrate da ogni mestiere che copre, attraverso sei fasi (Intake · Diagnosis · Estimate · Work · Test · Release) che sono anche il percorso del visitatore. Niente è decorativo: ogni elemento è un campo con etichetta, valore misurato e provenienza; l'unica cosa viva è il suo fluido GPU in un banco prova con il frame time stampato a margine. La metafora è un fatto del CV (Maintech OMA).
- **Palette.** `#f5f4ef` paper · `#ebe9e1` paper-field · `#dcd9cf` paper-carbon · `#141414` ink · `#5a5a57` graphite · `#b40f29` stamp · `#8a0a1f` stamp-deep (su giallo) · `#ffc400` safety (solo regioni, ≈35% della superficie) · `#c98a2a` oil (costante WGSL). Strategia **Committed**. Coppie AA calcolate in `REDESIGN-SPEC.md` §C.2 (due coppie vietate: grafite su giallo 4,33; rosso chiaro su giallo 3,68).
- **Facce.** Archivo variabile (wght 100–900, **wdth 62–125**): header wdth 125/800, etichette wdth 75/600 maiuscole, corpo wdth 100; numerali tabellari; nessun mono, nessuna stencil.
- **Prima viewport.** Strip di provenienza 48px; "Job order / Alberto Tuveri" a 88px + campo Role con la riga esatta del CV e la laurea; banda gialla sticky con sei fasi, Intake timbrato, "1 / 6", cella Email; banco prova 760×540 (olio ambra su carta, cornice ink) con colonna gialla di letture reali (Particles 120,000 · MLS-MPM · SSF · Frame — ms · DPR · Tier · LIVE); tabella Work performed con 5 righe misurate; riquadro Release con Email. Mobile: nome 52px, banda a tab scorrevoli, banco 350×230 con strip di 3 letture, due righe Work, Email a tutta larghezza.
- **Signature interaction.** La banda si timbra da sola al passaggio (ScrollTrigger `once` per fase, verbo STAMP 220ms, timbri cumulativi, contatore n/6, RELEASED nel pannello finale); più la lente d'ispezione sulle catture di sersan.io/spherenode.com.
- **Motore.** Tenuto e ri-messo in scena come strumento sotto prova: costanti render (olio, tubi fluorescenti, cubemap officina), montaggio nel riquadro, letture reali. **Il confinamento "A" vive nel kernel `g2p.wgsl.ts` (G4):** Fase A spedisce con la "A" come campo di confinamento ri-illuminato; la vasca rettangolare (Fase B) attende lo sblocco di Alberto. Drone footage eliminato.
- **Rischio onesto.** Costume: giallo di sicurezza + timbri è a un passo dal lane "industrial brutalist" — la difesa è che ogni regione gialla è un campo funzionale e ogni timbro porta ruolo e stato; un giallo o un timbro senza informazione si rimuove, non si attenua. Scala: il fluido in un riquadro rinuncia all'hero a tutta pagina — deve leggersi come strumento o è un acquario. Bilancio: la grammatica da modulo favorisce le righe ingegneristiche; film e sersan.io hanno bisogno delle loro catture (il film non ha link né still: buco §8.4). Motion: due verbi su ~6.000px — la densità varia per tabelle/campi/pannelli, non per effetti. CV: clausole da modificare (§L della spec).
- **Test di memoria.** "Una job card d'officina: le fasi in alto si timbravano di rosso mentre scorrevo, e c'era una vasca di fluido ambra che girava sulla GPU con particelle e frame time stampati nel margine giallo; i lavori erano righe con numeri prima-e-dopo, e l'email era nel riquadro di firma in fondo."

### 3.2 The frame under inspection — IMPECCABLE'S PICK · kind `pick` · rank 1 · **declined** (alternate pieno)
- **Tesi.** Il sito è un singolo frame catturato del suo fluido da 120k particelle, aperto nell'inspector di render pass che gli ingegneri grafici usano per provare che un frame è reale: il frame si scompone nei suoi buffer GPU reali (particles, depth, bilateral, thickness, normals, composite), ogni lavoro è una draw call della stessa cattura, ogni claim ha una lettura con il numero del CV. Layout a tre regioni: pass rail · viewport · resource panel.
- **Palette.** `#1b1e21` well · `#262a2e` panel · `#31363b` row-hover · `#3a3f45` divider · `#e8e6df` text · `#a3a9ae` mute · `#e9b44c` amber marker · `#7fd3e6` normals cyan · `#8fd19a` delta-up · `#f0a08a` delta-before. Restrained; scura perché lo strumento lo è (studio alle 22, monitor al 60%).
- **Facce.** Archivo wdth 112–125 display + wdth 87 pannelli; Martian Mono (wdth) solo per misure.
- **Prima viewport.** Toolbar 44px (nome | riga di ruolo | EN/IT | Email ambra); pass rail 240px con sei pass e le prime draw call; viewport `#1b1e21` con il fluido in un frame 16:9 792×445, pixel picker con valori reali, la frase di posizionamento; resource panel 360px (Particles, Solver, Render, Frame ms live, Tier; blocco Capture: SerSan · Trento); status bar con i quattro link.
- **Signature.** PEELING THE FRAME: hover/focus su un pass imposta un `debug_pass: u32` (entra negli 8 byte liberi a offset 280 del render uniform da 288 byte) e il fragment finale emette quel buffer reale; crossfade 320ms; readback 1×1 a 10 Hz per il picker; runway pinnato 200vh che passa i pass allo scroll.
- **Rischio onesto.** "Dev tool as portfolio" è dove atterrano molti run creative-engineer; un inspector scuro scivola nel solco quasi-nero al primo glow. Mette in primo piano la grafica: eval e sicurezza devono avere peso pieno o è una demo di shader. Chrome fisso + colonna centrale che scorre = Lenis annidato contro `Smooth.tsx`, hash navigation rotta. Tre lavori SerSan senza still.
- **Verdetto (entrambi i giudici):** signature più forte e piano motore più onesto, ma perde entrambi gli assi (identificazione: lessico da grafica per un CTO; chiarezza: i numeri dei lavori sotto la piega, chrome che mangia il telefono). **Donazione tenuta:** onestà strumentale — ogni lettura viene dal motore, il fallback è un frame catturato con valori registrati, mai un riquadro vuoto.
- **Test di memoria.** "Un portfolio che si apriva come RenderDoc: scendevo una lista di pass e un blocco d'acqua si sfogliava in depth map grigia e normali ciano, con 120.000 particelle e i millisecondi in un pannello."

### 3.3 Develop tray — SFIDANTE · kind `challenger` (catalog `signals-instruments-darkroom-safelight-bay`) · **competitive → declined dai giudici**
- **Tesi.** Il portfolio è un banco da camera oscura sotto safelight ambra: ogni lavoro è una stampa che si sviluppa in una vaschetta di liquido reale (il motore MLS-MPM è il bagno di sviluppo che rifrange la stampa sotto), ogni numero del CV è un test strip a bande (52 → 68 sono passi che si contano). Stazioni compose · expose · develop · fix · wash · dry = percorso del visitatore.
- **Palette.** `#e59a2b` safelight (banco, ≈55%) · `#b8731a` deep · `#141414` ink · `#3a3a3a` ink-soft · `#161311` tray · `#241d18` tray-wall · `#cfcfcf` silver · `#a3a09a` silver-dim · `#ece7dd` enamel · `#f2b04a` lamp · `#ff6b3d` stop. Committed.
- **Facce.** Archivo (due larghezze) + DSEG7 Classic (sette segmenti) solo per i contatori vivi.
- **Prima viewport.** Drying line in alto con mollette-peg (nome, Work, About, Email, IT); strip smaltata con nome 104px, riga di ruolo, posizionamento; la vaschetta a tutta larghezza con il motore come liquido e la cattura di sersan.io che affiora dal 35% al 100% in 100vh; sul bordo, cifre DSEG7 "120000 particles" e "ms / frame" misurati; "Pull the print →".
- **Signature.** PULL THE PRINT: `develop` uniform 0→1 scrubbato, irreversibile; un binding `print_texture` nel path di rifrazione di `fluid.wgsl.ts`; Flip della stampa verso `/work/[slug]`.
- **Rischio onesto.** L'ambra è a un passo saturo dalla palette golden-hour rifiutata; lettura lunga sotto safelight affatica (terza superficie smaltata); il rituale fotografico non è lo schermo quotidiano di nessuno qui; la vaschetta piatta vista da 55° richiede di riscrivere gli assi di confinamento in `g2p.wgsl.ts` (G4) e il piano lo chiama erroneamente "input di forma"; sei stampe su nove sono catture sintetiche etichettate.
- **Verdetto:** immagine più memorabile e mondo più lontano dal solco, ma perde entrambi gli assi (ambra adiacente al rifiuto, lessico rituale, fattibilità 3–4/10). **Donazioni tenute:** Email come cella fissa della nav su ogni route; fallback etichettato con riga di motivo; prima→dopo come geometria (doppia barra statica accanto alle coppie Measured).

---

## 4. Sfidanti dealt ma non sviluppati (budget) — *adottabili su richiesta*

### 4.1 The collection spread (album di figurine) — `pop-culture-shelf-sticker-album-spread` · competitive
- **Sketch fuso.** Titolo "Alberto Tuveri — Software & AI Engineer · Creative Lead"; la pagina Works con otto slot numerati: 01 SphereNode (cattura, lucida), 02 Sphere AI (una figurina-tabella con i sei delta), 03 Maintech OMA (ghost: "screenshot pending"), 04 sersan.io (cattura), 05 Domus Tua (ghost: "URL pending"), 06 Brand film (ghost: "link pending"), 07 Badante24h, 08 Voice AI Agent; Email sulla linguetta d'angolo. Motore come slot 00, figurina viva a un quarto di risoluzione. Palette `#efece4` carta album, `#1c1b18` ink, `#c02942` header (4,9), ghost `#b5b1a8` solo decorativo, etichette vuote `#6a665e`.
- **Verdetto preliminare (derivazione):** competitive — tiene la chiarezza di prodotto (tutto il portfolio scansionabile in una doppia pagina, buchi dichiarati con onestà, numeri sulla figurina) ma perde l'identificazione (il collezionismo pop non è la scena di un CTO o di uno studio lead). **Donazione tenuta nel build:** assenza come informazione — i buchi si stampano come campi ("none on file", "pending"), mai card segnaposto.

### 4.2 The parts plate book (plate book di unità) — `design-canon-breton-ornament-program` · competitive
- **Sketch fuso.** Tavola I: "ALBERTO TUVERI" costruito lettera per lettera in un alfabeto squadrato con la riga di ruolo come didascalia rigata; Tavola II: il bordo SphereNode che si assembla dalle sue unità di stack (React 18 · Vite · Supabase · Whop · Cloudflare Stream · Capacitor) mentre la didascalia stampa "8 tools replaced · 21 of 49 releases · spherenode.com"; Email come unità a margine. Motore come "Unit 00 — fluid, 120,000 particles". Palette oatmeal `#ece5d8`, slate `#3f4954`, madder `#a63a2b`.
- **Verdetto preliminare:** competitive — tiene la chiarezza (catalogo di unità numerate con didascalie rigate: la stessa disciplina documentale della job card, più una lettura viva del design system) ma perde l'identificazione (un programma d'ornamento regionale non è lo schermo quotidiano di nessuno qui, dove l'officina è almeno il suo cliente reale). **Donazione tenuta:** i ricambi come unità numerate — il campo Parts di ogni sotto-modulo usa gli stessi id di `skills.ts` del catalogo Estimate.

### 4.3 Nel pool di re-roll: The napkin explainer (zine) — `hand-drawn-zine-explainer` · competitive
Sketch: "Alberto Tuveri" a pennarello, diagramma dello stack da "Postgres schema" a "WebGPU frame" con il fluido in un riquadro disegnato, evidenziatore su "accuracy 52% → 68%". Registro didattico, non prova senior; cream+marker nel solco di calibrazione. **Donazione tenuta:** il meccanismo disegnato — uno schema rigato in geometria pura nei sotto-moduli Sphere AI e Maintech OMA.

---

## 5. Sfidanti declinati (demoted, con ciò che il build ha tenuto)

| Sfidante | Catalog id | Verdetto | Tenuto nel build |
|---|---|---|---|
| **Pieced provenance** (quilt) | `textiles-weave-drape-fashion-memory-quilt-atlas` | declined — perde entrambi gli assi (associazioni domestiche/memoriali, nessun posto per il lavoro GPU) | disciplina di provenienza: ogni fatto porta la sua cucitura employer · date · link in cella propria |
| **Nothing hidden** (legatura copta) | `craft-making-coptic-exposed-binding` | declined — perde entrambi gli assi (legatoria estranea al pubblico, palette lino nel solco crema) | la banda mostra sempre totale e posizione; la struttura (righe, timbri, perforazioni) è l'unico ornamento |

---

## 6. Giudizi

**Giudice 1 — lente Awwwards SOTD 2026 fusa con il pubblico.** job-card 39 (ident. 9 · chiarezza 9 · memorabilità 7 · fattibilità 7 · distanza dal solco 7) · frame-debugger 36 (8·8·8·7·5) · ch-darkroom 33 (7·6·8·4·8). Ranking: job-card → frame-debugger → ch-darkroom. Motivo: la job card impacchetta più identità verificata e prova numerica sopra la piega di qualunque rivale, la metafora è un fatto del CV, la cella di provenienza rende lo slop strutturalmente impossibile. Due fatti bloccanti nominati: (1) la ri-spawn a vasca è una modifica al confinamento in `g2p.wgsl.ts` (G4) — richiedere lo sblocco; (2) alzare la direzione con Email nella banda fissa e letture che mostrano solo stato reale o still etichettato. *Entrambi applicati* (spec §B, §F).

**Giudice 2 — lente fattibilità sullo stack fisso.** job-card 37 (8·9·6·6·8) · frame-debugger 33 (7·8·8·5·5) · ch-darkroom 28 (5·6·8·3·6). Ranking identico. Motivo: la job card gira sul contratto esistente (Lenis documentale, sticky CSS, ScrollTrigger once, un renderer in riquadro, verbi transform/opacity), le coppie AA verificano, la prima viewport porta nome, ruolo, cinque righe e l'email senza metafora da decodificare. Difetti: tag di ruolo del timbro sul giallo 3,68 (→ testo ink / timbro pieno), file sbagliato nel piano motore (→ G4 dichiarato), Flip attraverso il cambio route delicato, ~14 giorni di costi vs 2 giorni autonomi (→ WP paralleli e Fase A/B).

**Regola di decisione applicata:** costruire l'assegnata salvo sfidante/pick marcato "wins" da entrambi i giudici o fallimento nominato dell'assegnata su verità/fattibilità. Nessun "wins"; i due fallimenti nominati sono risolti dentro il mondo (§F Fase A, §C.2). **Override: nessuno.**

---

## 7. L'uscita canonica (standing exit — la porta dell'utente, mai raccomandata)

*Lo standard di categoria giocato pulito:* fondo `#0a0a0a` a tutta pagina, il nome a 12vw in una grottesca pesante `#f5f5f5` (18,2:1) con la riga di ruolo del CV in `#9a9a9a` (7,0:1), un solo elemento WebGL contenuto (il motore fluido a un quarto di risoluzione, luce neutra, nessun blob) in alto a destra. Sotto: griglia "Work" di otto card con catture dove esistono e copertine tipografiche dove no, hover che solleva il titolo; lista skill negli otto gruppi del CV come testo; timeline Experience/Education a due colonne; blocco contatti con email e quattro link. Una famiglia grottesca, due pesi; fade-up all'ingresso e un'apertura shared-element verso il case study; reduced-motion statico. Contenuto tutto da `dict.ts`, EN/IT, niente citabili, niente eyebrow, niente numeri di sezione. Asticella: il livello di craft dei migliori portfolio developer Awwwards del momento (Léo Parpeix, Gionatan Nese). Se Alberto la sceglie: chiedere una volta due o tre prodotti accanto a cui deve stare, e eseguire il canone a piena fedeltà, senza ironia.

---

## 8. Come ri-tirare

```
.agents/skills/impeccable/scripts/impeccable concept-seed --scope direction --mode experience --from 2c525d0e --reroll 1
```
Registri: `--register safer` (i grounded convenzionali rimasti + il canone contro competitor nominati) · `--register bolder` (solo forme estranee, a piena commitment). Un re-roll elimina ogni direzione già mostrata (grounded e sfidanti); dopo due re-roll consecutivi, chiedere quale qualità manca. Telemetria del round risolto: `--kind assigned --from 2c525d0e --scope direction --mode experience`.

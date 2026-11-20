# PLAN — prossimi passi

> Branch `feat/water-viva`, sito vivo `public/proto/rivista/`. Stato al **2026-11-11**: il sito da zero (spec 50: la notte, uno sciame di luce, lastre di vetro tagliato, Sofia Sans, scene, l'alba) è costruito e committato; il giro di correzioni della catena 7 è committato anch'esso (`9bbea6c` la luce, `34e8ad3` il vetro, `cd74acf` le pagine); così la catena 8 (`72b9d82` la luce, `eec57cb` Obla e la pila mai sopra il testo, `2af2b86` la guida con input veri, `f43ade7` la scena dei casi e la riga del 404) e la catena 9 (l'avvio del palco, il telefono, la scena dei casi, l'integrazione, committati un argomento alla volta dal direttore). Il giro 10, la risposta allo sguardo di Alberto della sera dell'11 novembre (la hero come un mondo visto da una camera che si muove, il motore con una camera libera e il bloom, niente di piccolo nel tipo, più movimento nella pagina), è committato; così la catena 11b (il campo nel motore, la hero in seconda versione, il tipo che cresce con lo schermo); il giro 12 sulla copertina è in corso (§0); nulla è stato pushato. Il contesto è in [`HANDOFF.md`](./HANDOFF.md), le regole in [`CLAUDE.md`](./CLAUDE.md).
>
> Su ogni riga vale la regola di proporzione: i gate che esistono (`assemble.mjs --check`, `check-claims-proto.mjs`) più uno sguardo alle pagine. Nessun nuovo script di misura nel repo.

## 0. Adesso (20 novembre)

**La sesta ondata è chiusa e va online.** Committata per argomento il 20 novembre su `feat/water-viva`; online come un solo commit con l'albero finale sopra `881f68c`, pushato su `main` (Alberto, 19 novembre: «pusha su github e mergia su main così fa il deploy su vercel automatico»). Vercel lo costruisce con `web/scripts/release.mjs` e lo serve alla radice di https://portfolio-jet-eta-24.vercel.app. La vecchia app Next.js è tolta. I dettagli sono in testa a `HANDOFF.md`.

**I nove punti dell'ondata:**
- Costruiti i primi otto:
  1. il primo clic di una visita vola subito e muto, e il suono entra all'arrivo;
  2. la porta tiene la stanza nuova dal primo fotogramma all'ultimo, e verso Contact il mattino arriva come un bordo di giorno;
  3. il GPU dei voli;
  4. una figura per «More work» e per il record al telefono;
  5. le date del percorso di About sempre separate;
  6. il prisma dell'indice come vetro pieno;
  7. la fase 4 del piano 70 (grana, aberrazione in velocità, canvas HDR);
  8. i resti del 2D.
- Il punto 3 resta sopra i limiti su questa GPU, ma mai sopra HEAD (`CLAUDE.md` §8).
- Il punto 9 vale solo per la build Astro, dove da Contact si vola: le pagine assemblate tengono il loro taglio e non vanno online (brief dell'ondata 6).

**Prossimi passi:**

- **Lo sguardo e l'orecchio di Alberto, sul sito online.** Il suono nessuno l'ha ancora sentito. Safari, Firefox, un telefono vero e uno schermo HDR non sono mai stati provati.
- **Gli aperti dell'ondata 6** (`CLAUDE.md` §8):
  - il GPU;
  - lo sciame che si dimezza sull'indice e sulla pila di About;
  - i 150 ms quasi di carta vuota verso Contact;
  - la lastra di Maintech OMA con il numero.
- **Astro come unica build.** Togliere `assemble.mjs` si decide dopo il suo sguardo.

0. **Storia: la quinta ondata, rilanciata alle 23:20 da una sessione nuova** (workflow `wf_995d83ca-ed7`, corsie su Fable 5.2 a effort max per la regola di Alberto delle 23:05; il primo lancio, `wf_a63941f9-c76`, è stato chiuso verso le 22:59 con le tre corsie di build a metà e il loro lavoro sul disco; all'01:30 del 13 novembre le tre corsie di build sono tornate e il critico, tagliato all'01:15 dai crediti d'uso, è ripartito sullo stesso run; alle 03:25 il critico (sicuro sì, bello abbastanza non ancora) e la correzione del volo sono tornati, e le correzioni del suono e dei casi, tagliate alle 02:33, sono ripartite nel run di coda `wf_041ff2b2-31c` (FIXSOUND, FIXCASES, INTEGRATE, DOCS): da qui le corsie girano una per volta; FIXSOUND è tornata alle 04:00; alle 04:02 Fable ha raggiunto il limite settimanale e FIXCASES, INTEGRATE e DOCS sono passate su Opus 5.5 a effort max nel run `wf_0bfb5947-52e`: FIXCASES è tornata alle 05:22, INTEGRATE è stata tagliata alle 08:03 dal limite settimanale di tutti i modelli; dal 17 novembre alle 17:36, azzerati i limiti, INTEGRATE è ripresa dai suoi appunti su Fable 5.2 a effort max nel run `wf_e0427eac-3f8` ed è tornata alle 19:15; DOCS è partita dopo di lei, alle 19:55 il limite settimanale di Fable l'ha fermata a documenti già riscritti, e la finisce su Opus 5.5 a effort max nello stesso run; i dettagli, le corsie e come riprenderla sono nel riquadro in testa a `HANDOFF.md`): il taglio come un volo vero dell'occhio nello studio (FLIGHT), il suono sintetizzato e acceso dal primo gesto (SOUND), una figura di luce per ogni capitolo dei nove casi (CASES); poi un critico, tre corsie di correzione, l'integrazione con i film e i documenti riscritti sul sito com'è (DOCS). **Fatte e committate la terza ondata** (`a508f55` il progetto Astro in `web/` a parità di byte, `ab1d0da` il prisma, `096af60` il primo portale, `40d3d38` il nome a splat dietro `?name=splat`) **e la quarta** (`034494d` il palco vivo fra le pagine negli script, `d4d058b` il router nel progetto Astro, `02af948` il vetro, `1ec2133`, `d9f6306`, `054daa7`), mandata ad Alberto alle 22:24 con cinque film e due link (5178 le pagine assemblate, 5180 il build Astro con il palco vivo). **Dopo la quinta:** il prisma come vetro pieno, la fase 4 del piano 70 (grana, aberrazione in velocità, canvas HDR), i resti del 2D, la decisione sul passaggio definitivo ad Astro.
1. **Giro 12, «la sala accesa», fatto e committato** (`197039b` le opzioni del motore, `904045e` la hero in terza versione): la posa di riposo è una sala accesa (parete a griglia, lame di luce, schegge a forma di A e di marchio SerSan, il nome come blocco visto da sotto, due lastre grandi); mandata ad Alberto con due film verso le 00:05 del 12 novembre. Che cosa è ancora debole è nel riquadro in testa a `HANDOFF.md`.
2. **La prima ondata è fatta e committata** (`f18f1a8` il kit della stanza, `2d96ab8` Work e i casi, `2a26028` About, Consulting, Obla e l'indice, `6579a1c` il 2D con Anime.js, `84a6633` gli appunti) e mandata ad Alberto alle 06:41 con tre film. **La seconda ondata è fatta e committata** (`5588f80`, `2e631bd`, `a366505`, `5a775fb`, `6da0ade`, `cc90cf3`; primo frame circa 250 ms prima su ogni pagina, il taglio come un solo gesto, le nove lastre che si leggono, il percorso di About a posto, il Gaussian splatting sul banco). **LIGHT3 è fatto e committato** (`77a35c2`, `0b72897`, `ed08d9e`, `961d66a`, `4f61efa`) e mandato ad Alberto alle 12:55 con quattro film. **La terza ondata è fatta e committata** (`a508f55` Astro in `web/` con le 32 pagine identiche byte per byte, `ab1d0da` il prisma, `5181228`, `096af60` il portale in prima versione, `40d3d38` il nome a splat dietro `?name=splat`, `f29b67d`) e mandata ad Alberto alle 16:15. **È in corso la quarta ondata** (workflow `wf_d61f896f-f01`: il palco che resta vivo fra le pagine sul router di Astro e il taglio come un solo volo; il prisma come vetro vero; poi critico, correzione, integrazione). Era la terza ondata (workflow `wf_b38f685b-cfd`: ASTRO in `web/` fino alla parità, il prisma dell'indice, il taglio come volo in un portale di vetro, il nome della copertina a splat dietro `?name=splat`). Era LIGHT3 (workflow `wf_70d93976-21d`: via la X delle lame di luce, lastre come vetro e non come cornici, Obla senza raggi da sole, poi i film rifatti). Era la seconda ondata (workflow `wf_1a366177-317`: ogni stanza accesa come la copertina, lastre che si leggono, il percorso di About a posto, il taglio come un solo gesto, le aperture accese, il Gaussian splatting sul banco). Poi la terza: ASTRO, i resti del 2D, la fase 2 del piano 70, DOCS. Il dettaglio è nel riquadro in testa a `HANDOFF.md`.
3. **La prima ondata, corsie su file disgiunti:** PHASE1 (fase 1 del piano 70: camera e luce su tutte le pagine; assorbe la corsia GLOW rimandata e il primo schermo di Consulting), MOTION2D (Anime.js con WAAPI su tutto il 2D, i «titoli di testa», con elementi 2D nuovi: l'ha chiesto Alberto la sera dell'11 novembre, §8.5 del piano 70) e SPLAT (il Gaussian splatting nel motore: `stage/splat/**` e il suo banco). **Seconda ondata:** ASTRO (il sito portato su Astro in una cartella nuova, `web/`, fino alla parità delle 32 pagine, dopo che MOTION2D ha fermato le pagine) e la fase 2 del piano 70. Astro e il Gaussian splatting li ha chiesti Alberto la sera dell'11 novembre («Astro, Gaussian splatting and more»); le decisioni sono nel §8 di `docs/redesign/rivista-story/70-continuous-world-plan.md`.
4. **Poi il resto del piano 70**, una fase alla volta: 3 il palco che resta vivo fra le pagine, costruito sul router di Astro; 4 grana, aberrazione in velocità, bokeh a sei lati, scia del puntatore, schegge sulle altre pagine, canvas HDR; 5 il suono, acceso di default dal primo gesto.
5. **DOCS** dopo la prima ondata: `CLAUDE.md`, `DESIGN.md`, `.impeccable/design.json` e `60-as-built.md` sono fermi al giro 10.

## 1. Chiudere il giro (direttore)

**Il giro 10 è chiuso dalle corsie; resta il direttore.** Per la catena 9 si è fatto così, e così si fa ora:

1. Leggere `docs/redesign/rivista-story/build/v-integrate.md` (lo stato del sito, «Still wrong», i tempi d'avvio, i file per argomento), rilanciare i due gate, aprire i fogli finali: per prime le cinque catture della hero di `HANDOFF.md` §5, poi `.shots/v-integrate/hero-desk.png`, `hero-desk-fly.png`, `hero-phone.png`, `type-desk.png`, `type-phone.png`, `motion.png`, `motion-phone.png`, `pages.png`.
2. Committare per argomento. **Fatto l'11 novembre alle 19:40:** `645bbdd` il motore (`fx-stage.js` intero, con i due pezzi della hero), `87fbcce` la hero (prima versione), `f3effb5` il tipo e il movimento della pagina con i file generati, `111074c` l'integrazione, poi i documenti. I due gate dopo i commit: verdi.

**Il giudizio del direttore sul giro 10** (guardando i fogli di `.shots/v-integrate/` come li guarderebbe Alberto): il motore, il tipo e il movimento della pagina reggono; **la hero non è ancora «strabiliante»**. Tre cose: il primo secondo e mezzo è ancora il nome piatto come tipo, e i punti che volano a costruire le lettere non si vedono; le lettere di luce a riposo sono a chiazze (metà sgranate e cobalto, metà bianche bruciate) e nel volo sono grossolane; la sala è quasi vuota (lastre scure che si leggono come pilastri grigi, fasci sottili come fili). Per questo il direttore ha lanciato subito il **giro 11**, senza aspettare Alberto: è scritto nel riquadro in testa a `HANDOFF.md`.

## 2. Lo sguardo di Alberto

**Alberto guarda il sito; poi si agisce su quello che dice.** Link: `http://127.0.0.1:5178/proto/rivista/index.html` (italiano: `…/it/index.html`), il server del direttore; la 5179 resta spenta finché lui non chiede di riaccenderla. Prima di mandare il link, si controlla che la porta risponda. Finché non ha parlato non si lancia un altro giro di rifinitura. Se chiede correzioni: una catena piccola, lane su Opus divise per file, appunti su disco dal primo passo, poi uno sguardo del direttore e i commit.

I difetti noti che potrebbe notare, in ordine, sono in `HANDOFF.md` §6: per primo l'arrivo della hero (il primo 1,4 s è ancora il nome piatto che sale come tipo e poi passa alla luce: i punti che volano e costruiscono le lettere non si leggono), poi la grana fine delle lettere a riposo, la lastra vicina che passa davanti all'obiettivo come una barra grigia, il doppio di circa 100 ms fra il nome del cartello e l'`h1` d'arrivo nel taglio, i dischi tondi sfocati degli agenti e di Obla, la pila di About al telefono e a 1440 DPR 2, la prima figura di Consulting, i residui della catena 9.

## 3. Aspettano Alberto

| Decisione | Che cosa sblocca |
|---|---|
| Lo sguardo dal vivo al sito (5178, o la 5179 se la chiede) | Un giro di correzioni, o niente |
| Lettura dei testi di Consulting e Obla; Obla senza riga di stato | L'ultima passata sul copy nuovo |
| Lettura dell'italiano da madrelingua | L'ultima passata sul copy italiano |
| Un dominio vero (`albertotuveri.dev` non esiste nel DNS): `ORIGIN` in testa a `web/scripts/release.mjs`, o `RV_ORIGIN` | L'indirizzo definitivo, i canonical e la sitemap |
| Che cosa fare di `feat/water-viva` e `feat/water-hero` ora che `main` ha il sito (la storia di `feat/water-viva` tiene `47e914d` e non si pusha) | La pulizia dei branch |
| Le note sul CV (durata del brand film, Angular o React, la voce "Personal Portfolio") | Correggere il CV, non il sito |

## 4. Se lui li chiede (non sono un binario da alimentare)

- Le altre pagine riprese con la camera libera del giro 10 (`cameraPath` in `stage/scenes/lib/camera.js`): la galleria di Work, la pila e il percorso di About, i casi; e il bloom chiesto anche dalle loro scene (oggi lo chiedono solo `hero.js` e `now.js`).
- Un arrivo della hero rifatto, se lui lo nota: i punti che volano davvero sulle lettere invece del nome piatto che passa alla luce.
- Lastre di vetro sulle pagine notturne di Consulting e Obla.
- Share card proprie per Work, About, Consulting, Obla e Contact.

## 5. Dopo il deploy

1. Lo stato del commit su GitHub e i cinque indirizzi di `CLAUDE.md` §6 (il rilascio, `vercel.json`, i due 404 e che cosa non servire li ha chiusi l'ondata 6).
2. Lighthouse sul sito pubblicato, Axe sulle pagine nuove (`scripts/probes/a11y-gate.mjs` con `--base` e `--routes`), una prova su un telefono vero col palco acceso.

## Non fare

- Non pushare, fondere o deployare senza il sì esplicito di Alberto; non generare asset a pagamento e non fare chiamate a pagamento dei connettori senza il suo sì.
- Non chiedergli di nuovo di scegliere una direzione: ha dato carta bianca.
- Non riportare nulla della rivista bianca né nulla che si legga come acqua (`DESIGN.md`, "Do's and Don'ts").
- Non scrivere una stringa in un parziale o in uno script: passa da `parts/strings.mjs` o `parts/cases.json`, nelle due lingue.
- Non stampare un numero che non sia in `PRODUCT.md` §3/§9 (§10–§11 per Consulting e Obla).
- Non editare a mano le pagine generate né `fx.css`.
- Non aprire finestre Chrome: sonde headless (`scripts/lib/headless.mjs`, `scripts/visual-gate.mjs`).
- Non scrivere nuovi script di misura nel repo e non lanciare agenti che ri-verificano tutto.

# 70 — Il mondo continuo: piano di architettura

> **Stato: proposta dell'11 novembre 2026; le quattro scelte di Alberto sono arrivate la sera stessa (§7) e il piano è deciso nelle sue linee.** Nulla è ancora in costruzione, tranne la fase 0, che è il lavoro già in corso sulla copertina (catena 11b: `HANDOFF.md`). Scritto dal direttore su richiesta di Alberto: un piano attorno a sei sistemi (camera, luce, vetro, particelle, transizioni e post-produzione, suono), con lo storyboard del viaggio, la sincronia fra DOM e 3D e una roadmap a fasi. Il testo incollato da Alberto nomina three.js e React Three Fiber; qui ogni sistema è tradotto sul sito com'è, e la scelta del motore è una delle domande.

## 0. Da dove partiamo

Il sito ha già un motore suo: un palco WebGPU scritto a mano (`public/proto/rivista/stage/`), un canvas fisso sopra le pagine, guidato dallo scroll.

| Sistema | C'è già | Manca |
|---|---|---|
| 1. Mondo continuo e camera | Canvas fisso; camera libera (posizione, bersaglio, rollio, lente, fuoco, nebbia); percorsi di camera lisci (`scenes/lib/camera.js`); orbita con il puntatore; deriva lenta a riposo; in copertina lo scroll fa volare la camera fino a «Now at SerSan» | Le altre pagine usano scene ferme con piccoli movimenti; fra una pagina e l'altra il canvas si spegne e si riaccende; la lente non reagisce alla velocità |
| 2. Luce da studio | Due soft box riflessi sulle lastre, che il puntatore sposta; bloom; luce additiva dei punti | Un ambiente di studio completo (più pannelli, luce di taglio), una temperatura della luce che cambia lungo il percorso, un tone mapping filmico |
| 3. Vetro e oggetti | Lastre di vetro spesso con rifrazione vera: piegano lo sciame e i titoli veri della pagina (`data-refract`); dispersione sugli smussi; riflessi | Solo parallelepipedi: nessun altro solido; nessuna attenuazione per spessore |
| 4. Particelle | 160.000 punti simulati su GPU (flusso, risposta alla mano, scie per velocità, profondità di campo); in arrivo il campo: schegge a forma di A e di marchio SerSan, parete in rilievo, fasci | Scie del puntatore più leggibili; sfocato con la forma del diaframma |
| 5. Transizioni e post | Taglio a cartello con spinta di camera; bloom; fuoco che cambia soggetto | Passaggi senza stacco fra le pagine; aberrazione cromatica in velocità; grana |
| 6. Suono | Niente | Tutto |

## 1. Tre strade per il motore

- **A. Estendere il palco del sito (consigliata).** Si aggiunge ciò che manca: solidi di vetro oltre le lastre, pannelli di luce da studio, grana e aberrazione nel composito, il suono con la Web Audio API. Tiene tutto ciò che ad Alberto è piaciuto (lo sciame, le scene di Consulting e Obla, il personaggio), pesa pochissimo e resta coerente con ciò che il sito dichiara: rendering WebGPU scritto a mano. Limite: senza WebGPU si vede la pagina ferma, completa ma senza 3D.
- **B. Riscrivere su three.js** (WebGPURenderer con ripiego WebGL 2). Dà pronti materiali PBR, trasmissione, mappe d'ambiente, post-produzione, audio posizionale e il ripiego sui browser senza WebGPU. Costa la riscrittura del palco e di tredici scene (diversi giri), circa 200 KB in più, e l'aspetto di oggi va ricostruito da capo.
- **C. Due motori insieme** (il palco più un canvas three.js). Scartata: due canvas non si rifrangono l'uno nell'altro e il costo GPU raddoppia.

## 2. Storyboard: il viaggio, stazione per stazione

Le pagine restano pagine, con il loro indirizzo. Ogni pagina è una stanza dello stesso studio di notte; il passaggio da una all'altra è un volo attraverso un portale di vetro. Il suono è acceso di default (scelta di Alberto): parte al primo clic, tocco o tasto del visitatore, perché prima i browser non lasciano suonare una pagina, e un interruttore nell'intestazione lo spegne.

| Stazione | Che cosa si vede | Luce | Vetro | Particelle | Suono |
|---|---|---|---|---|---|
| **0. Apertura** (copertina, 3 s) | Buio. Le lettere del nome si accendono dalla A alla I mentre la camera, partita vicina e di sbieco, gira attorno e arretra | Solo le lettere, poi i fasci uno alla volta | — | I punti arrivano come scie dritte | Un tono di sala che sale; ogni lettera un tocco di vetro, tredici note in scala; un accordo quando il bagliore si posa |
| **1. La sala** (copertina a riposo) | Il nome come volume di luce; in profondità i lavori su lastre illuminate; in fondo la parete a griglia | Tre fasci larghi, freddi; uno lo punta il puntatore | Le lastre dei lavori, morbide per la distanza | Schegge a forma di A nell'aria, che brillano dentro i fasci | Aria ferma; il fascio puntato ha un soffio che si sposta in cuffia con la mano |
| **2. Il volo** (scroll) | La camera passa fra le due parole; le lettere scorrono ai lati come pareti di luce | La lente si allarga con la velocità, il fuoco passa dal nome alla lastra lontana | Due lastre passano vicine, nitide per un attimo | Le A sfilano accanto all'obiettivo e svaniscono | Un fruscio che si apre con la velocità dello scroll; un colpo d'aria basso al passaggio del nome |
| **3. Now at SerSan** | La lastra con la cattura di sersan.io, al suo posto accanto al testo | La lastra è la lampada; luce di taglio sugli spigoli | Vetro spesso, dispersione sugli smussi | Attorno, schegge a forma di marchio SerSan | La lastra risuona piano; il tono segue l'inclinazione |
| **4. L'atrio** (l'indice) | Un prisma di vetro tagliato: un fascio entra e ne escono quattro raggi, uno per pagina (Work, About, Consulting, Obla), ciascuno verso il suo portale | Il raggio della riga sotto il puntatore si accende | Il prisma divide la luce: la rifrazione diventa il menu | Pulviscolo dentro i quattro raggi | Quattro note, una per raggio; al clic il volo nel portale: fruscio, poi la stanza nuova |
| **5. Work** | Nove lastre su un arco; la camera corre lungo l'arco e mette a fuoco il lavoro del passo. Poi le barre di luce delle misure | Un pannello per lastra, che si accende al suo passo | Le lastre incise prendono la luce di taglio | Lo sciame passa dietro le lastre e si piega | Ogni lastra una nota; le barre salgono con un soffio |
| **6. About** | Otto strati di vetro: la camera gira attorno alla pila e lo strato del passo si stacca. Poi il percorso: una linea di luce attraverso cinque lastre, e la camera la segue | La luce si stringe e si scalda di poco a ogni passo | Fili di luce attraverso gli strati | Flussi che attraversano la pila | Un accordo che si costruisce strato dopo strato; un tono che scivola lungo il percorso |
| **7. Consulting** | Quattro campate, una per servizio, con le figure di luce di oggi (restano come sono); la camera si sposta di lato da una all'altra | Un pannello proprio per ogni campata | — | Le quattro figure | Una grana che si risolve in un tono; scatti da montaggio; tasti in ritmo; più voci che entrano una alla volta |
| **8. Obla** | Il personaggio al centro; la camera gli gira vicino; cinque stati | La luce cambia con lo stato: fredda in ascolto, più viva al lavoro, calda quando chiede | — | I suoi anelli e il suo alone | Toni simili a una voce, senza parole, uno per stato |
| **9. I casi** | Stanze laterali: la lastra del lavoro arriva dal fondo e si mette di fronte | Il bagliore dietro la lastra | La lastra con la cattura o con le parole incise | Foschia dietro i capitoli | La nota di quella lastra nella galleria |
| **10. L'alba** (fine di ogni pagina, e Contact) | Un bordo dritto oltre il quale il fondo è bianco; la camera sale | Dal cobalto della notte al bianco caldo | Nessuno | Gli stessi punti diventano inchiostro | Il tono di sala si apre, un accordo caldo, poi silenzio |

## 3. I sei sistemi: che cosa si costruisce

1. **Camera.** Ogni pagina diventa un solo piano sequenza: un percorso liscio attraverso le sue scene al posto di viste ferme. Si aggiungono il respiro a mano (c'è già, sull'orologio del palco), la lente che si allarga quando lo scroll è veloce, il bersaglio che insegue con peso. Lo scroll resta quello vero della pagina.
2. **Luce.** Quattro o cinque pannelli da studio descritti in modo analitico (nessuna immagine da scaricare), riflessi nel vetro e spostati da puntatore e camera; una luce di taglio dietro gli oggetti; i fasci come luci vere (il campo); la temperatura che va dal cobalto freddo della sala al bianco caldo dell'alba lungo ogni pagina; una curva filmica nel composito.
3. **Vetro.** Il tracciatore passa dai parallelepipedi ai solidi convessi a facce piane: il prisma dell'atrio, i portali, cunei. Attenuazione per spessore, dispersione più decisa sul prisma. I titoli veri della pagina continuano a piegarsi dietro il vetro.
4. **Particelle.** Tre strati: lo sciame (160.000 punti), le schegge del campo (A e marchio SerSan), il pulviscolo dentro i fasci. Il puntatore apre un varco nello sciame e lascia una scia; lo sfocato prende la forma del diaframma, a sei lati.
5. **Transizioni e post.** Il canvas resta acceso fra le pagine: al clic la camera vola nel portale, il contenuto della pagina cambia sotto, la stanza nuova si compone dall'altra parte. Nel composito: bloom (c'è), fuoco che cambia soggetto (c'è), aberrazione cromatica ai bordi solo in velocità, grana fine contro le bande di colore.
6. **Suono.** Web Audio API, tutto sintetizzato: nessun file. Un tono di sala; sorgenti posizionali (HRTF) attaccate a nome, lastre, prisma e personaggio, che si spostano in cuffia quando la camera gira; fruscio e basso legati alla velocità dello scroll; tocchi di vetro al passaggio e al clic. Acceso di default: il motore audio parte al primo clic, tocco o tasto (prima i browser lo bloccano), entra piano in dissolvenza, e un interruttore con le barre animate nell'intestazione lo spegne e lo riaccende; la scelta di chi lo spegne viene ricordata; silenzio quando la scheda perde il fuoco.

## 4. DOM e 3D insieme

- Ogni parola resta HTML vero in pagine statiche, nelle due lingue: i motori di ricerca e i lettori di schermo leggono il sito com'è oggi.
- Il canvas è fisso sopra la pagina e non prende i clic. L'host misura a ogni frame i riquadri del testo e delle figure: gli oggetti 3D si allineano all'impaginazione e nulla viene disegnato sopra il testo.
- I titoli segnati `data-refract` vengono ridisegnati nel palco, così il vetro piega tipo vero.
- Lo scroll è quello nativo, ammorbidito da Lenis; la camera legge la posizione dentro la scena.
- Senza WebGPU, con movimento ridotto, senza script e in stampa restano le pagine complete con le immagini vere.
- Con il canvas acceso fra le pagine: indirizzi, Indietro e Avanti e i link diretti funzionano come oggi; al cambio pagina si aggiornano titolo e lingua, il fuoco va al titolo e il cambio viene annunciato ai lettori di schermo. Senza script la navigazione è quella normale.
- L'interruttore del suono è un bottone vero, raggiungibile da tastiera.

## 5. Roadmap a fasi

Ogni fase è uno o due giri di corsie con un revisore a freddo; si chiude con i due gate, le misure e uno sguardo alle pagine. Budget: su un desktop il palco resta sotto 3,5 ms di GPU per frame a 1440 × 900; i livelli B e C riducono punti e risoluzione; il palco dorme dopo l'ultimo input.

| Fase | Che cosa | Prova |
|---|---|---|
| **0. In corso** | La copertina: nome di luce, apertura, fasci, lastre dei lavori, il campo, il tipo che cresce con lo schermo | Il revisore, le strisce di fotogrammi, il film della copertina |
| **1. Camera e luce ovunque** | Un piano sequenza per pagina; la lente legata alla velocità; i pannelli da studio; la temperatura lungo il percorso; il bagliore su ogni scena notturna | Strisce di ogni pagina; tempi GPU per pagina; pagine stampate invariate |
| **2. Vetro oltre le lastre** | Solidi convessi nel tracciatore; il prisma dell'atrio con i quattro raggi; i portali | Le lastre di oggi identiche prima e dopo; costo del tracciatore entro 0,6 ms in più |
| **3. Il mondo acceso fra le pagine** | Navigazione che tiene vivo il canvas; il taglio diventa un volo nel portale | Ogni coppia di pagine, Indietro e Avanti, link diretti, tastiera; memoria stabile dopo trenta passaggi |
| **4. Post e particelle** | Grana, aberrazione in velocità, sfocato a sei lati, scia del puntatore, schegge sulle altre pagine | Nessun velo sul testo; nessuna banda; costo entro il budget |
| **5. Suono** | Motore audio e interruttore; tono di sala; sorgenti posizionali; fruscio di velocità; tocchi | Parte al primo gesto del visitatore, mai prima (nessun avviso di blocco in console); l'interruttore lo spegne subito e la scelta resta; silenzio a scheda nascosta; nessun impatto sui frame |

## 6. Limiti e conflitti, detti chiaramente

- **«Fotorealistico».** Il mondo proposto è fatto di luce e di vetro tagliato, che è l'identità del sito. Oggetti PBR generici (metallo, modelli importati) vogliono un motore per mesh: è la strada B, o giri in più sulla strada A.
- **«60 FPS bloccati»** non si può garantire su ogni dispositivo: si garantisce un budget per livello e si misura.
- **Mondo continuo e pagine separate.** Il 10 novembre Alberto ha chiesto pagine diverse, non un'unica pagina. La proposta tiene le pagine e accende il mondo fra l'una e l'altra.
- **Dischi tondi sfocati e riflessi ondulati.** Il sito non deve mai leggersi come acqua: lo sfocato è a sei lati e piccolo; i giochi di luce del vetro sono fasci e bande dritte, mai disegni ondulati.
- **Suono.** Alberto lo vuole acceso di default. I browser non lasciano suonare una pagina finché il visitatore non fa un clic, un tocco o preme un tasto (lo scroll non basta): «acceso di default» vuol dire che parte a quel primo gesto, senza chiedere nulla, a volume contenuto, con l'interruttore in vista per spegnerlo.
- **Tempi.** Una finestra d'uso di cinque ore regge circa un'ora di tre corsie in parallelo: ogni fase occupa una o due finestre.

## 7. Le scelte di Alberto

| Domanda | Opzione consigliata | Risposta |
|---|---|---|
| Come sta il mondo continuo rispetto alle pagine separate | Pagine separate, mondo acceso fra l'una e l'altra | **Pagine separate, 3D acceso** (la consigliata) |
| Con quale motore | Il palco del sito, esteso (strada A) | **Il motore del sito, esteso** (la consigliata) |
| Quali oggetti di vetro | Il prisma dell'atrio e i portali; restano lastre, pila, figure e Obla | **Prisma e portali** (la consigliata) |
| Come si comporta il suono | Spento finché lo si accende, tutto sintetizzato | **«acceso di default.»** (parole sue): acceso di default e sintetizzato; parte al primo gesto del visitatore |

## 8. Aggiunte dell'11 novembre sera: Astro, Gaussian splatting «and more»

Verso le 23:00 dell'11 novembre, mentre il giro 12 sulla copertina partiva, Alberto ha scritto: «Astro, Gaussian splatting and more». Nient'altro. La lettura è del direttore: «Astro» è il framework web (astro.build), non un tema; «Gaussian splatting» è la resa di scene 3D come nuvole di gaussiane; «and more» invita ad aggiungere altre tecniche dello stesso tipo, a scelta. Se intendeva altro, lo corregge lui.

### 8.1 Astro diventa la build del sito

- **Che cosa cambia.** Oggi le pagine le assembla `assemble.mjs` da parziali e da un file di stringhe. Con Astro le stesse pagine nascono da layout, componenti e pagine `.astro`, con uscita statica: inglese alla radice e italiano in `it/` con il routing i18n di Astro, i nove casi come collezione di contenuti letta da `cases.json`, le stringhe dallo stesso `strings.mjs`. Il palco (`stage/**`), gli `fx-*.js` e i fogli di stile restano quelli che sono: moduli e CSS scritti a mano, inclusi così.
- **Perché adesso.** Chiude la domanda rimasta aperta da ottobre («port a Next.js o sito statico così com'è»). E il router lato client di Astro, con `transition:persist`, tiene nel documento lo stesso elemento mentre la pagina sotto cambia: è il pezzo che serve alla fase 3 (il palco resta acceso fra una pagina e l'altra), che così non va scritto a mano. Indirizzi, Indietro, Avanti e link diretti restano quelli di pagine separate, come ha scelto lui.
- **Come, senza rompere nulla.** Il progetto nasce in una cartella nuova, `web/`, accanto al sito di oggi, e legge palco, script, stili e media da dove sono. Si passa ad Astro solo a parità dimostrata: le 32 pagine con lo stesso testo e la stessa struttura di quelle assemblate (un confronto dell'HTML normalizzato), i due gate verdi sull'uscita di Astro, le pipeline dei media che funzionano. Solo allora `assemble.mjs` e le pagine generate si tolgono. La vecchia app Next.js in `src/**` a quel punto è morta: cancellarla resta una decisione di Alberto.
- **Documentazione.** Context7 per la versione corrente di Astro prima di scrivere (router, i18n, collezioni).

### 8.2 Il Gaussian splatting entra nel motore del sito

Niente three.js e nessun secondo canvas, come ha scelto lui alle 21:40: un passo nuovo del palco, `stage/splat/**`.

- **Il passo.** Gaussiane 3D anisotrope (posizione, scala su tre assi, rotazione, opacità, colore), proiettate come ellissi, ordinate per profondità e sommate dal fondo verso l'occhio; la stessa camera libera, la stessa nebbia e lo stesso bagliore dei punti. Un lettore per le catture (`.ply` e `.splat`), con un tetto per fascia (circa 400.000 gaussiane sulla A, meno su B e C) e un banco `stage/dev.html?view=splat`. Facoltativo come il campo: se manca o fallisce, il palco disegna come oggi.
- **Primo uso: lo sciame si posa in gaussiane.** Dove una figura deve essere solida (le lettere del nome, il personaggio di Obla, il prisma dell'indice) i punti diventano gaussiane orientate che piastrellano una superficie; i dischi tondi non ci riescono, ed è la radice dei bordi a bozzi delle lettere. Le stesse gaussiane si sciolgono di nuovo in sciame quando la storia va avanti.
- **Secondo uso: una cattura vera dentro lo studio.** Una scena reale in 3D che lo sciame compone e attorno a cui la camera gira. Le due candidate: la sua scrivania di notte con gli schermi accesi sui suoi lavori (lo «studio di notte» alla lettera) e lui stesso, per About. Niente coste, mare o drone: quel mondo è stato rifiutato.
- **Che cosa serve da Alberto.** Per una cattura vera, un video che può girare solo lui: 40–60 secondi, telefono in orizzontale, un giro lento e completo attorno al soggetto a due altezze, luce ferma, niente persone che passano. L'addestramento della cattura si fa in locale se la macchina ha una scheda adatta; con un servizio esterno solo con il suo sì. Finché il video non c'è: gaussiane procedurali sul sito e una cattura di prova a licenza libera solo sul banco.

### 8.3 «And more»: le scelte del direttore

Poche, e ognuna dentro il motore o nella piattaforma, senza librerie nuove a runtime.

- **Pagine pre-renderizzate** (Speculation Rules): la pagina più probabile si prepara mentre il lettore guarda quella corrente, così un taglio arriva su un palco già caldo. Dove il browser non le conosce non succede nulla.
- **Canvas HDR** sugli schermi che lo reggono: le luci del palco più chiare del bianco della carta, invece di un bianco bruciato. Sugli altri schermi l'immagine di oggi.
- **Animazioni CSS legate allo scroll** dove GSAP oggi fa solo da cursore, per alleggerire il thread principale; con movimento ridotto restano ferme come ora.

### 8.4 Dove entrano nella roadmap

- **Prima ondata, dopo il giro 12 sulla copertina, tre corsie su file disgiunti:** PHASE1 (la fase 1 di questo piano, sulle scene delle altre pagine), MOTION2D (§8.5: Anime.js con WAAPI sul 2D), SPLAT (`stage/splat/**` e il banco).
- **Seconda ondata:** ASTRO (`web/`, fino alla parità, a partire dalle pagine che MOTION2D ha lasciato) e la fase 2.
- **Fase 2** (il vetro oltre le lastre): il prisma e i solidi usano le gaussiane del passo nuovo dove serve una superficie piena.
- **Fase 3** (il palco vivo fra le pagine): si costruisce sul router di Astro, dopo il passaggio ad Astro; le pagine pre-renderizzate entrano qui.
- **Fase 4** (post e particelle): il canvas HDR e le animazioni legate allo scroll entrano qui. La cattura vera entra quando arriva il video.
- **Fase 5** (il suono): invariata.

### 8.5 Anime.js con WAAPI per il 2D: i «titoli di testa»

Poco prima delle 23:08 dell'11 novembre Alberto ha aggiunto: «Use also animejs with waapi for animating 2d elements. Hai il pieno controllo per creare elementi , e per gesture la timeline e il flusso di tutto quello che vuoi . Make it beautiful». La lettura è del direttore: Anime.js versione 4, con il suo modulo WAAPI, anima tutto ciò che è 2D sulle pagine (DOM e SVG); mano libera per creare elementi 2D nuovi e per decidere tempi, sequenze e flusso («gesture» letto come «gestire»). Il 3D resta al palco.

- **La libreria.** Anime.js 4.3, caricata da jsDelivr come moduli ES dopo il primo frame, come oggi GSAP e Lenis; solo i moduli che servono: `animejs/waapi` (`waapi.animate`), `animejs/timeline` (`createTimeline`, che sincronizza anche le animazioni WAAPI con `.sync()`), `animejs/text` (`splitText` con `addEffect`, così una divisione in righe regge il caricamento dei font e i ridimensionamenti), `animejs/svg` (`createDrawable`). API controllata con Context7 l'11 novembre; la corsia la ricontrolla prima di scrivere. Se il modulo non arriva, la pagina resta completa e ferma.
- **Chi fa che cosa.** WAAPI, attraverso Anime.js, muove gli elementi: trasformazioni, opacità, maschere dritte. Girano sul compositore, quindi restano fluide mentre il thread principale serve il palco. Il motore JavaScript di Anime.js solo dove WAAPI non arriva (numeri che contano, attributi SVG, assi del font variabile). GSAP resta per il ticker di Lenis e per ciò che segue lo scroll; a lavoro finito si misura che cosa gli resta e, se è poco, un giro successivo lo toglie.
- **Il concetto.** Il 2D è la sequenza dei titoli di un film, a tempo con la camera. (1) Una timeline d'apertura per pagina: intestazione, etichetta, titolo lettera per lettera da dietro la maschera dritta, un filetto che si disegna, le righe del testo, i bottoni; parte al primo frame del palco o all'arrivo di un taglio. (2) Una timeline per ogni passo di scena, in entrata e in uscita. (3) Il cartello del taglio come una sola timeline, a tempo con la spinta della camera: il numero d'indice che conta fino a quello della destinazione, il nome che sale lettera per lettera, una riga che attraversa il foglio. (4) Il menu come foglio, con le righe in sequenza. (5) Le risposte alla mano: link, bottoni e voci di menu rispondono a hover, pressione e fuoco da tastiera.
- **Elementi 2D nuovi** (li ha concessi lui): filetti dritti che si disegnano e legano i blocchi; numeri che scattano dove un numero esiste già (indici, anni, misure di `PRODUCT.md`); il nome della scena corrente nell'intestazione, che cambia dietro una maschera; un filo di avanzamento della lettura nell'intestazione; i diagrammi SVG che si tracciano (il class diagram della Supply Chain); la conferma della copia dell'indirizzo.
- **Le regole che restano.** Niente luce finta in CSS (ombre, bagliori, gradienti, sfocature), angoli quadrati, niente di piccolo, nessun testo che entra scivolando da un lato, il tipo `data-refract` non si sposta (ha solo la sua tendina), nulla nel DOM segue il puntatore, niente che si legga come acqua, ogni parola da `strings.mjs` nelle due lingue. Con movimento ridotto, senza WebGPU, senza script e in stampa nulla resta nascosto o spostato.
- **File.** La corsia MOTION2D possiede `fx-core.js`, `fx-scroll.js`, `fx-nav.js`, un nuovo `fx-motion.js`, `css/**`, `parts/**` (con `head.html` per il caricamento e `strings.mjs`), le asserzioni di `assemble.mjs`. Non tocca `stage/**`.
- **Se «gesture» voleva dire gesti.** Sul telefono un trascinamento orizzontale fa orbitare l'occhio del palco, senza bloccare lo scroll verticale: è nell'host del palco, non in Anime.js, e va nella corsia PHASE1.

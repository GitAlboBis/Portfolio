# 09 — MCP & Connettori: Routing per Task

Scopo: dire agli agenti AI QUALE MCP (Model Context Protocol server) o connettore usare per ogni task di questo portfolio, quali sono gia connessi, quali vanno aggiunti, e quali passi manuali deve fare Alberto prima che l'agente possa lavorare. Questo e il documento "plugin": e la fonte di verita per la scelta degli strumenti esterni. Per la regola operativa di consultazione documentazione vedi `docs/08-CONTEXT7.md`; per le skill (non MCP) vedi `docs/10-SKILLS.md`; per il loop di QA visivo vedi `docs/11-WORKFLOW.md`.

---

## 1. Principio guida: meno MCP, piu segnale

Ogni MCP connesso occupa context window (tool schema, system prompt del server). Connetti SOLO cio che serve a questo progetto. Per il portfolio di Alberto gli essenziali sono cinque:

| MCP | Ruolo nel progetto | Insostituibile perche |
|-----|--------------------|------------------------|
| Blender | Generazione asset 3D (logo `at-mark.glb`, eventuali props) | Unico modo di produrre/ottimizzare il GLB del logo dentro la pipeline |
| Higgsfield | Generazione clip cinematiche (Pan di Zucchero, backflip/tuffo) | Genera i video AI scrubbati nello scroll (S3) |
| Context7 | Documentazione version-specific delle librerie | Evita API allucinate su Next 16 / three 0.184 / R3F 9 |
| claude-in-chrome | QA visivo: screenshot, console, network, ispezione runtime | Sostituisce Playwright MCP per la verifica visiva del sito reso |
| Vercel | Deploy, build/runtime logs, docs Vercel | Deploy di preview a ogni milestone + lettura log |

Opzionali (attiva solo se il task lo richiede): Figma e Canva (import design / asset), Supabase (solo se il form contatti richiede un backend reale). Tutto il resto disponibile in sessione (Notion, Linear, Slack, Sentry, Gmail, Drive, ecc.) NON serve alla costruzione del sito: non invocarli salvo richiesta esplicita di Alberto.

---

## 2. Tabella di routing: task -> MCP

| Task | MCP / connettore | Note operative |
|------|------------------|----------------|
| Generare il modello 3D del logo AT/A (`.glb`) | Blender MCP | Output -> `public/models/at-mark.glb`; poi ottimizzazione gltf-transform (vedi `docs/04-3D-HERO-WATER-LOGO.md`) |
| Generare clip video cinematica (Pan di Zucchero, tuffo) | Higgsfield MCP | Output -> `public/video/`; vedi `docs/05-CINEMATIC-SCROLL.md` |
| Documentazione API di una libreria (Next 16, three, R3F, GSAP, Lenis, zod...) | Context7 MCP | Sempre prima di scrivere codice contro una versione precisa; vedi `docs/08-CONTEXT7.md` |
| QA visivo: screenshot, leggere la console, ispezionare network, validare il rendering | claude-in-chrome | Loop obbligatorio prima di marcare done; vedi `docs/11-WORKFLOW.md` |
| Deploy del sito, leggere build log / runtime log, cercare nei docs Vercel | Vercel MCP | Preview deploy a ogni milestone; vedi `docs/01-TECHSTACK.md` |
| Importare design / componenti da Figma | Figma MCP | Opzionale; usare solo se Alberto fornisce un file Figma |
| Generare/recuperare asset grafici 2D (poster, OG image, texture) | Canva MCP | Opzionale; alternativa alle skill `imagen`/`image-studio` |
| Backend per il form contatti (SE serve persistere i messaggi) | Supabase MCP | Solo se Alberto conferma backend reale; default: form via mailto / API route serverless senza DB |

Regola di disambiguazione: per la verifica visiva NON usare Playwright MCP — usa claude-in-chrome. Per la documentazione NON tirare a indovinare le API — usa Context7. Per il deploy NON fare `git push` sperando nell'auto-deploy se puoi usare il Vercel MCP che restituisce anche i log.

---

## 3. Dettaglio MCP essenziali

### 3.1 Blender MCP — asset 3D

A cosa serve: pilotare Blender per generare il logo `at-mark.glb` (text-to-3D via Hyper3D Rodin / Hunyuan3D), caricare HDRI da Poly Haven, ed esportare il GLB. Il GLB grezzo va poi ottimizzato fuori da Blender con gltf-transform e tipizzato con gltfjsx (pipeline in `docs/04-3D-HERO-WATER-LOGO.md`).

Stato: NON connesso di default. Va aggiunto, E richiede setup manuale una-tantum lato Alberto.

Riferimento upstream: `ahujasid/blender-mcp`, eseguito via `uvx`.

Comando di aggiunta MCP (lato agente/CLI, dopo che Alberto ha installato `uv`):

```bash
claude mcp add blender -- uvx blender-mcp
```

Passi manuali una-tantum (LI FA ALBERTO — gli agenti NON possono installare ne avviare Blender):

1. Installare `uv` (package manager Python che fornisce `uvx`).
2. Installare Blender 3.0 o superiore.
3. Installare l'addon `BlenderMCP` in Blender (Edit -> Preferences -> Add-ons -> Install dal file dell'addon, poi spuntarlo).
4. In Blender aprire il pannello dell'addon (sidebar `N` -> tab BlenderMCP) e premere "Connect to Claude".
5. Inserire la chiave Hyper3D / fal.ai nel pannello dell'addon (necessaria per Rodin/Hunyuan text-to-3D).
6. Lasciare Blender APERTO e connesso mentre l'agente lavora.

```text
IMPORTANTE: l'agente non avvia Blender e non puo cliccare "Connect to Claude".
Se il task richiede Blender e la connessione non e attiva, l'agente DEVE
fermarsi e chiedere ad Alberto di completare i passi 1-6 sopra.
```

### 3.2 Higgsfield MCP — video cinematici

A cosa serve: generare le clip AI della sezione S3 (CINEMATICA): il volo/drone su Pan di Zucchero e il backflip/tuffo di Alberto dallo scoglio. Queste clip vengono poi scrubbate dallo scroll (vedi `docs/05-CINEMATIC-SCROLL.md`).

Stato: GIA disponibile in sessione (connettore Higgsfield). Richiede autenticazione MCP (OAuth) al primo uso.

Autenticazione: al primo invio l'agente puo trovare il connettore non autenticato. In quel caso avvia il flusso di authenticate del connettore Higgsfield e chiedi ad Alberto di completare il consenso OAuth nel browser. Non procedere finche non risulta autenticato.

Come passare i prompt video:
- Prompt in INGLESE, descrittivi, cinematici. Specificare soggetto, camera move, luce (golden hour, ricordare il token `--gold` per i picchi sole-su-acqua), durata, aspect ratio.
- Aspect ratio consigliato: 16:9 per la clip-base, ma valutare un crop verticale solo se serve su mobile.
- Generare la clip in qualita alta; lo scrub dello scroll richiede frame fluidi.

Esempio di prompt (Pan di Zucchero):

```text
Cinematic aerial drone shot orbiting the Pan di Zucchero sea stack off Masua,
Sardinia at golden hour. Deep teal water, foam against the rock, warm low sun
glinting on the surface. Slow push-in, 24fps, 16:9, photoreal, high dynamic range.
```

Esempio di prompt (transizione/tuffo):

```text
A diver performs a backflip off a coastal rock into the deep teal sea below,
spray and foam on entry, slow-motion, cinematic, golden-hour rim light, 16:9.
```

Dove salvare gli output:

```text
public/video/
  clip-a-approach.mp4      # clip aerea Pan di Zucchero (+ .webm + poster)
  clip-b-backflip.mp4      # clip tuffo/backflip (+ .webm + poster)
```

Il naming canonico dei file video (e i formati .webm + poster) e definito in `docs/05-CINEMATIC-SCROLL.md`.

Note: rispettare il performance budget (vedi `docs/01-TECHSTACK.md`) — i video sono lazy-loaded, decorativi (`aria-hidden`), e degradano su mobile / `prefers-reduced-motion` (poster statico al posto dello scrub). Encoding/ottimizzazione frame-sequence possono passare dalle skill `remotion`/`remotion-best-practices`.

### 3.3 Context7 MCP — documentazione

A cosa serve: recuperare documentazione version-specific. Stato: NON connesso di default. Comando di aggiunta:

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

Il documento completo (regola operativa "consulta prima di scrivere codice contro una versione precisa", elenco librerie, skill di fallback `context7-auto-research`) e `docs/08-CONTEXT7.md`. Qui basta sapere: e essenziale, va aggiunto, nessun passo manuale oltre al comando.

### 3.4 claude-in-chrome — QA visivo

A cosa serve: aprire il sito reso (locale o preview Vercel), fare screenshot, leggere la console (errori WebGL/WebGPU, warning React), ispezionare le network request (peso GLB/video, code splitting), e validare visivamente che hero, scroll-scrub e transizioni rendano come da design.

Stato: GIA disponibile in sessione. Sostituisce Playwright MCP per ogni verifica visiva di questo progetto.

Note operative:
- I tool del browser possono essere deferred: caricarli con una sola ToolSearch (set core: `tabs_context_mcp`, `navigate`, `computer`, `read_page`, `tabs_create_mcp`; aggiungere `read_console_messages` / `read_network_requests` per il debug).
- Richiede permessi a livello di sito nell'estensione, concessi da Alberto.
- Usare per il loop "rendi -> guarda -> confronta col design -> correggi" descritto in `docs/11-WORKFLOW.md`. Il QA visivo e un gate obbligatorio: nessuna sezione e "done" senza screenshot verificato e console pulita.

### 3.5 Vercel MCP — deploy e log

A cosa serve: deploy del sito, lettura build log e runtime log, ricerca nei docs Vercel, gestione progetto/deployment. Stato: GIA disponibile in sessione (puo richiedere authenticate al primo uso).

Note operative:
- Preview deploy a ogni milestone (vedi `docs/01-TECHSTACK.md` e `docs/11-WORKFLOW.md`).
- Se un deploy fallisce, leggere PRIMA i build log via MCP, poi correggere; non rilanciare alla cieca.
- Per dubbi su config Next 16 / Turbopack / image formats, usare la ricerca docs Vercel del MCP oppure le skill `vercel:nextjs` / `vercel:turbopack` / `vercel:deployments-cicd`.

---

## 4. MCP opzionali

### 4.1 Figma MCP
Stato: disponibile in sessione (authenticate al primo uso). Usare SOLO se Alberto fornisce un file Figma da cui importare layout/componenti/token. Non e parte del percorso obbligatorio: il design e gia specificato in `docs/02-DESIGN.md`.

### 4.2 Canva MCP
Stato: disponibile in sessione (authenticate al primo uso). Usare per asset 2D (poster video, OG image, texture) se preferito alle skill di generazione immagini (`imagen`, `image-studio`, `fal-generate`). Opzionale.

### 4.3 Supabase MCP
Stato: disponibile come plugin. Usare SOLO se il form contatti deve persistere messaggi in un DB reale. Default del progetto: il contatto avviene via email diretta / LinkedIn / GitHub (vedi S6 in `docs/00-PRD.md`), eventualmente con una API route serverless senza database. Prima di introdurre Supabase, confermare con Alberto: aggiunge superficie d'attacco e costi non giustificati per un portfolio statico. Se confermato: `list_tables` prima di ogni schema change, RLS su ogni tabella, niente chiavi service-role lato client.

---

## 5. Regola "verifica MCP all'avvio" (obbligatoria)

All'inizio di una sessione di lavoro sul portfolio, PRIMA di iniziare un task che dipende da un MCP, l'agente esegue questo check e lo riporta ad Alberto:

1. Elenca gli MCP attualmente connessi (`claude mcp list`).
2. Confronta con gli essenziali del progetto: Blender, Higgsfield, Context7, claude-in-chrome, Vercel.
3. Per ogni MCP MANCANTE, stampa il comando esatto per aggiungerlo:

```bash
# Context7 (docs version-specific)
claude mcp add --transport http context7 https://mcp.context7.com/mcp

# Blender (asset 3D) — richiede uv + Blender + addon lato Alberto
claude mcp add blender -- uvx blender-mcp
```

4. Segnala i setup manuali ancora da fare (in particolare Blender: passi 1-6 della sezione 3.1, e la chiave Hyper3D/fal.ai) e gli authenticate pendenti (Higgsfield, Vercel, eventuali Figma/Canva).
5. NON installare MCP non essenziali (consumano context).
6. ASPETTA conferma di Alberto prima di procedere con task che richiedono MCP non ancora pronti. Se Blender non e connesso e il task e "genera il logo", fermati e chiedi: l'agente non puo avviare Blender da solo.

Checklist sintetica di prontezza:

```text
[ ] Context7 connesso            (claude mcp add ... context7)
[ ] Blender connesso + addon attivo + "Connect to Claude" + chiave Hyper3D  (Alberto)
[ ] Higgsfield autenticato       (OAuth, Alberto conferma nel browser)
[ ] claude-in-chrome: permessi sito concessi (Alberto)
[ ] Vercel autenticato           (OAuth)
[ ] Figma/Canva                  (solo se richiesti)
[ ] Supabase                     (solo se form contatti con backend confermato)
```

---

## 6. Anti-pattern da evitare

- Installare MCP "per sicurezza" che non servono al sito (Notion, Slack, HubSpot, Sentry, ecc.): NO, sprecano context.
- Usare Playwright MCP per il QA visivo: NO, usare claude-in-chrome.
- Scrivere codice contro Next 16 / three 0.184 / R3F 9 senza Context7: NO, rischio API allucinate.
- Tentare di avviare Blender o cliccare "Connect to Claude" da agente: impossibile, e compito manuale di Alberto.
- Introdurre Supabase per il form senza conferma: NO, default senza DB.
- Marcare una sezione "done" senza screenshot claude-in-chrome e console pulita: NO (vedi `docs/11-WORKFLOW.md`).

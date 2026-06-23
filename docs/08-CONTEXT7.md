# 08 — Context7 MCP

> Scopo: stabilire come e quando interrogare **Context7 MCP** per ottenere documentazione *version-specific* delle librerie volatili dello stack (three.js / TSL, `@react-three/*`, `postprocessing`, GSAP, Lenis, Zustand, Next.js), così che gli agenti scrivano codice contro l'API **realmente installata** e non contro un'API memorizzata o obsoleta. Questo documento è una direttiva operativa vincolante: la regola della sezione "Regola operativa" non è negoziabile.

---

## 1. Perché Context7 è obbligatorio in questo progetto

Lo stack canonico (vedi `docs/01-TECHSTACK.md`) è composto da librerie che cambiano API **di minor in minor**, spesso senza deprecation graduale:

- **three.js `0.184.0`** — il sistema **TSL** (Three Shading Language) e i nodi **WebGPU** (`WebGPURenderer`, `instancedArray`, `Fn().compute()`, `*.element()`, `storage`, `uniform`, `texture` node) sono **l'area più volatile in assoluto**: nomi di import, firme dei nodi e percorsi (`three/webgpu`, `three/tsl`) cambiano tra release. Codice TSL scritto a memoria è quasi sempre sbagliato.
- **`@react-three/fiber 9.6.x`** — la v9 richiede **React 19** e ha rivisto root API, eventi e ciclo di vita rispetto alla v8.
- **`@react-three/drei 10.7.x`** — molti helper sono stati rinominati/rimossi tra v9 e v10.
- **`@react-three/postprocessing 3.0.x` + `postprocessing 6.39.x`** — l'EffectComposer R3F e i passi (`Bloom`, `DepthOfField`, `N8AO`) hanno prop e default che variano per versione.
- **`gsap 3.15.x` + `@gsap/react 2.1.2`** — `useGSAP`, registrazione plugin (`ScrollTrigger`), e cleanup hanno pattern specifici per versione; GSAP è inoltre passato a licenza/registry modificati di recente.
- **`lenis 1.3.x`** — il pacchetto è stato rinominato (da `@studio-freight/lenis` a `lenis`) e l'API di sync col RAF è cambiata.
- **Next.js 16 (App Router, Turbopack) / React 19** — `next/font`, `next.config`, metadata API, Server/Client component boundaries evolvono rapidamente.

L'allucinazione tipica dell'LLM è scrivere codice plausibile ma riferito a una versione precedente (es. `@studio-freight/lenis`, vecchi import `three/examples/jsm/...` invece di `three/tsl`, `GPUComputationRenderer` quando il backend è WebGPU). Context7 elimina questa classe di errori alla radice fornendo snippet e firme aggiornati alla release esatta.

---

## 2. Setup (NON connesso di default)

Context7 **non è tra gli MCP attivi in questa sessione** (vedi `docs/09-MCP.md`). Va aggiunto una tantum con:

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

Note operative:

- Dopo l'`add`, verificare la connessione con `claude mcp list` (deve comparire `context7` come `connected`).
- È un transport **HTTP remoto**: nessuna installazione locale, nessuna dipendenza di sistema. Se l'endpoint richiede una API key in futuro, documentarla qui e in `docs/09-MCP.md` — al momento l'endpoint pubblico funziona senza chiave.
- Regola di disciplina (vedi `docs/09-MCP.md`): non aggiungere MCP inutili. Context7 è **essenziale** per questo progetto e va tenuto attivo per tutta la durata della build.

---

## 3. Regola operativa VINCOLANTE

> **PRIMA** di scrivere o aggiornare *qualsiasi* riga di codice che tocchi `three` / `three/tsl` / `three/webgpu`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `gsap` / `@gsap/react`, `lenis`, `zustand` o `next`, l'agente **DEVE** consultare Context7 per l'API della **versione installata** (quella pinnata in `package.json` / risolta nel `bun.lock`).

Come si invoca, in pratica:

1. Aggiungere il tag **`use context7`** al prompt/intento di scrittura del codice, indicando libreria **e versione**. Esempio: *"Implementa il compute step GPGPU con TSL `instancedArray` e `Fn().compute()` per three `0.184.0`. use context7"*.
2. Risolvere prima l'ID della libreria (es. `/pmndrs/react-three-fiber`, `/mrdoob/three.js`) e poi recuperare i topic mirati (es. `WebGPURenderer`, `TSL`, `compute`, `ScrollTrigger`, `useGSAP`).
3. Confrontare la versione dei docs restituiti con quella in `package.json`. Se Context7 non offre la versione esatta, prendere la **più vicina ≤** alla installata e annotare la discrepanza in un commento `// verified against three X.Y via Context7`.

Checklist di gate (da rispettare prima di considerare "fatto" un task di codice 3D/scroll):

- [ ] Versione della libreria letta da `package.json` (non assunta).
- [ ] Context7 consultato per quella versione (`use context7`).
- [ ] Import path verificati contro i docs (es. `three/webgpu`, `three/tsl`, `lenis`, `@gsap/react`).
- [ ] Firme dei nodi TSL / prop dei componenti R3F verificate, non inventate.
- [ ] Eventuale discrepanza di versione annotata in commento.

**Anti-pattern**: scrivere il codice "a memoria", lanciarlo, e consultare Context7 solo dopo l'errore. Si cerca **prima** di scrivere, non dopo (vedi sezione 6).

---

## 4. Librerie chiave da cercare e perché

| Libreria (Context7 ID indicativo) | Versione pin | Topic da chiedere | Perché è critico |
|---|---|---|---|
| `three` (`/mrdoob/three.js`) | `0.184.0` | `WebGPURenderer`, `TSL`, `instancedArray`, `Fn`, `compute`, `storage`, `uniform`, `MeshSurfaceSampler` | **Massima volatilità.** TSL/WebGPU node system e import (`three/webgpu`, `three/tsl`) cambiano spesso. È il cuore del logo ad acqua (vedi `docs/04-3D-HERO-WATER-LOGO.md`). |
| `@react-three/fiber` | `9.6.x` | root/`Canvas` API, eventi, `useFrame`, React 19 compat | v9 + React 19: ciclo di vita ed eventi rivisti rispetto a v8. |
| `@react-three/drei` | `10.7.x` | helper usati (loader GLB, `AdaptiveDpr`, `PerformanceMonitor`) | Helper rinominati/rimossi tra v9 e v10. |
| `@react-three/postprocessing` + `postprocessing` | `3.0.x` / `6.39.x` | `EffectComposer`, `Bloom`, `DepthOfField`, selective bloom | Prop e default di Bloom/DOF (look cinematografico hero + cinematica) variano per versione. |
| `gsap` + `@gsap/react` | `3.15.x` / `2.1.2` | `useGSAP`, `gsap.registerPlugin`, `ScrollTrigger`, scrub | Pattern di registrazione plugin e cleanup `useGSAP` specifici per versione. |
| `lenis` | `1.3.x` | init, `raf`, sync con R3F, `lenis.on('scroll')` | Pacchetto rinominato (non più `@studio-freight/lenis`); sync RAF cambiato. Vedi `docs/03-ARCHITECTURE.md` per il single-RAF Lenis↔R3F. |
| `zustand` | `5.0.x` | `create`, slices, selettori, `useShallow` | v5 ha rimosso default export e cambiato alcune firme rispetto a v4. |
| `next` | `16` | `next/font`, `next.config`, metadata, App Router, Turbopack | API metadata/font e config evolvono di continuo. |

Priorità d'uso: **three/TSL/WebGPU** è la prima cosa da verificare su ogni task 3D; GSAP/Lenis su ogni task di scroll/motion (vedi `docs/05-CINEMATIC-SCROLL.md`).

---

## 5. Fallback se Context7 non è disponibile

Se l'endpoint è irraggiungibile, non connesso, o non copre la versione, **in ordine**:

1. **Skill `context7-auto-research`** — orchestrazione di ricerca docs version-aware come sostituto diretto dell'MCP (vedi `docs/10-SKILLS.md`).
2. **Leggere `node_modules/<pkg>`** — la fonte di verità assoluta. Ispezionare i type definitions `.d.ts` (es. `node_modules/three/build/three.webgpu.d.ts`, `node_modules/three/src/nodes/...`, `node_modules/@react-three/fiber/dist/...`, `node_modules/lenis/dist/lenis.d.ts`) e il `package.json` del pacchetto per `version` ed `exports` (conferma gli import path reali, es. `three/webgpu`, `three/tsl`).
3. **Docs ufficiali via web** (skill di ricerca / WebFetch) — solo se si verifica che la versione documentata combaci con quella installata; altrimenti trattare come indicativi.

Ordine di affidabilità: `node_modules/.d.ts` (esatto, locale) ≥ Context7 (esatto, remoto) > skill di research > docs web generici.

---

## 6. Workflow di verifica (cercare PRIMA di scrivere)

```text
1. Apri il task di codice (es. "compute step GPGPU TSL").
2. Leggi la versione esatta da package.json / bun.lock.
3. Interroga Context7 con "use context7" + libreria + versione + topic.
   └─ se KO → fallback sezione 5 (context7-auto-research → .d.ts → web).
4. Scrivi il codice contro le firme/import verificati.
5. Annota in commento la versione verificata (// verified vs three 0.184.0 via Context7).
6. Esegui / QA visivo (claude-in-chrome, vedi docs/11-WORKFLOW.md).
   └─ se errore di API → NON è il punto di partenza: significa step 3 saltato o versione errata. Torna a 2-3.
```

Principio: Context7 è uno strumento **preventivo**, non un debugger. Si consulta all'inizio del task per evitare l'errore, non alla fine per ripararlo.

---

## 7. Riferimenti incrociati

- `docs/01-TECHSTACK.md` — versioni canoniche e pin di `package.json`.
- `docs/03-ARCHITECTURE.md` — sync Lenis↔R3F (single RAF), store Zustand.
- `docs/04-3D-HERO-WATER-LOGO.md` — TSL/WebGPU del logo ad acqua (massimo carico Context7).
- `docs/05-CINEMATIC-SCROLL.md` — GSAP ScrollTrigger + scrub.
- `docs/09-MCP.md` — routing MCP, setup e regola "no MCP inutili".
- `docs/10-SKILLS.md` — skill `context7-auto-research` e routing per task.
- `docs/11-WORKFLOW.md` — gates e loop di QA visivo.

# SSF Water "A" — Diagnosi "tinta unita" + Piano di refactor

> Analisi prodotta con workflow multi-agente (19 agenti, ~1.6M token: 3 mappe pipeline → 6 diagnostici per anello SSF → verifica avversariale dei candidati root-cause) **+** lettura diretta del sorgente da parte del main loop. Confronto: la TUA implementazione (`src/webgl/liquid/ssf/`) vs i due cloni di riferimento `WaterBall-main/` (target di look) e `Splash-main/` (secondario).
> Prosa in italiano, codice/identificatori in inglese (regola `CLAUDE.md`). Data: 2026-06-25. Branch: `fix/ssf-water-faithful-port`.

---

## 0. TL;DR (una frase)

**Lo shader NON è rotto e la matematica è un port corretto di waterball.** La "A" appare a tinta unita per un problema di **ricetta di shading + flusso-dati**, non di geometria né di ricostruzione delle normali: il **termine di rifrazione pesa ~98%** del colore del corpo (perché `F0 = 0.02` ⇒ fresnel ≈ 0.02 a incidenza normale), e quel termine **(a)** in `?bg=off` (la tua modalità di QA) legge un backdrop **nero**, e **(b)** anche con backdrop acceso è modulato solo dalla *thickness*, che su una lettera sottile è **quasi-costante** → il termine dominante è piatto. L'unico segnale che varia davvero con la superficie — la **reflection dell'environment** — è soffocato al ~2% dallo stesso `F0`. Risultato: corpo a tinta unita. **Il fix è ribilanciare la ricetta** così che la variazione per-pixel nasca dal **normale** (reflection forte / rifrazione direzionale), non dalla thickness che la geometria piatta non può fornire.

---

## 1. Come è stata fatta la diagnosi

| Fase | Cosa | Esito |
|---|---|---|
| Map | 3 agenti mappano `waterball`, `Splash`, `MINE` (passi, formati RT, storage depth, ricostruzione normali, formula lighting) con `file:riga` | 3 mappe strutturate |
| Diagnose | 6 agenti, uno per anello dove può nascere la "tinta unita": `depth-pass`, `normal-reconstruction`, `composite-lighting`, `thickness-blur`, `rt-wiring`, `tsl-webgpu` | 29 findings |
| Verify | Skeptic avversariali sui top-10 candidati: refutare se l'evidenza non regge contro il sorgente reale | **2 confermati (1 primario), 8 refutati** |

Il valore della verifica avversariale: **ha refutato l'ipotesi "intuitiva"** (slab piatto → normale costante → tinta unita) con prove numeriche, e ha isolato la causa reale + uno **smoking gun nel `git diff`**.

---

## 2. Le tre pipeline a confronto

Tutte e tre seguono la stessa pipeline SSF (Screen-Space Fluids): **depth pass → blur depth → thickness pass → blur thickness → composite fullscreen**. Le differenze sono nel **composite** (da dove nasce la variazione per-pixel).

| Aspetto | **waterball** (target) | **Splash** | **MINE** (attuale, working tree) |
|---|---|---|---|
| Depth storage | eye-z negativo, `r32float`, letto con `abs()` | idem | idem ✅ (port corretto) |
| Normali | `-normalize(cross(ddx,ddy))`, neighbor più vicino in z | idem | `normalize(cross)` + flip se `N.z<0` ✅ (equivalente) |
| **Rifrazione** | **costante non-nulla** `bgColor=(0.7,0.7,0.75) × transmittance(thickness)** | **direzionale**: `refract(rayDir,N,1/1.333)` → **campiona la env cube/floor** | **see-through**: `texture(backdropTex, uv + N.xy·0.04·…)` ← legge una foto/▒ nero |
| **Reflection** | env cube `reflect(rayDir,N)`, LOD 0 | env cube `reflect`, LOD 0 | env cube `reflect`, LOD 1 ✅ |
| Fresnel | Schlick, `F0=0.02`, exp 5 | idem | idem (`F0=0.02`) |
| Mix | `mix(refr, refl, fresnel)` | idem | idem |
| Specular/glint | **0.0 (spento)** | **0.0 (spento)** | **0.7 (riacceso)** ⚠️ |
| **Da dove nasce la vita per-pixel** | **thickness** (palla → range enorme di spessore) → Beer-Lambert sul termine 98% | **direzione rifratta/riflessa** → lookup env ad alta frequenza | *nessuna delle due*: rifrazione legge una sorgente piatta/nera, reflection soffocata a 2% |

**Insight chiave:** waterball e Splash *non* dipendono dalle stesse cose. waterball vive di **thickness** (è una palla: centro spesso, bordo sottile → enorme gradiente). Splash vive di **lookup direzionali dell'env** (rifrazione + riflessione che spazzano la cubemap+pavimento). **La tua "A" non può fornire né l'una né l'altra**: è una lastra sottile → thickness quasi-costante; e tu hai sostituito il lookup direzionale con un campionamento see-through di una foto piatta (o nera). Quindi **nessuna delle due sorgenti di variazione è attiva**.

---

## 3. Diagnosi: perché "tinta unita"

### 3.1 — CAUSA PRIMARIA (confermata, conf. 0.78) — il termine dominante legge una sorgente senza segnale

Il colore del corpo è (`materials.ts:362-368`):

```
fres = clamp(F0 + (1-F0)·pow(1-ndv, 5), 0, 1)     // F0 = 0.02  →  fres ≈ 0.02 a incidenza normale
outColor = mix(refractionColor, reflectionColor, fres)   // ≈ 98% refractionColor + 2% reflection
```

e la rifrazione è (`materials.ts:351-354`):

```
refrOffset      = N.xy · uRefractStrength(0.04) · (thickness + 0.5)   // offset minuscolo
sceneBehind     = texture(backdropTex, uv + refrOffset)               // ← legge backdropRT
tint            = exp(-(1-diffuseColor)·thickness·uDensity)
refractionColor = sceneBehind · tint
```

`backdropTex = backdropRT.texture`. In **`?bg=off`** (la modalità QA documentata in `HANDOFF.md:69,104`, `?hero=ssf&bg=off`) il `PhotoBackdrop` **non viene montato** (`CanvasHost.tsx:51-55,92`), quindi `backdropRT` è **nero uniforme** → `sceneBehind = 0` → `refractionColor = 0` ovunque → corpo ≈ `mix(nero, reflection, 0.02)` = **lettera uniformemente scura**.

**🔫 Smoking gun (`git diff HEAD -- src/webgl/liquid/ssf/materials.ts`):** le modifiche **non committate** hanno **revertito** la rifrazione committata — che era **fedele a waterball** e robusta —:

```diff
- // committed (HEAD): costante NON-NULLA, modulata da Beer-Lambert
- const trans = exp(diffuseColor.sub(1.0).mul(uDensity.mul(10.0).mul(thickness)));
- const refractionColor = uRefractBg.mul(trans);      // uRefractBg = (0.7,0.7,0.75)  → mai nero
- // reflection via pmremTexture (roughness-aware)
+ // working tree: see-through che legge il backdrop  → NERO in ?bg=off
+ const sceneBehind = texture(opts.backdropTex, uv.add(refrOffset)).rgb;
+ const refractionColor = sceneBehind.mul(tint);      // = 0 quando il backdrop è nero
+ // reflection via cubeTexture (sharp)
```

Quindi il codice **attuale** è esattamente la forma che diventa nera in QA. Ecco perché "ho provato mille modi ma è sempre tinta unita": **qualsiasi** knob della leva tocchi (`diffuseColor`, `density`, `edgeFoam`, `refractStrength`), il termine al 98% resta nero/piatto.

### 3.2 — CAUSA PRIMARIA #2 (confermata, conf. 0.66) — anche con backdrop acceso, il termine al 98% non porta segnale

Con `?bg=on`: `sceneBehind` campiona la foto del mare `/images/AdobeStock_1294278468.jpeg` (`PhotoBackdrop.tsx:14`) a un offset **sub-pixel/pochi-pixel** (perché `refrOffset` è minuscolo e la "A" sottile ha thickness piccola). Dietro la lettera la foto è grande e a bassa frequenza → `sceneBehind` ≈ costante. E `tint = exp(...)` con `density` runtime **0.32** (`SSFControls.tsx:22`) e thickness piccola ⇒ `tint ≈ 1` (quasi nessun assorbimento). Quindi `refractionColor ≈ costante`, e con fresnel ≈ 0.02 il corpo è ≈ 98% di quel valore costante → **tinta unita** (un ritaglio della foto leggermente tinto, con un rim bianco di foam).

### 3.3 — Ipotesi REFUTATE (per onestà intellettuale — non sono la causa)

Queste sembravano colpevoli ma la verifica avversariale le ha smontate sul sorgente:

- **❌ "Slab piatto → normale costante (0,0,1) → tinta unita".** Refutata: anche con `N` perfettamente costante, il composite **varierebbe comunque** per-pixel, perché `rayDir = normalize(P)` varia con la posizione schermo → variano `ndv`/fresnel, `reflect(rayDir,N)` → reflection, e la thickness → Beer-Lambert. Un normale costante appiattisce **solo lo sweep della reflection**, non tutto. Inoltre il depth pass renderizza **sphere imposters** (la superficie è l'inviluppo max-z di 56k calotte sferiche, non un piano), e il raggio sfera proiettato è **comparabile o più grande** di quello di waterball. → Contributo **secondario**, non causa.
- **❌ "3 iterazioni di blur sovra-lisciano la depth".** Refutata: waterball ne fa **4** (più di te) e resta acqua. Non è un difetto MINE-specifico. (Ma vedi §4: ridurre il blur resta una leva utile perché *tu* non hai la curvatura macro della palla su cui ripiegare.)
- **❌ "La ricostruzione del normale è sbagliata".** Refutata numericamente: `reconstruct()` è matematicamente corretta per una proiezione prospettica standard.
- **❌ "Manca il y-flip NDC in `reconstruct()`".** *Vero come bug*, ma **cosmetico**: specchia `normal.y` in verticale (foam/shading invertiti su y), **non** appiattisce. Da sistemare comunque (§4, Fix 5).
- **❌ "Env cubemap mancante".** Refutata: i 6 PNG esistono in `public/cubemap-sky/` (512×512). L'env c'è.
- **❌ "Bug di wiring RT / texture vuota".** Refutata: il data-flow dei 6 pass è corretto, niente read-after-write, niente handle stale dopo resize, `render()` sincrono in r184.

---

## 4. Insight da portare nel refactor

> La variazione per-pixel deve nascere da un segnale che **una lettera piatta sa fornire** = il **normale di superficie** (che varia sulle "perle" d'acqua e sul tubo arrotondato della A). NON dalla thickness (range troppo piccolo su uno slab) e NON da una sorgente piatta letta in see-through.

Tre leve, in ordine d'impatto:

1. **Spostare il budget di variazione sulla REFLECTION** (normale-driven). Oggi è soffocata al 2% da `F0=0.02` (corretto fisicamente, ma su una lettera piatta rende la reflection invisibile). Va resa un contributo reale.
2. **Rifrazione direzionale** (stile Splash): campionare l'env lungo `refract(rayDir, N, 1/1.333)` invece del nudge see-through. Così anche il termine dominante varia col normale → vita per-pixel indipendente dalla thickness.
3. **Recuperare i normali delle "perle"**: ridurre le iterazioni di blur depth (3 → 1) perché — a differenza di waterball — non hai curvatura macro su cui ripiegare; le calotte sferiche sono la tua unica fonte di curvatura.

---

## 5. Piano di refactor (ordinato, con file:riga)

> Autorizzazione di Alberto: **pieno controllo per cancellare/riscrivere**. Le modifiche sono concentrate in `makeCompositeMaterial` (`materials.ts:277-412`), più 1 riga in `SSFHero.tsx` e i knob in `SSFControls.tsx`.

### Fix 1 — Rifrazione con base non-nulla (elimina il nero in bg=off) — *obbligatorio*
Sostituire il path see-through con una **base costante modulata da Beer-Lambert** (ritorno alla forma committata, robusta) **oppure** rendere la rifrazione **direzionale sull'env** (vedi Fix 2b). In `materials.ts:351-354`:

```ts
// OPZIONE base-costante (waterball-faithful, sempre acqua anche senza backdrop):
const tint = diffuseColor.oneMinus().mul(thickness).mul(uDensity).negate().exp().toVar();
const refractionColor = uRefractTint.mul(tint).toVar();   // uRefractTint = (0.7,0.7,0.75), MAI nero
```
→ elimina la dipendenza dal backdrop per il colore del corpo. `uRefractTint` esiste già (oggi è `unused`).

### Fix 2 — Far contribuire la reflection (la sorgente di variazione per la lettera) — *obbligatorio*
Scegliere **2a** o **2b**:

**2a (semplice):** alzare il "pavimento" di reflection. Aumentare `F0` (es. `0.08–0.15`, look "vetro/acqua bagnata") **oppure** aggiungere un bias fresnel minimo:
```ts
const fres = clamp(F0.add(oneMinus(F0).mul(pow(oneMinus(ndv), 5))).add(uReflectFloor /*≈0.15*/), 0, 1);
```

**2b (fedele/qualitativo):** **rifrazione direzionale** — il termine al 98% diventa esso stesso normale-driven (Splash `fluid.wgsl:105-113`):
```ts
const refrDirView  = refract(rayDir, N, float(1.0/1.333));
const refrDirWorld = normalize(uInvView.mul(vec4(refrDirView, 0.0)).xyz);
const transmitted  = cubeTexture(opts.env, refrDirWorld, float(2.0)).rgb;  // env sfocato = "dietro"
const refractionColor = transmitted.mul(tint).toVar();
```
→ **Raccomandato 2b** (o 2a+2b): rende l'intera ricetta normale-driven, che è ciò che la geometria piatta sa alimentare.

### Fix 3 — Recuperare la curvatura delle "perle" — *consigliato*
In `SSFHero.tsx:259` ridurre le iterazioni del narrow-range blur depth da **3 a 1** (o 2) e/o ridurre `NR_MAX_FILTER`/`uProjConst`. Verificare con `?dbg=1` che la normal-map mostri variazione (non blu piatto). Eventualmente alzare leggermente `uRadius` (oggi `0.05`) per fondere meglio le perle senza piallarle.

### Fix 4 — Dare segnale alla thickness — *opzionale (tuning)*
Alzare `density` default in `SSFControls.tsx:22` da `0.32` a ~`1.5–3` per un assorbimento visibile (la "A" è sottile → serve density alta per blu profondo). Tunare in browser.

### Fix 5 — Correttezza (non appiattiscono, ma sono bug reali) — *consigliato*
- **y-flip NDC** in `reconstruct()` (`materials.ts:308`): allineare a waterball `ndc.y = 1 - 2·uv.y` (oggi usa `uv·2-1` anche su y). Coerente col fatto che `PhotoBackdrop` già flippa la V (`PhotoBackdrop.tsx:31`).
- **cubeTexture LOD** hardcoded a `1.0` (`materials.ts:359`): valutare LOD 0 per reflection nitida, o tornare a `pmremTexture` roughness-aware (com'era committato) con un `uRoughness` reale.
- **glint**: `specular` runtime è `0.7` ma entrambe le reference lo tengono **0.0**. Spegnerlo o tenerlo basso; non deve mascherare il problema.

### Fix 6 — Pulizia / cancellazione codice morto — *consigliato (refactor)*
- Rimuovere il ramo see-through e `uRefractStrength` se si adotta 2b (niente più offset schermo).
- Rimuovere le `If(uDebug...)` cascata (`materials.ts:390-404`) una volta finito il tuning, o tenerle dietro un flag dev.
- `SSFControls`: allineare i knob alla nuova ricetta (`reflectFloor`/`roughness`/`density` invece di `refractStrength`).
- Decidere il sim di default: oggi è **MLS-MPM** (`SSFHero.tsx:332-338`); lo spring-to-glyph (`?sim=spring`) tiene la "A" più ferma/leggibile. Valutare quale dare di default.

---

## 6. Protocollo di verifica (regola CLAUDE.md: niente "fatto" senza prova visiva)

1. `bun run dev` → `http://localhost:3000/?hero=ssf` **con `bg=on`** (NON bg=off: per costruzione annerisce il corpo). 
2. Ispezionare i buffer di debug: `?dbg=1` (normale — deve avere variazione, non blu piatto), `?dbg=2` (thickness), `?dbg=5` (reflection — deve "spazzare" muovendo la camera/mouse).
3. Console del browser pulita (zero errori/warning rilevanti) — attenzione al gotcha WebGPU screenshot (serve un pointer event sul canvas prima di screenshottare).
4. Screenshot **desktop + mobile**; validare la "A" sopra il mare di Pan di Zucchero.
5. `./node_modules/.bin/tsc --noEmit` (Splash-main/waterball esclusi).

---

## 7. Opzioni strategiche (decisione di Alberto)

| Opzione | Cosa | Pro | Contro |
|---|---|---|---|
| **A — Fix della ricetta SSF** *(raccomandata)* | I fix §5 (rifrazione non-nera + reflection/refraction normale-driven + meno blur) | Mantiene il sim a particelle + interazione mouse (cuore della visione); look "acqua" vero | Richiede tuning in browser; la lettera piatta resta un caso "difficile" per l'SSF |
| **B — Più profondità reale alla "A"** | Slab più spesso/arrotondato (`useMlsMpmSim` `A_ZH`/`A_HALF`, o glyph 3D) | Più gradiente di thickness e curvatura macro → più vicino a waterball | Una lettera resta a faccia piatta; la leggibilità del glifo peggiora se troppo "ciccia" |
| **C — Fallback al mesh PBR** | `?hero=mesh` esiste già (`HeroLiquidLogo` + `MeshPhysicalNodeMaterial`, transmission/IOR/roughness su `a-liquid.glb`) | **Garantito** lighting per-pixel corretto (normali di mesh reali) | Perde lo splash a particelle / la risacca col mouse |

**Raccomandazione:** **A** (con 2b). È la causa identificata, è risolvibile, e preserva la visione. Tenere **C** come rete di sicurezza/decorazione A-B.

---

## 8. Appendice — Mappa file & cosa si può cancellare

**Nostri (`src/webgl/liquid/ssf/`)**
- `materials.ts` — tutto lo shading TSL. **Cuore del refactor** (`makeCompositeMaterial`). Cancellabile: ramo see-through, `uRefractStrength`, debug cascata.
- `SSFHero.tsx` — render manager 6 pass. Modifica: iterazioni blur (Fix 3); 3 righe uniform `uInvProj/uInvView/uView` già corrette.
- `SSFControls.tsx` — knob leva. Da riallineare alla nuova ricetta.
- `useMlsMpmSim.ts` (default) / `useFluidSim.ts` (`?sim=spring`) — sim. Toccare solo per Opzione B.
- `constants.ts` — `FLUID_COUNT=56000`, layer.

**Riferimenti (read-only, gitignored):** `WaterBall-main/render/fluid.wgsl` (target), `Splash-main/render/fluid.wgsl` (rifrazione direzionale = Fix 2b), `bgColor.wgsl` (env/floor).

**Asset:** `public/cubemap-sky/` (env, OK), `public/images/AdobeStock_1294278468.jpeg` (backdrop), `public/models/a-liquid.glb` (glyph).

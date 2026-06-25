# 12 — Particle Physics: PBD · PBF · Unified Particle Physics

> Base di conoscenza (oro sacro) per ogni modifica e implementazione futura della
> simulazione a particelle dell'hero. Sintesi fedele dei tre paper in `docs/`:
> studiarla prima di toccare `src/webgl/waterball/mls-mpm/*` o di valutare un solver
> alternativo. Prosa in italiano, equazioni/identificatori/termini tecnici in inglese
> (regola `CLAUDE.md`). Notazione math in ASCII: `grad` = gradiente, `.` = dot product,
> `x` = cross product, `|·|` = norma, `^` = potenza, `<-` = assegnazione.

## 0. I tre paper e perché ci servono

| # | Paper | Autori / anno | Cosa dà a noi |
|---|---|---|---|
| **PBD** | *Position Based Dynamics* | Müller, Heidelberger, Hennix, Ratcliff — 2006/2007 (VRIPHYS) | Il **framework**: simulare muovendo direttamente le **posizioni** via *constraint projection*. Stabilità incondizionata, controllo diretto, collisioni/attacchi triviali. |
| **PBF** | *Position Based Fluids* | Macklin & Müller — SIGGRAPH 2013 | **Acqua incomprimibile** dentro PBD: density constraint, `lambda`, `s_corr` (tensione superficiale), vorticity confinement, XSPH viscosity. Real-time GPU (128k particelle ~10ms). |
| **Unified** | *A Unified Particle Physics for Real-Time Applications* | Macklin, Müller, Chentanez, Kim — SIGGRAPH 2014 | **Tutto è particella+constraint**: shape matching (rigidi/soft), fluidi (PBF), gas, cloth, attrito a livello di posizione, sleeping, mass scaling, diffuse/foam particles, collisione SDF. Solver parallelo (Gauss-Jacobi + SOR). |

**Stato attuale del nostro hero (contesto):** l'hero è il port grezzo di **matsuoka-601/WaterBall** — un solver **MLS-MPM** (Material Point Method, *grid-based*) in WebGPU (`p2g_1 → p2g_2 → updateGrid → g2p`), vendored in `src/webgl/waterball/`, reso via screen-space fluid (`render/*.wgsl`). La "A" è ottenuta confinando il fluido a una forma-lettera in `mls-mpm/g2p.wgsl`, con uno splash al mouse.
**MLS-MPM ≠ PBD/PBF**: MPM trasferisce su una griglia di sfondo; PBD/PBF sono *grid-free* (solo particelle + constraint). Questi paper sono quindi sia la **teoria** dietro le tecniche che usiamo (la "proiezione di posizione" nel nostro `g2p.wgsl` è letteralmente un constraint PBD), sia l'**alternativa più leggera** se MPM diventa un collo di bottiglia.

---

## Parte A — PBD (Position Based Dynamics): il framework

### A.1 Idea centrale
La simulazione classica è *force-based* (forze → accelerazioni → integri velocità → integri posizioni). PBD **salta lo strato delle velocità** e lavora **direttamente sulle posizioni**: ogni step (1) predice nuove posizioni con un passo di Euler esplicito, (2) **proietta** iterativamente la predizione finché un insieme di *constraint* `C` è soddisfatto, (3) ricava le velocità dal cambiamento di posizione. Vantaggi: **stabilità incondizionata** (non estrapola alla cieca nel futuro → niente overshooting/guadagno di energia → la stabilità **non** dipende dal time-step) e **controllo diretto** (collisioni/attacchi = sposti i punti in una posizione valida).

### A.2 Loop di simulazione (pseudocodice, struttura del paper)
```
(1)  forall vertices i: init x_i, v_i, w_i = 1/m_i
(4)  loop per time step dt:
(5)    forall i: v_i <- v_i + dt * w_i * f_ext(x_i)        // forze esterne (gravità: v += dt*g)
(6)    dampVelocities(v_1..v_N)                            // damping opzionale
(7)    forall i: p_i <- x_i + dt * v_i                     // PREDIZIONE (Euler esplicito)
(8)    forall i: generateCollisionConstraints(x_i -> p_i)  // genera le collision constraint (FUORI dal solver)
(9)    loop solverIterations volte:
(11)      projectConstraints(C_1..C_{M+Mcoll}, p_1..p_N)   // proietta ogni constraint (Gauss-Seidel, in-place)
(14)   forall i: v_i <- (p_i - x_i)/dt ; x_i <- p_i        // velocità dal Δposizione, commit
(16)   velocityUpdate(v_1..v_N)                            // attrito/restituzione sui punti in collisione
```

### A.3 Constraint projection (il cuore)
Un constraint `j` ha: cardinalità `n_j`, funzione `C_j`, indici dei punti, stiffness `k_j ∈ [0..1]`, tipo (equality `C=0` / inequality `C>=0`). Per proiettarlo:
```
linearizzazione (Newton):  C(p + Δp) ≈ C(p) + grad_p C(p) . Δp = 0
correzione lungo il gradiente (conserva i momenti):  Δp_i = -s * w_i * grad_{p_i} C
scaling comune:  s = C(p_1..p_n) / ( sum_j  w_j * |grad_{p_j} C|^2 )
stiffness:  Δp_i *= k'  con  k' = 1 - (1-k)^(1/ns)   // ns = solverIterations -> stiffness ~lineare nelle iterazioni
```
- `w_i = 1/m_i`: un punto a massa infinita (`w=0`) **non si muove** → così si **pinna** un bordo/àncora.
- La correzione **lungo il gradiente** conserva momento lineare e angolare (niente "ghost forces") per i constraint *interni*. I constraint di collisione/attacco possono avere effetti globali (è voluto).
- **Gauss-Seidel** (in-place, sequenziale): convergenza veloce (un'onda di pressione si propaga in un solo pass), ma **ordine-dipendente** e può oscillare se l'ordine cambia.

### A.4 Constraint di base (formule chiuse)
- **Distance**: `C(p1,p2) = |p1-p2| - d`; `grad_{p1}=n, grad_{p2}=-n` con `n=(p1-p2)/|p1-p2|`; `s=(|p1-p2|-d)/(w1+w2)`.
- **Collision (inequality)**: `C = (p - q_c) . n_c >= 0` (q_c punto sul piano/superficie, n_c normale) → rimuove la penetrazione proiettando il punto sulla superficie.
- **Attachment**: distance constraint verso un punto target con `w=0` sul target (àncora fissa).

### A.5 Stiffness, damping, parallelismo
- **Stiffness ↔ iterazioni**: con 1 iterazione il sistema è "esplicito/morbido"; aumentando le iterazioni diventa arbitrariamente rigido (più *implicit-like*). `k'=1-(1-k)^(1/ns)` linearizza l'effetto di `k` rispetto al numero di iterazioni.
- **Damping** (§3.5): si può smorzare verso il moto di **corpo rigido** (preserva la traslazione/rotazione globale, smorza solo le oscillazioni interne) — utile per far "calmare" un blob senza congelarlo.
- **GPU**: Gauss-Seidel è seriale; su GPU si usa una variante **Jacobi** (accumula tutte le correzioni dalle stesse posizioni, poi applica) — più parallela ma converge più lenta → servono più iterazioni. È la via di PBF/Unified.

---

## Parte B — PBF (Position Based Fluids): acqua incomprimibile

### B.1 Idea centrale
Riformula la **SPH incomprimibile** dentro PBD: invece di forze di pressione rigide (che impongono dt minuscoli), definisce **un density constraint per particella** e lo risolve con correzioni di posizione (Newton lungo il gradiente). Eredita la stabilità di PBD → **time-step ~10× più grandi** di PCISPH → real-time. Aggiunge `s_corr` (anti-clumping + tensione superficiale), vorticity confinement (recupera energia persa al damping) e XSPH viscosity (moto coerente). Tutto **Jacobi → GPU** (CUDA: 128k particelle ~4ms/step).

### B.2 Equazioni chiave
```
density (SPH):        rho_i = sum_j m_j * W(p_i - p_j, h)              // m=1 -> dropped; W = Poly6
density constraint:   C_i = rho_i / rho_0 - 1                          // =0 -> incomprimibile
gradiente:            grad_{pk} C_i = (1/rho_0) * { sum_j gradW (k=i) ; -gradW (k=j) }   // Spiky gradient
lambda (CFM):         lambda_i = - C_i / ( sum_k |grad_{pk} C_i|^2 + epsilon )           // epsilon = CFM relaxation
artificial pressure:  s_corr = -k * ( W(p_i-p_j, h) / W(delta_q, h) )^n                  // anti-clumping / surface tension
position update:      delta_p_i = (1/rho_0) * sum_j (lambda_i + lambda_j + s_corr) * gradW(p_i-p_j, h)
vorticity:            omega_i = sum_j (v_j-v_i) x gradW ;  N = grad|omega_i| / |grad|omega_i|| ;  f_vort = epsilon_vort * (N x omega_i)
XSPH viscosity:       v_i <- v_i + c * sum_j (v_j - v_i) * W(p_i-p_j, h)
```
**Kernel**: **Poly6** per la densità (liscio), **Spiky** per i gradienti (gradiente **non-nullo** vicino a r=0 → evita il clustering che il Poly6 causerebbe). **Due `epsilon` distinti**: CFM relaxation (denominatore di `lambda`) ≠ vorticity strength — **non confonderli nel codice**.

### B.3 Loop PBF (Jacobi, non Gauss-Seidel)
```
1  forall i: v_i += dt*f_ext ; x*_i = x_i + dt*v_i           // predizione
5  forall i: trova vicini N_i(x*_i)                          // hash-grid, UNA volta per step
8  while iter < solverIterations (2-4):
9    forall i: rho_i, C_i, lambda_i                          // tutte dalle stesse posizioni
14   forall i: delta_p_i (eq. con s_corr) + collisione SDF
19   forall i: x*_i += delta_p_i                             // applica tutte insieme (Jacobi)
23  forall i: v_i = (x*_i - x_i)/dt                          // velocità dal Δposizione
25            v_i += dt * f_vort / m                          // vorticity confinement (opz.)
26            v_i += c * XSPH                                 // viscosity
27            x_i = x*_i                                      // commit
```
- I **vicini** si ricalcolano una volta per step (sulle posizioni predette), ma `rho_i/C_i/grad` si **rivalutano a ogni iterazione**.
- Si usano **solo le posizioni correnti** (mai pressione accumulata) → niente spike alla PCISPH quando una particella isolata rincontra i vicini.

### B.4 Parametri PBF (valori raccomandati dal paper)
| Param | Simbolo | Valore tipico | Ruolo |
|---|---|---|---|
| Rest density | `rho_0` | per-scena (riempimento → `C_i=0`) | densità target |
| Smoothing radius | `h` | legato allo spacing | supporto kernel/vicinato |
| CFM relaxation | `epsilon` | piccola costante (per-scena) | evita /0 quando il gradiente svanisce |
| Solver iterations | — | **2–4** (fisse) | pass di density-projection |
| Sub-steps | — | **1–4** | accuratezza/incomprimibilità vs costo |
| Artificial pressure | `k` | **0.1** | forza di `s_corr` (anti-clump/surface tension) |
| `s_corr` exponent | `n` | **4** | falloff di `s_corr` |
| `s_corr` ref point | `delta_q` | **0.1h–0.3h** | distanza fissa per normalizzare `s_corr` |
| XSPH viscosity | `c` | **0.01** | coerenza del moto |
| Vorticity strength | `epsilon_vort` | piccola (per-scena) | rimette energia rotazionale |

---

## Parte C — Unified Particle Physics: tutto è particella

### C.1 Idea centrale
Un **unico solver** su PBD dove **tutto è particella + constraint**: rigidi (**shape matching**), fluidi (**PBF**), gas (density unilaterale + vorticity), cloth/rope (distance), granulari (**friction**), con accoppiamento a due vie (ogni contatto è un constraint particella-particella). Contributi chiave: PBD **parallelo** (constraint **averaging** + **SOR** = Gauss-Jacobi invece del Gauss-Seidel seriale), **attrito a livello di posizione** (vero attrito statico), **pre-stabilization** (toglie l'energia da penetrazione iniziale), **SDF per-particella** per i rigidi, **mass scaling** (pile stabili), **gas/smoke** lagrangiano. Baratta un po' di accuratezza per il real-time (60fps).

### C.2 Tecniche da rubare (le più utili per noi)
- **Shape matching** (rigido/soft): voxelizzi una forma → offset di riposo `r_i` → ogni frame proietti le particelle verso `Q r_i + c` (con `Q` = rotazione ottima via polar decomposition, `c` = centro di massa). Una **stiffness** controlla quanto rigidamente tiene la forma; con stiffness bassa → ritorno **molle/risacca** alla forma. *Questa è la via più pulita per "tenere la A".*
- **Constraint averaging + SOR** (Eq.13): `x*_i += (omega/n_i) * dx_i`, dove `n_i` = numero di constraint che toccano `i`, `omega ∈ [1,2]` = over-relaxation. Rende Jacobi **stabile** anche su constraint ridondanti (che altrimenti oscillano) e **veloce**. *Indispensabile su GPU.*
- **Pre-stabilization** (1–2 iter): risolve i contatti contro le posizioni **originali** prima del solve principale → niente "pop" da compenetrazione iniziale.
- **Particle sleeping** (Eq.14): se `|x* - x0| < epsilon`, azzera il movimento → **niente jitter da fermo** (utile per la "A" a riposo).
- **Mass scaling** (Eq.21): `m*_i = m_i * exp(-k*height)` → pile/stack rigidi stabili con poche iterazioni.
- **Diffuse / marker particles** (Eq.28): particelle secondarie (spray/schiuma/fumo) **advette** dal campo di velocità del fluido e rese come sprite con size/opacity in dissolvenza — **non simulate**. *Esattamente la "pelle = schiuma" del nostro design a 2 strati.*
- **Free-surface normal** (Eq.30): la magnitudine della normale approssimata è un **rilevatore di superficie** gratis → spawnare schiuma solo dove `|n_i|` è alto.
- **Unilateral density** (Eq.26): il fluido **solo spinge via** (non tira) → niente attrazione fantasma.

### C.3 Loop Unified (sintesi)
```
1  predizione: v += dt*f_ext ; x* = x + dt*v ; mass scaling (stack)
6  vicini/contatti UNA volta (hash-grid + SDF)
10 PRE-STABILIZATION (1-2 iter): risolvi contatti vs posizioni originali, applica dx/n a x e x*
16 SOLVER (2-12 iter): per ogni GRUPPO di constraint (density, contact, distance, shape-match...):
     risolvi in parallelo -> accumula (dx, n) -> x*_i += (omega/n_i)*dx_i   // Jacobi nel gruppo, Gauss-Seidel tra gruppi
23 velocità v = (x* - x)/dt ; advect diffuse particles ; XSPH + vorticity ; commit (o SLEEPING)
```
**Modi di solve** (per tipo): *gather* particle-centric (un thread per particella, una sola scrittura — per la **density**), *scatter* constraint-centric (un thread per constraint, atomic add — per le **distance**).

---

## Parte D — Mappatura sul NOSTRO hero (la parte operativa)

> Obiettivo hero: una "A" d'acqua che **tiene la forma** a riposo, **schizza** al mouse (più veloce = più lontano), e **rientra come una risacca**. Vincolo: 60fps desktop, WebGPU, griglia MLS-MPM ≤ 80 celle/lato.

### D.1 Cosa stiamo già facendo, in linguaggio PBD
Nel nostro `mls-mpm/g2p.wgsl` il confinamento alla "A" è una **PBD position projection velocity-gated**: a riposo proiettiamo le particelle fuori dai tratti sul bordo del tubo (`x.xy <- mix(x.xy, surface, relax)`) → forma nitida; quando una particella è veloce (poke) `relax → 0` → esce libera (splash); rallentando, `relax` risale e la riporta. **È letteralmente un constraint PBD** (proiezione di posizione) con stiffness modulata dalla velocità. La lezione PBD/Unified su questo:
- Il "muro a molla" (forza ∝ distanza) **non** fa schizzare lontano (più esce, più viene tirato indietro → oscilla). La **proiezione di posizione** (PBD) sì: a riposo è netta, da veloce non vincola → vola. ✅ già adottato.
- Per il ritorno "risacca" la via pulita è **shape matching** (Unified §C.2) o un **distance/attachment constraint a stiffness bassa** verso la posa "A": più controllabile dei nudge di forza dentro MPM.

### D.2 Tecniche da innestare (ordine di valore, restando in MLS-MPM)
1. **`s_corr` (artificial pressure / surface tension)** — il singolo trucco più utile per il *look*: bordi arrotondati, goccioline coese, e tiene il corpo coeso invece di disperdersi. Solver-agnostico: si può aggiungere come correzione di posizione/velocità anti-clumping tra vicini. Param: `k≈0.1, n=4, delta_q≈0.2h`.
2. **Shape matching / attachment a bassa stiffness verso la "A"** — il ritorno-alla-lettera (risacca) come constraint, con uno **slider di stiffness** = "quanto rigidamente la A si ricompone". Più pulito del bilanciamento di forze attuale.
3. **Vorticity confinement** — rimette energia allo splash → corona dello schizzo più alta e viva (il damping position-based la mangia). Post-process di velocità.
4. **XSPH viscosity** — corpo coerente (acqua teal scura) mentre la pelle/schiuma può avere viscosità più bassa per lo spray. (Nota: MLS-MPM ha già `dynamic_viscosity`; XSPH è l'analogo position-based.)
5. **Diffuse/foam particles (Eq.28) + free-surface normal (Eq.30)** — il **secondo strato** del design (`pelle = schiuma ciano-bianca`): particelle marker advette dalla velocità, spawnate dove `|n_i|` è alto, rese come sprite. Economiche (non simulate).
6. **Particle sleeping** — uccide il jitter della "A" da ferma.

### D.3 PBF come possibile rimpiazzo di MLS-MPM
Per un hero serve acqua incomprimibile credibile + splash + coesione, **non** la generalità elastoplastica di MPM. **PBF è grid-free e più leggero** (niente i due scatter P2G di MPM) e notoriamente economico/stabile in WebGL/WebGPU. Pipeline target: `predict → hash-grid neighbors → 2–4 Jacobi density-projection → velocity (vorticity + XSPH)`, con la "A" come **SDF collision + restoring potential**. Se MLS-MPM pesa su mobile, **PBF è il drop-in real-time più probabile**. (Decisione aperta: tenere MPM se il look già convince.)

### D.4 Budget / scaling (dai paper, GTX680 2013-14, 16ms)
- PBF: 128k particelle, 2 sub-steps, 3 iter density = ~4.2ms/step. Breakdown: neighbor finding ~28%, constraint solve ~40%.
- Unified: 50–100k particelle, 2–3 sub-steps, 2–12 iter @ 16ms.
- **Manopola di qualità = numero di iterazioni** (e particelle). Degrado mobile (regola `CLAUDE.md`): **prima** scala la densità della pelle/schiuma e le iterazioni, poi le particelle del corpo.

---

## Parte D-bis — Piano di implementazione dello SPLASH (feature "schizza fuori e rientra")

> Obiettivo: la "A" è **piena d'acqua** a riposo; un passaggio veloce del mouse **sbalza l'acqua fuori** dalla lettera (più veloce = più lontano, nello spazio del box grande); poi l'acqua **rientra a comporre la "A"** (risacca). Senza guscio cavo, senza balloon, senza muro che blocca.

### Perché gli approcci a "muro/forza" hanno fallito (lezione dai tentativi + paper)
- **Muro a molla** (forza ∝ distanza fuori): più una particella esce, più viene tirata indietro → **oscilla, non vola** → niente splash.
- **Muro morbido / nessun muro**: la pressione incomprimibile (troppe particelle per il volume) **gonfia** la "A" (balloon).
- **Inflate dal centro del tubo**: su uno scheletro 1D spinge tutto sulla parete → **guscio cavo**.
- **Proiezione di posizione (PBD) + inflate**: stessa cosa, particelle accumulate sul bordo.
- Radice comune: stiamo definendo la forma con la **primitiva sbagliata** (parete del tubo + forze). I paper indicano la primitiva giusta: **un vincolo verso una posa di riposo** (shape constraint), non un muro.

### Approccio corretto (PBD attachment / Unified shape matching): HOME-POSITION SHAPE CONSTRAINT
1. **Home positions che RIEMPIONO la "A"** — campiona la regione piena della lettera (i 3 tratti spessi × slab Z) in N posizioni "home", una per particella. La forma piena è garantita **per costruzione** (le home riempiono il volume) → niente cavo, niente balloon.
2. **Vincolo di richiamo MORBIDO** (PBD attachment, Unified §C.2 shape matching) — ogni frame una spinta gentile verso la home: `v += (home_i - pos_i) * k_restore`, con `k_restore` **basso**. A riposo le particelle stanno sulle home → "A" piena; l'MLS-MPM dà il moto d'acqua.
3. **Mouse poke = impulso** (già in `updateGrid.wgsl`) — un flick veloce dà velocità ≫ del richiamo → le particelle **volano fuori** nel box grande (lo splash), proporzionale alla velocità del mouse (già velocity-driven via `forceDir = mouseVel`).
4. **Rientro (risacca)** — finito l'impulso, il richiamo morbido + drag riportano le particelle alle home → la "A" si ricompone. `k_restore` regola **quanto lento/elegante** è il rientro.
5. **Niente muro, niente inflate, niente proiezione-sul-bordo** → niente cavo, balloon o blocco. La forma vive nelle **home**; il richiamo è gentile (vinto dal poke, si riafferma piano).

### Passi concreti
1. `mls-mpm.ts`: aggiungi uno storage buffer `home: array<vec3f>` (una home per particella) + il suo binding nel bind group di `g2p` (e nel pass di spawn/init).
2. **Sampler** (init, CPU o compute): riempi `home` campionando uniformemente la regione piena della "A" (3 capsule-tratti di mezza-larghezza `halfW` × slab `[zc±zh]`). Distribuzione uniforme nel volume → fill solido.
3. **Spawn**: semina le particelle **sulle proprie home** (invece del getto) → "A" piena istantanea, niente flusso di riempimento.
4. `g2p.wgsl`: **sostituisci il muro fermo** con il richiamo morbido `v += (home_i - pos_i) * k_restore` (mantieni le pareti del box come limite ultimo dello splash). Taratura: `k_restore` ~ 0.5–3 (alto = rientro rapido/snappy, basso = acqua lenta che si riassembla pigra).
5. `updateGrid.wgsl`: tieni l'impulso del mouse; tara la forza (`0.3`) e il raggio (`9`) così un flick veloce **supera** `k_restore` (esce) ma uno lento no.
6. **Polish (paper, fase 2)**: `s_corr` (coesione → bordi tondi + goccioline nello spray), **vorticity confinement** (corona dello splash più alta/viva), **diffuse/foam particles** (2° strato schiuma: marker advette dalla velocità, spawnate dove la normale di superficie è alta, rese come sprite in dissolvenza), **sleeping** (niente jitter della "A" ferma).

### Rischi / note
- È, in sostanza, reintrodurre le **home positions** (il vecchio spring-to-glyph) ma come **vincolo PBD morbido dentro il fluido MLS-MPM**, reso via SSF (billboard imposters) → **acqua**, non "palline" (il problema "palline" di prima era il rendering a icosaedri, ora risolto).
- Plumbing moderato in `mls-mpm.ts` (vendored, `@ts-nocheck`): un nuovo buffer + bind group entry in `g2p`/spawn.
- Taratura chiave: `k_restore` (rientro) vs forza del poke (uscita). Due manopole, un compromesso.

---

## Parte E — Note di implementazione su WebGPU (la nostra pipeline)

- **Jacobi, non Gauss-Seidel**: su GPU i constraint si risolvono in parallelo (accumula correzioni dalle stesse posizioni, applica insieme). Aggiungi **constraint averaging** (`/n_i`) + **SOR** `omega ∈ [1,2]` (Unified Eq.13) per stabilità+velocità; Jacobi puro **diverge** su constraint ridondanti.
- **Neighbor finding**: uniform **spatial hash-grid** (Green 2008, "CUDA Particles"). Una volta per step sulle posizioni predette; riordina i dati per cella per coerenza di memoria. Richiede **un raggio particella fisso** per scena.
- **Iterazioni fisse** (2–4), non a soglia di errore → costo prevedibile (60fps).
- **Due `epsilon`** (CFM vs vorticity): nomi separati nel codice.
- **Spiky gradient** per le forze/correzioni (non Poly6 → evita clustering); Poly6 per la densità.
- **Collisione = SDF in volume texture** (anche per confinare alla "A"): query per-particella, GPU-friendly, dentro il loop dei constraint.
- **Solo posizioni correnti** ogni iterazione (mai pressione accumulata).
- **Stabilità**: pre-stabilization (1–2 iter) contro il pop iniziale; clamp **unilaterale** sulla density (il fluido solo spinge via); guard `epsilon` quando `|grad C|^2 → 0`.
- **Rendering**: lo screen-space fluid che già usiamo (`render/depthMap → bilateral → thickness → fluid.wgsl`) è la stessa famiglia (SSF di PBF 2013). Lo splatting a ellissoidi anisotropi (Yu & Turk 2013) è l'upgrade qualità.

---

## Parte F — Glossario rapido
- **PBD** — Position Based Dynamics: simulare proiettando posizioni su constraint.
- **PBF** — Position Based Fluids: SPH incomprimibile dentro PBD.
- **MLS-MPM** — Moving Least Squares Material Point Method: solver *grid-based* (quello attuale di WaterBall). **Diverso** da PBD/PBF (grid-free).
- **constraint projection** — spostare i punti per soddisfare `C=0`/`C>=0`.
- **lambda** — moltiplicatore (alla Lagrange) per scalare la correzione di un constraint.
- **`s_corr`** — artificial pressure: termine repulsivo anti-clumping che dà tensione superficiale.
- **CFM** — Constraint Force Mixing: `+epsilon` al denominatore di `lambda` (regolarizzazione).
- **vorticity confinement** — rimette energia rotazionale persa al damping.
- **XSPH** — smoothing della velocità verso la media del vicinato (coesione).
- **shape matching** — proiezione verso una posa di riposo `Q r_i + c` (rigidi/soft).
- **SOR** — Successive Over-Relaxation: `omega ∈ [1,2]` per accelerare Jacobi.
- **diffuse particles** — spray/schiuma advette, non simulate.
- **SDF** — Signed Distance Field: collisione/confinamento per-particella.

## Riferimenti (file in `docs/`)
- `posBasedDyn.pdf` — Müller et al., *Position Based Dynamics*, 2006/2007.
- `pbf_sig_preprint.pdf` — Macklin & Müller, *Position Based Fluids*, SIGGRAPH 2013.
- `uppfrta_preprint.pdf` — Macklin et al., *A Unified Particle Physics for Real-Time Applications*, SIGGRAPH 2014.
- Codice correlato: `src/webgl/waterball/mls-mpm/*.wgsl` (solver MLS-MPM), `g2p.wgsl` (confinamento "A" = PBD position projection), `render/*.wgsl` (screen-space fluid). Vedi anche `docs/04-3D-HERO-WATER-LOGO.md`.

# IMPLEMENTATION PLAN — Portfolio Alberto Tuveri → Awwwards SOTD

> **Scopo.** Piano operativo per portare il portfolio a livello **"Site of the Day"** — un sito
> che fa svenire i creative designer. Pensato per essere **eseguito da un'altra sessione** in
> autonomia. La prosa delle direttive è in italiano; codice/identificatori/token/copy in inglese.
>
> **Regola d'oro non negoziabile (la lezione di questa sessione):** *MAI dichiarare un effetto
> "fatto" senza PROVA VISIVA.* Ogni task si chiude solo dopo aver **avviato il sito** (`bun dev`)
> e **guardato il risultato con `claude-in-chrome`** (screenshot desktop **e** mobile + console
> pulita). Costruire alla cieca = ciò che ha prodotto gli obbrobri. Non rifarlo.

---

## 0. Quality bar & nord

- **Riferimento assoluto:** `lusion.co`, Awwwards SOTD, e l'art-direction system di
  `https://getdesign.md/bmw-m/design-md` (bold, cinematografico, materico).
- **Estetica:** Cinematic Ocean / NatGeo — discesa dal tramonto di Pan di Zucchero all'abisso.
  Maximalista ma **intenzionale**: ogni animazione ingegnerizzata, niente gimmick.
- **Mood richiesto dal committente:** ULTRA-animato, alto livello, creativo — **non** minimale.
- **Taglio:** poche feature MEDIOCRI = fallimento. Pochi momenti **ECCEZIONALI** + micro-polish
  ovunque = vittoria.

---

## 1. Stato attuale (cosa tenere, cosa sostituire)

Branch: `feat/hero-scroll-narrative`. Stack: Next 16 (App Router, Turbopack) · React 19 · TS strict ·
Tailwind v4 (`@theme` in `src/app/globals.css`) · bun · GSAP + Lenis · three · zustand · leva (dev).

**TENERE (già forte, verificato a schermo):**
- Hero cinematica: scrub frame WebP di Pan di Zucchero → caption "Masua" → reveal del nome liquido
  **"ALBERTO TUVERI"** (Fraunces, glint celeste). È il momento più forte.
- Tipografia editoriale (Fraunces variable opsz/WONK + Hanken), focus-cards progetti, depth-gauge.
- CTA magnetiche (`src/components/ui/button.tsx`), cursore bioluminescente, fix del bleed
  (`CanvasHost` sfuma i canvas fissi quando l'hero esce).

**SOSTITUIRE / ELEVARE (il committente lo chiede esplicitamente):**
- **Tech stack** (`src/components/sections/skills.tsx`): ora è un bento di card statiche — un
  ripiego. Va reso **un vero 3D icon cloud WebGL** con i loghi reali (vedi WP-4). Questa è la
  priorità #1 dichiarata.
- Le sezioni below-fold mancano di **parallax multi-layer, camera scroll-driven, transizioni
  WebGL** — vanno aggiunte (WP-3, WP-6, WP-8).
- Componenti già costruiti ma smontati (riusabili come base, da rifinire o sostituire):
  `tech-cloud.tsx`, `skiper-current-thread.tsx`, `scroll-text.tsx`, `flip-fade-text.tsx`,
  `pressure-heading.tsx`, `skills-constellation.tsx`, `refract-card.tsx`, `bioluminescent-skills.tsx`,
  `caustics-layer.tsx`, `water-cursor.tsx`, `depth-gauge.tsx`, `descending-world.tsx`.

**GATE umano (NON toccare senza ok di Alberto):**
- **Hero FLUID** (`src/webgl/waterball/**`, MLS-MPM, params leva): physics/feel hand-tuned (G4).
  La *resa* (shading/edge/foam) può essere migliorata SOLO se Alberto sblocca esplicitamente.
- Merge su `main` / deploy produzione (G3). Generazione asset a pagamento (Higgsfield/Blender, G5).

---

## 2. Guardrail trasversali (valgono per OGNI task)

1. **Prova visiva obbligatoria** via `claude-in-chrome` (skill `claude-in-chrome` + `ui-visual-validator`).
   Avvia `bun dev`, naviga, screenshot **desktop (1440) + mobile (390)**, leggi la console
   (`read_console_messages`, zero errori/warning). Niente screenshot = niente "done".
2. **Context7 prima del codice** su lib versionate (skill `context7-mcp`): GSAP 3.15, three 0.184,
   Lenis 1.3, Next 16, Tailwind v4. Le API cambiano — non andare a memoria.
3. **Build verde**: `bash .claude/skills/docs-driven-build/verifier.sh` (typecheck + `next build`)
   deve passare prima di ogni commit. Visual gate: `node .claude/skills/docs-driven-build/verify-visual.mjs`.
4. **Bilingue EN/IT**: ogni copy visibile da `src/data/translations/{en,it}.ts` (+ `types.ts`). Mai hardcodare.
5. **@theme tokens** (`globals.css`): abyss `#07222e`, deep `#0b2c3a`, foam `#f4fafb`, mist,
   celeste `#9bd3ee`, celeste-soft `#c7e6f4`. Niente colori ad-hoc.
6. **Performance budget (non negoziabile)**: 60fps desktop, degrado mobile, **Lighthouse mobile ≥ 80**.
   Animare SOLO `transform`/`opacity`; `IntersectionObserver` per gate rAF; pausa offscreen;
   un solo ticker (Lenis↔GSAP già condiviso). Skill: `fixing-motion-performance`,
   `web-performance-optimization`.
7. **A11y AA**: decorativo `aria-hidden`, focus-visible, contrasto ≥4.5:1, `prefers-reduced-motion`
   = versione statica legibile per OGNI effetto. Skill: `accessibility-compliance-accessibility-audit`,
   `wcag-audit-patterns`.
8. **Commit piccoli e atomici** su feature branch; un WP per branch (es. `feat/wp4-icon-cloud`).
9. **Niente regressioni**: prima di sostituire qualcosa di "tenuto" (sez. 1), screenshot before/after.

---

## 3. Metodo di lavoro (loop per OGNI work package)

```
① Context7 (API lib) + leggi il codice sorgente dalla libreria target (WebFetch)
② Costruisci/adatta al mood ocean, usando le skill assegnate al task
③ bun dev → claude-in-chrome: screenshot desktop+mobile, console pulita
④ Giudica con gusto (skill high-end-visual-design / ui-visual-validator):
   è SOTD-level? se no → torna a ②. Se sì →
⑤ verifier.sh verde → commit atomico → prossimo WP
```

Per fan-out parallelo su file disgiunti: skill `dispatching-parallel-agents` /
`subagent-driven-development` — MA ogni sub-agente DEVE comunque passare il gate visivo (il fallimento
di questa sessione è stato delegare senza verifica visiva).

---

## 4. Librerie sorgente → cosa prendere (link del committente)

| Libreria | URL | Cosa prendere |
|---|---|---|
| **GSAP** | https://gsap.com/ | ScrollTrigger (pin/scrub), ScrollSmoother, **Observer**, **Flip**, **SplitText**, **MotionPath**, CustomEase — il motore di tutto |
| **Codrops / Tympanus** | https://tympanus.net/codrops/hub/ · https://tympanus.net/ | tecniche WebGL (caustics, particle fields, displacement/refraction su immagini, transizioni a tendina), scroll-driven camera |
| **Magic UI** | https://magicui.design/docs/components/icon-cloud · https://magicui.design/ | **Icon Cloud** (sfera 3D di loghi, cobe-style) → tech stack; marquee, border-beam, particles, text-reveal |
| **Aceternity UI** | https://ui.aceternity.com/components/focus-cards | Focus Cards (focus uno/sfoca gli altri) → progetti |
| **ui-layouts** | https://www.ui-layouts.com/components/scroll-text | Scroll Text (reveal parola-per-parola scrubbato) |
| **Skiper UI** | https://skiper-ui.com/v1/skiper19 | Skiper19 = SVG-follow-scroll (path che si disegna allo scroll) |
| **vengenceUI** | https://www.vengenceui.com/components/flip-fade-text | Flip Fade Text (flip per-carattere) |
| **Uiverse** | https://uiverse.io/elements | bottoni/cursori/micro-elementi (cherry-pick raffinati) |
| **anim master lib** | https://animmasterlib.dev/scroll | ricette scroll-animation pronte |
| **Dribbble** | https://dribbble.com/ | moodboard / direzione (studiare, non copiare) |

> Estrarre il codice via `WebFetch` (le doc-pages Magic UI/Aceternity espongono il sorgente anche
> via registry JSON: `https://magicui.design/r/icon-cloud.json`, `https://ui.aceternity.com/registry/<name>.json`).
> Lo stack qui è **GSAP+Lenis (non Framer Motion)** e **three (non R3F montato)**: riscrivere le
> tecniche con GSAP/three, non importare Framer Motion.

---

## 5. WORK PACKAGES

Ordine consigliato in §7. Ognuno: **Goal · Wow · Source · Skills · Files · Approccio · Acceptance**.

### WP-1 — Art-direction system & color-grade della discesa
- **Goal:** un'unica direzione cromatica coerente che "raffredda" scendendo (golden-hour → abisso),
  con UN accento caldo (ambra) come gioiello raro + il celeste come freddo profondo.
- **Wow:** la pagina *sembra* un'immersione continua, non sezioni stitchate.
- **Source:** getdesign.md/bmw-m (sistema bold), Dribbble (moodboard).
- **Skills:** `high-end-visual-design`, `design-taste-frontend`, `ui-tokens`, `tailwind-design-system`.
- **Files:** `globals.css` (@theme: aggiungi `--color-ember`), `descending-world.tsx`, `page.tsx`.
- **Approccio:** definisci scala di profondità (5 stop) come custom-prop scroll-driven; applica a
  background + accenti; documenta la regola "due accenti max".
- **Acceptance:** screenshot ai 5 stop di scroll mostrano una transizione cromatica continua; testo AA ovunque.

### WP-2 — Preloader cinematografico ("the dive begins")
- **Goal:** intro brandizzata (≤1.2s) che monta mentre WebGPU/assets caricano: contatore profondità
  0→ + mark "A" che si forma, poi tendina che si apre sull'hero.
- **Wow:** primo frame da agenzia, non flash bianco.
- **Source:** Codrops (preloader/curtain reveals), GSAP (timeline).
- **Skills:** `high-end-visual-design`, `animejs-animation`, `scroll-experience`, `react-best-practices`.
- **Files:** `src/components/preloader.tsx` (NEW), mount in `layout.tsx`; gate su `document.fonts.ready` + first frame.
- **Acceptance:** nessun FOUC; preloader esce in <1.2s su connessione normale; reduced-motion = fade semplice.

### WP-3 — GSAP scroll choreography + parallax multi-layer (il telaio)
- **Goal:** trasformare lo scroll in una regia: sezioni con **pin + scrub**, reveal mascherati,
  **parallax a più profondità** (heading, media, decor si muovono a velocità diverse), un momento
  **horizontal-scroll** (es. galleria progetti), velocity-reactive.
- **Wow:** lo scroll *è* l'esperienza, pesante e cinematografico (Lenis già tarato).
- **Source:** gsap.com (ScrollTrigger pin/scrub/snap, Observer, MotionPath), animmasterlib/scroll, Codrops.
- **Skills:** `scroll-experience`, `animejs-animation`, `fixing-motion-performance`, `nextjs-app-router-patterns`.
- **Files:** estendi `scroll-provider.tsx`; nuovo helper `src/lib/scroll-choreo.ts`; ogni sezione.
- **Approccio:** un solo `gsap.ticker`↔Lenis (già c'è); ScrollTrigger per pin/scrub; parallax via
  `useScrollParallax` potenziato (più layer, clamp). Niente `scroll` listener grezzi.
- **Acceptance:** 60fps in scroll (DevTools perf), nessun jank; mobile degrada (meno layer); reduced-motion statico.

### WP-4 — TECH STACK come vero 3D Icon Cloud WebGL  ⭐ (priorità #1 del committente)
- **Goal:** sostituire il bento con una **sfera 3D di LOGHI tech reali** (simple-icons), auto-rotante,
  **draggable**, con depth-fog + glow celeste, che reagisce al cursore; click su un nodo lo porta in
  fronte (flick-to-face). Deve essere **FANTASTICO**, non text-chips.
- **Wow:** l'oggetto-firma della sezione, vivo e tridimensionale.
- **Source:** Magic UI **Icon Cloud** (`https://magicui.design/r/icon-cloud.json`) — tecnica
  Fibonacci-sphere + matrice di rotazione; per i loghi usa `simple-icons` (bundle, no CDN runtime).
  Valuta `cobe` o three.js per resa premium.
- **Skills:** `threejs-skills`, `3d-web-experience`, `threejs-interaction`, `magic-ui-generator`,
  `react-component-performance`, `context7-mcp` (three 0.184).
- **Files:** riscrivi `src/components/tech-cloud.tsx`; monta in `skills.tsx`; eventualmente
  `src/data/skills.ts` → aggiungi slug `simple-icons` per ogni voce.
- **Approccio:** three.js points/sprites o DOM-3D ad alta densità; loghi come texture (white→celeste
  tint); rotazione inerziale; raycast hover. Fallback reduced-motion/no-WebGL: griglia statica elegante.
- **Acceptance:** screenshot mostra una sfera di loghi leggibile e bella (NON chip sovrapposte); drag
  fluido 60fps; mobile = sfera più piccola o griglia; console pulita.

### WP-5 — Progetti: galleria cinematografica
- **Goal:** elevare i focus-cards a momento da awards: **3D tilt + refraction "water glass"** sul
  pointer, **hover che porta in focus e sfoca/raffredda gli altri** (depth-of-field), opzionale
  **pin + horizontal scroll** della fila progetti.
- **Source:** Aceternity Focus Cards (`/registry/focus-cards.json`), Codrops (image refraction/displacement),
  GSAP (ScrollTrigger horizontal, Flip per espansione card).
- **Skills:** `threejs-interaction`, `react-ui-patterns`, `high-end-visual-design`, `scroll-experience`.
- **Files:** `src/components/focus-cards.tsx` (esiste, rifinire), `refract-card.tsx` (riusare il tilt),
  `work.tsx`.
- **Acceptance:** hover tattile e fluido; SerSan provvisori come teaser elegante (non card vuote);
  keyboard-accessibile; before/after screenshot vs stato attuale.

### WP-6 — Hero: camera scroll-driven + profondità WebGL
- **Goal:** dare all'hero una **regia di camera** durante lo scroll: push-in/parallax sui layer della
  cinematica (cielo/mare/scoglio), DOF, leggero color-grade, e il climax "dive". (Il fluido resta G4;
  qui si lavora su camera/compositing/overlay attorno, non sui param del solver.)
- **Source:** Codrops (scroll camera, DOF), GSAP ScrollTrigger scrub, three postprocessing.
- **Skills:** `threejs-postprocessing`, `threejs-shaders`, `scroll-experience`, `fixing-motion-performance`.
- **Files:** `hero.tsx`, `video-backdrop.tsx`; eventuale layer WebGL overlay nuovo.
- **GATE:** se serve toccare la resa del fluido (`waterball/**`) → **chiedere ok ad Alberto (G4)**.
- **Acceptance:** la discesa nell'hero ha senso di camera/profondità; 60fps; screenshot del climax.

### WP-7 — Reveal di testo premium (scroll-text + flip-fade fatti BENE)
- **Goal:** reveal testuali da agenzia: **mask-reveal parola/riga scrubbato** sullo scroll
  (GSAP SplitText + ScrollTrigger), un flip raffinato per gli eyebrow. NIENTE jitter per-carattere
  cheap (l'errore precedente).
- **Source:** ui-layouts Scroll Text, vengenceUI Flip Fade, GSAP SplitText.
- **Skills:** `animejs-animation`, `scroll-experience`, `high-end-visual-design`.
- **Files:** rifinire `scroll-text.tsx`, `flip-fade-text.tsx` (già SSR-safe), `pressure-heading.tsx`;
  applicare a intro/section headings con gusto (uno per sezione, non ovunque).
- **Acceptance:** reveal fluidi e raffinati a schermo; SSR senza hydration mismatch; reduced-motion statico.

### WP-8 — Transizioni di sezione & ambient WebGL
- **Goal:** transizioni tra sezioni (tendina/displacement WebGL o GSAP mask) + un **layer ambient**
  raffinato (caustics/bioluminescenza/particelle) che vive sotto il contenuto, scroll-depth-linked,
  MAI sopra il testo, MAI sotto contrasto AA.
- **Source:** Codrops/Tympanus (caustics, transitions), `caustics-layer.tsx` (esiste, rifinire).
- **Skills:** `threejs-shaders`, `shader-programming-glsl`, `threejs-postprocessing`, `fixing-motion-performance`.
- **Files:** `caustics-layer.tsx`, `descending-world.tsx`, nuovo `section-transition.tsx`.
- **Acceptance:** ambient sottile e bello, 60fps, pausa offscreen, contrasto invariato.

### WP-9 — Identità d'interazione: cursore + magnetismo + micro-detail
- **Goal:** cursore custom raffinato (oltre il glow attuale), magnetismo su CTA/monogram (già base),
  hover card "lift", nav "fluid island" (pill staccata) con hamburger morph, double-bezel ovunque,
  eyebrow-tag a pillola, eases custom.
- **Source:** Uiverse (elementi), Codrops (cursor), il manuale `high-end-visual-design`.
- **Skills:** `high-end-visual-design`, `frontend-design`, `react-ui-patterns`, `radix-ui-design-system`.
- **Files:** `water-cursor.tsx` (rifinire), `site-nav.tsx`, `button.tsx` (esteso), `ui/*`.
- **Acceptance:** ogni elemento interattivo "risponde alla mano"; coerente; pointer:fine only; touch ok.

### WP-10 — Performance & A11y hardening (con tutti gli effetti accesi)
- **Goal:** mantenere 60fps + Lighthouse mobile ≥80 + WCAG AA NONOSTANTE WebGL/parallax/particelle.
  Tier-scaling (mobile riduce particellari/DPR/postprocessing), lazy-mount delle scene pesanti,
  frame WebP responsive (tier mobile 960px già esiste), cubemap → compressione, no leva in prod.
- **Source:** —
- **Skills:** `web-performance-optimization`, `fixing-motion-performance`,
  `accessibility-compliance-accessibility-audit`, `wcag-audit-patterns`, `ui-visual-validator`.
- **Files:** trasversale; `next.config.ts` (cache headers), `CanvasHost`, ogni layer WebGL.
- **Acceptance:** Lighthouse mobile ≥80 (report allegato), trace 60fps, axe 0 violazioni critiche,
  reduced-motion completo.

### WP-11 — QA finale & consegna
- **Goal:** pass visivo completo desktop+mobile, console pulita su tutte le sezioni, EN/IT, fallback
  WebGPU-assente, poi preview Vercel.
- **Skills:** `verification-before-completion`, `ui-review`, `ui-visual-validator`, `vercel-deployment`.
- **GATE:** deploy produzione / merge `main` = **G3 (ok Alberto)**.

---

## 6. Skill routing — task → skill (riassunto)

| Ambito | Skill da usare |
|---|---|
| Gusto / art-direction / "$150k look" | `high-end-visual-design`, `design-taste-frontend`, `frontend-design`, `gpt-taste` |
| Scroll / GSAP / parallax / camera | `scroll-experience`, `animejs-animation`, `fixing-motion-performance`, `magic-animator` |
| WebGL / shader / three / postprocessing | `threejs-shaders`, `shader-programming-glsl`, `threejs-postprocessing`, `threejs-skills`, `3d-web-experience`, `threejs-interaction`, `threejs-materials`, `threejs-lighting` |
| Componenti UI / magic-ui / pattern | `magic-ui-generator`, `react-ui-patterns`, `radix-ui-design-system`, `tailwind-design-system`, `ui-tokens` |
| Next/React/TS qualità & perf | `nextjs-app-router-patterns`, `react-best-practices`, `react-component-performance`, `typescript-pro`, `zustand-store-ts` |
| Performance / A11y | `web-performance-optimization`, `fixing-motion-performance`, `accessibility-compliance-accessibility-audit`, `wcag-audit-patterns` |
| **Verifica VISIVA (obbligatoria)** | `claude-in-chrome`, `ui-visual-validator`, `ui-review`, `verification-before-completion` |
| Docs API lib versionate | `context7-mcp`, `context7-auto-research` |
| Orchestrazione / piano | `writing-plans`, `planning-with-files`, `subagent-driven-development`, `dispatching-parallel-agents` |
| Deploy | `vercel-deployment` |

---

## 7. Sequenza consigliata

1. **WP-1** (art-direction system) — base cromatica su cui poggia tutto.
2. **WP-3** (GSAP choreography + parallax) — il telaio di movimento.
3. **WP-4** (3D Icon Cloud) ⭐ — sblocca subito il "fantastico" sulla sezione più debole.
4. **WP-5** (galleria progetti) + **WP-7** (text reveal) — in parallelo (file disgiunti).
5. **WP-9** (cursore/micro-interazioni) + **WP-8** (ambient/transizioni) — in parallelo.
6. **WP-6** (hero camera) — dopo aver eventualmente sbloccato G4.
7. **WP-2** (preloader) — penultimo, quando il sito è ricco.
8. **WP-10** (perf/a11y) + **WP-11** (QA finale) — chiusura.

Ogni step: loop §3 con prova visiva. Un branch per WP, commit atomici, build verde.

---

## 8. Definition of Done (globale)

- [ ] Ogni WP verificato a schermo (screenshot desktop+mobile + console pulita) — allegare le prove.
- [ ] 60fps desktop · degrado mobile · **Lighthouse mobile ≥ 80** · WCAG AA · reduced-motion completo.
- [ ] Bilingue EN/IT, nessun copy hardcodato, nessun asset orfano/inutile spedito.
- [ ] Hero fluid (G4) intatto salvo ok esplicito di Alberto; nessun deploy prod senza G3.
- [ ] Il sito, scrollato da cima a fondo, fa dire "come diavolo è stato fatto" — non "template carino".

---

### Appendice — comandi utili
```bash
bun dev                                                   # http://localhost:3000 (Chrome per WebGPU)
bash .claude/skills/docs-driven-build/verifier.sh         # typecheck + next build (gate commit)
node .claude/skills/docs-driven-build/verify-visual.mjs   # Playwright: console-clean + screenshot
bun scripts/gen-mobile-frames.mjs                         # rigenera il tier mobile 960px dei frame
```

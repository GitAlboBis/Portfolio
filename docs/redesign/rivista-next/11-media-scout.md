# 11 · Media scout: real pictures for the seven works without a photograph

> **Status:** scouting report, 2026-10-09, branch `feat/water-hero`. Read-only: no server started, nothing installed, nothing rendered into the repo, nothing committed. The only files written are this report and throwaway previews in the session scratchpad (`…/scratchpad/media-scout/`), which are not deliverables.
> **Question:** seven of the nine works print "No photograph on file" (`rv/parts/c-main.index.html:41-111`): `sphere-ai`, `maintech-oma`, `domus-tua`, `sersan-brand`, `badante24h`, `doit-voice-ai-agent`, `agricultural-supply-chain`. Which **real** media exists on this machine or at a public URL?
> **Rules applied:** real media only (product screens, real renders, real film frames, real UI from a real build); no stock, no generated stills. Only files that belong to these works were opened. Probes stay headless (`scripts/probes/water/lib.mjs` `launch()` or `chromium.launch({ headless: true })`). The two existing captures (`public/captures/{sersan-io,spherenode}-*`) set the format: **1600×1000 + 800×500 WebP (16:10), q≈82, 200 KB cap, EXIF IFD0 provenance + `.webp.json` sidecar + a row in `public/captures/PROVENANCE.md`.**
> **Effect on `20-cases-spec.md` D-C4:** D-C4 builds a typographic plate for all seven works because `PRODUCT.md` §5 (P:58) says no stills of the SerSan works exist. That premise is now out of date. Real media exists for **sphere-ai**, **domus-tua** and **sersan-brand** (strong), and for **badante24h** (weak). The "capture" kind of `20-cases-spec.md:71-77` applies to them. **maintech-oma** and **doit-voice-ai-agent** keep the typographic plate. **agricultural-supply-chain** keeps it too, unless the director accepts a redraw of the team's real UML (§7).

---

## 0. Verdicts at a glance

| # | Work | Verdict | Best candidate | How to make the plate | Public already? |
|---|---|---|---|---|---|
| 02 | Sphere AI | **Real media found (strong)** | `C:\Users\alber\spherenode-promo\public\screens\mentor-chat-en.png` (3840×2160, live product, 3 Sep 2026) | crop the chat pane (drop the header with a staff email and the conversation list), downscale | Product is public. This screen sits behind the login, but it was captured for SerSan's own promo film |
| 03 | Maintech OMA | **Nothing real** | none (no screenshots anywhere; the app is all behind a login, and a local run needs Docker, which is not installed) | keep the typographic plate | No: client's internal ERP, private repo |
| 05 | Domus Tua | **Real media found (strong)** | fresh capture of the public client preview `https://domus-tua-ten.vercel.app` (v3, 1 Oct 2026). Fallback: the still sersan.io already publishes, `C:\Users\alber\Desktop\sersan-v2-main\public\case-studies\domus-tua-preview.webp` (1600×940) | `scripts/capture-sites.mjs` with one new site entry; decline the cookies with "Solo necessari" | Yes: sersan.io lists it as a case study with this still. The client domain `domustua.com` still runs the old WordPress site |
| 06 | SerSan brand & film | **Real media found (strong)** | lossless 4K frames of the film: `C:\Users\alber\Documents\SERSAN-AE\renders\tiff8_v2\00900.tif` ("Selected work", 3D glass cards) and `01560.tif` (identity end card) | crop to 16:10 from the TIFF, downscale. No render needed | Not yet: the NDA question in `PRODUCT.md` §8.4 is still open |
| 07 | Badante24h | **Weak option** | public landing `https://badante24h.vercel.app` (the repo's own homepage field) | capture the landing hero only | Yes: indexed (`robots: index, follow`). But the data layer is down: `/esplora` prints "Non riusciamo a caricare i profili" |
| 08 | Voice AI Agent | **Nothing real** | none (the client needs DOIT's Azure AD tenant; no screenshots exist) | keep the typographic plate | Web-client repo is public; the agent itself is client-internal |
| 09 | Supply Chain | **Real artefact, needs a redraw** (weak option: GitHub page capture) | the team's Visual Paradigm model, `IDS_project.vpp` (8 class diagrams, 38 sequence diagrams) | redraw one class diagram to SVG from the model's own geometry, or keep the typographic plate | Yes: public repo `github.com/daveeCity/IDS_GROUP_PROJECT` |

---

## 1. Sphere AI (`sphere-ai`)

**Candidates**

| Path | What it shows | Quality |
|---|---|---|
| `C:\Users\alber\spherenode-promo\public\screens\mentor-chat-en.png` | **The pick.** The live Sphere AI mentor answering "How should I manage risk on XAUUSD after a 17% drawdown?". The answer opens "I didn't find specific Spherenode material on this point — what follows is general trading knowledge" (the guardrail at work), carries numbered inline citations [1]…[6], a "Based on Spherenode sources" chip and source cards (Lesson / Live Session with timecodes), and ends on the "Educational only — not financial advice" disclaimer. | 3840×2160 PNG (1920×1080 @2x), sharp. Dark product UI with a green accent, very professional. One problem: the header shows a SerSan staff email (`alex.s@sersan.dev`), and the left column lists past conversation titles. Both must be cropped out. |
| `…\public\screens\mentor-en.png` | Same thread, answer in Italian, with suggested follow-ups visible | 3840×2160; mixed language, so second choice |
| `…\public\screens\mentor-typing-en.png`, `mentor-chat.png`, `mentor-typing.png`, `mentor.png` | Typing state and IT variants | 3840×2160 |
| `C:\Users\alber\spherenode-promo\out\spherenode-promo-en.mp4` (scene S07, preview `out\qa\rev\S07-SphereAI-f36.png`) | SerSan's Remotion promo: the same mentor page in a glass browser frame on near-black, the question typing in | 1920×1080, 48 s. Good for motion, but too small for a 1600 plate and heavily art-directed |

Provenance of the captures: `scripts\capture.mjs` in that repo (Remotion promo, commit `60169ac` by GitAlboBis, 2026-09-03) opened `https://www.spherenode.com/mentor` after a human signed in, then captured at 1920×1080 @ DPR 2. The file mtime is 2026-09-03.

**How to make the plate.** Crop with sharp. The 16:10 crop is `extract({ left: 712, top: 180, width: 3064, height: 1915 })`, then resize to 1600×1000 and 800×500. This drops the header (email, avatar, search) and the conversation list, and keeps the question, the cited answer, the sources, the disclaimer and the input box. For 16:9, use the same left and top with `width: 3064, height: 1724`; it ends just under the disclaimer. A preview of the 16:10 crop is in scratch (`media-scout/sphere-ai-1610.jpg`) and reads well. For the 4:5 case crop below 1024 px, set `object-position: 0% 0%` so the answer column stays.

**Provenance line:** `Capture of spherenode.com/mentor (signed-in SerSan staff session) · 3 Sep 2026 · Playwright Chromium 1920x1080 @2x · cropped 16:10, account header and conversation list removed · portfolio of Alberto Tuveri`

**Confidentiality.** The product is public (spherenode.com); the mentor is a paid, logged-in feature. The same screens were captured for SerSan's own promo film, which has no publication record on disk. After the crop no account data is left. The source cards show curriculum titles and an instructor's first name ("DeepDive Strategia Mirco 4"). This is low risk, but if the director prefers zero proprietary titles, crop at `height: 1100` (answer only) and lose the sources. The numbers inside the screenshot (17 %, 0.3–0.5 %, ~20.5 %) are the mentor's answer, not claims about Alberto's work. Alt text and captions must not repeat them as facts.

**Recommendation: real media found.** Use `mentor-chat-en.png` cropped. It is the best visual proof on the site for "grounded, cited, refuses to pretend". The existing `schematic: "rag"` can stay as a second figure.

---

## 2. Maintech OMA (`maintech-oma`)

**What exists**

- The real codebase is `C:\Users\alber\Desktop\PierDiPaola\` (remote `SerSan-AI-Studio/MainTech-PierDiPaola`, private; last local commit 2026-09-08). `src/index.css:7` confirms the **"Diesel & Safety"** tokens: Barlow, Barlow Semi Condensed and JetBrains Mono, "blu diesel" and "arancio segnaletico". The job-order state machine has six real states in `supabase/migrations/0001_extensions_schemas.sql:66-73`: `aperta → diagnosi → acquisto → lavorazione → chiusa_tecnica → fatturata`.
- **No screenshot, recording or render anywhere.** `playwright-report\index.html` has no `data/` attachments, and the config sets `screenshot: 'only-on-failure'`. `docs\*.html` hold only an inline decorative SVG. The design-system source it cites (`maintech-oma-designsystem/_shared/tokens.css`) is not on this machine.
- The only route open without a login is `/login` (`src/App.tsx:141`).
- Running it for real needs the local Supabase stack (Docker), `bun run seed:demo` (synthetic data marked DEMO, "NON provengono dal cliente", `scripts/seed/index.ts:9`) and `npm run dev`. **Docker is not installed** (`C:\Program Files\Docker` is absent and `docker` is not on PATH), so this needs an install and Alberto's OK.
- ⚠ `C:\Users\alber\Maintech-Oma\` is **not** Alberto's work. It is the previous vendor's Lovable MVP (`andreadonadoni/Maintech-Oma`: two commits by `gpt-engineer-app[bot]` plus a staging branch by another developer), which the real repo analyses in `docs/ANALISI_REPO_PRECEDENTE_Maintech_OMA.html`. Never capture it.

**Options, all weak or blocked**

1. Capture of `/login` from the built `dist/`: real, but it is a sign-in form and says nothing. Not recommended.
2. Seeded local build, captured on `/commesse` at 1600×1000. This would be honest real UI, labelled "demo data". Blocked by Docker, and the client's OK is advisable even with synthetic data.
3. If the director wants a figure anyway: a **specimen of the real "Diesel & Safety" tokens**, rendered from the shipped `src/index.css` values (chips plus the three typefaces). It reproduces code, so it is not an illustration. Under D-C4 and Alberto's dislike of 2D stand-ins, I would not do it.

**Provenance line (if option 2 is ever done):** `Capture of a local build of Maintech OMA with synthetic DEMO seed data (scripts/seed demo) · <date> · Playwright Chromium 1600x1000 · not client data · portfolio of Alberto Tuveri`

**Confidentiality.** High: an internal client ERP in a private repo. `docs/` holds client company data (VAT number, PEC, SDI). Nothing from `docs/` may appear on the site.

**Recommendation: nothing real. Keep the typographic plate (D-C4).** If a drawing of the six-phase machine is ever wanted, the real state names above are not in `PRODUCT.md` and must be added there first. Never reuse the old site's "Intake · Diagnosis · Estimate · Work · Test · Release": those were the metaphor of the deleted job-order world, not Maintech's states.

---

## 3. Domus Tua (`domus-tua`)

**Candidates**

| Source | What it shows | Quality |
|---|---|---|
| `https://domus-tua-ten.vercel.app` (public Vercel preview, v3 of 1 Oct 2026; checked with WebFetch and the browser pane today) | Hero: "Domus Tua" in a large serif over a real interior photo, the founder on the left with the script signature "Raffaela Rizza", nav pill, red CTA. A cookie banner offers **"Solo necessari"** | Live site, renders 1600×1000 natively. Polished, magazine-like. **The pick.** |
| `C:\Users\alber\Desktop\sersan-v2-main\public\case-studies\domus-tua-preview.webp` (served by sersan.io on its Domus Tua case study) | The August build's hero (same composition) | 1600×940. Already public. A 16:10 crop is 1504×940, so the 1600 plate would upscale about 6 %; the 800 is fine. **Fallback.** |
| `…\sersan-v2-main\public\case-studies\domus-tua\preloader.mp4` (13.2 s) and `sweep.mp4` (18.6 s), with posters | The session intro (the founder "builds" the wordmark, then the arched portal opens) and a scroll sweep | 1280×720, 25 fps. Good motion evidence, too small for a 1600 still |
| `C:\Users\alber\domus-tua-site\docs\superpowers\handoff\2026-09-22-pellicole\a55-hero-1440.jpg`, `a47-finestra-1440-capitolo.jpg`, `a52-*-1440.jpg` (full pages) | QA frames of the real build from 22 Sep | 1440×900 JPEG, DPR 1. Would need upscaling for 1600, and two builds behind |

Not used: `domus-tua-site\public\images\reali\*` and `public\media\*.mp4` are the client's property photos and footage, not Alberto's work. `C:\Users\alber\Downloads\STORIE DI SUCCESSO … OPEN DOMUS ….mp4` is the agency's own YouTube video.

**How to make the plate.** Add one entry to `SITES` in `scripts/capture-sites.mjs`: `{ name: "domus-tua", url: "https://domus-tua-ten.vercel.app", copyright: "© Domus Tua Immobiliare — design and build SerSan", settle: 10000 }`. "Solo necessari" is already in `DECLINE_TEXTS`. Two cautions:

- The site plays a session intro on first load. Either settle ≥ 10 s, or run that site in a context with `reducedMotion: "reduce"`; the CV says every effect has a reduced-motion version, which lands on the composed hero at once. Check the frame before encoding.
- The script as written re-captures **every** site and rewrites `PROVENANCE.md` from scratch. Add a name filter (`node scripts/capture-sites.mjs domus-tua badante24h`), and have it append rows to `PROVENANCE.md` instead of rewriting it, so the September captures of sersan.io and spherenode are not silently replaced. It already launches headless.

**Provenance line:** `Capture of https://domus-tua-ten.vercel.app (client preview, before the domustua.com launch) · Oct 2026 · Playwright Chrome 1600x1000 · cookies declined ("Solo necessari") · portfolio of Alberto Tuveri`

**Confidentiality.** Client work, not launched on the client's domain: `www.domustua.com` still serves WordPress/Elementor, and the domain cutover is a separate decision (`domus-tua-site/docs/vercel-live-checklist.md:15,152`). But SerSan already publishes it on sersan.io: the case study, this still, and `liveUrl: "https://domus-tua-ten.vercel.app/"` in `sersan-v2-main/src/data/case-studies.ts:274`. A capture is therefore consistent with what is already public. **Keep the link `pending`** as `works.ts:585` says; do not link the preview. The founder appears in her own agency's marketing.

**Recommendation: real media found.** Use a fresh capture of the preview; the sersan.io still is the fallback.

---

## 4. SerSan brand identity & brand film (`sersan-brand`)

**Candidates**

| Path | What it shows | Quality |
|---|---|---|
| `C:\Users\alber\Documents\SERSAN-AE\renders\tiff8_v2\00900.tif` (frame 900 = 30.03 s) | **"Selected work"**: a 3D carousel of glass browser cards. Centre card: the sersan.io particle intro (hex mark + "SERSAN" glowing wordmark); flanking cards: SphereNode and Domus Tua; navy and cyan grade | 3840×2160 lossless TIFF, the source frame of the master. Depth, light and craft; reads "3D / creative lead" at once. **The pick for the rail tile.** |
| `…\tiff8_v2\01560.tif` (52.05 s) | **Identity end card**: hex mark (white + brand blue), SersanDisplay "SERSAN" wordmark, rule, "The intelligence is artificial. / The judgement stays human.", "Send a project brief" pill, "sersan.io" | 3840×2160 lossless. Flat but the cleanest statement of mark, typeface and colour system. **The pick for the case page.** |
| `…\tiff8_v2\00060.tif` (2.0 s) | Intro: mark, "SERSAN STUDIO", sersan.io pill | lossless; small mark in a lot of navy |
| `…\tiff8_v2\01440.tif` (48.05 s) | The 3D bevelled mark mid-reveal, with a sky texture inside the stroke | lossless. The texture comes from the logo-reveal template's material and looks generic. Skip |
| `…\renders\out_v2\SERSAN_4K_H264.mp4` and `SERSAN_4K_voce2.mp4` | The current master: 3840×2160, 29.97 fps, **54.121 s**, H.264 with AAC | Use for motion; for stills, prefer the TIFFs |
| `C:\Users\alber\Desktop\sersan-v2-main\design\logo-mark\_blender_persp.png`, `_blender_front.png` and `sersan-mark.blend` | Blender render of the extruded, bevelled hex mark (the GLB that sersan.io uses) | 800×800 only. **Blender 5.1 is installed** (Desktop shortcut), so the `.blend` can be re-rendered at 3200×2000 later from Alberto's own file. Optional third figure |
| `…\sersan-v2-main\brand-export\sersan-logo-*.svg/png` | The mark in five colourways | Real vector deliverables; good for an identity sheet inside the case, not as the opener |

`aerender.exe` exists (`C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\aerender.exe`, version 26.3), but **no render is needed**: `tiff8_v2/` holds all 1622 frames of the current cut. Its log `renders\render_v2.log` (Sep 8, 13:52–14:44) records comp "AI SaaS Promo - Color". The two frames I opened show the brand fonts correctly. If someone ever re-renders:

1. Run `survey12_fontfix\riattiva-font.ps1` first. Without it, Switzer and SersanDisplay fall back to Times New Roman (HANDOFF §10, §16).
2. Use the newest project, `C:\Users\alber\Desktop\SERSAN-brand-film.aep` (Sep 8, 18:51).
3. The comp name is ambiguous ("AI SaaS Promo - Color" exists three times because of the imported template library), so `-comp` by name can pick the wrong one.
4. Pass `-mfr ON 90` and run aerender detached (HANDOFF §14).

Also not the film: `Downloads\Sersan.mp4` (1080p, 86.9 s) is the sersan.io screen clip placed inside the film's cards. `sersan-v2-main\marketing\_build\brand-film\sersan-brand-film_1920x1080.mp4` (4 Sep) is a separate HTML-engine piece. `Desktop\loghi Sersan\*` holds AI-generated logo explorations (ChatGPT, Gemini, Higgsfield) plus the reference raster `loh.jpeg`; never use them.

**How to make the plate.** From the TIFF: `ffmpeg -i tiff8_v2/00900.tif -vf "crop=3456:2160:192:0,scale=1600:1000:flags=lanczos" …` (and 800×500), then encode with sharp like the other captures, so the EXIF goes in. For 16:9, scale the full frame to 1600×900. Keep the focal point at the centre. Avoid frames **1080–1260 (36–42 s)**: the "Prior experience" scene shows third-party logos (Apple, J.P. Morgan, Revolut, Accenture, WHO).

**Provenance line:** `Frame 900 (00:30.03) of the SerSan brand film · 4K lossless master frame (aerender TIFF, 8 Sep 2026) · cropped 16:10 · directed and produced by Alberto Tuveri · portfolio of Alberto Tuveri`

**Confidentiality.** Studio work, not published: `PRODUCT.md` §8.4 asks whether the film may be shown (NDA), and sersan.io does not embed it. The two picked frames show only SerSan's identity and two SerSan deliveries that sersan.io already shows publicly. A still is far lighter than publishing the film, but it is still the film. Keep "Film link: pending" (`works.ts:656`).

**Recommendation: real media found.** Use frame 900 on the rail and frame 1560 in the case. Before writing any caption, read the two facts in §9.1 and §9.2.

---

## 5. Badante24h (`badante24h`)

**What exists**

- The local project folder is gone: `C:\Users\alber\Badante24h.code-workspace` points at a missing `Badante24h\`. The repo `GitAlboBis/Badante24h` is private, with homepage `https://badante24h.vercel.app` (read with `gh api`). Its last Vercel deployments are Previews from 2026-09-07.
- **Live landing**, `https://badante24h.vercel.app` (title "Badante24 — Trova badanti e babysitter nella tua zona", `robots: index, follow`). Hero: "Trova la persona giusta per chi ami." in a serif with a red accent over a soft photo of hands; a side card; trust row. Clean and professional, but:
  - the side card prints the empty state "Stiamo aggiornando i profili in questa zona";
  - `/esplora` prints "Non riusciamo a caricare i profili". The project memory records that the Supabase project stopped resolving around 6 Aug 2026;
  - the logo reads "CAF Badante24", while the recorded brand decision is "Badante24";
  - the hero photo `public/bg/hero-care.webp` is a site asset of unverified origin, not product UI.
- `design-samples/discovery-desktop.png` (117 KB) and `discovery-mobile.png` (64 KB) are in the private repo; **not downloaded** (a download needs Alberto's OK). They may be real discovery UI. If they show the `public/demo-avatars/*` people, those are demo profiles and must never pass as real caregivers.
- `og-image.png` (1200×630, public) is a brand card: too small and not UI.
- `C:\Users\alber\Documents\Contratti-Badante24\*.docx` (four contract variants) and `Downloads\badante24h.docx` were **not opened**. From the file names alone, the commercial status (licence or transfer) looks unsettled.

**How to make the plate.** Add `{ name: "badante24h", url: "https://badante24h.vercel.app", copyright: "© ALS MCL Civitanova — Badante24", settle: 4000 }` to the capture script. The headline animates in, so settle at least 3 s, or use `reducedMotion: "reduce"`. Capture the landing hero only, never `/esplora`.

**Provenance line:** `Capture of https://badante24h.vercel.app (landing) · Oct 2026 · Playwright Chrome 1600x1000 · portfolio of Alberto Tuveri`

**Confidentiality.** The site is publicly indexed, but the client's URL is still marked "not confirmed" (`works.ts:727`), the backend is down, and the contract status looks open.

**Recommendation: weak option.** The landing capture is real and clean, but it does not show the PWA's substance (map, chat, discovery) and it shows an empty-data card. Keep the typographic plate until Alberto confirms the production URL and the backend is back. A capture of a working `/esplora` or the map, with demo data labelled as demo, would make this strong.

---

## 6. Voice AI Agent for Microsoft Teams (`doit-voice-ai-agent`)

**What exists**

- `C:\Users\alber\Agente\` and the identical `C:\Users\alber\Desktop\Agente\`. They hold `PRD.md`, `code-organization.md`, `testing.md`, the Copilot Studio export (`CopilotStudioAgent/botcomponents/cr239_teamsAppointmentAgent.*`), Microsoft's sample `copilotstudio-webchat-react`, and the custom client `copilot-web-client` (remote `GitAlboBis/TeamsAppointmentAgentWebApp`, **public**, last commit 2026-02-18).
- **No image, video, PDF or deck** in either folder. The client signs in through MSAL against DOIT's Azure AD tenant: no mock mode (`src/mocks/` holds only `empty-module.js`), and `client/.env` is not read. Without the tenant, the build shows a sign-in page titled "Appointment Agent". Signing in with any credentials is out of bounds.

**Options.** The capture of the sign-in page from `client/dist` is real but empty: not recommended. An honest drawing would use only facts in `works.ts`/`PRODUCT.md`: spoken note → Azure Speech (real-time speech-to-text) → Copilot Studio orchestration → Power Automate → Teams meetings and Dynamics 365 contacts, with a pro-code web front-end bridging the low-code layer. That is a 2D stand-in, which D-C4 and Alberto's taste refuse.

**Recommendation: nothing real. Keep the typographic plate** (D-C4 already gives it the word plate). See §9.3 for a discrepancy that affects this case's copy.

---

## 7. Agricultural Supply Chain Platform (`agricultural-supply-chain`)

**What exists**

- Public repo `https://github.com/daveeCity/IDS_GROUP_PROJECT` (owned by a teammate; last push 2026-01-31). It is a Spring Boot backend with no UI, plus the team's **Visual Paradigm model `IDS_project.vpp` (13.2 MB)**.
- Local copies of the model:
  - `C:\Users\alber\Documents\GitHub\IDS_GROUP_PROJECT\IDS_project.vpp` (1 Dec 2025, 5.9 MB, 112 diagrams);
  - `C:\Users\alber\Downloads\IDS_project(3).vpp` (4 Dec 2025, 9.2 MB): 8 class diagrams, 38 sequence diagrams (e.g. "SD11 Visualizza Eventi su Mappa", "SD35 Visualizza Tracciabilità"), 47 use-case descriptions, 4 use-case diagrams. "Project class diagram 4" has 4 packages, 56 classes and 69 relationships, colour-banded by layer.
- A `.vpp` file is SQLite. Its embedded previews (`PROJECT_FILE` → `diagramPreviewData/*`) are **180-px thumbnails only**; I extracted them to scratch, and they are unusable as plates. But `DIAGRAM_ELEMENT.DEFINITION` stores each shape's `x`, `y`, `width`, `height` and name, so the real diagram can be **redrawn faithfully** without Visual Paradigm, which is not installed.
- Nothing in `Documents\UNIVERSTITA\IDS\` belongs to the project: it holds exam-practice photos and course notes, which I did not use.

**Options**

1. **Redraw "Project class diagram 4" (or the newest class diagram in the GitHub copy) as SVG.** A small read-only script (`sqlite3` with `?mode=ro`) reads shapes and connectors; the drawing goes in ink on paper with the rivista's hairlines; export at 1600×1000 and 800×500. It is a reproduction of a real artefact, not an illustration. First `git pull` the public repo, because the GitHub `.vpp` is newer than both local copies.
2. Capture of the GitHub repo page (`PRODUCT.md` §5 lists it as capturable). Real, but it reads as a generic GitHub page.

**Provenance line (option 1):** `Redrawn from the team's Visual Paradigm model IDS_project.vpp, diagram "Project class diagram 4" (github.com/daveeCity/IDS_GROUP_PROJECT) · shapes and names as modelled · team of 3, University of Camerino · portfolio of Alberto Tuveri`

**Confidentiality.** Public academic repo. Credit the team: three people, and the repo belongs to a teammate. Class names are the model's own content, not claims.

**Recommendation: a real artefact exists, but only as a redraw. Weak option: the GitHub capture.** If the director keeps D-C4 strict ("no SVG"), the typographic plate stays; the redraw is the one exception I would argue for, because every box in it was drawn by the team.

---

## 8. Plate pipeline (shared)

- **Format:** match `public/captures/*`: `<slug>-1600.webp` (1600×1000) and `<slug>-800.webp` (800×500, a downscale of the same frame); WebP q 82, stepping down to a 200 KB cap; EXIF IFD0 (ImageDescription · Artist · Copyright · Software · DateTime) via sharp; a `.webp.json` sidecar; a new row in `PROVENANCE.md`. Run the embed check afterwards (`impeccable embed-prompt --scan public/captures`).
- **Focal points for the 4:5 case crop below 1024 px:** sphere-ai `0% 0%` (answer column); domus-tua `50% 30%` (wordmark and founder); sersan-brand `50% 45%`; badante24h `20% 40%` (headline).
- **Headless:** `capture-sites.mjs` already uses `headless: true`. Look at each frame before encoding, and gate every case visually as usual.
- **Connectors.** 21st.dev, Magic UI and the other component connectors supply frames and components, not media of Alberto's work. Higgsfield or any generation must not produce work plates: an invented still is a fabricated record, and G5 is closed. Nothing from them belongs in this lane.

---

## 9. Facts the director needs before writing captions (discrepancies found)

1. **Brand film length.** `works.ts`/`PRODUCT.md` say "64-second 4K". The 64.264 s cut was delivered on 7 Sep (`SERSAN-AE\HANDOFF.md` §14) to `C:\Users\alber\Desktop\SERSAN render\`, **a folder that no longer exists**. The same night the film was re-cut to **54.121 s / 1622 frames** (HANDOFF §15–§16), and every render now on disk is the 54 s cut. Do not print "64 s" next to a frame without Alberto's confirmation. Neither number should be animated or put next to the still.
2. **What the film is made of.** HANDOFF §1, §4 and §8–§9 record that several scenes are re-themed third-party After Effects templates: `light_logo_reveal` for the outro, plus SaaS promo packs for the chat bubbles, toggles and card carousels. Captions and alt text should describe what the frame shows ("a frame of the SerSan brand film") and should not attribute a specific effect as hand-built.
3. **Voice agent front-end.** `works.ts`/the CV say "Pro-Code Angular + TypeScript front-end". The code on disk is **React 19 + Fluent UI 2** (`Agente\copilot-web-client\client\package.json`, `PRD.md` §3 "React 19 + TypeScript"). An earlier Angular build may exist elsewhere, but none is on this machine. This is a question for Alberto; do not change the copy here.
4. **Badante24h "shipped to production".** Today the public deploy loads but its data layer fails, as described in §5.
5. **`PRODUCT.md` §5 (P:58)** ("Nessuno screenshot/still dei lavori SerSan") is no longer true: Sphere AI captures (3 Sep), the Domus Tua still published on sersan.io, and the brand film's frames all exist. It should be updated when the plates land.

## 10. Looked at, nothing usable or not opened

- **Checked, no media for these works:** `C:\Users\alber\TechLabs\`, `SerSanOutreach\` (not among the seven works), `Desktop\PresentazioneTesi\` and `Desktop\tesi\` (thesis, unrelated), `Documents\SERSAN-marketing\` (AI-generated social reels; not the brand film), `Desktop\AE PRESETS\` and `Desktop\novi\` (third-party template packs and overlays), `Documents\VPProjects\` (empty).
- **Not opened (privacy, names do not reference a work):** `Videos\Registrazioni dello schermo\Registrazione dello schermo 2026-09-20 163632.mp4`, `Desktop\unknown_2026.09.04-14.56 - Trim.mp4`, `Desktop\unknown_2026.09.23-00.16 - Trim.mp4` (and their copies in Downloads), `Pictures\Screenshots\` (36 files), the game-recording folders, and the Badante24 contract `.docx` files.

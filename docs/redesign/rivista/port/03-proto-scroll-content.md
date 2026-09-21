# Rivista prototype → Next port · MAP · slice "page content + scroll choreography"

Read in full: public/proto/rivista/fx-scroll.js (689 lines), fx-scroll.css (360), parts/c-main.index.html (246), parts/c-main.case.html (137), case.html (305, assembled), plus parts/b-hero.html, b-preloader.html, c-footer.html, a-header.index.html, a-overlays.html, assemble.mjs, the FX bus in fx-core.js (register / ready / exits / boot) and the reveal base in fx-core.css §8. Content layer: src/content/works.ts (846), src/content/dict.ts (690), src/content/career.ts, src/data/skills.ts, PRODUCT.md §3 / §8 / §9.

Page assembly (assemble.mjs): index.html = head.html + body + b-preloader + a-header.index + main( b-hero + c-main.index ) + c-footer + a-overlays. case.html = head.html + a-header.case + main( c-main.case ) + c-footer + a-overlays. Only the home gets the "data-home" attribute on html ({{HOME}}), which gates the preloader, the sheet hairline and FX.page === "home".

Conventions used below: selectors, attributes and values are quoted verbatim; "§3.n" means PRODUCT.md section 3 item n; "CV" means PRODUCT.md §9 transcription.

---

## 1. HOME PAGE · section inventory (in DOM order)

### 1.0 Chrome above the main (other readers' slices, listed only for the dict)
- Skip link "a.skip" → "Skip to content" (exists: dict a11y.skipMain).
- "header.hdr[data-hdr]": brand "a.brand" (aria-label "Alberto Tuveri, home", mark ring SVG + "AT" monogram, ".brand-name" "Alberto Tuveri"); "nav.nav[aria-label=Primary]" links "Work" (#work, data-nv-sec="work"), "About" (#path, data-nv-sec="path"), "Contact" (#contact); ".lang" sr-only "Language: English. Italian version coming." visible "EN / IT"; "button.menu-btn[data-menu-btn]" aria-label "Open the menu", roll "Menu" / "Close".
- "div.menu#menu[data-menu][role=dialog]": items "01 Work", "02 About", "03 Contact"; ".menu-foot": "Write to me", "albertotuveri@gmail.com", "LinkedIn", "GitHub", lang again.
- Preloader "div.hr-pre[data-pre]" (aria-hidden): three rolling digits, rule, "Loading · " + "[data-pre-what]" "Fonts".
- Hero "section.hero.hr-stage" (b-hero.html): lockup "Alberto Tuveri" (sr-only + per-letter "span.ch" with "--i"), ornament "engineer" + ".orn-rule", "p.label.stone[data-hero-reveal]" "Software & AI Engineer · Creative Lead" (= dict header.role1), "h1#hero-h1.d3" "From database schema to real-time WebGPU rendering and motion design." (paraphrase of CV SUMMARY "from database schema design and security hardening to real-time WebGPU rendering and motion design" — OK), plate figure with three posters "fx-plate-v1/2/3.webp" (alt "A flow field of fine cobalt and ink hairlines streaming left to right, parting around a large letter A left blank in the paper."), figcaption "Fig. 01 · Flow field, rendered live", "[data-gl-instr]" (live instrument text from fx-gl), ".hr-still" "Still frame captured from this engine.", CTAs "a.btn" "Write to me" (mailto), "a.ghost" "Selected work" (#work), "a.ghost" "About" (#path).

### 1.1 "section.chapter.now.sc-sheet[aria-labelledby=now-h]" — Now at SerSan
DOM: ".row.split" > ".head" (eyebrow, h2, lead, body, ghost link) + ".media-col" > "figure.frame.r-11[data-media][data-cursor=Visit]" > ".frame-inner.over[data-parallax]" > img.
Copy (EN, in order):
- eyebrow "p.eyebrow.label[data-reveal]": "Now · since May 2026" — §3 Identità (SerSan maggio 2026–oggi). OK.
- title "h2#now-h.d1.stair[data-lines]": "Now at" / "SerSan" (two spans, second ".sc-l2"). OK.
- lead "p.lead[data-lines=lead]": "I own the front-end, WebGPU/3D and motion layer of what the studio ships, the AI work on its flagship platform, and the studio's creative direction." — CV SerSan paragraph verbatim; already in career.ts experience[0].note.en. OK.
- body "p.body[data-reveal][style=transition-delay:140ms]": "SerSan is a custom software, automation and AI studio: Sersan Limited, London. I work remote, as Software & AI Engineer and Creative Lead." — CV. OK.
- link "a.ghost[data-reveal][style=transition-delay:200ms]" href https://sersan.io: "sersan.io" + arrow svg. §3 link list. OK.
- img "/captures/sersan-io-1600.webp" srcset 800/1600, sizes "(min-width:1024px) 50vw, 90vw", alt "The sersan.io intro: the SerSan particle mark above a glowing wordmark." — caption/alt, not a claim ("particle brand mark" is CV, §3.3).

### 1.2 "section.chapter.work#work[aria-labelledby=work-h]" — the rail
DOM: ".row.head" > ".work-t" (eyebrow + h2) + "p.lead"; then ".railway[data-railway]" > ".rail[data-rail]" > "ul.rail-track[data-track]" > 9 × "li.tile.(photo|type)[data-tile-id=NN]" > "a.tile-link[href][data-cursor=Open][data-pt=flip|grow][data-pt-src][data-pt-hero][data-pt-label][data-pt-sub]" > ".tile-media" > ".tile-zoom" > (".pan[data-depth=4]" > img | ".sc-plate") + ".tile-cap" (label, h3.d3 or span.sr-only, p.body). After the rail: ".sc-ix[aria-hidden=true]" > "p.sc-ix-n.label" > "span.sc-ix-now[data-rail-index]" "01" + "span.sc-ix-sep" "/" + "span.sc-ix-all" "09"; "i.sc-ix-bar > i".
Head copy:
- eyebrow "Selected work".
- title "h2#work-h.d1.stair.stair-r[data-lines=counter]" (style margin-top 1.5rem): "Nine works," / "on file" (.sc-l2). Count = works.ts length 9. OK. Note: this is the one right-aligned chapter head (CSS .work .head .work-t text-align right; desktop grid "1fr 1.35fr", lead order 1, title order 2).
- lead "[data-lines=lead]": "A trading platform and its AI mentor, a workshop ERP, a WebGPU studio site, a real-estate platform and a brand film at SerSan, and three projects from outside it." — matches §3.1–3.8. OK.
Tiles (label / name / body / plate):
- 01 "li.tile.photo[data-tile-id=01]", data-pt="flip", data-pt-src and data-pt-hero "/captures/spherenode-1600.webp", data-pt-label "SphereNode", data-pt-sub "01 · Selected work". img sizes "(min-width:1024px) 60vw, 80vw", alt "The spherenode.com home page, dark with a green accent.". Caption: label "01 · SerSan · live at spherenode.com", h3 "SphereNode", body "Vertical SaaS that replaced eight tools for the Italian retail-trading market." — §3.1. OK.
- 02 "tile.type" data-pt="grow", label "Sphere AI", sub "02 · Selected work". Plate: "p.fig" "68%", "p.fig-l" "answer-policy accuracy, from 52%", "p.label.sc-plate-gap" "No photograph on file". Caption: label "02 · SerSan · RAG mentor", sr-only "Sphere AI", body "Measured on a 161-question bilingual evaluation set." — §3.1. OK.
- 03 Maintech OMA: fig "9", fig-l "roles, default-deny on every table", gap; label "03 · SerSan · workshop ERP", sr "Maintech OMA", body "Job orders on a six-phase state machine, ten trade portals." — §3.2. OK.
- 04 "tile.photo" data-pt="flip", src/hero "/captures/sersan-io-1600.webp", label "sersan.io", sub "04 · Selected work"; img alt as in 1.1; caption label "04 · SerSan · Jun – Sep 2026", h3 "sersan.io", body "Seventeen scroll-locked scenes on one continuous WebGPU canvas." — §3.3 + CV period. OK.
- 05 Domus Tua: fig "1.74 s", fig-l "mobile LCP, from 4.75 s"; label "05 · SerSan · real-estate brand platform", sr "Domus Tua", body "Blocking time 572 ms → 274 ms, no layout shift." — §3.4. OK.
- 06 Brand film: fig "64 s", fig-l "in 4K, fourteen scenes"; label "06 · SerSan · identity and film", sr "Brand film", body "Hexagonal mark, custom display typeface, colour system." — §3.5. OK. (works.ts title is "SerSan brand identity & brand film"; the proto uses the short "Brand film".)
- 07 Badante24h: fig "Sub-second" (class "fig is-word"), fig-l "geospatial caregiver search, PostGIS 3"; label "07 · ALS MCL Civitanova · freelance", sr "Badante24h", body "Zero known auth vulnerabilities at launch." — §3.6. OK.
- 08 Voice AI Agent: fig "—", fig-l "no figure on file"; label "08 · DOIT S.r.l · internship", sr "Voice AI Agent", body "Hands-free appointments in Microsoft Teams from audio notes." — §3.7 (no numbers, printed as a hole). OK. (works.ts title "Voice AI Agent for Microsoft Teams".)
- 09 Supply Chain: fig "10", fig-l "roles, built by a team of three"; label "09 · University of Camerino", sr "Supply Chain", body "Agricultural supply-chain platform on Spring Boot, JWT RBAC." — §3.8. OK. (works.ts title "Agricultural Supply Chain Platform".)
- Every tile href is "case.html" in the proto (one case page only); the port maps to /work/[slug].
- Instrument: "01" "/" "09" (aria-hidden, digits rebuilt by JS).

### 1.3 "section.sc-ink#measured[aria-labelledby=ms-h]" — Measured, scroll ink
DOM: ".sc-ink-screen" > ".row" > eyebrow + "h2#ms-h.d1.sc-manifesto[data-ink]" + lead.
- eyebrow "[data-reveal]": "Evidence".
- manifesto "[data-ink]" (style margin-top 1.5rem): "Measured before and after."
- lead "[data-reveal]" (style margin-top 2rem; transition-delay 120ms): "Two sets of figures with a before and an after: a 161-question bilingual evaluation set for Sphere AI, and page speed on real phones for Domus Tua." — §3.1 / §3.4. OK.

### 1.4 "section.chapter.sc-ledgers[aria-label=Before and after]" — two ledgers
DOM per ledger: ".row.sc-ledger[role=group][aria-labelledby=lgN-h]" > ".head.sc-ledger-head" (eyebrow, h3.d2[data-lines], p.lead[data-lines=lead]) + "ol.metric-list" > "li.metric[data-bars]" > "i.sc-rule[data-rule]" + "p.m-l" + "p.m-n.sz-2|sz-1" > "span.sc-rise" > "span.from" + "span.arr[aria-hidden]" "→" + "span.sr-only" "to" + "span.to"; then ".bars[aria-hidden]" > ".bar > i[style=--w:X]" + ".bar.after > i[style=--w:Y]".
Ledger 1 (lg1-h):
- eyebrow "Sphere AI · SerSan"; title "Answer reliability, before and after"; lead "On a 161-question bilingual evaluation set. Citation correctness 100%, with zero locked-content leaks and zero fabricated citations." — §3.1. OK.
- rows (sz-2): "Answer-policy accuracy" 52% → 68% (bars 52% / 68%); "Over-answering on questions to withhold" 56% → 16% (56/16); "Clarification precision" 75% → 94% (75/94); "Clarification recall" 32% → 90% (32/90); "Unsupported claims" 1.9% → 0.6% (1.9/0.6). All §3.1. OK. All five pairs exist in works.ts sphere-ai study.metrics[0..4] as before/after/unit.
Ledger 2 (lg2-h):
- eyebrow "Domus Tua · real phones"; title "Fast on the phone in your hand"; lead "The mobile delay was traced to the cookie banner and the intro rebuilt to run in CSS rather than JavaScript. The cinematic experience stayed, with no layout shift." — §3.4 / CV. OK.
- rows (sz-1): "Mobile largest-contentful-paint" 4.75 s → 1.74 s (bars "--w:100%" / "--w:36.6%" = 1.74/4.75); "Mobile blocking time" 572 ms → 274 ms (100% / 47.9% = 274/572). §3.4. OK; works.ts domus-tua metrics[0..1].
Bar rule: percentage metrics use the value as width; time metrics use before = 100% and after = after/before.

### 1.5 "section.chapter.caps[aria-labelledby=cap-h]" — Capabilities
DOM: ".row" > ".head.caps-head" (eyebrow, h2#cap-h.d1[data-lines], lead[data-lines=lead]) + "ol.cap-list" > 8 × "li.cap" > "i.sc-rule[data-rule]" + "p.label.cap-n > span.sc-rise" (number) + "h3.d2.cap-nm > span.sc-rise" (name) + "p.cap-tools[data-reveal]" + "p.label.cap-proof[data-reveal][style=transition-delay:90ms]" > "span" "Proof" + work name.
- eyebrow "Capabilities"; title "What I build with"; lead "Eight groups of tools, each tied to the work that proves it." — 8 groups = §3 Skill. OK.
- 01 "Core" · "TypeScript · JavaScript (ES2024) · Python · Java · C / C++ · C#" · Proof "Supply chain"
- 02 "Front-End" · "React 19 · Next.js 16 (App Router) · Angular · Tailwind CSS v4 · GSAP · Lenis · Framer Motion" · Proof "Domus Tua"
- 03 "3D & Graphics" · "WebGPU · WGSL / TSL · three.js · React Three Fiber · GLSL / WebGL2 · GPGPU compute · Blender" · Proof "sersan.io"
- 04 "Back-End & DB" · "Node.js · Deno · Spring · Supabase · PostgreSQL · PostGIS · pgvector · MySQL" · Proof "Maintech OMA"
- 05 "AI" · "RAG & embeddings · LLM evaluation & guardrails · OpenAI / Anthropic / Gemini · Copilot Studio · Power Automate · Dataverse · Dynamics 365 · Claude Code / MCP" · Proof "Sphere AI"
- 06 "Cloud & DevOps" · "Vercel · Azure (AD, Speech) · Cloudflare (Stream / R2) · GitHub Actions · Sentry · Docker" · Proof "SphereNode"
- 07 "Testing & Tooling" · "Playwright · Vitest · pgTAP · Lighthouse CI · ESLint · Prettier · Git" · Proof "Maintech OMA"
- 08 "Creative" · "Motion graphics & VFX (After Effects) · Video editing & post-production · Brand identity & logo design · Art direction · Typography · Sound design" · Proof "Brand film"
Tool lists = CV SKILLS verbatim = src/data/skills.ts items (join " · "). FLAG: the "Proof" association (group → work) is editorial, not a PRODUCT.md fact; skills.ts has no proof field. It is defensible from the CV (pgTAP ↔ Maintech database test suite; Cloudflare Stream ↔ SphereNode) but must be added as data, not hardcoded.

### 1.6 "section.chapter#path[aria-labelledby=path-h]" — About · path
DOM: ".row" > ".head" (eyebrow, h2#path-h.d1.stair[data-lines] three spans, lead) + "ol.tl" > 5 × "li.tl-row[style=--k:N]" > "i.sc-rule[data-rule]" + "p.label.tl-when > span.sc-rise" (period + "span.tl-kind" "· Education|· Experience") + ".tl-body" > "h3.d2.tl-what > span.sc-rise" + "p.body.tl-where[data-reveal]" (+ "p.tl-thesis[data-reveal][style=transition-delay:160ms]" on the last).
- eyebrow "About · path"; title "Camerino," / "Trento," (.sc-l2) / "London" (.sc-l3); lead "A B.Sc. at Camerino, an M.Sc. in AI Systems at Trento, and professional work since November 2025, remote for a London studio since May 2026." — §3 Identità. Mild FLAG: "professional work since November 2025" ignores the 2019–2020 network-technician internship in the CV (career.ts has it); defensible as "professional software work" but the wording is editorial.
- --k:0 "Sep 2026 – Present · Education" / "M.Sc. in Artificial Intelligence Systems" / "University of Trento · Trento, Italy"
- --k:1 "May 2026 – Present · Experience" / "Software & AI Engineer · Creative Lead" / "SerSan, AI studio · Sersan Limited (London) · Remote"
- --k:2 "Jan 2026 – Present · Experience" / "Full-Stack Developer" / "ALS MCL Civitanova · Badante24h, a production PWA · Freelance · Marche, Italy"
- --k:3 "Nov 2025 – Feb 2026 · Experience" / "AI & Software Developer" / "DOIT S.r.l · a voice AI agent for Microsoft Teams · Internship · Fabriano, Italy"
- --k:4 "Jan 2022 – Apr 2026 · Education" / "B.Sc. in Computer Science" / "University of Camerino · Camerino, Italy" / thesis (sr-only "Thesis: ") "From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents"
All CV §9 / career.ts. The proto omits the two Boccaccio entries (IT diploma 2017–2020, network intern 2019–2020) that career.ts carries: a port decision, not a data gap.

### 1.7 "section#contact.band[aria-labelledby=ct-h][data-band]" — closing band
DOM: ".gl-host[data-gl-host=band]" (fx-gl paints here; scroll module never styles it) + ".band-copy[data-band-copy]" > eyebrow + "h2#ct-h.d1[data-lines]" + "a.sc-email[data-magnetic]" > "span.sc-email-t" + "i.sc-email-l.l1" + "i.sc-email-l.l2".
- "Contact" / "Write to me." / "albertotuveri@gmail.com" (mailto). §3 links. OK. (dict release.email exists.)

### 1.8 "footer.foot.row" (c-footer.html, shared by both pages)
DOM: "i.sc-rule.sc-rule-bleed[data-rule]" + ".foot-grid" (3 cols ≥1024, 2 ≥768) + ".legal" > "i.sc-rule[data-rule]" + 2 spans.
- col 1: "h2 > span.sc-rise" "Alberto Tuveri"; body "Software & AI Engineer and Creative Lead at SerSan. M.Sc. in Artificial Intelligence Systems at the University of Trento." OK.
- col 2: "Elsewhere"; "a.sc-draw" "LinkedIn" (https://www.linkedin.com/in/albertotuveri), "GitHub" (https://github.com/GitAlboBis). OK.
- col 3: "Colophon"; ".var-only.v1" "Cormorant Garamond & Figtree" (v2 "Geist & Geist Mono", v3 "Instrument Serif & Hanken Grotesk"); "GSAP, Lenis, WebGL2"; "Prototype, September 2026". FLAG: prototype-only lines; the port needs its own colophon (V1 fonts only, and the real stack).
- legal: "© 2026 Alberto Tuveri" (exists: dict footer.copyright); "Prototype for review. Not the live site." FLAG: must not ship.

---

## 2. CASE PAGE (SphereNode) · inventory + parameterisation

Header differences vs home (a-header.case.html): brand href "index.html" with data-back, data-pt-label "Index", data-pt-sub "Alberto Tuveri"; nav "Work" → "index.html#work" data-back data-pt-label "Selected work" data-pt-sub "Index"; "About" → "index.html#path" data-pt-label "About"; "Contact" stays "#contact" data-nv-sec="contact". No preloader, no hero stage.

### 2.1 "section.page-hero.sc-sheet[aria-labelledby=case-h]"
- overline "p.overline.label[data-reveal=hero][data-delay=0]": spans "SerSan" · "Since May 2026" · "Live at spherenode.com". FLAG "Since May 2026": SphereNode carries no date in the CV; May 2026 is the SerSan start date. works.ts spherenode has no period field.
- "h1#case-h.d1.page-title[data-lines=hero]" (margin-top 1.5rem): "SphereNode".
- "span.ornament.row[aria-hidden]" "in production" + "span.orn-rule". Editorial word per work (new).
- lead "[data-lines=hero-lead]" (margin-top 2rem): "A vertical SaaS that replaced eight tools for the Italian retail-trading market, with Sphere AI, its bilingual RAG mentor, built in." §3.1. OK.
- ".cta-row[data-reveal=hero][data-delay=350]": "a.btn" "Visit spherenode.com" (https://spherenode.com) + "a.ghost[data-back][data-pt-label=Selected work][data-pt-sub=Index]" "Back to the index" (index.html#work).
- "figure.media-full" > ".frame.r-169[data-media=case-hero][data-case-hero][data-cursor=Visit]" > ".frame-inner.over[data-parallax]" > img "/captures/spherenode-1600.webp" (sizes 100vw, fetchpriority high, alt "The spherenode.com home page: a dark trading-community landing with a green accent."); "figcaption.caption-row.row": "Fig. 01 · spherenode.com" + "Home page, captured September 2026." (works.ts capture.label is "capture · Sep 2026").

### 2.2 "section.chapter.c-what[aria-labelledby=c1-h]" — 01 What it is
- eyebrow "01 · What it is"; "h2#c1-h.d1.stair[data-lines]" "Eight tools," / "one platform".
- "ul.replaced[aria-label=The eight tools it replaced]" > 8 × "li > span.rp > span.sc-rise" + "i.strike[data-strike][aria-hidden]": "Circle", "Teachable", "Zoom", "Intercom", "HubSpot", "Mailchimp", "Stripe", "Notion" — CV verbatim. works.ts holds them only inside prose (highlights[0], study.summary); no array.
- "p.d3.replaced-by > span.sc-rise": "→" (aria-hidden) + sr-only "Replaced by " + "SphereNode".
- ".split.s-57.c-what-body": lead "[data-lines=lead]" "A production platform for the Italian retail-trading market that replaced eight separate tools with one product: courses, live sessions, payments and entitlements, a Trading Journal and a bilingual AI mentor." (= works.ts study.summary.en minus the tool names); ".stack[data-reveal]" "Stack" + "React 18 · Vite · Supabase (Postgres, RLS, Realtime, pgvector, Edge Functions) · Whop · Cloudflare Stream · Capacitor" (CV verbatim grouping; works.ts stack[] is flattened into 11 items, so "Supabase (…)" cannot be rebuilt from it without a grouping rule).

### 2.3 "section.chapter[aria-labelledby=c2-h]" — 02 Sphere AI
- eyebrow "02 · Sphere AI"; title "It asks" / "before it guesses"; lead "Sphere AI is the bilingual (IT/EN) RAG mentor inside SphereNode. It answers only from the proprietary curriculum: semantic chunking and embeddings in pgvector, tier-aware retrieval with a curated fast path for canonical answers, and an LLM relevance grader on top." (≈ sphere-ai study.summary.en, trimmed). §3.1 OK.
- ".split.s-75" col 1: "p.label.stone[data-reveal]" "161-question bilingual evaluation set · before → after"; "ol.metric-list" same 5 rows as home ledger 1 plus a 6th "Citation correctness · zero fabricated citations" with only "span.to" "100%" and one ".bar.after" "--w:100%" (works.ts sphere-ai metrics[5] value "100%").
- col 2: "The guardrails behind the numbers"; "ol.guard" > 5 × "li" > "i.sc-rule[data-rule]" + "span.g-n > span.sc-rise" NN + "span[data-reveal]": 01 "Asks for clarification instead of guessing." 02 "Refuses questions built on a false premise or asking for unsafe actions." 03 "Requires live evidence before answering anything time-sensitive." 04 "Never lets static FAQ content stand in for current market information." 05 "Reads the Trading Journal only as a consent-gated, owner-only source, personal data excluded by default." — CV guardrails sentence + Trading Journal sentence. works.ts sphere-ai highlights[2..4] hold the same facts as 3 sentences, not 5 items.

### 2.4 "section.chapter[aria-labelledby=c3-h]" — 03 Reliability
- eyebrow "03 · Reliability"; title "What had" / "to hold" / "at launch" (.sc-l2, .sc-l3); lead "A paywalled product with tiered access, live video, recurring payments and scheduled jobs, where a single defect leaks paid content or strands paying customers." (≈ study.problem.en).
- "ol.facts" > 4 × "li.fact" > "i.sc-rule[data-rule]" + "p.num > span.sc-rise" + "h3.d3[data-reveal]" + "p.body[data-reveal][style=transition-delay:90ms]":
  - "5" / "Revenue-critical defects closed" / "The payments-to-entitlement pipeline rebuilt as a tested state machine: access surviving cancellation, disputes and unknown events defaulting to open, empty lookups downgrading paying users, duplicate rows stranding paid customers, out-of-order events resurrecting revoked access."
  - "6" / "Access-control defects closed before launch" / "Among them a tier leak exposing 206 live sessions and 79 transcripts to free accounts, alongside a 33-finding security audit remediated in one batch."
  - "21" / "Silent scheduled jobs" / "Dead for weeks while every dashboard still reported success. Root-caused, then the missing monitoring and alerting built so it cannot go unnoticed again."
  - "21/49" / "Production releases as release manager" / "Including the public launch. Plus the live-session video pipeline on Cloudflare Stream and the Trading Journal analytics engine."
  All CV §9 (206, 79, 33 appear in the CV and in works.ts study.action). works.ts metrics have "21 / 49" with spaces; proto prints "21/49". The four bodies are fragments of study.action.en, not separate fields.

### 2.5 "section.chapter.next[aria-labelledby=next-h]"
- "i.sc-rule.sc-rule-full[data-rule]"; "a.next-link[href=index.html#work][data-cursor=Next][data-pt-label=sersan.io][data-pt-sub=Next work]": eyebrow "Next work"; "h2#next-h.d1[data-lines]" "sersan.io " + "span.arrow[aria-hidden]" "→"; body "Seventeen scroll-locked scenes on one continuous WebGPU canvas. In this prototype the link returns to the work rail." FLAG second sentence is prototype-only.

### 2.6 Contact band + footer: identical to home 1.7 / 1.8 (the band is duplicated in c-main.case.html, not a part).

### 2.7 Parameterisation (what changes per work)
| Element | Source today | works.ts field |
|---|---|---|
| html title "SphereNode · Alberto Tuveri · …" | assemble.mjs vars | title |
| overline span 1 (org short "SerSan") | hardcoded | org ("SerSan · AI Studio" — needs short form) |
| overline span 2 ("Since May 2026") | hardcoded | none (period exists only for sersan-io, badante24h, doit) |
| overline span 3 ("Live at spherenode.com") | hardcoded | study.links[0] (href / pending) |
| h1 | hardcoded | title |
| ornament word ("in production") | hardcoded | none |
| lead | hardcoded | hook (close, not identical) |
| CTA "Visit spherenode.com" | hardcoded | study.links[0].label; pending → subform.pendingUrl / pendingFilm |
| hero figure | capture only for 2 works | capture (spherenode, sersan-io) |
| figcaption "Fig. 01 · spherenode.com" / "Home page, captured September 2026." | hardcoded | capture.label ("capture · Sep 2026") — wording differs |
| chapter 01 stair title, replaced list, stack | hardcoded | study.summary, stack[] (flattened), no replaced[] |
| chapter 02 ledger | hardcoded | study.metrics (before/after/unit/value/label/source) |
| chapter 02 guardrails | hardcoded | highlights (3 sentences vs 5 items) |
| chapter 03 facts | hardcoded | metrics single values (5, 6, 21, 21 / 49) + fragments of study.action |
| next link | hardcoded (sersan.io) | works[i+1] (title + blurb), wrap at 9 → 1 |
| data-pt-label / data-pt-sub / data-pt-src | per tile | title (short), "NN · Selected work", capture.src |
Photos: only "spherenode" and "sersan-io" have capture (public/captures/spherenode-{800,1600}.webp, sersan-io-{800,1600}.webp, 1600×1000). The other 7 print the plate ("sc-plate": hairline, big figure, figure label, hairline, "No photograph on file"), never a card; the case page for those 7 is NOT designed in the proto (open question).
The proto case page merges two works.ts entries (spherenode + sphere-ai) in one page; the Next site has /work/spherenode and /work/sphere-ai as separate SSG routes.

---

## 3. fx-scroll · every scroll effect (DOM contract · trigger · values)

Globals: MOTION = "(prefers-reduced-motion: no-preference)"; DESK = "(min-width: 1024px) and " + MOTION; HAND = "(max-width: 1023.98px)". All hidden states are set inside "ctx.mm" (the shared gsap.matchMedia from fx-core); with reduced motion nothing is hidden and the page is fully printed by CSS.

### 3.1 Reveal (fade-up) — initReveal(), runs in init()
- Contract: "[data-reveal]" opt-in. Base CSS (fx-core.css §8): "html.rv-ready.rv-motion [data-reveal]" opacity 0, translateY(2.5rem) (1.5rem below 1024), transition opacity+transform "var(--d-reveal) var(--ease-out)"; ".is-in" → opacity 1, transform none. Per-element stagger via inline "style=transition-delay:NNms" (140, 200, 90, 120, 160, 80, 240 used).
- "html.rv-ready" is added by the module in the same tick as the IntersectionObserver (fx-core removes it if the module fails).
- IO: threshold 0.12, rootMargin "0px 0px -8% 0px". Reversible downward only: leaving through the top keeps ".is-in"; leaving through the bottom (boundingClientRect.top > 0) removes it.
- Gate: until "fx:ready" intersections are only remembered (pending Set), then flushed. "focusin" on a descendant adds ".is-in".
- "[data-reveal=hero]" (case page: overline, cta-row) are NOT observed; on "fx:ready" they get transitionDelay = "data-delay" ms (0, 350) and ".is-in".
- No motion / no IO: everything ".is-in" immediately.

### 3.2 Lines (SplitText mask reveals) — buildLines()
- Contract: "[data-lines]" with kind "" | "hero" | "hero-lead" | "lead" | "counter". Table LINE: "" {dur 1.05, stg 0.09, del 0}; hero {1.05, 0.09, 0.08}; "hero-lead" {0.90, 0.08, 0.25}; lead {0.90, 0.08, 0}; counter {1.05, 0.09, 0}.
- preHideLines(): gsap.set opacity 0 + visibility hidden (FIX MQ-07: a font swap before the split must not flash) on every [data-lines] except cssFilm elements (html.sc-film + inside ".page-hero": the case title/lead on a flip arrival rise by CSS keyframe "sc-title-in" 1.05s / 0.9s delay 0.06s / 0.25s).
- Split: "SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'sc-line', aria: 'none', autoSplit: true })". onSplit: kills previous st/run/extra, set el visible, set lines yPercent 112, "ScrollTrigger.create({ trigger: el, start: 'top 86%', onEnter: enter, onLeaveBack: leave })".
- enter: fromTo lines yPercent 112 → 0, duration cfg.dur, ease "expo.out", stagger cfg.stg, delay cfg.del, overwrite true. Deferred (rec.pending) until linesOpen (set on "fx:ready").
- leave (onLeaveBack): to yPercent -110, duration 0.4, ease "power2.in", stagger cfg.stg/2 — exits go UP through the same mask, re-entries rise from below again.
- kind "counter" (the work head): masks get counter-parallax fromTo xPercent (i%2 ? 6 : -4) → (i%2 ? -6 : 4), ease "none", scrollTrigger trigger el, start "top bottom", end "bottom top", scrub 0.25.
- Elements already past 86% at split time get enter() from a rect check (rect.top < innerHeight*0.86); a re-split (autoSplit after resize/variant) restores state (yPercent 0) without replaying.
- Fail-safe: setTimeout 2500 ms unhides any [data-lines] still at opacity 0 / visibility hidden.
- Stair heads: ".stair > span" display block; ".sc-l2" padding-left 0.62em, ".sc-l3" 1.7em; ".stair-r" mirrors with padding-right. Steps are named on the spans because the ":nth-child" selector stops matching after the split.

### 3.3 Rules (hairline draw) — buildRules()
- "[data-rule]" (always with class ".sc-rule": absolute, top 0, 1px, background var(--line), transform-origin left center; ".sc-rule-full", ".sc-rule-bleed" = ±var(--pad)). Printed by default; motion-ok sets scaleX 0.
- fromTo scaleX 0 → 1, duration 0.9, ease "expo.out", scrollTrigger trigger "r.parentElement || r", start "top 95%", toggleActions "play none none reverse".
- Hover accent: ".cap .sc-rule::after" and ".sc-plate-r.is-fig::after" draw an accent line scaleX 0 → 1 in 0.45s var(--ease-out) on hover/focus-visible (pointer fine only).

### 3.4 Rises (printed figures through a mask) — buildRises()
- ".sc-rise" (display block); parent must clip: ".m-n", ".cap-n", ".cap-nm", ".tl-when", ".tl-what", ".fact .num", ".foot h2", ".g-n", ".rp", ".replaced-by" all have "overflow: clip" + a small padding-bottom (0.06–0.12em) for descenders.
- gsap.set yPercent 110; "ScrollTrigger.batch(els, { start: 'top 94%', onEnter: to yPercent 0, 0.9, 'expo.out', stagger 0.05; onLeaveBack: to yPercent 110, 0.4, 'power2.in', stagger 0.02 })". House rule: the number is printed final from the first visible frame; no count-up ever.

### 3.5 Media curtains — buildMedia()
- "[data-media]" figures (".frame"): set clipPath "inset(100% 0% 0% 0%)", inner img scale 1.15; paused timeline: clipPath → "inset(0% 0% 0% 0%)" 1.4 "expo.out" at 0, img scale → 1 1.6 "expo.out" at 0; "ScrollTrigger.create({ trigger: fig, start: 'top 88%', once: true, onEnter: play })".
- "data-media='case-hero'" waits: tl.pause(0) then on "fx:ready" plays if st.isActive. Skipped entirely when the figure has "data-nv-arrived" (set by fx-nav after a match-cut) or when html "data-arrive" is "flip" (the travelling image already painted it).
- Cleanup: clearProps clipPath / transform.

### 3.6 Parallax — buildParallax()
- "[data-parallax]" (".frame-inner.over"): mm with conditions { phone: "(max-width: 767.98px)", ok: MOTION }; amp = 2.5 on phone, 5 otherwise; fromTo yPercent -amp → +amp with scale 1.12 both ends, ease "none", scrollTrigger trigger inner.parentElement, start "top bottom", end "bottom top", scrub true.

### 3.7 Bars — buildBars()
- "[data-bars]" li → ".bar i" (width from inline "--w"; ".bar" 1px line var(--line), "i" 3px var(--stone), ".bar.after i" var(--accent), transform-origin left). fromTo scaleX 0 → 1, 1.1, "expo.out", stagger 0.08; scrollTrigger trigger li, start "top 90%", toggleActions "play none none reverse".

### 3.8 The work rail — buildRail()
- Contract: "[data-railway]" (".railway") > "[data-rail]" (".rail") > "[data-track]" ("ul.rail-track" flex, width max-content, gap clamp(0.75rem,1.6vw,1.75rem), padding-inline var(--pad)); ".tile" (flex none, scroll-snap-align start); ".tile-media" (overflow hidden, bg var(--paper-deep)); ".pan" (absolute, left -3%, width 106%, img object-fit cover, object-position left top); ".tile-cap > *"; instrument "[data-rail-index]", ".sc-ix-bar > i".
- Sizes: phone ".tile-media" width 76vw aspect 4/5, ".tile.photo" 16/10 (FIX J8: real captures keep their headline whole); tablet 768–1023 width 52vw; desktop "--th: min(56vh, 38vw)", type tile width th*0.8, photo width th*1.6, height th; ".tile-cap" widths match.
- Index instrument (setupIndex/setIndex): two "span.sc-ix-cell" (width 0.66em, height 1.3em, overflow clip) each with "span.sc-ix-col" of 10 "i" digits; setIndex(n): pad to 2, each column to yPercent -10*digit, 0.45, "expo.out", overwrite. Bar: ".sc-ix-bar" 4rem × 2px, inner "i" width 33.34% moved by "translateX(p*200%)".
- setP(p): clamps, moves the bar, writes "--rail-p" (registered "@property --rail-p { syntax: '<number>'; inherits: false; initial-value: 0.5 }") on each ".pan" only (FIX MQ-13: no inherited custom property on the rail), setIndex(min(tiles, floor(p*tiles)+1)). Exposed as railApi = { setP, st }.
- Unroll (MOTION): ".tile-media" clipPath "inset(0% 0% 100% 0%)" → "inset(0% 0% 0% 0%)", 1.1, "expo.out", stagger 0.08, scrollTrigger trigger wrap, start "top 82%", once. Skipped when html "data-arrive='flip-back'" (fx-nav unrolls the neighbours itself).
- Desktop runway (DESK): sets "data-on" on rail and wrap. This is a STICKY runway, not a ScrollTrigger pin: CSS ".railway[data-on] { height: calc(var(--rail-len) + var(--rail-run, 1200px)) }", ".railway[data-on] > .rail { position: sticky; top: var(--rail-top) }", ".sc-ix" sticky at rail-top + rail-len, ".rail[data-on] { overflow: hidden; scroll-snap-type: none }". size(): ixH = ix.offsetHeight + 38; top = round((innerHeight − rail.offsetHeight − ixH)/2); "--rail-len" = rail.offsetHeight px; "--rail-top" = top px; "--rail-run" = round(overflow()*0.6) px where overflow = track.scrollWidth − rail.clientWidth. size() runs at once and on "ScrollTrigger.addEventListener('refreshInit', size)".
- cfg(): trigger wrap, start () => "top " + top + "px", end () => "bottom " + (top + rail.offsetHeight) + "px", scrub 0.6, invalidateOnRefresh true.
- move = fromTo track x 0 → () => −overflow(), ease "none" (GSAP rule: containerAnimation needs a linear tween), onUpdate s => setP(s.progress). moveSt = move.scrollTrigger.
- pan = fromTo all ".pan" xPercent −2.5 → 2.5, ease "none", same cfg (FIX J8: a few-percent pan instead of a crop).
- Per tile: cap children set y 26, opacity 0; paused tl: ".pan" scale 1.08 → 1, 1.2, "expo.out" at 0; caps y 0 / opacity 1, 0.9, "expo.out", stagger 0.06 at 0.1. "ScrollTrigger.create({ trigger: tile, containerAnimation: move, start: 'left 90%', onEnter: tl.timeScale(1).play(), onLeaveBack: tl.timeScale(2.5).reverse() })" (FIX MQ-09 exits faster). If already active/progress>0 → tl.progress(1).
- Keyboard: "focusin" on the rail resets rail.scrollLeft = 0 and scrolls the page to s.start + p*(s.end − s.start) with p = (tile.offsetLeft − innerWidth*0.25)/overflow via FX.scrollTo(…, { immediate: true }).
- Hover: ".tile-link:hover .tile-zoom" scale 1.04, 0.6s var(--ease-out); plate accent rule draws (3.3).
- Below 1024 (HAND, motion or not): native horizontal scroll with "scroll-snap-type: x mandatory", scrollbar hidden, "overscroll-behavior-x: contain"; setP(rail.scrollLeft / (scrollWidth − clientWidth)) on "scroll" (passive) and "resize"; CSS "@media (max-width:1023.98px) and (prefers-reduced-motion: no-preference) .rail .pan { transform: translateX(calc((var(--rail-p) − 0.5) * −5%)) }".
- Reduced motion ≥1024 (FIX A7) and no-JS ("html:not(.rv-js)"): rail overflow visible, track becomes "grid-template-columns: repeat(3, minmax(0,1fr))", gap 3.5rem 1.5rem, tiles auto width, 4/5 (photo 16/10), ".sc-ix" hidden.
- Plates: ".sc-plate" absolute inset 0, flex column, container-type inline-size; ".fig" display face weight 300 (400 in v3), size max(2.25rem, min(34cqi, 9vw)) (14vw below 1024), line-height 0.88; ".fig.is-word" max(2rem, min(17cqi, 6vw)); ".fig-l" 1rem graphite; ".sc-plate-gap" stone; even ".tile.type:nth-child(even)" plates right-aligned (FIX J3: a typographic title page, not a stat card).

### 3.9 Measured scroll ink — buildInk()
- Contract: "section.sc-ink" > ".sc-ink-screen" > "[data-ink]" (h2.sc-manifesto: font-size clamp(3.1rem, min(12vw, 17vh), 12rem), line-height 0.9, letter-spacing var(--tr-hero); words ".sc-w" inline-block).
- DESK: section gets "data-on" → CSS height 180vh, padding 0; ".sc-ink-screen" sticky top 0, height 100vh, flex column centred. Split "type: 'words', wordsClass: 'sc-w', aria: 'none'"; set words opacity INK_REST = 0.52 (FIX A2/J14: keeps the large type above 3:1 at rest); to opacity 1, ease "none", stagger 1, duration 1, scrollTrigger trigger sec, start "top top", end () => "+=" + round((sec.offsetHeight − innerHeight)*0.86) (finishes before the sheet releases), scrub 0.6, invalidateOnRefresh. Nothing moves; only opacity.
- Below 1024 + motion: split "lines,words", stagger 0.6, trigger the h2, start "top 82%", end "bottom 45%", scrub 0.5; no sticky.
- Reduced motion: plain chapter, no split, ink solid.

### 3.10 Ledgers (CSS + 3.2/3.3/3.4/3.7)
- ".sc-ledgers" padding-block 0 var(--chap); ".sc-ledger + .sc-ledger" margin-top clamp(4rem, 11vh, 8rem); ≥1024 ".sc-ledger" grid "5fr 7fr", ".sc-ledger-head { position: sticky; top: 22vh }"; <1024 stacked with 2.5rem gaps.
- ".metric-list" grid, border-bottom hairline; ".metric" padding 1.2rem 0 1.4rem with its own "[data-rule]" on top; ".m-l" 1rem uppercase 0.08em weight 600 stone; ".m-n" display face, overflow clip, "sz-2" clamp(2rem, min(5.4vh, 3.6vw), 3.6rem), "sz-1" clamp(2.4rem, min(7.5vh, 4.6vw), 5.2rem); ".from" stone, ".to" ink (weight 500 in v1), ".arr" text face 0.6em; ".bars" grid gap 6px margin-top 0.9rem.

### 3.11 Capabilities / path (CSS + rules + rises + reveals)
- ".cap-list" margin-top clamp(3rem, 8vh, 6rem), border-bottom; ".cap" grid "2.75rem minmax(0,1fr)" (≥1024: "3.5rem minmax(0,4.4fr) minmax(0,5.2fr) minmax(0,1.6fr)", align baseline, padding 2.25rem 0 2.5rem, proof right-aligned with "Proof" on its own line).
- ".tl-row" grid (≥1024 "minmax(0,1fr) minmax(0,3.2fr)", gap 0 3vw); staircase ".tl-body { padding-left: calc(var(--k, 0) * 3.2vw) }" (each older entry steps one tread right); ".tl-kind" accent; ".tl-thesis" ornament face italic 500 accent (v2: text face 300).

### 3.12 Closing band + magnetic e-mail
- ".band" aspect 16/9, min-height 70svh (phone: aspect auto, min-height 78svh), overflow hidden, paper bg; ".gl-host" first child (fx-gl paints, fx-scroll never styles ".gl-canvas"); ".band-copy" absolute left/right var(--pad), bottom 12vh (8vh phone), z 2; h2 max-width 18 display-ch.
- ".sc-email" (display face, min(var(--t-d2), 8vw)): two hairlines 1.5px at bottom 0.02em: ".l1" ink, origin right, retracts scaleX 0 in 0.3s cubic-bezier(0.7,0,0.2,1); ".l2" accent, origin left, draws scaleX 1 in 0.4s cubic-bezier(0.2,1,0.8,1) delay 0.1s; colour → accent 0.3s var(--ease-soft). Reduced motion: ".l2" stays scaleX(0).
- buildMagnetic(): "[data-magnetic]" under "(hover: hover) and (pointer: fine) and " + MOTION; quickTo x/y duration 0.45 ease "power3"; offset = (pointer − centre) × 0.3 (x) / 0.5 (y), clamped ±12px; reset on pointerleave/blur.

### 3.13 Footer
- ".foot" padding-top clamp(4rem, 10vh, 7rem); ".foot-grid" gap 3rem, ≥768 "1fr 1fr", ≥1024 "1.6fr 1fr 1fr"; ".foot h2" text face 300 var(--t-d4) uppercase, overflow clip (rise); "li a" padding-block 0.6rem (FIX A10: 44px targets); ".sc-draw::after" underline 1px currentColor scaleX 0 → 1 0.35s var(--ease-soft); ".legal" flex space-between, padding-bottom + env(safe-area-inset-bottom), its own "[data-rule]".

### 3.14 Case page specifics
- ".page-hero" padding-top calc(var(--hdr) + clamp(3rem, 10vh, 6rem)); ornament margin-left 22vw, size var(--t-d2)*1.1.
- Flip arrival (FIX D5): "html[data-arrive=flip] .nv-sheet" hidden, "[data-case-hero]" visibility hidden until the swap; "html.rv-motion.sc-film .page-hero .page-title / .lead" animate "sc-title-in" (translateY 0.45em + clip-path inset(0 0 100% 0) → inset(−20% −5% −20% −5%)) 1.05s / 0.9s at 0.06s / 0.25s; "[data-reveal=hero]" opacity 0 until rv-ready.
- ".facts" grid gap 4rem 3.5vw (≥768 two columns); ".fact .num" var(--t-d1) weight 300 (500 v1) line-height 0.9.
- ".replaced" 2 columns (4 at ≥768), border-top + per-li border-bottom; ".rp" display face uppercase var(--t-d3) graphite; ".strike" 1px ink at top 52%, origin left. buildStrikes(): "[data-strike]" set scaleX 0; "ScrollTrigger.batch(start 'top 88%', once)" → scaleX 1, 0.7, "expo.out", stagger 0.07, delay 0.45 (draws after the names have risen).
- ".guard li" grid "3rem 1fr"; ".g-n" 1rem 600 stone clip.
- ".next-link .d1" at var(--t-page); hover colour accent, ".arrow" translateX(0.12em) 0.45s.

### 3.15 Sheet + hero hand-over
- ".sc-sheet" (first section after the hero on both pages): position relative, z-index var(--z-sheet), paper bg, "margin-top: calc(-1 * var(--hero-cover, 0px))"; "html[data-home] .sc-sheet::before" 1px top hairline. "--hero-cover" is written on html by fx-hero ("100svh" while the pinned stage is on, removed after), so the sheet rises over the plate.

### 3.16 ScrollTrigger refresh timing and pin/sticky gotchas (from the comments)
- Boot order (fx-core): init(gl, hero, scroll, nav) → await fonts (900 ms budget under intro/arrive, 1500 plain) → build() same order → "ScrollTrigger.refresh()" → emit "fx:built" → entry film (hero.intro / nav.arrive) or plain → "FX.ready" → "fx:ready" (sticky event, late listeners still get it).
- Lines are split in build() BEFORE any entry film measures the page (a split can re-wrap a lead by one line), but only rise after "fx:ready" (linesOpen).
- FIX MQ-02: on "fx:ready" the module calls ST.refresh() and, if window.scrollY moved by more than 2 px, restores it with FX.scrollTo(y0, { immediate: true }) + window.scrollTo + ST.update(): a refresh at hand-over must never move a page the arrival has just placed.
- Rail: no pin, sticky + spacer height in CSS; sizes recomputed on "refreshInit" so start/end functions read fresh "top"; "invalidateOnRefresh: true" on every rail trigger; core sets "ScrollTrigger.config({ ignoreMobileResize: true })".
- FIX A8 (core): crossing 1024 px rebuilds pins/rail via matchMedia; core samples the reader's anchor section on scroll (not during resize), then after 450 ms ST.refresh() + scrollTo the same ratio inside that section.
- A live change of prefers-reduced-motion reloads the page (core).
- SplitText "autoSplit: true" re-splits on width change; onSplit must kill and recreate the trigger and must restore, not replay.
- gsap.killTweensOf / reusing one tween would strip the targets; each pass builds its own tween.
- Reveal base must never hide content on its own: "rv-ready" is only added by this module and removed by core on module failure.
- The ink end is 0.86 of the spare height so the manifesto is read whole before the sheet releases.
- Restoring after a cut inside the runway: a vertical offset only moves the rail, so restore() maps railP back to a scroll position (see 4).

---

## 4. Public API and events of fx-scroll

Registration: "FX.register('scroll', { init(ctx), build(), onVariant(), onResize(e) })". ctx = { FX, gsap, ScrollTrigger, mm (shared gsap.matchMedia), page ("home"|"case"), variant, entry ("intro"|"arrive"|"plain"), arrive (window.__rvArrive) }.

init(ctx): stores G, ST, mm; Split = window.SplitText; sets
"FX.scroll = { exitVisible, enterVisible, restore, tileRect, rebuildText, railProgress, setRailProgress }"; "FX.exits.push(exitVisible)"; initReveal().

build(): preHideLines → buildRules → buildRises → buildMedia → buildParallax → buildBars → buildRail → buildInk → buildStrikes → buildMagnetic → buildLines; then FX.once("fx:ready") → linesOpen = true, flush pending enters, guarded ST.refresh().

onVariant(): rebuildText() (killLines + buildLines + ST.refresh). onResize({ w, h, widthChanged }): if widthChanged, railApi.setP(railApi.st.progress).

Functions:
- exitVisible(o) → Promise. Collects on-screen split lines (shown), ".sc-rise", "[data-reveal].is-in" and ".tile-cap > *:not(.sr-only)"; lines and rises to yPercent −110, 0.3, "power2.in", stagger 0.02; reveals (transition none) opacity 0, y −18, same timing; resolves onComplete or after "gsap.delayedCall(0.75)". Called by fx-nav through "FX.runExits({ dir })" before a cut (fx-nav.js:549).
- enterVisible() → Promise. Re-enters what exitVisible took: lines 112 → 0 (1.05, "expo.out", stagger 0.09), rises 110 → 0 (0.9, stagger 0.05), reveals opacity 1 / y 0 (0.9, stagger 0.05, then clearProps "transition,transform,opacity"); guard 1.4 s. Called by fx-nav after an aborted/returned cut (fx-nav.js:861).
- restore({ y, railP }) → number. ST.refresh(); if railP is a number and y lies within [st.start − 2, st.end + 2] of the rail's move trigger, y = round(st.start + clamp(railP)*(st.end − st.start)); FX.scrollTo(y, { immediate: true }); window.scrollTo(0, y); ST.update(); snapScrubs() (every ScrollTrigger's tween progress(1)); railApi.setP(st.progress); returns y. Called by fx-nav on a "flip-back" arrival (fx-nav.js:662) with a.scrollY / a.railP from the arrival record.
- railProgress() → number|null: the move tween's own progress (scrub lag included) when scrollY is inside the rail range; stored by fx-nav in the record before a flip (fx-nav.js:442).
- setRailProgress(p): railApi.setP(p); used by fx-nav after re-applying the restored position (fx-nav.js:691).
- tileRect(id) → DOMRect-like of "[data-tile-id=id] .tile-media" (for the travelling image geometry).
- rebuildText(): kill + rebuild all line splits, ST.refresh().

Events consumed: "fx:ready" (FX.once) in initReveal, buildMedia (case-hero), build. Events emitted by this module: none. Attributes read: html "data-arrive" ("flip" | "flip-back" | "back"), "data-home", class "sc-film", "[data-nv-arrived]" on a figure, "FX.flags.motion", "FX.isReady". Attributes written: html class "rv-ready"; "data-on" on ".railway", ".rail", ".sc-ink"; custom properties "--rail-len", "--rail-top", "--rail-run" on the railway and "--rail-p" on ".pan". Other FX used: FX.scrollTo(y, { immediate }) (Lenis wrapper), FX.once, FX.exits, FX.register.

---

## 5. Mapping to the Next content layer

### 5.1 Prototype strings already in dict.ts (key → note)
- "Skip to content" → a11y.skipMain (exact).
- "Alberto Tuveri" → header.name.
- "Software & AI Engineer · Creative Lead" → header.role1 (exact; hero label).
- "albertotuveri@gmail.com" → release.email; links "LinkedIn"/"GitHub" → release.links.linkedin / github (and career.ts links.*).
- "© 2026 Alberto Tuveri" → footer.copyright (exact).
- "capture · Sep 2026" → work.captureLabel (proto prints "Home page, captured September 2026." instead).
- "no photograph on file" → work.noPhoto (proto capitalises "No photograph on file").
- "—" → work.none (Voice AI plate figure); "no figure on file" is new.
- "URL: pending" / "Film link: pending" → subform.pendingUrl / pendingFilm (needed for case CTAs of domus-tua, sersan-brand, badante24h).
- "Next line item" → subform.next (proto says "Next work": rename).
- Measured sr-only "to" ≈ measured.pair "Before to after".
- Thesis caption → about.captions.thesis (proto sr-only "Thesis: ").
- Now lead = career.ts experience[0].note.en (exact), not dict intake.positioning (different sentence).
- meta.title / meta.description reusable as is.
Everything else in §1–§2 is NEW copy.

### 5.2 works.ts fields → prototype elements
- title → tile h3 / sr-only, data-pt-label, case h1, next-link title. Needs a SHORT title for brand ("Brand film"), doit ("Voice AI Agent"), supply ("Supply Chain").
- slug → tile href "/work/[slug]", next link.
- org → tile label segment 2 ("SerSan", "ALS MCL Civitanova", "DOIT S.r.l", "University of Camerino"): works.ts org is "SerSan · AI Studio" / "DOIT S.r.l · Fabriano" → needs a short org or a rule.
- Tile label segment 3 ("live at spherenode.com", "RAG mentor", "workshop ERP", "Jun – Sep 2026", "real-estate brand platform", "identity and film", "freelance", "internship", none): partly period (sersan-io), partly orgMeta (badante "Freelance", doit "Internship"), mostly new editorial kicker.
- capture.src / width / height → tile img, data-pt-src / data-pt-hero, case hero (spherenode, sersan-io only).
- study.metrics[0] (value, before, after, unit, label) → plate ".fig" + ".fig-l" (proto texts are shortened: "answer-policy accuracy, from 52%" = label + ", from " + before + unit; "mobile LCP, from 4.75 s" is an abbreviation of "mobile largest-contentful-paint"; badante uses metrics[1] "<1 s" rendered as the word "Sub-second"; supply "roles, built by a team of three" merges metrics[0] and [1]). Decision: add an explicit "plate: { fig, figLabel }" Localized per work or accept derived labels.
- hook → close to tile body / case lead but the proto sentences are shorter and different: new "blurb" (tile body) and "caseLead".
- study.metrics with before/after → ledgers (home: sphere-ai + domus-tua; case: sphere-ai). Bars: pct → --w = value; time → 100% and after/before.
- study.metrics single values → case ".facts" numbers (5, 6, 21, "21 / 49"), but the fact titles/bodies are new fields.
- study.links[0] → overline "Live at …", CTA "Visit …" (pending → dict pendingUrl/pendingFilm).
- stack[] → "Stack" line (proto keeps the CV grouping "Supabase (Postgres, RLS, Realtime, pgvector, Edge Functions)"; works.ts flattens).
- study.summary / problem → case chapter leads (near-verbatim); highlights → guardrails (needs a 5-item array).
- period → tile label (sersan-io), overline (only 3 works have it; SphereNode "Since May 2026" is not on file).
- year, role, phaseRole, access, orgMeta, schematic, source → not used by the prototype (schematic and phaseRole are job-order-world fields).

### 5.3 Prototype facts works.ts lacks
Short title; short org; tile kicker; tile blurb; plate figure + label override; case ornament word ("in production"); case "since" line; case lead; chapter stair titles ("Eight tools, one platform", "It asks before it guesses", "What had to hold at launch"); replaced-tools array (SphereNode); guardrails array (Sphere AI, 5 items); facts array { num, title, body } (SphereNode ×4); figure caption sentence ("Home page, captured September 2026."); next-work blurb; capabilities proof (slug per skill group, on skills.ts); path "kind" (Education / Experience) and composite "where" lines (career.ts has org / role / meta / note separately: composable).

### 5.4 Proposed dict sections for the port (EN keys)
- nav: brand ("Alberto Tuveri"), brandAria ("Alberto Tuveri, home"), work ("Work"), about ("About"), contact ("Contact"), menuOpen ("Open the menu"), menu ("Menu"), close ("Close"), menuAria ("Menu"), writeToMe ("Write to me"), lang ("EN / IT" pieces: en, it, srLabel), index ("Index"), selectedWork ("Selected work"), primaryAria ("Primary").
- preloader: loading ("Loading ·"), fonts ("Fonts"), plus the other stage words fx-hero prints (other slice).
- hero: name ("Alberto Tuveri"), ornament ("engineer"), role ("Software & AI Engineer · Creative Lead"), h1 ("From database schema to real-time WebGPU rendering and motion design."), figCaption ("Fig. 01 · Flow field, rendered live"), still ("Still frame captured from this engine."), posterAlt, ctaWrite ("Write to me"), ctaWork ("Selected work"), ctaAbout ("About").
- now: eyebrow ("Now · since May 2026"), title1 ("Now at"), title2 ("SerSan"), lead (career note), body, link ("sersan.io"), captureAlt.
- rail: eyebrow ("Selected work"), title1 ("Nine works,"), title2 ("on file"), lead, ofAll ("09" or "{n}"), sub ("{nn} · Selected work"), open ("Open" cursor), noPhoto ("No photograph on file"), noFigure ("no figure on file"), and per-work kicker / blurb / plate (in works.ts as Localized, not dict).
- measured: eyebrow ("Evidence"), manifesto ("Measured before and after."), lead, ledger1 { eyebrow ("Sphere AI · SerSan"), title ("Answer reliability, before and after"), lead }, ledger2 { eyebrow ("Domus Tua · real phones"), title ("Fast on the phone in your hand"), lead }, to ("to", sr-only), metric labels come from works.ts.
- capabilities: eyebrow ("Capabilities"), title ("What I build with"), lead ("Eight groups of tools, each tied to the work that proves it."), proof ("Proof"); group names from skills.ts.
- path: eyebrow ("About · path"), title1/2/3 ("Camerino,", "Trento,", "London"), lead, kindEducation ("· Education"), kindExperience ("· Experience"), thesisSr ("Thesis: "); rows from career.ts.
- contact: eyebrow ("Contact"), title ("Write to me."), email (existing release.email), cursor labels ("Visit", "Open", "Next").
- footer: name, bio ("Software & AI Engineer and Creative Lead at SerSan. M.Sc. in Artificial Intelligence Systems at the University of Trento."), elsewhere ("Elsewhere"), linkedin, github, colophon ("Colophon"), colophonLines[] (fonts, stack, edition), copyright (existing), legalNote (replace the prototype disclaimer or drop).
- case: since ("Since {period}"), liveAt ("Live at {host}"), visit ("Visit {host}"), back ("Back to the index"), fig ("Fig. {n} · {host}"), captured ("Home page, captured {month}."), chapterWhat ("{n} · What it is"), replacedAria ("The eight tools it replaced"), replacedBy ("Replaced by "), stack ("Stack"), evalSet ("161-question bilingual evaluation set · before → after"), guardrails ("The guardrails behind the numbers"), chapterReliability ("{n} · Reliability"), nextWork ("Next work"), pendingUrl / pendingFilm (existing), ornament words per work (works.ts).
- about (if a separate /about survives): captions from existing about.captions; otherwise the path section replaces it.
- notFound: title (new wording, the "VOID" stamp is dead), back ("Back to the index").
- a11y: skipMain (existing), langToggle (existing), menuAria, railAria ("Selected work, {n} of {total}").
IT: every new key needs an IT value (shape parity is zod-validated in dev); roles, product names and tool lists stay English in both locales (works.ts / skills.ts rule).

## KEY FACTS
- Home order below the hero: section.now.sc-sheet → section.work#work (rail) → section.sc-ink#measured → section.sc-ledgers (2 ledgers) → section.caps → section#path → section#contact.band → footer.foot; the case page: section.page-hero.sc-sheet → c-what → Sphere AI chapter → Reliability facts → section.next → band → footer.
- Every number on both pages is in PRODUCT.md §3/§9 (52→68, 56→16, 75→94, 32→90, 1.9→0.6, 100%, 4.75→1.74 s, 572→274 ms, 9 roles, 6 phases, 10 portals, 17 scenes, 64 s, 14 scenes, 206/79/33, 21 jobs, 21/49, 10 roles, team of 3); the only editorial associations are the Capabilities Proof mapping and the case overline 'Since May 2026' (SphereNode has no date in the CV).
- Only spherenode and sersan-io have a real capture (public/captures/*-{800,1600}.webp); the other 7 tiles print a typographic plate (.sc-plate: hairline, big figure from metrics[0], figure label, hairline, 'No photograph on file'); Voice AI prints '—' + 'no figure on file'. The case page for the 7 photo-less works is not designed in the prototype.
- The prototype's single case.html merges works.ts 'spherenode' and 'sphere-ai' into one page; the Next site has 9 separate /work/[slug] routes.
- Lines: SplitText.create({ type:'lines', mask:'lines', linesClass:'sc-line', aria:'none', autoSplit:true }); enter yPercent 112→0 expo.out (dur 1.05 / stagger 0.09; lead 0.90 / 0.08; hero-lead delay 0.25; hero delay 0.08); leave-back yPercent −110, 0.4 power2.in, stagger/2; trigger start 'top 86%'; pre-hidden with opacity 0 + visibility hidden; 2500 ms fail-safe unhide.
- Kind 'counter' (the work head, right-aligned .stair-r) adds a counter-parallax on the line masks: xPercent (odd 6→−6, even −4→4), ease none, scrub 0.25, start 'top bottom' end 'bottom top'.
- Rules '[data-rule]' scaleX 0→1, 0.9 expo.out, trigger parentElement start 'top 95%', toggleActions 'play none none reverse'; rises '.sc-rise' yPercent 110→0 via ScrollTrigger.batch start 'top 94%' (0.9 expo.out stagger 0.05; leave-back 0.4 power2.in stagger 0.02); figures are printed final, never counted up.
- Reveal '[data-reveal]': CSS base on html.rv-ready.rv-motion (opacity 0, translateY 2.5rem / 1.5rem mobile), IO threshold 0.12 rootMargin '0px 0px -8% 0px', reversible only downward, gated on fx:ready, inline transition-delay for stagger; data-reveal='hero' released on fx:ready with data-delay ms.
- Media '[data-media]': clipPath inset(100% 0 0 0)→0 1.4 expo.out + img scale 1.15→1 1.6, start 'top 88%' once; 'case-hero' waits for fx:ready and is skipped on a flip arrival / [data-nv-arrived]. Parallax '[data-parallax]': yPercent ±5 (±2.5 under 768) with scale 1.12, scrub true. Bars '[data-bars] .bar i': scaleX 0→1 1.1 expo.out stagger 0.08, start 'top 90%'.
- The rail is a STICKY runway, not a pin: .railway[data-on] height = --rail-len + --rail-run (--rail-run = round(overflow*0.6) px), .rail sticky at --rail-top = round((innerHeight − railH − ixH)/2); move tween track x 0→−overflow ease 'none' (required by containerAnimation), scrub 0.6, invalidateOnRefresh, onUpdate setP(progress); pans xPercent −2.5→2.5; per tile scale 1.08→1 (1.2) + captions y 26→0 (0.9, stagger 0.06) via ScrollTrigger containerAnimation start 'left 90%', leave-back reversed at timeScale 2.5.
- Rail instrument: two mask-rolling digit columns (yPercent −10*digit, 0.45 expo.out), bar inner width 33.34% moved translateX(p*200%), index = floor(p*9)+1; --rail-p is a registered non-inheriting @property written on .pan only. Below 1024 the rail is native horizontal scroll with scroll-snap and the same instrument; ≥1024 with reduced motion or no JS it becomes a 3-column grid and the instrument is hidden.
- Rail tile sizes: phone 76vw 4/5 (photo 16/10), tablet 52vw, desktop --th = min(56vh, 38vw), type tiles th*0.8 wide, photo tiles th*1.6; unroll on entry clipPath inset(0 0 100% 0)→0, 1.1 expo.out, stagger 0.08, trigger wrap 'top 82%', once (skipped on flip-back).
- Measured ink: desktop section height 180vh with a sticky 100vh screen; SplitText words (.sc-w) rest at opacity 0.52 (INK_REST, AA reason) → 1, ease none, stagger 1, scrub 0.6, end '+=' round((sec.offsetHeight − innerHeight)*0.86); mobile split 'lines,words', stagger 0.6, trigger the h2 'top 82%' → 'bottom 45%', scrub 0.5; reduced motion = plain chapter. Nothing translates, only opacity.
- Ledgers: desktop grid 5fr/7fr with .sc-ledger-head sticky top 22vh; m-n sizes sz-2 clamp(2rem, min(5.4vh,3.6vw), 3.6rem) and sz-1 clamp(2.4rem, min(7.5vh,4.6vw), 5.2rem); bar widths: percentages direct, time pairs 100% and after/before (36.6%, 47.9%).
- Case extras: strikes '[data-strike]' scaleX 0→1 0.7 expo.out stagger 0.07 delay 0.45 (batch 'top 88%' once) through the 8 replaced tool names; on a flip arrival the title/lead rise by CSS keyframe sc-title-in (1.05s / 0.9s, delays 0.06s / 0.25s) and [data-lines] inside .page-hero are left out of the split (html.sc-film).
- Magnetic e-mail '[data-magnetic]': quickTo x/y 0.45 power3, offset ×0.3 / ×0.5 clamped ±12 px, pointer-fine + motion only; .sc-email hairlines: ink retracts (0.3s cubic-bezier(0.7,0,0.2,1), origin right), accent draws (0.4s cubic-bezier(0.2,1,0.8,1) +0.1s).
- Public API: FX.scroll = { exitVisible, enterVisible, restore({y, railP}) → y, tileRect(id), rebuildText, railProgress, setRailProgress }; exitVisible is pushed on FX.exits and awaited by fx-nav's FX.runExits before every cut (0.3s power2.in exits, 0.75s guard); enterVisible re-enters after an aborted cut (1.4s guard); restore maps railP back to a scroll position inside the runway, then snaps every scrub tween to progress(1).
- Refresh timing: core does ST.refresh() after build then emits fx:built; the scroll module refreshes again on fx:ready and restores scrollY if it moved >2 px (FIX MQ-02); rail sizes recompute on ScrollTrigger 'refreshInit'; core sets ScrollTrigger.config({ ignoreMobileResize: true }), restores the reader's anchor after crossing 1024 px (FIX A8), and reloads on a prefers-reduced-motion change.
- The sheet: .sc-sheet has margin-top calc(-1 * var(--hero-cover)) where fx-hero writes --hero-cover: 100svh on html while the stage is on; the port's hero must keep that contract or drop the uncover.
- Already in dict.ts: a11y.skipMain, header.name, header.role1, release.email/links, footer.copyright, work.captureLabel, work.noPhoto (lowercase), work.none, subform.pendingUrl/pendingFilm/next, about.captions.thesis; the Now lead equals career.ts experience[0].note.en; almost everything else is new copy and needs an IT twin.
- works.ts lacks: short title (Brand film / Voice AI Agent / Supply Chain), short org, tile kicker, tile blurb, plate override, case ornament word, 'since' line, case lead, chapter stair titles, replaced-tools array, 5-item guardrails, facts {num,title,body}, figure caption sentence, next blurb; skills.ts lacks the Proof slug; career.ts already has every path row (the proto omits the two Boccaccio entries).
- Prototype-only strings that must not ship: 'Prototype for review. Not the live site.', 'Prototype, September 2026', the V2/V3 colophon fonts, 'In this prototype the link returns to the work rail.', and the sr-only 'Language: English. Italian version coming.'

## OPEN QUESTIONS
- What does /work/[slug] look like for the 7 works without a capture (maintech-oma, sphere-ai, domus-tua, sersan-brand, badante24h, doit-voice-ai-agent, agricultural-supply-chain)? The prototype designs only the SphereNode page with a full-bleed photo hero; a plate-style hero and a generic chapter template (summary + stack, metrics ledger, facts) are implied but not drawn.
- Do spherenode and sphere-ai stay two routes, or does the port merge them as the prototype does (one page with chapter 02 = Sphere AI)? If separate, what is chapter 02 of /work/spherenode and what is the hero of /work/sphere-ai?
- Should the case overline for SphereNode say 'Since May 2026' (the SerSan start date) when the CV gives SphereNode no date? Works with a CV period: sersan-io 'Jun – Sep 2026', badante24h 'Jan 2026 – Present', doit 'Nov 2025 – Feb 2026'.
- The Capabilities 'Proof' mapping (Core → Supply chain, Front-End → Domus Tua, 3D → sersan.io, Back-End → Maintech OMA, AI → Sphere AI, Cloud → SphereNode, Testing → Maintech OMA, Creative → Brand film) is editorial; Alberto should confirm it before it is added to skills.ts.
- The path lead says 'professional work since November 2025'; the CV also lists a 2019–2020 network-technician internship and the 2017–2020 diploma (both in career.ts). Keep the prototype's five rows or print the full career.ts?
- Real colophon for the shipped footer (fonts: Cormorant Garamond & Figtree; stack: GSAP, Lenis, WebGPU? WebGL2 is the prototype's band renderer) and whether a colophon stays at all.
- Which plate figure per photo-less work is canonical: the prototype hand-picks and shortens (e.g. badante 'Sub-second' from metrics[1] '<1 s'; supply merges metrics[0] and [1]; domus abbreviates 'mobile LCP'). Add explicit plate fields to works.ts or derive from metrics[0] with a rule?
- Whether the flip / grow page transitions (data-pt, sessionStorage 'rv-pt', data-arrive, --pt-* geometry) are ported: fx-scroll's restore/railProgress/tileRect/exitVisible only matter if fx-nav's cuts are ported too (that is another reader's slice).
- The hero h1 'From database schema to real-time WebGPU rendering and motion design.' paraphrases the CV summary; confirm the wording is acceptable as a site claim (no numbers involved, so check-claims.mjs will not catch it either way).
- IT translations for every new string (all of §1–§2 except the few existing dict keys) are not in the prototype; the proto ships EN only with 'Italian version coming'.

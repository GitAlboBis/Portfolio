"use client";

import { z } from "zod";
import { useUI } from "@/store/ui";

/**
 * Bilingual EN/IT dictionary. Every visible string lives here — never hardcode
 * copy in components. `en` and `it` must share the same shape (validated by zod
 * in dev). Voice (REDESIGN-SPEC §H, stop-slop): plain, factual, no quotables,
 * no eyebrows, no section numbers; a job card, not a manifesto. Roles, product
 * names and technical terms stay in English in both locales (project rule).
 *
 * LAYOUT OF THIS FILE
 *   1. "The job order" sections (REDESIGN-SPEC §H): strip · header · phases ·
 *      band · intake · bench · diagnosis · estimate · work · measured · subform ·
 *      release · about (captions) · footer.copyright · notFound · a11y · meta.
 *   2. LEGACY sections kept so the old components still typecheck until WP-9
 *      deletes them: nav · hero · about.{eyebrow,lead,body} · works · coast ·
 *      ascent · tech · contact · journey · footer.{place,sound,…}.
 *      Marked "// LEGACY — removed in WP-9". Do not build on them.
 */

const localizedPhase = z.object({
  /** Printed name of the phase cell. */
  name: z.string(),
  /** Role tag under the stamp (stays English in both locales). */
  roleTag: z.string(),
});

const sectionSchema = z.object({
  /* ───────────────────────────── The job order (REDESIGN-SPEC §H) ───────────────────────────── */

  /** E.1 header-strip: provenance of the sheet. */
  strip: z.object({
    employer: z.string(),
    date: z.string(),
    status: z.string(),
  }),

  /** E.2 job-order-header: identity fields. */
  header: z.object({
    caption: z.string(),
    name: z.string(),
    roleCaption: z.string(),
    role1: z.string(),
    role2: z.string(),
    degree: z.string(),
  }),

  /** E.3 phase-band: the six phases, keyed by `#phase-<id>` (order: intake → release). */
  phases: z.object({
    intake: localizedPhase,
    diagnosis: localizedPhase,
    estimate: localizedPhase,
    work: localizedPhase,
    test: localizedPhase,
    release: localizedPhase,
  }),

  /** E.3 phase-band chrome. `counter` holds a `{n}` placeholder; `total` is the fixed "6". */
  band: z.object({
    counter: z.string(),
    email: z.string(),
    back: z.string(),
    /** aria-label of the band's `<nav>`. */
    ariaLabel: z.string(),
  }),

  /** E.4 intake: Owner + Current work. */
  intake: z.object({
    ownerCaption: z.string(),
    positioning: z.string(),
    currentCaption: z.string(),
  }),

  /** E.5 test-bench: figure caption, readouts, status words and reason lines. */
  bench: z.object({
    caption: z.string(),
    figure: z.string(),
    readouts: z.object({
      particles: z.string(),
      solver: z.string(),
      render: z.string(),
      frame: z.string(),
      dpr: z.string(),
      tier: z.string(),
    }),
    /** Fixed readout values (method names, same in both locales). */
    values: z.object({
      solver: z.string(),
      render: z.string(),
      frameUnit: z.string(),
    }),
    tier: z.object({ desktop: z.string(), mobile: z.string() }),
    live: z.string(),
    still: z.string(),
    reasonNoGpu: z.string(),
    reasonReduced: z.string(),
    reasonLost: z.string(),
    compiling: z.string(),
  }),

  /** E.6 diagnosis: Findings table. */
  diagnosis: z.object({
    caption: z.string(),
    cols: z.object({ finding: z.string(), fix: z.string(), source: z.string() }),
  }),

  /** E.7 estimate: Parts catalogue. */
  estimate: z.object({
    caption: z.string(),
    cols: z.object({ group: z.string(), qty: z.string(), items: z.string() }),
  }),

  /** E.8 work-performed table (home: 5 rows; /work: all 9). */
  work: z.object({
    caption: z.string(),
    cols: z.object({ item: z.string(), measured: z.string(), role: z.string(), client: z.string(), open: z.string() }),
    more: z.string(),
    noPhoto: z.string(),
    captureLabel: z.string(),
    indexTitle: z.string(),
    /** Measured cell when the CV gives no figure (Voice AI Agent). */
    none: z.string(),
  }),

  /** E.9 test-measured table. */
  measured: z.object({
    caption: z.string(),
    cols: z.object({ item: z.string(), before: z.string(), after: z.string(), source: z.string() }),
  }),

  /** E.12 case-study sub-form on the carbon copy. */
  subform: z.object({
    fields: z.object({
      customer: z.string(),
      job: z.string(),
      problem: z.string(),
      work: z.string(),
      measured: z.string(),
      parts: z.string(),
      links: z.string(),
    }),
    pendingUrl: z.string(),
    pendingFilm: z.string(),
    next: z.string(),
  }),

  /** E.10 release panel (contact). */
  release: z.object({
    caption: z.string(),
    headline: z.string(),
    cta: z.string(),
    email: z.string(),
    links: z.object({ linkedin: z.string(), github: z.string(), sersan: z.string(), spherenode: z.string() }),
    stamp: z.string(),
  }),

  /** E.13 /about — Owner. `captions` is the new sheet; `eyebrow/lead/body` are LEGACY. */
  about: z.object({
    captions: z.object({
      owner: z.string(),
      summary: z.string(),
      experience: z.string(),
      education: z.string(),
      thesis: z.string(),
      languages: z.string(),
      photograph: z.string(),
    }),
    noPhoto: z.string(),
    // LEGACY — removed in WP-9
    eyebrow: z.string(),
    lead: z.string(),
    body: z.string(),
  }),

  /** E.14 404. */
  notFound: z.object({
    title: z.string(),
    stamp: z.string(),
  }),

  /** Screen-reader and skip-link strings. */
  a11y: z.object({
    skip: z.string(),
    /** sr-only suffix on the EN/IT toggle (the visible text must stay in the a11y name). */
    langToggle: z.string(),
  }),

  /** Client mirror of `src/lib/site.ts` `siteMeta` (server metadata cannot import this file). */
  meta: z.object({
    title: z.string(),
    description: z.string(),
  }),

  /** /styleguide — the living sheet (WP-8). Ratios are computed at render time, never typed here. */
  styleguide: z.object({
    title: z.string(),
    lead: z.string(),
    locale: z.object({ en: z.string(), it: z.string() }),
    palette: z.object({
      caption: z.string(),
      cols: z.object({ token: z.string(), hex: z.string(), role: z.string(), chip: z.string() }),
      roles: z.object({
        paper: z.string(),
        paperField: z.string(),
        paperCarbon: z.string(),
        ink: z.string(),
        graphite: z.string(),
        graphiteDeep: z.string(),
        stamp: z.string(),
        stampDeep: z.string(),
        safety: z.string(),
        oil: z.string(),
        ruleSoft: z.string(),
      }),
    }),
    aa: z.object({
      caption: z.string(),
      cols: z.object({ fg: z.string(), bg: z.string(), ratio: z.string(), verdict: z.string(), use: z.string() }),
      pass: z.string(),
      fail: z.string(),
      /** `{n}` placeholder = threshold. */
      normalNote: z.string(),
      largeNote: z.string(),
      forbiddenCaption: z.string(),
      forbiddenNote: z.string(),
      uses: z.object({
        body: z.string(),
        metaPaper: z.string(),
        linkPaper: z.string(),
        onSafety: z.string(),
        stampOnBand: z.string(),
        paperOnStamp: z.string(),
        fieldValues: z.string(),
        metaField: z.string(),
        linkField: z.string(),
        carbonBody: z.string(),
        metaCarbon: z.string(),
        linkCarbon: z.string(),
        forbiddenGraphiteSafety: z.string(),
        forbiddenRedSafety: z.string(),
      }),
    }),
    type: z.object({
      caption: z.string(),
      cols: z.object({ cls: z.string(), sample: z.string(), size: z.string(), axes: z.string() }),
      samples: z.object({ body: z.string(), cell: z.string() }),
    }),
    band: z.object({
      caption: z.string(),
      region: z.string(),
    }),
    motion: z.object({
      caption: z.string(),
      rule: z.object({ label: z.string(), body: z.string() }),
      stamp: z.object({ label: z.string(), body: z.string() }),
    }),
    note: z.string(),
  }),

  /** E.11 footer. `copyright` is the new sheet; the rest is LEGACY. */
  footer: z.object({
    copyright: z.string(),
    // LEGACY — removed in WP-9
    place: z.string(),
    sound: z.string(),
    soundOn: z.string(),
    soundOff: z.string(),
    rights: z.string(),
    email: z.string(),
    top: z.string(),
  }),

  /* ───────────────────────────── LEGACY — removed in WP-9 ─────────────────────────────
   * Old Golden Hour / ocean sections still read by components scheduled for deletion
   * (Nav, MenuOverlay, HeroCopy, About, Tech, Contact, WorksGallery, WorkHorizontal,
   * WorkCaseStudy, AboutJourney, Footer). Nothing new reads them. */
  nav: z.object({
    work: z.string(),
    about: z.string(),
    contact: z.string(),
    menu: z.string(),
    close: z.string(),
    langToggle: z.string(),
    preview: z.object({
      home: z.string(),
      about: z.string(),
      works: z.string(),
      contact: z.string(),
    }),
  }),
  hero: z.object({
    eyebrow: z.string(),
    name: z.string(),
    role: z.string(),
    tagline: z.string(),
    taglineAccent: z.string(),
    scroll: z.string(),
  }),
  works: z.object({
    eyebrow: z.string(),
    title: z.string(),
    open: z.string(),
    problem: z.string(),
    action: z.string(),
    result: z.string(),
    stackLabel: z.string(),
    roleLabel: z.string(),
    wip: z.string(),
    back: z.string(),
    next: z.string(),
    detail: z.string(),
  }),
  coast: z.object({
    eyebrow: z.string(),
    title: z.string(),
    meta: z.string(),
  }),
  ascent: z.object({
    eyebrow: z.string(),
    deep: z.string(),
    breathe: z.string(),
    meta: z.string(),
  }),
  tech: z.object({
    eyebrow: z.string(),
    title: z.string(),
    marquee: z.array(z.string()),
    ariaMarquee: z.string(),
  }),
  contact: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    cta: z.string(),
    email: z.string(),
  }),
  journey: z.object({
    eyebrow: z.string(),
    title: z.string(),
    lead: z.string(),
    bio: z.array(z.string()),
    educationTitle: z.string(),
    education: z.array(z.object({ period: z.string(), title: z.string(), org: z.string() })),
    experienceTitle: z.string(),
    experience: z.array(z.object({ period: z.string(), org: z.string(), role: z.string() })),
    thesisTitle: z.string(),
    thesis: z.string(),
    more: z.string(),
    back: z.string(),
    film: z.object({
      eyebrow: z.string(),
      title: z.string(),
      meta: z.string(),
    }),
  }),
});

export type Dict = z.infer<typeof sectionSchema>;
/** Phase ids in sheet order; the band counter counts them. */
export const PHASE_IDS = ["intake", "diagnosis", "estimate", "work", "test", "release"] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

const EMAIL = "albertotuveri@gmail.com";

const en: Dict = {
  strip: {
    employer: "Sersan Limited · London · Remote",
    date: "Sep 2026",
    status: "Status · OPEN",
  },
  header: {
    caption: "Job order",
    name: "Alberto Tuveri",
    roleCaption: "Role",
    role1: "Software & AI Engineer · Creative Lead",
    role2: "Full-Stack · WebGPU / 3D & Motion",
    degree:
      "B.Sc. Computer Science, University of Camerino, 2026 · M.Sc. Artificial Intelligence Systems, University of Trento, in progress",
  },
  phases: {
    intake: { name: "Intake", roleTag: "Engineer" },
    diagnosis: { name: "Diagnosis", roleTag: "Engineer" },
    estimate: { name: "Estimate", roleTag: "Full-Stack" },
    work: { name: "Work", roleTag: "Creative Lead" },
    test: { name: "Test", roleTag: "Engineer" },
    release: { name: "Release", roleTag: "Contact" },
  },
  band: {
    counter: "{n} / 6",
    email: "Email",
    back: "Job order ↖",
    ariaLabel: "Job order phases",
  },
  intake: {
    ownerCaption: "Owner",
    positioning:
      "I own the front-end, 3D and motion layer of everything SerSan ships, and the AI layer of its live trading platform.",
    currentCaption: "Current work",
  },
  bench: {
    caption: "Test bench",
    figure: "Fluid under test — MLS-MPM · screen-space fluid · confined to a letter-A field · written against the WebGPU API",
    readouts: { particles: "Particles", solver: "Solver", render: "Render", frame: "Frame", dpr: "DPR", tier: "Tier" },
    values: { solver: "MLS-MPM", render: "SSF", frameUnit: "ms" },
    tier: { desktop: "Desktop", mobile: "Mobile" },
    live: "LIVE",
    still: "STILL",
    reasonNoGpu: "Renderer not available on this device",
    reasonReduced: "Renderer paused — reduced motion",
    reasonLost: "Context lost — still frame",
    compiling: "Compiling pipelines…",
  },
  diagnosis: {
    caption: "Findings",
    cols: { finding: "Finding", fix: "Fix", source: "Source" },
  },
  estimate: {
    caption: "Parts catalogue",
    cols: { group: "Part group", qty: "Qty", items: "Items" },
  },
  work: {
    caption: "Work performed",
    cols: { item: "Item", measured: "Measured", role: "Role", client: "Client · period", open: "Open" },
    more: "4 more line items",
    noPhoto: "no photograph on file",
    captureLabel: "capture · Sep 2026",
    indexTitle: "Things I've built",
    none: "—",
  },
  measured: {
    caption: "Measured",
    cols: { item: "Item", before: "Before", after: "After", source: "Source" },
  },
  subform: {
    fields: {
      customer: "Customer",
      job: "Job",
      problem: "Problem reported",
      work: "Work performed",
      measured: "Measured",
      parts: "Parts",
      links: "Links",
    },
    pendingUrl: "URL: pending",
    pendingFilm: "Film link: pending",
    next: "Next line item",
  },
  release: {
    caption: "Release",
    headline: "Hiring, or building something with WebGPU, motion or AI? Write to me.",
    cta: `Email ${EMAIL}`,
    email: EMAIL,
    links: { linkedin: "LinkedIn", github: "GitHub", sersan: "SerSan", spherenode: "SphereNode" },
    stamp: "RELEASED",
  },
  about: {
    captions: {
      owner: "Owner",
      summary: "Summary",
      experience: "Experience",
      education: "Education",
      thesis: "Thesis",
      languages: "Languages",
      photograph: "Photograph",
    },
    noPhoto: "none on file",
    // LEGACY — removed in WP-9
    eyebrow: "01 — About",
    lead: "Calm on the surface. Alive underneath.",
    body: "Five years turning hard problems into things that feel inevitable — full-stack systems, AI pipelines, and the occasional shader. I care about the moment an interface stops feeling like software and starts feeling like a place.",
  },
  notFound: {
    title: "No job order at this address.",
    stamp: "VOID",
  },
  a11y: {
    skip: "Skip to work performed",
    langToggle: "switch language",
  },
  meta: {
    title: "Alberto Tuveri — Software & AI Engineer · Creative Lead",
    description:
      "Software & AI engineer and Creative Lead at SerSan: front-end, WebGPU/3D and motion for production platforms, the AI layer of a live trading platform, brand identity and film.",
  },
  styleguide: {
    title: "Styleguide",
    lead: "The sheet's materials as built: eleven colours, one face at three widths, the yellow region, two motion verbs. Every contrast ratio below is computed when this page renders.",
    locale: { en: "EN", it: "IT" },
    palette: {
      caption: "Palette",
      cols: { token: "Token", hex: "Hex", role: "Role", chip: "Chip" },
      roles: {
        paper: "Ground of the whole site (top sheet)",
        paperField: "Field fill · alternate rows · bench backdrop",
        paperCarbon: "Sub-form ground (carbon copy)",
        ink: "Primary text · every 1px rule · text on yellow",
        graphite: "Meta on paper and fields: provenance, captions, units",
        graphiteDeep: "Meta on the carbon copy",
        stamp: "Stamps on paper · links · arrows",
        stampDeep: "Stamp lettering on the yellow band",
        safety: "Regions only: phase band · readouts · Release · focus ring",
        oil: "Fluid diffuse reference (WGSL constant) · never text",
        ruleSoft: "Hairline between table rows",
      },
    },
    aa: {
      caption: "Contrast · AA",
      cols: { fg: "Text", bg: "Ground", ratio: "Ratio", verdict: "AA", use: "Use" },
      pass: "PASS",
      fail: "FAIL",
      normalNote: "Normal text passes at {n} : 1 or more.",
      largeNote: "Large text (display sizes, stamps) passes at {n} : 1 or more — noted, never relied on.",
      forbiddenCaption: "Forbidden pairs",
      forbiddenNote: "Computed below 4.5 and kept out of the sheet: on yellow the secondary text is ink, and stamps on the band are filled stamp with paper text.",
      uses: {
        body: "Body, headings, values",
        metaPaper: "Meta on paper",
        linkPaper: "Links, arrows, stamps on paper",
        onSafety: "Phases, counter, Email, bench readouts, Release",
        stampOnBand: "Stamp lettering on the band",
        paperOnStamp: "Paper text on a filled stamp (LIVE, RELEASED)",
        fieldValues: "Values in fields, alternate rows",
        metaField: "Meta in fields",
        linkField: "Links in fields",
        carbonBody: "Body on the sub-forms",
        metaCarbon: "Meta on the sub-forms",
        linkCarbon: "Links on the sub-forms",
        forbiddenGraphiteSafety: "Graphite on yellow — use ink instead",
        forbiddenRedSafety: "Light stamp red on yellow — removed from the palette",
      },
    },
    type: {
      caption: "Type · Archivo",
      cols: { cls: "Class", sample: "Specimen", size: "Size", axes: "wdth / wght" },
      samples: {
        body: "Every value has a provenance cell. Numbers are before → after pairs from the CV, set in tabular figures: 4.75 s → 1.74 s.",
        cell: "161-question evaluation · accuracy 52% → 68%",
      },
    },
    band: {
      caption: "Band · safety region",
      region: "Whole region, never a stripe",
    },
    motion: {
      caption: "Motion · two verbs",
      rule: {
        label: "Rule-in",
        body: "A rule is drawn before it is read: 1px ink, scaleX 0 → 1 from the left, then the type appears 90 ms later with no translation. Shown at rest.",
      },
      stamp: {
        label: "Stamp",
        body: "Impact: scale 1.18 → 1, rotate −1° → −3.5°, a blur that settles. One authored impact only — phases on the band, LIVE on the bench, RELEASED in the signature. Shown at rest.",
      },
    },
    note: "Ratios computed at render time from the palette in code · not indexed",
  },
  footer: {
    copyright: "© 2026 Alberto Tuveri",
    // LEGACY — removed in WP-9
    place: "Masua · 39°09′N 8°25′E",
    sound: "Ambient",
    soundOn: "On",
    soundOff: "Off",
    rights: "All rights reserved",
    email: "Email",
    top: "Top",
  },

  // ───────────────────────────── LEGACY — removed in WP-9 ─────────────────────────────
  nav: {
    work: "Work",
    about: "About",
    contact: "Contact",
    menu: "Menu",
    close: "Close",
    langToggle: "switch language",
    preview: { home: "The golden hour", about: "Masua, Sulcis", works: "Selected work", contact: "After sunset" },
  },
  hero: {
    eyebrow: "Software Engineer · Full-stack & AI",
    name: "Alberto Tuveri",
    role: "Full-stack engineer · AI at the edge",
    tagline: "I build interfaces that move like water.",
    taglineAccent: "water",
    scroll: "Scroll to dive",
  },
  works: {
    eyebrow: "Selected Work · 2021—2026",
    title: "Things I've built",
    open: "Open case",
    problem: "The problem",
    action: "What I built",
    result: "The result",
    stackLabel: "Stack",
    roleLabel: "Role",
    wip: "Work in progress",
    back: "All work",
    next: "Next project",
    detail: "Detail",
  },
  coast: {
    eyebrow: "The coast",
    title: "Where the water learned to move.",
    meta: "Pan di Zucchero · Sardinia · 39.96° N, 8.42° E",
  },
  ascent: {
    eyebrow: "The ascent",
    deep: "Hold your breath",
    breathe: "— and breathe.",
    meta: "Below the surface · Pan di Zucchero",
  },
  tech: {
    eyebrow: "02 — Stack",
    title: "The current I work in.",
    marquee: [
      "Full-stack engineering",
      "AI integration",
      "Real-time systems",
      "WebGL & shaders",
      "Design engineering",
      "Interaction",
      "Performance",
    ],
    ariaMarquee: "Fields I work in",
  },
  contact: {
    eyebrow: "03 — Contact",
    headline: "Let's make something that moves.",
    cta: "Write to me",
    email: EMAIL,
  },
  journey: {
    eyebrow: "The long version",
    title: "From the Sulcis coast to systems that move.",
    lead: "Software engineer — full-stack & AI integration.",
    bio: [
      "I'm Alberto, a software engineer who works across the whole stack — from GPU shaders and React front-ends down to PostGIS queries and CI pipelines — with a particular focus on integrating AI into real products.",
      "I grew up in Iglesias, on the Sulcis-Iglesiente coast of Sardinia, where the sea around Pan di Zucchero shaped how I see things: clean lines, deep structure, and a respect for what's underneath the surface.",
      "Recently I've shipped a production PWA that matches families with caregivers across Italy, built a hands-free voice AI agent for Microsoft Teams, and joined SerSan — AI Studio as a software engineer. I care about systems that are fast, secure, and genuinely useful.",
    ],
    educationTitle: "Education",
    education: [
      { period: "2022 — 2026", title: "B.Sc. Computer Science", org: "University of Camerino" },
      { period: "", title: "Technical IT Diploma", org: "Ist. Boccaccio, Iglesias" },
    ],
    experienceTitle: "Experience",
    experience: [
      { period: "May 2026 — present", org: "SerSan · AI Studio", role: "Software Engineer" },
      { period: "Jan 2026", org: "ALS MCL Civitanova", role: "Full-Stack Developer · Freelance" },
      { period: "Nov 2025 — Feb 2026", org: "DOIT · Lodestar Group", role: "AI & Software Developer · Internship" },
      { period: "2019 — 2020", org: "Ist. Boccaccio, Iglesias", role: "Network Technician · Intern" },
    ],
    thesisTitle: "B.Sc. thesis",
    thesis:
      "“From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents” — maps the evolution from code completion to autonomous agentic systems (MCP, RAG, multi-agent orchestration) and proposes Zero-Trust defensive strategies against OS-level attack vectors.",
    more: "Selected work",
    back: "Back to home",
    film: {
      eyebrow: "The rock",
      title: "Engineering, carved into the coast.",
      meta: "Porto Flavia · Masua, Sardinia · est. 1924",
    },
  },
};

const it: Dict = {
  strip: {
    employer: "Sersan Limited · Londra · da remoto",
    date: "Set 2026",
    status: "Stato · APERTO",
  },
  header: {
    caption: "Ordine di lavoro",
    name: "Alberto Tuveri",
    roleCaption: "Ruolo",
    role1: "Software & AI Engineer · Creative Lead",
    role2: "Full-Stack · WebGPU / 3D & Motion",
    degree:
      "Laurea triennale in Informatica, Università di Camerino, 2026 · Laurea magistrale in Artificial Intelligence Systems, Università di Trento, in corso",
  },
  phases: {
    intake: { name: "Accettazione", roleTag: "Engineer" },
    diagnosis: { name: "Diagnosi", roleTag: "Engineer" },
    estimate: { name: "Preventivo", roleTag: "Full-Stack" },
    work: { name: "Lavorazione", roleTag: "Creative Lead" },
    test: { name: "Collaudo", roleTag: "Engineer" },
    release: { name: "Consegna", roleTag: "Contact" },
  },
  band: {
    counter: "{n} / 6",
    email: "Email",
    back: "Ordine di lavoro ↖",
    ariaLabel: "Fasi dell'ordine di lavoro",
  },
  intake: {
    ownerCaption: "Titolare",
    positioning:
      "Costruisco il front-end, il livello 3D e motion di tutto ciò che SerSan mette in produzione, e la parte AI della sua piattaforma di trading live.",
    currentCaption: "Incarichi attuali",
  },
  bench: {
    caption: "Banco prova",
    figure:
      "Fluido in prova — MLS-MPM · screen-space fluid · confinato in un campo a forma di A · scritto direttamente contro l'API WebGPU",
    readouts: { particles: "Particelle", solver: "Solver", render: "Render", frame: "Frame", dpr: "DPR", tier: "Tier" },
    values: { solver: "MLS-MPM", render: "SSF", frameUnit: "ms" },
    tier: { desktop: "Desktop", mobile: "Mobile" },
    live: "LIVE",
    still: "STILL",
    reasonNoGpu: "Renderer non disponibile su questo dispositivo",
    reasonReduced: "Renderer in pausa — movimento ridotto",
    reasonLost: "Contesto perso — fotogramma fisso",
    compiling: "Compilazione delle pipeline…",
  },
  diagnosis: {
    caption: "Rilievi",
    cols: { finding: "Rilievo", fix: "Intervento", source: "Fonte" },
  },
  estimate: {
    caption: "Distinta ricambi",
    cols: { group: "Gruppo", qty: "Q.tà", items: "Voci" },
  },
  work: {
    caption: "Lavori eseguiti",
    cols: { item: "Voce", measured: "Misurato", role: "Ruolo", client: "Cliente · periodo", open: "Apri" },
    more: "Altre 4 voci",
    noPhoto: "nessuna fotografia agli atti",
    captureLabel: "cattura · set 2026",
    indexTitle: "Cose che ho costruito",
    none: "—",
  },
  measured: {
    caption: "Misurato",
    cols: { item: "Voce", before: "Prima", after: "Dopo", source: "Fonte" },
  },
  subform: {
    fields: {
      customer: "Cliente",
      job: "Lavoro",
      problem: "Problema segnalato",
      work: "Lavori eseguiti",
      measured: "Misurato",
      parts: "Ricambi",
      links: "Link",
    },
    pendingUrl: "URL: in attesa",
    pendingFilm: "Link al film: in attesa",
    next: "Voce successiva",
  },
  release: {
    caption: "Consegna",
    headline: "Stai assumendo, o vuoi costruire qualcosa con WebGPU, motion o AI? Scrivimi.",
    cta: `Scrivi a ${EMAIL}`,
    email: EMAIL,
    links: { linkedin: "LinkedIn", github: "GitHub", sersan: "SerSan", spherenode: "SphereNode" },
    stamp: "CONSEGNATO",
  },
  about: {
    captions: {
      owner: "Titolare",
      summary: "Profilo",
      experience: "Esperienza",
      education: "Formazione",
      thesis: "Tesi triennale",
      languages: "Lingue",
      photograph: "Fotografia",
    },
    noPhoto: "nessuna agli atti",
    // LEGACY — removed in WP-9
    eyebrow: "01 — Chi sono",
    lead: "Calmo in superficie. Vivo sotto.",
    body: "Cinque anni a trasformare problemi difficili in cose che sembrano inevitabili — sistemi full-stack, pipeline AI e qualche shader. Mi interessa il momento in cui un'interfaccia smette di sembrare software e inizia a sembrare un luogo.",
  },
  notFound: {
    title: "Nessun ordine di lavoro a questo indirizzo.",
    stamp: "ANNULLATO",
  },
  a11y: {
    skip: "Vai ai lavori eseguiti",
    langToggle: "cambia lingua",
  },
  meta: {
    title: "Alberto Tuveri — Software & AI Engineer · Creative Lead",
    description:
      "Software & AI engineer e Creative Lead in SerSan: front-end, WebGPU/3D e motion per piattaforme in produzione, la parte AI di una piattaforma di trading live, identità di marca e film.",
  },
  styleguide: {
    title: "Styleguide",
    lead: "I materiali del foglio così come sono costruiti: undici colori, una sola famiglia a tre larghezze, la regione gialla, due verbi di movimento. Ogni rapporto di contrasto qui sotto viene calcolato quando la pagina si disegna.",
    locale: { en: "EN", it: "IT" },
    palette: {
      caption: "Tavolozza",
      cols: { token: "Token", hex: "Hex", role: "Ruolo", chip: "Campione" },
      roles: {
        paper: "Fondo di tutto il sito (foglio superiore)",
        paperField: "Riempimento dei campi · righe alterne · fondo del banco",
        paperCarbon: "Fondo dei sotto-moduli (copia carbone)",
        ink: "Testo primario · tutte le righe da 1px · testo sul giallo",
        graphite: "Meta su carta e campi: provenienza, didascalie, unità",
        graphiteDeep: "Meta sulla copia carbone",
        stamp: "Timbri su carta · link · frecce",
        stampDeep: "Lettering dei timbri sulla banda gialla",
        safety: "Solo regioni: banda delle fasi · letture · Consegna · anello di focus",
        oil: "Riferimento diffuso del fluido (costante WGSL) · mai testo",
        ruleSoft: "Filetto tra le righe di tabella",
      },
    },
    aa: {
      caption: "Contrasto · AA",
      cols: { fg: "Testo", bg: "Fondo", ratio: "Rapporto", verdict: "AA", use: "Uso" },
      pass: "PASSA",
      fail: "NON PASSA",
      normalNote: "Il testo normale passa da {n} : 1 in su.",
      largeNote: "Il testo grande (corpi display, timbri) passa da {n} : 1 in su — annotato, mai dato per scontato.",
      forbiddenCaption: "Coppie vietate",
      forbiddenNote: "Calcolate sotto 4,5 e tenute fuori dal foglio: sul giallo il testo secondario è inchiostro, e i timbri sulla banda sono pieni, rossi con testo carta.",
      uses: {
        body: "Corpo, titoli, valori",
        metaPaper: "Meta su carta",
        linkPaper: "Link, frecce, timbri su carta",
        onSafety: "Fasi, contatore, Email, letture del banco, Consegna",
        stampOnBand: "Lettering dei timbri sulla banda",
        paperOnStamp: "Testo carta su timbro pieno (LIVE, CONSEGNATO)",
        fieldValues: "Valori nei campi, righe alterne",
        metaField: "Meta nei campi",
        linkField: "Link nei campi",
        carbonBody: "Corpo dei sotto-moduli",
        metaCarbon: "Meta sui sotto-moduli",
        linkCarbon: "Link sui sotto-moduli",
        forbiddenGraphiteSafety: "Grafite sul giallo — si usa inchiostro",
        forbiddenRedSafety: "Rosso timbro chiaro sul giallo — tolto dalla tavolozza",
      },
    },
    type: {
      caption: "Tipografia · Archivo",
      cols: { cls: "Classe", sample: "Campione", size: "Corpo", axes: "wdth / wght" },
      samples: {
        body: "Ogni valore ha una cella di provenienza. I numeri sono coppie prima → dopo prese dal CV, in cifre tabellari: 4,75 s → 1,74 s.",
        cell: "Valutazione su 161 domande · accuratezza 52% → 68%",
      },
    },
    band: {
      caption: "Banda · regione di sicurezza",
      region: "Regione intera, mai una striscia",
    },
    motion: {
      caption: "Movimento · due verbi",
      rule: {
        label: "Rule-in",
        body: "Una riga viene disegnata prima di essere letta: 1px d'inchiostro, scaleX 0 → 1 da sinistra, poi il testo compare 90 ms dopo senza spostarsi. Mostrato a riposo.",
      },
      stamp: {
        label: "Timbro",
        body: "Impatto: scala 1,18 → 1, rotazione −1° → −3,5°, una sfocatura che si assesta. Un solo impatto d'autore — le fasi sulla banda, LIVE sul banco, CONSEGNATO nella firma. Mostrato a riposo.",
      },
    },
    note: "Rapporti calcolati al momento del rendering dalla tavolozza nel codice · pagina non indicizzata",
  },
  footer: {
    copyright: "© 2026 Alberto Tuveri",
    // LEGACY — removed in WP-9
    place: "Masua · 39°09′N 8°25′E",
    sound: "Ambiente",
    soundOn: "On",
    soundOff: "Off",
    rights: "Tutti i diritti riservati",
    email: "Email",
    top: "Su",
  },

  // ───────────────────────────── LEGACY — removed in WP-9 ─────────────────────────────
  nav: {
    work: "Lavori",
    about: "Chi sono",
    contact: "Contatti",
    menu: "Menu",
    close: "Chiudi",
    langToggle: "cambia lingua",
    preview: { home: "L'ora d'oro", about: "Masua, Sulcis", works: "Lavori scelti", contact: "Dopo il tramonto" },
  },
  hero: {
    eyebrow: "Software Engineer · Full-stack & AI",
    name: "Alberto Tuveri",
    role: "Full-stack engineer · AI sul bordo",
    tagline: "Costruisco interfacce che si muovono come l'acqua.",
    taglineAccent: "acqua",
    scroll: "Scorri per immergerti",
  },
  works: {
    eyebrow: "Lavori scelti · 2021—2026",
    title: "Cose che ho costruito",
    open: "Apri caso",
    problem: "Il problema",
    action: "Cosa ho costruito",
    result: "Il risultato",
    stackLabel: "Stack",
    roleLabel: "Ruolo",
    wip: "In lavorazione",
    back: "Tutti i lavori",
    next: "Prossimo progetto",
    detail: "Dettaglio",
  },
  coast: {
    eyebrow: "La costa",
    title: "Dove l'acqua ha imparato a muoversi.",
    meta: "Pan di Zucchero · Sardegna · 39,96° N, 8,42° E",
  },
  ascent: {
    eyebrow: "La risalita",
    deep: "Trattieni il fiato",
    breathe: "— e respira.",
    meta: "Sotto la superficie · Pan di Zucchero",
  },
  tech: {
    eyebrow: "02 — Stack",
    title: "La corrente in cui lavoro.",
    marquee: [
      "Ingegneria full-stack",
      "Integrazione AI",
      "Sistemi real-time",
      "WebGL & shader",
      "Design engineering",
      "Interazione",
      "Performance",
    ],
    ariaMarquee: "Gli ambiti in cui lavoro",
  },
  contact: {
    eyebrow: "03 — Contatti",
    headline: "Facciamo qualcosa che si muove.",
    cta: "Scrivimi",
    email: EMAIL,
  },
  journey: {
    eyebrow: "La versione lunga",
    title: "Dalla costa del Sulcis a sistemi che si muovono.",
    lead: "Software engineer — full-stack & integrazione AI.",
    bio: [
      "Sono Alberto, un software engineer che lavora su tutto lo stack — dagli shader GPU e i front-end React fino alle query PostGIS e alle pipeline CI — con un focus particolare sull'integrazione dell'AI in prodotti reali.",
      "Sono cresciuto a Iglesias, sulla costa del Sulcis-Iglesiente in Sardegna, dove il mare attorno a Pan di Zucchero ha plasmato il mio modo di vedere le cose: linee pulite, struttura profonda, e rispetto per ciò che sta sotto la superficie.",
      "Di recente ho rilasciato una PWA in produzione che mette in contatto famiglie e caregiver in tutta Italia, ho costruito un agente vocale AI hands-free per Microsoft Teams, e sono entrato in SerSan — AI Studio come software engineer. Mi interessano i sistemi veloci, sicuri e davvero utili.",
    ],
    educationTitle: "Formazione",
    education: [
      { period: "2022 — 2026", title: "Laurea triennale in Informatica", org: "Università di Camerino" },
      { period: "", title: "Diploma tecnico informatico", org: "Ist. Boccaccio, Iglesias" },
    ],
    experienceTitle: "Esperienza",
    experience: [
      { period: "Mag 2026 — oggi", org: "SerSan · AI Studio", role: "Software Engineer" },
      { period: "Gen 2026", org: "ALS MCL Civitanova", role: "Full-Stack Developer · Freelance" },
      { period: "Nov 2025 — Feb 2026", org: "DOIT · Lodestar Group", role: "AI & Software Developer · Tirocinio" },
      { period: "2019 — 2020", org: "Ist. Boccaccio, Iglesias", role: "Tecnico di rete · Tirocinio" },
    ],
    thesisTitle: "Tesi triennale",
    thesis:
      "“From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents” — mappa l'evoluzione dal completamento del codice ai sistemi agentici autonomi (MCP, RAG, orchestrazione multi-agente) e propone strategie difensive Zero-Trust contro i vettori di attacco a livello OS.",
    more: "Lavori scelti",
    back: "Torna alla home",
    film: {
      eyebrow: "La roccia",
      title: "Ingegneria scavata nella costa.",
      meta: "Porto Flavia · Masua, Sardegna · 1924",
    },
  },
};

// Dev-only shape guard: surfaces en/it drift early.
if (process.env.NODE_ENV !== "production") {
  sectionSchema.parse(en);
  sectionSchema.parse(it);
}

export const dict: Record<"en" | "it", Dict> = { en, it };

/** Returns the active-locale dictionary tree. Usage: const t = useDict(); t.header.name */
export function useDict(): Dict {
  const locale = useUI((s) => s.locale);
  return dict[locale];
}

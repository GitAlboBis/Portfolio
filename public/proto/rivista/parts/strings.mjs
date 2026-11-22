/* ==========================================================================
   parts/strings.mjs · the words of the templates, English and Italian side by side
   (rewritten for spec 50, "from zero": the magazine's words left; the night studio's entered)

   ONE place per kind of copy:
     · this file      every word a template prints: the chrome (header, menu, the dawn close, the cuts), the pages,
                      the 404, the case template's own words (UI), the head (META) and the words a script writes (JS)
     · cases.json     the works' content (eleven since wave 7), each field a twin { "en": …, "it": … }

   An entry is { en, it }. assemble.mjs prints it where a partial says {{t:id}} (escaped), or where a template
   module reads it (UI, S404, META). To add a string: add its entry here with both languages, then put {{t:id}} in
   the partial and run node assemble.mjs. The build refuses an entry without its Italian, an id nobody prints, an
   Italian equal to the English that is not marked same: true, and Italian that breaks the typography below.
   WAVE 2 (spec 50 §7): a page lane ADDS its entries with its page's prefix (cover.*, work.*, about.*, co.*, ob.*,
   ct.*), re-reading this file before each edit and never rewriting it whole.

   Flags: html: true  the value is markup (only <em>, <span style="white-space:nowrap"> and entities; the two
                      languages carry the same tags in the same order, except the nowrap span, which is typography)
          same: true  the Italian is the English on purpose (a name, a term of the trade)

   ITALIAN, the house rules: Alberto's own voice, first person where the English is, plain and exact. Sentence case.
   Apostrophe ’ (never '), quotes « », decimal comma, a no-break space ( ) between a number and its unit, months
   lowercase (set 2026). Names of products, technologies and roles stay as they are. Never "ingegnere".
   Every number is the English page's number: scripts/check-claims-proto.mjs compares the two editions.
   ========================================================================== */

/* the two editions. name / edition / current are endonyms (each in its own language), read by the language control */
export const LANGS = {
  en: { code: "EN", dir: "", locale: "en_GB", name: "English", edition: "English edition", current: "English, current language" },
  it: { code: "IT", dir: "it/", locale: "it_IT", name: "Italiano", edition: "Edizione italiana", current: "Italiano, lingua attuale" },
};

const S = {
  /* ---------------------------------------------------------------- chrome: header, menu, language, the cuts */
  "chrome.skip": { en: "Skip to content", it: "Vai al contenuto" },
  "chrome.brand": { en: "Alberto Tuveri, home", it: "Alberto Tuveri, pagina iniziale" },
  "chrome.nav": { en: "Primary", it: "Principale" },
  "lang.group": { en: "Language", it: "Lingua" },
  "menu.open": { en: "Open the menu", it: "Apri il menu" },
  "menu.close": { en: "Close the menu", it: "Chiudi il menu" },
  "menu.word": { en: "Menu", it: "Menu", same: true },
  "menu.word.close": { en: "Close", it: "Chiudi" },
  "menu.dialog": { en: "Menu", it: "Menu", same: true },
  /* the pages: the nav words, the menu items and the names a cut prints on its sheet */
  "sec.work": { en: "Work", it: "Lavori" },
  "sec.caps": { en: "Capabilities", it: "Competenze" },
  "sec.about": { en: "About", it: "Chi sono" },
  "sec.contact": { en: "Contact", it: "Contatti" },
  "sec.consult": { en: "Consulting", it: "Consulenza" },
  "sec.obla": { en: "Obla", it: "Obla", same: true },
  /* (wave 7) the name a cut prints for the home, which holds no index any more */
  "cut.home": { en: "Home", it: "Inizio" },
  "cta.write": { en: "Write to me", it: "Scrivimi" },
  "copy.label": { en: "Copy address", it: "Copia indirizzo" },
  "copy.done": { en: "Copied", it: "Copiato" },
  "copy.fail": { en: "Selected", it: "Selezionato" },
  "copy.done.msg": { en: "Address copied.", it: "Indirizzo copiato." },
  "copy.fail.msg": { en: "The address is selected: copy it from your keyboard or menu.", it: "L’indirizzo è selezionato: copialo dalla tastiera o dal menu." },

  /* ---------------------------------------------------------------- the cover: hero */
  /* the sentence under the name (the id is kept: the share card reads it) */
  "hero.h1": {
    html: true,
    en: 'From database schema to <span style="white-space:nowrap">real-time</span> WebGPU rendering and motion design.',
    it: 'Dallo schema <span style="white-space:nowrap">del database</span> <span style="white-space:nowrap">al rendering</span> WebGPU <span style="white-space:nowrap">in tempo reale</span> <span style="white-space:nowrap">e al motion design.</span>',
  },


  /* ---------------------------------------------------------------- the cover: now */
  "now.eyebrow": { en: "Now, since May 2026", it: "Oggi, da maggio 2026" },
  "now.h.1": { en: "Now at", it: "Oggi in" },
  "now.lead": {
    en: "I own the front-end, WebGPU/3D and motion layer of what the studio ships, the AI work on its flagship platform, and the studio's creative direction.",
    it: "Ho in mano il front-end, il WebGPU/3D e il motion di ciò che lo studio rilascia, il lavoro di AI sulla sua piattaforma di punta e la direzione creativa dello studio.",
  },
  /* (wave 7, lane l-content) the studio's own multi-agent system, built for SerSan (PRODUCT §3 item 10) */
  "now.body": {
    en: "SerSan is a custom software, automation and AI studio: Sersan Limited, London. I work remote, as Software & AI Engineer and Creative Lead, and I built the studio's own multi-agent system, SerSan Agent OS.",
    it: "SerSan è uno studio di software su misura, automazione e AI: Sersan Limited, Londra. Lavoro da remoto, come Software & AI Engineer e Creative Lead, e ho costruito il sistema multi-agente dello studio, SerSan Agent OS.",
  },
  "now.alt": {
    en: "The sersan.io home hero at rest: the hexagonal SerSan mark and the glowing SERSAN wordmark, both drawn in particles, above a raymarched black hole edged by a thin bright ring, on a dark starfield.",
    it: "La schermata d’apertura della home di sersan.io, a riposo: il marchio esagonale SerSan e il logotipo SERSAN luminoso, entrambi disegnati a particelle, sopra un buco nero in raymarching bordato da un sottile anello chiaro, su un campo di stelle scuro.",
  },

  /* ---------------------------------------------------------------- one sentence per page: the cover's index printed
     them until wave 7 (the index is gone); the 404's rows print them now (S404.pages, read by parts/c-main.404.mjs) */
  /* (22 November) Work is its eleven works alone: the measured figures left the page (they stay on their cases) */
  "ix.work": { en: "Eleven works, from the multi-agent system I built for SerSan to my personal project Obla.", it: "Undici lavori, dal sistema multi-agente che ho costruito per SerSan al mio progetto personale Obla." },
  "ix.about": { en: "Eight groups of tools, each tied to the work that proves it, and the path from Camerino to London.", it: "Otto gruppi di strumenti, ciascuno legato al lavoro che lo dimostra, e il percorso da Camerino a Londra." },
  "ix.consult": { en: "Four ways to work with me, for companies and for private individuals.", it: "Quattro modi di lavorare insieme, per aziende e per privati." },
  "ix.obla": { en: "My personal multi-agent system: it listens, works, asks, and reports every morning at 08:00.", it: "Il mio sistema multi-agente personale: ascolta, lavora, chiede e ogni mattina alle 08:00 fa rapporto." },

  /* ---------------------------------------------------------------- Work: the gallery */
  /* (wave 7, lane WORKS) eleven: the multi-agent system built for SerSan leads the SerSan works, Obla (his personal
     project, its plate opening the Obla page) leads the three from outside (PRODUCT §3 items 10-11) */
  "work.head": { en: "Eleven works", it: "Undici lavori" },
  "work.lead": {
    en: "At SerSan, the multi-agent system I built for the studio, a trading platform and its AI mentor, a workshop ERP, a WebGPU studio site, a real-estate platform and a brand film. Then Obla, my personal project, and three projects from outside SerSan.",
    it: "In SerSan, il sistema multi-agente che ho costruito per lo studio, una piattaforma di trading e il suo mentor AI, un ERP d’officina, il sito WebGPU dello studio, una piattaforma immobiliare e un brand film. Poi Obla, il mio progetto personale, e tre progetti esterni.",
  },

  /* ---------------------------------------------------------------- About: the stack */
  "caps.lead": { en: "Eight groups of tools, each tied to the work that proves it.", it: "Otto gruppi di strumenti, ciascuno legato al lavoro che lo dimostra." },
  "cap.1": { en: "Core", it: "Linguaggi" },
  "cap.2": { en: "Front-End", it: "Front-End", same: true },
  "cap.3": { en: "3D & Graphics", it: "3D e grafica" },
  "cap.4": { en: "Back-End & DB", it: "Back-End e DB" },
  "cap.5": { en: "AI", it: "AI", same: true },
  "cap.6": { en: "Cloud & DevOps", it: "Cloud e DevOps" },
  "cap.7": { en: "Testing & Tooling", it: "Strumenti e test" },
  "cap.8": { en: "Creative", it: "Creatività" },
  /* (wave 7, lane l-content) the AI group leads with the multi-agent work and the stack it really uses (PRODUCT §9,
     «Dopo il CV»); the internship's tools are one short mention, written in the partial as a name */
  "cap.5.mas": { en: "Multi-agent systems", it: "Sistemi multi-agente" },
  "cap.5.local": { en: "Local models (llama.cpp)", it: "Modelli locali (llama.cpp)" },
  "cap.5.rag": { html: true, en: "RAG&nbsp;&amp;&nbsp;embeddings", it: "RAG&nbsp;ed&nbsp;embedding" },
  "cap.5.eval": { en: "LLM evaluation & guardrails", it: "Valutazione degli LLM e guardrail" },
  "cap.8.motion": { en: "Motion graphics & VFX (After Effects)", it: "Motion graphics e VFX (After Effects)" },
  "cap.8.video": { en: "Video editing & post-production", it: "Montaggio video e post-produzione" },
  "cap.8.brand": { en: "Brand identity & logo design", it: "Brand identity e logo design" },
  "cap.8.art": { html: true, en: "Art&nbsp;direction", it: "Direzione&nbsp;artistica" },
  "cap.8.type": { en: "Typography", it: "Tipografia" },
  /* (wave 8, FIX2D) the term was written in the partial; it stays in English in Italian too */
  "cap.8.sound": { html: true, en: "Sound&nbsp;design", it: "Sound&nbsp;design", same: true },
  "caps.proof": { en: "Proof", it: "Prova" },

  /* ---------------------------------------------------------------- About: the path */
  "path.h.3": { en: "London", it: "Londra" },
  /* (wave 8, FIX2D) a scene's short name: the header prints it where the heading does not fit the room it leaves the
     scene's name (a phone: about 200 px), never in a smaller type (data-scene-short, read by fx-motion.js) */
  "path.short": { en: "Camerino to London", it: "Da Camerino a Londra" },
  "path.lead": {
    en: "A B.Sc. at Camerino, an M.Sc. in AI Systems at Trento, and professional work since November 2025, remote for a London studio since May 2026.",
    it: "Una laurea triennale a Camerino, una magistrale in AI Systems a Trento e, da novembre 2025, il lavoro: da maggio 2026 da remoto, per uno studio di Londra.",
  },
  "tl.edu": { en: "Education", it: "Formazione" },
  "tl.exp": { en: "Experience", it: "Esperienza" },
  "tl.1.when": { en: "Sep 2026 – Present", it: "set 2026 – oggi" },
  "tl.1.what": { en: "M.Sc. in Artificial Intelligence Systems", it: "Laurea magistrale in Artificial Intelligence Systems" },
  "tl.1.org": { en: "University of Trento", it: "Università di Trento" },
  "tl.1.place": { en: "Trento, Italy", it: "Trento" },
  "tl.2.when": { en: "May 2026 – Present", it: "mag 2026 – oggi" },
  "tl.2.org": { en: "SerSan, AI studio", it: "SerSan, studio AI" },
  "tl.2.co": { en: "Sersan Limited (London)", it: "Sersan Limited (Londra)" },
  "tl.2.mode": { en: "Remote", it: "Da remoto" },
  "tl.3.when": { en: "Jan 2026 – Present", it: "gen 2026 – oggi" },
  "tl.3.what": { en: "Badante24h, a production PWA", it: "Badante24h, una PWA in produzione" },
  "tl.3.place": { en: "Marche, Italy", it: "Marche" },
  "tl.4.when": { en: "Nov 2025 – Feb 2026", it: "nov 2025 – feb 2026" },
  "tl.4.what": { en: "a voice AI agent for Microsoft Teams", it: "un agente vocale AI per Microsoft Teams" },
  "tl.4.mode": { en: "Internship", it: "Tirocinio" },
  "tl.4.place": { en: "Fabriano, Italy", it: "Fabriano" },
  "tl.5.when": { en: "Jan 2022 – Apr 2026", it: "gen 2022 – apr 2026" },
  "tl.5.what": { en: "B.Sc. in Computer Science", it: "Laurea triennale in Informatica" },
  "tl.5.org": { en: "University of Camerino", it: "Università di Camerino" },
  "tl.5.place": { en: "Camerino, Italy", it: "Camerino" },
  "tl.thesis": { en: "Thesis:", it: "Tesi:" },

  /* ---------------------------------------------------------------- Consulting (spec 10 §6.1, as built) */
  "co.h.1": { en: "Four ways", it: "Quattro modi" },
  "co.h.2": { html: true, en: 'to work <span style="white-space:nowrap">with me</span>', it: "di lavorare insieme" },
  "co.short": { en: "Working with me", it: "Lavorare insieme" },
  "co.lead": {
    en: "I help companies and private individuals put today's AI tools to work, from a first video to a team of agents that runs on its own. Each engagement starts from what you need to deliver, not from the tool.",
    it: "Aiuto aziende e privati a mettere al lavoro gli strumenti di AI di oggi, dal primo video a una squadra di agenti che lavora da sola. Ogni incarico parte da ciò che devi consegnare, non dallo strumento.",
  },
  "co.1.name": { en: "AI content generation", it: "Contenuti generati con l’AI" },
  "co.1.line": {
    en: "Images, video and copy made with generative models and directed like any other production: a brief, a look, a review, a delivery.",
    it: "Immagini, video e testi prodotti con modelli generativi e diretti come qualsiasi produzione: un brief, uno stile, una revisione, una consegna.",
  },
  "co.1.proof": { en: "On request", it: "Su richiesta" },
  "co.2.name": { en: "Video editing", it: "Montaggio video" },
  "co.2.line": {
    en: "Editing, motion graphics, colour and sound design for brand films, product videos and social cuts.",
    it: "Montaggio, motion graphics, colore e sound design per brand film, video di prodotto e tagli per i social.",
  },
  "co.3.name": { en: "Claude Code best practice", it: "Claude Code, buone pratiche" },
  "co.3.line": {
    en: "A setup that works, for you or your team: project instructions, skills, hooks, MCP servers and review gates, so the agent follows your rules instead of guessing.",
    it: "Un’impostazione che funziona, per te o per il tuo team: istruzioni di progetto, skill, hook, server MCP e controlli di revisione, così l’agente segue le tue regole invece di tirare a indovinare.",
  },
  "co.4.name": { html: true, en: "Multi-agent systems, built and tested", it: 'Sistemi <span style="white-space:nowrap">multi-agente,</span> sviluppo e collaudo' },
  /* (wave 7, lane l-content) the proof is the system built for SerSan, then Obla (PRODUCT §10, §3 items 10-11): the
     partial prints them as names; the thesis stays in About's path */
  "co.4.line": {
    en: "Systems where several agents share a job: each agent with its role, hand-offs with a brake that calls in a person, a gate on every action that goes out, and tests that show what happens when a part fails. I built one for SerSan, and Obla as my personal project.",
    it: "Sistemi in cui più agenti si dividono un lavoro: ogni agente con il suo ruolo, passaggi di consegna con un freno che fa intervenire una persona, un cancello davanti a ogni azione che esce e test che mostrano che cosa succede quando un pezzo si guasta. Ne ho costruito uno per SerSan, e Obla come progetto personale.",
  },
  "co.closing": { en: "For companies and for private individuals.", it: "Per aziende e per privati." },
  "co.next": { en: "On to Obla", it: "Avanti con Obla" },

  /* ---------------------------------------------------------------- Obla (spec 10 §6.2, as built) */
  "ob.eyebrow": { en: "Personal project", it: "Progetto personale" },
  /* (wave 7, lane l-content) corrected on the code (PRODUCT §11): a chief of staff and named agents, not one voice;
     "anything that leaves the machine waits for my yes" overstated; the flying character (in build) left out */
  "ob.lead": {
    en: "Obla is my personal multi-agent system: one chief of staff I talk to, and the agents it hands the work to, instead of opening sessions, writing prompts and checking on things by hand. It lives on my desktop, runs on my own machine and answers to me alone.",
    it: "Obla è il mio sistema multi-agente personale: un capo di gabinetto a cui parlo e gli agenti a cui passa il lavoro, invece di aprire sessioni, scrivere prompt e controllare tutto a mano. Vive sul mio desktop, gira sulla mia macchina e risponde solo a me.",
  },
  "ob.1.name": { en: "It listens", it: "Ascolta" },
  "ob.1.line": {
    en: "I say its name, or hold a key, and speak. The wake word and the voice chain run locally.",
    it: "Dico il suo nome, o tengo premuto un tasto, e parlo. La parola di attivazione e la catena vocale girano in locale.",
  },
  "ob.2.name": { en: "It thinks", it: "Pensa" },
  "ob.2.line": {
    en: "A small local model answers closed questions, such as which agent takes a job; a second one holds the conversation; only real work goes to Claude Code.",
    it: "Un piccolo modello locale risponde alle domande chiuse, come a quale agente affidare un lavoro; un secondo tiene la conversazione; solo il lavoro vero passa a Claude Code.",
  },
  "ob.3.name": { en: "It works", it: "Lavora" },
  "ob.3.line": {
    en: "Each job goes to the agent that fits it, for code, design, research, content or review: a Claude Code session on the right repository, with the brief already written. The agents hand work on to each other, within limits written in code.",
    it: "Ogni lavoro va all’agente adatto, per il codice, il design, la ricerca, i contenuti o la revisione: una sessione Claude Code sulla repo giusta, con il brief già scritto. Gli agenti si passano il lavoro tra loro, entro limiti scritti nel codice.",
  },
  "ob.4.name": { en: "It asks", it: "Chiede" },
  "ob.4.line": {
    en: "Models propose, code acts: a push, a merge or a deletion waits for my yes on an approval card, and a message to someone else stays a draft until I send it.",
    it: "I modelli propongono, il codice esegue: un push, un merge o una cancellazione aspettano il mio sì su una carta di approvazione, e un messaggio per qualcun altro resta una bozza finché non lo invio io.",
  },
  "ob.5.name": { en: "It reports", it: "Riferisce" },
  "ob.5.line": {
    en: "Every morning at 08:00: jobs, sessions, approvals, spending and what each agent did, spoken or written. What it remembers is kept in Markdown notes I can read and edit.",
    it: "Ogni mattina alle 08:00: lavori, sessioni, approvazioni, spesa e che cosa ha fatto ogni agente, a voce o per iscritto. Ciò che ricorda sta in note Markdown che posso leggere e modificare.",
  },
  "ob.f1.k": { en: "Runs on", it: "Gira su" },
  "ob.f1.v": {
    en: "Windows, TypeScript on Node.js, Rust and Tauri, llama.cpp with local models, the Claude Agent SDK and MCP, SQLite, Obsidian",
    it: "Windows, TypeScript su Node.js, Rust e Tauri, llama.cpp con modelli locali, Claude Agent SDK e MCP, SQLite, Obsidian",
  },
  "ob.f2.k": { en: "For", it: "Per" },
  "ob.f2.v": { en: "One person. Not distributed.", it: "Una persona sola. Non è distribuito." },
  "ob.alt": {
    en: "Obla's character: a pale pillow with a scalloped lower edge and two tall oval eyes.",
    it: "Il personaggio di Obla: un cuscino chiaro con l’orlo inferiore a onde e due occhi ovali alti.",
  },

  /* ---------------------------------------------------------------- Contact, and the dawn close of every other page */
  "band.h": { en: "Write to me.", it: "Scrivimi." },
  "ct.line": { en: "For a role, a project, or one of the four ways to work together.", it: "Per un ruolo, un progetto o uno dei quattro modi di lavorare insieme." },
  "dawn.engine": {
    en: "The light and the glass are drawn live by an engine written directly against the GPU API, in WebGPU.",
    it: "La luce e il vetro sono disegnati dal vivo da un motore scritto direttamente sull’API della GPU, in WebGPU.",
  },
  /* Contact's own legal line: the page has no glass and no light, only ink (spec 50 §4, scene "contact") */
  "ct.engine": {
    en: "The ink is drawn live by an engine written directly against the GPU API, in WebGPU.",
    it: "L’inchiostro è disegnato dal vivo da un motore scritto direttamente sull’API della GPU, in WebGPU.",
  },
  "foot.top": { en: "Back to top", it: "Torna su" },

  /* ---------------------------------------------------------------- the case template's own words (UI) */
  "ui.work": { en: "Work", it: "Lavori" },
  /* (wave 8, FIX2D) the 404's way back: the home holds no index any more (the cut's card calls it "cut.home") */
  "ui.backHome": { en: "Back to the home page", it: "Torna alla pagina iniziale" },
  "ui.allWork": { en: "All works", it: "Tutti i lavori" },
  "ui.more": { en: "More work", it: "Altri lavori" },
  "ui.open": { en: "Open", it: "Apri" },
  "ui.openCase": { en: "Open the case", it: "Apri il caso" },
  /* (wave 7, lane WORKS) the gallery's verb for a work that is a page of the site already (Obla) */
  "ui.openPage": { en: "Open its page", it: "Apri la sua pagina" },
  "ui.onFile": { en: "The record", it: "La scheda" },
  "ui.next": { en: "Next", it: "Prossimo" },
  "ui.thisCase": { en: "This case", it: "Questo caso" },
  "ui.lower": { en: "Lower is better", it: "Meno è meglio" },
  "ui.tiny": { en: "Too small to draw on this scale.", it: "Troppo piccolo per essere disegnato a questa scala." },
  "ui.to": { en: "to", it: "a" },   // read between a before and an after ("52% to 68%")

  /* ---------------------------------------------------------------- the 404 */
  "nf.over": { en: "Error 404", it: "Errore 404" },
  "nf.title": { en: "Not found.", it: "Non trovata." },
  "nf.lead": {
    en: "The page you asked for does not exist. Every page and every work is listed below.",
    it: "La pagina che cerchi non esiste. Qui sotto trovi ogni pagina e ogni lavoro.",
  },
  /* (wave 8, FIX2D) the title of the 404's list of pages (it was "Index": the home holds no index any more) */
  "nf.pages": { en: "Pages", it: "Pagine" },
  /* the 404's own legal line (parts/c-footer.404.html): this page has no stage, so it draws nothing live */
  "nf.engine": {
    en: "This page is type alone. On every other page the light and the glass are drawn live by an engine written directly against the GPU API, in WebGPU.",
    it: "Questa pagina è solo testo. Su ogni altra pagina la luce e il vetro sono disegnati dal vivo da un motore scritto direttamente sull’API della GPU, in WebGPU.",
  },

  /* ---------------------------------------------------------------- the head: titles, descriptions, share texts */
  "meta.home.title": { en: "Alberto Tuveri — Software & AI Engineer, Creative Lead", it: "Alberto Tuveri — Software & AI Engineer, Creative Lead", same: true },
  "meta.home.desc": {
    en: "Software & AI Engineer and Creative Lead at SerSan, across the entire stack: from database schema design and security hardening to real-time WebGPU rendering and motion design.",
    it: "Software & AI Engineer e Creative Lead in SerSan, su tutto lo stack: dalla progettazione dello schema del database e dall’hardening di sicurezza al rendering WebGPU in tempo reale e al motion design.",
  },
  /* the share cards, redrawn in the night studio (integrate lane, 2026-11-10); their alt texts describe them as drawn */
  "meta.home.ogAlt": {
    en: "Alberto Tuveri, Software & AI Engineer and Creative Lead: the name across the card in white condensed capitals on a near-black ground, and the line: from database schema to real-time WebGPU rendering and motion design.",
    it: "Alberto Tuveri, Software & AI Engineer e Creative Lead: il nome attraverso la card in maiuscole condensate bianche su un fondo quasi nero, e la riga: dallo schema del database al rendering WebGPU in tempo reale e al motion design.",
  },
  "meta.work.desc": {
    en: "Eleven works by Alberto Tuveri, from the multi-agent system he built for SerSan to a brand film and his personal project Obla.",
    it: "Undici lavori di Alberto Tuveri, dal sistema multi-agente che ha costruito per SerSan a un brand film e al suo progetto personale Obla.",
  },
  "meta.about.desc": {
    en: "What Alberto Tuveri builds with, eight groups of tools each tied to the work that proves it, and his path from Camerino and Trento to a London studio.",
    it: "Con cosa costruisce Alberto Tuveri, otto gruppi di strumenti ciascuno legato al lavoro che lo dimostra, e il suo percorso da Camerino e Trento a uno studio di Londra.",
  },
  "meta.consult.desc": {
    en: "Four ways to work with Alberto Tuveri: AI content generation, video editing, Claude Code best practice, and multi-agent systems built and tested.",
    it: "Quattro modi di lavorare con Alberto Tuveri: contenuti generati con l’AI, montaggio video, buone pratiche di Claude Code e sistemi multi-agente, sviluppo e collaudo.",
  },
  "meta.obla.desc": {
    en: "Obla, Alberto Tuveri's personal project: a multi-agent system on his own machine that listens, thinks, works, asks for his yes and reports every morning at 08:00.",
    it: "Obla, il progetto personale di Alberto Tuveri: un sistema multi-agente sulla sua macchina che ascolta, pensa, lavora, chiede il suo sì e ogni mattina alle 08:00 riferisce.",
  },
  "meta.contact.desc": {
    en: "Write to Alberto Tuveri at albertotuveri@gmail.com, or find him on LinkedIn and GitHub.",
    it: "Scrivi ad Alberto Tuveri all’indirizzo albertotuveri@gmail.com, o trovalo su LinkedIn e GitHub.",
  },
  /* {name} the work, {fig} its picture in words (the share card, as it is drawn today) */
  "meta.case.ogAlt": {
    en: "{name}, a work by Alberto Tuveri, set in white condensed capitals on a near-black ground beside its picture: {fig}",
    it: "{name}, un lavoro di Alberto Tuveri, in maiuscole condensate bianche su un fondo quasi nero accanto alla sua immagine: {fig}",
  },
  "meta.case.ogPlate": { en: "{figure} {line}, set large as the case's key words", it: "{figure} {line}, in grande come parole chiave del caso" },
  "meta.home.role": { en: "Software & AI Engineer · Creative Lead", it: "Software & AI Engineer · Creative Lead", same: true },

  /* ---------------------------------------------------------------- words a script writes (head: #rv-i18n, read by FX.t) */
  /* the stage's instrument line (fx-stage.js writes "{n} points · {ms} ms GPU" with FX.t) */
  "js.instr.gpu": { en: "{ms} ms GPU", it: "{ms} ms GPU", same: true },
  "js.stage.points": { en: "{n} points", it: "{n} punti" },
};

export default S;

/* the views the template modules read: the same entries, under their short keys */
const view = (prefix) => Object.fromEntries(Object.keys(S).filter((k) => k.startsWith(prefix)).map((k) => [k.slice(prefix.length), S[k]]));
/* the case template's words (parts/c-main.case.mjs, parts/c-main.404.mjs) */
export const UI = view("ui.");
/* the words a script writes, one object per language (assemble.mjs prints it as #rv-i18n) */
export const jsWords = (lang) => Object.fromEntries(Object.keys(S).filter((k) => k.startsWith("js.")).map((k) => [k.slice(3), S[k][lang] != null ? S[k][lang] : S[k].en]));
/* the 404's words, in the shape parts/c-main.404.mjs prints them */
export const S404 = {
  over: S["nf.over"],
  title: S["nf.title"],
  lead: S["nf.lead"],
  back: S["ui.backHome"],
  write: S["cta.write"],
  pagesTitle: S["nf.pages"],
  open: S["ui.open"],
  work: S["ui.work"],
  home: S["cut.home"],
  /* the pages, each with its sentence ("ix.*", printed by the cover's index until wave 7, now by the 404 alone; the
     contact page: its own sentence) */
  pages: {
    work: [S["sec.work"], S["ix.work"]], about: [S["sec.about"], S["ix.about"]], consult: [S["sec.consult"], S["ix.consult"]],
    obla: [S["sec.obla"], S["ix.obla"]], contact: [S["sec.contact"], S["ct.line"]],
  },
};
/* ids a template module reads without a {{t:}} token: assemble.mjs counts them as printed */
export const READ_BY_MODULES = ["ui.", "nf.", "meta.", "js.", "band.", "ix."];

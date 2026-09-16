import type { Localized } from "@/content/works";

/**
 * findings.ts — rows of the Diagnosis table ("Findings": finding | fix | source),
 * REDESIGN-SPEC §E.6. Every row is a defect Alberto found and closed, transcribed
 * from the September 2026 CV (PRODUCT.md §9): the numbers (6, 206, 79, 33, 21, 5,
 * 3, 4.75 s, 1.74 s, 572 ms, 274 ms) are the CV's own. `work` is the slug of the
 * job in `works.ts` the finding belongs to. Product names and technical terms
 * stay in English in both locales (project rule).
 */
export type Finding = {
  /** Slug of the work in `works.ts`. */
  work: string;
  finding: Localized;
  fix: Localized;
  /** Provenance cell: employer · year. */
  source: Localized;
};

const SERSAN_2026: Localized = { en: "SerSan · 2026", it: "SerSan · 2026" };

export const findings: Finding[] = [
  {
    work: "spherenode",
    finding: {
      en: "6 access-control defects on a paywalled product before public launch: an unauthenticated leak of the Elite portfolio dashboard, a tier leak exposing 206 live sessions and 79 transcripts to free accounts, a permission rule letting any member edit or unpublish any live course.",
      it: "6 difetti di access control su un prodotto a pagamento prima del lancio pubblico: un leak non autenticato della dashboard portafoglio Elite, un leak di tier che esponeva 206 sessioni live e 79 trascrizioni agli account gratuiti, una regola di permessi che lasciava a qualunque membro modificare o rimuovere qualsiasi corso live.",
    },
    fix: {
      en: "All 6 closed before launch; a 33-finding security audit remediated in one batch.",
      it: "Tutti e 6 chiusi prima del lancio; un audit di sicurezza da 33 finding rimediato in un unico batch.",
    },
    source: SERSAN_2026,
  },
  {
    work: "spherenode",
    finding: {
      en: "21 scheduled jobs dead for weeks while every dashboard still reported success.",
      it: "21 job schedulati fermi da settimane mentre ogni dashboard segnalava ancora successo.",
    },
    fix: {
      en: "Root-caused; monitoring and alerting built so the same failure cannot go unnoticed again.",
      it: "Causa individuata; costruiti il monitoring e l'alerting perché lo stesso guasto non possa più passare inosservato.",
    },
    source: SERSAN_2026,
  },
  {
    work: "spherenode",
    finding: {
      en: "Payments-to-entitlement pipeline: access surviving cancellation, disputes and unknown events defaulting to open, empty lookups downgrading paying users, duplicate rows stranding paid customers, out-of-order events resurrecting revoked access.",
      it: "Pipeline pagamenti → entitlement: accessi che sopravvivevano alla cancellazione, dispute ed eventi sconosciuti che aprivano l'accesso per default, lookup vuoti che declassavano utenti paganti, righe duplicate che bloccavano clienti paganti, eventi fuori ordine che resuscitavano accessi revocati.",
    },
    fix: {
      en: "Rebuilt as a tested state machine; 5 revenue-critical defects closed.",
      it: "Riscritta come state machine testata; 5 difetti critici per il fatturato chiusi.",
    },
    source: SERSAN_2026,
  },
  {
    work: "maintech-oma",
    finding: {
      en: "The first database test suite written against the security model exposed 3 live defects.",
      it: "La prima suite di test sul database scritta contro il modello di sicurezza ha fatto emergere 3 difetti reali.",
    },
    fix: {
      en: "Fixed before they reached production.",
      it: "Corretti prima che arrivassero in produzione.",
    },
    source: SERSAN_2026,
  },
  {
    work: "maintech-oma",
    finding: {
      en: "High-severity privilege escalation: any user with price access could alter where supplier credentials were sent.",
      it: "Privilege escalation ad alta severità: qualunque utente con accesso ai prezzi poteva cambiare la destinazione delle credenziali dei fornitori.",
    },
    fix: {
      en: "Closed.",
      it: "Chiusa.",
    },
    source: SERSAN_2026,
  },
  {
    work: "domus-tua",
    finding: {
      en: "Mobile delay traced to the cookie banner: largest-contentful-paint 4.75 s, blocking time 572 ms on real phones.",
      it: "Ritardo su mobile ricondotto al cookie banner: largest-contentful-paint 4,75 s, blocking time 572 ms su telefoni reali.",
    },
    fix: {
      en: "Intro rebuilt to run in CSS rather than JavaScript: LCP 1.74 s, blocking time 274 ms.",
      it: "Intro riscritta per girare in CSS invece che in JavaScript: LCP 1,74 s, blocking time 274 ms.",
    },
    source: SERSAN_2026,
  },
];

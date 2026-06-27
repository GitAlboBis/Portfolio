export type Lang = "en" | "it";

/*
  Full bilingual dictionary — the content contract every section consumes
  (docs/03 i18n, docs/07 content). en.ts and it.ts MUST satisfy this type.
  Section components read t.<section>.<key>; project/skill content lives in
  src/data/projects.ts and src/data/skills.ts as { en, it } fields.
*/
export type Dictionary = {
  meta: { eyebrow: string };
  a11y: {
    skipToContent: string;
    /** Accessible name for the primary navigation landmark. */
    primaryNav: string;
    /** Accessible name for the EN/IT language toggle group. */
    languageGroup: string;
    /** Accessible name for the hamburger when the menu is closed. */
    openMenu: string;
    /** Accessible name for the hamburger when the menu is open. */
    closeMenu: string;
    /** Accessible name for the mobile menu dialog. */
    menuDialog: string;
    /** Accessible name for the monogram link back to the hero. */
    home: string;
  };
  nav: {
    work: string;
    about: string;
    skills: string;
    contact: string;
    cta: string;
  };
  hero: {
    role: string;
    tagline: string;
    scrollCue: string;
  };
  intro: {
    eyebrow: string;
    heading: string;
    body1: string;
    body2: string;
  };
  cinematic: {
    eyebrow: string;
    caption: string;
  };
  work: {
    eyebrow: string;
    heading: string;
    lead: string;
    wip: string;
    roleLabel: string;
    stackLabel: string;
  };
  skills: {
    eyebrow: string;
    heading: string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    lead: string;
    emailCta: string;
    availability: string;
  };
  footer: {
    tagline: string;
    builtWith: string;
    location: string;
    rights: string;
  };
  notFound: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    errorTitle: string;
    errorBody: string;
    errorCta: string;
  };
  gauge: {
    surface: string;
    seabed: string;
  };
};

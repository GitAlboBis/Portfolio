export type Lang = "en" | "it";

/*
  Shape of the bilingual dictionary. Every visible string passes through here
  (docs/03-ARCHITECTURE.md i18n, docs/07-PROJECTS.md content). Extend per section
  as the UI grows; en.ts and it.ts must stay in sync with this type.
*/
export type Dictionary = {
  meta: { eyebrow: string };
  hero: { role: string; tagline: string };
  nav: { work: string; about: string; contact: string };
};

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { en } from "@/data/translations/en";
import { it } from "@/data/translations/it";
import type { Lang } from "@/data/translations/types";

/*
  Bespoke in-world 404 — Cinematic Ocean. A lone Fraunces "404" sea-stack on the
  abyss, an editorial "Lost at sea" line, and a single foam CTA back to surface.
  Self-contained: it reads the `lang` cookie directly (not the LanguageProvider
  context) so it renders correctly even outside the provider tree.
*/
function readLang(): Lang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)lang=(en|it)/);
  return (match?.[1] as Lang) ?? "en";
}

export default function NotFound() {
  // Default to EN for the server-rendered pass, then sync to the cookie on mount
  // to avoid a hydration mismatch.
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(readLang()), []);

  const t = (lang === "it" ? it : en).notFound;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-abyss px-6 py-24 text-foam">
      {/* Giant translucent Fraunces "A" sea-stack, bleeding off-frame */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] -top-[18%] select-none font-display font-medium leading-none text-celeste/[0.07]"
        style={{ fontSize: "clamp(20rem, 48vw, 52rem)" }}
      >
        A
      </span>

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="heading-1 mt-6">{t.title}</h1>
        <p className="lead mt-6 max-w-md">{t.body}</p>
        <div className="mt-10">
          <Button variant="signal" href="/">
            {t.cta}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { en } from "@/data/translations/en";
import { it } from "@/data/translations/it";
import type { Lang } from "@/data/translations/types";

/*
  Route-segment error boundary (Cinematic Ocean). Mirrors the 404 look — a
  Fraunces "A" sea-stack on the abyss with an in-world "The current pulled under"
  line and a reset CTA. Self-contained: reads the `lang` cookie directly so it
  works even if the failure happened above the LanguageProvider.
*/
function readLang(): Lang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)lang=(en|it)/);
  return (match?.[1] as Lang) ?? "en";
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(readLang());
    // Surface the error for diagnostics (no PII, just the digest/message).
    console.error(error);
  }, [error]);

  const t = (lang === "it" ? it : en).notFound;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-abyss px-6 py-24 text-foam">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] -top-[18%] select-none font-display font-medium leading-none text-celeste/[0.07]"
        style={{ fontSize: "clamp(20rem, 48vw, 52rem)" }}
      >
        A
      </span>

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="heading-1 mt-6">{t.errorTitle}</h1>
        <p className="lead mt-6 max-w-md">{t.errorBody}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button variant="signal" onClick={() => reset()}>
            {t.errorCta}
            <span aria-hidden="true">↻</span>
          </Button>
          <Button variant="outline" href="/">
            {t.cta}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
        {error.digest ? (
          <p className="label mt-10 text-mist/60">{error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}

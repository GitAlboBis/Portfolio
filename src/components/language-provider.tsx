"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { en } from "@/data/translations/en";
import { it } from "@/data/translations/it";
import type { Dictionary, Lang } from "@/data/translations/types";

const DICTS: Record<Lang, Dictionary> = { en, it };
const COOKIE = "lang";

type Ctx = { lang: Lang; t: Dictionary; setLang: (l: Lang) => void };
const LanguageContext = createContext<Ctx | null>(null);

/*
  i18n EN/IT via React context + cookie persistence (no /en /it routing).
  initialLang comes from the server layout reading the `lang` cookie.
  See docs/03-ARCHITECTURE.md.
*/
export function LanguageProvider({
  initialLang = "en",
  children,
}: {
  initialLang?: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = l;
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: DICTS[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}

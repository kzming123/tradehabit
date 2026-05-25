"use client";

import {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
  type ReactNode,
} from "react";
import en from "./dictionaries/en.json";
import zh from "./dictionaries/zh.json";

export type Locale = "en" | "zh";
type Dict = typeof en;

const DICTIONARIES: Record<Locale, Dict> = { en, zh: zh as Dict };
const STORAGE_KEY = "tradehabit_locale";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") return stored;
  } catch {}
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("zh")) {
    return "zh";
  }
  return "en";
}

// Walk dotted key path on a dictionary; returns the key itself if missing.
function lookup(dict: unknown, path: string): string {
  const parts = path.split(".");
  let node: unknown = dict;
  for (const p of parts) {
    if (typeof node !== "object" || node === null) return path;
    node = (node as Record<string, unknown>)[p];
  }
  return typeof node === "string" ? node : path;
}

interface LanguageCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
}

const Ctx = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  // Resolve initial locale on the client after mount to avoid SSR/CSR mismatch
  useEffect(() => {
    setLocaleState(detectInitialLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    }
  }, []);

  // Keep <html lang> in sync once locale resolves
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale, ready]);

  const t = useCallback((key: string): string => {
    const value = lookup(DICTIONARIES[locale], key);
    // Fall back to English if the key is missing from the active dictionary
    if (value === key && locale !== "en") return lookup(DICTIONARIES.en, key);
    return value;
  }, [locale]);

  const tf = useCallback((key: string, vars: Record<string, string | number>): string => {
    const base = t(key);
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
      base
    );
  }, [t]);

  const value = useMemo(() => ({ locale, setLocale, t, tf }), [locale, setLocale, t, tf]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT must be used within <LanguageProvider>");
  return ctx;
}

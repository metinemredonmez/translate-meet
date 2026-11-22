"use client";

/**
 * Tiny TR/EN translation provider (adapted from the kit's two-language panel part).
 * - The UI language is a UI preference only and lives in localStorage; nothing auth-related
 *   is ever stored there (WEB-05).
 * - Missing keys fall back to Turkish, then to the key itself, so the screen is never blank.
 * - Server data (emails, provider names, audit detail) is never translated.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "@/messages/en";
import tr from "@/messages/tr";
import type { MessageKey, Messages } from "@/messages/types";

export type Lang = "tr" | "en";
export const LANGS: readonly Lang[] = ["tr", "en"];
export const DEFAULT_LANG: Lang = "tr";
export const LANG_STORAGE_KEY = "tm-panel:lang";

const DICTS: Record<Lang, Messages> = { tr, en };

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

function lookup(dict: Messages, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const text = lookup(DICTS[lang], key) ?? lookup(DICTS[DEFAULT_LANG], key);
  return text === undefined ? key : interpolate(text, vars);
}

/** Audit action label, or the raw code when the dictionary has none. */
export function auditActionLabel(lang: Lang, action: string): string {
  const labels = DICTS[lang].audit.actions as Record<string, string>;
  return labels[action] ?? (DICTS[DEFAULT_LANG].audit.actions as Record<string, string>)[action] ?? action;
}

function readStoredLang(): Lang {
  try {
    const value = window.localStorage.getItem(LANG_STORAGE_KEY);
    return value === "tr" || value === "en" ? value : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG);

  // Read after mount so the first client render matches the server HTML.
  useEffect(() => {
    if (initialLang) return;
    const stored = readStoredLang();
    setLangState(stored);
  }, [initialLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    if (!LANGS.includes(next)) return;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Storage blocked: still switch for this page view.
    }
    setLangState(next);
  }, []);

  const t = useCallback<Translate>((key, vars) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    lang: DEFAULT_LANG,
    setLang: () => undefined,
    t: (key, vars) => translate(DEFAULT_LANG, key, vars),
  };
}

/**
 * Tiny dictionary-based i18n (no library). Only the app's own strings are translated here;
 * server-provided text is shown as-is.
 */
import { useCallback } from 'react';
import { tr, type DictKey, type Dictionary } from './tr';
import { en } from './en';
import { useSettings } from '@/store/settings';

import { DEFAULT_LANGUAGE, type AppLanguage } from './locale';

export { APP_LANGUAGES, DEFAULT_LANGUAGE, deviceLanguage, parseLanguage } from './locale';
export type { AppLanguage } from './locale';
export type { DictKey };

const DICTS: Record<AppLanguage, Dictionary> = { tr, en };

export type Params = Record<string, string | number>;

export function translate(lang: AppLanguage, key: DictKey, params?: Params): string {
  const template = DICTS[lang][key] ?? DICTS[DEFAULT_LANGUAGE][key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m,
  );
}

/** Non-hook access (e.g. outside components). */
export function t(key: DictKey, params?: Params): string {
  return translate(useSettings.getState().appLanguage, key, params);
}

export function useI18n() {
  const lang = useSettings((s) => s.appLanguage);
  const setLang = useSettings((s) => s.setAppLanguage);
  const tt = useCallback((key: DictKey, params?: Params) => translate(lang, key, params), [lang]);
  return { t: tt, lang, setLang };
}

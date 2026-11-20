import { NativeModules, Platform } from 'react-native';

export type AppLanguage = 'tr' | 'en';
export const APP_LANGUAGES: AppLanguage[] = ['tr', 'en'];
export const DEFAULT_LANGUAGE: AppLanguage = 'tr';
/** "en-US", "tr_TR", "EN" → supported app language, else null. */
export function parseLanguage(raw: unknown): AppLanguage | null {
  if (typeof raw !== 'string') return null;
  const root = raw.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return (APP_LANGUAGES as string[]).includes(root) ? (root as AppLanguage) : null;
}

/** Device language; never throws (called at startup). */
export function deviceLanguage(): AppLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const fromIntl = parseLanguage(locale);
    if (fromIntl) return fromIntl;
  } catch {
    /* Hermes without Intl — fall through */
  }
  try {
    const nm = NativeModules as Record<string, { settings?: Record<string, unknown>; localeIdentifier?: string } | undefined>;
    if (Platform.OS === 'ios') {
      const s = nm.SettingsManager?.settings;
      const langs = s?.AppleLanguages;
      const v = parseLanguage(s?.AppleLocale) ?? parseLanguage(Array.isArray(langs) ? langs[0] : undefined);
      if (v) return v;
    } else {
      const v = parseLanguage(nm.I18nManager?.localeIdentifier);
      if (v) return v;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE;
}


import type { DictKey } from '@/i18n';

/** Conversation/translation languages (BCP-47 short codes). */
export const LANGUAGES = ['tr', 'en', 'ar', 'de', 'ru', 'fr', 'es'] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export function languageLabelKey(code: LanguageCode): DictKey {
  return `language.${code}` as DictKey;
}

import type { Locale } from "@/lib/routes";
import { en } from "./en";
import { tr, type Dictionary } from "./tr";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Replaces {name} placeholders. Unknown placeholders are left as-is. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

import type { Lang, Translate } from "./i18n";

const LOCALES: Record<Lang, string> = { tr: "tr-TR", en: "en-GB" };

export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(LOCALES[lang]).format(value);
}

/** Backend timestamps are UTC; SQLite drops the offset, so an offset-less ISO string is read as UTC. */
export function parseUtc(iso: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso);
  return new Date(hasZone || !iso.includes("T") ? iso : `${iso}Z`);
}

export function formatDateTime(lang: Lang, iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = parseUtc(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** "2026-11-22" -> short weekday + day, read as UTC so the bar matches the backend day. */
export function formatDay(lang: Lang, day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(LOCALES[lang], { weekday: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

export function formatDuration(t: Translate, totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} ${t("duration.h")} ${m} ${t("duration.m")}`;
  if (m > 0) return `${m} ${t("duration.m")} ${sec} ${t("duration.s")}`;
  return `${sec} ${t("duration.s")}`;
}

/** Detail is a JSON string written by the backend; show it as plain "key: value" text. */
export function formatDetail(detail: string | null): string {
  if (!detail) return "";
  try {
    const parsed: unknown = JSON.parse(detail);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join(" · ");
    }
    return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
  } catch {
    return detail;
  }
}

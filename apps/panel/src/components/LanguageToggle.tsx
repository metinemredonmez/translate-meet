"use client";

import { LANGS, useI18n } from "@/lib/i18n";

/** TR / EN switch (kit part 05). */
export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("lang.change")} className="flex items-center rounded-full border border-border p-0.5">
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          title={t(`lang.${code}`)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
            lang === code ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import BarChart from "@/components/BarChart";
import { Card, EmptyState, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { formatDay, formatDuration, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/useApi";
import type { MessageKey } from "@/messages/types";

type Metric = "translations" | "realtime_seconds";

export default function OverviewPage() {
  const { t, lang } = useI18n();
  const { data, error, loading, reload } = useApi((signal) => adminApi.stats(signal), []);
  const [metric, setMetric] = useState<Metric>("translations");

  if (loading && !data) return <Loading />;
  if (error && !data) {
    return (
      <>
        <PageHeader title={t("overview.title")} />
        <ErrorNote error={error} onRetry={reload} />
      </>
    );
  }
  if (!data) return null;

  const cards: { label: MessageKey; value: string }[] = [
    { label: "overview.usersTotal", value: formatNumber(lang, data.users_total) },
    { label: "overview.usersNew7d", value: formatNumber(lang, data.users_new_7d) },
    { label: "overview.usersDisabled", value: formatNumber(lang, data.users_disabled) },
    { label: "overview.translationsToday", value: formatNumber(lang, data.translations_today) },
    { label: "overview.translations7d", value: formatNumber(lang, data.translations_7d) },
    { label: "overview.textCharsToday", value: formatNumber(lang, data.text_chars_today) },
    { label: "overview.realtimeToday", value: formatDuration(t, data.realtime_seconds_today) },
  ];

  const metricLabel = metric === "translations" ? t("overview.metricTranslations") : t("overview.metricRealtime");
  const chartData = data.daily_7d.map((p) => {
    const value = metric === "translations" ? p.translations : p.realtime_seconds;
    return { label: formatDay(lang, p.day), value, display: formatNumber(lang, value) };
  });

  const providers = Object.entries(data.by_provider_7d).sort((a, b) => b[1] - a[1]);
  const providerTotal = providers.reduce((sum, [, n]) => sum + n, 0);

  return (
    <>
      <PageHeader title={t("overview.title")} />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label} className="rounded-2xl border border-border/60 bg-surface p-4">
            <p className="text-sm text-fg-muted">{t(c.label)}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">{c.value}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-fg">{t("overview.chartTitle")}</h2>
            <div role="group" aria-label={t("overview.metric")} className="flex rounded-lg border border-border p-0.5">
              {(["translations", "realtime_seconds"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={metric === m}
                  onClick={() => setMetric(m)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    metric === m ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {m === "translations" ? t("overview.metricTranslations") : t("overview.metricRealtime")}
                </button>
              ))}
            </div>
          </div>
          <BarChart
            data={chartData}
            ariaLabel={t("overview.chartAria", { metric: metricLabel })}
            labelHeader={t("overview.day")}
            valueHeader={t("overview.value")}
          />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-fg">{t("overview.byProvider")}</h2>
          {providers.length === 0 ? (
            <EmptyState title={t("overview.byProviderEmpty")} />
          ) : (
            <ul className="space-y-3">
              {providers.map(([name, count]) => {
                const pct = providerTotal ? Math.round((count / providerTotal) * 100) : 0;
                return (
                  <li key={name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-fg">{name}</span>
                      <span className="tabular-nums text-fg-muted">
                        {formatNumber(lang, count)} · {t("overview.share", { percent: pct })}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border/40" aria-hidden>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

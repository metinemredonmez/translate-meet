"use client";

import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import UserActions from "@/components/UserActions";
import { Badge, Card, EmptyState, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/useApi";
import type { MessageKey } from "@/messages/types";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function UserDetailPage() {
  const { t, lang } = useI18n();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? safeDecode(params.id) : "";
  const { data, error, loading, reload, setData } = useApi((signal) => adminApi.user(id, signal), [id]);

  const back = (
    <Link href="/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
      <ArrowLeft aria-hidden className="h-4 w-4" />
      {t("user.back")}
    </Link>
  );

  if (error instanceof ApiError && error.status === 404) {
    return (
      <>
        {back}
        <EmptyState icon={<SearchX aria-hidden className="h-5 w-5" />} title={t("user.notFoundTitle")} description={t("user.notFoundBody")} />
      </>
    );
  }
  if (error && !data) {
    return (
      <>
        {back}
        <ErrorNote error={error} onRetry={reload} />
      </>
    );
  }
  if (loading && !data) return <>{back}<Loading /></>;
  if (!data) return null;

  const rows: { label: MessageKey; value: ReactNode }[] = [
    { label: "user.id", value: <span className="font-mono text-xs">{data.id}</span> },
    { label: "user.email", value: data.email ?? t("common.none") },
    { label: "user.provider", value: data.provider },
    { label: "user.locale", value: data.locale },
    { label: "user.createdAt", value: formatDateTime(lang, data.created_at) },
    {
      label: "user.status",
      value: data.disabled ? <Badge tone="danger">{t("users.disabled")}</Badge> : <Badge tone="success">{t("users.active")}</Badge>,
    },
    { label: "user.disabledAt", value: formatDateTime(lang, data.disabled_at) },
    { label: "user.translationsTotal", value: formatNumber(lang, data.translations_total) },
    { label: "user.textCharsToday", value: formatNumber(lang, data.text_chars_today) },
    { label: "user.realtimeToday", value: formatDuration(t, data.realtime_seconds_today) },
    { label: "user.activeSessions", value: formatNumber(lang, data.active_sessions) },
  ];

  return (
    <>
      {back}
      <PageHeader title={data.email ?? t("user.title")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label}>
                <dt className="text-xs uppercase tracking-wide text-fg-muted">{t(r.label)}</dt>
                <dd className="mt-1 break-words text-sm text-fg">{r.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold text-fg">{t("user.actions")}</h2>
          <UserActions user={data} onUpdated={setData} />
        </Card>
      </div>
    </>
  );
}

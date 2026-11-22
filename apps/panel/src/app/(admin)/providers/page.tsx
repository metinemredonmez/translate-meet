"use client";

import { CheckCircle2, PlugZap, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { adminApi, type Schemas } from "@/lib/api";
import { ApiError, errorKey } from "@/lib/errors";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { canManage, useAdmin } from "@/lib/session";
import { useApi } from "@/lib/useApi";
import type { MessageKey } from "@/messages/types";

type Check = Schemas["ProviderCheck"];

export default function ProvidersPage() {
  const { t, lang } = useI18n();
  const admin = useAdmin();
  const manage = canManage(admin);
  const { data, error, loading, reload } = useApi((signal) => adminApi.providers(signal), []);
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<MessageKey | null>(null);

  async function runCheck() {
    if (checking || !manage) return;
    setChecking(true);
    setCheckError(null);
    try {
      const results = await adminApi.checkProviders();
      setChecks(Object.fromEntries(results.map((r) => [r.name, r])));
      setCheckedAt(new Date().toISOString());
    } catch (err) {
      setCheckError(err instanceof ApiError && err.status === 429 ? "providers.rateLimited" : errorKey(err));
    } finally {
      setChecking(false);
    }
  }

  if (loading && !data) return <Loading />;
  if (error && !data) {
    return (
      <>
        <PageHeader title={t("providers.title")} />
        <ErrorNote error={error} onRetry={reload} />
      </>
    );
  }
  if (!data) return null;

  // Providers that answered the check but are not in the configured chain (e.g. echo in dev).
  const extra = Object.values(checks).filter((c) => !data.chain.some((p) => p.name === c.name));

  return (
    <>
      <PageHeader
        title={t("providers.title")}
        actions={
          manage ? (
            <Button onClick={runCheck} disabled={checking}>
              <PlugZap aria-hidden className="h-4 w-4" />
              {checking ? t("providers.checking") : t("providers.check")}
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <p className="text-sm text-fg-muted">{t("providers.active")}</p>
        <p className="mt-1 font-mono text-base text-fg">{data.translator_provider}</p>
        <p className="mt-3 text-xs text-fg-muted">{manage ? t("providers.checkHint") : t("providers.viewerNote")}</p>
      </Card>

      <div aria-live="polite" className="mb-4 space-y-1 text-sm">
        {checkError ? (
          <p role="alert" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-warning">
            {t(checkError)}
          </p>
        ) : null}
        {checkedAt ? <p className="text-fg-muted">{t("providers.checkedAt", { time: formatDateTime(lang, checkedAt) })}</p> : null}
      </div>

      {data.chain.length === 0 && extra.length === 0 ? (
        <EmptyState title={t("providers.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">{t("providers.chain")}</caption>
            <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t("providers.name")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("providers.configured")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("providers.model")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("providers.result")}</th>
              </tr>
            </thead>
            <tbody>
              {[...data.chain.map((p) => ({ ...p, extra: false })), ...extra.map((c) => ({ name: c.name, configured: null, model: null, extra: true }))].map(
                (p) => {
                  const check = checks[p.name];
                  return (
                    <tr key={p.name} className="border-b border-border/30 last:border-0">
                      <th scope="row" className="px-4 py-3 font-medium text-fg">{p.name}</th>
                      <td className="px-4 py-3">
                        {p.configured === null ? (
                          t("common.none")
                        ) : p.configured ? (
                          <Badge tone="success">{t("common.yes")}</Badge>
                        ) : (
                          <Badge tone="warning">{t("common.no")}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fg">{p.model ?? t("common.none")}</td>
                      <td className="px-4 py-3">
                        {!check ? (
                          <span className="text-fg-muted">{t("providers.notChecked")}</span>
                        ) : check.ok ? (
                          <span className="inline-flex items-center gap-1.5 text-success">
                            <CheckCircle2 aria-hidden className="h-4 w-4" />
                            {t("providers.ok")}
                            {check.latency_ms !== null ? (
                              <span className="tabular-nums text-fg-muted">
                                · {t("providers.latency", { ms: formatNumber(lang, check.latency_ms) })}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="inline-flex flex-col gap-0.5 text-danger">
                            <span className="inline-flex items-center gap-1.5">
                              <XCircle aria-hidden className="h-4 w-4" />
                              {t("providers.failed")}
                            </span>
                            {check.error ? <span className="break-words text-xs text-fg-muted">{check.error}</span> : null}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

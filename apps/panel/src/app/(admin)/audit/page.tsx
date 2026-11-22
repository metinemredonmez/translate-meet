"use client";

/** Read-only audit log with action filter and paging (adapted from kit part 11). */
import { ScrollText } from "lucide-react";
import { useId, useState } from "react";
import { EmptyState, ErrorNote, Loading, PageHeader, Pagination, inputClass } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { formatDateTime, formatDetail } from "@/lib/format";
import { auditActionLabel, useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/useApi";
import tr from "@/messages/tr";

const PAGE_SIZE = 50;
const ACTIONS = Object.keys(tr.audit.actions);

export default function AuditPage() {
  const { t, lang } = useI18n();
  const filterId = useId();
  const [paging, setPaging] = useState({ action: "", page: 1 });
  const { action, page } = paging;
  const { data, error, loading, reload } = useApi(
    (signal) => adminApi.audit({ page, page_size: PAGE_SIZE, action: action || undefined }, signal),
    [action, page],
  );

  return (
    <>
      <PageHeader title={t("audit.title")} />
      <div className="mb-4 max-w-xs">
        <label htmlFor={filterId} className="mb-1 block text-sm font-medium text-fg">
          {t("audit.filter")}
        </label>
        <select
          id={filterId}
          value={action}
          onChange={(e) => setPaging({ action: e.target.value, page: 1 })}
          className={inputClass}
        >
          <option value="">{t("audit.all")}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {auditActionLabel(lang, a)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorNote error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : data && data.items.length === 0 ? (
        <EmptyState icon={<ScrollText aria-hidden className="h-5 w-5" />} title={action ? t("audit.emptyFiltered") : t("audit.empty")} />
      ) : data ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface" aria-busy={loading}>
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t("audit.time")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("audit.actor")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("audit.action")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("audit.target")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("audit.ip")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("audit.detail")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/30 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-fg">{formatDateTime(lang, row.created_at)}</td>
                    <td className="px-4 py-3 text-fg">
                      {row.actor_email ?? <span className="text-fg-muted">{row.actor_type === "system" ? t("audit.system") : row.actor_type}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-fg">{auditActionLabel(lang, row.action)}</div>
                      <div className="font-mono text-xs text-fg-muted">{row.action}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg">
                      {row.target_type ? `${row.target_type}:${row.target_id ?? ""}` : t("common.none")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-fg">{row.ip ?? t("common.none")}</td>
                    <td className="max-w-xs break-words px-4 py-3 text-xs text-fg-muted">{formatDetail(row.detail) || t("common.none")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pageSize={data.page_size}
            total={data.total}
            onPage={(p) => setPaging({ action, page: p })}
            disabled={loading}
          />
        </>
      ) : null}
    </>
  );
}

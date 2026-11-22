"use client";

/** Server-paged user list with debounced search (adapted from kit part 09). */
import { Download, Search, UserX } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Badge, Button, EmptyState, ErrorNote, Loading, PageHeader, Pagination, inputClass } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useApi, useDebounced } from "@/lib/useApi";

const PAGE_SIZE = 25;

export default function UsersPage() {
  const { t, lang } = useI18n();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim(), 300);
  // The page number belongs to one search term: a new term starts again at page 1.
  const [paging, setPaging] = useState({ q: "", page: 1 });
  const page = paging.q === q ? paging.page : 1;
  const setPage = (next: number) => setPaging({ q, page: next });

  const { data, error, loading, reload } = useApi(
    (signal) => adminApi.users({ q: q || undefined, page, page_size: PAGE_SIZE }, signal),
    [q, page],
  );

  function exportCsv() {
    if (!data) return;
    const csv = toCsv(
      ["id", "email", "provider", "created_at", "disabled", "translations_total"],
      data.items.map((u) => [u.id, u.email, u.provider, u.created_at, u.disabled, u.translations_total]),
    );
    downloadCsv(`translate-meet-users-p${data.page}.csv`, csv);
  }

  return (
    <>
      <PageHeader
        title={t("users.title")}
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={!data || data.items.length === 0}>
            <Download aria-hidden className="h-4 w-4" />
            {t("users.exportCsv")}
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <label htmlFor={searchId} className="mb-1 block text-sm font-medium text-fg">
          {t("users.search")}
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <input
            id={searchId}
            type="search"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className={`${inputClass} pl-9`}
            autoComplete="off"
          />
        </div>
      </div>

      {error ? (
        <ErrorNote error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<UserX aria-hidden className="h-5 w-5" />}
          title={q ? t("users.emptySearch") : t("users.empty")}
          description={q ? t("users.emptyHint") : undefined}
        />
      ) : data ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface" aria-busy={loading}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t("users.email")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("users.provider")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("users.createdAt")}</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">{t("users.translations")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("users.status")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-surface-raised">
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${encodeURIComponent(u.id)}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                        aria-label={t("users.open", { email: u.email ?? u.id })}
                      >
                        {u.email ?? t("users.noEmail")}
                      </Link>
                      <div className="font-mono text-xs text-fg-muted">{u.id}</div>
                    </td>
                    <td className="px-4 py-3 text-fg">{u.provider}</td>
                    <td className="px-4 py-3 text-fg">{formatDateTime(lang, u.created_at)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg">{formatNumber(lang, u.translations_total)}</td>
                    <td className="px-4 py-3">
                      {u.disabled ? <Badge tone="danger">{t("users.disabled")}</Badge> : <Badge tone="success">{t("users.active")}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} disabled={loading} />
        </>
      ) : null}
    </>
  );
}

"use client";

/** Small shared building blocks. All colours come from the token-backed Tailwind theme. */
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { errorKey } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary: "border border-border bg-surface-raised text-fg hover:bg-surface",
  danger: "bg-danger text-surface-raised hover:bg-danger/90",
  ghost: "text-fg hover:bg-surface",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}

export const inputClass =
  "w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border/60 bg-surface p-5 ${className}`}>{children}</section>;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type Tone = "neutral" | "success" | "danger" | "warning" | "primary";
const TONES: Record<Tone, string> = {
  neutral: "bg-border/30 text-fg",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/15 text-warning",
  primary: "bg-primary/15 text-primary",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <p role="status" className="flex items-center gap-2 py-6 text-sm text-fg-muted">
      <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      {label ?? t("common.loading")}
    </p>
  );
}

/** Human error text for a failed request; raw messages are never shown (kit part 06). */
export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />
      <span className="flex-1">{t(errorKey(error))}</span>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}

/** Dashed empty-state card (kit part 04). */
export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border px-6 py-8">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon ?? <Inbox aria-hidden className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-base font-medium text-fg">{title}</p>
          {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  disabled,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label={t("common.pagination")} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-fg-muted">
        {t("common.pageOf", { page, pages })} · {t("common.total", { total })}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>
          {t("common.prev")}
        </Button>
        <Button variant="secondary" disabled={disabled || page >= pages} onClick={() => onPage(page + 1)}>
          {t("common.next")}
        </Button>
      </div>
    </nav>
  );
}

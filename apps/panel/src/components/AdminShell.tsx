"use client";

/**
 * Auth-guarded frame: sidebar + top bar (adapted from kit parts 01 and 02).
 * GET /v1/admin/me decides whether anything is shown; a 401 from it (or from any later
 * request) sends the browser to /login via the API client.
 */
import { Activity, LayoutDashboard, Languages, LogOut, Menu, ScrollText, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminApi } from "@/lib/api";
import { ApiError, errorKey } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";
import { SessionProvider, type Admin } from "@/lib/session";
import type { MessageKey } from "@/messages/types";
import LanguageToggle from "./LanguageToggle";
import { Badge, Button, ErrorNote, Loading } from "./ui";

const NAV: { href: string; label: MessageKey; icon: typeof Users }[] = [
  { href: "/", label: "nav.overview", icon: LayoutDashboard },
  { href: "/users", label: "nav.users", icon: Users },
  { href: "/providers", label: "nav.providers", icon: Activity },
  { href: "/audit", label: "nav.audit", icon: ScrollText },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("nav.label")} className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-primary text-on-primary" : "text-fg hover:bg-surface-raised"
            }`}
          >
            <Icon aria-hidden className="h-4 w-4 shrink-0" />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <Languages aria-hidden className="h-6 w-6 text-primary" />
      <div className="leading-tight">
        <p className="font-semibold text-fg">{t("app.name")}</p>
        <p className="text-xs text-fg-muted">{t("app.panel")}</p>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<MessageKey | null>(null);

  const loadMe = useCallback((signal?: AbortSignal) => {
    setLoadError(null);
    adminApi
      .me({ signal })
      .then(setAdmin)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // 401 already redirected by the API client; keep showing the loader meanwhile.
        if (err instanceof ApiError && err.status === 401) return;
        setLoadError(err);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadMe(controller.signal);
    return () => controller.abort();
  }, [loadMe]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function logout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await adminApi.logout();
      router.replace("/login");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login"); // session was already gone
        return;
      }
      setLogoutError(errorKey(err));
      setLoggingOut(false);
    }
  }

  if (!admin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        {loadError ? <ErrorNote error={loadError} onRetry={() => loadMe()} /> : <Loading label={t("login.checking")} />}
      </main>
    );
  }

  return (
    <SessionProvider admin={admin}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        {t("app.skipToContent")}
      </a>
      <div className="flex min-h-dvh">
        <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-surface md:block">
          <div className="sticky top-0">
            <Brand />
            <Sidebar pathname={pathname} />
          </div>
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <div aria-hidden className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <aside id="mobile-menu" className="relative h-full w-64 border-r border-border/60 bg-surface shadow-xl">
              <div className="flex items-center justify-between pr-3">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={t("nav.closeMenu")}
                  className="rounded-lg p-2 text-fg-muted hover:bg-surface-raised"
                >
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>
              <Sidebar pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("nav.openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="rounded-lg p-2 text-fg hover:bg-surface md:hidden"
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="flex min-w-0 items-center gap-2" aria-label={t("top.account")}>
              <span className="hidden truncate text-sm text-fg sm:inline" title={admin.email}>
                {admin.email}
              </span>
              <Badge tone={admin.role === "admin" ? "primary" : "neutral"}>{t(`role.${admin.role}`)}</Badge>
            </div>
            <LanguageToggle />
            <Button variant="secondary" onClick={logout} disabled={loggingOut}>
              <LogOut aria-hidden className="h-4 w-4" />
              <span>{loggingOut ? t("top.loggingOut") : t("top.logout")}</span>
            </Button>
          </header>
          <div aria-live="polite" className="px-4 md:px-6">
            {logoutError ? <p className="mt-3 text-sm text-danger">{t(logoutError)}</p> : null}
          </div>
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 focus:outline-none md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

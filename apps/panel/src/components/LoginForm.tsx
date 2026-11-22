"use client";

/**
 * Two-step admin sign-in: email + password -> mfa_token (kept in memory only),
 * then the 6-digit TOTP code -> the API sets the httpOnly session cookie.
 * Errors are deliberately generic: nothing tells whether an email exists (AUT-02).
 */
import { KeyRound, Languages, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminApi } from "@/lib/api";
import { ApiError, errorKey } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/messages/types";
import { safeNext } from "@/lib/navigation";
import { Button, inputClass } from "./ui";
import LanguageToggle from "./LanguageToggle";

type Step = "credentials" | "mfa";

function nextTarget(): string {
  if (typeof window === "undefined") return "/";
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}

export default function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Already signed in? Skip the form. A 401 here is the normal case and stays silent.
  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .me({ redirectOn401: false, signal: controller.signal })
      .then(() => router.replace(nextTarget()))
      .catch(() => undefined);
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (step === "mfa") codeRef.current?.focus();
  }, [step]);

  async function submitCredentials(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("login.required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const out = await adminApi.login({ email: email.trim(), password });
      setMfaToken(out.mfa_token);
      setPassword(""); // do not keep the password around once it served its purpose
      setStep("mfa");
    } catch (err) {
      setError(err instanceof ApiError && (err.status === 401 || err.status === 422) ? "login.invalid" : errorKey(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !mfaToken) return;
    if (!/^\d{6}$/.test(code)) {
      setError("login.codeFormat");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminApi.mfa({ mfa_token: mfaToken, code });
      setMfaToken(null);
      router.replace(nextTarget());
    } catch (err) {
      setCode("");
      setError(err instanceof ApiError && (err.status === 401 || err.status === 422) ? "login.invalidCode" : errorKey(err));
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep("credentials");
    setMfaToken(null);
    setCode("");
    setPassword("");
    setError(null);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-fg">
          <Languages aria-hidden className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">{t("app.name")}</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 shadow-sm">
        {step === "credentials" ? (
          <form onSubmit={submitCredentials} noValidate aria-labelledby="login-title">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound aria-hidden className="h-5 w-5 text-primary" />
              <h1 id="login-title" className="text-xl font-semibold text-fg">
                {t("login.title")}
              </h1>
            </div>
            <p className="mb-5 text-sm text-fg-muted">{t("login.subtitle")}</p>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-fg">
              {t("login.email")}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={320}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} mb-4`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-fg">
              {t("login.password")}
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mb-5`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitCode} noValidate aria-labelledby="mfa-title">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck aria-hidden className="h-5 w-5 text-primary" />
              <h1 id="mfa-title" className="text-xl font-semibold text-fg">
                {t("login.mfaTitle")}
              </h1>
            </div>
            <p id="mfa-hint" className="mb-5 text-sm text-fg-muted">
              {t("login.mfaHint")}
            </p>
            <label htmlFor="login-code" className="mb-1 block text-sm font-medium text-fg">
              {t("login.code")}
            </label>
            <input
              ref={codeRef}
              id="login-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${inputClass} mb-5 text-center font-mono text-2xl tracking-[0.4em]`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "mfa-hint login-error" : "mfa-hint"}
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? t("login.verifying") : t("login.verify")}
            </Button>
            <Button variant="ghost" onClick={restart} disabled={busy} className="mt-2 w-full">
              {t("login.restart")}
            </Button>
          </form>
        )}

        <div id="login-error" aria-live="assertive" role="alert" className="mt-4 min-h-5 text-sm text-danger">
          {error ? t(error) : null}
        </div>
      </div>
    </div>
  );
}

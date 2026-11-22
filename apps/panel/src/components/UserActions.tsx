"use client";

/**
 * Disable / enable a user (adapted from kit parts 03 and 08).
 * Only rendered for role "admin"; a viewer sees a read-only note. The backend enforces the
 * same rule (403 for viewer), this only avoids offering a button that cannot work.
 */
import { Ban, CheckCircle2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { adminApi, type Schemas } from "@/lib/api";
import { errorKey } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";
import { canManage, useAdmin } from "@/lib/session";
import type { MessageKey } from "@/messages/types";
import Modal from "./Modal";
import { Button, inputClass } from "./ui";

type UserDetail = Schemas["UserDetail"];

export const REASON_MIN = 3;
export const REASON_MAX = 200;

export function reasonIsValid(reason: string): boolean {
  const len = reason.trim().length;
  return len >= REASON_MIN && len <= REASON_MAX;
}

export default function UserActions({ user, onUpdated }: { user: UserDetail; onUpdated: (u: UserDetail) => void }) {
  const { t } = useI18n();
  const admin = useAdmin();
  const reasonId = useId();
  const [dialog, setDialog] = useState<"disable" | "enable" | null>(null);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);

  if (!canManage(admin)) {
    return <p className="text-sm text-fg-muted">{t("user.viewerNote")}</p>;
  }

  function open(kind: "disable" | "enable") {
    setDialog(kind);
    setReason("");
    setTouched(false);
    setError(null);
    setNotice(null);
  }

  function close() {
    if (busy) return;
    setDialog(null);
  }

  async function submitDisable(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!reasonIsValid(reason) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await adminApi.disableUser(user.id, { reason: reason.trim() });
      onUpdated(updated);
      setDialog(null);
      setNotice("user.disabledOk");
    } catch (err) {
      setError(errorKey(err)); // dialog stays open; nothing is pretended to be saved
    } finally {
      setBusy(false);
    }
  }

  async function submitEnable() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await adminApi.enableUser(user.id);
      onUpdated(updated);
      setDialog(null);
      setNotice("user.enabledOk");
    } catch (err) {
      setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }

  const reasonInvalid = touched && !reasonIsValid(reason);

  return (
    <div>
      {user.disabled ? (
        <Button variant="secondary" onClick={() => open("enable")}>
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          {t("user.enable")}
        </Button>
      ) : (
        <Button variant="danger" onClick={() => open("disable")}>
          <Ban aria-hidden className="h-4 w-4" />
          {t("user.disable")}
        </Button>
      )}
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-success">
        {notice ? t(notice) : null}
      </p>

      <Modal open={dialog === "disable"} onClose={close} busy={busy} title={t("user.disableTitle")} description={t("user.disableBody")}>
        <form onSubmit={submitDisable} noValidate>
          <label htmlFor={reasonId} className="mb-1 block text-sm font-medium text-fg">
            {t("user.reason")}
          </label>
          <textarea
            id={reasonId}
            data-autofocus
            rows={3}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            required
            aria-invalid={reasonInvalid || undefined}
            aria-describedby={`${reasonId}-hint`}
            className={inputClass}
          />
          <div id={`${reasonId}-hint`} className="mt-1 flex justify-between text-xs">
            <span className={reasonInvalid ? "text-danger" : "text-fg-muted"}>
              {reasonInvalid ? t("user.reasonInvalid") : t("user.reasonHint")}
            </span>
            <span className="tabular-nums text-fg-muted">{t("user.reasonCount", { count: reason.length })}</span>
          </div>
          <div role="alert" className="mt-3 min-h-5 text-sm text-danger">
            {error ? t(error) : null}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={busy || !reasonIsValid(reason)}>
              {busy ? t("user.working") : t("user.confirmDisable")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog === "enable"} onClose={close} busy={busy} title={t("user.enableTitle")} description={t("user.enableBody")}>
        <div role="alert" className="min-h-5 text-sm text-danger">
          {error ? t(error) : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submitEnable} disabled={busy} data-autofocus>
            {busy ? t("user.working") : t("user.confirmEnable")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

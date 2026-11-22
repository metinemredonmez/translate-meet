import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/navigation", async (orig) => ({
  ...(await orig<typeof import("@/lib/navigation")>()),
  redirectToLogin: vi.fn(),
}));

import UserActions, { reasonIsValid } from "@/components/UserActions";
import type { Schemas } from "@/lib/api";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider, type Admin } from "@/lib/session";
import { jsonResponse, mockFetch } from "./helpers";

const user: Schemas["UserDetail"] = {
  id: "user-1",
  provider: "google",
  email: "someone@example.com",
  created_at: "2026-11-01T10:00:00Z",
  disabled: false,
  translations_total: 4,
  locale: "tr",
  disabled_at: null,
  text_chars_today: 10,
  realtime_seconds_today: 0,
  active_sessions: 1,
};

function renderAs(role: Admin["role"], detail = user, onUpdated = vi.fn()) {
  render(
    <I18nProvider initialLang="tr">
      <SessionProvider admin={{ id: "a1", email: "admin@example.com", role }}>
        <UserActions user={detail} onUpdated={onUpdated} />
      </SessionProvider>
    </I18nProvider>,
  );
  return onUpdated;
}

describe("UserActions", () => {
  it("hides disable/enable for the viewer role", () => {
    const { calls } = mockFetch(() => jsonResponse(200, {}));
    renderAs("viewer");
    expect(screen.queryByRole("button", { name: "Devre dışı bırak" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Etkinleştir" })).toBeNull();
    expect(screen.getByText(/yalnızca görüntüleyebilirsin/)).toBeTruthy();
    renderAs("viewer", { ...user, disabled: true });
    expect(screen.queryByRole("button", { name: "Etkinleştir" })).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("lets an admin disable with a reason, sending CSRF header", async () => {
    document.cookie = "tm_csrf=csrf-1; path=/";
    const { calls } = mockFetch(() => jsonResponse(200, { ...user, disabled: true, disabled_at: "2026-11-22T10:00:00Z" }));
    const onUpdated = renderAs("admin");

    fireEvent.click(screen.getByRole("button", { name: "Devre dışı bırak" }));
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Devre dışı bırak" });
    const reason = within(dialog).getByLabelText("Gerekçe");

    fireEvent.change(reason, { target: { value: "ab" } });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(reason, { target: { value: "  kötüye kullanım  " } });
    await act(async () => {
      fireEvent.click(confirm);
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("/api/v1/admin/users/user-1/disable");
    expect(calls[0]!.body).toEqual({ reason: "kötüye kullanım" });
    expect(calls[0]!.headers["x-csrf-token"]).toBe("csrf-1");
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Kullanıcı devre dışı bırakıldı.")).toBeTruthy();
  });

  it("keeps the dialog open and shows a human error when the request fails", async () => {
    mockFetch(() => jsonResponse(403, { error: { code: "forbidden", message: "admin role required" } }));
    const onUpdated = renderAs("admin");
    fireEvent.click(screen.getByRole("button", { name: "Devre dışı bırak" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Gerekçe"), { target: { value: "geçerli gerekçe" } });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Devre dışı bırak" }));
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(within(dialog).getByText("Bu işlem için yetkin yok.")).toBeTruthy();
    expect(screen.queryByText(/admin role required/)).toBeNull();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("validates reason length 3-200 after trimming", () => {
    expect(reasonIsValid("  ab ")).toBe(false);
    expect(reasonIsValid("abc")).toBe(true);
    expect(reasonIsValid("x".repeat(200))).toBe(true);
    expect(reasonIsValid("x".repeat(201))).toBe(false);
  });
});

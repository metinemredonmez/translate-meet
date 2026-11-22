import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("@/lib/navigation", async (orig) => ({
  ...(await orig<typeof import("@/lib/navigation")>()),
  redirectToLogin: vi.fn(),
}));

import LoginForm from "@/components/LoginForm";
import { I18nProvider } from "@/lib/i18n";
import { redirectToLogin } from "@/lib/navigation";
import { jsonResponse, mockFetch } from "./helpers";

const MFA_TOKEN = "mfa.token.value.that.is.long.enough";

function renderForm() {
  return render(
    <I18nProvider initialLang="tr">
      <LoginForm />
    </I18nProvider>,
  );
}

beforeEach(() => {
  replace.mockClear();
  vi.mocked(redirectToLogin).mockClear();
});

describe("LoginForm", () => {
  it("runs the two-step flow: password -> TOTP -> redirect", async () => {
    const { calls } = mockFetch(({ url, body }) => {
      if (url.endsWith("/v1/admin/me")) return jsonResponse(401, { error: { code: "unauthorized", message: "x" } });
      if (url.endsWith("/v1/admin/auth/login")) return jsonResponse(200, { mfa_token: MFA_TOKEN });
      if (url.endsWith("/v1/admin/auth/mfa")) {
        const b = body as { code: string };
        return b.code === "123456"
          ? jsonResponse(200, { id: "a1", email: "admin@example.com", role: "admin" })
          : jsonResponse(401, { error: { code: "unauthorized", message: "invalid code" } });
      }
      return jsonResponse(404, { error: { code: "not_found", message: "x" } });
    });

    renderForm();
    fireEvent.change(screen.getByLabelText("E-posta"), { target: { value: " admin@example.com " } });
    fireEvent.change(screen.getByLabelText("Parola"), { target: { value: "a-long-password-123" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    });

    const code = await screen.findByLabelText("6 haneli kod");
    expect(code.getAttribute("inputmode")).toBe("numeric");
    expect(code.getAttribute("autocomplete")).toBe("one-time-code");
    expect(screen.queryByLabelText("Parola")).toBeNull();

    const login = calls.find((c) => c.url.endsWith("/auth/login"))!;
    expect(login.method).toBe("POST");
    expect(login.body).toEqual({ email: "admin@example.com", password: "a-long-password-123" });

    // Wrong code -> generic error, stays on step 2.
    fireEvent.change(code, { target: { value: "000000" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));
    });
    expect(await screen.findByText(/Kod doğrulanamadı/)).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();

    // Non-digits are stripped; correct code signs in.
    fireEvent.change(screen.getByLabelText("6 haneli kod"), { target: { value: "12a3456" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));

    const mfaCalls = calls.filter((c) => c.url.endsWith("/auth/mfa"));
    expect(mfaCalls.at(-1)!.body).toEqual({ mfa_token: MFA_TOKEN, code: "123456" });
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("shows one generic error for wrong credentials (no account oracle)", async () => {
    mockFetch(({ url }) =>
      url.endsWith("/v1/admin/me")
        ? jsonResponse(401, { error: { code: "unauthorized", message: "x" } })
        : jsonResponse(401, { error: { code: "unauthorized", message: "invalid credentials" } }),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText("E-posta"), { target: { value: "nobody@example.com" } });
    fireEvent.change(screen.getByLabelText("Parola"), { target: { value: "wrong" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    });
    const alert = await screen.findByText("Giriş bilgileri doğrulanamadı. Bilgileri kontrol edip tekrar dene.");
    expect(alert.closest("[role=alert]")).not.toBeNull();
    expect(screen.queryByLabelText("6 haneli kod")).toBeNull();
    expect(screen.queryByText(/invalid credentials/)).toBeNull();
  });

  it("rejects a malformed code without calling the API", async () => {
    const { calls } = mockFetch(({ url }) =>
      url.endsWith("/v1/admin/me")
        ? jsonResponse(401, { error: { code: "unauthorized", message: "x" } })
        : jsonResponse(200, { mfa_token: MFA_TOKEN }),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText("E-posta"), { target: { value: "a@example.com" } });
    fireEvent.change(screen.getByLabelText("Parola"), { target: { value: "pw" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    });
    fireEvent.change(await screen.findByLabelText("6 haneli kod"), { target: { value: "123" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));
    });
    expect(screen.getByText("Kod 6 rakamdan oluşmalı.")).toBeTruthy();
    expect(calls.some((c) => c.url.endsWith("/auth/mfa"))).toBe(false);
  });
});

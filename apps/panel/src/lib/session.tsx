"use client";

/**
 * Signed-in admin, loaded from GET /v1/admin/me. The session itself is the httpOnly cookie;
 * this context only holds the public profile (id, email, role) in memory.
 *
 * Role checks here only shape the UI (hide actions a viewer cannot use). The backend is the
 * authority and answers 403 for viewer on disable/enable/providers check (AZ).
 */
import { createContext, useContext, type ReactNode } from "react";
import type { Schemas } from "./api";

export type Admin = Schemas["AdminOut"];

const SessionContext = createContext<Admin | null>(null);

export function SessionProvider({ admin, children }: { admin: Admin; children: ReactNode }) {
  return <SessionContext.Provider value={admin}>{children}</SessionContext.Provider>;
}

export function useAdmin(): Admin | null {
  return useContext(SessionContext);
}

/** True only for role "admin"; unknown or missing role is treated as read-only. */
export function canManage(admin: Admin | null): boolean {
  return admin?.role === "admin";
}

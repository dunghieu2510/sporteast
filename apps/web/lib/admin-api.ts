"use client";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  totpEnabled: boolean;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** All admin requests ride the HttpOnly session cookie (credentials:"include"); no token in JS. */
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new AdminApiError(msg ?? `Request failed (${res.status})`, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Protected content/match/embed endpoints live under /api/admin. */
export const adminFetch = <T = unknown>(path: string, init?: RequestInit) => call<T>(`/admin${path}`, init);
/** Auth endpoints live under /api/auth. */
export const authFetch = <T = unknown>(path: string, init?: RequestInit) => call<T>(`/auth${path}`, init);

export const getMe = () => authFetch<{ user: AdminUser }>("/me");
export const login = (body: { username: string; password: string; totp?: string }) =>
  authFetch<{ user: AdminUser } | { needsTotp: true }>("/login", { method: "POST", body: JSON.stringify(body) });
export const logout = () => authFetch("/logout", { method: "POST" });

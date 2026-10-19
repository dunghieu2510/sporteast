"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SITE, SITES, isValidSite } from "@arena/types";
import { AdminApiError, type AdminUser, getMe, login, logout } from "@/lib/admin-api";

export const inputCls = "w-full bg-night-800 px-4 py-2 text-white placeholder:text-muted";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white/80">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-white/80">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#ffd23f]" />
      {label}
    </label>
  );
}

const AdminUserContext = createContext<AdminUser | null>(null);
export const useAdminUser = () => useContext(AdminUserContext);

const SITE_STORAGE_KEY = "admin-site";
const SiteContext = createContext<{ site: string; setSite: (s: string) => void }>({
  site: DEFAULT_SITE,
  setSite: () => {},
});
/** The site selected in the admin header; every content/settings call should append `?site=${site}`. */
export const useSite = () => useContext(SiteContext);

function useSiteState() {
  const [site, setSiteState] = useState(DEFAULT_SITE);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SITE_STORAGE_KEY);
      if (saved && isValidSite(saved)) setSiteState(saved);
    } catch {
      /* ignore (private mode, blocked storage) */
    }
  }, []);
  const setSite = (s: string) => {
    setSiteState(s);
    try {
      localStorage.setItem(SITE_STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  };
  return { site, setSite };
}

/** Gates every admin page behind the session: shows a login form until authenticated. */
export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "login" | "ok">("checking");
  const [user, setUser] = useState<AdminUser | null>(null);
  const siteState = useSiteState();

  useEffect(() => {
    getMe()
      .then((r) => {
        setUser(r.user);
        setState("ok");
      })
      .catch(() => setState("login"));
  }, []);

  if (state === "checking") return <p className="text-muted">Checking access…</p>;
  if (state === "login")
    return (
      <LoginForm
        onDone={(u) => {
          setUser(u);
          setState("ok");
        }}
      />
    );

  return (
    <AdminUserContext.Provider value={user}>
      <SiteContext.Provider value={siteState}>
        <div className="mb-6 flex flex-wrap items-center justify-end gap-4 text-sm">
          <label className="flex items-center gap-2 text-muted">
            Site
            <select
              value={siteState.site}
              onChange={(e) => siteState.setSite(e.target.value)}
              className="bg-night-800 px-2 py-1 text-white"
            >
              {SITES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <span className="text-muted">
            Signed in as <span className="font-semibold text-white">{user?.username}</span>
          </span>
          <Link href="/admin/security" className="text-neon hover:text-white">
            Security
          </Link>
          <button
            type="button"
            onClick={() => {
              logout().finally(() => setState("login"));
            }}
            className="pixel-btn px-3 py-1 font-semibold text-white"
          >
            Sign out
          </button>
        </div>
        {children}
      </SiteContext.Provider>
    </AdminUserContext.Provider>
  );
}

function LoginForm({ onDone }: { onDone: (u: AdminUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await login({ username, password, totp: needsTotp ? totp : undefined });
      if ("needsTotp" in res) {
        setNeedsTotp(true);
        setError("");
      } else {
        onDone(res.user);
      }
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not reach the server.");
      if (err instanceof AdminApiError && err.status !== 401) setNeedsTotp(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass mx-auto max-w-sm space-y-4 p-6">
      <h2 className="font-display text-lg font-bold text-white">Admin sign in</h2>

      <Field label="Username or email">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          disabled={needsTotp}
          className={inputCls}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={needsTotp}
          className={inputCls}
        />
      </Field>

      {needsTotp && (
        <Field label="Authentication code" hint="6-digit code from your authenticator app.">
          <input
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123456"
            className={`${inputCls} tabular tracking-[0.4em]`}
          />
        </Field>
      )}

      {error && <p className="text-sm text-live">✗ {error}</p>}

      <button
        type="submit"
        disabled={busy || !username || !password || (needsTotp && totp.length < 6)}
        className="w-full bg-neon px-6 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "…" : needsTotp ? "Verify code" : "Sign in"}
      </button>

      {needsTotp && (
        <button
          type="button"
          onClick={() => {
            setNeedsTotp(false);
            setTotp("");
            setError("");
          }}
          className="w-full text-xs text-muted hover:text-white"
        >
          ← Back
        </button>
      )}
    </form>
  );
}

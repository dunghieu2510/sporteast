"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/admin-api";
import { AdminGate, Field, inputCls, useAdminUser } from "@/components/admin-ui";

export default function AdminSecurity() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Security</h1>
        </div>
        <AdminGate>
          <div className="space-y-6">
            <TwoFactor />
            <ChangePassword />
            <Admins />
          </div>
        </AdminGate>
      </div>
    </div>
  );
}

function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <p className={`text-sm ${msg.ok ? "text-green-400" : "text-live"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</p>;
}

function TwoFactor() {
  const me = useAdminUser();
  const [enabled, setEnabled] = useState(!!me?.totpEnabled);
  const [qr, setQr] = useState<{ otpauthUrl: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => setQr(await authFetch<{ otpauthUrl: string; qrDataUrl: string }>("/2fa/setup", { method: "POST" })));

  const enable = () =>
    run(async () => {
      await authFetch("/2fa/enable", { method: "POST", body: JSON.stringify({ code }) });
      setEnabled(true);
      setQr(null);
      setCode("");
      setMsg({ ok: true, text: "Two-factor authentication is on." });
    });

  const disable = () =>
    run(async () => {
      await authFetch("/2fa/disable", { method: "POST", body: JSON.stringify({ password }) });
      setEnabled(false);
      setPassword("");
      setMsg({ ok: true, text: "Two-factor authentication turned off." });
    });

  const secret = qr ? decodeURIComponent(qr.otpauthUrl.match(/secret=([^&]+)/)?.[1] ?? "") : "";

  return (
    <section className="glass space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-white">Two-factor authentication (2FA)</h2>
        <span className={`pixel-tag px-2 py-0.5 text-xs font-bold ${enabled ? "bg-neon text-night-950" : "bg-night-950 text-muted"}`}>
          {enabled ? "ON" : "OFF"}
        </span>
      </div>

      {enabled ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">Your account asks for an authenticator code at sign in. Enter your password to turn it off.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            className={`${inputCls} max-w-xs`}
          />
          <div>
            <button onClick={disable} disabled={busy || !password} className="pixel-btn px-5 py-2 text-sm font-bold text-live disabled:opacity-50">
              Turn off 2FA
            </button>
          </div>
        </div>
      ) : qr ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            1. Scan this QR code with Google Authenticator, Authy, 1Password, etc. 2. Enter the 6-digit code it shows to confirm.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.qrDataUrl} alt="2FA QR code" width={180} height={180} className="border-2 border-pixel-ink bg-white" />
          <p className="break-all text-xs text-muted">
            Can&apos;t scan? Enter this key manually: <code className="text-neon">{secret}</code>
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="123456"
              className={`${inputCls} tabular max-w-[160px] tracking-[0.4em]`}
            />
            <button onClick={enable} disabled={busy || code.length < 6} className="bg-neon px-5 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50">
              Confirm & enable
            </button>
            <button onClick={() => setQr(null)} className="pixel-btn px-4 py-2.5 text-sm font-semibold text-white">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">Add a second step at sign in using an authenticator app. Strongly recommended.</p>
          <button onClick={startSetup} disabled={busy} className="bg-neon px-5 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50">
            Set up 2FA
          </button>
        </div>
      )}
      <Msg msg={msg} />
    </section>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (next !== confirm) {
      setMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await authFetch("/change-password", { method: "POST", body: JSON.stringify({ current, next }) });
      setMsg({ ok: true, text: "Password changed. Signing you out…" });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
      setBusy(false);
    }
  };

  return (
    <section className="glass space-y-4 p-6">
      <h2 className="font-display text-lg font-bold text-white">Change password</h2>
      <p className="text-sm text-muted">Changing your password signs out every device. Minimum 10 characters.</p>
      <div className="grid max-w-md gap-4">
        <Field label="Current password">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputCls} />
        </Field>
        <Field label="New password">
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={inputCls} />
        </Field>
        <Field label="Confirm new password">
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls} />
        </Field>
      </div>
      <button onClick={submit} disabled={busy || !current || next.length < 10} className="bg-neon px-6 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50">
        Change password
      </button>
      <Msg msg={msg} />
    </section>
  );
}

type Admin = { id: string; username: string; email: string; totpEnabled: boolean; lastLoginAt: string | null };

function Admins() {
  const me = useAdminUser();
  const [list, setList] = useState<Admin[]>([]);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setList(await authFetch<Admin[]>("/users")), []);
  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: e.message }));
  }, [load]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      await load();
      setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const add = () =>
    run(async () => {
      await authFetch("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ username: "", email: "", password: "" });
    }, "Admin added.");

  const remove = (a: Admin) => {
    if (!window.confirm(`Delete admin "${a.username}"?`)) return;
    run(() => authFetch(`/users/${a.id}`, { method: "DELETE" }).then(() => undefined), "Admin deleted.");
  };

  return (
    <section className="glass space-y-4 p-6">
      <h2 className="font-display text-lg font-bold text-white">Admin accounts</h2>
      <ul className="divide-y-2 divide-white/5">
        {list.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <span className="font-semibold text-white">{a.username}</span>
            {a.id === me?.id && <span className="text-[10px] uppercase text-neon">you</span>}
            <span className="text-muted">{a.email}</span>
            <span className="text-xs text-muted">2FA {a.totpEnabled ? "on" : "off"}</span>
            <span className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted">{a.lastLoginAt ? `last login ${new Date(a.lastLoginAt).toLocaleDateString()}` : "never signed in"}</span>
              {a.id !== me?.id && (
                <button onClick={() => remove(a)} disabled={busy} className="pixel-btn px-3 py-1 text-xs font-bold text-live disabled:opacity-50">
                  Delete
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 border-t-2 border-white/10 pt-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" className={inputCls} />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email" className={inputCls} />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="password (min 10)"
          autoComplete="new-password"
          className={inputCls}
        />
        <button
          onClick={add}
          disabled={busy || !form.username || !form.email || form.password.length < 10}
          className="bg-neon px-5 py-2 text-sm font-bold text-night-950 hover:brightness-110 disabled:opacity-50"
        >
          + Add admin
        </button>
      </div>
      <Msg msg={msg} />
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteSettings } from "@arena/types";
import { adminFetch } from "@/lib/admin-api";
import { AdminGate, Field, inputCls } from "@/components/admin-ui";
import { LogoMark } from "@/components/logo";

export default function AdminSettings() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Site Settings</h1>
        </div>
        <AdminGate>
          <LogoForm />
        </AdminGate>
      </div>
    </div>
  );
}

function LogoForm() {
  const [main, setMain] = useState("");
  const [accent, setAccent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch<SiteSettings>("/settings")
      .then((s) => {
        setMain(s.logoTextMain);
        setAccent(s.logoTextAccent);
        setLoaded(true);
      })
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await adminFetch("/settings", { method: "PUT", body: JSON.stringify({ logoTextMain: main, logoTextAccent: accent }) });
      setMsg({ ok: true, text: "Saved. Reload the site to see the new logo." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (!loaded && !msg) return <p className="text-muted">Loading…</p>;

  return (
    <section className="glass space-y-6 p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-white">Logo text</h2>

      <div>
        <p className="mb-2 text-sm text-muted">Preview</p>
        <div className="flex items-center gap-3 bg-night-950 p-4">
          <LogoMark size={40} />
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            {main || "SPORT"}
            {accent && <span className="text-neon">{accent}</span>}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First part (white)" hint="Required, up to 24 characters.">
          <input value={main} onChange={(e) => setMain(e.target.value.slice(0, 24))} placeholder="SPORT" className={inputCls} />
        </Field>
        <Field label="Second part (yellow)" hint="Optional — leave empty for a single-color logo.">
          <input value={accent} onChange={(e) => setAccent(e.target.value.slice(0, 24))} placeholder="EAST" className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-white/10 pt-6">
        <button onClick={save} disabled={busy || !main.trim()} className="bg-neon px-6 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50">
          Save changes
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-400" : "text-live"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</span>}
      </div>

      <p className="text-xs text-muted">
        Note: this changes the visible logo wordmark. The SEO brand name in page titles stays separate.
      </p>
    </section>
  );
}

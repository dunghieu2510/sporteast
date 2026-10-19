"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PageContent } from "@arena/types";
import { adminFetch } from "@/lib/admin-api";
import { AdminGate, Field, inputCls, useSite } from "@/components/admin-ui";
import { RichTextEditor } from "@/components/rich-text-editor";

const HOME_SLUG = "home";

type Form = { title: string; content: string; metaTitle: string; metaDescription: string };

const emptyForm: Form = { title: "", content: "", metaTitle: "", metaDescription: "" };

const toForm = (p: PageContent): Form => ({
  title: p.title,
  content: p.content,
  metaTitle: p.metaTitle ?? "",
  metaDescription: p.metaDescription ?? "",
});

export default function AdminHomeContent() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/content" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Content
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Home Page Content</h1>
        </div>
        <AdminGate>
          <Manager />
        </AdminGate>
      </div>
    </div>
  );
}

function Manager() {
  const { site } = useSite();
  const [exists, setExists] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const list = await adminFetch<PageContent[]>(`/pages?site=${site}`);
    const home = list.find((p) => p.slug === HOME_SLUG);
    setExists(!!home);
    setForm(home ? toForm(home) : emptyForm);
  }, [site]);

  useEffect(() => {
    setLoaded(false);
    setMsg(null);
    load()
      .then(() => setLoaded(true))
      .catch((e) => {
        setMsg({ ok: false, text: e.message });
        setLoaded(true);
      });
  }, [load]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (exists) {
        await adminFetch(`/pages/${HOME_SLUG}?site=${site}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await adminFetch(`/pages?site=${site}`, {
          method: "POST",
          body: JSON.stringify({ slug: HOME_SLUG, showInFooter: false, ...form }),
        });
      }
      await load();
      setMsg({ ok: true, text: "Saved." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await adminFetch(`/pages/${HOME_SLUG}?site=${site}`, { method: "DELETE" });
      await load();
      setMsg({ ok: true, text: "Reset — the homepage will show the default text again." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <p className="text-muted">Loading…</p>;

  return (
    <div className="glass space-y-6 p-6 sm:p-8">
      <p className="text-sm text-muted">
        {exists
          ? "This site has its own homepage article below."
          : "This site has no custom homepage article yet — it currently shows the built-in default text. Fill this in and save to replace it."}
      </p>

      <Field label="Heading" hint="Shown as the big heading above the article on the homepage.">
        <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
      </Field>

      <Field label="Content" hint="The article shown below the schedule on the homepage. Use the toolbar, or the HTML tab for full control.">
        <RichTextEditor value={form.content} onChange={(v) => set("content", v)} rows={16} />
      </Field>

      <div className="grid gap-4 border-t-2 border-white/10 pt-6">
        <h3 className="font-display font-bold text-white">SEO</h3>
        <Field label="Meta title" hint='Empty = "Live Sports Schedules, Scores & Streams"'>
          <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Meta description">
          <textarea rows={2} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-white/10 pt-6">
        <button
          onClick={save}
          disabled={busy || !form.title.trim() || !form.content.trim()}
          className="bg-neon px-6 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50"
        >
          Save changes
        </button>
        {exists && (
          <button onClick={remove} disabled={busy} className="pixel-btn px-6 py-2.5 font-bold text-live disabled:opacity-50">
            Reset to default
          </button>
        )}
        <Link href="/" target="_blank" className="text-sm text-neon hover:text-white">
          View homepage ↗
        </Link>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-400" : "text-live"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</span>}
      </div>
    </div>
  );
}

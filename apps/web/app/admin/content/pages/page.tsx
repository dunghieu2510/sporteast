"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PageContent } from "@arena/types";
import { adminFetch } from "@/lib/admin-api";
import { AdminGate, Check, Field, inputCls } from "@/components/admin-ui";
import { RichTextEditor } from "@/components/rich-text-editor";

type Form = {
  slug: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
};

const emptyForm: Form = {
  slug: "",
  title: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  published: true,
  showInFooter: true,
  sortOrder: 0,
};

const toForm = (p: PageContent): Form => ({
  slug: p.slug,
  title: p.title,
  content: p.content,
  metaTitle: p.metaTitle ?? "",
  metaDescription: p.metaDescription ?? "",
  published: p.published,
  showInFooter: p.showInFooter,
  sortOrder: p.sortOrder,
});

export default function AdminPages() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/content" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Content
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Static Pages</h1>
        </div>
        <AdminGate>
          <Manager />
        </AdminGate>
      </div>
    </div>
  );
}

function Manager() {
  const [items, setItems] = useState<PageContent[]>([]);
  const [selected, setSelected] = useState<string | "new">("new");
  const [form, setForm] = useState<Form>(emptyForm);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async (select?: string) => {
    const list = await adminFetch<PageContent[]>("/pages");
    setItems(list);
    const target = select ?? list[0]?.slug ?? "new";
    const found = list.find((p) => p.slug === target);
    setSelected(found ? found.slug : "new");
    setForm(found ? toForm(found) : emptyForm);
  }, []);

  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: e.message }));
  }, [load]);

  const isNew = selected === "new";
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const pick = (slug: string | "new") => {
    setMsg(null);
    setConfirmDelete(false);
    setSelected(slug);
    setForm(slug === "new" ? { ...emptyForm, sortOrder: items.length } : toForm(items.find((p) => p.slug === slug)!));
  };

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

  const save = () =>
    run(async () => {
      const { slug, ...rest } = form;
      if (isNew) await adminFetch("/pages", { method: "POST", body: JSON.stringify({ slug, ...rest }) });
      else await adminFetch(`/pages/${encodeURIComponent(selected)}`, { method: "PUT", body: JSON.stringify(rest) });
      await load(isNew ? slug : selected);
      setMsg({ ok: true, text: isNew ? "Page created." : "Saved." });
    });

  const remove = () =>
    run(async () => {
      setConfirmDelete(false);
      await adminFetch(`/pages/${encodeURIComponent(selected)}`, { method: "DELETE" });
      await load();
      setMsg({ ok: true, text: "Page deleted." });
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <div className="glass h-fit p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-white">Pages</h2>
          <button onClick={() => pick("new")} className="bg-neon px-3 py-1 text-xs font-bold text-night-950 hover:brightness-110">
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {items.map((p) => (
            <button
              key={p.slug}
              onClick={() => pick(p.slug)}
              className={`flex items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold ${
                selected === p.slug ? "bg-neon text-night-950" : "pixel-btn text-white"
              }`}
            >
              <span className="flex-1">{p.title}</span>
              {!p.published && <span className="text-[10px] uppercase opacity-70">draft</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="glass space-y-6 p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-white">{isNew ? "New page" : `Edit ${form.title}`}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" hint={isNew ? "URL: /<slug> (letters, numbers and '-')." : "Slug cannot be changed."}>
            <input
              value={form.slug}
              disabled={!isNew}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              className={`${inputCls} disabled:opacity-60`}
            />
          </Field>
          <Field label="Title (H1)">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field
          label="Content"
          hint="Use the toolbar, then check the Preview tab."
        >
          <RichTextEditor value={form.content} onChange={(v) => set("content", v)} rows={16} />
        </Field>

        <div className="flex flex-wrap gap-6">
          <Check label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          <Check label="Show in footer" checked={form.showInFooter} onChange={(v) => set("showInFooter", v)} />
          <label className="flex items-center gap-2 text-sm font-semibold text-white/80">
            Footer order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              className="w-20 bg-night-800 px-2 py-1 text-white"
            />
          </label>
        </div>

        <div className="grid gap-4 border-t-2 border-white/10 pt-6">
          <h3 className="font-display font-bold text-white">SEO</h3>
          <Field label="Meta title" hint="Empty = page title.">
            <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Meta description">
            <textarea rows={2} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t-2 border-white/10 pt-6">
          <button
            onClick={save}
            disabled={busy}
            className="bg-neon px-6 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50"
          >
            {isNew ? "Create page" : "Save changes"}
          </button>
          {!isNew && (
            <>
              {confirmDelete ? (
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-white/80">Really delete?</span>
                  <button onClick={remove} disabled={busy} className="bg-live px-5 py-2.5 font-bold text-white disabled:opacity-50">
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="pixel-btn px-5 py-2.5 font-bold text-white">
                    Cancel
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelete(true)} disabled={busy} className="pixel-btn px-6 py-2.5 font-bold text-live disabled:opacity-50">
                  Delete
                </button>
              )}
              <Link href={`/${selected}`} target="_blank" className="text-sm text-neon hover:text-white">
                View page ↗
              </Link>
            </>
          )}
          {msg && <span className={`text-sm ${msg.ok ? "text-green-400" : "text-live"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</span>}
        </div>
      </div>
    </div>
  );
}

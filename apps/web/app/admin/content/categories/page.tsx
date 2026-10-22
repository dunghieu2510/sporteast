"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SITES, type CategoryContent } from "@arena/types";
import { adminFetch } from "@/lib/admin-api";
import { AdminGate, Check, Field, inputCls, useSite } from "@/components/admin-ui";
import { RichTextEditor } from "@/components/rich-text-editor";

type Form = {
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  heading: string;
  description: string;
  contentTitle: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
};

const emptyForm: Form = {
  slug: "",
  name: "",
  icon: "",
  sortOrder: 0,
  active: true,
  heading: "",
  description: "",
  contentTitle: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
};

const toForm = (c: CategoryContent): Form => ({
  slug: c.slug,
  name: c.name,
  icon: c.icon ?? "",
  sortOrder: c.sortOrder,
  active: c.active,
  heading: c.heading ?? "",
  description: c.description ?? "",
  contentTitle: c.contentTitle ?? "",
  content: c.content ?? "",
  metaTitle: c.metaTitle ?? "",
  metaDescription: c.metaDescription ?? "",
});

export default function AdminCategories() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/content" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Content
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Category Pages</h1>
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
  const [items, setItems] = useState<CategoryContent[]>([]);
  const [selected, setSelected] = useState<string | "new">("new");
  const [form, setForm] = useState<Form>(emptyForm);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    async (select?: string) => {
      const list = await adminFetch<CategoryContent[]>(`/categories?site=${site}`);
      setItems(list);
      const target = select ?? list[0]?.slug ?? "new";
      const found = list.find((c) => c.slug === target);
      setSelected(found ? found.slug : "new");
      setForm(found ? toForm(found) : emptyForm);
    },
    [site],
  );

  useEffect(() => {
    setLoaded(false);
    setMsg(null);
    load()
      .then(() => setLoaded(true))
      .catch((e) => {
        setMsg({ ok: false, text: e.message });
        setLoaded(true); // stop showing "Loading…" forever — show the error instead
      });
  }, [load]);

  const isNew = selected === "new";
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const pick = (slug: string | "new") => {
    setMsg(null);
    setConfirmDelete(false);
    setSelected(slug);
    setForm(slug === "new" ? { ...emptyForm, sortOrder: items.length } : toForm(items.find((c) => c.slug === slug)!));
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

  const seed = () =>
    run(async () => {
      const brand = SITES.find((s) => s.key === site)?.name ?? site;
      await adminFetch(`/sites/${site}/seed`, { method: "POST", body: JSON.stringify({ brand }) });
      await load();
      setMsg({ ok: true, text: "Starter content created — edit it below." });
    });

  const save = () =>
    run(async () => {
      if (isNew) await adminFetch(`/categories?site=${site}`, { method: "POST", body: JSON.stringify(form) });
      else await adminFetch(`/categories/${encodeURIComponent(selected)}?site=${site}`, { method: "PUT", body: JSON.stringify(form) });
      await load(isNew ? form.slug : form.slug);
      setMsg({ ok: true, text: isNew ? "Category created." : form.slug !== selected ? "Saved — old URL now redirects here." : "Saved." });
    });

  const remove = () =>
    run(async () => {
      setConfirmDelete(false);
      await adminFetch(`/categories/${encodeURIComponent(selected)}?site=${site}`, { method: "DELETE" });
      await load();
      setMsg({ ok: true, text: "Category deleted." });
    });

  if (!loaded) return <p className="text-muted">Loading…</p>;

  if (items.length === 0 && msg && !msg.ok) {
    return (
      <div className="glass space-y-4 p-6 text-center">
        <p className="text-live">✗ {msg.text}</p>
        <button onClick={() => load()} className="pixel-btn px-4 py-2 text-xs font-bold text-white">
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass space-y-4 p-6 text-center">
        <p className="text-white/80">This site has no categories yet.</p>
        <button onClick={seed} disabled={busy} className="bg-neon px-6 py-2.5 font-bold text-night-950 hover:brightness-110 disabled:opacity-50">
          Seed starter content
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-400" : "text-live"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <div className="glass h-fit p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-white">Categories</h2>
          <button onClick={() => pick("new")} className="bg-neon px-3 py-1 text-xs font-bold text-night-950 hover:brightness-110">
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {items.map((c) => (
            <button
              key={c.slug}
              onClick={() => pick(c.slug)}
              className={`flex items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold ${
                selected === c.slug ? "bg-neon text-night-950" : "pixel-btn text-white"
              }`}
            >
              <span>{c.icon}</span>
              <span className="flex-1">{c.name}</span>
              {!c.active && <span className="text-[10px] uppercase opacity-70">hidden</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="glass space-y-6 p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-white">{isNew ? "New category" : `Edit ${form.name}`}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Slug"
            hint="URL: /sport/<slug>. Must match a league or sport slug (e.g. nfl, soccer). Changing it renames that league/sport's slug too, and the old URL 301-redirects here."
          >
            <input value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} className={inputCls} />
          </Field>
          <Field label="Menu name">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Icon (emoji)">
            <input value={form.icon} onChange={(e) => set("icon", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Menu order" hint="Smaller numbers come first.">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
        </div>

        <Check label="Visible (shown in menu and reachable)" checked={form.active} onChange={(v) => set("active", v)} />

        <Field label="Page heading (H1)" hint={`Empty = "${form.name || "Name"} Schedule & Scores"`}>
          <input value={form.heading} onChange={(e) => set("heading", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Short description" hint="Shown under the heading and used as the fallback meta description.">
          <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Content title (H2)">
          <input value={form.contentTitle} onChange={(e) => set("contentTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field
          label="Content"
          hint="Shown below the schedule. Use the toolbar, then check the Preview tab."
        >
          <RichTextEditor value={form.content} onChange={(v) => set("content", v)} rows={12} />
        </Field>

        <div className="grid gap-4 border-t-2 border-white/10 pt-6">
          <h3 className="font-display font-bold text-white">SEO</h3>
          <Field label="Meta title" hint={`Empty = "${form.name || "Name"} Schedule & Live Scores"`}>
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
            {isNew ? "Create category" : "Save changes"}
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
              <Link href={`/sport/${selected}`} target="_blank" className="text-sm text-neon hover:text-white">
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

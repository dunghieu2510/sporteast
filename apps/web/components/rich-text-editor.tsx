"use client";

import { useRef, useState } from "react";
import { RichText } from "@/components/rich-text";

type Props = { value: string; onChange: (v: string) => void; rows?: number };

/** Toolbar + live preview over a textarea; stores the same simple markup RichText renders. */
export function RichTextEditor({ value, onChange, rows = 14 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const apply = (fn: (text: string, start: number, end: number) => { text: string; start: number; end: number }) => {
    const el = ref.current;
    if (!el) return;
    const r = fn(value, el.selectionStart, el.selectionEnd);
    onChange(r.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  };

  const wrap = (mark: string, placeholder: string) =>
    apply((t, s, e) => {
      const sel = t.slice(s, e) || placeholder;
      return { text: t.slice(0, s) + mark + sel + mark + t.slice(e), start: s + mark.length, end: s + mark.length + sel.length };
    });

  /** Toggles a prefix ("## ", "- ") on every selected line. */
  const linePrefix = (prefix: string) =>
    apply((t, s, e) => {
      const from = t.lastIndexOf("\n", s - 1) + 1;
      const toIdx = t.indexOf("\n", e);
      const to = toIdx === -1 ? t.length : toIdx;
      const lines = t.slice(from, to).split("\n");
      const allHave = lines.every((l) => l.startsWith(prefix));
      const out = lines
        .map((l) => (allHave ? l.slice(prefix.length) : prefix + l.replace(/^(#{2,3} |- )/, "")))
        .join("\n");
      return { text: t.slice(0, from) + out + t.slice(to), start: from, end: from + out.length };
    });

  const link = () => {
    const url = window.prompt("Link URL (https://… or /page)", "https://");
    if (!url) return;
    apply((t, s, e) => {
      const label = t.slice(s, e) || "link text";
      const md = `[${label}](${url})`;
      return { text: t.slice(0, s) + md + t.slice(e), start: s + 1, end: s + 1 + label.length };
    });
  };

  const buttons: { label: string; title: string; run: () => void; cls?: string }[] = [
    { label: "H2", title: "Heading", run: () => linePrefix("## ") },
    { label: "H3", title: "Sub-heading", run: () => linePrefix("### ") },
    { label: "B", title: "Bold", run: () => wrap("**", "bold text"), cls: "font-bold" },
    { label: "• List", title: "Bulleted list", run: () => linePrefix("- ") },
    { label: "Link", title: "Insert link", run: link },
  ];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            disabled={tab === "preview"}
            onClick={b.run}
            className={`pixel-btn px-3 py-1 text-xs text-white disabled:opacity-40 ${b.cls ?? ""}`}
          >
            {b.label}
          </button>
        ))}
        <span className="ml-auto flex gap-2">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-semibold capitalize ${tab === t ? "bg-neon text-night-950" : "pixel-btn text-white"}`}
            >
              {t}
            </button>
          ))}
        </span>
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-night-800 px-4 py-3 font-mono text-sm text-white placeholder:text-muted"
        />
      ) : (
        <div className="min-h-40 bg-night-900 p-4">
          {value.trim() ? <RichText text={value} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import DOMPurify from "isomorphic-dompurify";
import { legacyToHtml, looksLikeHtml } from "@/components/rich-text";

type Props = { value: string; onChange: (v: string) => void; rows?: number };

const ALLOWED_TAGS = ["p", "h2", "h3", "strong", "em", "u", "s", "a", "ul", "ol", "li", "blockquote", "img", "br"];
const ALLOWED_ATTR = ["href", "src", "alt", "style"];
const sanitize = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });

const proseCls =
  "min-h-40 bg-night-900 px-4 py-3 text-[15px] leading-relaxed text-white/90 focus:outline-none " +
  "[&_a]:text-neon [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:text-white/70 " +
  "[&_h2]:pt-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:pt-2 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white " +
  "[&_img]:max-w-full [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-square [&_ul]:space-y-1 [&_ul]:pl-6";

/** Full toolbar (headings, formatting, lists, quote, link, image, align, undo/redo) + a raw-HTML tab. */
export function RichTextEditor({ value, onChange, rows = 14 }: Props) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlDraft, setHtmlDraft] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: false }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: looksLikeHtml(value) ? value : legacyToHtml(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: proseCls } },
  });

  // Re-sync when a different record is loaded from outside (e.g. switching category in the sidebar).
  useEffect(() => {
    if (!editor || mode !== "visual") return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(looksLikeHtml(value) ? value : legacyToHtml(value), { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const toHtml = () => {
    setHtmlDraft(editor?.getHTML() ?? value);
    setMode("html");
  };
  const toVisual = () => {
    const clean = sanitize(htmlDraft);
    editor?.commands.setContent(clean, { emitUpdate: false });
    onChange(clean);
    setMode("visual");
  };

  const link = () => {
    if (!editor) return;
    const url = window.prompt("Link URL (https://… or /page)", "https://");
    if (!url) return;
    const { from, empty } = editor.state.selection;
    if (empty) {
      editor.chain().focus().insertContent("link text").run();
      editor.chain().setTextSelection({ from, to: from + "link text".length }).extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const image = () => {
    if (!editor) return;
    const url = window.prompt("Image URL (https://…)");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const buttons: { label: string; title: string; run: () => void; active?: boolean; disabled?: boolean }[] = editor
    ? [
        { label: "H2", title: "Heading", run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
        { label: "H3", title: "Sub-heading", run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
        { label: "B", title: "Bold", run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
        { label: "I", title: "Italic", run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
        { label: "U", title: "Underline", run: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
        { label: "S", title: "Strikethrough", run: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
        { label: "• List", title: "Bulleted list", run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
        { label: "1. List", title: "Numbered list", run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
        { label: "❝", title: "Quote", run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
        { label: "Link", title: "Insert link", run: link },
        { label: "Img", title: "Insert image", run: image },
        { label: "⟸", title: "Align left", run: () => editor.chain().focus().setTextAlign("left").run(), active: editor.isActive({ textAlign: "left" }) },
        { label: "⟺", title: "Align center", run: () => editor.chain().focus().setTextAlign("center").run(), active: editor.isActive({ textAlign: "center" }) },
        { label: "⟹", title: "Align right", run: () => editor.chain().focus().setTextAlign("right").run(), active: editor.isActive({ textAlign: "right" }) },
        { label: "↶", title: "Undo", run: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
        { label: "↷", title: "Redo", run: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
      ]
    : [];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            disabled={mode === "html" || b.disabled}
            onClick={b.run}
            className={`pixel-btn px-3 py-1 text-xs text-white disabled:opacity-40 ${b.active ? "bg-neon text-night-950" : ""}`}
          >
            {b.label}
          </button>
        ))}
        <span className="ml-auto flex gap-2">
          {(["visual", "html"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => (t === "html" ? toHtml() : toVisual())}
              className={`px-3 py-1 text-xs font-semibold uppercase ${mode === t ? "bg-neon text-night-950" : "pixel-btn text-white"}`}
            >
              {t === "html" ? "HTML" : "Visual"}
            </button>
          ))}
        </span>
      </div>

      {mode === "visual" ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          rows={rows}
          value={htmlDraft}
          onChange={(e) => setHtmlDraft(e.target.value)}
          placeholder="<p>Paste or write raw HTML…</p>"
          className="w-full bg-night-800 px-4 py-3 font-mono text-sm text-white placeholder:text-muted"
        />
      )}
      {mode === "html" && (
        <p className="mt-1 text-xs text-muted">Switch back to Visual to apply — HTML is sanitized before saving.</p>
      )}
    </div>
  );
}

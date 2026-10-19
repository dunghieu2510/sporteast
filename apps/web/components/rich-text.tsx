import DOMPurify from "isomorphic-dompurify";

const safeHref = (href: string) => /^(https?:\/\/|mailto:|\/)/i.test(href);

// Force safe link behaviour and lazy-load images on every render, regardless of source HTML.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const href = node.getAttribute("href") ?? "";
    if (!safeHref(href)) node.removeAttribute("href");
    else if (!href.startsWith("/")) {
      node.setAttribute("rel", "noopener noreferrer");
      node.setAttribute("target", "_blank");
    }
  }
  if (node.tagName === "IMG") node.setAttribute("loading", "lazy");
});

const ALLOWED_TAGS = ["p", "h2", "h3", "strong", "em", "u", "s", "a", "ul", "ol", "li", "blockquote", "img", "br"];
const ALLOWED_ATTR = ["href", "src", "alt", "rel", "target", "style"];

/** True once content was saved by the HTML-capable editor, rather than the pre-editor hand-rolled markup. */
export function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/** Converts the old markup ("## / ### " headings, "- " lists, blank-line paragraphs, **bold**, [text](url)) into HTML. */
export function legacyToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) =>
        safeHref(href) ? `<a href="${href}">${label}</a>` : label,
      );

  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith("### ")) {
      flushPara();
      flushList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join("");
}

/**
 * Renders admin-authored content, sanitized. Content saved before the rich HTML editor existed
 * (no real tags yet) is auto-upconverted from the old markup so existing pages keep rendering
 * exactly as before.
 */
export function RichText({ text }: { text: string }) {
  const html = looksLikeHtml(text) ? text : legacyToHtml(text);
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
  return (
    <div
      className="space-y-4 leading-relaxed text-white/90 [&_a]:text-neon [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:text-white/70 [&_h2]:pt-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:pt-2 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_img]:max-w-full [&_li]:ml-0 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_ul]:list-square [&_ul]:space-y-1 [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

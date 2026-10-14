import type { ReactNode } from "react";

/**
 * Renders the admin-edited text safely (no raw HTML): "## / ### " headings, "- " lists,
 * blank-line paragraphs, **bold** and [text](url) links.
 */
export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(<p key={out.length}>{inline(para.join(" "))}</p>);
    para = [];
  };
  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={out.length} className="list-square space-y-1 pl-6">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
    }
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
      out.push(
        <h3 key={out.length} className="pt-2 font-display text-base font-bold text-white">
          {inline(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      out.push(
        <h2 key={out.length} className="pt-2 font-display text-xl font-bold text-white">
          {inline(line.slice(3))}
        </h2>,
      );
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

  return <div className="space-y-4 leading-relaxed text-white/90">{out}</div>;
}

const safeHref = (href: string) => /^(https?:\/\/|mailto:|\/)/i.test(href);

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link && safeHref(link[2])) {
      return (
        <a key={i} href={link[2]} className="text-neon underline" rel={link[2].startsWith("/") ? undefined : "noopener noreferrer"}>
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

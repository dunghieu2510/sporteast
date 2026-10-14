import Link from "next/link";
import { SITE_URL, jsonLdString } from "@/lib/seo";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail + BreadcrumbList JSON-LD. Last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.href} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="max-w-[60vw] truncate text-white/80">
                  {it.name}
                </span>
              ) : (
                <>
                  <Link href={it.href} className="font-semibold hover:text-neon">
                    {it.name}
                  </Link>
                  <span aria-hidden>›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

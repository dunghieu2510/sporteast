import type { MetadataRoute } from "next";
import { getCategories, getMatches, getPages } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

// Regenerate hourly so today's matches appear and stale ones drop off.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, pages, matches] = await Promise.all([getCategories(), getPages(), getMatches()]);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
  ];

  for (const c of cats.data ?? []) {
    entries.push({
      url: `${SITE_URL}/sport/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }
  for (const p of pages.data ?? []) {
    if (p.slug === "home") continue; // same content as "/" — already listed above, don't duplicate
    entries.push({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "monthly",
      priority: 0.3,
    });
  }
  for (const m of matches.data ?? []) {
    entries.push({
      url: `${SITE_URL}/match/${m.slug}`,
      lastModified: now, // startTime is often in the future — not a meaningful "last modified"
      changeFrequency: "hourly",
      priority: 0.7,
    });
  }

  return entries;
}

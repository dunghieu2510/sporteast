import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, getLeagues, getMatches } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";
import { GameList } from "@/components/game-list";
import { MockNotice } from "@/components/mock-notice";
import { RichText } from "@/components/rich-text";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: category } = await getCategory(slug);
  if (!category) return { title: "Sport not found", robots: { index: false } };
  const title = category.metaTitle ?? `${category.name} Schedule & Live Scores`;
  const description = category.metaDescription ?? category.description ?? undefined;
  const url = `/sport/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, url, title: `${title} · ${SITE_NAME}`, description },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description },
  };
}

export default async function SportPage({ params }: Props) {
  const { slug } = await params;
  const { data: category } = await getCategory(slug);
  if (!category) notFound();

  const [leagues, matches] = await Promise.all([getLeagues(), getMatches()]);
  const isMock = leagues.source === "mock" || matches.source === "mock";

  // A category matches a league by league slug prefix or by sport slug.
  const sportMatches = (matches.data ?? []).filter(
    (m) => m.league.slug.startsWith(slug) || m.league.sport.slug === slug,
  );
  const sportLeagues = (leagues.data ?? []).filter((l) => l.slug.startsWith(slug) || l.sport.slug === slug);

  return (
    <div className="flex flex-col gap-6 pt-8">
      {isMock && <MockNotice />}

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: category.name, href: `/sport/${category.slug}` },
        ]}
      />

      <header>
        <div className="mb-4 flex items-center gap-3">
          {category.icon && <span className="text-4xl">{category.icon}</span>}
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {category.heading ?? `${category.name} Schedule & Scores`}
            </h1>
            {category.description && <p className="mt-1 text-sm text-muted">{category.description}</p>}
          </div>
        </div>
      </header>

      <GameList leagues={sportLeagues} matches={sportMatches} />

      {category.content && (
        <section className="space-y-4 py-12">
          {category.contentTitle && (
            <h2 className="font-display text-2xl font-bold text-white">{category.contentTitle}</h2>
          )}
          <RichText text={category.content} />
        </section>
      )}
    </div>
  );
}

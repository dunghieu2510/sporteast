import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategory, getCategoryRedirect, getLeagues, getMatches } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";
import { GameList } from "@/components/game-list";
import { MockNotice } from "@/components/mock-notice";
import { RichText } from "@/components/rich-text";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ScoreboardStrip } from "@/components/scoreboard-strip";
import { etDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string }> };

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SportPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date: dateParam } = await searchParams;
  const date = dateParam && DATE_RE.test(dateParam) ? dateParam : etDate(0);
  const { data: category } = await getCategory(slug);
  if (!category) {
    const { data: redirect } = await getCategoryRedirect(slug);
    if (redirect) permanentRedirect(`/sport/${redirect.toSlug}`);
    notFound();
  }

  const [leagues, matches] = await Promise.all([getLeagues(), getMatches()]);
  const isMock = leagues.source === "mock" || matches.source === "mock";

  // A category matches a league by league slug prefix or by sport slug.
  const sportMatches = (matches.data ?? []).filter(
    (m) => m.league.slug.startsWith(slug) || m.league.sport.slug === slug,
  );
  const sportLeagues = (leagues.data ?? []).filter((l) => l.slug.startsWith(slug) || l.sport.slug === slug);

  return (
    <>
      {/* Sits flush under the navbar, like ESPN's scores bar — pulled up out of <main>'s padding. */}
      <div className="-mx-4 -mt-12 mb-6 border-b-2 border-pixel-ink bg-night-900 px-4 py-2.5 sm:-mx-6 sm:px-6">
        <ScoreboardStrip categorySlug={slug} date={date} />
      </div>

      <div className="flex flex-col gap-6">
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
    </>
  );
}

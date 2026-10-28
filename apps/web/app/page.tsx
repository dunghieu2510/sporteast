import type { Metadata } from "next";
import { getLeagues, getMatches, getPage } from "@/lib/api";
import { GameList } from "@/components/game-list";
import { HomeContent } from "@/components/home-content";
import { MockNotice } from "@/components/mock-notice";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const DEFAULT_TITLE = "Live Sports Schedules, Scores & Streams";
const DEFAULT_HOME_DESC = `Today's NFL, NBA, NHL, MLB, MLS, WNBA and college football schedules with start times in US Eastern and live scores on ${SITE_NAME} — a free streameast alternative.`;

export async function generateMetadata(): Promise<Metadata> {
  const { data: homePage } = await getPage("home");
  const title = homePage?.metaTitle ?? DEFAULT_TITLE;
  const description = homePage?.metaDescription ?? DEFAULT_HOME_DESC;
  const ogTitle = homePage?.metaTitle ?? `${SITE_NAME} · Live Sports Schedules & Scores`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: { type: "website", siteName: SITE_NAME, url: `${SITE_URL}/`, title: ogTitle, description },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}

export default async function HomePage() {
  const [leagues, matches] = await Promise.all([getLeagues(), getMatches()]);
  const isMock = leagues.source === "mock" || matches.source === "mock";

  return (
    <div className="flex flex-col gap-6 pt-8">
      {isMock && <MockNotice />}
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Live & Upcoming</h1>
        <p className="mt-1 text-sm text-muted">NBA, NFL, NHL and MMA, all in one place.</p>
      </header>
      <GameList leagues={leagues.data ?? []} matches={matches.data ?? []} />
      <HomeContent />
    </div>
  );
}

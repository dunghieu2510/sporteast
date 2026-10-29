import type { Metadata } from "next";
import { getLeagues, getMatches, getPage } from "@/lib/api";
import { GameList } from "@/components/game-list";
import { HomeContent } from "@/components/home-content";
import { MockNotice } from "@/components/mock-notice";
import { ScoreboardStrip } from "@/components/scoreboard-strip";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { etDate } from "@/lib/format";

const DEFAULT_TITLE = "Live Sports Schedules, Scores & Streams";
const DEFAULT_HOME_DESC = `Today's NFL, NBA, NHL, MLB, MLS, WNBA and college football schedules with start times in US Eastern and live scores on ${SITE_NAME} — a free streameast alternative.`;
const DEFAULT_LEAGUE = "nba-streams";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

type Props = { searchParams: Promise<{ league?: string; date?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const { league: leagueParam, date: dateParam } = await searchParams;
  const league = leagueParam || DEFAULT_LEAGUE;
  const date = dateParam && DATE_RE.test(dateParam) ? dateParam : etDate(0);
  const [leagues, matches] = await Promise.all([getLeagues(), getMatches()]);
  const isMock = leagues.source === "mock" || matches.source === "mock";

  return (
    <>
      {/* Sits flush under the navbar, like ESPN's scores bar — pulled up out of <main>'s padding. */}
      <div className="-mx-4 -mt-12 mb-6 border-b-2 border-pixel-ink bg-night-900 px-4 py-2.5 sm:-mx-6 sm:px-6">
        <ScoreboardStrip categorySlug={league} date={date} leagues={leagues.data ?? []} />
      </div>

      <div className="flex flex-col gap-6">
        {isMock && <MockNotice />}
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Live & Upcoming</h1>
          <p className="mt-1 text-sm text-muted">NBA, NFL, NHL and MMA, all in one place.</p>
        </header>
        <GameList leagues={leagues.data ?? []} matches={matches.data ?? []} />
        <HomeContent />
      </div>
    </>
  );
}

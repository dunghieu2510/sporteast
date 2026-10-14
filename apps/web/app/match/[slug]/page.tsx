import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  effectiveStatus,
  formatGameClock,
  type MatchDetail,
  type MatchEvent,
  type MatchEventType,
  type StreamSummary,
} from "@arena/types";
import Link from "next/link";
import { getMatch, getMatches } from "@/lib/api";
import { formatKickoff, formatStartsIn, formatViewers } from "@/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LiveBadge } from "@/components/live-badge";
import { MockNotice } from "@/components/mock-notice";
import { TeamCrest } from "@/components/team-crest";
import { GameInformation, LastFiveGames, MatchPreview } from "@/components/match-details";
import { AutoRefresh } from "@/components/auto-refresh";
import { EmbedPlayer } from "@/components/embed-player";
import {
  SITE_NAME,
  jsonLdString,
  matchJsonLd,
  matchSeoDescription,
  matchSeoKeywords,
  matchSeoTitle,
  matchUrl,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getMatch(slug);
  if (!data) return { title: "Game not found", robots: { index: false } };

  const title = matchSeoTitle(data);
  const description = matchSeoDescription(data);
  return {
    title,
    description,
    keywords: matchSeoKeywords(data),
    alternates: { canonical: matchUrl(data.slug) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
      url: matchUrl(data.slug),
    },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description },
  };
}

const eventIcon: Record<MatchEventType, string> = {
  SCORE: "●",
  PENALTY: "⚑",
  PERIOD_START: "▶",
  PERIOD_END: "⏸",
  FINISH: "🏁",
  OTHER: "•",
};

export default async function MatchPage({ params }: Props) {
  const { slug } = await params;
  const { data: fetched, source } = await getMatch(slug);
  if (!fetched) notFound();

  // Status follows the clock: LIVE at start time, FINISHED 4h later.
  const match: MatchDetail = { ...fetched, embeds: fetched.embeds ?? [], status: effectiveStatus(fetched) };
  const live = match.status === "LIVE";
  const categorySlug = match.league.sport.slug === "soccer" ? "soccer" : match.league.slug;

  // Sibling games in the same category, for internal linking / discovery.
  const { data: allMatches } = await getMatches();
  const related = (allMatches ?? [])
    .filter((m) => m.slug !== match.slug && (m.league.sport.slug === "soccer" ? "soccer" : m.league.slug) === categorySlug)
    .slice(0, 8);
  const stream = match.streams[0];
  // Theme động: màu 2 đội, hoặc màu giải khi không có đội (MMA)
  const homeColor = match.homeTeam?.primaryColor ?? match.league.color;
  const awayColor = match.awayTeam?.primaryColor ?? match.league.color;
  const gameClock = formatGameClock(match.league.sport.slug, match.period, match.clock);

  return (
    <div className="relative flex flex-col gap-6 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(matchJsonLd(match)) }} />
      <AutoRefresh />
      {source === "mock" && <MockNotice />}

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: match.league.name, href: `/sport/${categorySlug}` },
          { name: match.title, href: `/match/${match.slug}` },
        ]}
      />

      <header className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{`${match.title} Live Stream`}</h1>
        <p className="mt-1 text-sm text-muted">
          {match.league.name} · {live ? "Live now" : formatKickoff(match.startTime)}
        </p>
      </header>

      <section className="glass relative flex flex-col items-center gap-4 p-6 pt-8">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2"
          style={{ background: `linear-gradient(90deg, ${homeColor} 50%, ${awayColor} 50%)` }}
        />
        <div className="flex items-center gap-3 text-sm text-muted">
          {live ? <LiveBadge label={gameClock} /> : <span>{formatKickoff(match.startTime)}</span>}
          <span>
            {match.league.icon} {match.league.name}
          </span>
          {match.venue && <span className="hidden sm:inline">· {match.venue}</span>}
        </div>
        {match.homeTeam && match.awayTeam ? <Scoreboard match={match} /> : <CardHeader match={match} />}
      </section>

      <div className="flex flex-col gap-6">
        {match.embeds.length > 0 ? (
          <EmbedPlayer embeds={match.embeds} title={match.title} />
        ) : stream?.embedUrl ? (
          <Player stream={stream} />
        ) : null}
        <Timeline events={match.events} match={match} />
        <LastFiveGames match={match} />
        <GameInformation match={match} />
        <MatchPreview match={match} />
        <RelatedMatches league={match.league.name} categorySlug={categorySlug} matches={related} />
      </div>
    </div>
  );
}

function RelatedMatches({
  league,
  categorySlug,
  matches,
}: {
  league: string;
  categorySlug: string;
  matches: { id: string; slug: string; title: string; startTime: string }[];
}) {
  return (
    <section className="glass p-6 sm:p-8">
      <h2 className="mb-4 font-display text-lg font-bold">More {league} Games</h2>
      {matches.length > 0 ? (
        <ul className="divide-y-2 divide-white/5">
          {matches.map((m) => (
            <li key={m.id}>
              <Link href={`/match/${m.slug}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-neon">
                <span className="min-w-0 truncate font-semibold">{m.title}</span>
                <span className="tabular shrink-0 text-xs text-muted">{formatKickoff(m.startTime)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No other {league} games right now.</p>
      )}
      <Link href={`/sport/${categorySlug}`} className="mt-4 inline-block font-display text-xs font-bold tracking-wider text-neon">
        VIEW FULL {league.toUpperCase()} SCHEDULE ▸
      </Link>
    </section>
  );
}

function Scoreboard({ match }: { match: MatchDetail }) {
  const home = match.homeTeam!;
  const away = match.awayTeam!;
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="flex items-center justify-end gap-3">
        <span className="hidden text-right font-display text-xl font-semibold sm:block">{home.name}</span>
        <TeamCrest team={home} size="lg" />
      </div>
      <div className="tabular text-center font-display text-5xl font-bold">
        {match.status === "SCHEDULED" ? (
          <span className="text-xl text-neon">{formatStartsIn(match.startTime)}</span>
        ) : (
          <>
            {match.homeScore}
            <span className="mx-2 text-white/30">:</span>
            {match.awayScore}
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <TeamCrest team={away} size="lg" />
        <span className="hidden font-display text-xl font-semibold sm:block">{away.name}</span>
      </div>
    </div>
  );
}

function CardHeader({ match }: { match: MatchDetail }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-bold sm:text-3xl">{match.title}</p>
      {match.status === "SCHEDULED" && <p className="mt-2 text-neon">{formatStartsIn(match.startTime)}</p>}
    </div>
  );
}

function Player({ stream }: { stream?: StreamSummary }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
        {stream?.embedUrl ? (
          <iframe
            src={stream.embedUrl}
            title={stream.title}
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
            <div>
              <div className="mb-2 text-4xl">▶</div>
              {stream
                ? "HLS player (hls.js / Vidstack) mounts here using the stream's playbackId."
                : "No channel is broadcasting this game yet."}
            </div>
          </div>
        )}
      </div>
      {stream && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-semibold">{stream.title}</p>
            <p className="text-muted">
              @{stream.channel.handle}
              {stream.channel.isVerified && <span className="ml-1 text-neon">✔</span>}
            </p>
          </div>
          <span className="tabular shrink-0 text-muted">👁 {formatViewers(stream.viewerPeak)}</span>
        </div>
      )}
    </section>
  );
}

function Timeline({ events, match }: { events: MatchEvent[]; match: MatchDetail }) {
  if (!events.length) return null;
  const teamFor = (id: string | null) =>
    id == null ? null : id === match.homeTeam?.id ? match.homeTeam : id === match.awayTeam?.id ? match.awayTeam : null;

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 font-display text-lg font-bold">Play-by-play</h2>
      <ol className="flex flex-col gap-1.5">
        {[...events].reverse().map((e) => {
          const team = teamFor(e.teamId);
          return (
            <li
              key={e.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${team ? "" : "bg-white/5 text-muted"}`}
            >
              <span className="tabular w-16 shrink-0 text-xs font-semibold text-muted">
                {formatGameClock(match.league.sport.slug, e.period, e.clock)}
              </span>
              <span style={{ color: team?.primaryColor }}>{eventIcon[e.type]}</span>
              {team && <span className="w-10 shrink-0 font-bold">{team.shortName}</span>}
              <span>{e.detail ?? e.type}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}


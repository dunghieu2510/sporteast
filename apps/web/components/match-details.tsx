import Link from "next/link";
import type { LastFiveGame, MatchDetail, TeamSummary } from "@arena/types";
import { formatKickoff } from "@/lib/format";
import { TeamCrest } from "@/components/team-crest";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

const resultStyle = {
  W: "bg-emerald-500/15 text-emerald-400",
  L: "bg-rose-500/15 text-rose-400",
  D: "bg-white/10 text-muted",
} as const;

export function GameInformation({ match }: { match: MatchDetail }) {
  const info = match.details?.info;
  const venue = info?.venue;
  const location = [venue?.city, venue?.state].filter(Boolean).join(", ");

  const rows: [string, string][] = [
    ["Date & time", formatKickoff(match.startTime)],
    ...(venue ? ([["Venue", venue.name]] as [string, string][]) : match.venue ? ([["Venue", match.venue]] as [string, string][]) : []),
    ...(location ? ([["Location", location]] as [string, string][]) : []),
    ...(info?.broadcasts.length ? ([["Coverage", info.broadcasts.join(", ")]] as [string, string][]) : []),
    ...(info?.attendance ? ([["Attendance", info.attendance.toLocaleString("en-US")]] as [string, string][]) : []),
    ...(info?.officials.length
      ? ([["Referees", info.officials.map((o) => o.name).join(", ")]] as [string, string][])
      : []),
  ];

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 font-display text-lg font-bold">Game Information</h2>
      <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const longDayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });
const clockFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

type Form = { wins: number; losses: number; draws: number; record: string; last: LastFiveGame };

/** Last-five summary. ESPN lists games oldest first, so the last item is the most recent. */
function formOf(games: LastFiveGame[]): Form | null {
  if (!games.length) return null;
  const count = (r: string) => games.filter((g) => g.result === r).length;
  const wins = count("W");
  const losses = count("L");
  const draws = count("D");
  return { wins, losses, draws, record: draws ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`, last: games[games.length - 1] };
}

function lastGameText(g: LastFiveGame) {
  const outcome = g.result === "W" ? "a win" : g.result === "L" ? "a loss" : "a draw";
  const where = g.homeAway === "away" ? "at" : "against";
  return `${outcome}${g.score ? ` (${g.score})` : ""} ${where} ${g.opponent.name} on ${dateFmt.format(new Date(g.date))}`;
}

/**
 * Fixed-template preview text for every game, built from Game Information and Last Five Games.
 * Sections whose data is missing are skipped, so it is safe for any match.
 */
export function MatchPreview({ match }: { match: MatchDetail }) {
  const { homeTeam: home, awayTeam: away, league, startTime } = match;
  if (!home || !away) return null;

  const info = match.details?.info;
  const venue = info?.venue?.name ?? match.venue;
  const place = [info?.venue?.city, info?.venue?.state].filter(Boolean).join(", ");
  const when = new Date(startTime);
  const verb = match.status === "FINISHED" ? "faced" : match.status === "LIVE" ? "are facing" : "face";
  const day = longDayFmt.format(when);
  const time = `${clockFmt.format(when)} ET`;

  const homeForm = formOf(match.details?.lastFive.home ?? []);
  const awayForm = formOf(match.details?.lastFive.away ?? []);

  const paragraphs: string[] = [];

  paragraphs.push(
    `${away.name} ${verb} ${home.name} in ${league.name} action on ${day} at ${time}` +
      `${venue ? `, at ${venue}${place ? ` in ${place}` : ""}` : ""}. ` +
      `Follow this page for ${match.title} live streams, the start time and full game information on Methstreams, a free streameast alternative.`,
  );

  if (match.status === "FINISHED" && match.homeScore + match.awayScore > 0) {
    paragraphs.push(`Final score: ${home.name} ${match.homeScore}, ${away.name} ${match.awayScore}.`);
  }

  const where: string[] = [];
  if (info?.broadcasts.length) where.push(`The game is broadcast on ${info.broadcasts.join(", ")}.`);
  if (info?.attendance) where.push(`Attendance was ${info.attendance.toLocaleString("en-US")}.`);
  if (info?.officials.length) where.push(`Officials: ${info.officials.map((o) => o.name).join(", ")}.`);
  if (where.length) paragraphs.push(where.join(" "));

  const formLine = (team: TeamSummary, f: Form | null) =>
    f ? `${team.name} are ${f.record} over their last five games, most recently ${lastGameText(f.last)}.` : null;
  const formLines = [formLine(away, awayForm), formLine(home, homeForm)].filter(Boolean) as string[];
  if (formLines.length) paragraphs.push(`Recent form: ${formLines.join(" ")}`);

  if (homeForm && awayForm) {
    const compare =
      homeForm.wins === awayForm.wins
        ? `Both teams arrive with ${homeForm.wins} ${homeForm.wins === 1 ? "win" : "wins"} in their last five, so recent form is even.`
        : `${homeForm.wins > awayForm.wins ? home.name : away.name} enter with the stronger recent form, ` +
          `${Math.max(homeForm.wins, awayForm.wins)} wins in their last five against ${Math.min(homeForm.wins, awayForm.wins)} for ${
            homeForm.wins > awayForm.wins ? away.name : home.name
          }.`;
    paragraphs.push(compare);
  }

  const categorySlug = league.sport.slug === "soccer" ? "soccer" : league.slug;

  return (
    <section className="glass p-6 sm:p-8">
      <h2 className="mb-4 font-display text-lg font-bold">{match.title} Live Stream: Game Preview</h2>
      <div className="space-y-4 leading-relaxed text-white/90">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <p>
          Bookmark this page and check back for the live status of {match.title}. You can also browse the full{" "}
          <Link href={`/sport/${categorySlug}`} className="text-neon underline">
            {league.name} schedule
          </Link>{" "}
          for every game on today&apos;s slate.
        </p>
      </div>
    </section>
  );
}

export function LastFiveGames({ match }: { match: MatchDetail }) {
  const lastFive = match.details?.lastFive;
  if (!lastFive || !match.homeTeam || !match.awayTeam) return null;
  if (!lastFive.home.length && !lastFive.away.length) return null;

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 font-display text-lg font-bold">Last Five Games</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <TeamLastFive team={match.awayTeam} games={lastFive.away} />
        <TeamLastFive team={match.homeTeam} games={lastFive.home} />
      </div>
    </section>
  );
}

function TeamLastFive({ team, games }: { team: TeamSummary; games: LastFiveGame[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <TeamCrest team={team} size="sm" />
        <span className="font-display font-semibold">{team.name}</span>
      </div>
      {games.length === 0 ? (
        <p className="text-sm text-muted">No recent games.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {games.map((g, i) => (
            <li key={`${g.date}-${i}`} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="tabular w-14 shrink-0 text-xs text-muted">{dateFmt.format(new Date(g.date))}</span>
              <span className="w-6 shrink-0 text-xs text-muted">{g.homeAway === "away" ? "@" : "vs"}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{g.opponent.abbr ?? g.opponent.name}</span>
              <span className="tabular shrink-0 text-muted">{g.score}</span>
              {g.result && (
                <span className={`w-6 shrink-0 rounded text-center text-xs font-bold ${resultStyle[g.result]}`}>
                  {g.result}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

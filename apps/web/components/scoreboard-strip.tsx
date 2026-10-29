import Link from "next/link";
import { effectiveStatus, type LeagueSummary, type MatchSummary, type TeamSummary } from "@arena/types";
import { getMatches } from "@/lib/api";
import { etDate, formatEtDate, formatKickoffTime, shiftEtDate } from "@/lib/format";
import { TeamCrest } from "@/components/team-crest";
import { LeagueSelect } from "@/components/league-select";

/**
 * ESPN-style horizontal score ticker for one day. On category pages, `categorySlug` is fixed and
 * no dropdown is shown (the page itself is already scoped to one sport). Pass `leagues` (e.g. on
 * the homepage) to show a dropdown for picking which league's scoreboard to display instead.
 */
export async function ScoreboardStrip({
  categorySlug,
  date,
  leagues,
}: {
  categorySlug: string;
  date: string;
  leagues?: LeagueSummary[];
}) {
  const { data } = await getMatches({ date });
  const matches = (data ?? [])
    .filter((m) => m.league.slug.startsWith(categorySlug) || m.league.sport.slug === categorySlug)
    .map((m) => ({ ...m, status: effectiveStatus(m) }));

  const isToday = date === etDate(0);

  return (
    <div className="flex items-stretch gap-3">
      {leagues && <LeagueSelect leagues={leagues} selected={categorySlug} />}

      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {isToday ? (
          <span className="pixel-btn px-3 py-1 text-sm text-white/30">‹</span>
        ) : (
          <Link href={`?date=${shiftEtDate(date, -1)}`} className="pixel-btn px-3 py-1 text-sm text-white">
            ‹
          </Link>
        )}
        <span className="w-16 shrink-0 text-center text-sm font-semibold text-white">
          {isToday ? "Today" : formatEtDate(date)}
        </span>
        <Link href={`?date=${shiftEtDate(date, 1)}`} className="pixel-btn px-3 py-1 text-sm text-white">
          ›
        </Link>
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto pb-1">
        {matches.length ? (
          matches.map((m) => <ScoreCard key={m.id} match={m} />)
        ) : (
          <p className="flex items-center px-2 text-sm whitespace-nowrap text-muted">No games this day.</p>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ match: m }: { match: MatchSummary }) {
  if (!m.homeTeam || !m.awayTeam) return null;
  const live = m.status === "LIVE";
  const final = m.status === "FINISHED";
  const showScore = live || final;

  return (
    <Link href={`/match/${m.slug}`} className="pixel-row flex w-32 shrink-0 flex-col gap-1 px-2.5 py-2">
      <span className={`text-center text-[10px] font-bold uppercase ${live ? "text-live" : "text-muted"}`}>
        {live ? "Live" : final ? "Final" : formatKickoffTime(m.startTime)}
      </span>
      <TeamRow team={m.awayTeam} score={m.awayScore} show={showScore} won={final && m.awayScore > m.homeScore} />
      <TeamRow team={m.homeTeam} score={m.homeScore} show={showScore} won={final && m.homeScore > m.awayScore} />
    </Link>
  );
}

function TeamRow({ team, score, show, won }: { team: TeamSummary; score: number; show: boolean; won: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <TeamCrest team={team} size="xs" />
      <span className={`min-w-0 flex-1 truncate text-xs ${won ? "font-bold text-white" : "text-white/70"}`}>{team.shortName}</span>
      {show && (
        <span className="flex items-center gap-0.5">
          <span className={`tabular text-xs ${won ? "font-bold text-white" : "text-white/60"}`}>{score}</span>
          {won && <span className="text-[8px] text-neon">◂</span>}
        </span>
      )}
    </span>
  );
}

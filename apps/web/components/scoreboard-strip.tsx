import Link from "next/link";
import { effectiveStatus, type MatchSummary, type TeamSummary } from "@arena/types";
import { getMatches } from "@/lib/api";
import { etDate, formatEtDate, formatKickoffTime, shiftEtDate } from "@/lib/format";
import { TeamCrest } from "@/components/team-crest";

/** ESPN-style horizontal score ticker for one day, scoped to the current category. */
export async function ScoreboardStrip({ categorySlug, date }: { categorySlug: string; date: string }) {
  const { data } = await getMatches({ date });
  const matches = (data ?? [])
    .filter((m) => m.league.slug.startsWith(categorySlug) || m.league.sport.slug === categorySlug)
    .map((m) => ({ ...m, status: effectiveStatus(m) }));

  const isToday = date === etDate(0);

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex shrink-0 items-center gap-2">
        {isToday ? (
          <span className="pixel-btn px-3 py-2 text-sm text-white/30">‹</span>
        ) : (
          <Link href={`?date=${shiftEtDate(date, -1)}`} className="pixel-btn px-3 py-2 text-sm text-white">
            ‹
          </Link>
        )}
        <span className="w-16 shrink-0 text-center text-sm font-semibold text-white">
          {isToday ? "Today" : formatEtDate(date)}
        </span>
        <Link href={`?date=${shiftEtDate(date, 1)}`} className="pixel-btn px-3 py-2 text-sm text-white">
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
    <Link href={`/match/${m.slug}`} className="pixel-row flex w-44 shrink-0 flex-col gap-1.5 px-3 py-2.5">
      <span className={`text-[11px] font-bold ${live ? "text-live" : "text-muted"}`}>
        {live ? "LIVE" : final ? "Final" : formatKickoffTime(m.startTime)}
      </span>
      <TeamRow team={m.awayTeam} score={m.awayScore} show={showScore} won={final && m.awayScore > m.homeScore} />
      <TeamRow team={m.homeTeam} score={m.homeScore} show={showScore} won={final && m.homeScore > m.awayScore} />
    </Link>
  );
}

function TeamRow({ team, score, show, won }: { team: TeamSummary; score: number; show: boolean; won: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <TeamCrest team={team} size="sm" />
      <span className={`min-w-0 flex-1 truncate text-sm ${won ? "font-bold text-white" : "text-white/80"}`}>{team.shortName}</span>
      {show && <span className={`tabular text-sm ${won ? "font-bold text-white" : "text-white/60"}`}>{score}</span>}
    </span>
  );
}

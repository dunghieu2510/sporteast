"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { effectiveStatus, formatGameClock, type LeagueSummary, type MatchSummary } from "@arena/types";
import { formatStartsIn, formatStartsInShort } from "@/lib/format";
import { TeamCrest } from "@/components/team-crest";

/** Re-render every 30s so "x hours from now" stays fresh. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function GameList({ leagues, matches }: { leagues: LeagueSummary[]; matches: MatchSummary[] }) {
  const [league, setLeague] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const now = useNow();

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Status follows the clock (LIVE at start time, FINISHED 4h later) without a page reload.
  // Live first, then by start time; finished games are hidden.
  const upcoming = useMemo(
    () =>
      matches
        .map((m) => ({ ...m, status: effectiveStatus(m, now) }))
        .filter((m) => m.status === "LIVE" || m.status === "SCHEDULED")
        .sort((a, b) => {
          if ((a.status === "LIVE") !== (b.status === "LIVE")) return a.status === "LIVE" ? -1 : 1;
          return a.startTime.localeCompare(b.startTime);
        }),
    [matches, now],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of upcoming) c[m.league.slug] = (c[m.league.slug] ?? 0) + 1;
    return c;
  }, [upcoming]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return upcoming.filter((m) => {
      if (league && m.league.slug !== league) return false;
      if (!q) return true;
      const haystack = [m.title, m.league.name, m.league.shortName, m.homeTeam?.name, m.awayTeam?.name]
        .filter(Boolean)
        .join(" ");
      return normalize(haystack).includes(q);
    });
  }, [upcoming, league, query]);

  return (
    <div className="flex flex-col gap-5">
      {/* League filter */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Pill active={league === null} onClick={() => setLeague(null)} icon="⚡" label="All" count={upcoming.length} />
        {leagues.map((l) => (
          <Pill
            key={l.slug}
            active={league === l.slug}
            onClick={() => setLeague(l.slug)}
            icon={l.icon}
            label={l.shortName}
            count={counts[l.slug] ?? 0}
            color={l.color}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-2 sm:p-3">
        <div className="relative mb-2">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, teams or leagues…"
            aria-label="Search games"
            className="w-full bg-night-950 px-4 py-3.5 pr-12 text-[15px] placeholder:text-muted"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 border-2 border-pixel-ink bg-night-700 px-1.5 text-xs text-muted">
            /
          </kbd>
        </div>

        {visible.length ? (
          <ul className="flex flex-col gap-1.5">
            {visible.map((m) => (
              <li key={m.id}>
                <GameRow match={m} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-muted">No games match your search.</p>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: string | null;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold ${
        active ? "bg-neon text-night-950" : "pixel-btn text-white"
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
      <span
        className="tabular pixel-tag px-1.5 text-[11px] font-bold"
        style={{ background: active ? "#141414" : (color ?? "#d0d0d0"), color: active ? "#ffd23f" : "#141414" }}
      >
        {count}
      </span>
    </button>
  );
}

function GameRow({ match, now }: { match: MatchSummary; now: number }) {
  const live = match.status === "LIVE";
  return (
    <Link
      href={`/match/${match.slug}`}
      className="pixel-row group flex items-center gap-3 px-3 py-3.5 sm:px-4"
    >
      <span className="w-10 shrink-0 font-display text-sm font-bold sm:w-14">{match.league.shortName}</span>
      <span aria-hidden className="h-5 w-1.5 shrink-0" style={{ background: match.league.color }} />
      {match.homeTeam && match.awayTeam ? (
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px] text-white/90 group-hover:text-white">
          <TeamCrest team={match.homeTeam} size="sm" />
          <span className="min-w-0 flex-1 truncate">{match.homeTeam.name}</span>
          <span className="shrink-0 text-xs text-muted">vs</span>
          <TeamCrest team={match.awayTeam} size="sm" />
          <span className="min-w-0 flex-1 truncate">{match.awayTeam.name}</span>
        </span>
      ) : (
        <span className="line-clamp-2 min-w-0 flex-1 text-[15px] text-white/90 group-hover:text-white sm:line-clamp-1">
          {match.title}
        </span>
      )}

      {live ? (
        <span className="flex shrink-0 items-center gap-2">
          {(match.homeTeam || match.period != null) && (
            <span className="tabular hidden text-xs text-muted sm:inline">
              {match.homeTeam && `${match.homeScore}-${match.awayScore} · `}
              {formatGameClock(match.league.sport.slug, match.period, match.clock)}
            </span>
          )}
          <span className="pixel-tag inline-flex items-center gap-1.5 bg-live px-3 py-1 font-display text-[11px] font-bold tracking-wider text-white">
            <span className="size-2 animate-pulse-live bg-white" />
            LIVE
          </span>
        </span>
      ) : (
        <span
          suppressHydrationWarning
          className="tabular pixel-tag shrink-0 bg-night-950 px-3 py-1 text-[11px] font-semibold text-muted"
        >
          <span className="sm:hidden">{formatStartsInShort(match.startTime, now)}</span>
          <span className="hidden sm:inline">{formatStartsIn(match.startTime, now)}</span>
        </span>
      )}
    </Link>
  );
}

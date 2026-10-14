import {
  fixtureLeagues,
  fixtureMatches,
  fixtureTeams,
  fixtureTitle,
  type FixtureMatch,
  type LeagueSummary,
  type MatchDetail,
  type MatchSummary,
  type TeamSummary,
} from "@arena/types";

// Fallback data built from the same fixtures as the DB seed.

export function mockLeagues(): LeagueSummary[] {
  return fixtureLeagues.map((l) => ({ id: l.slug, ...l }));
}

function team(slug?: string): TeamSummary | null {
  const t = fixtureTeams.find((x) => x.slug === slug);
  if (!t) return null;
  return { id: t.slug, slug: t.slug, name: t.name, shortName: t.shortName, logoUrl: null, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor };
}

function toSummary(m: FixtureMatch): MatchSummary {
  const league = mockLeagues().find((l) => l.slug === m.league)!;
  return {
    id: m.slug,
    slug: m.slug,
    title: fixtureTitle(m),
    startTime: new Date(Date.now() + m.startOffsetMin * 60_000).toISOString(),
    status: m.status,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    period: m.period ?? null,
    clock: m.clock ?? null,
    venue: m.venue ?? null,
    league,
    homeTeam: team(m.home),
    awayTeam: team(m.away),
  };
}

export function mockMatches(): MatchSummary[] {
  return fixtureMatches.map(toSummary);
}

export function mockMatchDetail(slug: string): MatchDetail | null {
  const m = fixtureMatches.find((x) => x.slug === slug);
  if (!m) return null;
  const summary = toSummary(m);
  return {
    ...summary,
    details: null,
    embeds: [],
    events: (m.events ?? []).map((e, i) => ({
      id: `${m.slug}-e${i}`,
      type: e.type,
      period: e.period,
      clock: e.clock,
      teamId: e.side === "home" ? (summary.homeTeam?.id ?? null) : e.side === "away" ? (summary.awayTeam?.id ?? null) : null,
      detail: e.detail,
    })),
    streams: m.stream
      ? [
          {
            id: `${m.slug}-s1`,
            title: m.stream.title,
            status: "LIVE",
            contentSource: "UGC",
            playbackId: null,
            embedUrl: null,
            viewerPeak: m.stream.viewerPeak,
            channel: { handle: "playbyplay", title: "Play-by-Play Live", isVerified: true },
          },
        ]
      : [],
  };
}

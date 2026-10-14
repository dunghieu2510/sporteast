// Demo data shared by the DB seed (packages/db/prisma/seed.ts) and the web
// fallback (apps/web/lib/mock.ts), so both show the same games.
// Times are offsets in minutes from "now" so the schedule always looks current.

export interface FixtureLeague {
  slug: string;
  name: string;
  shortName: string;
  sport: { slug: string; name: string };
  color: string;
  icon: string;
}

export interface FixtureTeam {
  slug: string;
  league: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface FixtureEvent {
  type: "SCORE" | "PENALTY" | "PERIOD_START" | "PERIOD_END" | "FINISH" | "OTHER";
  period: number;
  clock: string | null;
  side: "home" | "away" | null;
  detail: string | null;
}

export interface FixtureMatch {
  slug: string;
  league: string;
  /** Required when there are no teams (MMA cards); otherwise built from team names. */
  title?: string;
  home?: string;
  away?: string;
  startOffsetMin: number;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clock?: string;
  venue?: string;
  events?: FixtureEvent[];
  stream?: { title: string; viewerPeak: number };
}

export const fixtureLeagues: FixtureLeague[] = [
  { slug: "nba", name: "NBA", shortName: "NBA", sport: { slug: "basketball", name: "Basketball" }, color: "#f97316", icon: "🏀" },
  { slug: "nfl", name: "NFL", shortName: "NFL", sport: { slug: "american-football", name: "American Football" }, color: "#3b82f6", icon: "🏈" },
  { slug: "nhl", name: "NHL", shortName: "NHL", sport: { slug: "ice-hockey", name: "Ice Hockey" }, color: "#22d3ee", icon: "🏒" },
  { slug: "ufc", name: "UFC", shortName: "MMA", sport: { slug: "mma", name: "MMA" }, color: "#ef4444", icon: "🥊" },
];

export const fixtureTeams: FixtureTeam[] = [
  // NBA
  { slug: "los-angeles-lakers", league: "nba", name: "Los Angeles Lakers", shortName: "LAL", primaryColor: "#552583", secondaryColor: "#FDB927" },
  { slug: "boston-celtics", league: "nba", name: "Boston Celtics", shortName: "BOS", primaryColor: "#007A33", secondaryColor: "#FFFFFF" },
  { slug: "golden-state-warriors", league: "nba", name: "Golden State Warriors", shortName: "GSW", primaryColor: "#1D428A", secondaryColor: "#FFC72C" },
  { slug: "new-york-knicks", league: "nba", name: "New York Knicks", shortName: "NYK", primaryColor: "#006BB6", secondaryColor: "#F58426" },
  { slug: "chicago-bulls", league: "nba", name: "Chicago Bulls", shortName: "CHI", primaryColor: "#CE1141", secondaryColor: "#000000" },
  { slug: "miami-heat", league: "nba", name: "Miami Heat", shortName: "MIA", primaryColor: "#98002E", secondaryColor: "#F9A01B" },
  { slug: "denver-nuggets", league: "nba", name: "Denver Nuggets", shortName: "DEN", primaryColor: "#0E2240", secondaryColor: "#FEC524" },
  { slug: "oklahoma-city-thunder", league: "nba", name: "Oklahoma City Thunder", shortName: "OKC", primaryColor: "#007AC1", secondaryColor: "#EF3B24" },
  // NFL
  { slug: "kansas-city-chiefs", league: "nfl", name: "Kansas City Chiefs", shortName: "KC", primaryColor: "#E31837", secondaryColor: "#FFB81C" },
  { slug: "buffalo-bills", league: "nfl", name: "Buffalo Bills", shortName: "BUF", primaryColor: "#00338D", secondaryColor: "#C60C30" },
  { slug: "philadelphia-eagles", league: "nfl", name: "Philadelphia Eagles", shortName: "PHI", primaryColor: "#004C54", secondaryColor: "#A5ACAF" },
  { slug: "dallas-cowboys", league: "nfl", name: "Dallas Cowboys", shortName: "DAL", primaryColor: "#003594", secondaryColor: "#869397" },
  { slug: "san-francisco-49ers", league: "nfl", name: "San Francisco 49ers", shortName: "SF", primaryColor: "#AA0000", secondaryColor: "#B3995D" },
  { slug: "baltimore-ravens", league: "nfl", name: "Baltimore Ravens", shortName: "BAL", primaryColor: "#241773", secondaryColor: "#9E7C0C" },
  // NHL
  { slug: "edmonton-oilers", league: "nhl", name: "Edmonton Oilers", shortName: "EDM", primaryColor: "#041E42", secondaryColor: "#FF4C00" },
  { slug: "toronto-maple-leafs", league: "nhl", name: "Toronto Maple Leafs", shortName: "TOR", primaryColor: "#00205B", secondaryColor: "#FFFFFF" },
  { slug: "detroit-red-wings", league: "nhl", name: "Detroit Red Wings", shortName: "DET", primaryColor: "#CE1126", secondaryColor: "#FFFFFF" },
  { slug: "seattle-kraken", league: "nhl", name: "Seattle Kraken", shortName: "SEA", primaryColor: "#001628", secondaryColor: "#99D9D9" },
  { slug: "washington-capitals", league: "nhl", name: "Washington Capitals", shortName: "WSH", primaryColor: "#C8102E", secondaryColor: "#041E42" },
  { slug: "new-york-rangers", league: "nhl", name: "New York Rangers", shortName: "NYR", primaryColor: "#0038A8", secondaryColor: "#CE1126" },
  { slug: "boston-bruins", league: "nhl", name: "Boston Bruins", shortName: "BOS", primaryColor: "#FFB81C", secondaryColor: "#000000" },
  { slug: "colorado-avalanche", league: "nhl", name: "Colorado Avalanche", shortName: "COL", primaryColor: "#6F263D", secondaryColor: "#236192" },
];

export const fixtureMatches: FixtureMatch[] = [
  {
    slug: "kansas-city-chiefs-vs-buffalo-bills",
    league: "nfl",
    home: "kansas-city-chiefs",
    away: "buffalo-bills",
    startOffsetMin: -95,
    status: "LIVE",
    homeScore: 17,
    awayScore: 13,
    period: 3,
    clock: "8:42",
    venue: "GEHA Field at Arrowhead Stadium",
    events: [
      { type: "PERIOD_START", period: 1, clock: "15:00", side: null, detail: "Kickoff" },
      { type: "SCORE", period: 1, clock: "9:12", side: "home", detail: "Touchdown (7-0)" },
      { type: "SCORE", period: 1, clock: "2:40", side: "away", detail: "Field goal (7-3)" },
      { type: "SCORE", period: 2, clock: "6:15", side: "away", detail: "Field goal (7-6)" },
      { type: "SCORE", period: 2, clock: "0:31", side: "home", detail: "Touchdown (14-6)" },
      { type: "PERIOD_END", period: 2, clock: "0:00", side: null, detail: "Halftime" },
      { type: "SCORE", period: 3, clock: "11:02", side: "away", detail: "Touchdown (14-13)" },
      { type: "SCORE", period: 3, clock: "9:20", side: "home", detail: "Field goal (17-13)" },
    ],
    stream: { title: "Live watch-party & play-by-play breakdown", viewerPeak: 3820 },
  },
  {
    slug: "edmonton-oilers-vs-toronto-maple-leafs",
    league: "nhl",
    home: "edmonton-oilers",
    away: "toronto-maple-leafs",
    startOffsetMin: -50,
    status: "LIVE",
    homeScore: 2,
    awayScore: 1,
    period: 2,
    clock: "11:05",
    venue: "Rogers Place",
  },
  {
    slug: "ufc-fight-night-prelims",
    league: "ufc",
    title: "UFC Fight Night: Prelims",
    startOffsetMin: -30,
    status: "LIVE",
    period: 2,
    clock: "3:14",
  },
  { slug: "los-angeles-lakers-vs-boston-celtics", league: "nba", home: "los-angeles-lakers", away: "boston-celtics", startOffsetMin: 60, status: "SCHEDULED", venue: "Crypto.com Arena" },
  { slug: "detroit-red-wings-vs-seattle-kraken", league: "nhl", home: "detroit-red-wings", away: "seattle-kraken", startOffsetMin: 120, status: "SCHEDULED" },
  { slug: "ufc-fight-night-main-card", league: "ufc", title: "UFC Fight Night: Main Card", startOffsetMin: 150, status: "SCHEDULED" },
  { slug: "philadelphia-eagles-vs-dallas-cowboys", league: "nfl", home: "philadelphia-eagles", away: "dallas-cowboys", startOffsetMin: 180, status: "SCHEDULED" },
  { slug: "golden-state-warriors-vs-new-york-knicks", league: "nba", home: "golden-state-warriors", away: "new-york-knicks", startOffsetMin: 240, status: "SCHEDULED" },
  { slug: "washington-capitals-vs-new-york-rangers", league: "nhl", home: "washington-capitals", away: "new-york-rangers", startOffsetMin: 300, status: "SCHEDULED" },
  { slug: "chicago-bulls-vs-miami-heat", league: "nba", home: "chicago-bulls", away: "miami-heat", startOffsetMin: 360, status: "SCHEDULED" },
  { slug: "san-francisco-49ers-vs-baltimore-ravens", league: "nfl", home: "san-francisco-49ers", away: "baltimore-ravens", startOffsetMin: 420, status: "SCHEDULED" },
  { slug: "boston-bruins-vs-colorado-avalanche", league: "nhl", home: "boston-bruins", away: "colorado-avalanche", startOffsetMin: 480, status: "SCHEDULED" },
  { slug: "denver-nuggets-vs-oklahoma-city-thunder", league: "nba", home: "denver-nuggets", away: "oklahoma-city-thunder", startOffsetMin: 600, status: "SCHEDULED" },
];

/** Display title: explicit title, or "Home vs Away". */
export function fixtureTitle(match: FixtureMatch): string {
  if (match.title) return match.title;
  const name = (slug?: string) => fixtureTeams.find((t) => t.slug === slug)?.name ?? "TBD";
  return `${name(match.home)} vs ${name(match.away)}`;
}

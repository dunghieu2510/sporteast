// Shared types between API and Web (dates are ISO strings after JSON serialization).

export * from "./fixtures";

// ───────── Multi-site registry ─────────
// Matches/leagues/teams/embeds are shared across every site; only content
// (categories, pages, site settings) is per-site. Adding a 4th site is one
// entry here plus a web deploy — no schema or API change.

export interface SiteInfo {
  key: string;
  name: string;
  url: string;
}

export const SITES: SiteInfo[] = [
  { key: "methstreams", name: "Methstreams", url: "https://methstreamsv2.com" },
  { key: "crackstreamsv2", name: "Crackstreamsv2", url: "https://crackstreamsv2.com" },
  { key: "crackstreameast", name: "Crackstreameast", url: "https://crackstreameast.com" },
];

export const DEFAULT_SITE = SITES[0].key;

export const isValidSite = (site: string): boolean => SITES.some((s) => s.key === site);

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";

export type MatchEventType = "SCORE" | "PENALTY" | "PERIOD_START" | "PERIOD_END" | "FINISH" | "OTHER";

export type ContentSource = "UGC" | "OFFICIAL_EMBED" | "LICENSED";

export interface SportSummary {
  slug: string;
  name: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface LeagueSummary {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  color: string;
  icon: string | null;
  sport: SportSummary;
}

export interface MatchSummary {
  id: string;
  slug: string;
  title: string;
  startTime: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  period: number | null;
  clock: string | null;
  venue: string | null;
  league: LeagueSummary;
  /** Null for events without teams (e.g. MMA fight cards). */
  homeTeam: TeamSummary | null;
  awayTeam: TeamSummary | null;
}

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  period: number;
  clock: string | null;
  teamId: string | null;
  detail: string | null;
}

export interface StreamSummary {
  id: string;
  title: string;
  status: "IDLE" | "LIVE" | "ENDED";
  contentSource: ContentSource;
  playbackId: string | null;
  embedUrl: string | null;
  viewerPeak: number;
  channel: { handle: string; title: string; isVerified: boolean };
}

export interface LastFiveGame {
  date: string;
  /** Whether this team played at home or away in that game. */
  homeAway: "home" | "away";
  opponent: { name: string; abbr: string | null; logo: string | null };
  /** Final score as ESPN displays it, winner's score first (e.g. "125-120" for a loss 120-125). */
  score: string | null;
  result: "W" | "L" | "D" | null;
  league: string | null;
}

export interface GameInformation {
  venue: { name: string; city: string | null; state: string | null; image: string | null } | null;
  attendance: number | null;
  officials: { name: string; role: string }[];
  broadcasts: string[];
}

export interface MatchDetails {
  fetchedAt: string;
  /** True once fetched after the game ended — no need to refetch. */
  final?: boolean;
  info: GameInformation;
  lastFive: { home: LastFiveGame[]; away: LastFiveGame[] };
}

export interface EmbedLink {
  id: string;
  title: string;
  url: string;
}

export interface MatchDetail extends MatchSummary {
  /** Active embed links added by the admin, in display order. */
  embeds: EmbedLink[];
  events: MatchEvent[];
  streams: StreamSummary[];
  /** Null until the ESPN sync has fetched it. */
  details: MatchDetails | null;
}

// ───────── Managed content (categories & static pages) ─────────

export interface CategoryContent {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  heading: string | null;
  description: string | null;
  contentTitle: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  /** ISO timestamp from the API; used for sitemap <lastmod>. */
  updatedAt?: string;
}

export interface SiteSettings {
  logoTextMain: string;
  logoTextAccent: string;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
  /** ISO timestamp from the API; used for sitemap <lastmod>. */
  updatedAt?: string;
}

// ───────── Time-based status ─────────

/** A game is treated as over this long after its start time. */
export const GAME_WINDOW_MS = 4 * 60 * 60 * 1000;

/** SCHEDULED → LIVE at start time → FINISHED 4h after start. POSTPONED / FINISHED never change. */
export function effectiveStatus(m: { status: MatchStatus; startTime: string }, now = Date.now()): MatchStatus {
  if (m.status === "POSTPONED" || m.status === "FINISHED") return m.status;
  const start = new Date(m.startTime).getTime();
  if (now >= start + GAME_WINDOW_MS) return "FINISHED";
  if (now >= start) return "LIVE";
  return m.status;
}

// ───────── Game clock ─────────

const PERIODS: Record<string, { prefix: string; regulation: number }> = {
  basketball: { prefix: "Q", regulation: 4 },
  "american-football": { prefix: "Q", regulation: 4 },
  "ice-hockey": { prefix: "P", regulation: 3 },
  mma: { prefix: "R", regulation: 5 },
};

/** "Q3 8:42", "P2 11:05", "R2 3:14", "OT 2:10". */
export function formatGameClock(sportSlug: string, period: number | null, clock: string | null): string {
  if (period == null) return clock ?? "";
  const cfg = PERIODS[sportSlug] ?? { prefix: "P", regulation: Infinity };
  const label = period > cfg.regulation ? "OT" : `${cfg.prefix}${period}`;
  return clock ? `${label} ${clock}` : label;
}

// ───────── Realtime (Socket.IO, namespace /live) ─────────

export type MatchUpdatePayload = Pick<MatchSummary, "id" | "homeScore" | "awayScore" | "period" | "clock" | "status">;

export interface ServerToClientEvents {
  "match:update": (payload: MatchUpdatePayload) => void;
  "match:event": (payload: MatchEvent & { matchId: string }) => void;
  "viewers:count": (payload: { streamId: string; count: number }) => void;
}

export interface ClientToServerEvents {
  "match:join": (matchId: string) => void;
  "match:leave": (matchId: string) => void;
}

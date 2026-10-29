import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MatchStatus } from "@arena/db";
import { PrismaService } from "../prisma/prisma.service";

const TREND48_API = "https://trend48.st/api";
const TREND48_CATEGORY: Record<string, string> = { "nba-streams": "basketball", nhl: "hockey", nfl: "american-football" };
/** The 3 sources to attach per match: the base watch_url, then 2 pinned alternate streams. */
const SOURCES = [
  { title: "Main", suffix: "" },
  { title: "Link 1", suffix: "?source=admin&stream=1" },
  { title: "Link 2", suffix: "?source=admin&stream=2" },
];

const TAIFOOD_DOMAIN = "https://taifood-blog.asia";
/** taifood-blog.asia's own team codes — not standard ESPN abbreviations (e.g. "ny" not "nyk",
 * "sa" not "sas", "gs" not "gsw", "no" not "nop", "utah" spelled out). Pinned from confirmed
 * examples; Memphis Grizzlies and Phoenix Suns have no confirmed code yet. */
const TAIFOOD_TEAM_CODE: Record<string, string> = {
  "Brooklyn Nets": "bkn",
  "Boston Celtics": "bos",
  "Detroit Pistons": "det",
  "New York Knicks": "ny",
  "Sacramento Kings": "sac",
  "San Antonio Spurs": "sa",
  "Los Angeles Lakers": "lal",
  "Portland Trail Blazers": "por",
  "Washington Wizards": "wsh",
  "Cleveland Cavaliers": "cle",
  "Charlotte Hornets": "cha",
  "Miami Heat": "mia",
  "Atlanta Hawks": "atl",
  "Philadelphia 76ers": "phi",
  "Indiana Pacers": "ind",
  "Orlando Magic": "orl",
  "Toronto Raptors": "tor",
  "Denver Nuggets": "den",
  "New Orleans Pelicans": "no",
  "Chicago Bulls": "chi",
  "Milwaukee Bucks": "mil",
  "Houston Rockets": "hou",
  "Minnesota Timberwolves": "min",
  "Golden State Warriors": "gs",
  "Utah Jazz": "utah",
  "Oklahoma City Thunder": "okc",
  "Dallas Mavericks": "dal",
  "Los Angeles Clippers": "lac",
};
const taifoodDayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }); // "YYYY-MM-DD"

interface Trend48Match {
  title: string;
  category: string;
  watch_url: string;
}

interface SyncMatch {
  id: string;
  startTime: Date;
  league: { slug: string };
  awayTeam: { name: string } | null;
  homeTeam: { name: string } | null;
}

/**
 * Auto-attaches a trend48.st stream embed (Main/Link 1/Link 2) to each NBA/NHL/NFL match,
 * matched by exact "Away vs Home" title against trend48's own API (so those links are never
 * guessed/stale) — plus a 4th NBA-only embed built from taifood-blog.asia's URL pattern.
 *
 * shortcut: trend48 title match only — a team-name mismatch (abbreviation vs full name)
 * silently skips that match rather than guessing a link; upgrade to fuzzy matching if real
 * misses show up.
 *
 * shortcut: taifood's URL has no public API, so Link 4 is built, not fetched — team order in
 * its URL isn't reliably "away-home" (confirmed examples go both ways with no detectable
 * rule), so this defaults to away-first and will 404 for the games that use the opposite
 * order. Upgrade: if taifood ever exposes a real event list, match by title like trend48.
 */
@Injectable()
export class Trend48Service {
  private readonly logger = new Logger(Trend48Service.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("*/10 * * * *")
  async sync(): Promise<void> {
    try {
      const links = await this.fetchLinks();
      const matches = (await this.prisma.match.findMany({
        where: {
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
          league: { slug: { in: Object.keys(TREND48_CATEGORY) } },
        },
        select: {
          id: true,
          startTime: true,
          league: { select: { slug: true } },
          awayTeam: { select: { name: true } },
          homeTeam: { select: { name: true } },
        },
      })) as SyncMatch[];

      let added = 0;
      for (const m of matches) {
        if (!m.awayTeam || !m.homeTeam) continue;

        const base = links.get(`${m.awayTeam.name} vs ${m.homeTeam.name}`);
        if (base) {
          for (const [i, { title, suffix }] of SOURCES.entries()) {
            if (await this.attachEmbed(m.id, title, `${base}${suffix}`, i)) added++;
          }
        }

        if (m.league.slug === "nba-streams") {
          const link4 = this.taifoodLink(m);
          if (link4 && (await this.attachEmbed(m.id, "Link 4", link4, SOURCES.length))) added++;
        }
      }
      if (added) this.logger.log(`Added ${added} embed(s)`);
    } catch (err: any) {
      this.logger.warn(`Sync failed: ${err?.message ?? err}`);
    }
  }

  private taifoodLink(m: SyncMatch): string | null {
    const away = TAIFOOD_TEAM_CODE[m.awayTeam!.name];
    const home = TAIFOOD_TEAM_CODE[m.homeTeam!.name];
    if (!away || !home) return null;
    const date = taifoodDayFmt.format(m.startTime);
    return `${TAIFOOD_DOMAIN}/embed/nba/${date}/${away}-${home}`;
  }

  /** Creates the embed if it doesn't already exist; returns whether it created one. */
  private async attachEmbed(matchId: string, title: string, url: string, sortOrder: number): Promise<boolean> {
    const exists = await this.prisma.matchEmbed.findFirst({ where: { matchId, url }, select: { id: true } });
    if (exists) return false;
    await this.prisma.matchEmbed.create({ data: { matchId, title, url, sortOrder } });
    return true;
  }

  /** title ("Away vs Home") → watch_url, for basketball/hockey/american-football events only. */
  private async fetchLinks(): Promise<Map<string, string>> {
    try {
      const res = await fetch(`${TREND48_API}/matches/all-today`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = (await res.json()) as Trend48Match[];
      const wanted = new Set(Object.values(TREND48_CATEGORY));
      return new Map(events.filter((e) => wanted.has(e.category)).map((e) => [e.title, e.watch_url]));
    } catch (err: any) {
      this.logger.warn(`trend48.st fetch failed: ${err?.message ?? err}`);
      return new Map();
    }
  }
}

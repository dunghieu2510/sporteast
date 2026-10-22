import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MatchStatus } from "@arena/db";
import { PrismaService } from "../prisma/prisma.service";

const TREND48_API = "https://trend48.st/api";
const TREND48_CATEGORY: Record<string, string> = { nba: "basketball", nhl: "hockey" };
/** The 3 sources to attach per match: the base watch_url, then 2 pinned alternate streams. */
const SOURCES = [
  { title: "Main", suffix: "" },
  { title: "Link 1", suffix: "?source=admin&stream=1" },
  { title: "Link 2", suffix: "?source=admin&stream=2" },
];

interface Trend48Match {
  title: string;
  category: string;
  watch_url: string;
}

/**
 * Auto-attaches a trend48.st stream embed to each NBA/NHL match, matched by exact
 * "Away vs Home" title against trend48's own API (so links are never guessed/stale).
 *
 * shortcut: exact title match only — a team-name mismatch (abbreviation vs full name)
 * silently skips that match rather than guessing a link; upgrade to fuzzy matching if
 * real misses show up.
 */
@Injectable()
export class Trend48Service {
  private readonly logger = new Logger(Trend48Service.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("*/10 * * * *")
  async sync(): Promise<void> {
    try {
      const links = await this.fetchLinks();
      if (links.size === 0) return;

      const matches = await this.prisma.match.findMany({
        where: {
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
          league: { slug: { in: Object.keys(TREND48_CATEGORY) } },
        },
        select: { id: true, awayTeam: { select: { name: true } }, homeTeam: { select: { name: true } } },
      });

      let added = 0;
      for (const m of matches) {
        if (!m.awayTeam || !m.homeTeam) continue;
        const base = links.get(`${m.awayTeam.name} vs ${m.homeTeam.name}`);
        if (!base) continue;
        for (const [i, { title, suffix }] of SOURCES.entries()) {
          const url = `${base}${suffix}`;
          const exists = await this.prisma.matchEmbed.findFirst({ where: { matchId: m.id, url }, select: { id: true } });
          if (exists) continue;
          await this.prisma.matchEmbed.create({ data: { matchId: m.id, title, url, sortOrder: i } });
          added++;
        }
      }
      if (added) this.logger.log(`Added ${added} trend48.st embed(s)`);
    } catch (err: any) {
      this.logger.warn(`Sync failed: ${err?.message ?? err}`);
    }
  }

  /** title ("Away vs Home") → watch_url, for basketball/hockey events only. */
  private async fetchLinks(): Promise<Map<string, string>> {
    const res = await fetch(`${TREND48_API}/matches/all-today`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = (await res.json()) as Trend48Match[];
    const wanted = new Set(Object.values(TREND48_CATEGORY));
    return new Map(events.filter((e) => wanted.has(e.category)).map((e) => [e.title, e.watch_url]));
  }
}

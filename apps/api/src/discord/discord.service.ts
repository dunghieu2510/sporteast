import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MatchStatus } from "@arena/db";
import { SITES, type MatchSummary, type SiteInfo } from "@arena/types";
import { MatchesService } from "../matches/matches.service";

const API = "https://discord.com/api/v10";
const TZ = "Asia/Ho_Chi_Minh";
const GROUPED_LEAGUES = ["nfl"];
const PER_MATCH_LEAGUES = ["nba", "nhl"];
const LEAGUES = [...GROUPED_LEAGUES, ...PER_MATCH_LEAGUES];
const WINDOW_MS = 24 * 3_600_000;
const MAX_EMBEDS_PER_MESSAGE = 10; // Discord's hard limit per message
const TREND48_API = "https://trend48.st/api";
const TREND48_CATEGORY: Record<string, string> = { nba: "basketball", nhl: "hockey" };

const CHANNEL_ENV: Record<string, string> = {
  methstreams: "DISCORD_CHANNEL_METHSTREAMS",
  crackstreamsv2: "DISCORD_CHANNEL_CRACKSTREAMSV2",
  crackstreameast: "DISCORD_CHANNEL_CRACKSTREAMEAST",
};

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

interface Trend48Match {
  title: string;
  category: string;
  watch_url: string;
}

/**
 * Posts the day's NBA/NHL/NFL schedule to each site's Discord channel, once a day, via a Discord bot.
 * NFL stays one grouped summary embed linking to the site's own category page. NBA/NHL each get their
 * own embed, linked to the matching event on trend48.st (its own API, not a guessed URL) — batched
 * across messages since Discord caps a message at 10 embeds.
 * Config: DISCORD_BOT_TOKEN + one DISCORD_CHANNEL_<SITE> per site; a site with no channel id is skipped.
 */
@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(private readonly matches: MatchesService) {}

  private get token(): string {
    return process.env.DISCORD_BOT_TOKEN ?? "";
  }

  @Cron("0 19 * * *", { timeZone: TZ })
  async postDailySchedule(): Promise<void> {
    if (!this.token) {
      this.logger.warn("DISCORD_BOT_TOKEN not set — skipping daily schedule post");
      return;
    }
    const upcoming = await this.upcomingMatches();
    const trend48Links = await this.fetchTrend48Links();
    for (const site of SITES) {
      const channelId = process.env[CHANNEL_ENV[site.key]];
      if (!channelId) continue;
      for (const body of this.buildMessages(site, upcoming, trend48Links)) {
        await this.post(channelId, body);
      }
    }
  }

  private async upcomingMatches(): Promise<MatchSummary[]> {
    const all = (await this.matches.list({ status: MatchStatus.SCHEDULED, limit: 200 })) as unknown as MatchSummary[];
    const now = Date.now();
    return all.filter((m) => LEAGUES.includes(m.league.slug) && new Date(m.startTime).getTime() <= now + WINDOW_MS);
  }

  /** title ("Away vs Home") → watch_url, for basketball/hockey events only. */
  private async fetchTrend48Links(): Promise<Map<string, string>> {
    try {
      const res = await fetch(`${TREND48_API}/matches/all-today`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        this.logger.warn(`trend48.st fetch failed: HTTP ${res.status}`);
        return new Map();
      }
      const events = (await res.json()) as Trend48Match[];
      const wanted = new Set(Object.values(TREND48_CATEGORY));
      return new Map(events.filter((e) => wanted.has(e.category)).map((e) => [e.title, e.watch_url]));
    } catch (err: any) {
      this.logger.warn(`trend48.st fetch failed: ${err?.message ?? err}`);
      return new Map();
    }
  }

  private buildMessages(site: SiteInfo, matches: MatchSummary[], trend48Links: Map<string, string>): { embeds: unknown[] }[] {
    const grouped = matches.filter((m) => GROUPED_LEAGUES.includes(m.league.slug));

    // shortcut: exact "Away vs Home" title match against trend48's own list; a team-name mismatch
    // (abbreviation vs full name) silently skips that match's embed rather than guessing a link —
    // upgrade to fuzzy matching if real misses show up.
    const perMatch = matches
      .filter((m) => PER_MATCH_LEAGUES.includes(m.league.slug) && m.awayTeam && m.homeTeam)
      .map((m) => ({ m, link: trend48Links.get(`${m.awayTeam!.name} vs ${m.homeTeam!.name}`) }))
      .filter((x): x is { m: MatchSummary; link: string } => Boolean(x.link));

    const messages: { embeds: unknown[] }[] = [{ embeds: [this.buildGroupedEmbed(site, grouped)] }];
    for (let i = 0; i < perMatch.length; i += MAX_EMBEDS_PER_MESSAGE) {
      messages.push({
        embeds: perMatch.slice(i, i + MAX_EMBEDS_PER_MESSAGE).map(({ m, link }) => this.buildMatchEmbed(m, link)),
      });
    }
    return messages;
  }

  private buildGroupedEmbed(site: SiteInfo, matches: MatchSummary[]) {
    const byLeague = new Map<string, MatchSummary[]>();
    for (const m of matches) {
      const list = byLeague.get(m.league.slug) ?? [];
      list.push(m);
      byLeague.set(m.league.slug, list);
    }

    const fields =
      byLeague.size === 0
        ? [{ name: "Today", value: "No NFL games today." }]
        : GROUPED_LEAGUES.filter((slug) => byLeague.has(slug)).map((slug) => {
            const list = byLeague.get(slug)!;
            const { name, icon } = list[0].league;
            const lines = list.map((m) => `${timeFmt.format(new Date(m.startTime))} — ${m.title}`);
            return {
              name: `${icon ?? ""} ${name}`.trim(),
              value: `${lines.join("\n")}\n[View ${name} Schedule](${site.url}/sport/${slug})`,
            };
          });

    return { title: "📅 Today's Schedule", color: 0x39ff88, fields, timestamp: new Date().toISOString() };
  }

  private buildMatchEmbed(m: MatchSummary, link: string) {
    const { icon, name: leagueName } = m.league;
    return {
      title: `${icon ?? ""} ${m.awayTeam!.name} vs ${m.homeTeam!.name}`.trim(),
      description: `${leagueName} — ${timeFmt.format(new Date(m.startTime))}\n[Watch](${link})`,
      color: 0x39ff88,
    };
  }

  private async post(channelId: string, body: unknown): Promise<void> {
    try {
      const res = await fetch(`${API}/channels/${channelId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) this.logger.warn(`Post to channel ${channelId} failed: HTTP ${res.status} ${await res.text()}`);
    } catch (err: any) {
      this.logger.warn(`Post to channel ${channelId} failed: ${err?.message ?? err}`);
    }
  }
}

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
const EVENT_DOMAIN = "https://trend48.st";

const CHANNEL_ENV: Record<string, string> = {
  methstreams: "DISCORD_CHANNEL_METHSTREAMS",
  crackstreamsv2: "DISCORD_CHANNEL_CRACKSTREAMSV2",
  crackstreameast: "DISCORD_CHANNEL_CRACKSTREAMEAST",
};

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
// trend48.st dates its events by US game-day (ET), not VN time — an evening US game is already
// "tomorrow" in VN, so the link's date must follow ET or it lands 1 day late.
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }); // "YYYY-MM-DD"

/** domain/event/m-{away-slug}-vs-{home-slug}-{MMDD}, e.g. trend48.st/event/m-phoenix-suns-vs-portland-trail-blazers-1022 */
const eventLink = (m: MatchSummary): string | null => {
  if (!m.awayTeam || !m.homeTeam) return null;
  const mmdd = dayFmt.format(new Date(m.startTime)).slice(5).replace("-", "");
  return `${EVENT_DOMAIN}/event/m-${m.awayTeam.slug}-vs-${m.homeTeam.slug}-${mmdd}`;
};

/**
 * Posts the day's NBA/NHL/NFL schedule to each site's Discord channel, once a day, via a Discord bot.
 * NFL stays one grouped summary embed linking to the site's own category page. NBA/NHL each get their
 * own embed linking to trend48.st's event page — batched across messages since Discord caps a message
 * at 10 embeds.
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
    for (const site of SITES) {
      const channelId = process.env[CHANNEL_ENV[site.key]];
      if (!channelId) continue;
      for (const body of this.buildMessages(site, upcoming)) {
        await this.post(channelId, body);
      }
    }
  }

  private async upcomingMatches(): Promise<MatchSummary[]> {
    const all = (await this.matches.list({ status: MatchStatus.SCHEDULED, limit: 200 })) as unknown as MatchSummary[];
    const now = Date.now();
    return all.filter((m) => LEAGUES.includes(m.league.slug) && new Date(m.startTime).getTime() <= now + WINDOW_MS);
  }

  private buildMessages(site: SiteInfo, matches: MatchSummary[]): { embeds: unknown[] }[] {
    const grouped = matches.filter((m) => GROUPED_LEAGUES.includes(m.league.slug));
    const perMatch = matches.filter((m) => PER_MATCH_LEAGUES.includes(m.league.slug) && eventLink(m));

    const messages: { embeds: unknown[] }[] = [{ embeds: [this.buildGroupedEmbed(site, grouped)] }];
    for (let i = 0; i < perMatch.length; i += MAX_EMBEDS_PER_MESSAGE) {
      messages.push({ embeds: perMatch.slice(i, i + MAX_EMBEDS_PER_MESSAGE).map((m) => this.buildMatchEmbed(m)) });
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

  private buildMatchEmbed(m: MatchSummary) {
    const { icon, name: leagueName } = m.league;
    return {
      title: `${icon ?? ""} ${m.awayTeam!.name} vs ${m.homeTeam!.name}`.trim(),
      description: `${leagueName} — ${timeFmt.format(new Date(m.startTime))}\n[Watch](${eventLink(m)})`,
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

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MatchStatus } from "@arena/db";
import { SITES, type MatchSummary, type SiteInfo } from "@arena/types";
import { MatchesService } from "../matches/matches.service";

const API = "https://discord.com/api/v10";
const TZ = "Asia/Ho_Chi_Minh";
const LEAGUES = ["nba", "nhl", "nfl"];
const WINDOW_MS = 24 * 3_600_000;

const CHANNEL_ENV: Record<string, string> = {
  methstreams: "DISCORD_CHANNEL_METHSTREAMS",
  crackstreamsv2: "DISCORD_CHANNEL_CRACKSTREAMSV2",
  crackstreameast: "DISCORD_CHANNEL_CRACKSTREAMEAST",
};

const timeFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

/**
 * Posts the day's NBA/NHL/NFL schedule to each site's Discord channel, once a day, via a Discord bot.
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
      await this.post(channelId, this.buildEmbed(site, upcoming));
    }
  }

  private async upcomingMatches(): Promise<MatchSummary[]> {
    const all = (await this.matches.list({ status: MatchStatus.SCHEDULED, limit: 200 })) as unknown as MatchSummary[];
    const now = Date.now();
    return all.filter((m) => LEAGUES.includes(m.league.slug) && new Date(m.startTime).getTime() <= now + WINDOW_MS);
  }

  private buildEmbed(site: SiteInfo, matches: MatchSummary[]) {
    const byLeague = new Map<string, MatchSummary[]>();
    for (const m of matches) {
      const list = byLeague.get(m.league.slug) ?? [];
      list.push(m);
      byLeague.set(m.league.slug, list);
    }

    const fields =
      byLeague.size === 0
        ? [{ name: "Hôm nay", value: "Không có trận NBA/NHL/NFL nào." }]
        : LEAGUES.filter((slug) => byLeague.has(slug)).map((slug) => {
            const list = byLeague.get(slug)!;
            const { name, icon } = list[0].league;
            const lines = list.map((m) => `${timeFmt.format(new Date(m.startTime))} — ${m.title}`);
            return {
              name: `${icon ?? ""} ${name}`.trim(),
              value: `${lines.join("\n")}\n[Xem lịch ${name}](${site.url}/sport/${slug})`,
            };
          });

    return { embeds: [{ title: "📅 Lịch thi đấu hôm nay", color: 0x39ff88, fields, timestamp: new Date().toISOString() }] };
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

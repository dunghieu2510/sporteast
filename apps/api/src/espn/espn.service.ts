import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MatchStatus, Prisma } from "@arena/db";
import type { LastFiveGame, MatchDetails } from "@arena/types";
import { PrismaService } from "../prisma/prisma.service";
import { IndexNowService } from "../indexnow/indexnow.service";

const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports";
const TZ = "America/New_York";
const ID_PREFIX = "espn:";
const OVERDUE_HOURS = 4;
const DETAILS_REFRESH_MS = 3 * 3_600_000;
const DETAILS_CONCURRENCY = 5;

interface PendingDetails {
  cfg: LeagueConfig;
  eventId: string;
  externalId: string;
  final: boolean;
}

interface LeagueConfig {
  path: string;
  query?: string;
  slug: string;
  name: string;
  sport: { slug: string; name: string };
  icon: string;
  color: string;
}

const LEAGUES: LeagueConfig[] = [
  { path: "football/nfl", slug: "nfl", name: "NFL", sport: { slug: "american-football", name: "American Football" }, icon: "🏈", color: "#3b82f6" },
  { path: "football/college-football", query: "groups=80", slug: "ncaaf", name: "NCAAF", sport: { slug: "american-football", name: "American Football" }, icon: "🏈", color: "#a855f7" },
  { path: "baseball/mlb", slug: "mlb", name: "MLB", sport: { slug: "baseball", name: "Baseball" }, icon: "⚾", color: "#ef4444" },
  { path: "basketball/nba", slug: "nba", name: "NBA", sport: { slug: "basketball", name: "Basketball" }, icon: "🏀", color: "#f97316" },
  { path: "soccer/usa.1", slug: "mls", name: "MLS", sport: { slug: "soccer", name: "Soccer" }, icon: "⚽", color: "#06b6d4" },
  { path: "basketball/wnba", slug: "wnba", name: "WNBA", sport: { slug: "basketball", name: "Basketball" }, icon: "🏀", color: "#ec4899" },
  { path: "hockey/nhl", slug: "nhl", name: "NHL", sport: { slug: "ice-hockey", name: "Ice Hockey" }, icon: "🏒", color: "#22d3ee" },
];

/**
 * Leagues whose full roster we crawl up front (one ESPN request per league, not per team) to
 * backfill every team's logo immediately, even teams with no game yet. Kept to these 4 — all
 * have a small, fixed roster (~30 teams) and ESPN's /teams endpoint returns it in a single call.
 * NCAAF (762 teams across every division, ungated by ESPN here), MLS and WNBA are left out on
 * purpose; their teams still get a logo the normal way, the first time they appear in a match.
 */
const LOGO_CRAWL_SLUGS = new Set(["nfl", "nba", "nhl", "mlb"]);

/** YYYY-MM-DD theo giờ miền Đông Mỹ (cách ESPN chia ngày). */
const etDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

@Injectable()
export class EspnSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EspnSyncService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly indexNow: IndexNowService,
  ) {}

  onApplicationBootstrap() {
    void this.updateStatusByTime();
    void this.sync();
    void this.syncTeamLogos();
  }

  /** Mọi trận: đến giờ bắt đầu → LIVE; quá 4 giờ kể từ giờ bắt đầu → FINISHED. */
  @Cron("* * * * *")
  async updateStatusByTime() {
    try {
      const now = Date.now();
      const finished = await this.prisma.match.updateMany({
        where: {
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
          startTime: { lte: new Date(now - OVERDUE_HOURS * 3_600_000) },
        },
        data: { status: MatchStatus.FINISHED },
      });
      const live = await this.prisma.match.updateMany({
        where: { status: MatchStatus.SCHEDULED, startTime: { lte: new Date(now) } },
        data: { status: MatchStatus.LIVE },
      });
      if (live.count || finished.count) {
        this.logger.log(`Status by time: ${live.count} → LIVE, ${finished.count} → FINISHED`);
      }
    } catch (err: any) {
      this.logger.warn(`updateStatusByTime failed: ${err?.message ?? err}`);
    }
  }

  @Cron("*/10 * * * *")
  async sync() {
    if (this.running) return;
    this.running = true;
    try {
      const today = etDay(new Date());
      const results = await Promise.all(
        LEAGUES.map((league) =>
          this.fetchEvents(league, today).then(
            (events) => ({ league, events }),
            (err: any) => {
              this.logger.warn(`ESPN ${league.name} failed: ${err?.message ?? err}`);
              return null;
            },
          ),
        ),
      );

      const complete = results.every(Boolean);
      const seen = new Set<string>();
      const pending: PendingDetails[] = [];
      const newPaths: string[] = [];
      let saved = 0;

      for (const r of results) {
        if (!r) continue;
        const dbLeague = await this.findOrCreateLeague(r.league);
        for (const ev of r.events) {
          try {
            const res = await this.saveMatch(dbLeague, ev);
            if (!res) continue;
            seen.add(res.externalId);
            saved++;
            if (res.created) newPaths.push(`/match/${res.slug}`);
            if (res.needsDetails) {
              pending.push({ cfg: r.league, eventId: String(ev.id), externalId: res.externalId, final: res.final });
            }
          } catch (err: any) {
            this.logger.warn(`Skip event ${ev?.id}: ${err?.message ?? err}`);
          }
        }
      }

      const removed = await this.cleanup(today, seen, complete);
      const detailed = await this.syncDetails(pending);

      // New or removed matches change the home page and the new match pages → tell IndexNow.
      if (newPaths.length || removed) this.indexNow.submit([...newPaths, "/"]);

      this.logger.log(
        `ESPN ${today} (ET): ${saved} matches synced, ${detailed}/${pending.length} details updated, ${removed} removed${complete ? "" : " (some leagues failed)"}`,
      );
    } catch (err: any) {
      this.logger.error(`ESPN sync failed: ${err?.message ?? err}`);
    } finally {
      this.running = false;
    }
  }

  private async fetchEvents(league: LeagueConfig, etDate: string): Promise<any[]> {
    const qs = [`dates=${etDate.replace(/-/g, "")}`, "limit=300", league.query].filter(Boolean).join("&");
    const res = await fetch(`${ESPN_API}/${league.path}/scoreboard?${qs}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { events?: any[] };
    return json.events ?? [];
  }

  /** Trạng thái ESPN, kèm quy tắc theo giờ: đến giờ bắt đầu → LIVE, quá 4 giờ → FINISHED. */
  private toStatus(ev: any, start: Date): MatchStatus | null {
    const name: string = ev.status?.type?.name ?? "";
    if (name === "STATUS_CANCELED") return null;
    if (name === "STATUS_POSTPONED") return MatchStatus.POSTPONED;

    const elapsed = Date.now() - start.getTime();
    if (elapsed >= OVERDUE_HOURS * 3_600_000) return MatchStatus.FINISHED;
    switch (ev.status?.type?.state) {
      case "post":
        return MatchStatus.FINISHED;
      case "in":
        return MatchStatus.LIVE;
      default:
        return elapsed >= 0 ? MatchStatus.LIVE : MatchStatus.SCHEDULED;
    }
  }

  private async saveMatch(
    league: { id: string; slug: string },
    ev: any,
  ): Promise<{ externalId: string; needsDetails: boolean; final: boolean; slug: string; created: boolean } | null> {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
    const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
    const startTime = new Date(ev.date);
    const status = this.toStatus(ev, startTime);
    if (!home?.team || !away?.team || !status || isNaN(startTime.getTime())) return null;

    const externalId = `${ID_PREFIX}${league.slug}:${ev.id}`;
    const [homeTeam, awayTeam] = await Promise.all([this.resolveTeam(league, home.team), this.resolveTeam(league, away.team)]);

    const data = {
      title: `${homeTeam.name} vs ${awayTeam.name}`,
      leagueId: league.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      startTime,
      status,
      homeScore: parseInt(home.score ?? "0", 10) || 0,
      awayScore: parseInt(away.score ?? "0", 10) || 0,
      venue: comp.venue?.fullName ?? null,
    };

    // Find-then-write (instead of upsert) so we know whether this is a brand-new match → ping IndexNow.
    const existing = await this.prisma.match.findUnique({ where: { externalId }, select: { slug: true, details: true } });
    const slug = existing?.slug ?? `${slugify(homeTeam.name)}-vs-${slugify(awayTeam.name)}-${ev.id}`;
    const row = existing
      ? await this.prisma.match.update({ where: { externalId }, data, select: { details: true } })
      : await this.prisma.match.create({ data: { slug, externalId, ...data }, select: { details: true } });

    const final = status === MatchStatus.FINISHED;
    const d = row.details as unknown as MatchDetails | null;
    const needsDetails =
      !d || (final && !d.final) || (!d.final && Date.now() - Date.parse(d.fetchedAt) > DETAILS_REFRESH_MS);
    return { externalId, needsDetails, final, slug, created: !existing };
  }

  private async syncDetails(pending: PendingDetails[]): Promise<number> {
    let done = 0;
    let next = 0;
    const worker = async () => {
      while (next < pending.length) {
        const p = pending[next++];
        try {
          const details = await this.fetchDetails(p.cfg, p.eventId, p.final);
          await this.prisma.match.update({
            where: { externalId: p.externalId },
            data: { details: details as unknown as Prisma.InputJsonValue },
          });
          done++;
        } catch (err: any) {
          this.logger.warn(`Details ${p.externalId} failed: ${err?.message ?? err}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(DETAILS_CONCURRENCY, pending.length) }, worker));
    return done;
  }

  private async fetchDetails(cfg: LeagueConfig, eventId: string, final: boolean): Promise<MatchDetails> {
    const res = await fetch(`${ESPN_API}/${cfg.path}/summary?event=${eventId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j: any = await res.json();

    const gi = j.gameInfo ?? {};
    const v = gi.venue;
    const comp = j.header?.competitions?.[0];
    const teamId = (side: "home" | "away") => {
      const c = comp?.competitors?.find((x: any) => x.homeAway === side);
      return String(c?.team?.id ?? c?.id ?? "");
    };

    const lastFive = (side: "home" | "away"): LastFiveGame[] => {
      const entry = (j.lastFiveGames ?? []).find((t: any) => String(t.team?.id) === teamId(side));
      return (entry?.events ?? []).map((e: any) => ({
        date: e.gameDate,
        homeAway: e.atVs === "@" ? "away" : "home",
        opponent: {
          name: e.opponent?.displayName ?? e.opponent?.name ?? "",
          abbr: e.opponent?.abbreviation ?? null,
          logo: e.opponentLogo ?? e.opponent?.logo ?? null,
        },
        score: e.score ?? null,
        result: e.gameResult === "W" || e.gameResult === "L" ? e.gameResult : e.gameResult ? "D" : null,
        league: e.leagueAbbreviation ?? null,
      }));
    };

    const broadcasts: string[] = [
      ...new Set<string>(
        [...(j.broadcasts ?? []), ...(comp?.broadcasts ?? [])]
          .map((b: any) => b?.media?.shortName ?? b?.shortName ?? b?.names?.[0] ?? b?.name)
          .filter(Boolean),
      ),
    ];

    return {
      fetchedAt: new Date().toISOString(),
      final,
      info: {
        venue: v?.fullName
          ? {
              name: v.fullName,
              city: v.address?.city ?? null,
              state: v.address?.state ?? null,
              image: v.images?.[0]?.href ?? null,
            }
          : null,
        attendance: gi.attendance || null,
        officials: (gi.officials ?? []).map((o: any) => ({
          name: o.displayName ?? o.fullName,
          role: o.position?.displayName ?? "Official",
        })),
        broadcasts,
      },
      lastFive: { home: lastFive("home"), away: lastFive("away") },
    };
  }

  /** Accepts both the scoreboard's team shape (`t.logo`) and the /teams roster shape (normalized to the same `logo` field by fetchTeamRoster). */
  private async resolveTeam(league: { id: string; slug: string }, t: any) {
    const externalId = `${ID_PREFIX}${league.slug}:${t.id}`;
    const logo: string | null = t.logo ?? null;

    const byExternal = await this.prisma.team.findUnique({ where: { externalId } });
    if (byExternal) {
      // Self-heal: a team created before the logo crawl existed still gets one next time it's touched.
      if (!byExternal.logoUrl && logo) return this.prisma.team.update({ where: { id: byExternal.id }, data: { logoUrl: logo } });
      return byExternal;
    }

    const name: string = t.displayName ?? t.name;
    const byName = await this.prisma.team.findFirst({
      where: { leagueId: league.id, name, externalId: null },
    });
    if (byName) {
      return this.prisma.team.update({
        where: { id: byName.id },
        data: { externalId, ...(!byName.logoUrl && logo && { logoUrl: logo }) },
      });
    }

    const base = slugify(name);
    const slug = (await this.prisma.team.findUnique({ where: { slug: base } })) ? `${base}-${league.slug}` : base;
    return this.prisma.team.create({
      data: {
        leagueId: league.id,
        name,
        shortName: t.abbreviation ?? name.slice(0, 3).toUpperCase(),
        slug,
        externalId,
        logoUrl: logo,
        ...(t.color && { primaryColor: `#${t.color}` }),
        ...(t.alternateColor && { secondaryColor: `#${t.alternateColor}` }),
      },
    });
  }

  /**
   * One-off (startup) + on-demand crawl of each LOGO_CRAWL_SLUGS league's full roster.
   * Exactly one ESPN request per league (4 total), independent of team count.
   */
  async syncTeamLogos(): Promise<{ league: string; teams: number }[]> {
    const targets = LEAGUES.filter((l) => LOGO_CRAWL_SLUGS.has(l.slug));
    const results: { league: string; teams: number }[] = [];
    for (const league of targets) {
      try {
        const dbLeague = await this.findOrCreateLeague(league);
        const roster = await this.fetchTeamRoster(league);
        for (const t of roster) await this.resolveTeam(dbLeague, t);
        results.push({ league: league.slug, teams: roster.length });
        this.logger.log(`Team logos: ${league.name} — ${roster.length} teams`);
      } catch (err: any) {
        this.logger.warn(`Team logo crawl failed for ${league.name}: ${err?.message ?? err}`);
      }
      // Polite gap between requests — 4 total either way, but no reason to fire them back to back.
      await new Promise((r) => setTimeout(r, 300));
    }
    return results;
  }

  private async fetchTeamRoster(league: LeagueConfig): Promise<any[]> {
    const res = await fetch(`${ESPN_API}/${league.path}/teams?limit=200`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: any = await res.json();
    const entries: any[] = json.sports?.[0]?.leagues?.[0]?.teams ?? [];
    return entries.map(({ team: t }) => ({
      id: t.id,
      displayName: t.displayName,
      abbreviation: t.abbreviation,
      color: t.color,
      alternateColor: t.alternateColor,
      logo: t.logos?.find((l: any) => l.rel?.includes("default"))?.href ?? t.logos?.[0]?.href ?? null,
    }));
  }

  private async findOrCreateLeague(cfg: LeagueConfig) {
    const existing = await this.prisma.league.findUnique({ where: { slug: cfg.slug } });
    if (existing) return existing;

    const sport = await this.prisma.sport.upsert({
      where: { slug: cfg.sport.slug },
      update: {},
      create: { slug: cfg.sport.slug, name: cfg.sport.name, icon: cfg.icon },
    });
    return this.prisma.league.create({
      data: { sportId: sport.id, slug: cfg.slug, name: cfg.name, shortName: cfg.name, color: cfg.color, icon: cfg.icon },
    });
  }

  /** Xóa trận ESPN của ngày trước, và trận hôm nay còn SCHEDULED nhưng ESPN không còn trả về. */
  private async cleanup(today: string, seen: Set<string>, complete: boolean) {
    const rows = await this.prisma.match.findMany({
      where: { externalId: { startsWith: ID_PREFIX } },
      select: { id: true, externalId: true, startTime: true, status: true },
    });
    const stale = rows.filter(
      (m) => etDay(m.startTime) < today || (complete && m.status === MatchStatus.SCHEDULED && !seen.has(m.externalId!)),
    );
    if (stale.length) await this.prisma.match.deleteMany({ where: { id: { in: stale.map((m) => m.id) } } });
    return stale.length;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { MatchStatus, Prisma } from "@arena/db";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

const teamSelect = {
  id: true,
  name: true,
  shortName: true,
  slug: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
} satisfies Prisma.TeamSelect;

export const leagueSelect = {
  id: true,
  name: true,
  shortName: true,
  slug: true,
  color: true,
  icon: true,
  sport: { select: { slug: true, name: true } },
} satisfies Prisma.LeagueSelect;

const summaryInclude = {
  league: { select: leagueSelect },
  homeTeam: { select: teamSelect },
  awayTeam: { select: teamSelect },
} satisfies Prisma.MatchInclude;

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  list(params: { status?: MatchStatus; league?: string; limit: number }) {
    const { status, league, limit } = params;
    // Live lists change constantly → short cache; everything else can live longer.
    const ttl = status === "LIVE" ? 10 : 60;
    return this.redis.remember(`matches:${status ?? "all"}:${league ?? "all"}:${limit}`, ttl, () =>
      this.prisma.match.findMany({
        where: {
          ...(status && { status }),
          ...(league && { league: { slug: league } }),
        },
        include: summaryInclude,
        omit: { details: true },
        orderBy: { startTime: "asc" },
        take: limit,
      }),
    );
  }

  async findBySlug(slug: string) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      include: {
        ...summaryInclude,
        embeds: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, title: true, url: true },
        },
        events: { orderBy: [{ period: "asc" }, { createdAt: "asc" }] },
        streams: {
          where: { status: { not: "ENDED" } },
          include: { channel: { select: { handle: true, title: true, isVerified: true } } },
          orderBy: { viewerPeak: "desc" },
        },
      },
    });
    if (!match) throw new NotFoundException(`Game "${slug}" not found`);
    return match;
  }
}

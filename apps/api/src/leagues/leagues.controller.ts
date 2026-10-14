import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { leagueSelect } from "../matches/matches.service";

@Controller("leagues")
export class LeaguesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  list() {
    return this.redis.remember("leagues:all", 300, () =>
      this.prisma.league.findMany({ select: leagueSelect, orderBy: { name: "asc" } }),
    );
  }
}

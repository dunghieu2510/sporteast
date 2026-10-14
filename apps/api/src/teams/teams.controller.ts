import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { leagueSelect } from "../matches/matches.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("teams")
export class TeamsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    const team = await this.prisma.team.findUnique({
      where: { slug },
      include: {
        league: { select: leagueSelect },
        homeMatches: { orderBy: { startTime: "desc" }, take: 5 },
        awayMatches: { orderBy: { startTime: "desc" }, take: 5 },
      },
    });
    if (!team) throw new NotFoundException(`Team "${slug}" not found`);
    return team;
  }
}

import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SessionGuard } from "../auth/session.guard";

const TZ = "America/New_York";
const etDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

/** Every game of one US Eastern calendar day (default: today). */
@Controller("admin/matches")
@UseGuards(SessionGuard)
export class AdminMatchesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async day(@Query("date") date?: string) {
    const day = date ?? etDay(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new BadRequestException(`"date" must be YYYY-MM-DD`);

    // An ET day spans at most 25h of UTC, so fetch a wide window and filter by the ET date.
    const mid = Date.parse(`${day}T12:00:00Z`);
    const rows = await this.prisma.match.findMany({
      where: { startTime: { gte: new Date(mid - 36 * 3_600_000), lte: new Date(mid + 36 * 3_600_000) } },
      orderBy: { startTime: "asc" },
      omit: { details: true },
      include: {
        league: { select: { slug: true, name: true, color: true, icon: true } },
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
        _count: { select: { embeds: true } },
      },
    });

    return { date: day, today: etDay(new Date()), matches: rows.filter((m) => etDay(m.startTime) === day) };
  }
}

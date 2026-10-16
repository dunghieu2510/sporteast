import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MatchStatus } from "@arena/db";
import { PrismaService } from "../prisma/prisma.service";
import { SessionGuard } from "../auth/session.guard";
import { IndexNowService } from "../indexnow/indexnow.service";

const TZ = "America/New_York";
const etDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

const STATUSES: MatchStatus[] = [MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.FINISHED, MatchStatus.POSTPONED];

type Body_ = Record<string, unknown>;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** ET wall-clock minutes offset from UTC at the given instant (e.g. EDT -240, EST -300). */
function etOffsetMinutes(date: Date): number {
  const p: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)) {
    p[part.type] = part.value;
  }
  const hour = p.hour === "24" ? 0 : +p.hour;
  const asET = Date.UTC(+p.year, +p.month - 1, +p.day, hour, +p.minute, +p.second);
  return (asET - date.getTime()) / 60_000;
}

/** Parse "YYYY-MM-DDTHH:mm" entered in US Eastern time into a UTC Date. */
function etToUtc(raw: unknown): Date {
  if (typeof raw !== "string") throw new BadRequestException(`"startTime" is required`);
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(raw.trim());
  if (!m) throw new BadRequestException(`"startTime" must be "YYYY-MM-DDTHH:mm" in US Eastern time`);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (isNaN(guess)) throw new BadRequestException("Invalid start time");
  return new Date(guess - etOffsetMinutes(new Date(guess)) * 60_000);
}

function requireText(raw: unknown, field: string, max: number): string {
  if (typeof raw !== "string" || !raw.trim()) throw new BadRequestException(`"${field}" is required`);
  if (raw.trim().length > max) throw new BadRequestException(`"${field}" must be at most ${max} characters`);
  return raw.trim();
}

function optionalText(raw: unknown, field: string, max: number): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new BadRequestException(`"${field}" must be text`);
  if (raw.trim().length > max) throw new BadRequestException(`"${field}" must be at most ${max} characters`);
  return raw.trim() || null;
}

function parseStatus(raw: unknown): MatchStatus | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const v = String(raw).toUpperCase() as MatchStatus;
  if (!STATUSES.includes(v)) throw new BadRequestException(`"status" must be one of ${STATUSES.join(", ")}`);
  return v;
}

const matchView = {
  omit: { details: true },
  include: {
    league: { select: { slug: true, name: true, color: true, icon: true } },
    homeTeam: { select: { name: true, shortName: true } },
    awayTeam: { select: { name: true, shortName: true } },
    _count: { select: { embeds: true } },
  },
} as const;

/** Day view + manual match management (create/edit/delete). */
@Controller("admin/matches")
@UseGuards(SessionGuard)
export class AdminMatchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indexNow: IndexNowService,
  ) {}

  /** Every game of one US Eastern calendar day (default: today). */
  @Get()
  async day(@Query("date") date?: string) {
    const day = date ?? etDay(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new BadRequestException(`"date" must be YYYY-MM-DD`);

    // An ET day spans at most 25h of UTC, so fetch a wide window and filter by the ET date.
    const mid = Date.parse(`${day}T12:00:00Z`);
    const rows = await this.prisma.match.findMany({
      where: { startTime: { gte: new Date(mid - 36 * 3_600_000), lte: new Date(mid + 36 * 3_600_000) } },
      orderBy: { startTime: "asc" },
      ...matchView,
    });

    return { date: day, today: etDay(new Date()), matches: rows.filter((m) => etDay(m.startTime) === day) };
  }

  /** Leagues available for the manual-match league picker. */
  @Get("leagues")
  leagues() {
    return this.prisma.league.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, color: true, sport: { select: { slug: true, name: true } } },
    });
  }

  @Post()
  async create(@Body() body: Body_) {
    const title = requireText(body?.title, "title", 150);
    const startTime = etToUtc(body?.startTime);
    const leagueId = await this.resolveLeagueId(body ?? {});
    const venue = optionalText(body?.venue, "venue", 150);
    const status = parseStatus(body?.status) ?? MatchStatus.SCHEDULED;
    const slug = await this.uniqueSlug(title, startTime);

    const match = await this.prisma.match.create({
      data: { slug, title, leagueId, startTime, status, venue, externalId: null },
      ...matchView,
    });
    this.indexNow.submit([`/match/${match.slug}`, "/"]);
    return match;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: Body_) {
    if (!(await this.prisma.match.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException("Match not found");
    }
    const b = body ?? {};
    const data: {
      title?: string;
      startTime?: Date;
      leagueId?: string;
      venue?: string | null;
      status?: MatchStatus;
    } = {};
    if (b.title !== undefined) data.title = requireText(b.title, "title", 150);
    if (b.startTime !== undefined) data.startTime = etToUtc(b.startTime);
    if (b.venue !== undefined) data.venue = optionalText(b.venue, "venue", 150);
    const status = parseStatus(b.status);
    if (status) data.status = status;
    if (b.leagueId !== undefined || b.leagueSlug !== undefined) data.leagueId = await this.resolveLeagueId(b);

    // Keep the slug stable so the public URL never breaks.
    const match = await this.prisma.match.update({ where: { id }, data, ...matchView });
    this.indexNow.submit([`/match/${match.slug}`]);
    return match;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const match = await this.prisma.match.findUnique({ where: { id }, select: { slug: true } });
    if (!match) throw new NotFoundException("Match not found");
    await this.prisma.match.delete({ where: { id } });
    // Recrawl the now-gone URL (so engines drop it) and the home page.
    this.indexNow.submit([`/match/${match.slug}`, "/"]);
    return { deleted: id };
  }

  /** Use an existing league by id, or find/create one from leagueName + leagueSlug (for new sports like MMA/Boxing). */
  private async resolveLeagueId(body: Body_): Promise<string> {
    if (typeof body.leagueId === "string" && body.leagueId) {
      const l = await this.prisma.league.findUnique({ where: { id: body.leagueId }, select: { id: true } });
      if (!l) throw new BadRequestException("League not found");
      return l.id;
    }
    const name = typeof body.leagueName === "string" ? body.leagueName.trim() : "";
    const slug = typeof body.leagueSlug === "string" ? slugify(body.leagueSlug) : "";
    if (!name || !slug) throw new BadRequestException(`Provide "leagueId", or both "leagueName" and "leagueSlug"`);

    const existing = await this.prisma.league.findUnique({ where: { slug }, select: { id: true } });
    if (existing) return existing.id;

    const sport = await this.prisma.sport.upsert({ where: { slug }, update: {}, create: { slug, name } });
    const league = await this.prisma.league.create({ data: { sportId: sport.id, slug, name, shortName: name } });
    return league.id;
  }

  private async uniqueSlug(title: string, startTime: Date): Promise<string> {
    const base = slugify(title) || "match";
    const ymd = etDay(startTime).replace(/-/g, "");
    const taken = async (s: string) => !!(await this.prisma.match.findUnique({ where: { slug: s }, select: { id: true } }));

    if (!(await taken(base))) return base;
    if (!(await taken(`${base}-${ymd}`))) return `${base}-${ymd}`;
    for (let i = 0; i < 5; i++) {
      const c = `${base}-${ymd}-${Math.random().toString(36).slice(2, 6)}`;
      if (!(await taken(c))) return c;
    }
    return `${base}-${Date.now().toString(36)}`;
  }
}

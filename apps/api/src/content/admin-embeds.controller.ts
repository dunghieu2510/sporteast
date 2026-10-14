import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SessionGuard } from "../auth/session.guard";

type Body_ = Record<string, unknown>;

/** Accepts a plain URL or a pasted <iframe src="..."> snippet; only https URLs are stored. */
export function parseEmbedUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) throw new BadRequestException(`"url" is required`);
  let candidate = raw.trim();
  const fromIframe = candidate.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  if (fromIframe) candidate = fromIframe[1].trim();
  if (candidate.startsWith("//")) candidate = `https:${candidate}`;
  candidate = candidate.replace(/&amp;/g, "&");

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    throw new BadRequestException("Not a valid URL");
  }
  if (u.protocol !== "https:") throw new BadRequestException("Embed URL must start with https://");
  if (candidate.length > 2000) throw new BadRequestException("URL is too long");
  return u.toString();
}

function fields(body: Body_, partial: boolean) {
  const out: { title?: string; url?: string; active?: boolean; sortOrder?: number } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length > 100) throw new BadRequestException(`"title" must be text up to 100 characters`);
    out.title = body.title.trim();
  }
  if (!partial || body.url !== undefined) out.url = parseEmbedUrl(body.url);
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") throw new BadRequestException(`"active" must be true or false`);
    out.active = body.active;
  }
  if (body.sortOrder !== undefined) {
    if (typeof body.sortOrder !== "number" || !Number.isInteger(body.sortOrder)) throw new BadRequestException(`"sortOrder" must be an integer`);
    out.sortOrder = body.sortOrder;
  }
  return out;
}

@Controller("admin")
@UseGuards(SessionGuard)
export class AdminEmbedsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("matches/:matchId/embeds")
  list(@Param("matchId") matchId: string) {
    return this.prisma.matchEmbed.findMany({ where: { matchId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  }

  @Post("matches/:matchId/embeds")
  async create(@Param("matchId") matchId: string, @Body() body: Body_) {
    if (!(await this.prisma.match.findUnique({ where: { id: matchId }, select: { id: true } }))) {
      throw new NotFoundException("Match not found");
    }
    const data = fields(body ?? {}, false);
    const count = await this.prisma.matchEmbed.count({ where: { matchId } });
    return this.prisma.matchEmbed.create({
      data: { matchId, title: data.title || `Source ${count + 1}`, url: data.url!, active: data.active ?? true, sortOrder: data.sortOrder ?? count },
    });
  }

  @Put("embeds/:id")
  async update(@Param("id") id: string, @Body() body: Body_) {
    if (!(await this.prisma.matchEmbed.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException("Embed not found");
    return this.prisma.matchEmbed.update({ where: { id }, data: fields(body ?? {}, true) });
  }

  @Delete("embeds/:id")
  async remove(@Param("id") id: string) {
    if (!(await this.prisma.matchEmbed.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException("Embed not found");
    await this.prisma.matchEmbed.delete({ where: { id } });
    return { deleted: id };
  }
}

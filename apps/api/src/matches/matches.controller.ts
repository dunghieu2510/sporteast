import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import { MatchStatus } from "@arena/db";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@Query("status") status?: string, @Query("league") league?: string, @Query("limit") limit?: string) {
    const normalized = status?.toUpperCase();
    if (normalized && !(normalized in MatchStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.keys(MatchStatus).join(", ")}`);
    }
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return this.matches.list({ status: normalized as MatchStatus | undefined, league: league?.toLowerCase(), limit: take });
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.matches.findBySlug(slug);
  }
}

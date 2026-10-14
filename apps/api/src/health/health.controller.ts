import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const db = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    const redis = await this.redis.ping();
    return { status: db && redis ? "ok" : "degraded", db, redis, time: new Date().toISOString() };
  }
}

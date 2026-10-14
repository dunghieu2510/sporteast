import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthModule } from "./health/health.module";
import { LeaguesModule } from "./leagues/leagues.module";
import { MatchesModule } from "./matches/matches.module";
import { TeamsModule } from "./teams/teams.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { EspnModule } from "./espn/espn.module";
import { ContentModule } from "./content/content.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    HealthModule,
    LeaguesModule,
    MatchesModule,
    TeamsModule,
    RealtimeModule,
    EspnModule,
    ContentModule,
    AuthModule,
  ],
})
export class AppModule {}

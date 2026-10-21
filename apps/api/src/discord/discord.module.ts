import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MatchesModule } from "../matches/matches.module";
import { AdminDiscordController } from "./admin-discord.controller";
import { DiscordService } from "./discord.service";

@Module({
  imports: [AuthModule, MatchesModule],
  controllers: [AdminDiscordController],
  providers: [DiscordService],
})
export class DiscordModule {}

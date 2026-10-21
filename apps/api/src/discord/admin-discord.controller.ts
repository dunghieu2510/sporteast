import { Controller, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { DiscordService } from "./discord.service";

/** Manual trigger for the daily schedule post, so it can be tested without waiting for the cron. */
@Controller("admin/discord")
@UseGuards(SessionGuard)
export class AdminDiscordController {
  constructor(private readonly discord: DiscordService) {}

  @Post("post-schedule")
  async postSchedule() {
    await this.discord.postDailySchedule();
    return { ok: true };
  }
}

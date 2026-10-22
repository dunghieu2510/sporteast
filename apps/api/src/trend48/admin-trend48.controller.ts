import { Controller, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { Trend48Service } from "./trend48.service";

/** Manual re-run of the trend48.st embed sync, so it can be tested without waiting for the cron. */
@Controller("admin/trend48")
@UseGuards(SessionGuard)
export class AdminTrend48Controller {
  constructor(private readonly trend48: Trend48Service) {}

  @Post("sync")
  async sync() {
    await this.trend48.sync();
    return { ok: true };
  }
}

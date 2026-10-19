import { Controller, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { EspnSyncService } from "./espn.service";

/** Manual re-run of the NFL/NBA/NHL/MLB team-logo crawl; it also runs once automatically at startup. */
@Controller("admin/espn")
@UseGuards(SessionGuard)
export class AdminEspnController {
  constructor(private readonly espn: EspnSyncService) {}

  @Post("sync-team-logos")
  async syncTeamLogos() {
    const leagues = await this.espn.syncTeamLogos();
    return { leagues };
  }
}

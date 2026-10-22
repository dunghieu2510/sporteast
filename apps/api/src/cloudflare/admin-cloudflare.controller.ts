import { Controller, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CloudflareService } from "./cloudflare.service";

/** Manual re-run of the Cloudflare purge, so it can be tested without waiting for the cron. */
@Controller("admin/cloudflare")
@UseGuards(SessionGuard)
export class AdminCloudflareController {
  constructor(private readonly cloudflare: CloudflareService) {}

  @Post("purge")
  async purge() {
    await this.cloudflare.purgeAll();
    return { ok: true };
  }
}

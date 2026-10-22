import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SITES } from "@arena/types";

const API = "https://api.cloudflare.com/client/v4";

const ZONE_ENV: Record<string, string> = {
  methstreams: "CLOUDFLARE_ZONE_METHSTREAMS",
  crackstreamsv2: "CLOUDFLARE_ZONE_CRACKSTREAMSV2",
  crackstreameast: "CLOUDFLARE_ZONE_CRACKSTREAMEAST",
};

/**
 * Purges the Cloudflare cache for all 3 sites every minute.
 * Config: CLOUDFLARE_API_TOKEN + one CLOUDFLARE_ZONE_<SITE> per site; a site with no zone id is skipped.
 */
@Injectable()
export class CloudflareService {
  private readonly logger = new Logger(CloudflareService.name);

  private get token(): string {
    return process.env.CLOUDFLARE_API_TOKEN ?? "";
  }

  @Cron("* * * * *")
  async purgeAll(): Promise<void> {
    if (!this.token) return;
    for (const site of SITES) {
      const zoneId = process.env[ZONE_ENV[site.key]];
      if (!zoneId) continue;
      await this.purge(zoneId);
    }
  }

  private async purge(zoneId: string): Promise<void> {
    try {
      const res = await fetch(`${API}/zones/${zoneId}/purge_cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ purge_everything: true }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) this.logger.warn(`Purge zone ${zoneId} failed: HTTP ${res.status} ${await res.text()}`);
    } catch (err: any) {
      this.logger.warn(`Purge zone ${zoneId} failed: ${err?.message ?? err}`);
    }
  }
}

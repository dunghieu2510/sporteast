import { Injectable, Logger } from "@nestjs/common";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Notifies IndexNow-enabled search engines (Bing, Yandex, Seznam…) the moment a URL
 * is created, changed or removed, so they recrawl fast instead of waiting for the sitemap.
 *
 * Config (both required, else it no-ops):
 *   INDEXNOW_KEY          the key; a "<key>.txt" file holding it must be reachable at the site root
 *   NEXT_PUBLIC_SITE_URL  the public origin, e.g. https://methstreamsv2.com
 */
@Injectable()
export class IndexNowService {
  private readonly logger = new Logger(IndexNowService.name);

  // Read lazily so env loaded by ConfigModule/PM2 is always in place.
  private get key(): string {
    return process.env.INDEXNOW_KEY ?? "";
  }
  private get site(): string {
    return (process.env.INDEXNOW_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  }

  get enabled(): boolean {
    return Boolean(this.key && this.site);
  }

  /** Fire-and-forget. Accepts absolute URLs or site-relative paths ("/match/x"). Never throws. */
  submit(urlsOrPaths: string[]): void {
    if (!this.enabled || urlsOrPaths.length === 0) return;
    let host: string;
    try {
      host = new URL(this.site).host;
    } catch {
      return;
    }
    const urlList = [...new Set(urlsOrPaths)].map((u) =>
      /^https?:\/\//.test(u) ? u : `${this.site}${u.startsWith("/") ? "" : "/"}${u}`,
    );
    void this.send(host, urlList);
  }

  private async send(host: string, urlList: string[]): Promise<void> {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host, key: this.key, keyLocation: `${this.site}/${this.key}.txt`, urlList }),
        signal: AbortSignal.timeout(10_000),
      });
      this.logger.log(`Submitted ${urlList.length} url(s) → HTTP ${res.status}`);
    } catch (err: any) {
      this.logger.warn(`Submit failed: ${err?.message ?? err}`);
    }
  }
}

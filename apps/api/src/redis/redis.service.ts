import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.get("REDIS_URL") ?? "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    // Chỉ log một lần mỗi khi mất kết nối, tránh spam log khi Redis tắt.
    let down = false;
    this.client.on("error", (err: NodeJS.ErrnoException) => {
      if (down) return;
      down = true;
      this.logger.warn(`Không kết nối được Redis (${err.code ?? err.message}) — tạm bỏ qua cache`);
    });
    this.client.on("ready", () => {
      if (down) this.logger.log("Đã kết nối lại Redis");
      down = false;
    });
  }

  /** Cache-aside: trả cache nếu có, nếu không gọi loader rồi lưu. Redis lỗi thì bỏ qua cache. */
  async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.client.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      return loader();
    }
    const value = await loader();
    this.client.set(key, JSON.stringify(value), "EX", ttlSeconds).catch(() => undefined);
    return value;
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }
}

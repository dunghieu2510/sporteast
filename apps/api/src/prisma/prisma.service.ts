import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@arena/db";

/** Prisma kết nối lười (lazy) ở truy vấn đầu tiên, nên API vẫn khởi động được khi DB chưa sẵn sàng. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

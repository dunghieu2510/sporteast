import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { IndexNowModule } from "../indexnow/indexnow.module";
import { AuthModule } from "../auth/auth.module";
import { AdminEspnController } from "./admin-espn.controller";
import { EspnSyncService } from "./espn.service";

@Module({
  imports: [PrismaModule, IndexNowModule, AuthModule],
  controllers: [AdminEspnController],
  providers: [EspnSyncService],
})
export class EspnModule {}

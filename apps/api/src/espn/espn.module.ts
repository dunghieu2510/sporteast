import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { IndexNowModule } from "../indexnow/indexnow.module";
import { EspnSyncService } from "./espn.service";

@Module({
  imports: [PrismaModule, IndexNowModule],
  providers: [EspnSyncService],
})
export class EspnModule {}

import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EspnSyncService } from "./espn.service";

@Module({
  imports: [PrismaModule],
  providers: [EspnSyncService],
})
export class EspnModule {}

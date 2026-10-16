import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { IndexNowModule } from "../indexnow/indexnow.module";
import { AdminEmbedsController } from "./admin-embeds.controller";
import { AdminMatchesController } from "./admin-matches.controller";
import { ContentAdminController, ContentController } from "./content.controller";
import { ContentService } from "./content.service";

@Module({
  imports: [PrismaModule, AuthModule, IndexNowModule],
  controllers: [ContentController, ContentAdminController, AdminMatchesController, AdminEmbedsController],
  providers: [ContentService],
})
export class ContentModule {}

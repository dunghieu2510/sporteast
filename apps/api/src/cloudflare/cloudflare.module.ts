import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminCloudflareController } from "./admin-cloudflare.controller";
import { CloudflareService } from "./cloudflare.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminCloudflareController],
  providers: [CloudflareService],
})
export class CloudflareModule {}

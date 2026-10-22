import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { AdminTrend48Controller } from "./admin-trend48.controller";
import { Trend48Service } from "./trend48.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminTrend48Controller],
  providers: [Trend48Service],
})
export class Trend48Module {}

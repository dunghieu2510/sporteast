import { Module } from "@nestjs/common";
import { LeaguesController } from "./leagues.controller";

@Module({ controllers: [LeaguesController] })
export class LeaguesModule {}

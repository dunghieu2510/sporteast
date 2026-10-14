import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json } from "express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: "1mb" }));
  app.use(cookieParser());
  // credentials:true so the browser sends/accepts the HttpOnly session cookie cross-origin (web:3000 → api:4000)
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  Logger.log(`🚀 API chạy tại http://localhost:${port}/api`, "Bootstrap");
}

bootstrap();

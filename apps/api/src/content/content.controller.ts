import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { ContentService } from "./content.service";

type Payload = Record<string, unknown>;

/** Public read endpoints used by the website. */
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("categories")
  categories() {
    return this.content.listCategories();
  }

  @Get("categories/:slug")
  category(@Param("slug") slug: string) {
    return this.content.getCategory(slug);
  }

  @Get("pages")
  pages() {
    return this.content.listPages();
  }

  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    return this.content.getPage(slug);
  }

  @Get("settings")
  settings() {
    return this.content.getSettings();
  }
}

/** Admin endpoints (include drafts / hidden items, and allow writes). */
@Controller("admin")
@UseGuards(SessionGuard)
export class ContentAdminController {
  constructor(private readonly content: ContentService) {}

  @Get("check")
  check() {
    return { ok: true };
  }

  @Get("settings")
  getSettings() {
    return this.content.getSettings();
  }

  @Put("settings")
  updateSettings(@Body() body: Payload) {
    return this.content.updateSettings(body ?? {});
  }

  @Get("categories")
  listCategories() {
    return this.content.listCategories(true);
  }

  @Post("categories")
  createCategory(@Body() body: Payload) {
    return this.content.createCategory(body ?? {});
  }

  @Put("categories/:slug")
  updateCategory(@Param("slug") slug: string, @Body() body: Payload) {
    return this.content.updateCategory(slug, body ?? {});
  }

  @Delete("categories/:slug")
  removeCategory(@Param("slug") slug: string) {
    return this.content.removeCategory(slug);
  }

  @Get("pages")
  listPages() {
    return this.content.listPages({ includeUnpublished: true });
  }

  @Post("pages")
  createPage(@Body() body: Payload) {
    return this.content.createPage(body ?? {});
  }

  @Put("pages/:slug")
  updatePage(@Param("slug") slug: string, @Body() body: Payload) {
    return this.content.updatePage(slug, body ?? {});
  }

  @Delete("pages/:slug")
  removePage(@Param("slug") slug: string) {
    return this.content.removePage(slug);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { SITES } from "@arena/types";
import { SessionGuard } from "../auth/session.guard";
import { ContentService } from "./content.service";

type Payload = Record<string, unknown>;

/** Public read endpoints used by the website. All take an optional ?site= (defaults to "methstreams"). */
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("categories")
  categories(@Query("site") site?: string) {
    return this.content.listCategories(false, site);
  }

  @Get("categories/:slug")
  category(@Param("slug") slug: string, @Query("site") site?: string) {
    return this.content.getCategory(slug, false, site);
  }

  /** Where an old category slug now points, after a rename. */
  @Get("categories/:slug/redirect")
  categoryRedirect(@Param("slug") slug: string, @Query("site") site?: string) {
    return this.content.getCategoryRedirect(slug, site);
  }

  @Get("pages")
  pages(@Query("site") site?: string) {
    return this.content.listPages({}, site);
  }

  @Get("pages/:slug")
  page(@Param("slug") slug: string, @Query("site") site?: string) {
    return this.content.getPage(slug, false, site);
  }

  @Get("settings")
  settings(@Query("site") site?: string) {
    return this.content.getSettings(site);
  }
}

/** Admin endpoints (include drafts / hidden items, and allow writes). All take an optional ?site=. */
@Controller("admin")
@UseGuards(SessionGuard)
export class ContentAdminController {
  constructor(private readonly content: ContentService) {}

  @Get("check")
  check() {
    return { ok: true };
  }

  /** The sites the admin UI can switch between. */
  @Get("sites")
  sites() {
    return SITES;
  }

  @Get("settings")
  getSettings(@Query("site") site?: string) {
    return this.content.getSettings(site);
  }

  @Put("settings")
  updateSettings(@Body() body: Payload, @Query("site") site?: string) {
    return this.content.updateSettings(body ?? {}, site);
  }

  @Get("categories")
  listCategories(@Query("site") site?: string) {
    return this.content.listCategories(true, site);
  }

  @Post("categories")
  createCategory(@Body() body: Payload, @Query("site") site?: string) {
    return this.content.createCategory(body ?? {}, site);
  }

  @Put("categories/:slug")
  updateCategory(@Param("slug") slug: string, @Body() body: Payload, @Query("site") site?: string) {
    return this.content.updateCategory(slug, body ?? {}, site);
  }

  @Delete("categories/:slug")
  removeCategory(@Param("slug") slug: string, @Query("site") site?: string) {
    return this.content.removeCategory(slug, site);
  }

  @Get("pages")
  listPages(@Query("site") site?: string) {
    return this.content.listPages({ includeUnpublished: true }, site);
  }

  @Post("pages")
  createPage(@Body() body: Payload, @Query("site") site?: string) {
    return this.content.createPage(body ?? {}, site);
  }

  @Put("pages/:slug")
  updatePage(@Param("slug") slug: string, @Body() body: Payload, @Query("site") site?: string) {
    return this.content.updatePage(slug, body ?? {}, site);
  }

  @Delete("pages/:slug")
  removePage(@Param("slug") slug: string, @Query("site") site?: string) {
    return this.content.removePage(slug, site);
  }

  /** Bootstraps a brand-new site's starter categories/pages; fails if it already has content. */
  @Post("sites/:site/seed")
  seedSite(@Param("site") site: string, @Body() body: Payload) {
    const brand = typeof body?.brand === "string" ? body.brand : site;
    return this.content.seedSite(site, brand);
  }
}

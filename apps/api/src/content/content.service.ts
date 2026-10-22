import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
import { DEFAULT_SITE, isValidSite } from "@arena/types";
import { PrismaService } from "../prisma/prisma.service";
import { IndexNowService } from "../indexnow/indexnow.service";
import { brandDefaults, defaultCategories, defaultPages } from "./defaults";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Top-level routes that already exist in the web app. */
const RESERVED_PAGE_SLUGS = new Set(["admin", "sport", "match", "api", "_next"]);

type Body = Record<string, unknown>;

function text(body: Body, key: string, max: number, opts: { required?: boolean; partial?: boolean } = {}) {
  const v = body[key];
  if (v === undefined) {
    if (opts.required && !opts.partial) throw new BadRequestException(`"${key}" is required`);
    return undefined;
  }
  if (v === null || v === "") {
    if (opts.required) throw new BadRequestException(`"${key}" is required`);
    return null;
  }
  if (typeof v !== "string") throw new BadRequestException(`"${key}" must be a string`);
  if (v.length > max) throw new BadRequestException(`"${key}" must be at most ${max} characters`);
  return v;
}

function flag(body: Body, key: string) {
  const v = body[key];
  if (v === undefined) return undefined;
  if (typeof v !== "boolean") throw new BadRequestException(`"${key}" must be true or false`);
  return v;
}

function int(body: Body, key: string) {
  const v = body[key];
  if (v === undefined) return undefined;
  if (typeof v !== "number" || !Number.isInteger(v) || v < -9999 || v > 9999) {
    throw new BadRequestException(`"${key}" must be an integer`);
  }
  return v;
}

function siteOf(site: string | undefined): string {
  if (site === undefined) return DEFAULT_SITE;
  if (!isValidSite(site)) throw new BadRequestException(`Unknown site "${site}"`);
  return site;
}

/** The existing production row predates multi-site support and keeps id "default"; new sites use their own key. */
const settingsId = (site: string) => (site === DEFAULT_SITE ? "default" : site);

function slugOf(body: Body, reserved?: Set<string>) {
  const slug = text(body, "slug", 64, { required: true }) as string;
  if (!SLUG_RE.test(slug)) throw new BadRequestException(`"slug" may only contain a-z, 0-9 and "-"`);
  if (reserved?.has(slug)) throw new BadRequestException(`"${slug}" is reserved`);
  return slug;
}

/** Drops keys whose value is undefined so Prisma leaves those columns untouched. */
const defined = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

function categoryData(body: Body, partial: boolean) {
  return defined({
    name: text(body, "name", 100, { required: true, partial }) as string | undefined,
    icon: text(body, "icon", 16),
    sortOrder: int(body, "sortOrder"),
    active: flag(body, "active"),
    heading: text(body, "heading", 190),
    description: text(body, "description", 2000),
    contentTitle: text(body, "contentTitle", 190),
    content: text(body, "content", 100_000),
    metaTitle: text(body, "metaTitle", 190),
    metaDescription: text(body, "metaDescription", 2000),
  });
}

function pageData(body: Body, partial: boolean) {
  return defined({
    title: text(body, "title", 190, { required: true, partial }) as string | undefined,
    content: text(body, "content", 200_000, { required: true, partial }) as string | undefined,
    metaTitle: text(body, "metaTitle", 190),
    metaDescription: text(body, "metaDescription", 2000),
    published: flag(body, "published"),
    showInFooter: flag(body, "showInFooter"),
    sortOrder: int(body, "sortOrder"),
  });
}

@Injectable()
export class ContentService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly indexNow: IndexNowService,
  ) {}

  /** First run: fill empty tables with the starter categories and pages. */
  async onApplicationBootstrap() {
    try {
      if ((await this.prisma.category.count()) === 0) {
        await this.prisma.category.createMany({ data: defaultCategories, skipDuplicates: true });
        this.logger.log(`Seeded ${defaultCategories.length} categories`);
      }
      if ((await this.prisma.page.count()) === 0) {
        await this.prisma.page.createMany({ data: defaultPages, skipDuplicates: true });
        this.logger.log(`Seeded ${defaultPages.length} pages`);
      }
    } catch (err: any) {
      this.logger.warn(`Default content seeding failed: ${err?.message ?? err}`);
    }
  }

  // ───── Site settings (singleton) ─────

  getSettings(site?: string) {
    const id = settingsId(siteOf(site));
    return this.prisma.siteSettings.upsert({ where: { id }, update: {}, create: { id } });
  }

  async updateSettings(body: Body, site?: string) {
    const id = settingsId(siteOf(site));
    const main = typeof body.logoTextMain === "string" ? body.logoTextMain.trim() : "";
    if (!main || main.length > 24) throw new BadRequestException(`"logoTextMain" must be 1–24 characters`);
    const accent = typeof body.logoTextAccent === "string" ? body.logoTextAccent.trim() : "";
    if (accent.length > 24) throw new BadRequestException(`"logoTextAccent" must be at most 24 characters`);
    return this.prisma.siteSettings.upsert({
      where: { id },
      update: { logoTextMain: main, logoTextAccent: accent },
      create: { id, logoTextMain: main, logoTextAccent: accent },
    });
  }

  // ───── Categories ─────

  listCategories(includeInactive = false, site?: string) {
    return this.prisma.category.findMany({
      where: { site: siteOf(site), ...(includeInactive ? {} : { active: true }) },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async getCategory(slug: string, includeInactive = false, site?: string) {
    const row = await this.prisma.category.findUnique({ where: { site_slug: { site: siteOf(site), slug } } });
    if (!row || (!row.active && !includeInactive)) throw new NotFoundException(`Category "${slug}" not found`);
    return row;
  }

  async createCategory(body: Body, site?: string) {
    const s = siteOf(site);
    const slug = slugOf(body);
    if (await this.prisma.category.findUnique({ where: { site_slug: { site: s, slug } } })) {
      throw new ConflictException(`Category "${slug}" already exists`);
    }
    return this.prisma.category.create({ data: { site: s, slug, ...(categoryData(body, false) as { name: string }) } });
  }

  async updateCategory(slug: string, body: Body, site?: string) {
    const s = siteOf(site);
    await this.getCategory(slug, true, s);

    const newSlug = body.slug === undefined ? slug : slugOf(body);
    if (newSlug !== slug) {
      if (await this.prisma.category.findUnique({ where: { site_slug: { site: s, slug: newSlug } } })) {
        throw new ConflictException(`Category "${newSlug}" already exists`);
      }
      await this.renameLeagueOrSport(slug, newSlug);
      await this.recordRedirect(s, slug, newSlug);
    }

    const row = await this.prisma.category.update({
      where: { site_slug: { site: s, slug } },
      data: { ...categoryData(body, true), ...(newSlug !== slug && { slug: newSlug }) },
    });
    this.indexNow.submit([`/sport/${newSlug}`, `/sport/${slug}`, "/"]);
    return row;
  }

  /** Keeps /sport/<slug> filtering matches correctly: the category slug must stay == a real league or sport slug. */
  private async renameLeagueOrSport(oldSlug: string, newSlug: string) {
    const league = await this.prisma.league.findUnique({ where: { slug: oldSlug } });
    if (league) {
      await this.prisma.league.update({ where: { id: league.id }, data: { slug: newSlug } });
      return;
    }
    const sport = await this.prisma.sport.findUnique({ where: { slug: oldSlug } });
    if (sport) await this.prisma.sport.update({ where: { id: sport.id }, data: { slug: newSlug } });
  }

  private async recordRedirect(site: string, fromSlug: string, toSlug: string) {
    // Collapse chains: anything that used to redirect to the old slug now points straight to the new one.
    await this.prisma.categoryRedirect.updateMany({ where: { site, toSlug: fromSlug }, data: { toSlug } });
    // Renaming back onto a slug that currently redirects elsewhere — that redirect is now stale.
    await this.prisma.categoryRedirect.deleteMany({ where: { site, fromSlug: toSlug } });
    await this.prisma.categoryRedirect.upsert({
      where: { site_fromSlug: { site, fromSlug } },
      create: { site, fromSlug, toSlug },
      update: { toSlug },
    });
  }

  async getCategoryRedirect(fromSlug: string, site?: string) {
    const row = await this.prisma.categoryRedirect.findUnique({
      where: { site_fromSlug: { site: siteOf(site), fromSlug } },
    });
    if (!row) throw new NotFoundException();
    return { toSlug: row.toSlug };
  }

  async removeCategory(slug: string, site?: string) {
    const s = siteOf(site);
    await this.getCategory(slug, true, s);
    await this.prisma.category.delete({ where: { site_slug: { site: s, slug } } });
    this.indexNow.submit([`/sport/${slug}`, "/"]);
    return { deleted: slug };
  }

  // ───── Pages ─────

  listPages(opts: { includeUnpublished?: boolean; footerOnly?: boolean } = {}, site?: string) {
    return this.prisma.page.findMany({
      where: {
        site: siteOf(site),
        ...(opts.includeUnpublished ? {} : { published: true }),
        ...(opts.footerOnly ? { showInFooter: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }

  async getPage(slug: string, includeUnpublished = false, site?: string) {
    const row = await this.prisma.page.findUnique({ where: { site_slug: { site: siteOf(site), slug } } });
    if (!row || (!row.published && !includeUnpublished)) throw new NotFoundException(`Page "${slug}" not found`);
    return row;
  }

  async createPage(body: Body, site?: string) {
    const s = siteOf(site);
    const slug = slugOf(body, RESERVED_PAGE_SLUGS);
    if (await this.prisma.page.findUnique({ where: { site_slug: { site: s, slug } } })) {
      throw new ConflictException(`Page "${slug}" already exists`);
    }
    const row = await this.prisma.page.create({ data: { site: s, slug, ...(pageData(body, false) as { title: string; content: string }) } });
    this.indexNow.submit([`/${slug}`, "/"]);
    return row;
  }

  async updatePage(slug: string, body: Body, site?: string) {
    const s = siteOf(site);
    await this.getPage(slug, true, s);
    const row = await this.prisma.page.update({ where: { site_slug: { site: s, slug } }, data: pageData(body, true) });
    this.indexNow.submit([`/${slug}`, "/"]);
    return row;
  }

  async removePage(slug: string, site?: string) {
    const s = siteOf(site);
    await this.getPage(slug, true, s);
    await this.prisma.page.delete({ where: { site_slug: { site: s, slug } } });
    this.indexNow.submit([`/${slug}`, "/"]);
    return { deleted: slug };
  }

  /** Bootstraps a new site with the starter categories/pages (brand name substituted), if it has none yet. */
  async seedSite(site: string, brand: string) {
    const s = siteOf(site);
    if ((await this.prisma.category.count({ where: { site: s } })) > 0) {
      throw new ConflictException(`Site "${s}" already has content`);
    }
    const { categories, pages } = brandDefaults(brand.trim() || s);
    await this.prisma.category.createMany({ data: categories.map((c) => ({ ...c, site: s })) });
    await this.prisma.page.createMany({ data: pages.map((p) => ({ ...p, site: s })) });
    return { seeded: s, categories: categories.length, pages: pages.length };
  }
}

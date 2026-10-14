import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { defaultCategories, defaultPages } from "./defaults";

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

  constructor(private readonly prisma: PrismaService) {}

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

  // ───── Categories ─────

  listCategories(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async getCategory(slug: string, includeInactive = false) {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    if (!row || (!row.active && !includeInactive)) throw new NotFoundException(`Category "${slug}" not found`);
    return row;
  }

  async createCategory(body: Body) {
    const slug = slugOf(body);
    if (await this.prisma.category.findUnique({ where: { slug } })) throw new ConflictException(`Category "${slug}" already exists`);
    return this.prisma.category.create({ data: { slug, ...(categoryData(body, false) as { name: string }) } });
  }

  async updateCategory(slug: string, body: Body) {
    await this.getCategory(slug, true);
    return this.prisma.category.update({ where: { slug }, data: categoryData(body, true) });
  }

  async removeCategory(slug: string) {
    await this.getCategory(slug, true);
    await this.prisma.category.delete({ where: { slug } });
    return { deleted: slug };
  }

  // ───── Pages ─────

  listPages(opts: { includeUnpublished?: boolean; footerOnly?: boolean } = {}) {
    return this.prisma.page.findMany({
      where: {
        ...(opts.includeUnpublished ? {} : { published: true }),
        ...(opts.footerOnly ? { showInFooter: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }

  async getPage(slug: string, includeUnpublished = false) {
    const row = await this.prisma.page.findUnique({ where: { slug } });
    if (!row || (!row.published && !includeUnpublished)) throw new NotFoundException(`Page "${slug}" not found`);
    return row;
  }

  async createPage(body: Body) {
    const slug = slugOf(body, RESERVED_PAGE_SLUGS);
    if (await this.prisma.page.findUnique({ where: { slug } })) throw new ConflictException(`Page "${slug}" already exists`);
    return this.prisma.page.create({ data: { slug, ...(pageData(body, false) as { title: string; content: string }) } });
  }

  async updatePage(slug: string, body: Body) {
    await this.getPage(slug, true);
    return this.prisma.page.update({ where: { slug }, data: pageData(body, true) });
  }

  async removePage(slug: string) {
    await this.getPage(slug, true);
    await this.prisma.page.delete({ where: { slug } });
    return { deleted: slug };
  }
}

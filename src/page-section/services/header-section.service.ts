import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { HeaderSectionType, categories, headerSections, siteSettings } from 'src/database/schema';
import type { HeaderItemInputDto } from '../dtos/sectionData/section-data-request.dto';

const LOGO_SETTING_KEY = 'logo';
const SUPPORT_PHONE_SETTING_KEY = 'supportPhone';
const SLOGAN_SETTING_KEY = 'slogan';

export type HeaderCategory = {
  id: number;
  name: string;
  url: string;
  children: HeaderCategory[];
};

export type HeaderItem = {
  id: number;
  type: HeaderSectionType;
  label: string;
  url: string | null;
  categoryId: number | null;
  children: HeaderCategory[];
};

export type HeaderLogo = {
  small: string | null;
  large: string | null;
};

export type HeaderSectionData = {
  logo: HeaderLogo;
  supportPhone: string | null;
  slogan: string | null;
  items: HeaderItem[];
};

type HeaderSection = typeof headerSections.$inferSelect;

type CategoryRow = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
};

@Injectable()
export class HeaderSectionService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(sectionId: number): Promise<HeaderSectionData> {
    const [rows, categoryRows, branding] = await Promise.all([
      this.db.query.headerSections.findMany({
        where: eq(headerSections.sectionId, sectionId),
        orderBy: [asc(headerSections.sortOrder), asc(headerSections.id)],
      }),
      this.db.query.categories.findMany({ orderBy: asc(categories.id), columns: { id: true, parentId: true, name: true, slug: true } }),
      this.loadBranding(),
    ]);

    return { ...branding, items: rows.map((row) => this.toItem(row, categoryRows)) };
  }

  /** Append a new header item to the given section. */
  async create(sectionId: number, item: HeaderItemInputDto): Promise<HeaderSectionData> {
    await this.validateItem(item);

    await this.db.insert(headerSections).values({
      sectionId,
      type: item.type,
      label: item.label ?? null,
      url: item.type === HeaderSectionType.LINK ? (item.url ?? null) : null,
      categoryId: item.type === HeaderSectionType.CATEGORY ? (item.categoryId ?? null) : null,
      sortOrder: item.sortOrder ?? (await this.nextSortOrder(sectionId)),
    });

    return this.list(sectionId);
  }

  /** Update a single header item that belongs to the given section. */
  async update(sectionId: number, item: HeaderItemInputDto): Promise<HeaderSectionData> {
    const id = this.requireId(item.id);
    await this.ensureExists(sectionId, id);
    await this.validateItem(item);

    await this.db
      .update(headerSections)
      .set({
        type: item.type,
        label: item.label ?? null,
        url: item.type === HeaderSectionType.LINK ? (item.url ?? null) : null,
        categoryId: item.type === HeaderSectionType.CATEGORY ? (item.categoryId ?? null) : null,
        ...(item.sortOrder === undefined ? {} : { sortOrder: item.sortOrder }),
      })
      .where(eq(headerSections.id, id));

    return this.list(sectionId);
  }

  /** Delete a single header item that belongs to the given section. */
  async remove(sectionId: number, id: number): Promise<HeaderSectionData> {
    const deleted = await this.db
      .delete(headerSections)
      .where(and(eq(headerSections.id, id), eq(headerSections.sectionId, sectionId)))
      .returning({ id: headerSections.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Header item not found');
    }

    return this.list(sectionId);
  }

  private toItem(section: HeaderSection, categoryRows: CategoryRow[]): HeaderItem {
    if (section.type === HeaderSectionType.CATEGORY && section.categoryId !== null) {
      const category = categoryRows.find((row) => row.id === section.categoryId);
      return {
        id: section.id,
        type: section.type,
        label: section.label ?? category?.name ?? '',
        url: category ? this.categoryUrl(category.slug) : null,
        categoryId: section.categoryId,
        children: this.buildCategoryTree(categoryRows, section.categoryId),
      };
    }

    return {
      id: section.id,
      type: section.type,
      label: section.label ?? '',
      url: section.url,
      categoryId: null,
      children: [],
    };
  }

  private buildCategoryTree(categoryRows: CategoryRow[], rootId: number): HeaderCategory[] {
    const childrenByParent = new Map<number, CategoryRow[]>();
    for (const category of categoryRows) {
      if (category.parentId === null) continue;
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }

    const build = (parentId: number): HeaderCategory[] =>
      (childrenByParent.get(parentId) ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        url: this.categoryUrl(category.slug),
        children: build(category.id),
      }));

    return build(rootId);
  }

  private categoryUrl(slug: string): string {
    return `/product-category/${slug}`;
  }

  /** Branding values are stored as public site settings and surfaced with the header. */
  private async loadBranding(): Promise<Pick<HeaderSectionData, 'logo' | 'supportPhone' | 'slogan'>> {
    const settings = await this.db.query.siteSettings.findMany({
      where: and(inArray(siteSettings.key, [LOGO_SETTING_KEY, SUPPORT_PHONE_SETTING_KEY, SLOGAN_SETTING_KEY]), eq(siteSettings.isPrivate, false)),
      columns: { key: true, data: true },
    });

    const dataByKey = new Map(settings.map((setting) => [setting.key, setting.data]));

    return {
      logo: {
        small: this.readString(dataByKey.get(LOGO_SETTING_KEY), 'small'),
        large: this.readString(dataByKey.get(LOGO_SETTING_KEY), 'large'),
      },
      supportPhone: this.readString(dataByKey.get(SUPPORT_PHONE_SETTING_KEY), 'value'),
      slogan: this.readString(dataByKey.get(SLOGAN_SETTING_KEY), 'value'),
    };
  }

  private readString(data: unknown, field: string): string | null {
    if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    const value = (data as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : null;
  }

  private async validateItem(item: HeaderItemInputDto): Promise<void> {
    if (item.type === HeaderSectionType.LINK) {
      if (!item.label?.trim() || !item.url?.trim()) {
        throw new BadRequestException('LINK items require a label and a url');
      }
      return;
    }

    if (item.categoryId === undefined || item.categoryId === null) {
      throw new BadRequestException('CATEGORY items require a categoryId');
    }

    const count = await this.db.$count(categories, eq(categories.id, item.categoryId));
    if (count !== 1) {
      throw new BadRequestException('Referenced category does not exist');
    }
  }

  private requireId(id?: number): number {
    if (id === undefined) {
      throw new BadRequestException('id is required when updating an item');
    }
    return id;
  }

  private async ensureExists(sectionId: number, id: number): Promise<void> {
    const existing = await this.db.query.headerSections.findFirst({
      where: and(eq(headerSections.id, id), eq(headerSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Header item not found');
    }
  }

  private async nextSortOrder(sectionId: number): Promise<number> {
    const last = await this.db.query.headerSections.findFirst({
      where: eq(headerSections.sectionId, sectionId),
      columns: { sortOrder: true },
      orderBy: desc(headerSections.sortOrder),
    });
    return (last?.sortOrder ?? -1) + 1;
  }
}

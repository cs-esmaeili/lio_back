import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { FooterSectionType, categories, files, footerSections, siteSettings } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { FooterItemInputDto } from '../dtos/sectionData/section-data-request.dto';

const BRANDING_SETTING_KEYS = ['logo', 'description', 'slogan', 'supportPhone'] as const;

export type FooterLink = {
  id: number;
  label: string;
  url: string | null;
  description: string | null;
  fileId: number | null;
  fileUrl: string | null;
};

export type FooterCategory = {
  id: number;
  name: string;
  url: string | null;
};

export type FooterLogo = {
  small: string | null;
  large: string | null;
};

export type FooterSectionData = {
  logo: FooterLogo;
  description: string | null;
  slogan: string | null;
  supportPhone: string | null;
  links: FooterLink[];
  categories: FooterCategory[];
};

@Injectable()
export class FooterSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<FooterSectionData> {
    const [rows, categoryRows, branding] = await Promise.all([
      this.db.query.footerSections.findMany({
        where: eq(footerSections.sectionId, sectionId),
        orderBy: [asc(footerSections.sortOrder), asc(footerSections.id)],
        with: { file: { columns: { path: true } } },
      }),
      this.db.query.categories.findMany({ orderBy: asc(categories.id), columns: { id: true, name: true, slug: true } }),
      this.loadBranding(),
    ]);

    const links: FooterLink[] = [];
    const categoryItems: FooterCategory[] = [];

    for (const row of rows) {
      if (row.type === FooterSectionType.CATEGORY && row.categoryId !== null) {
        const category = categoryRows.find((candidate) => candidate.id === row.categoryId);
        categoryItems.push({
          id: row.categoryId,
          name: category?.name ?? '',
          url: category ? this.categoryUrl(category.slug) : null,
        });
        continue;
      }

      links.push({
        id: row.id,
        label: row.label ?? '',
        url: row.url,
        description: row.description,
        fileId: row.fileId,
        fileUrl: this.fileUrl.toUrl(row.file?.path ?? null),
      });
    }

    return { ...branding, links, categories: categoryItems };
  }

  /** Append a new footer item to the given section. */
  async create(sectionId: number, item: FooterItemInputDto): Promise<FooterSectionData> {
    await this.validateItem(item);

    try {
      await this.db.insert(footerSections).values(this.toRow(sectionId, item, item.sortOrder ?? (await this.nextSortOrder(sectionId))));
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  /** Update a single footer item that belongs to the given section. */
  async update(sectionId: number, item: FooterItemInputDto): Promise<FooterSectionData> {
    const id = this.requireId(item.id);
    await this.ensureExists(sectionId, id);
    await this.validateItem(item);

    try {
      await this.db
        .update(footerSections)
        .set({
          type: item.type,
          label: item.label ?? null,
          url: item.type === FooterSectionType.LINK ? (item.url ?? null) : null,
          description: item.description ?? null,
          fileId: item.fileId ?? null,
          categoryId: item.type === FooterSectionType.CATEGORY ? (item.categoryId ?? null) : null,
          ...(item.sortOrder === undefined ? {} : { sortOrder: item.sortOrder }),
        })
        .where(eq(footerSections.id, id));
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  /** Delete a single footer item that belongs to the given section. */
  async remove(sectionId: number, id: number): Promise<FooterSectionData> {
    const deleted = await this.db
      .delete(footerSections)
      .where(and(eq(footerSections.id, id), eq(footerSections.sectionId, sectionId)))
      .returning({ id: footerSections.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Footer item not found');
    }

    return this.list(sectionId);
  }

  private toRow(sectionId: number, item: FooterItemInputDto, sortOrder: number) {
    return {
      sectionId,
      type: item.type,
      label: item.label ?? null,
      url: item.type === FooterSectionType.LINK ? (item.url ?? null) : null,
      description: item.description ?? null,
      fileId: item.fileId ?? null,
      categoryId: item.type === FooterSectionType.CATEGORY ? (item.categoryId ?? null) : null,
      sortOrder,
    };
  }

  private requireId(id?: number): number {
    if (id === undefined) {
      throw new BadRequestException('id is required when updating an item');
    }
    return id;
  }

  private async ensureExists(sectionId: number, id: number): Promise<void> {
    const existing = await this.db.query.footerSections.findFirst({
      where: and(eq(footerSections.id, id), eq(footerSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Footer item not found');
    }
  }

  private async nextSortOrder(sectionId: number): Promise<number> {
    const last = await this.db.query.footerSections.findFirst({
      where: eq(footerSections.sectionId, sectionId),
      columns: { sortOrder: true },
      orderBy: desc(footerSections.sortOrder),
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  private categoryUrl(slug: string): string {
    return `/product-category/${slug}`;
  }

  /** Site branding (logo, description, slogan) is stored as site settings and surfaced with the footer. */
  private async loadBranding(): Promise<Pick<FooterSectionData, 'logo' | 'description' | 'slogan' | 'supportPhone'>> {
    const settings = await this.db.query.siteSettings.findMany({
      where: and(inArray(siteSettings.key, [...BRANDING_SETTING_KEYS]), eq(siteSettings.isPrivate, false)),
      columns: { key: true, data: true },
    });

    const dataByKey = new Map(settings.map((setting) => [setting.key, setting.data]));

    return {
      logo: {
        small: this.readString(dataByKey.get('logo'), 'small'),
        large: this.readString(dataByKey.get('logo'), 'large'),
      },
      description: this.readString(dataByKey.get('description'), 'value'),
      slogan: this.readString(dataByKey.get('slogan'), 'value'),
      supportPhone: this.readString(dataByKey.get('supportPhone'), 'value'),
    };
  }

  private readString(data: unknown, field: string): string | null {
    if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    const value = (data as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : null;
  }

  private async validateItem(item: FooterItemInputDto): Promise<void> {
    if (item.type === FooterSectionType.LINK) {
      if (!item.label?.trim() || !item.url?.trim()) {
        throw new BadRequestException('LINK items require a label and a url');
      }
    } else {
      if (item.categoryId === undefined || item.categoryId === null) {
        throw new BadRequestException('CATEGORY items require a categoryId');
      }
      const count = await this.db.$count(categories, eq(categories.id, item.categoryId));
      if (count !== 1) {
        throw new BadRequestException('Referenced category does not exist');
      }
    }

    if (item.fileId !== undefined && item.fileId !== null) {
      const count = await this.db.$count(files, eq(files.id, item.fileId));
      if (count !== 1) {
        throw new BadRequestException('Referenced file does not exist');
      }
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
  }
}

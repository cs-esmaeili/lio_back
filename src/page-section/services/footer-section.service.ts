import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { FooterSectionType, categories, files, footerSections, siteSettings } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { UpdateFooterDto } from '../dtos/updateSectionData/update-section-data-request.dto';

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

  /** Replace all footer items that belong to the given section. */
  async update(sectionId: number, dto: UpdateFooterDto): Promise<FooterSectionData> {
    await this.validate(dto);

    const data = dto.items.map((item, index) => ({
      sectionId,
      type: item.type,
      label: item.label ?? null,
      url: item.type === FooterSectionType.LINK ? (item.url ?? null) : null,
      description: item.description ?? null,
      fileId: item.fileId ?? null,
      categoryId: item.type === FooterSectionType.CATEGORY ? (item.categoryId ?? null) : null,
      sortOrder: index,
    }));

    try {
      await this.db.transaction(async (tx) => {
        await tx.delete(footerSections).where(eq(footerSections.sectionId, sectionId));
        if (data.length > 0) {
          await tx.insert(footerSections).values(data);
        }
      });
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
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

  private async validate(dto: UpdateFooterDto): Promise<void> {
    const categoryIds: number[] = [];
    const fileIds: number[] = [];

    for (const item of dto.items) {
      if (item.type === FooterSectionType.LINK) {
        if (!item.label?.trim() || !item.url?.trim()) {
          throw new BadRequestException('LINK items require a label and a url');
        }
      } else {
        if (item.categoryId === undefined || item.categoryId === null) {
          throw new BadRequestException('CATEGORY items require a categoryId');
        }
        categoryIds.push(item.categoryId);
      }

      if (item.fileId !== undefined && item.fileId !== null) {
        fileIds.push(item.fileId);
      }
    }

    const uniqueCategoryIds = new Set(categoryIds);
    if (uniqueCategoryIds.size !== categoryIds.length) {
      throw new BadRequestException('Duplicate categoryId in footer items');
    }

    if (uniqueCategoryIds.size > 0) {
      const count = await this.db.$count(categories, inArray(categories.id, [...uniqueCategoryIds]));
      if (count !== uniqueCategoryIds.size) {
        throw new BadRequestException('One or more referenced categories do not exist');
      }
    }

    const uniqueFileIds = new Set(fileIds);
    if (uniqueFileIds.size > 0) {
      const count = await this.db.$count(files, inArray(files.id, [...uniqueFileIds]));
      if (count !== uniqueFileIds.size) {
        throw new BadRequestException('One or more referenced files do not exist');
      }
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
  }
}

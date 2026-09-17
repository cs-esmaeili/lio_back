import { BadRequestException, Injectable } from '@nestjs/common';
import { HeaderSectionType } from 'src/generated/prisma/client';
import type { HeaderSection, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { UpdateHeaderDto } from '../dtos/updateSectionData/update-section-data-request.dto';

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

type CategoryRow = {
  id: number;
  parentId: number | null;
  name: string;
};

@Injectable()
export class HeaderSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async list(sectionId: number): Promise<HeaderSectionData> {
    const [rows, categories, branding] = await Promise.all([
      this.prisma.headerSection.findMany({
        where: { sectionId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.category.findMany({ orderBy: { id: 'asc' }, select: { id: true, parentId: true, name: true } }),
      this.loadBranding(),
    ]);

    return { ...branding, items: rows.map((row) => this.toItem(row, categories)) };
  }

  /** Replace all header items that belong to the given section. */
  async update(sectionId: number, dto: UpdateHeaderDto): Promise<HeaderSectionData> {
    await this.validate(dto);

    const data = dto.items.map((item, index) => ({
      sectionId,
      type: item.type,
      label: item.label ?? null,
      url: item.type === HeaderSectionType.LINK ? (item.url ?? null) : null,
      categoryId: item.type === HeaderSectionType.CATEGORY ? (item.categoryId ?? null) : null,
      sortOrder: index,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.headerSection.deleteMany({ where: { sectionId } });
      if (data.length > 0) {
        await tx.headerSection.createMany({ data });
      }
    });

    return this.list(sectionId);
  }

  private toItem(section: HeaderSection, categories: CategoryRow[]): HeaderItem {
    if (section.type === HeaderSectionType.CATEGORY && section.categoryId !== null) {
      const category = categories.find((row) => row.id === section.categoryId);
      return {
        id: section.id,
        type: section.type,
        label: section.label ?? category?.name ?? '',
        url: this.categoryUrl(section.categoryId),
        categoryId: section.categoryId,
        children: this.buildCategoryTree(categories, section.categoryId),
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

  private buildCategoryTree(categories: CategoryRow[], rootId: number): HeaderCategory[] {
    const childrenByParent = new Map<number, CategoryRow[]>();
    for (const category of categories) {
      if (category.parentId === null) continue;
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }

    const build = (parentId: number): HeaderCategory[] =>
      (childrenByParent.get(parentId) ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        url: this.categoryUrl(category.id),
        children: build(category.id),
      }));

    return build(rootId);
  }

  private categoryUrl(categoryId: number): string {
    return `/category/${categoryId}`;
  }

  /** Branding values are stored as public site settings and surfaced with the header. */
  private async loadBranding(): Promise<Pick<HeaderSectionData, 'logo' | 'supportPhone' | 'slogan'>> {
    const settings = await this.prisma.siteSetting.findMany({
      where: { key: { in: [LOGO_SETTING_KEY, SUPPORT_PHONE_SETTING_KEY, SLOGAN_SETTING_KEY] }, isPrivate: false },
      select: { key: true, data: true },
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

  private readString(data: Prisma.JsonValue | undefined, field: string): string | null {
    if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    const value = (data as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : null;
  }

  private async validate(dto: UpdateHeaderDto): Promise<void> {
    const categoryIds: number[] = [];

    for (const item of dto.items) {
      if (item.type === HeaderSectionType.LINK) {
        if (!item.label?.trim() || !item.url?.trim()) {
          throw new BadRequestException('LINK items require a label and a url');
        }
      } else {
        if (item.categoryId === undefined || item.categoryId === null) {
          throw new BadRequestException('CATEGORY items require a categoryId');
        }
        categoryIds.push(item.categoryId);
      }
    }

    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size !== categoryIds.length) {
      throw new BadRequestException('Duplicate categoryId in header items');
    }

    if (uniqueIds.size > 0) {
      const count = await this.prisma.category.count({ where: { id: { in: [...uniqueIds] } } });
      if (count !== uniqueIds.size) {
        throw new BadRequestException('One or more referenced categories do not exist');
      }
    }
  }
}

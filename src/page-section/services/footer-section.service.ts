import { BadRequestException, Injectable } from '@nestjs/common';
import { FooterSectionType } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { UpdateFooterDto } from '../dtos/updateSectionData/update-section-data-request.dto';

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
  url: string;
};

export type FooterSectionData = {
  links: FooterLink[];
  categories: FooterCategory[];
};

@Injectable()
export class FooterSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<FooterSectionData> {
    const [rows, categories] = await Promise.all([
      this.prisma.footerSection.findMany({
        where: { sectionId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: { file: { select: { path: true } } },
      }),
      this.prisma.category.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true } }),
    ]);

    const links: FooterLink[] = [];
    const categoryItems: FooterCategory[] = [];

    for (const row of rows) {
      if (row.type === FooterSectionType.CATEGORY && row.categoryId !== null) {
        const category = categories.find((candidate) => candidate.id === row.categoryId);
        categoryItems.push({
          id: row.categoryId,
          name: category?.name ?? '',
          url: this.categoryUrl(row.categoryId),
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

    return { links, categories: categoryItems };
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
      await this.prisma.$transaction(async (tx) => {
        await tx.footerSection.deleteMany({ where: { sectionId } });
        if (data.length > 0) {
          await tx.footerSection.createMany({ data });
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

  private categoryUrl(categoryId: number): string {
    return `/category/${categoryId}`;
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
      const count = await this.prisma.category.count({ where: { id: { in: [...uniqueCategoryIds] } } });
      if (count !== uniqueCategoryIds.size) {
        throw new BadRequestException('One or more referenced categories do not exist');
      }
    }

    const uniqueFileIds = new Set(fileIds);
    if (uniqueFileIds.size > 0) {
      const count = await this.prisma.file.count({ where: { id: { in: [...uniqueFileIds] } } });
      if (count !== uniqueFileIds.size) {
        throw new BadRequestException('One or more referenced files do not exist');
      }
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2003';
  }
}

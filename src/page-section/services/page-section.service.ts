import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { validateSectionData } from '../section-schemas';

interface ListSectionsQuery {
  pageId?: number;
  slug?: string;
  type?: string;
  isActive?: boolean;
}

interface SectionInput {
  title?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  data?: unknown;
}

interface CreateSectionInput extends SectionInput {
  pageId: number;
  type: string;
}

@Injectable()
export class PageSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async listSections(query: ListSectionsQuery) {
    const where: Prisma.PageSectionWhereInput = {};
    if (query.pageId !== undefined) {
      where.pageId = query.pageId;
    }
    if (query.slug !== undefined) {
      where.page = { slug: query.slug };
    }
    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.pageSection.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async createSection(dto: CreateSectionInput) {
    await validateSectionData(dto.type, dto.data);

    return this.prisma.pageSection.create({
      data: {
        pageId: dto.pageId,
        type: dto.type,
        title: dto.title ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        ...(dto.data !== undefined && { data: dto.data as Prisma.InputJsonValue }),
      },
    });
  }

  async updateSection(id: number, dto: SectionInput) {
    const existing = await this.prisma.pageSection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Section not found');
    }
    if (dto.data !== undefined) {
      await validateSectionData(existing.type, dto.data);
    }

    return this.prisma.pageSection.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.data !== undefined && { data: dto.data as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteSection(id: number) {
    const existing = await this.prisma.pageSection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Section not found');
    }
    await this.prisma.pageSection.delete({ where: { id } });
    return { ok: true };
  }

  async reorderSections(dto: { pageId: number; orderedIds: number[] }) {
    await this.prisma.$transaction(dto.orderedIds.map((id, index) => this.prisma.pageSection.update({ where: { id }, data: { sortOrder: index } })));
    return { ok: true };
  }
}

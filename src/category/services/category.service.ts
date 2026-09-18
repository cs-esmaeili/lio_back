import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { CategoryDto, GetCategoriesResponseDto } from '../dtos/getCategories/get-categories-response.dto';
import type { GetCategoryFiltersResponseDto } from '../dtos/getCategoryFilters/get-category-filters-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUrl: FileUrlService,
  ) {}

  async getCategories(): Promise<GetCategoriesResponseDto> {
    const rows = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        parentId: true,
        name: true,
        slug: true,
        image: { select: { path: true } },
      },
    });

    const nodes = new Map<number, CategoryDto>();
    for (const row of rows) {
      nodes.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: this.fileUrl.toUrl(row.image?.path ?? null),
        children: [],
      });
    }

    const categories: CategoryDto[] = [];
    for (const row of rows) {
      const node = nodes.get(row.id)!;
      const parent = row.parentId !== null ? nodes.get(row.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        categories.push(node);
      }
    }

    return { categories };
  }

  async getCategoryFilters(slug: string): Promise<GetCategoryFiltersResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const rows = await this.prisma.categoryAttribute.findMany({
      where: { categoryId: category.id, isFilterable: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        isRequired: true,
        sortOrder: true,
        attribute: {
          select: {
            id: true,
            name: true,
            title: true,
            usage: true,
            filterType: true,
            isMultiSelect: true,
            values: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: { id: true, value: true, sortOrder: true },
            },
          },
        },
      },
    });

    return {
      filters: rows.map((row) => ({
        attributeId: row.attribute.id,
        name: row.attribute.name,
        title: row.attribute.title,
        usage: row.attribute.usage,
        filterType: row.attribute.filterType,
        isMultiSelect: row.attribute.isMultiSelect,
        isRequired: row.isRequired,
        sortOrder: row.sortOrder,
        values: row.attribute.values,
      })),
    };
  }

  /** Resolve a category slug to its own id plus every descendant id. */
  async resolveIdsBySlug(slug: string): Promise<number[]> {
    const category = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const categories = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const childrenByParent = new Map<number, number[]>();
    for (const item of categories) {
      if (item.parentId === null) {
        continue;
      }
      const children = childrenByParent.get(item.parentId) ?? [];
      children.push(item.id);
      childrenByParent.set(item.parentId, children);
    }

    const ids: number[] = [];
    const stack = [category.id];
    while (stack.length) {
      const id = stack.pop()!;
      ids.push(id);
      stack.push(...(childrenByParent.get(id) ?? []));
    }

    return ids;
  }
}

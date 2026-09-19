import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { attributeValues, categories, categoryAttributes } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { CategoryDto, GetCategoriesResponseDto } from '../dtos/getCategories/get-categories-response.dto';
import type { GetCategoryFiltersResponseDto } from '../dtos/getCategoryFilters/get-category-filters-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async getCategories(): Promise<GetCategoriesResponseDto> {
    const rows = await this.db.query.categories.findMany({
      orderBy: asc(categories.id),
      columns: { id: true, parentId: true, name: true, slug: true },
      with: { image: { columns: { path: true } } },
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

    const rootCategories: CategoryDto[] = [];
    for (const row of rows) {
      const node = nodes.get(row.id)!;
      const parent = row.parentId !== null ? nodes.get(row.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        rootCategories.push(node);
      }
    }

    return { categories: rootCategories };
  }

  async getCategoryFilters(slug: string): Promise<GetCategoryFiltersResponseDto> {
    const category = await this.db.query.categories.findFirst({ where: eq(categories.slug, slug), columns: { id: true } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const rows = await this.db.query.categoryAttributes.findMany({
      where: and(eq(categoryAttributes.categoryId, category.id), eq(categoryAttributes.isFilterable, true)),
      orderBy: [asc(categoryAttributes.sortOrder), asc(categoryAttributes.id)],
      columns: { isRequired: true, sortOrder: true },
      with: {
        attribute: {
          columns: { id: true, name: true, title: true, usage: true, filterType: true, isMultiSelect: true },
          with: {
            values: {
              orderBy: [asc(attributeValues.sortOrder), asc(attributeValues.id)],
              columns: { id: true, value: true, sortOrder: true },
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
    const category = await this.db.query.categories.findFirst({ where: eq(categories.slug, slug), columns: { id: true } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const all = await this.db.query.categories.findMany({ columns: { id: true, parentId: true } });
    const childrenByParent = new Map<number, number[]>();
    for (const item of all) {
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

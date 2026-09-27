import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { attributes, categories, categoryAttributes, files, productCategories } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import { AdminCategoryDto } from '../dtos/adminCategory/admin-category.dto';
import { AdminCategoryAttributeDto } from '../dtos/adminCategoryAttributes/admin-category-attribute.dto';
import type { CreateCategoryRequestDto } from '../dtos/adminCategory/create-category-request.dto';
import type { UpdateCategoryRequestDto } from '../dtos/adminCategory/update-category-request.dto';
import type { DeleteCategoryResponseDto } from '../dtos/adminCategory/delete-category-response.dto';
import type { SetCategoryAttributesRequestDto } from '../dtos/adminCategoryAttributes/set-category-attributes-request.dto';

type CategoryRow = typeof categories.$inferSelect & { image: { path: string } | null };

/**
 * Admin CRUD for the category tree (`/admin/categories`).
 *
 * Categories are stored flat with a `parentId`, so the dashboard receives every
 * node and rebuilds the hierarchy itself. Writes validate the tree invariants:
 * unique slugs, an existing parent and a cycle-free hierarchy.
 */
@Injectable()
export class CategoryAdminService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async listCategories(): Promise<AdminCategoryDto[]> {
    const rows = await this.db.query.categories.findMany({
      orderBy: asc(categories.id),
      columns: { id: true, parentId: true, name: true, slug: true, imageId: true, createdAt: true, updatedAt: true },
      with: { image: { columns: { path: true } } },
    });

    const [productCounts, childCounts] = await Promise.all([this.productCountsByCategory(), this.childCountsByCategory(rows)]);

    return rows.map((row) => this.toDto(row, childCounts.get(row.id) ?? 0, productCounts.get(row.id) ?? 0));
  }

  async getCategory(id: number): Promise<AdminCategoryDto> {
    return this.loadCategory(id);
  }

  async createCategory(dto: CreateCategoryRequestDto): Promise<AdminCategoryDto> {
    await this.assertSlugAvailable(dto.slug);

    if (dto.parentId !== undefined && dto.parentId !== null) {
      await this.assertCategoryExists(dto.parentId);
    }
    if (dto.imageId !== undefined && dto.imageId !== null) {
      await this.assertFileExists(dto.imageId);
    }

    const [created] = await this.db
      .insert(categories)
      .values({
        name: dto.name.trim(),
        slug: dto.slug,
        parentId: dto.parentId ?? null,
        imageId: dto.imageId ?? null,
      })
      .returning({ id: categories.id });

    return this.loadCategory(created.id);
  }

  async updateCategory(id: number, dto: UpdateCategoryRequestDto): Promise<AdminCategoryDto> {
    const existing = await this.findCategoryOrFail(id);

    if (dto.slug !== undefined && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      await this.assertCategoryExists(dto.parentId);
      await this.assertNotDescendant(id, dto.parentId);
    }

    if (dto.imageId !== undefined && dto.imageId !== null) {
      await this.assertFileExists(dto.imageId);
    }

    const patch: Partial<typeof categories.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.slug !== undefined) patch.slug = dto.slug;
    if (dto.parentId !== undefined) patch.parentId = dto.parentId;
    if (dto.imageId !== undefined) patch.imageId = dto.imageId;

    if (Object.keys(patch).length > 0) {
      await this.db.update(categories).set(patch).where(eq(categories.id, id));
    }

    return this.loadCategory(id);
  }

  async deleteCategory(id: number): Promise<DeleteCategoryResponseDto> {
    await this.findCategoryOrFail(id);

    const childCount = await this.db.$count(categories, eq(categories.parentId, id));
    if (childCount > 0) {
      throw new ConflictException('Category has subcategories. Delete or move them first.');
    }

    await this.db.delete(categories).where(eq(categories.id, id));

    return { ok: true };
  }

  // --------------------------------------------------------
  //  Category ↔ attribute assignment
  // --------------------------------------------------------

  async listCategoryAttributes(categoryId: number): Promise<AdminCategoryAttributeDto[]> {
    await this.findCategoryOrFail(categoryId);

    const rows = await this.db.query.categoryAttributes.findMany({
      where: eq(categoryAttributes.categoryId, categoryId),
      orderBy: [asc(categoryAttributes.sortOrder), asc(categoryAttributes.attributeId)],
      with: { attribute: true },
    });

    return rows.map((row) => this.toCategoryAttributeDto(row));
  }

  /** Replaces the whole assignment of attributes to a category. */
  async setCategoryAttributes(categoryId: number, dto: SetCategoryAttributesRequestDto): Promise<AdminCategoryAttributeDto[]> {
    await this.findCategoryOrFail(categoryId);

    const attributeIds = dto.attributes.map((item) => item.attributeId);
    if (new Set(attributeIds).size !== attributeIds.length) {
      throw new BadRequestException('Duplicate attribute in the assignment');
    }

    if (attributeIds.length > 0) {
      const found = await this.db.query.attributes.findMany({ where: inArray(attributes.id, attributeIds), columns: { id: true } });
      if (found.length !== attributeIds.length) {
        throw new BadRequestException('One or more attributes were not found');
      }
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(categoryAttributes).where(eq(categoryAttributes.categoryId, categoryId));

      if (dto.attributes.length > 0) {
        await tx.insert(categoryAttributes).values(
          dto.attributes.map((item, index) => ({
            categoryId,
            attributeId: item.attributeId,
            isRequired: item.isRequired ?? false,
            isFilterable: item.isFilterable ?? false,
            sortOrder: item.sortOrder ?? index,
          })),
        );
      }
    });

    return this.listCategoryAttributes(categoryId);
  }

  // --------------------------------------------------------
  //  Helpers
  // --------------------------------------------------------

  private async loadCategory(id: number): Promise<AdminCategoryDto> {
    const row = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
      columns: { id: true, parentId: true, name: true, slug: true, imageId: true, createdAt: true, updatedAt: true },
      with: { image: { columns: { path: true } } },
    });

    if (!row) {
      throw new NotFoundException('Category not found');
    }

    const [childCount, productCount] = await Promise.all([
      this.db.$count(categories, eq(categories.parentId, id)),
      this.db.$count(productCategories, eq(productCategories.categoryId, id)),
    ]);

    return this.toDto(row, childCount, productCount);
  }

  private async findCategoryOrFail(id: number): Promise<{ id: number; slug: string }> {
    const category = await this.db.query.categories.findFirst({ where: eq(categories.id, id), columns: { id: true, slug: true } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async assertCategoryExists(id: number): Promise<void> {
    const category = await this.db.query.categories.findFirst({ where: eq(categories.id, id), columns: { id: true } });
    if (!category) {
      throw new BadRequestException('Parent category not found');
    }
  }

  private async assertFileExists(id: number): Promise<void> {
    const file = await this.db.query.files.findFirst({ where: eq(files.id, id), columns: { id: true } });
    if (!file) {
      throw new BadRequestException('Image file not found');
    }
  }

  private async assertSlugAvailable(slug: string, excludeId?: number): Promise<void> {
    const existing = await this.db.query.categories.findFirst({ where: eq(categories.slug, slug), columns: { id: true } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('A category with this slug already exists');
    }
  }

  /** Rejects moving a category under one of its own descendants. */
  private async assertNotDescendant(ancestorId: number, candidateId: number): Promise<void> {
    const rows = await this.db.query.categories.findMany({ columns: { id: true, parentId: true } });
    const childrenByParent = this.groupChildren(rows);

    const stack = [...(childrenByParent.get(ancestorId) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (id === candidateId) {
        throw new BadRequestException('A category cannot be nested inside its own subcategory');
      }
      stack.push(...(childrenByParent.get(id) ?? []));
    }
  }

  private async productCountsByCategory(): Promise<Map<number, number>> {
    const rows = await this.db
      .select({ categoryId: productCategories.categoryId, value: count() })
      .from(productCategories)
      .groupBy(productCategories.categoryId);

    return new Map(rows.map((row) => [row.categoryId, Number(row.value)]));
  }

  private childCountsByCategory(rows: Array<{ id: number; parentId: number | null }>): Map<number, number> {
    const counts = new Map<number, number>();
    for (const row of rows) {
      if (row.parentId !== null) {
        counts.set(row.parentId, (counts.get(row.parentId) ?? 0) + 1);
      }
    }
    return counts;
  }

  private groupChildren(rows: Array<{ id: number; parentId: number | null }>): Map<number, number[]> {
    const childrenByParent = new Map<number, number[]>();
    for (const row of rows) {
      if (row.parentId === null) continue;
      const children = childrenByParent.get(row.parentId) ?? [];
      children.push(row.id);
      childrenByParent.set(row.parentId, children);
    }
    return childrenByParent;
  }

  private toDto(row: CategoryRow, childCount: number, productCount: number): AdminCategoryDto {
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      imageId: row.imageId,
      imageUrl: this.fileUrl.toUrl(row.image?.path ?? null),
      childCount,
      productCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCategoryAttributeDto(row: typeof categoryAttributes.$inferSelect & { attribute: typeof attributes.$inferSelect }): AdminCategoryAttributeDto {
    return {
      attributeId: row.attributeId,
      name: row.attribute.name,
      title: row.attribute.title,
      usage: row.attribute.usage,
      filterType: row.attribute.filterType,
      isMultiSelect: row.attribute.isMultiSelect,
      isRequired: row.isRequired,
      isFilterable: row.isFilterable,
      sortOrder: row.sortOrder,
    };
  }
}

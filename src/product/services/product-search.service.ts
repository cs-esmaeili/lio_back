import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUrlService } from 'src/common/services/file-url.service';
import { ProductRepository } from '../repositories/product.repository';
import type { SearchProductsFilterDto, SearchProductsRequestDto } from '../dtos/searchProducts/search-products-request.dto';
import type { SearchProductsResponseDto } from '../dtos/searchProducts/search-products-response.dto';

@Injectable()
export class ProductSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productRepository: ProductRepository,
    private readonly fileUrl: FileUrlService,
  ) {}

  async searchProducts(dto: SearchProductsRequestDto): Promise<SearchProductsResponseDto> {
    const categoryIds = await this.resolveCategoryIds(dto.categorySlug);
    const filters = this.normalizeFilters(dto.filters ?? []);
    await this.validateFilters(filters);

    const products = await this.productRepository.findSummaries(this.buildWhere(categoryIds, filters));

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images.map((image) => ({
          id: image.id,
          url: this.fileUrl.toUrl(image.filePath),
          isPrimary: image.isPrimary,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        })),
        defaultVariant: product.defaultVariant,
      })),
    };
  }

  /**
   * Category scope plus attribute filters.
   *
   * Attribute filters use the variant-combination semantics: a product must have
   * a single variant that satisfies every attribute group. Within one group the
   * value ids are OR-ed, across groups they are AND-ed.
   */
  private buildWhere(categoryIds: number[], filters: SearchProductsFilterDto[]): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      categories: { some: { categoryId: { in: categoryIds } } },
    };

    if (filters.length) {
      where.variants = {
        some: {
          AND: filters.map((filter) => ({
            variantAttributeValues: {
              some: {
                productAttributeValue: {
                  attributeId: filter.attributeId,
                  attributeValueId: { in: filter.valueIds },
                },
              },
            },
          })),
        },
      };
    }

    return where;
  }

  /** Merge duplicate attribute groups so each attribute id appears once. */
  private normalizeFilters(filters: SearchProductsFilterDto[]): SearchProductsFilterDto[] {
    const valueIdsByAttribute = new Map<number, Set<number>>();

    for (const filter of filters) {
      const valueIds = valueIdsByAttribute.get(filter.attributeId) ?? new Set<number>();
      for (const valueId of filter.valueIds) {
        valueIds.add(valueId);
      }
      valueIdsByAttribute.set(filter.attributeId, valueIds);
    }

    return Array.from(valueIdsByAttribute, ([attributeId, valueIds]) => ({ attributeId, valueIds: Array.from(valueIds) }));
  }

  /** Each value id must exist and belong to the attribute it was sent under. */
  private async validateFilters(filters: SearchProductsFilterDto[]): Promise<void> {
    const valueIds = Array.from(new Set(filters.flatMap((filter) => filter.valueIds)));
    if (!valueIds.length) {
      return;
    }

    const values = await this.prisma.attributeValue.findMany({
      where: { id: { in: valueIds } },
      select: { id: true, attributeId: true },
    });
    const attributeIdByValue = new Map(values.map((value) => [value.id, value.attributeId]));

    for (const filter of filters) {
      for (const valueId of filter.valueIds) {
        const attributeId = attributeIdByValue.get(valueId);
        if (attributeId === undefined) {
          throw new BadRequestException(`Attribute value ${valueId} not found`);
        }
        if (attributeId !== filter.attributeId) {
          throw new BadRequestException(`Attribute value ${valueId} does not belong to attribute ${filter.attributeId}`);
        }
      }
    }
  }

  /** Resolve a category slug to its own id plus every descendant id. */
  private async resolveCategoryIds(slug: string): Promise<number[]> {
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

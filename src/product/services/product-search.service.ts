import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUrlService } from 'src/common/services/file-url.service';
import { PaginationService } from 'src/common/services/pagination.service';
import { CategoryService } from 'src/category/services/category.service';
import { ProductRepository } from '../repositories/product.repository';
import type { SearchProductsFilterDto, SearchProductsRequestDto } from '../dtos/searchProducts/search-products-request.dto';
import type { SearchProductsResponseDto } from '../dtos/searchProducts/search-products-response.dto';

@Injectable()
export class ProductSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productRepository: ProductRepository,
    private readonly categories: CategoryService,
    private readonly pagination: PaginationService,
    private readonly fileUrl: FileUrlService,
  ) {}

  async searchProducts(dto: SearchProductsRequestDto): Promise<SearchProductsResponseDto> {
    const categoryIds = await this.categories.resolveIdsBySlug(dto.categorySlug);
    const filters = this.normalizeFilters(dto.filters ?? []);
    await this.validateFilters(filters);

    const where = this.buildWhere(categoryIds, filters);
    const { page, limit, skip, take } = this.pagination.resolveOffset(dto);

    const [products, total] = await Promise.all([this.productRepository.findSummaries(where, { skip, take }), this.productRepository.count(where)]);

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
      pagination: this.pagination.buildMeta(page, limit, total),
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
}

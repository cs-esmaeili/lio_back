import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, inArray, ne, sql } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { AttributeUsage, productCategories, productImages, products, productVariants } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import { ProductRepository } from '../repositories/product.repository';
import type { ProductSummary } from '../repositories/product.repository';
import type {
  GetProductDetailsResponseDto,
  ProductAttributeGroupDto,
  ProductBaseAttributeDto,
  ProductCardDto,
  ProductDetailsCategoryDto,
  ProductDetailsImageDto,
  ProductDetailsTagDto,
  ProductVariantDto,
  ProductVariantValueDto,
} from '../dtos/getProductDetails/get-product-details-response.dto';

const RELATED_PRODUCTS_LIMIT = 12;

/**
 * The whole single-product page in one payload: the product itself, the
 * variant selectors, every variant (one price/stock per attribute combination)
 * and the related product lists (similar + newest).
 *
 * Comments/questions are intentionally out of scope and live behind their own
 * endpoints.
 */
@Injectable()
export class ProductDetailService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly productRepository: ProductRepository,
    private readonly fileUrl: FileUrlService,
  ) {}

  async getProductDetails(slug: string): Promise<GetProductDetailsResponseDto> {
    const product = await this.db.query.products.findFirst({
      where: eq(products.slug, slug),
      columns: { id: true, name: true, slug: true, description: true },
      with: {
        images: {
          columns: { id: true, isPrimary: true, isThumbnail: true, sortOrder: true },
          orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
          with: { file: { columns: { path: true } } },
        },
        categories: {
          with: { category: { columns: { id: true, name: true, slug: true }, with: { image: { columns: { path: true } } } } },
        },
        tags: {
          with: { tag: { columns: { id: true, name: true, slug: true } } },
        },
        attributeValues: {
          columns: { id: true, attributeId: true, attributeValueId: true },
          with: {
            attribute: { columns: { id: true, title: true, usage: true } },
            attributeValue: { columns: { id: true, value: true } },
          },
        },
        variants: {
          columns: { id: true, sku: true, price: true, compareAtPrice: true, stock: true, isDefault: true },
          orderBy: [desc(productVariants.isDefault), asc(productVariants.position), asc(productVariants.id)],
          with: { variantAttributeValues: { columns: { productAttributeValueId: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { variants, defaultVariant, baseAttributes, attributeGroups } = this.buildVariantsAndAttributes(product);

    const [similar, newProducts] = await Promise.all([
      this.findSimilarProducts(
        product.id,
        product.categories.map((link) => link.category.id),
      ),
      this.productRepository.findSummaries(undefined, { take: RELATED_PRODUCTS_LIMIT }),
    ]);

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: product.images.map((image): ProductDetailsImageDto => ({
          id: image.id,
          url: this.fileUrl.toUrl(image.file.path),
          isPrimary: image.isPrimary,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        })),
        categories: product.categories.map((link): ProductDetailsCategoryDto => ({
          id: link.category.id,
          name: link.category.name,
          slug: link.category.slug,
          imageUrl: this.fileUrl.toUrl(link.category.image?.path ?? null),
        })),
        tags: product.tags.map((link): ProductDetailsTagDto => ({ id: link.tag.id, name: link.tag.name, slug: link.tag.slug })),
        defaultVariant,
      },
      baseAttributes,
      attributeGroups,
      variants,
      sections: {
        similar: similar.map((item) => this.toCard(item)),
        newProducts: newProducts.map((item) => this.toCard(item)),
      },
    };
  }

  /**
   * Build the variant-defining selectors and every variant. A variant is one
   * combination of the variant attributes (e.g. color × size); each combination
   * carries its own price and stock.
   */
  private buildVariantsAndAttributes(product: {
    attributeValues: Array<{
      id: number;
      attributeId: number;
      attributeValueId: number;
      attribute: { id: number; title: string; usage: AttributeUsage };
      attributeValue: { id: number; value: string };
    }>;
    variants: Array<{
      id: number;
      sku: string;
      price: string;
      compareAtPrice: string | null;
      stock: number;
      isDefault: boolean;
      variantAttributeValues: Array<{ productAttributeValueId: number }>;
    }>;
  }): {
    variants: ProductVariantDto[];
    defaultVariant: ProductVariantDto | null;
    baseAttributes: ProductBaseAttributeDto[];
    attributeGroups: ProductAttributeGroupDto[];
  } {
    const variantValueInfoByProductAttributeValue = new Map<number, ProductVariantValueDto>();
    for (const value of product.attributeValues) {
      if (value.attribute.usage === AttributeUsage.VARIANT) {
        variantValueInfoByProductAttributeValue.set(value.id, {
          attributeId: value.attributeId,
          attributeTitle: value.attribute.title,
          valueId: value.attributeValueId,
          valueTitle: value.attributeValue.value,
        });
      }
    }

    const defaultVariantRow = product.variants.find((variant) => variant.isDefault) ?? product.variants[0] ?? null;
    const selectedProductAttributeValueIds = new Set(defaultVariantRow?.variantAttributeValues.map((link) => link.productAttributeValueId) ?? []);

    const toVariant = (variant: (typeof product.variants)[number]): ProductVariantDto => {
      const price = Number(variant.price);
      const compareAtPrice = variant.compareAtPrice === null ? null : Number(variant.compareAtPrice);
      const values = variant.variantAttributeValues
        .map((link) => variantValueInfoByProductAttributeValue.get(link.productAttributeValueId))
        .filter((value): value is ProductVariantValueDto => value !== undefined)
        .sort((a, b) => a.attributeId - b.attributeId);
      const discountPercent = compareAtPrice !== null && compareAtPrice > price && compareAtPrice > 0 ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

      return {
        id: variant.id,
        sku: variant.sku,
        values,
        price,
        compareAtPrice,
        discountPercent,
        stock: variant.stock,
        isAvailable: variant.stock > 0,
        zeroPrice: price <= 0 ? 'call' : null,
      };
    };

    const variants = product.variants.map((variant) => toVariant(variant));
    const defaultVariant = defaultVariantRow ? (variants.find((variant) => variant.id === defaultVariantRow.id) ?? null) : null;

    const baseAttributesById = new Map<number, ProductBaseAttributeDto>();
    const attributeGroupsById = new Map<number, ProductAttributeGroupDto>();
    for (const value of product.attributeValues) {
      if (value.attribute.usage === AttributeUsage.VARIANT) {
        let baseAttribute = baseAttributesById.get(value.attributeId);
        if (!baseAttribute) {
          baseAttribute = { attributeId: value.attributeId, title: value.attribute.title, values: [] };
          baseAttributesById.set(value.attributeId, baseAttribute);
        }
        baseAttribute.values.push({
          valueId: value.attributeValueId,
          title: value.attributeValue.value,
          isSelected: selectedProductAttributeValueIds.has(value.id),
        });
        continue;
      }

      let group = attributeGroupsById.get(value.attributeId);
      if (!group) {
        group = { attributeId: value.attributeId, title: value.attribute.title, attributes: [] };
        attributeGroupsById.set(value.attributeId, group);
      }
      group.attributes.push({
        valueId: value.attributeValueId,
        title: value.attribute.title,
        value: value.attributeValue.value,
      });
    }

    return {
      variants,
      defaultVariant,
      baseAttributes: Array.from(baseAttributesById.values()),
      attributeGroups: Array.from(attributeGroupsById.values()),
    };
  }

  /** Products sharing at least one category with the requested product. */
  private findSimilarProducts(productId: number, categoryIds: number[]): Promise<ProductSummary[]> {
    if (!categoryIds.length) {
      return Promise.resolve([]);
    }

    return this.productRepository.findSummaries(
      and(
        ne(products.id, productId),
        exists(
          this.db
            .select({ value: sql`1` })
            .from(productCategories)
            .where(and(eq(productCategories.productId, products.id), inArray(productCategories.categoryId, categoryIds))),
        ),
      ),
      { take: RELATED_PRODUCTS_LIMIT },
    );
  }

  private toCard(product: ProductSummary): ProductCardDto {
    return {
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
      defaultVariant: product.defaultVariant
        ? {
            id: product.defaultVariant.id,
            sku: product.defaultVariant.sku,
            price: product.defaultVariant.price,
            compareAtPrice: product.defaultVariant.compareAtPrice,
            stock: product.defaultVariant.stock,
          }
        : null,
    };
  }
}

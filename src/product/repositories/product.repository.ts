import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma/client';

export type ProductDefaultVariant = {
  id: number;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
};

export type ProductSummaryImage = {
  id: number;
  filePath: string;
  isPrimary: boolean;
  isThumbnail: boolean;
  sortOrder: number;
};

export type ProductSummary = {
  id: number;
  name: string;
  slug: string;
  images: ProductSummaryImage[];
  defaultVariant: ProductDefaultVariant | null;
};

/**
 * The canonical product projection.
 *
 * The default variant is always requested here, so callers never have to
 * remember to add it to their own queries. This is the Prisma equivalent of a
 * scoped query: one place owns the "a product always carries its default
 * variant" invariant.
 */
const PRODUCT_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  images: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      isPrimary: true,
      isThumbnail: true,
      sortOrder: true,
      file: { select: { path: true } },
    },
  },
  variants: {
    orderBy: [{ isDefault: 'desc' }, { position: 'asc' }, { id: 'asc' }],
    take: 1,
    select: {
      id: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
    },
  },
} satisfies Prisma.ProductSelect;

type ProductSummaryRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_SUMMARY_SELECT }>;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The single entry point for product listings. Callers compose the `where`
   * clause (category scope, attribute filters, and future general filters) and
   * this method owns the projection, so the product shape stays consistent.
   */
  async findSummaries(where: Prisma.ProductWhereInput = {}, options: { skip?: number; take?: number } = {}): Promise<ProductSummary[]> {
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: options.skip,
      take: options.take,
      select: PRODUCT_SUMMARY_SELECT,
    });

    return products.map((product) => this.toSummary(product));
  }

  /** Count products for the same `where` used by {@link findSummaries}. */
  async count(where: Prisma.ProductWhereInput = {}): Promise<number> {
    return this.prisma.product.count({ where });
  }

  async findSummariesByIds(ids: number[]): Promise<ProductSummary[]> {
    if (!ids.length) {
      return [];
    }

    return this.findSummaries({ id: { in: ids } });
  }

  private toSummary(product: ProductSummaryRow): ProductSummary {
    const variant = product.variants[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      images: product.images.map((image) => ({
        id: image.id,
        filePath: image.file.path,
        isPrimary: image.isPrimary,
        isThumbnail: image.isThumbnail,
        sortOrder: image.sortOrder,
      })),
      defaultVariant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            price: Number(variant.price),
            compareAtPrice: variant.compareAtPrice === null ? null : Number(variant.compareAtPrice),
            stock: variant.stock,
          }
        : null,
    };
  }
}

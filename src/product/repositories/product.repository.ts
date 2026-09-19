import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, inArray, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { productImages, products, productVariants } from 'src/database/schema';

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
 * remember to add it to their own queries. This is the Drizzle equivalent of a
 * scoped query: one place owns the "a product always carries its default
 * variant" invariant.
 */
type ProductSummaryRow = {
  id: number;
  name: string;
  slug: string;
  images: {
    id: number;
    isPrimary: boolean;
    isThumbnail: boolean;
    sortOrder: number;
    file: { path: string };
  }[];
  variants: {
    id: number;
    sku: string;
    price: string;
    compareAtPrice: string | null;
    stock: number;
  }[];
};

@Injectable()
export class ProductRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * The single entry point for product listings. Callers compose the `where`
   * clause (category scope, attribute filters, and future general filters) and
   * this method owns the projection, so the product shape stays consistent.
   */
  async findSummaries(where: SQL | undefined = undefined, options: { skip?: number; take?: number } = {}): Promise<ProductSummary[]> {
    const rows = await this.db.query.products.findMany({
      where,
      orderBy: desc(products.id),
      offset: options.skip,
      limit: options.take,
      columns: { id: true, name: true, slug: true },
      with: {
        images: {
          columns: { id: true, isPrimary: true, isThumbnail: true, sortOrder: true },
          orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
          with: { file: { columns: { path: true } } },
        },
        variants: {
          columns: { id: true, sku: true, price: true, compareAtPrice: true, stock: true },
          orderBy: [desc(productVariants.isDefault), asc(productVariants.position), asc(productVariants.id)],
          limit: 1,
        },
      },
    });

    return rows.map((product) => this.toSummary(product));
  }

  /** Count products for the same `where` used by {@link findSummaries}. */
  async count(where: SQL | undefined = undefined): Promise<number> {
    return this.db.$count(products, where);
  }

  async findSummariesByIds(ids: number[]): Promise<ProductSummary[]> {
    if (!ids.length) {
      return [];
    }

    return this.findSummaries(inArray(products.id, ids));
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

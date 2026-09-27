import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { productListSections, products } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import { ProductRepository } from 'src/product/repositories/product.repository';
import type { ProductDefaultVariant, ProductSummary } from 'src/product/repositories/product.repository';
import type { ProductListItemInputDto } from '../dtos/sectionData/section-data-request.dto';

export type ProductImageItem = {
  id: number;
  url: string | null;
  isPrimary: boolean;
  isThumbnail: boolean;
  sortOrder: number;
};

export type ProductListItem = {
  id: number;
  sortOrder: number;
  productId: number;
  productName: string;
  productSlug: string;
  images: ProductImageItem[];
  defaultVariant: ProductDefaultVariant | null;
};

export type ProductListSectionData = { products: ProductListItem[] };

type ProductListRow = {
  id: number;
  sortOrder: number;
  productId: number;
};

@Injectable()
export class ProductListSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly productRepository: ProductRepository,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<ProductListSectionData> {
    const rows = await this.db.query.productListSections.findMany({
      where: eq(productListSections.sectionId, sectionId),
      orderBy: [asc(productListSections.sortOrder), asc(productListSections.id)],
      columns: { id: true, sortOrder: true, productId: true },
    });

    const summaries = await this.productRepository.findSummariesByIds(rows.map((row) => row.productId));

    return { products: this.toProducts(rows, summaries) };
  }

  /** Append a new product row to the given section. */
  async create(sectionId: number, product: ProductListItemInputDto): Promise<ProductListSectionData> {
    await this.ensureProduct(product.productId);

    await this.db.insert(productListSections).values({
      sectionId,
      productId: product.productId,
      sortOrder: product.sortOrder ?? (await this.nextSortOrder(sectionId)),
    });

    return this.list(sectionId);
  }

  /** Update a single product row that belongs to the given section. */
  async update(sectionId: number, product: ProductListItemInputDto): Promise<ProductListSectionData> {
    const id = this.requireId(product.id);
    await this.ensureExists(sectionId, id);
    await this.ensureProduct(product.productId);

    await this.db
      .update(productListSections)
      .set({
        productId: product.productId,
        ...(product.sortOrder === undefined ? {} : { sortOrder: product.sortOrder }),
      })
      .where(eq(productListSections.id, id));

    return this.list(sectionId);
  }

  /** Delete a single product row that belongs to the given section. */
  async remove(sectionId: number, id: number): Promise<ProductListSectionData> {
    const deleted = await this.db
      .delete(productListSections)
      .where(and(eq(productListSections.id, id), eq(productListSections.sectionId, sectionId)))
      .returning({ id: productListSections.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Product list item not found');
    }

    return this.list(sectionId);
  }

  private requireId(id?: number): number {
    if (id === undefined) {
      throw new BadRequestException('id is required when updating an item');
    }
    return id;
  }

  private async ensureExists(sectionId: number, id: number): Promise<void> {
    const existing = await this.db.query.productListSections.findFirst({
      where: and(eq(productListSections.id, id), eq(productListSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Product list item not found');
    }
  }

  private async ensureProduct(productId: number): Promise<void> {
    const productExists = await this.db.$count(products, eq(products.id, productId));
    if (productExists !== 1) {
      throw new BadRequestException('Referenced product does not exist');
    }
  }

  private async nextSortOrder(sectionId: number): Promise<number> {
    const last = await this.db.query.productListSections.findFirst({
      where: eq(productListSections.sectionId, sectionId),
      columns: { sortOrder: true },
      orderBy: desc(productListSections.sortOrder),
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  private toProducts(rows: ProductListRow[], summaries: ProductSummary[]): ProductListItem[] {
    const productsById = new Map(summaries.map((summary) => [summary.id, summary]));

    return rows.map((row) => {
      const summary = productsById.get(row.productId);

      return {
        id: row.id,
        sortOrder: row.sortOrder,
        productId: row.productId,
        productName: summary?.name ?? '',
        productSlug: summary?.slug ?? '',
        images: (summary?.images ?? []).map((image) => ({
          id: image.id,
          url: this.fileUrl.toUrl(image.filePath),
          isPrimary: image.isPrimary,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        })),
        defaultVariant: summary?.defaultVariant ?? null,
      };
    });
  }
}

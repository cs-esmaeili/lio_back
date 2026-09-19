import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { productListSections, products } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import { ProductRepository } from 'src/product/repositories/product.repository';
import type { ProductDefaultVariant, ProductSummary } from 'src/product/repositories/product.repository';
import type { UpdateProductListDto } from '../dtos/updateSectionData/update-section-data-request.dto';

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

  /** Update a single product row that belongs to the given section. */
  async update(sectionId: number, product: UpdateProductListDto): Promise<ProductListSectionData> {
    const existing = await this.db.query.productListSections.findFirst({
      where: and(eq(productListSections.id, product.id), eq(productListSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Product list item not found');
    }

    const productExists = await this.db.$count(products, eq(products.id, product.productId));
    if (productExists !== 1) {
      throw new BadRequestException('Referenced product does not exist');
    }

    await this.db
      .update(productListSections)
      .set({
        productId: product.productId,
        sortOrder: product.sortOrder ?? 0,
      })
      .where(eq(productListSections.id, product.id));

    return this.list(sectionId);
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

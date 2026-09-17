import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
    private readonly prisma: PrismaService,
    private readonly productRepository: ProductRepository,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<ProductListSectionData> {
    const rows = await this.prisma.productListSection.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, sortOrder: true, productId: true },
    });

    const products = await this.productRepository.findSummariesByIds(rows.map((row) => row.productId));

    return { products: this.toProducts(rows, products) };
  }

  /** Update a single product row that belongs to the given section. */
  async update(sectionId: number, product: UpdateProductListDto): Promise<ProductListSectionData> {
    const existing = await this.prisma.productListSection.findFirst({
      where: { id: product.id, sectionId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Product list item not found');
    }

    const productExists = await this.prisma.product.count({ where: { id: product.productId } });
    if (productExists !== 1) {
      throw new BadRequestException('Referenced product does not exist');
    }

    await this.prisma.productListSection.update({
      where: { id: product.id },
      data: {
        productId: product.productId,
        sortOrder: product.sortOrder ?? 0,
      },
    });

    return this.list(sectionId);
  }

  private toProducts(rows: ProductListRow[], products: ProductSummary[]): ProductListItem[] {
    const productsById = new Map(products.map((product) => [product.id, product]));

    return rows.map((row) => {
      const product = productsById.get(row.productId);

      return {
        id: row.id,
        sortOrder: row.sortOrder,
        productId: row.productId,
        productName: product?.name ?? '',
        productSlug: product?.slug ?? '',
        images: (product?.images ?? []).map((image) => ({
          id: image.id,
          url: this.fileUrl.toUrl(image.filePath),
          isPrimary: image.isPrimary,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        })),
        defaultVariant: product?.defaultVariant ?? null,
      };
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { toFileUrl } from 'src/common/utils/file-url';
import type { ProductListSection } from 'src/generated/prisma/client';
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
};

export type ProductListSectionData = { products: ProductListItem[] };

type ProductRow = ProductListSection & {
  product: {
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
  } | null;
};

@Injectable()
export class ProductListSectionService {
  private readonly urlPrefix: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.urlPrefix = config.getOrThrow<string>('uploads.urlPrefix');
  }

  async list(sectionId: number): Promise<ProductListSectionData> {
    const rows = await this.prisma.productListSection.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        product: {
          select: {
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
          },
        },
      },
    });

    return { products: this.toProducts(rows) };
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

  private toProducts(rows: ProductRow[]): ProductListItem[] {
    return rows.map((row) => ({
      id: row.id,
      sortOrder: row.sortOrder,
      productId: row.product?.id ?? 0,
      productName: row.product?.name ?? '',
      productSlug: row.product?.slug ?? '',
      images: (row.product?.images ?? []).map((image) => ({
        id: image.id,
        url: toFileUrl(image.file.path, this.urlPrefix),
        isPrimary: image.isPrimary,
        isThumbnail: image.isThumbnail,
        sortOrder: image.sortOrder,
      })),
    }));
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { ProductListSection } from 'src/generated/prisma/client';
import type { UpdateProductListDto } from '../dtos/updateSectionData/update-section-data-request.dto';

export type ProductListItem = {
  id: number;
  sortOrder: number;
  productId: number;
  productName: string;
  productSlug: string;
};

export type ProductListSectionData = { products: ProductListItem[] };

type ProductRow = ProductListSection & {
  product: { id: number; name: string; slug: string } | null;
};

@Injectable()
export class ProductListSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async list(sectionId: number): Promise<ProductListSectionData> {
    const rows = await this.prisma.productListSection.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        product: { select: { id: true, name: true, slug: true } },
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
    }));
  }
}

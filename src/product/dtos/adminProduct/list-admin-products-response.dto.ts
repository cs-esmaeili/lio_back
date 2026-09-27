import { ApiProperty } from '@nestjs/swagger';

export class AdminProductListCategoryDto {
  @ApiProperty({ example: 224 })
  id!: number;

  @ApiProperty({ example: 'سیگار' })
  name!: string;
}

export class AdminProductListItemDto {
  @ApiProperty({ example: 3342 })
  id!: number;

  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi' })
  slug!: string;

  @ApiProperty({ example: '/uploads/images/product-1.png', nullable: true })
  primaryImageUrl!: string | null;

  @ApiProperty({ type: [AdminProductListCategoryDto] })
  categories!: AdminProductListCategoryDto[];

  @ApiProperty({ example: 4, description: 'Number of variants' })
  variantCount!: number;

  @ApiProperty({ type: Number, example: 120000, nullable: true, description: 'Lowest variant price' })
  priceFrom!: number | null;

  @ApiProperty({ type: Number, example: 180000, nullable: true, description: 'Highest variant price' })
  priceTo!: number | null;

  @ApiProperty({ example: 37, description: 'Sum of the stock across variants' })
  totalStock!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

export class ListAdminProductsResponseDto {
  @ApiProperty({ type: [AdminProductListItemDto] })
  items!: AdminProductListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 500 })
  total!: number;

  @ApiProperty({ example: 25 })
  totalPages!: number;
}

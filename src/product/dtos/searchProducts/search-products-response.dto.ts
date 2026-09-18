import { ApiProperty } from '@nestjs/swagger';

export class SearchProductImageDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ example: '/uploads/images/product-1.png', nullable: true })
  url!: string | null;

  @ApiProperty({ example: true })
  isPrimary!: boolean;

  @ApiProperty({ example: false })
  isThumbnail!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class SearchProductVariantDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'SEED-SKU-1-1' })
  sku!: string;

  @ApiProperty({ example: 123000 })
  price!: number;

  @ApiProperty({ example: 173000, nullable: true })
  compareAtPrice!: number | null;

  @ApiProperty({ example: 12 })
  stock!: number;
}

export class SearchProductDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: 'محصول ۱' })
  name!: string;

  @ApiProperty({ example: 'product-name' })
  slug!: string;

  @ApiProperty({ type: SearchProductImageDto, isArray: true })
  images!: SearchProductImageDto[];

  @ApiProperty({ type: SearchProductVariantDto, nullable: true })
  defaultVariant!: SearchProductVariantDto | null;
}

export class SearchProductsResponseDto {
  @ApiProperty({ type: [SearchProductDto] })
  products!: SearchProductDto[];
}

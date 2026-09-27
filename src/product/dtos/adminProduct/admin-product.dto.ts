import { ApiProperty } from '@nestjs/swagger';

export class AdminProductImageDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ example: 12, description: 'File id in the file manager' })
  fileId!: number;

  @ApiProperty({ example: '/uploads/images/product-1.png', nullable: true })
  url!: string | null;

  @ApiProperty({ example: true })
  isPrimary!: boolean;

  @ApiProperty({ example: false })
  isThumbnail!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class AdminProductCategoryDto {
  @ApiProperty({ example: 224 })
  id!: number;

  @ApiProperty({ example: 'سیگار' })
  name!: string;

  @ApiProperty({ example: 'sigar' })
  slug!: string;
}

/** A spec (non-variant) attribute value picked for the product. */
export class AdminProductSpecValueDto {
  @ApiProperty({ example: 3 })
  attributeId!: number;

  @ApiProperty({ example: 12 })
  attributeValueId!: number;
}

/** One variant-axis value selected for the product. */
export class AdminProductVariantAxisDto {
  @ApiProperty({ example: 1 })
  attributeId!: number;

  @ApiProperty({ example: [1, 2], type: [Number], description: 'Selected value ids of this axis' })
  valueIds!: number[];
}

export class AdminProductVariantValueDto {
  @ApiProperty({ example: 1 })
  attributeId!: number;

  @ApiProperty({ example: 2 })
  attributeValueId!: number;
}

export class AdminProductVariantDto {
  @ApiProperty({ example: 3744 })
  id!: number;

  @ApiProperty({ example: 'SKU-1-1' })
  sku!: string;

  @ApiProperty({ example: 1694000 })
  price!: number;

  @ApiProperty({ type: Number, example: 1744000, nullable: true })
  compareAtPrice!: number | null;

  @ApiProperty({ example: 12 })
  stock!: number;

  @ApiProperty({ example: true })
  isDefault!: boolean;

  @ApiProperty({ type: [AdminProductVariantValueDto], description: 'One entry per variant axis' })
  values!: AdminProductVariantValueDto[];
}

/** A product as returned by `GET /admin/products/:id`, shaped for the editor. */
export class AdminProductDto {
  @ApiProperty({ example: 3342 })
  id!: number;

  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi' })
  slug!: string;

  @ApiProperty({ type: String, example: '<p>معرفی محصول</p>', nullable: true })
  description!: string | null;

  @ApiProperty({ type: [AdminProductCategoryDto] })
  categories!: AdminProductCategoryDto[];

  @ApiProperty({ type: [AdminProductImageDto] })
  images!: AdminProductImageDto[];

  @ApiProperty({ type: [AdminProductSpecValueDto] })
  specValues!: AdminProductSpecValueDto[];

  @ApiProperty({ type: [AdminProductVariantAxisDto] })
  variantAxes!: AdminProductVariantAxisDto[];

  @ApiProperty({ type: [AdminProductVariantDto] })
  variants!: AdminProductVariantDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

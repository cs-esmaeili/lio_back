import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class SliderSlideDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: null, nullable: true })
  desktopFileUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  tabletFileUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  mobileFileUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  url!: string | null;
}

export class SliderSectionDataDto {
  @ApiProperty({ type: SliderSlideDto, isArray: true })
  slides!: SliderSlideDto[];
}

export class ProductImageDto {
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

export class ProductListItemDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: 42 })
  productId!: number;

  @ApiProperty({ example: 'Product name' })
  productName!: string;

  @ApiProperty({ example: 'product-name' })
  productSlug!: string;

  @ApiProperty({ type: ProductImageDto, isArray: true })
  images!: ProductImageDto[];
}

export class ProductListSectionDataDto {
  @ApiProperty({ type: ProductListItemDto, isArray: true })
  products!: ProductListItemDto[];
}

export class CreateSectionResponseDto {
  @ApiProperty({ example: 50 })
  id!: number;

  @ApiProperty({ example: 1 })
  pageId!: number;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  type!: PageSectionType;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ enum: PageSectionStatus, enumName: 'PageSectionStatus', example: PageSectionStatus.ACTIVE })
  status!: PageSectionStatus;

  @ApiExtraModels(SliderSectionDataDto, ProductListSectionDataDto)
  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(SliderSectionDataDto) }, { $ref: getSchemaPath(ProductListSectionDataDto) }],
  })
  data!: SliderSectionDataDto | ProductListSectionDataDto;
}

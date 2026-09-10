import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class SliderSlideDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: '/uploads/images/hero-desktop.png', nullable: true })
  desktopFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/hero-tablet.png', nullable: true })
  tabletFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/hero-mobile.png', nullable: true })
  mobileFileUrl!: string | null;

  @ApiProperty({ example: '/products/sale', nullable: true })
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

export class BannerItemDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: 'Summer sale' })
  title!: string;

  @ApiProperty({ example: 'Up to 50% off selected items', nullable: true })
  subtitle!: string | null;

  @ApiProperty({ example: 'Shop now', nullable: true })
  buttonTitle!: string | null;

  @ApiProperty({ example: '/products/sale', nullable: true })
  buttonUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/banner-desktop.png', nullable: true })
  desktopFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/banner-tablet.png', nullable: true })
  tabletFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/banner-mobile.png', nullable: true })
  mobileFileUrl!: string | null;
}

export class BannerSectionDataDto {
  @ApiProperty({ type: BannerItemDto, isArray: true })
  banners!: BannerItemDto[];
}

export class IntroductionSectionDataDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { title: 'عنوان اصلی', subtitle: 'توضیح کوتاه' },
  })
  titles!: Record<string, string>;

  @ApiProperty({ example: '/uploads/images/intro-desktop.png', nullable: true })
  desktopFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/intro-tablet.png', nullable: true })
  tabletFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/intro-mobile.png', nullable: true })
  mobileFileUrl!: string | null;
}

@ApiExtraModels(SliderSectionDataDto, ProductListSectionDataDto, BannerSectionDataDto, IntroductionSectionDataDto)
export class UpdateSectionDataResponseDto {
  @ApiProperty({ example: 50 })
  id!: number;

  @ApiProperty({ example: 1 })
  pageId!: number;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  type!: PageSectionType;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ enum: PageSectionStatus, enumName: 'PageSectionStatus', example: PageSectionStatus.ACTIVE })
  status!: PageSectionStatus;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(SliderSectionDataDto) },
      { $ref: getSchemaPath(ProductListSectionDataDto) },
      { $ref: getSchemaPath(BannerSectionDataDto) },
      { $ref: getSchemaPath(IntroductionSectionDataDto) },
    ],
  })
  data!: SliderSectionDataDto | ProductListSectionDataDto | BannerSectionDataDto | IntroductionSectionDataDto;
}

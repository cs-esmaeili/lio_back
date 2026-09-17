import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { HeaderSectionType, PageSectionLocation, PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

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

export class ProductDefaultVariantDto {
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

  @ApiProperty({
    type: ProductDefaultVariantDto,
    nullable: true,
    description: 'Variant flagged as default, falling back to the first variant by position',
  })
  defaultVariant!: ProductDefaultVariantDto | null;
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

export class HeaderCategoryDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'موبایل' })
  name!: string;

  @ApiProperty({ example: '/category/3' })
  url!: string;

  @ApiProperty({ type: () => [HeaderCategoryDto] })
  children!: HeaderCategoryDto[];
}

export class HeaderItemDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ enum: HeaderSectionType, enumName: 'HeaderSectionType', example: HeaderSectionType.LINK })
  type!: HeaderSectionType;

  @ApiProperty({ example: 'فروشگاه' })
  label!: string;

  @ApiProperty({ example: '/shop', nullable: true })
  url!: string | null;

  @ApiProperty({ example: 3, nullable: true })
  categoryId!: number | null;

  @ApiProperty({ type: [HeaderCategoryDto], description: 'Resolved subcategories; empty for LINK items' })
  children!: HeaderCategoryDto[];
}

export class HeaderLogoDto {
  @ApiProperty({ example: '/uploads/images/logo-small.svg', nullable: true })
  small!: string | null;

  @ApiProperty({ example: '/uploads/images/logo-large.svg', nullable: true })
  large!: string | null;
}

export class HeaderSectionDataDto {
  @ApiProperty({ type: HeaderLogoDto })
  logo!: HeaderLogoDto;

  @ApiProperty({ example: '021-12345678', nullable: true })
  supportPhone!: string | null;

  @ApiProperty({ example: 'لیو؛ ساده‌تر خرید کن.', nullable: true })
  slogan!: string | null;

  @ApiProperty({ type: [HeaderItemDto] })
  items!: HeaderItemDto[];
}

export class FooterLinkDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: 'فروشگاه' })
  label!: string;

  @ApiProperty({ example: '/shop', nullable: true })
  url!: string | null;

  @ApiProperty({ example: 'توضیحات بلند درباره این آیتم', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 101, nullable: true })
  fileId!: number | null;

  @ApiProperty({ example: '/uploads/images/footer-link.png', nullable: true })
  fileUrl!: string | null;
}

export class FooterCategoryDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'موبایل' })
  name!: string;

  @ApiProperty({ example: '/category/3' })
  url!: string;
}

export class FooterLogoDto {
  @ApiProperty({ example: '/uploads/images/logo-small.svg', nullable: true })
  small!: string | null;

  @ApiProperty({ example: '/uploads/images/logo-large.svg', nullable: true })
  large!: string | null;
}

export class FooterSectionDataDto {
  @ApiProperty({ type: FooterLogoDto })
  logo!: FooterLogoDto;

  @ApiProperty({ example: 'فروشگاه اینترنتی لیو؛ تجربهٔ خرید آنلاین سریع، مطمئن و مقرون‌به‌صرفه.', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'لیو؛ ساده‌تر خرید کن.', nullable: true })
  slogan!: string | null;

  @ApiProperty({ example: '021-12345678', nullable: true })
  supportPhone!: string | null;

  @ApiProperty({ type: [FooterLinkDto] })
  links!: FooterLinkDto[];

  @ApiProperty({ type: [FooterCategoryDto] })
  categories!: FooterCategoryDto[];
}

@ApiExtraModels(SliderSectionDataDto, ProductListSectionDataDto, BannerSectionDataDto, IntroductionSectionDataDto, HeaderSectionDataDto, FooterSectionDataDto)
export class GetSectionResponseDto {
  @ApiProperty({ example: 50 })
  id!: number;

  @ApiProperty({ type: Number, example: 1, nullable: true })
  pageId!: number | null;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  type!: PageSectionType;

  @ApiProperty({ enum: PageSectionLocation, enumName: 'PageSectionLocation', example: PageSectionLocation.SLIDER })
  location!: PageSectionLocation;

  @ApiProperty({ example: 'محصولات شگفت‌انگیز', nullable: true })
  title!: string | null;

  @ApiProperty({ example: '/products/sale', nullable: true })
  link!: string | null;

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
      { $ref: getSchemaPath(HeaderSectionDataDto) },
      { $ref: getSchemaPath(FooterSectionDataDto) },
    ],
  })
  data!: SliderSectionDataDto | ProductListSectionDataDto | BannerSectionDataDto | IntroductionSectionDataDto | HeaderSectionDataDto | FooterSectionDataDto;
}

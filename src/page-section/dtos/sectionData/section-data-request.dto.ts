import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FooterSectionType, HeaderSectionType, PageSectionType } from 'src/database/schema';

/**
 * Input for a single section item, shared by create (`POST .../data`) and
 * update (`PATCH .../data`). `id` is required when updating and ignored/forbidden
 * when creating. `sortOrder` controls display order (append when omitted).
 */
export class SliderSlideInputDto {
  @ApiPropertyOptional({ example: 11, description: 'Item id — required when updating, omitted when creating' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 101 })
  @IsInt()
  desktopFileId!: number;

  @ApiProperty({ example: 102 })
  @IsInt()
  tabletFileId!: number;

  @ApiProperty({ example: 103 })
  @IsInt()
  mobileFileId!: number;

  @ApiPropertyOptional({ example: '/products/sale', nullable: true })
  @IsOptional()
  @IsString()
  url?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ProductListItemInputDto {
  @ApiPropertyOptional({ example: 11, description: 'Item id — required when updating, omitted when creating' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 42 })
  @IsInt()
  productId!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class BannerInputDto {
  @ApiPropertyOptional({ example: 11, description: 'Item id — required when updating, omitted when creating' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Summer sale' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Up to 50% off selected items', nullable: true })
  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @ApiPropertyOptional({ example: 'Shop now', nullable: true })
  @IsOptional()
  @IsString()
  buttonTitle?: string | null;

  @ApiPropertyOptional({ example: '/products/sale', nullable: true })
  @IsOptional()
  @IsString()
  buttonUrl?: string | null;

  @ApiProperty({ example: 101 })
  @IsInt()
  desktopFileId!: number;

  @ApiProperty({ example: 102 })
  @IsInt()
  tabletFileId!: number;

  @ApiProperty({ example: 103 })
  @IsInt()
  mobileFileId!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class IntroductionInputDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { title: 'عنوان اصلی', subtitle: 'توضیح کوتاه' },
  })
  @IsObject()
  titles!: Record<string, string>;

  @ApiProperty({ example: 101 })
  @IsInt()
  desktopFileId!: number;

  @ApiPropertyOptional({ example: 102, nullable: true })
  @IsOptional()
  @IsInt()
  tabletFileId?: number | null;

  @ApiPropertyOptional({ example: 103, nullable: true })
  @IsOptional()
  @IsInt()
  mobileFileId?: number | null;
}

export class HeaderItemInputDto {
  @ApiPropertyOptional({ example: 11, description: 'Item id — required when updating, omitted when creating' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ enum: HeaderSectionType, enumName: 'HeaderSectionType', example: HeaderSectionType.LINK })
  @IsEnum(HeaderSectionType)
  type!: HeaderSectionType;

  @ApiPropertyOptional({
    example: 'فروشگاه',
    nullable: true,
    description: 'Required for LINK items; optional for CATEGORY items (falls back to the category name)',
  })
  @IsOptional()
  @IsString()
  label?: string | null;

  @ApiPropertyOptional({ example: '/shop', nullable: true, description: 'Required for LINK items; ignored for CATEGORY items' })
  @IsOptional()
  @IsString()
  url?: string | null;

  @ApiPropertyOptional({ example: 3, nullable: true, description: 'Required for CATEGORY items; ignored for LINK items' })
  @IsOptional()
  @IsInt()
  categoryId?: number | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class FooterItemInputDto {
  @ApiPropertyOptional({ example: 11, description: 'Item id — required when updating, omitted when creating' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ enum: FooterSectionType, enumName: 'FooterSectionType', example: FooterSectionType.LINK })
  @IsEnum(FooterSectionType)
  type!: FooterSectionType;

  @ApiPropertyOptional({ example: 'فروشگاه', nullable: true })
  @IsOptional()
  @IsString()
  label?: string | null;

  @ApiPropertyOptional({ example: '/shop', nullable: true })
  @IsOptional()
  @IsString()
  url?: string | null;

  @ApiPropertyOptional({ example: 'توضیحات بلند درباره این آیتم', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 101, nullable: true })
  @IsOptional()
  @IsInt()
  fileId?: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  @IsInt()
  categoryId?: number | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ContactInputDto {
  @ApiPropertyOptional({ example: 'اصفهان، خیابان ...', nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ example: 'info@liobrand.ir', nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: 'شنبه تا چهارشنبه ۹ تا ۱۸', nullable: true })
  @IsOptional()
  @IsString()
  supportHour?: string | null;

  @ApiPropertyOptional({ example: 32.655599, nullable: true, description: 'Map latitude' })
  @IsOptional()
  @IsNumber()
  mapLat?: number | null;

  @ApiPropertyOptional({ example: 51.699845, nullable: true, description: 'Map longitude' })
  @IsOptional()
  @IsNumber()
  mapLng?: number | null;
}

export class AboutStatisticInputDto {
  @ApiPropertyOptional({ example: 'مشتری راضی', nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({ example: 'از سراسر ایران', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 10000, nullable: true })
  @IsOptional()
  @IsInt()
  number?: number | null;
}

export class AboutInputDto {
  @ApiPropertyOptional({ example: 'درباره لیو', nullable: true })
  @IsOptional()
  @IsString()
  headerTitle?: string | null;

  @ApiPropertyOptional({ example: '<p>متن معرفی...</p>', nullable: true })
  @IsOptional()
  @IsString()
  headerDescription?: string | null;

  @ApiPropertyOptional({ example: 101, nullable: true })
  @IsOptional()
  @IsInt()
  headerFileId?: number | null;

  @ApiPropertyOptional({ example: 'تاریخچه ما', nullable: true })
  @IsOptional()
  @IsString()
  historyTitle?: string | null;

  @ApiPropertyOptional({ example: '<p>تاریخچه...</p>', nullable: true })
  @IsOptional()
  @IsString()
  historyDescription?: string | null;

  @ApiPropertyOptional({ example: 'پیام موسس', nullable: true })
  @IsOptional()
  @IsString()
  founderTitle?: string | null;

  @ApiPropertyOptional({ example: 'مدیرعامل لیو', nullable: true })
  @IsOptional()
  @IsString()
  founderSubtitle?: string | null;

  @ApiPropertyOptional({ example: '<p>متن پیام...</p>', nullable: true })
  @IsOptional()
  @IsString()
  founderDescription?: string | null;

  @ApiPropertyOptional({ example: 102, nullable: true })
  @IsOptional()
  @IsInt()
  founderFileId?: number | null;

  @ApiPropertyOptional({ example: 103, nullable: true })
  @IsOptional()
  @IsInt()
  founderSignatureFileId?: number | null;

  @ApiPropertyOptional({ type: [AboutStatisticInputDto], description: 'Counter items (full replacement list)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AboutStatisticInputDto)
  statistics?: AboutStatisticInputDto[];
}

/**
 * Body of `POST` (create item), `PATCH` (update item) and the query of `DELETE`
 * on `/admin/page-sections/{id}/data`. `type` selects the section handler.
 */
@ApiExtraModels(
  SliderSlideInputDto,
  ProductListItemInputDto,
  BannerInputDto,
  IntroductionInputDto,
  HeaderItemInputDto,
  FooterItemInputDto,
  ContactInputDto,
  AboutStatisticInputDto,
  AboutInputDto,
)
export class PageSectionDataRequestDto {
  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(SliderSlideInputDto) },
      { $ref: getSchemaPath(ProductListItemInputDto) },
      { $ref: getSchemaPath(BannerInputDto) },
      { $ref: getSchemaPath(IntroductionInputDto) },
      { $ref: getSchemaPath(HeaderItemInputDto) },
      { $ref: getSchemaPath(FooterItemInputDto) },
      { $ref: getSchemaPath(ContactInputDto) },
      { $ref: getSchemaPath(AboutInputDto) },
    ],
  })
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case PageSectionType.PRODUCT_LIST:
        return ProductListItemInputDto;
      case PageSectionType.BANNER:
        return BannerInputDto;
      case PageSectionType.INTRODUCTION:
        return IntroductionInputDto;
      case PageSectionType.HEADER:
        return HeaderItemInputDto;
      case PageSectionType.FOOTER:
        return FooterItemInputDto;
      case PageSectionType.CONTACT:
        return ContactInputDto;
      case PageSectionType.ABOUT:
        return AboutInputDto;
      default:
        return SliderSlideInputDto;
    }
  })
  data!: SliderSlideInputDto | ProductListItemInputDto | BannerInputDto | IntroductionInputDto | HeaderItemInputDto | FooterItemInputDto | ContactInputDto | AboutInputDto;
}

export type PageSectionItemInput =
  SliderSlideInputDto | ProductListItemInputDto | BannerInputDto | IntroductionInputDto | HeaderItemInputDto | FooterItemInputDto | ContactInputDto | AboutInputDto;

/**
 * `POST`/`PATCH` send `{ type, data }`. `DELETE` needs only the item id (the
 * section type is derived from the section itself).
 */
export class DeleteSectionDataQueryDto {
  @ApiPropertyOptional({ example: 11, description: 'Item id to remove. Omitted for singleton sections (INTRODUCTION).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  itemId?: number;
}

import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsEnum, IsInt, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { HeaderSectionType, PageSectionType } from 'src/generated/prisma/client';

export class UpdateSliderSlideDto {
  @ApiProperty({ example: 11 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 101 })
  @IsInt()
  desktopFileId!: number;

  @ApiProperty({ example: 102 })
  @IsInt()
  tabletFileId!: number;

  @ApiProperty({ example: 103 })
  @IsInt()
  mobileFileId!: number;

  @ApiPropertyOptional({ example: '/products/sale', nullable: true, description: 'Relative link target for the slide' })
  @IsOptional()
  @IsString()
  url?: string | null;
}

export class UpdateProductListDto {
  @ApiProperty({ example: 11 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 42 })
  @IsInt()
  productId!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateBannerDto {
  @ApiProperty({ example: 11 })
  @IsInt()
  id!: number;

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
}

export class UpdateIntroductionDto {
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

export class UpdateHeaderItemDto {
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
}

export class UpdateHeaderDto {
  @ApiProperty({
    type: [UpdateHeaderItemDto],
    description: 'Top-level header items in display order. The list is replaced in full.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateHeaderItemDto)
  items!: UpdateHeaderItemDto[];
}

@ApiExtraModels(UpdateSliderSlideDto, UpdateProductListDto, UpdateBannerDto, UpdateIntroductionDto, UpdateHeaderDto)
export class UpdatePageSectionDataDto {
  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(UpdateSliderSlideDto) },
      { $ref: getSchemaPath(UpdateProductListDto) },
      { $ref: getSchemaPath(UpdateBannerDto) },
      { $ref: getSchemaPath(UpdateIntroductionDto) },
      { $ref: getSchemaPath(UpdateHeaderDto) },
    ],
  })
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case PageSectionType.PRODUCT_LIST:
        return UpdateProductListDto;
      case PageSectionType.BANNER:
        return UpdateBannerDto;
      case PageSectionType.INTRODUCTION:
        return UpdateIntroductionDto;
      case PageSectionType.HEADER:
        return UpdateHeaderDto;
      default:
        return UpdateSliderSlideDto;
    }
  })
  data!: UpdateSliderSlideDto | UpdateProductListDto | UpdateBannerDto | UpdateIntroductionDto | UpdateHeaderDto;
}

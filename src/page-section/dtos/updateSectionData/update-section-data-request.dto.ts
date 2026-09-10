import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsNotEmpty, IsNotEmptyObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PageSectionType } from 'src/generated/prisma/client';

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

export class UpdatePageSectionDataDto {
  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(UpdateSliderSlideDto) }, { $ref: getSchemaPath(UpdateProductListDto) }, { $ref: getSchemaPath(UpdateBannerDto) }],
  })
  @ApiExtraModels(UpdateSliderSlideDto, UpdateProductListDto, UpdateBannerDto)
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case PageSectionType.PRODUCT_LIST:
        return UpdateProductListDto;
      case PageSectionType.BANNER:
        return UpdateBannerDto;
      default:
        return UpdateSliderSlideDto;
    }
  })
  data!: UpdateSliderSlideDto | UpdateProductListDto | UpdateBannerDto;
}

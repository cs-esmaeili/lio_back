import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsNotEmptyObject, IsOptional, IsString, ValidateNested } from 'class-validator';
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

export class UpdatePageSectionDataDto {
  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(UpdateSliderSlideDto) }, { $ref: getSchemaPath(UpdateProductListDto) }],
  })
  @ApiExtraModels(UpdateSliderSlideDto, UpdateProductListDto)
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type((obj) => (obj?.object?.type === PageSectionType.PRODUCT_LIST ? UpdateProductListDto : UpdateSliderSlideDto))
  data!: UpdateSliderSlideDto | UpdateProductListDto;
}

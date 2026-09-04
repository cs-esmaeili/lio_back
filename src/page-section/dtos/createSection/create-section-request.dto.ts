import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { SliderDataDto } from '../../section-schemas/slider.schema';
import { ProductListDataDto } from '../../section-schemas/products.schema';
import { ThreeTextDataDto } from '../../section-schemas/three-text.schema';

@ApiExtraModels(SliderDataDto, ProductListDataDto, ThreeTextDataDto)
export class CreateSectionRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  pageId!: number;

  @ApiProperty({ example: 'slider' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: 'Slider', nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    oneOf: [
      { $ref: getSchemaPath(SliderDataDto) },
      { $ref: getSchemaPath(ProductListDataDto) },
      { $ref: getSchemaPath(ThreeTextDataDto) },
    ],
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class SearchProductsFilterDto {
  @ApiProperty({ example: 1, description: 'Attribute id from the category filters response' })
  @IsInt()
  attributeId!: number;

  @ApiProperty({ example: [1, 2], type: [Number], description: 'Selected value ids for this attribute (OR within the attribute)' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  valueIds!: number[];
}

export class SearchProductsRequestDto {
  @ApiProperty({ example: 'clothing' })
  @IsString()
  @IsNotEmpty()
  categorySlug!: string;

  @ApiPropertyOptional({
    type: [SearchProductsFilterDto],
    description: 'Attribute value filters. AND across attributes, matched on a single variant.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchProductsFilterDto)
  filters?: SearchProductsFilterDto[];

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number, 1-based. Defaults to 1.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Page size. Defaults to 20 and is capped at 100.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

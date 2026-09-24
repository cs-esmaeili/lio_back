import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ProductSort } from '../../product-sort';

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
  @ApiPropertyOptional({ example: 'clothing', description: 'Category scope. When omitted, products are searched across the whole catalogue.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categorySlug?: string;

  @ApiPropertyOptional({ example: 'کامل', description: 'Case-insensitive substring match on the product name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    type: [SearchProductsFilterDto],
    description: 'Attribute value filters. AND across attributes, matched on a single variant.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchProductsFilterDto)
  filters?: SearchProductsFilterDto[];

  @ApiPropertyOptional({ example: 100000, description: 'Minimum display price of the default variant' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000, description: 'Maximum display price of the default variant' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: true, description: 'Only products with at least one in-stock variant' })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Only products whose default variant has a compare-at price above its price' })
  @IsOptional()
  @IsBoolean()
  hasDiscount?: boolean;

  @ApiPropertyOptional({ enum: ProductSort, enumName: 'ProductSort', example: ProductSort.NEWEST })
  @IsOptional()
  @IsEnum(ProductSort)
  sort?: ProductSort;

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

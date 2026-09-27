import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';

/** Slugs travel in public URLs, so keep them lowercase, dashed and ASCII. */
export const CREATE_PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProductImageInputDto {
  @ApiProperty({ example: 12, description: 'File id from the file manager' })
  @IsInt()
  fileId!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isThumbnail?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ProductSpecValueInputDto {
  @ApiProperty({ example: 3, description: 'A SPEC attribute of one of the product categories' })
  @IsInt()
  attributeId!: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  attributeValueId!: number;
}

export class ProductVariantAxisInputDto {
  @ApiProperty({ example: 1, description: 'A VARIANT attribute of one of the product categories' })
  @IsInt()
  attributeId!: number;

  @ApiProperty({ example: [1, 2], type: [Number], description: 'Selected value ids of this axis' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  valueIds!: number[];
}

export class ProductVariantValueInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  attributeId!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  attributeValueId!: number;
}

export class ProductVariantInputDto {
  @ApiPropertyOptional({ example: 'SKU-1-1', description: 'Omit or send an empty string to auto-generate from the slug' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sku?: string;

  @ApiProperty({ example: 1694000, description: 'Selling price; 0 means "call for price"' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ type: Number, example: 1744000, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number | null;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ type: [ProductVariantValueInputDto], description: 'One value per variant axis; empty when the product has no variant axes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantValueInputDto)
  values!: ProductVariantValueInputDto[];
}

/** Full product payload sent by the editor. Nested arrays are replaced as a whole. */
export class CreateProductRequestDto {
  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi', description: 'Unique URL slug — lowercase letters, digits and dashes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  @Matches(CREATE_PRODUCT_SLUG_PATTERN, { message: 'slug must contain lowercase letters, digits and dashes only' })
  slug!: string;

  @ApiPropertyOptional({ type: String, example: '<p>معرفی محصول</p>', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiProperty({ example: [3, 8], type: [Number], description: 'Category ids; drives the available attributes' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  categoryIds!: number[];

  @ApiProperty({ type: [ProductImageInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images!: ProductImageInputDto[];

  @ApiProperty({ type: [ProductSpecValueInputDto], description: 'One entry per selected spec attribute value' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecValueInputDto)
  specValues!: ProductSpecValueInputDto[];

  @ApiProperty({ type: [ProductVariantAxisInputDto], description: 'Variant axes and their selected values' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantAxisInputDto)
  variantAxes!: ProductVariantAxisInputDto[];

  @ApiProperty({ type: [ProductVariantInputDto], description: 'Every combination; each carries its own price and stock' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants!: ProductVariantInputDto[];
}

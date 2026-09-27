import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** Slugs travel in public URLs, so keep them lowercase, dashed and ASCII. */
export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryRequestDto {
  @ApiProperty({ example: 'پوشاک' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'clothing', description: 'Unique URL slug — lowercase letters, digits and dashes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Matches(CATEGORY_SLUG_PATTERN, { message: 'slug must contain lowercase letters, digits and dashes only' })
  slug!: string;

  @ApiPropertyOptional({ example: 1, nullable: true, description: 'Parent category id; omit for a root category' })
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({ example: 10, nullable: true, description: 'Category image file id' })
  @IsOptional()
  @IsInt()
  imageId?: number | null;
}

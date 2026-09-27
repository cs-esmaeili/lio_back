import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CATEGORY_SLUG_PATTERN } from './create-category-request.dto';

export class UpdateCategoryRequestDto {
  @ApiPropertyOptional({ example: 'پوشاک مردانه' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'men-clothing', description: 'Unique URL slug — lowercase letters, digits and dashes' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Matches(CATEGORY_SLUG_PATTERN, { message: 'slug must contain lowercase letters, digits and dashes only' })
  slug?: string;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'Parent category id; send `null` to move the category to the root, omit to leave it unchanged',
  })
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({ example: 10, nullable: true, description: 'Image file id; send `null` to remove the image' })
  @IsOptional()
  @IsInt()
  imageId?: number | null;
}

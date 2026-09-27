import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export class SetCategoryAttributeItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  attributeId!: number;

  @ApiPropertyOptional({ example: false, description: 'The product editor must pick a value for this attribute' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Show this attribute on the public listing filters' })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/** Full replacement of a category's attribute assignment. */
export class SetCategoryAttributesRequestDto {
  @ApiProperty({ type: [SetCategoryAttributeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetCategoryAttributeItemDto)
  attributes!: SetCategoryAttributeItemDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { AttributeUsage, FilterType } from 'src/database/schema';

/**
 * A category↔attribute link. `isRequired` forces the product editor to pick a
 * value, `isFilterable` exposes the attribute on the public listing filters,
 * and `sortOrder` controls the order in both.
 */
export class AdminCategoryAttributeDto {
  @ApiProperty({ example: 1 })
  attributeId!: number;

  @ApiProperty({ example: 'color' })
  name!: string;

  @ApiProperty({ example: 'رنگ' })
  title!: string;

  @ApiProperty({ enum: AttributeUsage, enumName: 'AttributeUsage', example: AttributeUsage.VARIANT })
  usage!: AttributeUsage;

  @ApiProperty({ enum: FilterType, enumName: 'FilterType', example: FilterType.CHECKBOX })
  filterType!: FilterType;

  @ApiProperty({ example: true })
  isMultiSelect!: boolean;

  @ApiProperty({ example: false })
  isRequired!: boolean;

  @ApiProperty({ example: true })
  isFilterable!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

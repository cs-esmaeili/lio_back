import { ApiProperty } from '@nestjs/swagger';
import { AttributeUsage, FilterType } from 'src/database/schema';

export class AdminAvailableAttributeValueDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'قرمز' })
  value!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

/**
 * An attribute the product editor may use, derived from the attributes assigned
 * to the product's categories. `isRequired`/`isFilterable`/`sortOrder` come from
 * the category↔attribute link.
 */
export class AdminAvailableAttributeDto {
  @ApiProperty({ example: 1 })
  id!: number;

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

  @ApiProperty({ type: [AdminAvailableAttributeValueDto] })
  values!: AdminAvailableAttributeValueDto[];
}

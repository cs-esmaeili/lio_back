import { ApiProperty } from '@nestjs/swagger';
import { AttributeUsage, FilterType } from 'src/database/schema';

/** A single value of an attribute, ordered by `sortOrder`. */
export class AdminAttributeValueDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'قرمز' })
  value!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

/**
 * An attribute as returned by the admin endpoints. `usage` tells the product
 * editor whether it is a spec (product description) or a variant axis
 * (one price/stock per combination of values).
 */
export class AdminAttributeDto {
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

  @ApiProperty({ type: [AdminAttributeValueDto] })
  values!: AdminAttributeValueDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

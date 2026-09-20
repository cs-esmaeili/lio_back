import { ApiProperty } from '@nestjs/swagger';
import { AttributeUsage, FilterType } from 'src/database/schema';

export class CategoryFilterValueDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'قرمز' })
  value!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class CategoryFilterDto {
  @ApiProperty({ example: 3 })
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

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ type: CategoryFilterValueDto, isArray: true })
  values!: CategoryFilterValueDto[];
}

export class GetCategoryFiltersResponseDto {
  @ApiProperty({ type: [CategoryFilterDto] })
  filters!: CategoryFilterDto[];
}

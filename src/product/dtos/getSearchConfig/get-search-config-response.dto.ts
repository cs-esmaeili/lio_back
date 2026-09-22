import { ApiProperty } from '@nestjs/swagger';
import { AttributeUsage, FilterType } from 'src/database/schema';
import type { ProductSort } from '../../product-sort';

export class SearchConfigGlobalFilterDto {
  @ApiProperty({ example: 'price', description: 'Filter key to send back on the search request' })
  key!: string;

  @ApiProperty({ example: 'قیمت' })
  title!: string;

  @ApiProperty({ enum: FilterType, enumName: 'FilterType', example: FilterType.RANGE })
  type!: FilterType;
}

export class SearchConfigSortDto {
  @ApiProperty({ example: 'cheapest', description: 'Sort key to send back on the search request' })
  key!: ProductSort;

  @ApiProperty({ example: 'ارزان‌ترین' })
  title!: string;
}

export class SearchConfigCategoryFilterValueDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'قرمز' })
  value!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class SearchConfigCategoryFilterDto {
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

  @ApiProperty({ type: SearchConfigCategoryFilterValueDto, isArray: true })
  values!: SearchConfigCategoryFilterValueDto[];
}

export class GetSearchConfigResponseDto {
  @ApiProperty({ type: [SearchConfigGlobalFilterDto], description: 'Non-attribute filters available on every listing page' })
  globalFilters!: SearchConfigGlobalFilterDto[];

  @ApiProperty({ type: [SearchConfigSortDto], description: 'Sort options available on every listing page' })
  sorts!: SearchConfigSortDto[];

  @ApiProperty({ type: [SearchConfigCategoryFilterDto], nullable: true, description: 'Filterable attributes of the category, or null when no categorySlug was sent' })
  categoryFilters!: SearchConfigCategoryFilterDto[] | null;
}

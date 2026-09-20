import { ApiProperty } from '@nestjs/swagger';
import { FilterType } from 'src/database/schema';

export class ProductGlobalFilterDefinitionDto {
  @ApiProperty({ example: 'price', description: 'Filter key to send back on the search request' })
  key!: string;

  @ApiProperty({ example: 'قیمت' })
  title!: string;

  @ApiProperty({ enum: FilterType, enumName: 'FilterType', example: FilterType.RANGE })
  type!: FilterType;
}

export class GetProductGlobalFiltersResponseDto {
  @ApiProperty({ type: [ProductGlobalFilterDefinitionDto] })
  filters!: ProductGlobalFilterDefinitionDto[];
}

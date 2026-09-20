import { ApiProperty } from '@nestjs/swagger';
import type { ProductSort } from '../../product-sort';

export class ProductSortOptionDto {
  @ApiProperty({ example: 'cheapest', description: 'Sort key to send back on the search request' })
  key!: ProductSort;

  @ApiProperty({ example: 'ارزان‌ترین' })
  title!: string;
}

export class GetProductSortOptionsResponseDto {
  @ApiProperty({ type: [ProductSortOptionDto] })
  sorts!: ProductSortOptionDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ProductListDataDto {
  @ApiProperty({ type: Number, isArray: true, example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  productIds!: number[];
}

export function mapProductListData(data: unknown): Record<string, unknown> {
  const raw = (data ?? {}) as { productIds?: unknown[] };
  const productIds = (Array.isArray(raw.productIds) ? raw.productIds : []) as number[];
  return { productIds };
}

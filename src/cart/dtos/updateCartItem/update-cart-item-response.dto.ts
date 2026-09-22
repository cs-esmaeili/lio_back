import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemProductDto {
  @ApiProperty({ example: 3342 })
  id!: number;

  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi' })
  slug!: string;
}

export class UpdateCartItemVariantDto {
  @ApiProperty({ example: 3744 })
  id!: number;

  @ApiProperty({ example: 'SEED-SKU-1-1' })
  sku!: string;

  @ApiProperty({ example: 1694000, description: 'Current selling price' })
  price!: number;

  @ApiProperty({ type: Number, example: 1744000, nullable: true, description: 'Reference price before discount' })
  compareAtPrice!: number | null;

  @ApiProperty({ example: 12 })
  stock!: number;
}

export class UpdateCartItemItemDto {
  @ApiProperty({ example: 3744, description: 'Product variant id. Also used as the :variantId path parameter.' })
  variantId!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 3388000, description: 'Current variant price multiplied by quantity' })
  lineTotal!: number;

  @ApiProperty({ type: UpdateCartItemProductDto })
  product!: UpdateCartItemProductDto;

  @ApiProperty({ type: UpdateCartItemVariantDto })
  variant!: UpdateCartItemVariantDto;
}

export class UpdateCartItemResponseDto {
  @ApiProperty({ type: [UpdateCartItemItemDto] })
  items!: UpdateCartItemItemDto[];

  @ApiProperty({ example: 3, description: 'Sum of all item quantities' })
  itemCount!: number;

  @ApiProperty({ example: 2, description: 'Number of distinct variants in the cart' })
  distinctItemCount!: number;

  @ApiProperty({ example: 3388000, description: 'Sum of the line totals, using current variant prices' })
  subtotal!: number;
}

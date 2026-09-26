import { ApiProperty } from '@nestjs/swagger';

export class RemoveCartItemProductDto {
  @ApiProperty({ example: 3342 })
  id!: number;

  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi' })
  slug!: string;

  @ApiProperty({ type: String, example: '/uploads/images/product-1.png', nullable: true, description: 'Primary product image URL' })
  image!: string | null;
}

export class RemoveCartItemVariantDto {
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

export class RemoveCartItemItemDto {
  @ApiProperty({ example: 3744, description: 'Product variant id. Also used as the :variantId path parameter.' })
  variantId!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 3388000, description: 'Current variant price multiplied by quantity' })
  lineTotal!: number;

  @ApiProperty({
    example: 1000000,
    description: 'Discount for this line versus the compare-at price: (compareAtPrice - price) * quantity. Zero when there is no compare-at price.',
  })
  discount!: number;

  @ApiProperty({ type: RemoveCartItemProductDto })
  product!: RemoveCartItemProductDto;

  @ApiProperty({ type: RemoveCartItemVariantDto })
  variant!: RemoveCartItemVariantDto;
}

export class RemoveCartItemResponseDto {
  @ApiProperty({ type: [RemoveCartItemItemDto] })
  items!: RemoveCartItemItemDto[];

  @ApiProperty({ example: 3, description: 'Sum of all item quantities' })
  itemCount!: number;

  @ApiProperty({ example: 2, description: 'Number of distinct variants in the cart' })
  distinctItemCount!: number;

  @ApiProperty({ example: 3388000, description: 'Sum of the line totals, using current variant prices' })
  subtotal!: number;

  @ApiProperty({
    example: 1000000,
    description: 'Total savings versus compare-at prices: the sum of every line discount ("you saved"). It does not affect the amount payable.',
  })
  totalDiscount!: number;
}

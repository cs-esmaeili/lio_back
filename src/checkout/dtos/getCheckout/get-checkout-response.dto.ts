import { ApiProperty } from '@nestjs/swagger';

export class GetCheckoutProductDto {
  @ApiProperty({ example: 3342 })
  id!: number;

  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi' })
  slug!: string;

  @ApiProperty({ type: String, example: '/uploads/images/product-1.png', nullable: true, description: 'Primary product image URL' })
  image!: string | null;
}

export class GetCheckoutVariantDto {
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

export class GetCheckoutItemDto {
  @ApiProperty({ example: 3744, description: 'Product variant id' })
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

  @ApiProperty({ type: GetCheckoutProductDto })
  product!: GetCheckoutProductDto;

  @ApiProperty({ type: GetCheckoutVariantDto })
  variant!: GetCheckoutVariantDto;
}

export class GetCheckoutShippingDto {
  @ApiProperty({ example: true, description: 'Whether shipping is charged at all (the `shipping` site setting)' })
  enabled!: boolean;

  @ApiProperty({ example: 50000, description: 'Flat shipping cost. Only charged when enabled and the subtotal is below freeOver.' })
  cost!: number;

  @ApiProperty({ example: 500000, description: 'Order subtotal from which shipping becomes free. Zero means the rule is disabled.' })
  freeOver!: number;
}

export class GetCheckoutCustomerDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789', description: 'Phone number (the login identifier), used to prefill the contact form' })
  phone!: string;

  @ApiProperty({ type: String, example: 'Ali', nullable: true })
  name!: string | null;

  @ApiProperty({ type: String, example: 'Rezaei', nullable: true })
  lastName!: string | null;
}

export class GetCheckoutAddressLocationDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Tehran' })
  province!: string;

  @ApiProperty({ example: 'Tehran' })
  city!: string;
}

export class GetCheckoutAddressDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Home' })
  title!: string;

  @ApiProperty({ example: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳' })
  address!: string;

  @ApiProperty({ example: '1234567890' })
  postalCode!: string;

  @ApiProperty({ example: true, description: 'Whether this is the default address' })
  isMain!: boolean;

  @ApiProperty({ example: 12 })
  locationId!: number;

  @ApiProperty({ type: GetCheckoutAddressLocationDto })
  location!: GetCheckoutAddressLocationDto;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  updatedAt!: string;
}

export class GetCheckoutPaymentDto {
  @ApiProperty({ example: 'zarinpal', description: 'Active payment gateway name the frontend must redirect to after placing the order' })
  provider!: string;
}

export class GetCheckoutResponseDto {
  @ApiProperty({ type: [GetCheckoutItemDto], description: 'Cart lines with their current live prices' })
  items!: GetCheckoutItemDto[];

  @ApiProperty({ example: 3, description: 'Sum of all item quantities' })
  itemCount!: number;

  @ApiProperty({ example: 2, description: 'Number of distinct variants in the cart' })
  distinctItemCount!: number;

  @ApiProperty({ example: 3388000, description: 'Sum of the line totals, using current variant prices' })
  subtotal!: number;

  @ApiProperty({ example: 0, description: 'Shipping cost for this order, resolved from the `shipping` setting' })
  shippingCost!: number;

  @ApiProperty({
    example: 0,
    description: 'Order-level reduction (coupon, manual grant, ...). Currently always 0 because no coupon flow exists yet.',
  })
  orderDiscount!: number;

  @ApiProperty({
    example: 1000000,
    description: 'Informational savings versus compare-at prices ("you saved"). It does not affect `total`.',
  })
  totalDiscount!: number;

  @ApiProperty({ example: 3388000, description: 'Amount payable: subtotal + shippingCost - orderDiscount' })
  total!: number;

  @ApiProperty({ type: GetCheckoutShippingDto })
  shipping!: GetCheckoutShippingDto;

  @ApiProperty({ type: GetCheckoutCustomerDto })
  customer!: GetCheckoutCustomerDto;

  @ApiProperty({ type: [GetCheckoutAddressDto], description: 'The user addresses, default first. Empty when the user has none.' })
  addresses!: GetCheckoutAddressDto[];

  @ApiProperty({ type: Number, example: 1, nullable: true, description: 'Id of the default (isMain) address, or null when there is none' })
  defaultAddressId!: number | null;

  @ApiProperty({ type: GetCheckoutPaymentDto })
  payment!: GetCheckoutPaymentDto;
}

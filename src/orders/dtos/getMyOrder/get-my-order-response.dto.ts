import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from 'src/database/schema';

export class MyOrderLineDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ example: 15, nullable: true, description: 'Trace only; the line snapshot below is the source of truth' })
  productId!: number | null;

  @ApiProperty({ example: 'قهوه اسپرسو' })
  productName!: string;

  @ApiProperty({ example: 'espresso-coffee' })
  productSlug!: string;

  @ApiProperty({ example: 'ESP-250' })
  sku!: string;

  @ApiProperty({ example: 500000 })
  unitPrice!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 1000000 })
  lineTotal!: number;

  @ApiProperty({ example: 'https://api.local/uploads/images/product-1.png', nullable: true })
  imageUrl!: string | null;
}

export class MyOrderCustomerDto {
  @ApiProperty({ example: 'Javad' })
  firstName!: string;

  @ApiProperty({ example: 'Esmaeili' })
  lastName!: string;

  @ApiProperty({ example: '09123456789' })
  phone!: string;

  @ApiProperty({ example: 'Lio', nullable: true })
  company!: string | null;
}

export class MyOrderAddressDto {
  @ApiProperty({ example: 'Tehran' })
  province!: string;

  @ApiProperty({ example: 'Tehran' })
  city!: string;

  @ApiProperty({ example: 'Valiasr St, No. 1' })
  address!: string;

  @ApiProperty({ example: '1234567890' })
  postalCode!: string;
}

export class MyOrderPaymentDto {
  @ApiProperty({ example: 'zarinpal', nullable: true })
  provider!: string | null;

  @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus', example: PaymentStatus.VERIFIED, nullable: true })
  status!: PaymentStatus | null;

  @ApiProperty({ example: '123456789', nullable: true })
  refId!: string | null;
}

export class GetMyOrderResponseDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 'ORD-20260926-4F2A9C10BD' })
  orderNumber!: string;

  @ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus', example: OrderStatus.PAID })
  status!: OrderStatus;

  @ApiProperty({ example: 3000000 })
  subtotal!: number;

  @ApiProperty({ example: 0 })
  discount!: number;

  @ApiProperty({ example: 388000 })
  shippingCost!: number;

  @ApiProperty({ example: 3388000 })
  total!: number;

  @ApiProperty({ type: MyOrderCustomerDto })
  customer!: MyOrderCustomerDto;

  @ApiProperty({ type: MyOrderAddressDto })
  shippingAddress!: MyOrderAddressDto;

  @ApiProperty({ type: MyOrderPaymentDto, nullable: true })
  payment!: MyOrderPaymentDto | null;

  @ApiProperty({ type: [MyOrderLineDto] })
  items!: MyOrderLineDto[];

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: '2026-08-30T12:05:00.000Z', nullable: true })
  paidAt!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  canceledAt!: string | null;

  @ApiProperty({ example: '12345678901234567890', nullable: true, description: 'Postal tracking code, set when the order is shipped' })
  trackingCode!: string | null;

  @ApiPropertyOptional({ example: '2026-08-31T09:00:00.000Z', nullable: true, description: 'Moment the order was shipped' })
  shippedAt!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, description: 'Moment the order was completed' })
  completedAt!: string | null;

  @ApiProperty({ example: '2026-08-30T12:30:00.000Z', description: 'Moment the reserved stock is released if still unpaid' })
  expiresAt!: string;
}

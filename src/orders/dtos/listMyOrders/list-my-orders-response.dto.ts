import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/database/schema';

export class MyOrderListItemDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 'ORD-20260926-4F2A9C10BD' })
  orderNumber!: string;

  @ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus', example: OrderStatus.PAID })
  status!: OrderStatus;

  @ApiProperty({ example: 3388000, description: 'Amount payable in Toman' })
  total!: number;

  @ApiProperty({ example: 3, description: 'Number of purchased lines' })
  itemCount!: number;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z', nullable: true })
  paidAt!: string | null;
}

export class ListMyOrdersResponseDto {
  @ApiProperty({ type: [MyOrderListItemDto] })
  items!: MyOrderListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

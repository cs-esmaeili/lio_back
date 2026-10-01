import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';
import { OrderStatus } from 'src/database/schema';

export class AdminOrderListItemDto {
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

  @ApiProperty({ example: 'Javad Esmaeili' })
  customerName!: string;

  @ApiProperty({ example: PHONE_NUMBER_EXAMPLE })
  phone!: string;

  @ApiProperty({ example: 2, nullable: true, description: 'Owner user id; null for a guest or a deleted user' })
  userId!: number | null;

  @ApiProperty({ example: PHONE_NUMBER_EXAMPLE, nullable: true, description: 'Owner username; null for a guest or a deleted user' })
  username!: string | null;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z', nullable: true })
  paidAt!: string | null;
}

export class ListOrdersResponseDto {
  @ApiProperty({ type: [AdminOrderListItemDto] })
  items!: AdminOrderListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

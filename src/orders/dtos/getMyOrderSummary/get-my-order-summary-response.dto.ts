import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/database/schema';

export class MyOrderStatusCountDto {
  @ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus', example: OrderStatus.PAID })
  status!: OrderStatus;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class GetMyOrderSummaryResponseDto {
  @ApiProperty({ example: 7, description: 'Total orders placed by the current user' })
  total!: number;

  @ApiProperty({ type: [MyOrderStatusCountDto], description: 'One entry per status, including statuses with a zero count' })
  items!: MyOrderStatusCountDto[];
}

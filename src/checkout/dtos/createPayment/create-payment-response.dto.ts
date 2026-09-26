import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentResponseDto {
  @ApiProperty({ example: 42, description: 'Id of the order created from the cart' })
  orderId!: number;

  @ApiProperty({ example: 'ORD-20260926-4F2A9C10BD', description: 'Human-readable order number, also used as the gateway description' })
  orderNumber!: string;

  @ApiProperty({ example: 3388000, description: 'Amount payable in Toman (the order total at payment time)' })
  amount!: number;

  @ApiProperty({ example: 'zarinpal', description: 'Active payment gateway name' })
  provider!: string;

  @ApiProperty({
    example: 'https://www.zarinpal.com/pg/StartPay/00000000000000000000000000000000000000',
    description: 'Redirect the payer to this URL to complete the payment. The order is already created and its stock reserved.',
  })
  paymentUrl!: string;
}

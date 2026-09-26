import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiProperty({
    example: 1,
    description: 'Shipping address id owned by the current user. Its snapshot is copied onto the order.',
  })
  @IsInt()
  @Min(1)
  addressId!: number;
}

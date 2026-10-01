import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';

export class SaveContactFormResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'علی رضایی' })
  name!: string;

  @ApiProperty({ example: PHONE_NUMBER_EXAMPLE })
  phone!: string;

  @ApiProperty({ example: 'سلام، درباره سفارش ...' })
  message!: string;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  createdAt!: string;
}

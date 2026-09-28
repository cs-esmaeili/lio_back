import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ShipOrderRequestDto {
  @ApiProperty({ example: '12345678901234567890', description: 'Postal tracking code issued by the carrier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  trackingCode!: string;
}

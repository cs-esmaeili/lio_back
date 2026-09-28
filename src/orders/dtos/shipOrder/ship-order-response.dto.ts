import { ApiProperty } from '@nestjs/swagger';

export class ShipOrderResponseDto {
  @ApiProperty({ example: true, description: 'True once the order moved to `SHIPPED`' })
  ok!: boolean;
}

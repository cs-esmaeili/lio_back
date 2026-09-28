import { ApiProperty } from '@nestjs/swagger';

export class CompleteOrderResponseDto {
  @ApiProperty({ example: true, description: 'True once the order moved to `COMPLETED`' })
  ok!: boolean;
}

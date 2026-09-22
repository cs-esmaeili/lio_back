import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemRequestDto {
  @ApiProperty({ example: 2, minimum: 1, description: 'New absolute quantity for the variant.' })
  @IsInt()
  @Min(1)
  quantity!: number;
}

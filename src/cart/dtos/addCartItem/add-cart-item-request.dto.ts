import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddCartItemRequestDto {
  @ApiProperty({ example: 3744, description: 'Product variant id to add' })
  @IsInt()
  @Min(1)
  variantId!: number;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1, description: 'How many units to add. Defaults to 1.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

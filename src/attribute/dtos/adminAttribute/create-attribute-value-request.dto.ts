import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAttributeValueRequestDto {
  @ApiProperty({ example: 'قرمز' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  value!: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order; defaults to the end of the list' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

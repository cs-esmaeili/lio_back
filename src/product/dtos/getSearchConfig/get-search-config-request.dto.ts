import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetSearchConfigRequestDto {
  @ApiPropertyOptional({ example: 'clothing', description: 'Category scope. When omitted, categoryFilters is null.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categorySlug?: string;
}

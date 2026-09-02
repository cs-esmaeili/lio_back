import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListFilesRequestDto {
  @ApiPropertyOptional({
    description: 'Relative folder path (empty for root)',
    example: 'images/products',
  })
  @IsOptional()
  @IsString()
  path?: string;
}

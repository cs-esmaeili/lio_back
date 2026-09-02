import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFilesRequestDto {
  @ApiPropertyOptional({
    description: 'Target folder relative path (empty for root)',
    example: 'images',
  })
  @IsOptional()
  @IsString()
  path?: string;
}

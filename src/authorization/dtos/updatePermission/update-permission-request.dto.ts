import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionRequestDto {
  @ApiPropertyOptional({ description: 'Permission key', example: 'product:write' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Permission description', example: 'Create and edit products' })
  @IsOptional()
  @IsString()
  description?: string;
}

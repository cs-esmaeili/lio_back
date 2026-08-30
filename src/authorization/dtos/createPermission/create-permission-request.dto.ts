import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionRequestDto {
  @ApiProperty({ description: 'Unique permission key', example: 'product:write' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Permission description', example: 'Create and edit products' })
  @IsOptional()
  @IsString()
  description?: string;
}

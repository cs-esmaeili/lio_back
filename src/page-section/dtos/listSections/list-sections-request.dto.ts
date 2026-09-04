import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class ListSectionsRequestDto {
  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageId?: number;

  @ApiPropertyOptional({ example: 'home' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'slider' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

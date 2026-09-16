import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PageSectionLocation } from 'src/generated/prisma/client';

export class GetSectionQueryDto {
  @ApiPropertyOptional({ example: 50, description: 'Page section id. Takes precedence over location when provided.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ enum: PageSectionLocation, enumName: 'PageSectionLocation', example: PageSectionLocation.HEADER })
  @IsOptional()
  @IsEnum(PageSectionLocation)
  location?: PageSectionLocation;
}

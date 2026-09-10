import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { EntityType } from 'src/generated/prisma/client';

export class GetPageSectionsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page id. Takes precedence over entityType when provided.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ enum: EntityType, enumName: 'EntityType', example: EntityType.HOME })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiPropertyOptional({ example: 42, description: 'Entity id used together with entityType.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;
}

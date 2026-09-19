import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { EntityType } from 'src/database/schema';

export class GetPageSectionsQueryDto {
  @ApiProperty({ enum: EntityType, enumName: 'EntityType', example: EntityType.HOME })
  @IsEnum(EntityType)
  entityType!: EntityType;

  @ApiPropertyOptional({ example: 42, description: 'Entity id used together with entityType.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;
}

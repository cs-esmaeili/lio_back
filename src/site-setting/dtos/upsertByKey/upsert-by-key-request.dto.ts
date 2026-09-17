import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';
import type { Prisma } from 'src/generated/prisma/client';

export class UpsertByKeyRequestDto {
  @ApiProperty({ type: 'object', additionalProperties: true, example: { menu: [] } })
  @IsObject()
  data!: Prisma.InputJsonObject;

  @ApiPropertyOptional({ description: 'When true, the setting is only returned to authenticated callers', example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

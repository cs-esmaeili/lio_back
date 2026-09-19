import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpsertByKeyRequestDto {
  @ApiProperty({ type: 'object', additionalProperties: true, example: { menu: [] } })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'When true, the setting is only returned to authenticated callers', example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

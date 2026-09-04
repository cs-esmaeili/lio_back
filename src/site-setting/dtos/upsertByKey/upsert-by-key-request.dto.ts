import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import type { Prisma } from 'src/generated/prisma/client';

export class UpsertByKeyRequestDto {
  @ApiProperty({ type: 'object', additionalProperties: true, example: { menu: [] } })
  @IsObject()
  data!: Prisma.InputJsonObject;
}

import { ApiProperty } from '@nestjs/swagger';

export class UpsertByKeyResponseDto {
  @ApiProperty({ example: 'footer' })
  key!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, example: { menu: [] } })
  data!: unknown;
}

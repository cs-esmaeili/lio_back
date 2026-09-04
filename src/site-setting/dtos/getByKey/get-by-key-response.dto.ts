import { ApiProperty } from '@nestjs/swagger';

export class GetByKeyResponseDto {
  @ApiProperty({ example: 'header' })
  key!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, example: { menu: [] } })
  data!: unknown;
}

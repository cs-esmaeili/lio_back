import { ApiProperty } from '@nestjs/swagger';

export class ListSettingsResponseDto {
  @ApiProperty({ example: 'logo' })
  key!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, example: { small: '/uploads/statics/logo-small.png' } })
  data!: unknown;

  @ApiProperty({ description: 'Whether the setting is only returned to authenticated callers', example: false })
  isPrivate!: boolean;
}

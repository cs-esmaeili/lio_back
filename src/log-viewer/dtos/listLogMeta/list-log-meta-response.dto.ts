import { ApiProperty } from '@nestjs/swagger';
import { COMBINED_SCOPE } from 'src/logger/logger.constants';

export class ListLogMetaResponseDto {
  @ApiProperty({
    description: 'Available log dates, newest first',
    type: [String],
    example: ['2026-09-25', '2026-09-24'],
  })
  dates!: string[];

  @ApiProperty({
    description: 'Selectable log sources: the combined file plus every service scope',
    type: [String],
    example: [COMBINED_SCOPE, 'app', 'sms'],
  })
  scopes!: string[];
}

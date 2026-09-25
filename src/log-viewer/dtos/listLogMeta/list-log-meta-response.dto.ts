import { ApiProperty } from '@nestjs/swagger';
import { LOG_CHANNELS } from 'src/logger/logger.constants';

export class ListLogMetaResponseDto {
  @ApiProperty({
    description: 'Available log dates, newest first',
    type: [String],
    example: ['2026-09-25', '2026-09-24'],
  })
  dates!: string[];

  @ApiProperty({
    description: 'Channels that can be filtered on',
    type: [String],
    example: [...LOG_CHANNELS],
  })
  channels!: string[];
}

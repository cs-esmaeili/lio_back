import { ApiProperty } from '@nestjs/swagger';
import { LOG_CHANNELS } from '../../logger.constants';

export class WriteTestResponseDto {
  @ApiProperty({ description: 'Channel the entry was written to', enum: LOG_CHANNELS })
  channel!: string;

  @ApiProperty({
    description: 'Absolute path of the channel log file',
    example: '/app/logs/info/2026-09-25.log',
  })
  file!: string;

  @ApiProperty({ description: 'ISO timestamp of the write', example: '2026-09-25T10:00:00.000Z' })
  writtenAt!: string;
}

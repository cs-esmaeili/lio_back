import { ApiProperty } from '@nestjs/swagger';
import { LOG_LEVELS } from '../../logger.constants';

export class WriteTestResponseDto {
  @ApiProperty({ description: 'Scope the entry was written to', example: 'sms' })
  scope!: string;

  @ApiProperty({ description: 'Level of the entry', enum: LOG_LEVELS, example: 'error' })
  level!: string;

  @ApiProperty({
    description: 'Absolute path of the scope log file',
    example: '/app/logs/sms/2026-09-25.log',
  })
  file!: string;

  @ApiProperty({ description: 'ISO timestamp of the write', example: '2026-09-25T10:00:00.000Z' })
  writtenAt!: string;
}

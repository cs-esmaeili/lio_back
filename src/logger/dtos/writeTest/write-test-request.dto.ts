import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { LOG_CHANNELS, type LogChannel } from '../../logger.constants';

export class WriteTestRequestDto {
  @ApiPropertyOptional({
    description: 'Channel (file) to write the entry to',
    enum: LOG_CHANNELS,
    default: 'info',
  })
  @IsOptional()
  @IsIn([...LOG_CHANNELS])
  channel: LogChannel = 'info';

  @ApiProperty({ description: 'Message to log', example: 'hello from the logger' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Extra structured fields', type: Object })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

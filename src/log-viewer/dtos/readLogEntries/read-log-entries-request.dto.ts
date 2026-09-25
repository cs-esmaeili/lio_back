import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { LOG_CHANNELS } from 'src/logger/logger.constants';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ReadLogEntriesRequestDto {
  @ApiProperty({ description: 'Log date in `yyyy-MM-dd` format', example: '2026-09-25' })
  @Matches(DATE_RE, { message: 'date must be in yyyy-MM-dd format' })
  date!: string;

  @ApiPropertyOptional({ description: 'Only entries from this channel', enum: LOG_CHANNELS })
  @IsOptional()
  @IsIn([...LOG_CHANNELS])
  channel?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive text search across the raw entry', example: 'timeout' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Entries per page', example: 50, default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

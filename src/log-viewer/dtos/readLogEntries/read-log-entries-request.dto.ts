import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { COMBINED_SCOPE, LOG_LEVELS, SCOPE_RE } from 'src/logger/logger.constants';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ReadLogEntriesRequestDto {
  @ApiProperty({ description: 'Log date in `yyyy-MM-dd` format', example: '2026-09-25' })
  @Matches(DATE_RE, { message: 'date must be in yyyy-MM-dd format' })
  date!: string;

  @ApiPropertyOptional({
    description: 'File to read: `combined` or a service scope',
    example: COMBINED_SCOPE,
    default: COMBINED_SCOPE,
  })
  @IsOptional()
  @IsString()
  @Matches(SCOPE_RE, { message: 'source must be lowercase letters, digits or dashes' })
  source?: string;

  @ApiPropertyOptional({ description: 'Only entries of this level', enum: LOG_LEVELS, example: 'error' })
  @IsOptional()
  @IsIn([...LOG_LEVELS])
  level?: string;

  @ApiPropertyOptional({ description: 'Only entries from this scope (useful for the combined file)', example: 'sms' })
  @IsOptional()
  @IsString()
  @Matches(SCOPE_RE, { message: 'scope must be lowercase letters, digits or dashes' })
  scope?: string;

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

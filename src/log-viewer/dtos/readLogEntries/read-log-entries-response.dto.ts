import { ApiProperty } from '@nestjs/swagger';

export class LogEntryDto {
  @ApiProperty({ description: 'ISO timestamp of the entry', nullable: true, example: '2026-09-25T16:42:31.909Z' })
  time!: string | null;

  @ApiProperty({ description: 'Log level: label string on current entries, numeric on older ones', nullable: true, examples: ['error', 50] })
  level!: number | string | null;

  @ApiProperty({ description: 'Level name', nullable: true, example: 'error' })
  levelName!: string | null;

  @ApiProperty({ description: 'Channel the entry was written to', nullable: true, example: 'error' })
  channel!: string | null;

  @ApiProperty({ description: 'Log message (usually a string)', nullable: true })
  message!: unknown;

  @ApiProperty({ description: 'Remaining structured fields of the entry', type: Object })
  meta!: Record<string, unknown>;
}

export class ReadLogEntriesResponseDto {
  @ApiProperty({ example: '2026-09-25' })
  date!: string;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 50 })
  limit!: number;

  @ApiProperty({ example: 123 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  @ApiProperty({ type: LogEntryDto, isArray: true })
  entries!: LogEntryDto[];
}

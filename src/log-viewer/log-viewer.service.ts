import { Injectable, NotFoundException } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PaginationService } from 'src/common/services/pagination.service';
import { COMBINED_CHANNEL, DEFAULT_LOG_DIR, LOG_CHANNELS } from 'src/logger/logger.constants';
import type { ListLogMetaResponseDto } from './dtos/listLogMeta/list-log-meta-response.dto';
import type { ReadLogEntriesRequestDto } from './dtos/readLogEntries/read-log-entries-request.dto';
import type { LogEntryDto, ReadLogEntriesResponseDto } from './dtos/readLogEntries/read-log-entries-response.dto';

const DATE_FILE_RE = /^(\d{4}-\d{2}-\d{2})\.log$/;

/**
 * Reads the JSON-line log files written by `AppLogger`.
 *
 * The viewer is backed by the `combined` channel, which already contains every
 * entry regardless of its channel, so one file per date is enough.
 */
@Injectable()
export class LogViewerService {
  private readonly combinedDir = join(DEFAULT_LOG_DIR, COMBINED_CHANNEL);

  constructor(private readonly pagination: PaginationService) {}

  /** Available dates (newest first) and filterable channels. */
  async listMeta(): Promise<ListLogMetaResponseDto> {
    const files = await readdir(this.combinedDir).catch(() => [] as string[]);
    const dates = files
      .map((name) => DATE_FILE_RE.exec(name)?.[1])
      .filter((date): date is string => Boolean(date))
      .sort((a, b) => b.localeCompare(a));

    return { dates, channels: [...LOG_CHANNELS] };
  }

  /** Read, filter and paginate the entries of one date, newest first. */
  async readEntries(query: ReadLogEntriesRequestDto): Promise<ReadLogEntriesResponseDto> {
    const file = join(this.combinedDir, `${query.date}.log`);
    const content = await readFile(file, 'utf8').catch(() => {
      throw new NotFoundException(`No logs found for ${query.date}`);
    });

    const entries = content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => this.parseLine(line))
      .filter((entry): entry is LogEntryDto => entry !== null);

    const filtered = this.applyFilters(entries, query).reverse();
    const { page, limit, skip, take } = this.pagination.resolveOffset(query);

    return {
      date: query.date,
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      entries: filtered.slice(skip, skip + take),
    };
  }

  private applyFilters(entries: LogEntryDto[], query: ReadLogEntriesRequestDto): LogEntryDto[] {
    let result = entries;
    if (query.channel) {
      result = result.filter((entry) => entry.channel === query.channel);
    }
    if (query.search) {
      const needle = query.search.toLowerCase();
      result = result.filter((entry) => JSON.stringify(entry).toLowerCase().includes(needle));
    }
    return result;
  }

  private parseLine(line: string): LogEntryDto | null {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }

    const { time, level, channel, message, ...meta } = raw;
    const hasLevel = typeof level === 'number' || typeof level === 'string';
    return {
      time: typeof time === 'string' ? time : null,
      level: hasLevel ? level : null,
      levelName: typeof level === 'string' ? level : null,
      channel: typeof channel === 'string' ? channel : null,
      message: message ?? null,
      meta,
    };
  }
}
